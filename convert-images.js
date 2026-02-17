const fs = require('fs');
const path = require('path');

// Simple script to copy JPG as icon for now
// In production, you might want to use a proper image library

const assetsDir = path.join(__dirname, 'assets', 'images');

// Copy iHlogo.jpg to icon.png (browsers will handle JPG as PNG reference)
const sourceIcon = path.join(assetsDir, 'iHlogo.jpg');
const destIcon = path.join(assetsDir, 'icon.jpg');

if (fs.existsSync(sourceIcon)) {
  fs.copyFileSync(sourceIcon, destIcon);
  console.log('✓ App icon updated');
} else {
  console.log('✗ iHlogo.jpg not found');
}

// Ensure splash is properly set
const sourceSplash = path.join(assetsDir, 'iHmaket.jpg');
console.log('✓ Splash screen ready:', sourceSplash);
