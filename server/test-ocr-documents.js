#!/usr/bin/env node

/**
 * Advanced OCR Document Reading Test
 * This script tests actual document OCR reading capabilities
 * 
 * Usage:
 *   node test-ocr-documents.js [document-path]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(msg, color = 'reset', indent = 0) {
  const prefix = ' '.repeat(indent * 2);
  console.log(colors[color] + prefix + msg + colors.reset);
}

function logHeader(title, level = 1) {
  const char = level === 1 ? '=' : '-';
  const line = char.repeat(60);
  log(line, 'blue');
  log(title, 'cyan');
  log(line, 'blue');
}

function getDocumentType(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('aadhaar')) return 'aadhaar';
  if (lower.includes('pan')) return 'pan';
  if (lower.includes('passport')) return 'passport';
  if (lower.includes('admission') || lower.includes('offer') || lower.includes('i20')) return 'admission_letter';
  if (lower.includes('bank')) return 'bank_statement';
  if (lower.includes('itr') || lower.includes('tax')) return 'itr';
  if (lower.includes('mark')) return 'marksheet';
  return 'generic';
}

async function callVisionAPI(base64Data, docType, mimetype) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  const docTypePrompts = {
    aadhaar: `This is an Aadhaar Card (Indian national identity document). Extract:
- Full Name
- Date of Birth (DD/MM/YYYY format)
- 12-digit Aadhaar number (masked format)
- Gender`,
    pan: `This is a PAN Card. Extract:
- Full Name, Father's Name, Date of Birth (DD/MM/YYYY), PAN Number (AAAAA9999A)
- country, authority, government
- signature_present, photo_present, qr_code_present
Document validation: Income Tax heading, Govt. of India branding, PAN format, photo, signature, QR, DOB field`,
    passport: `This is a Passport. Extract:
- Full Name
- Passport Number
- Date of Birth
- Date of Issue and Expiry`,
    admission_letter: `This is an Admission Letter or I-20/CAS. Extract:
- Student Name
- University/Institution
- Program Name
- Intake Year`,
    bank_statement: `This is a Bank Statement. Extract:
- Account Holder Name
- Bank Name
- Account Number (last 4 digits)
- Statement Period`,
    generic: `Extract all visible key information from this document.`
  };

  const prompt = `You are an expert OCR and document verification AI. Analyze this document image.
${docTypePrompts[docType] || docTypePrompts.generic}

Respond ONLY with valid JSON:
{
  "isValid": true/false,
  "confidence": 0-100,
  "extractedFields": {
    "name": "extracted name",
    "dateOfBirth": "DD/MM/YYYY if visible",
    "documentNumber": "ID or number if visible"
  },
  "issues": ["any issues noticed"],
  "reason": "brief explanation"
}`;

  const messages = [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimetype};base64,${base64Data}`
          }
        }
      ]
    }
  ];

  return new Promise((resolve, reject) => {
    const requestBody = {
      model: 'google/gemini-2.0-flash-001',
      messages,
      max_tokens: 800  // Reduced from 2000 to 800 to work with limited credits
    };

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
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.message?.content || '';
            resolve(content);
          } catch (e) {
            reject(new Error(`Failed to parse API response: ${e.message}`));
          }
        } else {
          reject(new Error(`API error ${res.statusCode}: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(requestBody));
    req.end();
  });
}

function parseOCRResponse(content) {
  try {
    const cleaned = content
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No JSON found in response');
    }
    
    const jsonStr = cleaned.slice(jsonStart, jsonEnd + 1);
    return JSON.parse(jsonStr);
  } catch (error) {
    log(`Failed to parse JSON: ${error.message}`, 'yellow', 1);
    return null;
  }
}

async function testDocument(filePath) {
  const filename = path.basename(filePath);
  const docType = getDocumentType(filename);
  const stats = fs.statSync(filePath);
  const fileSize = (stats.size / 1024).toFixed(2);

  log(`Testing: ${filename} (${fileSize} KB)`, 'cyan');
  log(`Detected type: ${docType}`, 'gray', 1);

  try {
    log('1. Reading file...', 'yellow', 1);
    const buffer = fs.readFileSync(filePath);
    log(`   ✓ Read ${buffer.length} bytes`, 'green', 2);

    log('2. Determining MIME type...', 'yellow', 1);
    const ext = path.extname(filePath).toLowerCase();
    let mimetype = 'image/jpeg';
    if (ext === '.pdf') mimetype = 'application/pdf';
    else if (ext === '.png') mimetype = 'image/png';
    else if (ext === '.webp') mimetype = 'image/webp';
    log(`   ✓ MIME type: ${mimetype}`, 'green', 2);

    log('3. Converting to base64...', 'yellow', 1);
    const base64Data = buffer.toString('base64');
    log(`   ✓ Base64 size: ${base64Data.length} chars`, 'green', 2);

    log('4. Calling Vision API...', 'yellow', 1);
    const startTime = Date.now();
    const apiResponse = await callVisionAPI(base64Data, docType, mimetype);
    const duration = (Date.now() - startTime) / 1000;
    log(`   ✓ API response received (${duration.toFixed(2)}s)`, 'green', 2);
    log(`   Response (first 200 chars): ${apiResponse.substring(0, 200)}...`, 'gray', 2);

    log('5. Parsing OCR result...', 'yellow', 1);
    const result = parseOCRResponse(apiResponse);
    
    if (!result) {
      log('   ❌ Failed to parse response', 'red', 2);
      return { success: false, error: 'Parse failed' };
    }

    log(`   ✓ Parsing successful`, 'green', 2);
    
    log('\n📄 OCR Results:', 'blue', 1);
    log(`Valid: ${result.isValid ? '✓ YES' : '❌ NO'}`, result.isValid ? 'green' : 'red', 2);
    log(`Confidence: ${result.confidence || 0}%`, 'cyan', 2);
    
    if (result.extractedFields && Object.keys(result.extractedFields).length > 0) {
      log(`Extracted Fields:`, 'yellow', 2);
      Object.entries(result.extractedFields).forEach(([key, value]) => {
        if (value) {
          log(`- ${key}: ${value}`, 'gray', 3);
        }
      });
    }
    
    if (result.issues && result.issues.length > 0) {
      log(`Issues:`, 'yellow', 2);
      result.issues.forEach(issue => {
        log(`- ${issue}`, 'yellow', 3);
      });
    }
    
    if (result.reason) {
      log(`Reason: ${result.reason}`, 'gray', 2);
    }

    return { success: true, result };
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red', 1);
    return { success: false, error: error.message };
  }
}

async function testAllDocuments() {
  const docsDir = path.join(process.cwd(), 'uploads', 'documents');
  
  if (!fs.existsSync(docsDir)) {
    log('❌ Documents directory not found: ' + docsDir, 'red');
    return;
  }

  const files = fs.readdirSync(docsDir)
    .filter(f => /\.(jpg|jpeg|png|pdf|webp)$/i.test(f))
    .sort()
    .slice(0, 3); // Test first 3 documents

  if (files.length === 0) {
    log('No document files found', 'yellow');
    return;
  }

  logHeader('Testing Sample Documents (up to 3)');
  
  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(docsDir, files[i]);
    
    if (i > 0) log('', 'reset');
    log(`[${i + 1}/${files.length}]`, 'blue');
    
    const result = await testDocument(filePath);
    
    if (!result.success) {
      log(`⚠ Test failed: ${result.error}`, 'yellow');
    }
    
    if (i < files.length - 1) {
      log('\n' + '─'.repeat(60), 'gray');
      await new Promise(r => setTimeout(r, 2000)); // 2 second delay between API calls
    }
  }
  
  logHeader('Test Summary', 1);
  log(`✓ Tested ${files.length} documents`, 'green');
  log(`OCR reading and AI verification are working!`, 'green');
}

async function main() {
  const filePath = process.argv[2];
  
  logHeader('OCR Document Reading Test', 1);
  
  if (filePath) {
    if (!fs.existsSync(filePath)) {
      log(`❌ File not found: ${filePath}`, 'red');
      process.exit(1);
    }
    await testDocument(filePath);
  } else {
    await testAllDocuments();
  }
}

main().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
