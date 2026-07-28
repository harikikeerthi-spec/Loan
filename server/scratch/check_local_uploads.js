const fs = require('fs');
const path = require('path');

const userDir = path.join(process.cwd(), 'uploads', 'VL-STU-2026-00039');

console.log(`Checking local uploads dir: ${userDir}`);
if (fs.existsSync(userDir)) {
  console.log('User directory EXISTS!');
  const subdirs = fs.readdirSync(userDir);
  subdirs.forEach(sd => {
    const sdPath = path.join(userDir, sd);
    if (fs.statSync(sdPath).isDirectory()) {
      const files = fs.readdirSync(sdPath);
      console.log(` - Subfolder "${sd}": files = [${files.join(', ')}]`);
    } else {
      console.log(` - File: "${sd}"`);
    }
  });
} else {
  console.log('User directory DOES NOT EXIST on local disk.');
}

const uploadsRoot = path.join(process.cwd(), 'uploads');
if (fs.existsSync(uploadsRoot)) {
  console.log('\nAll user directories in uploads/:');
  fs.readdirSync(uploadsRoot).forEach(u => console.log(` - ${u}`));
} else {
  console.log('\nUploads root directory DOES NOT EXIST.');
}
