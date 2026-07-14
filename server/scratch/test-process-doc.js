const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { KycService } = require('../dist/ai/services/kyc.service');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

async function run() {
  console.log('Bootstrapping NestJS...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const kycService = app.get(KycService);
  
  const bucket = (process.env.AWS_S3_BUCKET_NAME || '').trim();
  const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || '').trim();

  const s3 = new S3Client({
    region: 'us-east-1',
    credentials: { accessKeyId, secretAccessKey }
  });

  const docKey = 'vault/VL-STU-2026-00004/mother_aadhar.jpeg';
  console.log('Fetching file from S3: ' + docKey);
  const command = new GetObjectCommand({ Bucket: bucket, Key: docKey });
  const s3Response = await s3.send(command);
  const buffer = await streamToBuffer(s3Response.Body);

  console.log('Calling processDocument...');
  const result = await kycService.processDocument(buffer, 'image/jpeg', 'mother_aadhar');
  console.log('Result:', JSON.stringify(result, null, 2));

  await app.close();
}

run().catch(console.error);
