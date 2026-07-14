const { createClient } = require('@supabase/supabase-js');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const rawRegion = (process.env.AWS_REGION || 'us-east-1').trim();
const regionMatch = rawRegion.match(/[a-z]{2}-[a-z]+-\d/i);
const region = regionMatch ? regionMatch[0].toLowerCase() : 'us-east-1';
const bucket = (process.env.AWS_S3_BUCKET_NAME || '').trim();
const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || '').trim();
const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || '').trim();

const s3 = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey }
});

async function runOcr(filePath) {
  console.log('Running Tesseract OCR on: ' + filePath);
  const worker = await createWorker('eng');
  const { data: { text } } = await worker.recognize(filePath);
  await worker.terminate();
  return text;
}

async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

async function main() {
  const userId = 'VL-STU-2026-00004';
  const docTypes = ['father_pan', 'mother_aadhar', 'mother_pan', 'coapplicant_pan'];
  
  const tempDir = path.join(__dirname, 'temp_ocr');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  for (const docType of docTypes) {
    const { data: doc } = await supabase
      .from('UserDocument')
      .select('filePath')
      .eq('userId', userId)
      .eq('docType', docType)
      .maybeSingle();

    if (!doc || !doc.filePath) {
      console.log('Document not found for ' + docType);
      continue;
    }

    console.log('Found filePath for ' + docType + ': ' + doc.filePath);
    
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: doc.filePath
      });
      const s3Response = await s3.send(command);
      const buffer = await streamToBuffer(s3Response.Body);
      
      const localPath = path.join(tempDir, docType + path.extname(doc.filePath));
      fs.writeFileSync(localPath, buffer);
      console.log('Downloaded to ' + localPath);

      const text = await runOcr(localPath);
      console.log('=== OCR TEXT FOR ' + docType + ' ===');
      console.log(text);
      console.log('====================================\n');
    } catch (err) {
      console.error('Error processing ' + docType + ':', err.message);
    }
  }
}

main().catch(console.error);
