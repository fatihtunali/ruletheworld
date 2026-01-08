const fs = require('fs');
const path = require('path');

// SVG template for the RuleTheWorld icon
const generateSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4f46e5;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <g transform="translate(${size * 0.15}, ${size * 0.15})">
    <circle cx="${size * 0.35}" cy="${size * 0.35}" r="${size * 0.25}" fill="none" stroke="white" stroke-width="${size * 0.04}"/>
    <path d="M ${size * 0.2} ${size * 0.35} L ${size * 0.35} ${size * 0.5} L ${size * 0.55} ${size * 0.2}" fill="none" stroke="white" stroke-width="${size * 0.04}" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${size * 0.55}" cy="${size * 0.55}" r="${size * 0.06}" fill="white"/>
    <circle cx="${size * 0.15}" cy="${size * 0.55}" r="${size * 0.06}" fill="white"/>
    <circle cx="${size * 0.35}" cy="${size * 0.65}" r="${size * 0.06}" fill="white"/>
  </g>
</svg>
`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG files (you can convert these to PNG using online tools or sharp)
sizes.forEach(size => {
  const svg = generateSvg(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svg.trim());
  console.log(`Generated ${filename}`);
});

// Also create the main favicon
const faviconSvg = generateSvg(32);
fs.writeFileSync(path.join(iconsDir, 'favicon.svg'), faviconSvg.trim());
console.log('Generated favicon.svg');

console.log('\\nNote: Convert SVG files to PNG using:');
console.log('- https://convertio.co/svg-png/');
console.log('- Or install sharp: npm install sharp');
