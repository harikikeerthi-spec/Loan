const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');

const env = {};
fs.readFileSync('./.env', 'utf-8').split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && key.trim()) {
    let val = values.join('=').trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    env[key.trim()] = val;
  }
});

const rawRegion = (env.AWS_REGION || 'us-east-1').trim();
const regionMatch = rawRegion.match(/[a-z]{2}-[a-z]+-\d/i);
const region = regionMatch ? regionMatch[0].toLowerCase() : 'us-east-1';

const client = new S3Client({
  region: region,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

const bucket = env.AWS_S3_BUCKET_NAME;

async function testUpload() {
  console.log(`Uploading test file to Bucket: "${bucket}", Key: "vault/VL-STU-2026-00039/marksheet_12.jpg"...`);
  const samplePdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kinds [] /Count 1 /Kids [3 0 R] >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 55 >> stream
BT /F1 18 Tf 100 700 Td (Sample Marksheet 12 Document) ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref 0 6 0000000000 65535 f 0000000009 00000 n 0000000058 00000 n 0000000125 00000 n 0000000263 00000 n 0000000368 00000 n trailer << /Size 6 /Root 1 0 R >> startxref 445 %%EOF`;

  const buffer = Buffer.from(samplePdf);
  try {
    const putCmd = new PutObjectCommand({
      Bucket: bucket,
      Key: 'vault/VL-STU-2026-00039/marksheet_12.jpg',
      Body: buffer,
      ContentType: 'application/pdf',
    });
    await client.send(putCmd);
    console.log('✅ UPLOAD SUCCESSFUL!');

    console.log('\nTesting GetObjectCommand now...');
    const getCmd = new GetObjectCommand({
      Bucket: bucket,
      Key: 'vault/VL-STU-2026-00039/marksheet_12.jpg',
    });
    const res = await client.send(getCmd);
    console.log(`✅ GET SUCCESSFUL! ContentLength: ${res.ContentLength}`);
  } catch (err) {
    console.error('❌ UPLOAD FAILED:', err);
  }
}

testUpload();
