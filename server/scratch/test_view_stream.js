const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
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

async function testViewStream() {
  const testKeys = [
    'vault/VL-STU-2026-00039/marksheet_12.jpg',
    'vault/VL-STU-2026-00039/marksheet_10.jpg',
    'vault/VL-STU-2026-00039/degree_certificate.jpg',
    'vault/VL-STU-2026-00039/national_id.png',
    'vault/VL-STU-2026-00039/pan.png'
  ];

  console.log('Testing S3 object retrieval for user VL-STU-2026-00039 documents...\n');
  for (const key of testKeys) {
    try {
      const getCmd = new GetObjectCommand({ Bucket: bucket, Key: key });
      const res = await client.send(getCmd);
      console.log(`✅ Key "${key}": Retrieved successfully! Size: ${res.ContentLength} bytes, ContentType: ${res.ContentType}`);
    } catch (err) {
      console.error(`❌ Key "${key}": Failed - ${err.message}`);
    }
  }
}

testViewStream();
