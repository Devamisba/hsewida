const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

const inputPath = path.resolve(__dirname, '../../.gemini/antigravity/brain/aefafb1e-3103-41c6-97e3-4f8bae09259b/.user_uploaded/media_1794214164099_14feb3a3.jpg');
// Fallback if not found: try frontend/public/logo-widatra.jpg
const actualInput = fs.existsSync(inputPath) ? inputPath : path.resolve(__dirname, '../public/logo-widatra.jpg');

console.log('Reading from:', actualInput);
const jpegData = fs.readFileSync(actualInput);
const rawData = jpeg.decode(jpegData, { useTArray: true }); // { width, height, data }
const { width, height, data } = rawData;

console.log(`Decoded JPEG: ${width}x${height}`);

// Sample background color from corners
const corners = [
  0,
  (width - 1) * 4,
  (height - 1) * width * 4,
  ((height - 1) * width + width - 1) * 4
];
let bgR = 0, bgG = 0, bgB = 0;
corners.forEach(idx => {
  bgR += data[idx];
  bgG += data[idx + 1];
  bgB += data[idx + 2];
});
bgR = Math.round(bgR / corners.length);
bgG = Math.round(bgG / corners.length);
bgB = Math.round(bgB / corners.length);
console.log(`Estimated background color: rgb(${bgR}, ${bgG}, ${bgB})`);

// Create RGBA buffer for PNG
const png = new PNG({ width, height });

// Bounding box of content
let minX = width, maxX = 0, minY = height, maxY = 0;

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    // Color distance from background
    const dist = Math.sqrt(
      Math.pow(r - bgR, 2) +
      Math.pow(g - bgG, 2) +
      Math.pow(b - bgB, 2)
    );

    // Also check if near-white/gray
    const isGrayish = Math.abs(r - g) < 18 && Math.abs(g - b) < 18 && Math.abs(r - b) < 18;
    const brightness = (r + g + b) / 3;

    let alpha = 255;
    if (dist < 18 || (isGrayish && brightness > 230)) {
      alpha = 0;
    } else if (dist < 38) {
      // Soft transition / antialiasing
      alpha = Math.round(((dist - 18) / 20) * 255);
    } else if (isGrayish && brightness > 215) {
      alpha = Math.round(((230 - brightness) / 15) * 255);
    }

    png.data[idx] = r;
    png.data[idx + 1] = g;
    png.data[idx + 2] = b;
    png.data[idx + 3] = alpha;

    if (alpha > 30) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

console.log(`Content bounding box: x=[${minX}..${maxX}], y=[${minY}..${maxY}]`);

// Now create a cropped version with slight padding (e.g. 8px)
const pad = 8;
const cropX = Math.max(0, minX - pad);
const cropY = Math.max(0, minY - pad);
const cropW = Math.min(width - cropX, (maxX - minX + 1) + pad * 2);
const cropH = Math.min(height - cropY, (maxY - minY + 1) + pad * 2);

console.log(`Cropped dimensions: ${cropW}x${cropH} at (${cropX}, ${cropY})`);

const croppedPng = new PNG({ width: cropW, height: cropH });
for (let cy = 0; cy < cropH; cy++) {
  for (let cx = 0; cx < cropW; cx++) {
    const srcX = cropX + cx;
    const srcY = cropY + cy;
    const srcIdx = (srcY * width + srcX) * 4;
    const dstIdx = (cy * cropW + cx) * 4;

    croppedPng.data[dstIdx] = png.data[srcIdx];
    croppedPng.data[dstIdx + 1] = png.data[srcIdx + 1];
    croppedPng.data[dstIdx + 2] = png.data[srcIdx + 2];
    croppedPng.data[dstIdx + 3] = png.data[srcIdx + 3];
  }
}

const uncroppedBuf = PNG.sync.write(png);
const croppedBuf = PNG.sync.write(croppedPng);

const outPublic = path.resolve(__dirname, '../public/logo-widatra.png');
fs.writeFileSync(outPublic, croppedBuf);
console.log('Wrote cropped transparent logo to:', outPublic, croppedBuf.length, 'bytes');

const outDist = path.resolve(__dirname, '../dist/logo-widatra.png');
if (fs.existsSync(path.dirname(outDist))) {
  fs.writeFileSync(outDist, croppedBuf);
  console.log('Wrote to dist as well');
}
