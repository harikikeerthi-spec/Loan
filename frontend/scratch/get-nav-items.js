const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'admin', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
const start = lines.findIndex(line => line.includes('const navItems = [') || line.includes('const navItems:'));
if (start !== -1) {
  console.log(lines.slice(start, start + 30).join('\n'));
} else {
  console.log('navItems not found');
}
