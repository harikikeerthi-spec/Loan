import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentDashboardController } from './agent-dashboard.controller';
import { AgentLeadsController, AgentEligibilityController } from './agent-leads.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [SupabaseModule, AuthModule, UsersModule],
  controllers: [AgentDashboardController, AgentLeadsController, AgentEligibilityController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
