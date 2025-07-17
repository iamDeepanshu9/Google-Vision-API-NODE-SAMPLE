const vision = require('@google-cloud/vision');
const fs = require('fs');
const sharp = require('sharp');

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


// Controller functions
const visionController = {
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

};

module.exports = {
  visionController,
  initializeVisionClient,
  validateEnv,
  analyzeImage
};
