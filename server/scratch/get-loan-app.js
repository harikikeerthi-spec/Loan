const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

const targetModels = [
  'LoanApplication',
  'UserDocument'
];

targetModels.forEach(modelName => {
  const regex = new RegExp(`model\\s+${modelName}\\s*\\{[\\s\\S]*?\\}`, 'g');
  const match = regex.exec(schemaContent);
  if (match) {
    console.log(`--- MODEL: ${modelName} ---`);
    console.log(match[0]);
    console.log('\n');
  } else {
    console.log(`--- MODEL: ${modelName} NOT FOUND ---\n`);
  }
});
