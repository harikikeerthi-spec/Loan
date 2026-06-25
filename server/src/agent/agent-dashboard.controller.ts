import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentGuard } from '../auth/agent.guard';

@Controller('dashboard')
@UseGuards(AgentGuard)
export class AgentDashboardController {
  constructor(private readonly agentService: AgentService) {}

  @Get('summary')
  async getSummary(@Req() req: any) {
    const agentId = req.user.id;
    const summary = await this.agentService.getDashboardSummary(agentId);
    return { success: true, data: summary };
  }

  @Get('pipeline')
  async getPipeline(@Req() req: any) {
    const agentId = req.user.id;
    const pipeline = await this.agentService.getDashboardPipeline(agentId);
    return { success: true, data: pipeline };
  }

  @Get('activity-feed')
  async getActivityFeed(@Req() req: any) {
    const agentId = req.user.id;
    const feed = await this.agentService.getDashboardActivity(agentId);
    return { success: true, data: feed };
  }

  @Get('action-items')
  async getActionItems(@Req() req: any) {
    const agentId = req.user.id;
    const items = await this.agentService.getDashboardActionItems(agentId);
    return { success: true, data: items };
  }
}
