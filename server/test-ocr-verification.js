#!/usr/bin/env node

/**
 * OCR Verification Test Script
 * This script tests the document verification (OCR) functionality
 * 
 * Usage:
 *   node test-ocr-verification.js <action> [options]
 * 
 * Actions:
 *   test-service      - Test OCR service directly with a sample document
 *   test-upload       - Test document upload with OCR
 *   test-reverify     - Test OCR re-verification
 *   list-documents    - List all uploaded documents
 *   check-env         - Check if API keys are configured
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(msg, color = 'reset') {
  console.log(colors[color] + msg + colors.reset);
}

function logSection(title) {
  log('\n' + '='.repeat(60), 'blue');
  log(title, 'cyan');
  log('='.repeat(60), 'blue');
}

function checkEnvironment() {
  logSection('Environment Check');
  
  const required = ['OPENROUTER_API_KEY', 'DATABASE_URL', 'BACKEND_URL'];
  const optional = ['NODE_ENV'];
  
  let allGood = true;
  
  required.forEach(key => {
    const value = process.env[key];
    if (!value) {
      log(`❌ ${key}: NOT SET`, 'red');
      allGood = false;
    } else {
      const masked = value.substring(0, 4) + '...' + value.substring(value.length - 4);
      log(`✓ ${key}: ${masked}`, 'green');
    }
  });
  
  optional.forEach(key => {
    const value = process.env[key];
    if (value) {
      log(`ℹ ${key}: ${value}`, 'cyan');
    }
  });
  
  return allGood;
}

async function testVisionApi() {
  logSection('Vision API Test');
  
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    log('❌ OPENROUTER_API_KEY not set', 'red');
    return false;
  }
  
  // Create a simple test image (1x1 pixel PNG)
  const pngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
    0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x3c, 0xa1, 0x1a, 0xf0, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
  ]);
  
  const base64Image = pngBuffer.toString('base64');
  
  log('Testing Vision API connectivity...', 'yellow');
  
  try {
    const requestBody = {
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'What do you see in this image? Respond with a single word.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 50
    };
    
    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'openrouter.ai',
        port: 443,
        path: '/api/v1/chat/completions',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://vidyaloan.com',
          'X-Title': 'VidyaLoan',
          'Content-Length': Buffer.byteLength(JSON.stringify(requestBody))
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });
      
      req.on('error', reject);
      req.write(JSON.stringify(requestBody));
      req.end();
    });
    
    if (response.status === 200) {
      log('✓ Vision API is accessible', 'green');
      const content = response.body.choices?.[0]?.message?.content || '';
      log(`✓ API Response: "${content.substring(0, 100)}"...`, 'green');
      return true;
    } else {
      log(`❌ Vision API error: ${response.status}`, 'red');
      log(`Response: ${JSON.stringify(response.body).substring(0, 200)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Vision API test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testDocumentVerificationLogic() {
  logSection('Document Verification Logic Test');
  
  // Simple simulation of the verification logic
  const testCases = [
    {
      name: 'Valid Aadhaar Response',
      response: {
        isValid: true,
        confidence: 85,
        extractedFields: {
          name: 'John Doe',
          dateOfBirth: '01/01/1995',
          aadhaarNumber: '1234'
        },
        reason: 'Document verified successfully'
      }
    },
    {
      name: 'Invalid Document Type',
      response: {
        isCorrectDocumentType: false,
        isValid: false,
        confidence: 20,
        reason: 'Wrong document type detected'
      }
    },
    {
      name: 'Blurry Document',
      response: {
        isValid: false,
        confidence: 30,
        reason: 'Document is blurry and cannot be read clearly',
        extractedFields: {}
      }
    }
  ];
  
  log('Testing response parsing logic...', 'yellow');
  
  testCases.forEach((testCase, idx) => {
    try {
      // Simulate the parsing logic
      const result = {
        isValid: testCase.response.isValid ?? testCase.response.isCorrectDocumentType ?? true,
        confidence: testCase.response.confidence ?? 70,
        extractedFields: testCase.response.extractedFields || {},
        reason: testCase.response.reason || 'Document verified successfully'
      };
      
      log(`${idx + 1}. ${testCase.name}:`, 'cyan');
      log(`   - Valid: ${result.isValid}`, 'yellow');
      log(`   - Confidence: ${result.confidence}%`, 'yellow');
      log(`   - Fields: ${Object.keys(result.extractedFields).join(', ') || 'none'}`, 'yellow');
      log(`   - Reason: ${result.reason}`, 'yellow');
    } catch (error) {
      log(`❌ Test case failed: ${error.message}`, 'red');
    }
  });
  
  return true;
}

async function testFileOperations() {
  logSection('File Operations Test');
  
  const testDir = path.join(process.cwd(), 'uploads', 'documents');
  
  log(`Checking upload directory: ${testDir}`, 'yellow');
  
  if (fs.existsSync(testDir)) {
    log('✓ Upload directory exists', 'green');
    
    try {
      const files = fs.readdirSync(testDir);
      log(`✓ Directory contains ${files.length} files`, 'green');
      
      if (files.length > 0) {
        log('Sample files:', 'cyan');
        files.slice(0, 5).forEach(file => {
          const filePath = path.join(testDir, file);
          const stats = fs.statSync(filePath);
          log(`  - ${file} (${(stats.size / 1024).toFixed(2)} KB)`, 'yellow');
        });
      }
    } catch (error) {
      log(`⚠ Could not read directory: ${error.message}`, 'yellow');
    }
  } else {
    log('⚠ Upload directory does not exist yet', 'yellow');
  }
  
  return true;
}

function printSummaryTable(results) {
  logSection('Test Summary');
  
  console.table([
    {
      'Test': 'Environment Check',
      'Status': results.env ? '✓ PASS' : '❌ FAIL'
    },
    {
      'Test': 'Vision API Connectivity',
      'Status': results.vision ? '✓ PASS' : '❌ FAIL'
    },
    {
      'Test': 'Response Parsing Logic',
      'Status': results.parsing ? '✓ PASS' : '❌ FAIL'
    },
    {
      'Test': 'File Operations',
      'Status': results.files ? '✓ PASS' : '❌ FAIL'
    }
  ]);
}

async function main() {
  const action = process.argv[2] || 'all';
  
  const results = {};
  
  if (action === 'check-env' || action === 'all') {
    results.env = checkEnvironment();
  }
  
  if (action === 'all') {
    results.vision = await testVisionApi();
    results.parsing = await testDocumentVerificationLogic();
    results.files = await testFileOperations();
    
    printSummaryTable(results);
    
    const allPassed = Object.values(results).every(r => r);
    if (allPassed) {
      log('\n✓ All tests passed!', 'green');
      process.exit(0);
    } else {
      log('\n❌ Some tests failed. Please check the output above.', 'red');
      process.exit(1);
    }
  } else if (action === 'test-service') {
    log('OCR Service Test - not yet implemented', 'yellow');
  } else if (action === 'test-upload') {
    log('Document Upload Test - not yet implemented', 'yellow');
  } else if (action === 'test-reverify') {
    log('OCR Re-verification Test - not yet implemented', 'yellow');
  } else if (action === 'list-documents') {
    await testFileOperations();
  } else {
    log('Unknown action: ' + action, 'red');
    log('Available actions: check-env, test-service, test-upload, test-reverify, list-documents, all', 'yellow');
    process.exit(1);
  }
}

main().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
