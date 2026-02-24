import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  await app.listen(5000, '0.0.0.0');
  console.log('Server running on http://localhost:5000');
  console.log('Android Emulator: http://10.0.2.2:5000');
}
bootstrap();
