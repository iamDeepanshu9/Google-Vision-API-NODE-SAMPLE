const vision = require('@google-cloud/vision');
const fs = require('fs');
const path = require('path');
const base64Images = require('../base64images');
const sharp = require('sharp')

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

// Controller functions
const visionController = {
  // Health check controller
  healthCheck: (req, res) => {
    res.json({ 
      status: 'OK', 
      message: 'Google Vision API Server is running',
      timestamp: new Date().toISOString()
    });
  },

  // Test sample image controller
  testSample: async (req, res) => {
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
  },

  // Analyze uploaded image controller
  analyzeUploadedImage: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No image file provided'
        });
      }

      console.log('Processing uploaded image...');
      
      // Get additional form data
      const idType = req.body.idType || 'UNKNOWN';
      const stepNumber = parseInt(req.body.stepNumber) || 1;
      
      console.log(`Processing ${idType} image at step ${stepNumber}`);
      
      const imageBuffer = req.file.buffer;
      console.log('Original image buffer size:', imageBuffer.length);
      
      const newImage = await sharp(imageBuffer).grayscale()
        // Enhance contrast for better character recognition
        .normalize()
        // Optional: Increase sharpness to make characters more defined
        .sharpen({ sigma: 1.5 })
        .toBuffer();
        
      const newBase64 = newImage.toString("base64");
      console.log('Grayscale image buffer size:', newImage.length);
      console.log('Grayscale base64 length:', newBase64.length);
      
      const base64Image = imageBuffer.toString('base64');
      
      const request = {
        image: {
          content: newBase64,
        },
      };

      const extractedText = await analyzeImage(request);
      
      const response = {
        success: true,
        filename: req.file.originalname,
        idType: idType,
        stepNumber: stepNumber,
        extractedText: extractedText,
        panDetails: extractedText ? getPanDetails(extractedText) : null,
        grayscaleBase64: newBase64,
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
  },

  // Analyze base64 image controller
  analyzeBase64Image: async (req, res) => {
    try {
      const { base64Image, idType, stepNumber } = req.body;
      
      if (!base64Image) {
        return res.status(400).json({
          success: false,
          error: 'No base64 image data provided'
        });
      }

      const processIdType = idType || 'UNKNOWN';
      const processStepNumber = parseInt(stepNumber) || 1;
      
      console.log(`Processing ${processIdType} base64 image at step ${processStepNumber}...`);
      
      // Remove data URL prefix if present
      const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Process image through Sharp for grayscale conversion
      const imageBuffer = Buffer.from(cleanBase64, 'base64');
      console.log('Original base64 buffer size:', imageBuffer.length);
      
      const newImage = await sharp(imageBuffer).grayscale()
        .normalize()
        .sharpen({ sigma: 1.5 })
        .toBuffer();
        
      const newBase64 = newImage.toString("base64");
      console.log('Grayscale image buffer size:', newImage.length);
      console.log('Grayscale base64 length:', newBase64.length);
      
      const request = {
        image: {
          content: newBase64,
        },
      };

      const extractedText = await analyzeImage(request);
      
      const response = {
        success: true,
        idType: processIdType,
        stepNumber: processStepNumber,
        extractedText: extractedText,
        panDetails: extractedText ? getPanDetails(extractedText) : null,
        grayscaleBase64: newBase64,
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
  },

  // Test local image controller
  testLocalImage: async (req, res) => {
    try {
      const imagePath = path.join(__dirname, '../../IMG_2572.JPG');
      
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
  },

  // API documentation controller
  apiDocs: (req, res) => {
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
  }
};

module.exports = {
  visionController,
  initializeVisionClient,
  validateEnv,
  analyzeImage,
  getPanDetails
};
