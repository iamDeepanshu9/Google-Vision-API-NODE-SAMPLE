require('dotenv').config();
const vision = require('@google-cloud/vision');

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

// Initialize the client
async function initializeVisionClient() {
  try {
    validateEnv();
    const client = new vision.ImageAnnotatorClient();
    return client;
  } catch (error) {
    console.error('Failed to initialize Vision client:', error);
    throw error;
  }
}

// Example function to analyze an image
async function analyzeImage(imagePath) {
  try {
    const client = await initializeVisionClient();
    const resultNew = await client.documentTextDetection(imagePath);
    // console.log('PAn Details:', getPanDetails(resultNew[0].fullTextAnnotation.text));
    return resultNew[0].fullTextAnnotation.text;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}


function getPanDetails(ocrText){
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

// Output extracted details
return panCardData
}

// Example usage
async function main() {
  try {
    // Replace with actual image path when testing


  // '../new-project/Images/mrz.png'
    const labels = await analyzeImage('../Pan Card.jpg');
    console.log('Labels:', labels);
  } catch (error) {
    console.error('Application error:', error);
    process.exit(1);
  }
}

// Only run if this file is run directly
if (require.main === module) {
  main();
}

module.exports = {
  analyzeImage,
  validateEnv,
  initializeVisionClient,
};