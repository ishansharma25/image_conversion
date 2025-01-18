const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { PythonShell } = require('python-shell');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/size_color.html');
});

// Handle image upload and processing
app.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        // Upload to Cloudinary
        const cloudinaryResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { resource_type: 'auto' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(req.file.buffer);
        });

        console.log('Original image URL:', cloudinaryResult.secure_url);

        // Process image with Python script
        const pythonResult = await PythonShell.run('readimage.py', {
            args: [cloudinaryResult.secure_url]
        });

        // Clean up the processed image URL (remove any "Processed image URL:" prefix)
        const processedImageUrl = pythonResult[pythonResult.length - 1].replace('Processed image URL: ', '').trim();
        console.log('Processed image URL:', processedImageUrl);

        // Verify email recipient
        if (!req.body.email) {
            throw new Error('Email address is required');
        }

        // Send email with both original and processed images
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: req.body.email,
            subject: 'Your Processed Images',
            html: `
                <h1>Your Processed Images</h1>
                <div style="margin-bottom: 20px;">
                    <h2>Original Image:</h2>
                    <img src="${cloudinaryResult.secure_url}" alt="Original Image" style="max-width: 500px;">
                </div>
                <div style="margin-bottom: 20px;">
                    <h2>Processed Grayscale Image:</h2>
                    <img src="${processedImageUrl}" alt="Processed Image" style="max-width: 500px;">
                    <p>Direct download link for grayscale image: <a href="${processedImageUrl}">Click here</a></p>
                </div>
                <p>Note: The processed image has been converted to grayscale. If you're seeing it in color, please try downloading it using the link above.</p>
            `
        };

        // Send email with proper error handling
        await transporter.sendMail(mailOptions).catch(error => {
            console.error('Email sending error:', error);
            throw new Error('Failed to send email: ' + error.message);
        });

        // Send response to client
        res.json({
            message: 'Image processed successfully',
            originalImageUrl: cloudinaryResult.secure_url,
            processedImageUrl: processedImageUrl,
            emailSent: true
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: 'An error occurred while processing your request',
            details: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something broke!',
        details: err.message
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});