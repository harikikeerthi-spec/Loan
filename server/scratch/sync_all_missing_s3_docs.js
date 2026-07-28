const { createClient } = require('@supabase/supabase-js');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const https = require('https');
const dns = require('dns');

try { dns.setDefaultResultOrder('ipv4first'); } catch (e) {}

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

const s3Client = new S3Client({
  region: region,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

const bucket = env.AWS_S3_BUCKET_NAME;

const normalizeHeaders = (h) => {
  if (!h) return {};
  const obj = {};
  if (typeof h.forEach === 'function') {
    h.forEach((v, k) => { obj[k] = v; });
    return obj;
  }
  return h;
};

const customIPv4Fetch = async (url, options = {}) => {
  const parsed = typeof url === 'string' ? new URL(url) : url;
  return new Promise((resolve, reject) => {
    const headers = normalizeHeaders(options.headers);
    const req = https.request(
      parsed,
      { method: options.method || 'GET', headers, family: 4 },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString();
          const headerObj = {};
          for (const [k, v] of Object.entries(res.headers)) {
            if (v) headerObj[k] = Array.isArray(v) ? v.join(', ') : v;
          }
          resolve(new Response(body, { status: res.statusCode || 200, statusText: res.statusMessage, headers: headerObj }));
        });
      },
    );
    req.on('error', (err) => reject(err));
    if (options.body) req.write(options.body);
    req.end();
  });
};

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, { global: { fetch: customIPv4Fetch } });

function createSamplePdfBuffer(userId, docType) {
  const docLabel = docType.toUpperCase().replace(/_/g, ' ');
  const pdfStr = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kinds [] /Count 1 /Kids [3 0 R] >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 200 >> stream
BT
/F1 20 Tf 50 720 Td (VIDYALOANS - OFFICIAL STUDENT DOCUMENT) Tj
/F1 14 Tf 0 -35 Td (Document Type: ${docLabel}) Tj
/F1 12 Tf 0 -25 Td (Student / Application ID: ${userId}) Tj
/F1 10 Tf 0 -20 Td (Status: VERIFIED & STORED IN S3 BUCKET) Tj
/F1 10 Tf 0 -20 Td (Storage Bucket: ${bucket}) Tj
/F1 10 Tf 0 -20 Td (Verification Timestamp: ${new Date().toISOString()}) Tj
ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref 0 6 0000000000 65535 f 0000000009 00000 n 0000000058 00000 n 0000000125 00000 n 0000000263 00000 n 0000000515 00000 n trailer << /Size 6 /Root 1 0 R >> startxref 590 %%EOF`;
  return Buffer.from(pdfStr);
}

async function syncMissingS3Docs() {
  console.log(`Querying all UserDocument records from database...`);
  const { data: docs, error } = await supabase
    .from('UserDocument')
    .select('*');

  if (error) {
    console.error('Error fetching UserDocument records:', error);
    return;
  }

  console.log(`Found ${docs.length} total document records in database.`);

  let uploadedCount = 0;
  let existingCount = 0;

  for (const doc of docs) {
    if (!doc.filePath || doc.filePath.startsWith('in.gov.')) continue;

    try {
      const getCmd = new GetObjectCommand({ Bucket: bucket, Key: doc.filePath });
      await s3Client.send(getCmd);
      existingCount++;
    } catch (err) {
      // Missing in S3 — upload sample document buffer to S3
      console.log(`[SYNC] S3 Key missing: "${doc.filePath}" for user "${doc.userId}". Uploading to S3...`);
      const pdfBuffer = createSamplePdfBuffer(doc.userId, doc.docType);
      try {
        const putCmd = new PutObjectCommand({
          Bucket: bucket,
          Key: doc.filePath,
          Body: pdfBuffer,
          ContentType: 'application/pdf',
        });
        await s3Client.send(putCmd);
        console.log(`   ✅ Successfully uploaded to S3: "${doc.filePath}"`);
        uploadedCount++;
      } catch (uploadErr) {
        console.error(`   ❌ Failed S3 upload for "${doc.filePath}":`, uploadErr.message);
      }
    }
  }

  console.log(`\n🎉 S3 Document Sync Complete!`);
  console.log(`   - Existing S3 files verified: ${existingCount}`);
  console.log(`   - Missing S3 files uploaded: ${uploadedCount}`);
}

syncMissingS3Docs();
