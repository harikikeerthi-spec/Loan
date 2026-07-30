import 'dotenv/config';
import * as dns from 'dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // ignore if unsupported
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();

  // ✅ CRITICAL: Twilio sends webhooks as application/x-www-form-urlencoded
  // Without this, body.From and body.Body will always be undefined
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(express.json({ limit: '10mb' }));

  // Serve uploaded files (disk fallback when S3 is unavailable)
  app.use('/uploads', express.static(join(__dirname, '..', '..', 'uploads')));
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
  
  const port = process.env.PORT || 5000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`Server running on port ${port}`);
  console.log(`Android Emulator: http://10.0.2.2:${port}`);
  console.log(`WhatsApp Webhook URL: http://localhost:${port}/api/webhook/whatsapp`);
  console.log(`WhatsApp Webhook URL (alt): http://localhost:${port}/api/whatsapp`);
}
bootstrap();
