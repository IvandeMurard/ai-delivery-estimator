const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgBuffer = fs.readFileSync(path.join(__dirname, '../public/logo.svg'));
sharp(svgBuffer)
  .png()
  .toFile(path.join(__dirname, '../public/logo.png'))
  .then(() => console.log('Logo converted to PNG'))
  .catch(err => console.error('Error converting logo:', err)); 