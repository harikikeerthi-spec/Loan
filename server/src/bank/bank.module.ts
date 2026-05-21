import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SupabaseModule } from '../supabase/supabase.module';
import { UsersModule } from '../users/users.module';
import { BankController } from './bank.controller';
import { BankService } from './bank.service';
import { SlackService } from './slack.service';
import { SalesforceService } from './salesforce.service';
import { BankCronService } from './bank-cron.service';
import { BankRbacInterceptor } from './bank-rbac.middleware';

@Module({
  imports: [
    SupabaseModule,
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [BankController],
  providers: [
    BankService,
    SlackService,
    SalesforceService,
    BankCronService,
    BankRbacInterceptor
  ],
  exports: [BankService, BankCronService]
})
export class BankModule {}
