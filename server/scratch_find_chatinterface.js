const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Projects', 'Sun Glade', 'Loan', 'frontend', 'app', 'staff', 'dashboard', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<ChatInterface')) {
        console.log(`Line ${i + 1}: ${lines[i].trim()}`);
        // Print 5 lines before and after
        for (let j = Math.max(0, i - 5); j <= Math.min(lines.length - 1, i + 5); j++) {
            console.log(`  [${j + 1}] ${lines[j]}`);
        }
    }
}
