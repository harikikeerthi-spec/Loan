const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

const lines = schemaContent.split('\n');
const targetModels = ['AuditLog', 'Blog'];

targetModels.forEach(modelName => {
  const start = lines.findIndex(line => line.startsWith(`model ${modelName} `));
  if (start !== -1) {
    let end = start;
    while (end < lines.length && !lines[end].startsWith('}')) {
      end++;
    }
    console.log(`Model ${modelName}: Lines ${start + 1} to ${end + 1}`);
  } else {
    console.log(`Model ${modelName}: Not found`);
  }
});
