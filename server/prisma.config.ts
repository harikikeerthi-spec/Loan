import 'dotenv/config';
import path from 'path';
import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

// Load .env explicitly from the server directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || '',
  },
});
