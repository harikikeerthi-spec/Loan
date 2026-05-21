const fs = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');

const brainDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\9b334bf5-adab-4930-b67b-8d0e133acbe2';
const files = [
  'media__1779272516088.jpg',
  'media__1779272532830.png',
  'media__1779272679977.png'
];

async function runOcr(filePath) {
  console.log(`Running Tesseract OCR on: ${filePath}`);
  const worker = await createWorker('eng');
  const { data: { text } } = await worker.recognize(filePath);
  await worker.terminate();
  return text;
}

async function main() {
  for (const filename of files) {
    const filePath = path.join(brainDir, filename);
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      continue;
    }
    
    try {
      const text = await runOcr(filePath);
      const outputFilename = filename.replace(/\.(jpg|png)$/i, '.txt');
      const outputPath = path.join(__dirname, outputFilename);
      fs.writeFileSync(outputPath, text, 'utf-8');
      console.log(`Successfully wrote OCR text to: ${outputPath}`);
      console.log(`Snippet:\n${text.substring(0, 500)}\n------------------------------------------------\n`);
    } catch (err) {
      console.error(`Error running OCR on ${filename}:`, err);
    }
  }
}

main();
