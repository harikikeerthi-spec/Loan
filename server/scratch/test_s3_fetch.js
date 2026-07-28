const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
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

async function testS3() {
  console.log(`Testing S3 connection to Bucket: "${bucket}", Region: "${region}"...`);
  try {
    const listCmd = new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 20 });
    const listRes = await client.send(listCmd);
    console.log('S3 Bucket Contents (first 20 keys):');
    if (listRes.Contents) {
      listRes.Contents.forEach(c => console.log(` - ${c.Key} (${c.Size} bytes)`));
    } else {
      console.log('Bucket is empty or no contents returned.');
    }

    const testKey = 'vault/VL-STU-2026-00039/marksheet_12.jpg';
    console.log(`\nAttempting GetObjectCommand for key: "${testKey}"...`);
    try {
      const getCmd = new GetObjectCommand({ Bucket: bucket, Key: testKey });
      const getRes = await client.send(getCmd);
      console.log(`SUCCESS! Retreived object: ContentType=${getRes.ContentType}, ContentLength=${getRes.ContentLength}`);
    } catch (err) {
      console.error(`FAILED GetObject for "${testKey}":`, err.message);
    }
  } catch (err) {
    console.error('S3 List Error:', err);
  }
}

testS3();
