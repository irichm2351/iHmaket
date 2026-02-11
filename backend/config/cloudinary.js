const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Validate Cloudinary configuration
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('⚠️  WARNING: Cloudinary credentials are not properly configured!');
  console.error('Missing:', {
    cloud_name: !process.env.CLOUDINARY_CLOUD_NAME,
    api_key: !process.env.CLOUDINARY_API_KEY,
    api_secret: !process.env.CLOUDINARY_API_SECRET
  });
} else {
  console.log('✅ Cloudinary configured with cloud:', process.env.CLOUDINARY_CLOUD_NAME);
}

module.exports = cloudinary;
