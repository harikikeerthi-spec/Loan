import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    app.enableCors();

    // LOGGING MIDDLEWARE
    app.use((req, res, next) => {
      console.log(`[REQUEST] ${req.method} ${req.url} from ${req.ip}`);
      next();
    });

    console.log('Attempting to listen on port 3000...');
    await app.listen(3000, '0.0.0.0');
    console.log('Server successfully started listening on port 3000');
    console.log('Server running on http://localhost:3000');
    console.log('Android Emulator: http://10.0.2.2:3000');
  } catch (err) {
    console.error('FATAL ERROR DURING BOOTSTRAP:', err);
    process.exit(1);
  }
}
bootstrap();
