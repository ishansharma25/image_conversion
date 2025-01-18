import sys
import cv2 as cv
import numpy as np
import requests
import cloudinary
from cloudinary.uploader import upload
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

def process_image(image_url):
    """
    Download image from URL, resize it, convert to grayscale, and upload to Cloudinary
    """
    try:
        # Download image
        resp = requests.get(image_url)
        if resp.status_code != 200:
            print("Error: Unable to download image.")
            return None

        # Convert downloaded content to image
        img_array = np.frombuffer(resp.content, np.uint8)
        img = cv.imdecode(img_array, cv.IMREAD_COLOR)
        if img is None:
            print("Error: Unable to decode image.")
            return None

        # Resize image
        scale = 0.75
        width = int(img.shape[1] * scale)
        height = int(img.shape[0] * scale)
        resized_img = cv.resize(img, (width, height), interpolation=cv.INTER_CUBIC)

        # Convert to grayscale
        gray_img = cv.cvtColor(resized_img, cv.COLOR_BGR2GRAY)

        # Ensure the image is in grayscale format before encoding
        # Create a temporary file to save the grayscale image
        temp_filename = 'temp_gray.jpg'
        cv.imwrite(temp_filename, gray_img)

        # Upload the grayscale image to Cloudinary
        with open(temp_filename, 'rb') as f:
            response = upload(
                f,
                folder="processed_images",
                resource_type="image"
            )

        # Clean up temporary file
        os.remove(temp_filename)

        if 'secure_url' not in response:
            print("Error: Failed to upload to Cloudinary.")
            return None

        return response['secure_url']

    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return None

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python image_processor.py <image_url>")
        sys.exit(1)
    
    processed_url = process_image(sys.argv[1])
    if processed_url:
        print("Processed image URL:", processed_url)
    else:
        print("Failed to process image.")