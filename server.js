
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { PythonShell } = require('python-shell');

// Configure Cloudinary with your account details
cloudinary.config(
  cloud_name= "dfad2oppz",
  api_key= "562573676845481",
  api_secret="0M_QJ_phoJotcnteN1lmBTd7NZA"
)



const app = express();
const port = 3000;

// Set up multer for handling multipart/form-data
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Serve HTML file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/size_color.html');
});

// Handle image upload
app.post('/upload', upload.single('image'), (req, res) => {
  console.log(req.file)
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  // Upload image to Cloudinary
  cloudinary.uploader.upload_stream({ resource_type: 'auto' },
    (error, result) => {
      if (error) {
        console.error(error);
        return res.status(500).send('Error uploading image to Cloudinary.');
      }
    
      // Call Python script to process the uploaded image
      const url = result.url
      console.log(url)
      PythonShell.run('readimage.py', {
        args: [url]
        
      }).then(result=>{
        console.log(result)
        res.send(result)
      })
}).end(req.file.buffer)


})

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
