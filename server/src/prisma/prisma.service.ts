import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor() {
    // Prefer DIRECT_URL for persistent NestJS server to bypass PgBouncer transaction pooler timeout
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || '';
    
    const pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 10000, // Proactively close idle sockets before cloud DB/firewall severs them
      connectionTimeoutMillis: 30000, // Allow up to 30s for acquiring/establishing new pool connection
      keepAlive: true,
      keepAliveInitialDelayMillis: 5000,
    });

    pool.on('error', (err) => {
      this.logger.error(`Unexpected error on idle pg pool client: ${err.message}`);
    });

    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: ['error', 'warn'],
    });

    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}

