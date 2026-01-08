const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../public/icons');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function convertIcons() {
  for (const size of sizes) {
    const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
    const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);

    if (fs.existsSync(svgPath)) {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(pngPath);
      console.log(`Converted icon-${size}x${size}.png`);
    }
  }

  // Create favicon.ico from 32x32 SVG
  const favicon32 = path.join(iconsDir, 'icon-96x96.svg');
  if (fs.existsSync(favicon32)) {
    await sharp(favicon32)
      .resize(32, 32)
      .png()
      .toFile(path.join(iconsDir, 'favicon.png'));
    console.log('Created favicon.png');
  }

  console.log('Done!');
}

convertIcons().catch(console.error);
