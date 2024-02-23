'''import sys
import cv2 as cv
import numpy as np
from cloudinary.uploader import upload

# Function to resize image
def resize_image(image_url):
    try:
        # Download image from Cloudinary
        img = cv.imread(image_url)
        if img is None:
            print("Error: Unable to download image from Cloudinary.")
            return None

        scale = 0.75
        width = int(img.shape[1] * scale)
        height = int(img.shape[0] * scale)
        dsize = (width, height)
        resized_img = cv.resize(img, dsize, interpolation=cv.INTER_CUBIC)

        # Upload resized image back to Cloudinary
        _, encoded_img = cv.imencode('.jpg', resized_img)
        result = upload(encoded_img.tobytes())
        if 'secure_url' in result:
            return result['secure_url']
        else:
            print("Error: Failed to upload resized image to Cloudinary.")
            return None
    except Exception as e:
        print("Error:", e)
        return None

# Main function
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python resize_image.py <image_url>")
        sys.exit(1)
    
    image_url = sys.argv[1]
    processed_image_url = resize_image(image_url)
    if processed_image_url:
        print("Processed image URL:", processed_image_url)
    else:
        print("Failed to process image.").'''


import sys
import cv2 as cv
import numpy as np
import requests
import cloudinary
from cloudinary.uploader import upload
from cloudinary.uploader import upload

# Function to resize and convert image to black and white
cloudinary.config(
  cloud_name= "dfad2oppz",
  api_key= "562573676845481",
  api_secret="0M_QJ_phoJotcnteN1lmBTd7NZA"
)
def resize_and_convert_to_bw(image_url):
    try:
        # Download image from Cloudinary
        resp = requests.get(image_url)
        if resp.status_code != 200:
            print("Error: Unable to download image from Cloudinary.")
            return None

        # Convert downloaded content to numpy array
        img_array = np.frombuffer(resp.content, np.uint8)

        # Read the image
        img = cv.imdecode(img_array, cv.IMREAD_COLOR)

        # Resize image
        scale = 0.75
        width = int(img.shape[1] * scale)
        height = int(img.shape[0] * scale)
        dsize = (width, height)
        resized_img = cv.resize(img, dsize, interpolation=cv.INTER_CUBIC)

        # Convert image to black and white
        gray_img = cv.cvtColor(resized_img, cv.COLOR_BGR2GRAY)
        _, encoded_img = cv.imencode('.jpg', gray_img)
        response = upload(encoded_img.tobytes(), folder="processed_images")
        if 'secure_url' in response:
            return response['secure_url']
        else:
            print("Error: Failed to upload processed image to Cloudinary.")
            return None

        # Display the resized and converted image
        cv.imshow('Resized and Converted to BW', gray_img)
        cv.waitKey(0)
        cv.destroyAllWindows()

        # # Upload processed image back to Cloudinary
        # _, encoded_img = cv.imencode('.jpg', gray_img)
        # result = upload(encoded_img.tobytes())
        # if 'secure_url' in result:
        #     return result['secure_url']
        # else:
        #     print("Error: Failed to upload processed image to Cloudinary.")
        #     return None
    except Exception as e:
        print("Error:", e)
        return None
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python resize_and_convert_to_bw.py <image_url>")
        sys.exit(1)
    
    image_url = sys.argv[1]
    processed_image_url = resize_and_convert_to_bw(image_url)
    if processed_image_url:
        print("Processed image URL:", processed_image_url)
    else:
        print("Failed to process image.")

