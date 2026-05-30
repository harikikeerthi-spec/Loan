import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SupabaseModule } from '../supabase/supabase.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { BankController } from './bank.controller';
import { BankService } from './bank.service';
import { BankDashboardController } from './bank-dashboard.controller';
import { BankDashboardService } from './bank-dashboard.service';
import { BankWorkflowController } from './bank-workflow.controller';
import { BankWorkflowService } from './bank-workflow.service';
import { SlackService } from './slack.service';
import { SalesforceService } from './salesforce.service';
import { AutoAssignmentService } from './auto-assignment.service';
import { BankSchemesController } from './bank-schemes.controller';
import { BankSchemesService } from './bank-schemes.service';
import { RmProfileController } from './rm-profile.controller';
import { BankCronService } from './bank-cron.service';
import { BankRbacInterceptor } from './bank-rbac.middleware';

@Module({
  imports: [
    SupabaseModule,
    UsersModule,
    AuthModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [BankController, BankDashboardController, BankWorkflowController, BankSchemesController, RmProfileController],
  providers: [
    BankService,
    BankDashboardService,
    BankWorkflowService,
    SlackService,
    SalesforceService,
    AutoAssignmentService,
    BankSchemesService,
    BankCronService,
    BankRbacInterceptor
  ],
  exports: [BankService, BankDashboardService, BankWorkflowService, AutoAssignmentService, BankSchemesService, BankCronService]
})
export class BankModule { }
