const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'node_modules', '.prisma', 'client', 'index.js');
if (fs.existsSync(indexPath)) {
  const content = fs.readFileSync(indexPath, 'utf8');
  const index = content.indexOf('const config =');
  if (index !== -1) {
    console.log(content.slice(index, index + 3000));
  } else {
    console.log('config definition not found');
  }
} else {
  console.log('index.js not found');
}
