import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3000, '0.0.0.0');
  console.log('Server running on http://localhost:3000');
  console.log('Android Emulator: http://10.0.2.2:3000');
}
bootstrap();
