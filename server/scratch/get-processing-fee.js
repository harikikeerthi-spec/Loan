const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

const regex1 = /model\s+ProcessingFee\s*\{([\s\S]*?)\}/g;
const match1 = regex1.exec(schemaContent);
if (match1) {
  console.log('--- MODEL ProcessingFee ---');
  console.log(match1[0]);
} else {
  console.log('ProcessingFee model not found');
}

const regex2 = /model\s+LoanApplication\s*\{([\s\S]*?)\}/g;
const match2 = regex2.exec(schemaContent);
if (match2) {
  console.log('--- MODEL LoanApplication ---');
  console.log(match2[0]);
} else {
  console.log('LoanApplication model not found');
}
