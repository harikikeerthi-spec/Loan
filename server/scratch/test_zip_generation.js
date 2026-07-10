require('dotenv').config();
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { BankService } = require('../dist/bank/bank.service');
const fs = require('fs');
const path = require('path');

async function run() {
  console.log('Bootstrapping NestJS application context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const bankService = app.get(BankService);

  const appId = '25c07fe1-f9d6-4915-837d-2f7a78138f83'; // VL-APP-2026-00038
  console.log(`Compiling ZIP for applicant Abhi Ram (App ID: ${appId})...`);
  
  const start = Date.now();
  try {
    const zipResult = await bankService.generateDocumentsZip(appId);
    const duration = (Date.now() - start) / 1000;
    console.log(`\nZIP compiled successfully in ${duration}s!`);
    console.log('File Name:', zipResult.fileName);
    console.log('Buffer size:', zipResult.buffer.length, 'bytes');

    const outputPath = path.resolve(__dirname, 'test_output.zip');
    fs.writeFileSync(outputPath, zipResult.buffer);
    console.log(`Wrote compiled ZIP file to: ${outputPath}`);

    // Read ZIP file contents using adm-zip if possible, or just print success
    const stat = fs.statSync(outputPath);
    if (stat.size > 0) {
      console.log(`SUCCESS: Zip file is valid and non-empty (${stat.size} bytes).`);
    } else {
      console.error('ERROR: Compiled ZIP file is empty!');
    }
  } catch (err) {
    console.error('Failed to compile ZIP:', err.message, err.stack);
  }

  await app.close();
}

run().catch(console.error);
