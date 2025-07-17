/**
 * Google Vision API Core Utilities
 * Essential utility functions for Google Vision API integration
 */

require('dotenv').config();
const vision = require('@google-cloud/vision');

/**
 * Validates required environment variables
 * @throws {Error} If required environment variables are missing
 */
function validateEnv() {
  const required = ['GOOGLE_APPLICATION_CREDENTIALS'];
  const missing = required.filter(name => !(name in process.env));
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

/**
 * Initializes Google Vision API client
 * @returns {Promise<vision.ImageAnnotatorClient>} Initialized Vision client
 * @throws {Error} If client initialization fails
 */
async function initializeVisionClient() {
  try {
    validateEnv();
    const client = new vision.ImageAnnotatorClient();
    console.log('Google Vision API client initialized successfully');
    return client;
  } catch (error) {
    console.error('Failed to initialize Vision client:', error);
    throw error;
  }
}

/**
 * Analyzes image using Google Vision API for text extraction
 * @param {Object|string} imageData - Image data object or file path
 * @returns {Promise<string|null>} Extracted text from image
 * @throws {Error} If image analysis fails
 */
async function analyzeImage(imageData) {
  try {
    const client = await initializeVisionClient();
    const [result] = await client.documentTextDetection(imageData);
    return result.fullTextAnnotation?.text || null;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}

/**
 * Extracts PAN card details from OCR text using regex patterns
 * @param {string} ocrText - OCR extracted text
 * @returns {Object|null} Structured PAN card data
 */
function getPanDetails(ocrText) {
  if (!ocrText) return null;
  
  const panRegex = /([A-Z]{5}[0-9]{4}[A-Z])/;
  const nameRegex = /नाम\s*\/\s*Name\s*([\w\s]+)/;
  const fatherNameRegex = /पिता का नाम\s*\/\s*Father's Name\s*([\w\s]+)/;
  const dobRegex = /जन्म की तारीख\s*\/\s*Date of Birth\s*([\d\/]+)/;

  // Extract data using regex
  const panNumber = ocrText.match(panRegex);
  const name = ocrText.match(nameRegex);
  const fatherName = ocrText.match(fatherNameRegex);
  const dob = ocrText.match(dobRegex);

  // Return structured data
  return {
    "PAN Number": panNumber ? panNumber[1].trim() : null,
    "Name": name ? name[1].trim() : null,
    "Father's Name": fatherName ? fatherName[1].trim() : null,
    "Date of Birth": dob ? dob[1].trim() : null
  };
}

/**
 * Extracts generic ID card details from OCR text
 * Can be extended to support other ID types
 * @param {string} ocrText - OCR extracted text
 * @param {string} idType - Type of ID card ('PAN', 'AADHAAR', etc.)
 * @returns {Object|null} Structured ID card data
 */
function getIdDetails(ocrText, idType = 'PAN') {
  if (!ocrText) return null;
  
  switch (idType.toUpperCase()) {
    case 'PAN':
      return getPanDetails(ocrText);
    case 'AADHAAR':
      // Add Aadhaar parsing logic here
      return null;
    case 'PASSPORT':
      // Add passport parsing logic here
      return null;
    default:
      return null;
  }
}

// Export utility functions
module.exports = {
  validateEnv,
  initializeVisionClient,
  analyzeImage,
  getPanDetails,
  getIdDetails
};
