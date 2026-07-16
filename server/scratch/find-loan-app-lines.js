const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

const lines = schemaContent.split('\n');
const start = lines.findIndex(line => line.startsWith('model LoanApplication '));
if (start !== -1) {
  let end = start;
  while (end < lines.length && !lines[end].startsWith('}')) {
    end++;
  }
  console.log(`Model LoanApplication: Lines ${start + 1} to ${end + 1}`);
  console.log(lines.slice(end - 10, end + 1).join('\n'));
} else {
  console.log('Model LoanApplication not found');
}
