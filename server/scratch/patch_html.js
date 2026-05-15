const fs = require('fs');

function patchFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    const htmlTemplate = `
        if (doc.filePath && doc.filePath.startsWith('in.gov.')) {
            const html = \`
<!DOCTYPE html>
<html>
<head>
    <title>DigiLocker Record - \${doc.docName || doc.docType}</title>
    <style>
        body { font-family: system-ui, sans-serif; background: #f0f2f5; display: flex; justify-content: center; padding: 40px; }
        .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 600px; width: 100%; border-top: 6px solid #82c91e; }
        .header { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
        .title { margin: 0; color: #1a3a6b; }
        .badge { background: #e6fced; color: #12b842; padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 14px; white-space: nowrap; }
        .field { margin-bottom: 20px; }
        .label { font-size: 13px; color: #666; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
        .value { font-size: 18px; color: #333; margin-top: 4px; word-break: break-all; }
        .footer { margin-top: 40px; font-size: 12px; color: #888; text-align: center; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h2 class="title">Digital Verification Record</h2>
            <span class="badge">✓ Verified by DigiLocker</span>
        </div>
        <div class="field">
            <div class="label">Document Name</div>
            <div class="value">\${doc.docName || doc.docType || 'Document'}</div>
        </div>
        <div class="field">
            <div class="label">DigiLocker Reference URI</div>
            <div class="value">\${doc.filePath}</div>
        </div>
        <div class="field">
            <div class="label">Date Synced</div>
            <div class="value">\${doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : 'N/A'}</div>
        </div>
        <div class="footer">
            This is a digitally verified record synced directly from DigiLocker. The physical file is held securely by the issuing authority.
        </div>
    </div>
</body>
</html>\`;
            res.setHeader('Content-Type', 'text/html');
            return res.send(html);
        }
`;

    if (!content.includes("if (doc.filePath && doc.filePath.startsWith('in.gov.'))")) {
        content = content.replace(
            /const absolutePath = resolve\(doc\.filePath\);/g,
            htmlTemplate + '\\n        const absolutePath = resolve(doc.filePath);'
        );
        fs.writeFileSync(filePath, content);
        console.log('Patched ' + filePath);
    }
}

patchFile('src/application/application.controller.ts');
patchFile('src/document/document.controller.ts');
