const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'admin', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('NavItem') || line.includes('Marketing')) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
  }
});
