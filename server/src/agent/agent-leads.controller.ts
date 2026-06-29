import { Controller, Get, Post, Body, Req, Query, UseGuards, Param } from '@nestjs/common';
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

  @Get(':id')
  async getLeadDetail(@Req() req: any, @Param('id') id: string) {
    const agentId = req.user.id;
    return this.agentService.getLeadDetail(agentId, id);
  }

  @Get(':id/documents')
  async getLeadDocuments(@Req() req: any, @Param('id') id: string) {
    const agentId = req.user.id;
    return this.agentService.getLeadDocuments(agentId, id);
  }

  @Get(':id/checklist')
  async getLeadChecklist(@Req() req: any, @Param('id') id: string) {
    const agentId = req.user.id;
    return this.agentService.getLeadChecklist(agentId, id);
  }

  @Post(':id/share-upload-link')
  async shareUploadLink(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const agentId = req.user.id;
    return this.agentService.shareUploadLink(agentId, id, body);
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
