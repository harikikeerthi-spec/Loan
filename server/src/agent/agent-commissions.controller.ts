import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentGuard } from '../auth/agent.guard';

@Controller('commissions')
@UseGuards(AgentGuard)
export class AgentCommissionsController {
  constructor(private readonly agentService: AgentService) {}

  @Get('summary')
  async getSummary(@Req() req: any) {
    const agentId = req.user.id;
    return this.agentService.getCommissionsSummary(agentId);
  }

  @Get('ledger')
  async getLedger(@Req() req: any) {
    const agentId = req.user.id;
    return this.agentService.getCommissionsLedger(agentId);
  }

  @Get('payouts')
  async getPayouts(@Req() req: any) {
    const agentId = req.user.id;
    return this.agentService.getCommissionsPayouts(agentId);
  }

  @Get('rate-card')
  async getRateCard() {
    return this.agentService.getCommissionsRateCard();
  }
}
