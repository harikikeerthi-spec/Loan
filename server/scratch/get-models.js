const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

const modelRegex = /^model\s+(\w+)\s*\{/gm;
let match;
const models = [];
while ((match = modelRegex.exec(schemaContent)) !== null) {
  models.push(match[1]);
}

console.log('Models found in Prisma schema:', models);
