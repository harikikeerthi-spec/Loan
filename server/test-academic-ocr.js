#!/usr/bin/env node
/**
 * Test academic OCR for 10th/12th sample certificates.
 * Usage: node test-academic-ocr.js <image-path> <marksheet_10|marksheet_12>
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

const PROMPTS = {
  marksheet_10: `This is a Grade 10 / SSC / Secondary School Certificate (Indian state board).
Extract: full_name, father_name, date_of_birth, board_name, institution_name, roll_number,
examination_month_year, medium_of_instruction, overall_gpa, grading_system, city_of_study, state_of_study, country_of_study`,
  marksheet_12: `This is a Grade 12 / Intermediate certificate (Indian state board).
Extract: full_name, board_name, institution_name, registered_number, examination_month_year,
total_marks_secured, total_marks_maximum, percentage, grade_awarded, medium_of_instruction,
grading_system, city_of_study, state_of_study, country_of_study`,
};

async function callApi(base64, mimetype, docType) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  const prompt = `You are an expert OCR agent. ${PROMPTS[docType] || PROMPTS.marksheet_10}
Respond ONLY with JSON:
{"isValid":true,"confidence":0-100,"extracted_data":{...},"reason":"..."}`;

  const body = JSON.stringify({
    model: 'google/gemini-2.5-flash',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: `data:${mimetype};base64,${base64}` } },
      ],
    }],
    max_tokens: 1200,
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`API ${res.statusCode}: ${data.slice(0, 300)}`));
        try {
          const content = JSON.parse(data).choices?.[0]?.message?.content || '';
          const cleaned = content.replace(/```json/gi, '').replace(/```/g, '').trim();
          const start = cleaned.indexOf('{');
          const end = cleaned.lastIndexOf('}');
          resolve(JSON.parse(cleaned.slice(start, end + 1)));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const filePath = process.argv[2];
  const docType = process.argv[3] || 'marksheet_10';
  if (!filePath || !fs.existsSync(filePath)) {
    console.error('Usage: node test-academic-ocr.js <image> [marksheet_10|marksheet_12]');
    process.exit(1);
  }

  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimetype = ext === '.png' ? 'image/png' : 'image/jpeg';
  const parsed = await callApi(buffer.toString('base64'), mimetype, docType);
  const raw = parsed.extracted_data || parsed.extractedFields || {};
  const level = docType === 'marksheet_12' ? 'grade12' : 'grade10';

  console.log('\n=== EXTRACTED DATA ===');
  console.log(JSON.stringify(raw, null, 2));
  console.log(`\nLevel: ${level}`);
  console.log(`\nConfidence: ${parsed.confidence || parsed.confidence_score}%`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
