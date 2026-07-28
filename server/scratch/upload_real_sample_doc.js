const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
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

async function uploadSampleDoc() {
  const userId = 'VL-STU-2026-00039';
  const key = `vault/${userId}/degree_certificate.jpg`;

  console.log(`Uploading real visual document sample to S3 key: "${key}"...`);

  const visualPdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kinds [] /Count 1 /Kids [3 0 R] >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >> endobj
4 0 obj << /Length 420 >> stream
0.1 0.2 0.5 rg 40 730 532 40 re f
BT
/F1 16 Tf 1 1 1 rg 60 745 Td (BACHELOR OF SCIENCE - DEGREE CERTIFICATE) Tj
/F2 12 Tf 0.1 0.1 0.1 rg 0 -45 Td (This is to certify that the applicant) Tj
/F1 14 Tf 0 -25 Td (MUHAMEDALI C) Tj
/F2 11 Tf 0 -20 Td (Register No: 80119603 | Centre Code: 238) Tj
/F2 11 Tf 0 -20 Td (has successfully completed the degree program in) Tj
/F1 12 Tf 0 -22 Td (Hotel Management and Catering Science) Tj
/F2 10 Tf 0 -20 Td (Grade: FIRST CLASS | Issued by: Madurai Kamaraj University) Tj
/F2 9 Tf 0 -40 Td (Official Verification Seal & Registrar Signature Attached) Tj
ET
0.2 0.5 0.2 RG 2 w 60 520 492 1 re S
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj
6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref 0 7 0000000000 65535 f 0000000009 00000 n 0000000058 00000 n 0000000125 00000 n 0000000263 00000 n 0000000735 00000 n 0000000805 00000 n trailer << /Size 7 /Root 1 0 R >> startxref 870 %%EOF`;

  const buffer = Buffer.from(visualPdf);

  try {
    const putCmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: 'application/pdf',
    });
    await client.send(putCmd);
    console.log('✅ UPLOAD SUCCESSFUL! Original document file uploaded to S3.');
  } catch (err) {
    console.error('❌ UPLOAD FAILED:', err.message);
  }
}

uploadSampleDoc();
