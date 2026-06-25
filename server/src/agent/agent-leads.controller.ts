import { Controller, Get, Post, Body, Req, Query, UseGuards } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentGuard } from '../auth/agent.guard';

@Controller('leads')
@UseGuards(AgentGuard)
export class AgentLeadsController {
  constructor(private readonly agentService: AgentService) {}

  @Get()
  async getLeads(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('loanType') loanType?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const agentId = req.user.id;
    return this.agentService.getLeads(agentId, search, status, loanType, page, limit);
  }

  @Post()
  async createLead(@Req() req: any, @Body() body: any) {
    const agentId = req.user.id;
    return this.agentService.createLead(agentId, body);
  }

  @Post('bulk-import')
  async bulkImport(@Req() req: any, @Body() body: { leads: any[] }) {
    const agentId = req.user.id;
    const leads = body?.leads || [];
    return this.agentService.bulkImport(agentId, leads);
  }
}

@Controller('eligibility')
@UseGuards(AgentGuard)
export class AgentEligibilityController {
  constructor(private readonly agentService: AgentService) {}

  @Post('check')
  async checkEligibility(@Body() body: any) {
    return this.agentService.checkEligibility(body);
  }
}
