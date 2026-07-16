const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

const lines = schemaContent.split('\n');
const userModelStart = lines.findIndex(line => line.startsWith('model User '));
if (userModelStart !== -1) {
  let i = userModelStart;
  while (i < lines.length && !lines[i].startsWith('}')) {
    if (lines[i].includes('tests')) {
      console.log(`Found tests on line ${i + 1}: ${lines[i].trim()}`);
    }
    i++;
  }
} else {
  console.log('User model not found');
}
