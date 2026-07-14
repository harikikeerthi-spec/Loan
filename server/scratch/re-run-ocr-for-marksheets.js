const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { KycService } = require('../dist/ai/services/kyc.service');
const { UsersService } = require('../dist/users/users.service');
const { SupabaseService } = require('../dist/supabase/supabase.service');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
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
  const usersService = app.get(UsersService);
  const supabaseService = app.get(SupabaseService);
  const db = supabaseService.getClient();
  
  const bucket = (process.env.AWS_S3_BUCKET_NAME || '').trim();
  const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || '').trim();

  const s3 = new S3Client({
    region: 'us-east-1',
    credentials: { accessKeyId, secretAccessKey }
  });

  const userId = 'VL-STU-2026-00004';
  const docTypes = ['marksheet_10', 'marksheet_12'];

  console.log('Fetching documents for user: ' + userId);
  const { data: userDocs } = await db
    .from('UserDocument')
    .select('*')
    .eq('userId', userId)
    .in('docType', docTypes);

  console.log('Found ' + (userDocs?.length || 0) + ' documents');

  for (const doc of (userDocs || [])) {
    console.log('\n----------------------------------------');
    console.log('Processing: ' + doc.docType + ' | ' + doc.filePath);
    
    if (!doc.filePath) {
      console.log('  No file path, skipping');
      continue;
    }

    try {
      // 1. Fetch file from S3
      console.log('  Downloading from S3...');
      const command = new GetObjectCommand({ Bucket: bucket, Key: doc.filePath });
      const s3Response = await s3.send(command);
      const buffer = await streamToBuffer(s3Response.Body);
      console.log('  Downloaded buffer size: ' + buffer.length + ' bytes');

      const mimetype = doc.filePath.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';

      // 2. Call KycService vision OCR
      console.log('  Calling KycService.processDocument...');
      const kycResult = await kycService.processDocument(buffer, mimetype, doc.docType);
      
      console.log('  OCR processed successfully. valid=' + kycResult.is_valid + ', confidence=' + kycResult.confidence_score + '%');
      console.log('  Extracted Data:', JSON.stringify(kycResult.extracted_data, null, 2));

      // 3. Build verificationResult metadata
      const verificationResult = {
        isValid: kycResult.is_valid,
        code: kycResult.is_valid ? 'AI_VERIFIED' : 'AI_REJECTED',
        confidence: kycResult.confidence_score,
        details: {
          message: 'Document manually re-verified by S3 OCR marksheet script',
          extractedFields: kycResult.extracted_data,
          document_validation: kycResult.document_validation,
          ocr_issues: kycResult.ocr_issues,
        },
      };

      // 4. Update UserDocument verificationMetadata
      console.log('  Saving to UserDocument...');
      await usersService.upsertUserDocument(userId, doc.docType, {
        uploaded: true,
        filePath: doc.filePath,
        status: 'verified',
        verificationMetadata: verificationResult
      });

      console.log('  ✓ Finished docType: ' + doc.docType);
    } catch (err) {
      console.error('  ✗ Error processing document:', err.message);
    }
  }

  await app.close();
}

run().catch(console.error);
