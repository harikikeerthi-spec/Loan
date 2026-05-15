const fs = require('fs');
let content = fs.readFileSync('src/document/document.controller.ts', 'utf8');
content = content.replace(
    /if \(!existsSync\(absolutePath\)\) \{\s*throw new NotFoundException\('Document file not found on disk'\);\s*\}/,
    `if (!existsSync(absolutePath)) {
            const fallbackPath = resolve(process.cwd(), 'public/mock/document_missing.pdf');
            if (existsSync(fallbackPath)) {
                return res.sendFile(fallbackPath);
            }
            throw new NotFoundException('Document file not found on disk');
        }`
);
fs.writeFileSync('src/document/document.controller.ts', content);
