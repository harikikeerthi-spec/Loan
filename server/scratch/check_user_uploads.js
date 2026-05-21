const fs = require('fs');
const path = require('path');
const https = require('https');

require('dotenv').config();

const brainDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\9b334bf5-adab-4930-b67b-8d0e133acbe2';
const files = [
  'media__1779272516088.jpg',
  'media__1779272532830.png',
  'media__1779272679977.png'
];

async function callVision(imagePath, prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY is not set');
    return;
  }

  const ext = path.extname(imagePath).toLowerCase();
  const mimetype = ext === '.png' ? 'image/png' : 'image/jpeg';
  const base64Image = fs.readFileSync(imagePath).toString('base64');

  const requestBody = {
    model: 'google/gemini-2.5-flash',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimetype};base64,${base64Image}`
            }
          }
        ]
      }
    ]
  };

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'openrouter.ai',
      port: 443,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://vidhyaloan.com',
        'X-Title': 'VidhyaLoan',
        'Content-Length': Buffer.byteLength(JSON.stringify(requestBody))
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(requestBody));
    req.end();
  });
}

async function main() {
  console.log('Starting OCR extraction tests for media files...');
  
  for (const filename of files) {
    const filePath = path.join(brainDir, filename);
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      continue;
    }
    
    console.log(`\n============================================================`);
    console.log(`File: ${filename} (${(fs.statSync(filePath).size / 1024).toFixed(2)} KB)`);
    console.log(`============================================================`);
    
    // First, let's just ask the AI what kind of document it is and to transcribe the key text
    const textPrompt = `
      Identify what type of document this is (e.g. Aadhaar Card front, Aadhaar Card back, PAN Card, Passport Bio page, Passport Address page, etc.).
      Then, transcribe the EXACT name, document number, date of birth, sex/gender, and any full address visible in the image.
      Please output your description and transcript clearly.
    `;
    
    try {
      const response = await callVision(filePath, textPrompt);
      if (response.status === 200) {
        console.log('AI Transcript Response:');
        console.log(response.body.choices?.[0]?.message?.content);
      } else {
        console.error(`Error ${response.status}:`, JSON.stringify(response.body));
      }
    } catch (err) {
      console.error('Failed to analyze image:', err);
    }
  }
}

main();
