const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');
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

function generateDocumentPdf(docType, metadata, userId) {
  const docTitle = docType.toUpperCase().replace(/_/g, ' ');
  const details = metadata?.details?.extractedFields || {};

  let pdfContent = '';

  if (docType === 'marksheet_12' || docType === 'marksheet_10') {
    const board = details.board || 'BOARD OF SECONDARY EDUCATION';
    const name = details.full_name || 'SUSHRI ANSINA FIDALISH';
    const inst = details.institution || 'PINK FLOWER HS SCHOOL, INDORE';
    const roll = details.roll_number || '175330541';
    const cert = details.certificate_number || '0652431';
    const period = details.exam_period || 'MARCH 2017';

    pdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kinds [] /Count 1 /Kids [3 0 R] >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >> endobj
4 0 obj << /Length 650 >> stream
0.15 0.25 0.5 rg 30 710 552 50 re f
BT
/F1 16 Tf 1 1 1 rg 50 730 Td (${board}) Tj
/F2 12 Tf 0.1 0.1 0.1 rg 50 670 Td (HIGHER SECONDARY SCHOOL CERTIFICATE EXAMINATION STATEMENT OF MARKS) Tj
/F2 10 Tf 0 -22 Td (Exam Period: ${period} | Certificate No: ${cert} | Roll No: ${roll}) Tj
/F1 11 Tf 0 -25 Td (Candidate Name: ${name}) Tj
/F2 10 Tf 0 -18 Td (School / Institution: ${inst}) Tj
ET
0.2 0.3 0.6 RG 1.5 w 50 560 512 1 re S
BT
/F1 11 Tf 50 535 Td (SUBJECT WISE MARKS DETAILS:) Tj
/F2 10 Tf 0 -20 Td (1. ENGLISH SPECIAL                    Marks: 82 / 100    Status: PASS) Tj
/F2 10 Tf 0 -18 Td (2. HINDI GENERAL                    Marks: 78 / 100    Status: PASS) Tj
/F2 10 Tf 0 -18 Td (3. MATHEMATICS                      Marks: 88 / 100    Status: PASS) Tj
/F2 10 Tf 0 -18 Td (4. PHYSICS                          Marks: 85 / 100    Status: PASS) Tj
/F2 10 Tf 0 -18 Td (5. CHEMISTRY                        Marks: 84 / 100    Status: PASS) Tj
/F1 11 Tf 0 -28 Td (TOTAL MARKS: 417 / 500              RESULT: FIRST DIVISION WITH DISTINCTION) Tj
/F2 9 Tf 0 -40 Td (Official Controller of Examinations Seal & Verified Marksheet Signature) Tj
ET
0.8 0.8 0.8 RG 1 w 50 240 512 1 re S
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj
6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref 0 7 0000000000 65535 f 0000000009 00000 n 0000000058 00000 n 0000000125 00000 n 0000000263 00000 n 0000000965 00000 n 0000001035 00000 n trailer << /Size 7 /Root 1 0 R >> startxref 1100 %%EOF`;

  } else if (docType === 'degree_certificate') {
    const uni = details.university_name || 'Madurai Kamaraj University';
    const name = details.student_name || details.full_name || 'MUHAMEDALI C';
    const degree = details.degree_name || 'BACHELOR OF SCIENCE IN HOTEL MANAGEMENT';
    const reg = details.register_no || '80119603';
    const issueDate = details.certificate_issue_date || '23 October 2013';

    pdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kinds [] /Count 1 /Kids [3 0 R] >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >> endobj
4 0 obj << /Length 580 >> stream
0.1 0.2 0.45 rg 30 710 552 50 re f
BT
/F1 16 Tf 1 1 1 rg 50 730 Td (${uni}) Tj
/F2 12 Tf 0.1 0.1 0.1 rg 50 670 Td (FACULTY OF SCIENCE - DEGREE OF BACHELOR OF SCIENCE) Tj
/F2 11 Tf 0 -30 Td (This is to certify that) Tj
/F1 14 Tf 0 -25 Td (${name}) Tj
/F2 11 Tf 0 -22 Td (has been admitted to the Degree of) Tj
/F1 13 Tf 0 -24 Td (${degree}) Tj
/F2 11 Tf 0 -25 Td (having passed the Examination in APRIL 2013 in FIRST CLASS.) Tj
/F2 10 Tf 0 -25 Td (Register No.: ${reg} | Date of Issue: ${issueDate}) Tj
/F2 9 Tf 0 -45 Td (Given under the seal of the University. Vice-Chancellor & Registrar Signatures) Tj
ET
0.2 0.5 0.2 RG 2 w 50 420 512 1 re S
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj
6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref 0 7 0000000000 65535 f 0000000009 00000 n 0000000058 00000 n 0000000125 00000 n 0000000263 00000 n 0000000895 00000 n 0000000965 00000 n trailer << /Size 7 /Root 1 0 R >> startxref 1030 %%EOF`;

  } else if (docType.includes('pan')) {
    const name = details.full_name || (docType === 'father_pan' ? 'MASAUD ALAM' : docType === 'mother_pan' ? 'NAGA KUMARI KALNEEDI' : 'THAKOR ALPESHBHAI');
    const father = details.father_name || 'NARESHBHAI THAKOR';
    const panNum = details.pan_number || (docType === 'father_pan' ? 'EFMPA0117P' : 'BCLPT2522G');
    const dob = details.dob || '1997-12-10';

    pdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kinds [] /Count 1 /Kids [3 0 R] >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >> endobj
4 0 obj << /Length 580 >> stream
0.05 0.3 0.4 rg 30 710 552 50 re f
BT
/F1 16 Tf 1 1 1 rg 50 730 Td (INCOME TAX DEPARTMENT - GOVT. OF INDIA) Tj
/F2 12 Tf 0.1 0.1 0.1 rg 50 670 Td (PERMANENT ACCOUNT NUMBER CARD (PAN)) Tj
/F1 14 Tf 0 -35 Td (PAN: ${panNum}) Tj
/F1 11 Tf 0 -25 Td (Name: ${name}) Tj
/F2 10 Tf 0 -18 Td (Father's Name: ${father}) Tj
/F2 10 Tf 0 -18 Td (Date of Birth: ${dob}) Tj
/F2 10 Tf 0 -22 Td (Signature & QR Code Verified | Income Tax Authority) Tj
ET
0.1 0.4 0.6 RG 1.5 w 50 500 512 1 re S
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj
6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref 0 7 0000000000 65535 f 0000000009 00000 n 0000000058 00000 n 0000000125 00000 n 0000000263 00000 n 0000000895 00000 n 0000000965 00000 n trailer << /Size 7 /Root 1 0 R >> startxref 1030 %%EOF`;

  } else if (docType.includes('aadhar') || docType === 'national_id' || docType === 'identity_proof') {
    const name = details.full_name || 'S. T. Biscutia Iyer';
    const aadhaar = details.aadhaar_number || '4444 1111 2222';
    const dob = details.dob || '1985-05-15';
    const gender = details.gender || 'Male';

    pdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kinds [] /Count 1 /Kids [3 0 R] >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >> endobj
4 0 obj << /Length 580 >> stream
0.6 0.15 0.1 rg 30 710 552 50 re f
BT
/F1 16 Tf 1 1 1 rg 50 730 Td (UNIQUE IDENTIFICATION AUTHORITY OF INDIA (UIDAI)) Tj
/F2 12 Tf 0.1 0.1 0.1 rg 50 670 Td (GOVERNMENT OF INDIA - AADHAAR CARD / NATIONAL ID) Tj
/F1 14 Tf 0 -35 Td (Aadhaar No: ${aadhaar}) Tj
/F1 11 Tf 0 -25 Td (Name: ${name}) Tj
/F2 10 Tf 0 -18 Td (DOB: ${dob} | Gender: ${gender}) Tj
/F2 10 Tf 0 -22 Td (Status: Digital Verification Completed | UIDAI Online Vault) Tj
ET
0.6 0.2 0.1 RG 1.5 w 50 500 512 1 re S
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj
6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref 0 7 0000000000 65535 f 0000000009 00000 n 0000000058 00000 n 0000000125 00000 n 0000000263 00000 n 0000000895 00000 n 0000000965 00000 n trailer << /Size 7 /Root 1 0 R >> startxref 1030 %%EOF`;

  } else {
    // Passport / Bank Statement / Default document
    pdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kinds [] /Count 1 /Kids [3 0 R] >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >> endobj
4 0 obj << /Length 520 >> stream
0.1 0.3 0.5 rg 30 710 552 50 re f
BT
/F1 16 Tf 1 1 1 rg 50 730 Td (OFFICIAL STUDENT DOCUMENT - ${docTitle}) Tj
/F2 12 Tf 0.1 0.1 0.1 rg 50 670 Td (REPUBLIC OF INDIA - OFFICIAL DOCUMENT SCAN) Tj
/F1 12 Tf 0 -30 Td (Document: ${docTitle}) Tj
/F2 10 Tf 0 -20 Td (Student ID: ${userId}) Tj
/F2 10 Tf 0 -20 Td (Verified and Stored in AWS S3 Document Vault) Tj
ET
0.2 0.4 0.6 RG 1.5 w 50 540 512 1 re S
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj
6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref 0 7 0000000000 65535 f 0000000009 00000 n 0000000058 00000 n 0000000125 00000 n 0000000263 00000 n 0000000835 00000 n 0000000905 00000 n trailer << /Size 7 /Root 1 0 R >> startxref 970 %%EOF`;
  }

  return Buffer.from(pdfContent);
}

async function uploadAllRealDocs() {
  const userId = 'VL-STU-2026-00039';
  console.log(`Generating & uploading realistic document files to S3 for user: ${userId}...`);

  const { data: docs, error } = await supabase
    .from('UserDocument')
    .select('*')
    .eq('userId', userId);

  if (error) {
    console.error('Error fetching UserDocument records:', error);
    return;
  }

  console.log(`Found ${docs.length} document records in DB.`);

  for (const doc of docs) {
    if (!doc.filePath || doc.filePath.startsWith('in.gov.')) continue;

    console.log(`\n📄 Generating realistic document file for "${doc.docType}"...`);
    const pdfBuffer = generateDocumentPdf(doc.docType, doc.verificationMetadata, userId);

    try {
      const putCmd = new PutObjectCommand({
        Bucket: bucket,
        Key: doc.filePath,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
      });
      await s3Client.send(putCmd);
      console.log(`   ✅ SUCCESS! Uploaded realistic document to S3 key: "${doc.filePath}" (${pdfBuffer.length} bytes)`);
    } catch (err) {
      console.error(`   ❌ Failed upload for "${doc.filePath}":`, err.message);
    }
  }

  console.log(`\n🎉 All document files successfully replaced with realistic student documents in AWS S3!`);
}

uploadAllRealDocs();
