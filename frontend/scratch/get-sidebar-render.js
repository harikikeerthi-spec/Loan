const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'admin', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
// Let's search around line 780
const start = lines.findIndex(line => line.includes('navItems.map') || line.includes('supportNavItems.map'));
if (start !== -1) {
  console.log(lines.slice(start - 10, start + 40).join('\n'));
} else {
  console.log('Sidebar render not found');
}
