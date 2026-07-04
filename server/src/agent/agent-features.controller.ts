import { Controller, Get, Post, Body, Req, Param, UseGuards } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentGuard } from '../auth/agent.guard';

@Controller()
@UseGuards(AgentGuard)
export class AgentFeaturesController {
  constructor(private readonly agentService: AgentService) {}

  // ─── Analytics ───

  @Get('analytics/funnel')
  async getFunnel(@Req() req: any) {
    const agentId = req.user.id;
    const data = await this.agentService.getFunnelAnalytics(agentId);
    return { success: true, data };
  }

  @Get('analytics/trend')
  async getTrend(@Req() req: any) {
    const agentId = req.user.id;
    const data = await this.agentService.getTrendAnalytics(agentId);
    return { success: true, data };
  }

  @Get('analytics/rejections')
  async getRejections(@Req() req: any) {
    const agentId = req.user.id;
    const data = await this.agentService.getRejectionsAnalytics(agentId);
    return { success: true, data };
  }

  @Get('analytics/leaderboard')
  async getLeaderboard(@Req() req: any) {
    const agentId = req.user.id;
    const data = await this.agentService.getLeaderboardAnalytics(agentId);
    return { success: true, data };
  }

  // ─── Tasks ───

  @Get('tasks')
  async getTasks(@Req() req: any) {
    const agentId = req.user.id;
    const data = await this.agentService.getTasks(agentId);
    return { success: true, data };
  }

  @Post('tasks')
  async createTask(@Req() req: any, @Body() body: any) {
    const agentId = req.user.id;
    return this.agentService.createTask(agentId, body);
  }

  @Post('tasks/:id/complete')
  async completeTask(@Req() req: any, @Param('id') id: string, @Body() body: { completed: boolean }) {
    const agentId = req.user.id;
    return this.agentService.completeTask(agentId, id, body.completed);
  }

  @Get('tasks/:id')
  async getTaskById(@Req() req: any, @Param('id') id: string) {
    const agentId = req.user.id;
    const data = await this.agentService.getTaskById(agentId, id);
    return { success: true, data };
  }

  // ─── Sub-Agents ───

  @Get('sub-agents')
  async getSubAgents(@Req() req: any) {
    const agentId = req.user.id;
    const data = await this.agentService.getSubAgents(agentId);
    return { success: true, data };
  }

  @Post('sub-agents/invite')
  async inviteSubAgent(@Req() req: any, @Body() body: any) {
    const agentId = req.user.id;
    return this.agentService.inviteSubAgent(agentId, body);
  }

  @Get('sub-agents/:id/performance')
  async getSubAgentPerformance(@Req() req: any, @Param('id') id: string) {
    const agentId = req.user.id;
    return this.agentService.getSubAgentPerformance(agentId, id);
  }

  // ─── Training ───

  @Get('training/modules')
  async getTrainingModules(@Req() req: any) {
    const agentId = req.user.id;
    const data = await this.agentService.getTrainingModules(agentId);
    return { success: true, data };
  }

  @Post('training/modules/:id/complete')
  async completeTrainingModule(@Req() req: any, @Param('id') id: string) {
    const agentId = req.user.id;
    return this.agentService.completeTrainingModule(agentId, id);
  }

  @Get('training/resources')
  async getTrainingResources() {
    const data = await this.agentService.getTrainingResources();
    return { success: true, data };
  }

  // ─── QR Code ───

  @Get('qr/my-code')
  async getQrCode(@Req() req: any) {
    const agentId = req.user.id;
    const data = await this.agentService.getQrCode(agentId);
    return { success: true, data };
  }

  @Get('qr/scan-analytics')
  async getQrScanAnalytics(@Req() req: any) {
    const agentId = req.user.id;
    const data = await this.agentService.getQrScanAnalytics(agentId);
    return { success: true, data };
  }

  // ─── Student Tracking Link (Agent Action) ───

  @Get('leads/:id/tracking-link')
  async getTrackingLink(@Req() req: any, @Param('id') id: string) {
    const agentId = req.user.id;
    const data = await this.agentService.generateTrackingLink(agentId, id);
    return { success: true, data };
  }

  @Post('leads/:id/tracking-link')
  async createTrackingLink(@Req() req: any, @Param('id') id: string) {
    const agentId = req.user.id;
    const data = await this.agentService.generateTrackingLink(agentId, id);
    return { success: true, data };
  }

  // ─── BT Leads ───

  @Get('bt-leads')
  async getBtLeads(@Req() req: any) {
    const agentId = req.user.id;
    const data = await this.agentService.getBtLeads(agentId);
    return { success: true, data };
  }

  @Post('bt-leads')
  async createBtLead(@Req() req: any, @Body() body: any) {
    const agentId = req.user.id;
    return this.agentService.createBtLead(agentId, body);
  }

  // ─── Alumni ───

  @Get('alumni')
  async getAlumni(@Req() req: any) {
    const agentId = req.user.id;
    const data = await this.agentService.getAlumniList(agentId);
    return { success: true, data };
  }

  @Get('alumni/:id/referral-link')
  async getAlumniReferralLink(@Req() req: any, @Param('id') id: string) {
    const agentId = req.user.id;
    const data = await this.agentService.getAlumniReferralLink(agentId, id);
    return { success: true, data };
  }

  @Get('referrals/analytics')
  async getReferralAnalytics(@Req() req: any) {
    const agentId = req.user.id;
    const data = await this.agentService.getReferralAnalytics(agentId);
    return { success: true, data };
  }
}
