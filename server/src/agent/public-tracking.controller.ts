import { Controller, Get, Param } from '@nestjs/common';
import { AgentService } from './agent.service';

@Controller('tracking-links')
export class PublicTrackingController {
  constructor(private readonly agentService: AgentService) {}

  @Get(':token')
  async getPublicTrackingStatus(@Param('token') token: string) {
    const data = await this.agentService.getPublicTrackingStatus(token);
    return { success: true, data };
  }
}
