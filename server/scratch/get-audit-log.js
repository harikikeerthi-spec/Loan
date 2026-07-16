const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

const regex = /model\s+AuditLog\s*\{([\s\S]*?)\}/g;
const match = regex.exec(schemaContent);
if (match) {
  console.log('--- MODEL AuditLog ---');
  console.log(match[0]);
} else {
  console.log('AuditLog model not found');
}
