const fs = require('fs');
let content = fs.readFileSync('src/application/application.controller.ts', 'utf8');
content = content.replace(
    /const doc = docsResult\.data\?\.find\(\(d: any\) => d\.id === documentId\);/g,
    `const doc = docsResult.data?.find((d: any) => String(d.id) === String(documentId));`
);
fs.writeFileSync('src/application/application.controller.ts', content);
