require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const vision = require('@google-cloud/vision');
const fs = require('fs');
const path = require('path');
const base64Images = require('./src/base64images');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Initialize Google Vision client
let visionClient;

// Validate environment variables
function validateEnv() {
  const required = ['GOOGLE_APPLICATION_CREDENTIALS'];
  const missing = required.filter(
    (name) => !(name in process.env)
  );
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

// Initialize the Vision API client
async function initializeVisionClient() {
  try {
    validateEnv();
    visionClient = new vision.ImageAnnotatorClient();
    console.log('Google Vision API client initialized successfully');
    return visionClient;
  } catch (error) {
    console.error('Failed to initialize Vision client:', error);
    throw error;
  }
}

// Extract text from image
async function analyzeImage(imageData) {
  try {
    if (!visionClient) {
      await initializeVisionClient();
    }
    
    const [result] = await visionClient.documentTextDetection(imageData);
    return result.fullTextAnnotation?.text || null;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}

// Extract PAN card details from OCR text
function getPanDetails(ocrText) {
  if (!ocrText) return null;
  
  const panRegex = /([A-Z]{5}[0-9]{4}[A-Z])/;
  const nameRegex = /नाम\s*\/\s*Name\s*([\w\s]+)/;
  const fatherNameRegex = /पिता का नाम\s*\/\s*Father's Name\s*([\w\s]+)/;
  const dobRegex = /जन्म की तारीख\s*\/\s*Date of Birth\s*([\d\/]+)/;

  // Extracting Data using regex match
  const panNumber = ocrText.match(panRegex);
  const name = ocrText.match(nameRegex);
  const fatherName = ocrText.match(fatherNameRegex);
  const dob = ocrText.match(dobRegex);

  // Creating structured JSON object
  const panCardData = {
    "PAN Number": panNumber ? panNumber[1].trim() : null,
    "Name": name ? name[1].trim() : null,
    "Father's Name": fatherName ? fatherName[1].trim() : null,
    "Date of Birth": dob ? dob[1].trim() : null
  };

  return panCardData;
}

// Routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Google Vision API Server is running',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint with sample base64 image
app.get('/api/test-sample', async (req, res) => {
  try {
    console.log('Processing sample image...');
    
    const request = {
      image: {
        content: base64Images.onlymrz,
      },
    };

    const extractedText = await analyzeImage(request);
    
    const response = {
      success: true,
      extractedText: extractedText,
      panDetails: extractedText ? getPanDetails(extractedText) : null,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Error processing sample image:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Upload and analyze image endpoint
app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    console.log('Processing uploaded image...');
    
    const imageBuffer = req.file.buffer;
    const base64Image = imageBuffer.toString('base64');
    
    const request = {
      image: {
        content: base64Image,
      },
    };

    const extractedText = await analyzeImage(request);
    
    const response = {
      success: true,
      filename: req.file.originalname,
      extractedText: extractedText,
      panDetails: extractedText ? getPanDetails(extractedText) : null,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Error processing uploaded image:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Analyze image from base64 string
app.post('/api/analyze-base64', async (req, res) => {
  try {
    const { base64Image } = req.body;
    
    if (!base64Image) {
      return res.status(400).json({
        success: false,
        error: 'No base64 image data provided'
      });
    }

    console.log('Processing base64 image...');
    
    // Remove data URL prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
    
    const request = {
      image: {
        content: cleanBase64,
      },
    };

    const extractedText = await analyzeImage(request);
    
    const response = {
      success: true,
      extractedText: extractedText,
      panDetails: extractedText ? getPanDetails(extractedText) : null,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Error processing base64 image:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint with local image file
app.get('/api/test-local-image', async (req, res) => {
  try {
    const imagePath = path.join(__dirname, 'IMG_2572.JPG');
    
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        error: 'Local test image not found'
      });
    }

    console.log('Processing local image:', imagePath);
    
    const extractedText = await analyzeImage(imagePath);
    
    const response = {
      success: true,
      imagePath: imagePath,
      extractedText: extractedText,
      panDetails: extractedText ? getPanDetails(extractedText) : null,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Error processing local image:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  const documentation = {
    title: 'Google Vision API Server',
    version: '1.0.0',
    endpoints: [
      {
        method: 'GET',
        path: '/health',
        description: 'Health check endpoint'
      },
      {
        method: 'GET',
        path: '/api/test-sample',
        description: 'Test with sample base64 image'
      },
      {
        method: 'POST',
        path: '/api/analyze-image',
        description: 'Upload and analyze image file',
        parameters: {
          image: 'File upload (multipart/form-data)'
        }
      },
      {
        method: 'POST',
        path: '/api/analyze-base64',
        description: 'Analyze base64 encoded image',
        parameters: {
          base64Image: 'Base64 encoded image string'
        }
      },
      {
        method: 'GET',
        path: '/api/test-local-image',
        description: 'Test with local image file (IMG_2572.JPG)'
      }
    ]
  };
  
  res.json(documentation);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'GET /api/docs',
      'GET /api/test-sample',
      'POST /api/analyze-image',
      'POST /api/analyze-base64',
      'GET /api/test-local-image'
    ]
  });
});

// Start server
async function startServer() {
  try {
    // Initialize Vision client on startup
    await initializeVisionClient();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
      console.log(`🧪 Test Sample: http://localhost:${PORT}/api/test-sample`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
