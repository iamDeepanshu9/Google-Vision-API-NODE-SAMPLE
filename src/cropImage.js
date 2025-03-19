const sharp = require("sharp");
const base64Images = require("./base64images");

/**
 * Function to crop MRZ from a Base64 image
 * @param {string} base64Image - The Base64 string of the image
 * @returns {Promise<string>} - Cropped MRZ image in Base64 format
 */
async function cropMRZFromBase64(base64Image) {
  try {
    // Convert Base64 to Buffer
    const imageBuffer = Buffer.from(base64Image, "base64");

    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height } = metadata;

    // Define dynamic cropping dimensions
    const cropOptions = {
      left: Math.round(width * 0.05), // 5% padding from left
      top: Math.round(height * 0.75), // MRZ is in the bottom 25%
      width: Math.round(width * 0.9), // 90% of image width
      height: Math.round(height * 0.2), // 20% of image height (MRZ section)
    };

    console.log("Cropping with options:", cropOptions);

    // Crop image using sharp
    const croppedImageBuffer = await sharp(imageBuffer)
      .extract(cropOptions)
      .toBuffer();

    // Convert the cropped image back to Base64
    const croppedBase64 = croppedImageBuffer.toString("base64");

    return croppedBase64;
  } catch (error) {
    console.error("Error cropping MRZ:", error);
    throw error;
  }
}

// Example Usage
const base64Input = base64Images.image1; // Replace with actual Base64 string
cropMRZFromBase64(base64Input)
  .then((croppedBase64) => {
    console.log("Cropped MRZ Base64:", croppedBase64);
  })
  .catch((err) => console.error("Processing error:", err));


  module.exports = {
    cropMRZFromBase64,
  };
