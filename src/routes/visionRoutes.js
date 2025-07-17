const express = require('express');
const multer = require('multer');
const { visionController } = require('../controllers/visionController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload and analyze image endpoint
router.post('/api/analyze-image', upload.single('image'), visionController.analyzeUploadedImage);

// Analyze image from base64 string
router.post('/api/analyze-base64', visionController.analyzeBase64Image);


module.exports = router;
