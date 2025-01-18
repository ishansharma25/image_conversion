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

// Gmail Transporter Configuration
let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: process.env.GMAIL_USER, // Load Gmail user from .env
      pass: process.env.GMAIL_PASSWORD // Load Gmail password from .env
  }
});
// Configure email transporter

const app = express();
const port = 3000;

// Add middleware to parse JSON bodies
app.use(express.json());

// Set up multer for handling multipart/form-data
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Serve HTML file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/size_color.html');
});

// Handle image upload
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    // Upload image to Cloudinary
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

    // Process image with Python script
    const pythonResult = await PythonShell.run('readimage.py', {
      args: [cloudinaryResult.url]
    });

    // Send email
    const mailOptions = {
      from: 'your-email@gmail.com',
      to: req.body.email,
      subject: 'Your Processed Image',
      html: `
        <h1>Your Processed Image</h1>
        <p>Here's your processed image:</p>
        <img src="${cloudinaryResult.url}" alt="Processed Image" style="max-width: 500px;">
        <p>Processing results: ${pythonResult.join(', ')}</p>
      `
    };

    await transporter.sendMail(mailOptions);

    // Send response back to client
    res.json({
      message: 'Image processed successfully',
      imageUrl: cloudinaryResult.url,
      processingResults: pythonResult,
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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});