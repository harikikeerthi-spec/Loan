import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentDashboardController } from './agent-dashboard.controller';
import { AgentLeadsController, AgentEligibilityController } from './agent-leads.controller';
import { AgentCommissionsController } from './agent-commissions.controller';
import { AgentProfileController } from './agent-profile.controller';
import { AgentMiscController } from './agent-misc.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [SupabaseModule, AuthModule, UsersModule, ChatModule],
  controllers: [
    AgentDashboardController,
    AgentLeadsController,
    AgentEligibilityController,
    AgentCommissionsController,
    AgentProfileController,
    AgentMiscController
  ],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
