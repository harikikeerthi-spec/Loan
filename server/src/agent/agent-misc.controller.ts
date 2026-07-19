import { Controller, Get, Post, Body, Req, Param, UseGuards } from '@nestjs/common';
import { ChatService } from '../chat/chat.service';
import { AgentGuard } from '../auth/agent.guard';
import * as fs from 'fs';
import * as path from 'path';

function getTicketsPath() {
  const dir = path.join(process.cwd(), 'scratch');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, 'agent_tickets.json');
}

function readTickets(agentId: string) {
  const file = getTicketsPath();
  if (!fs.existsSync(file)) return [];
  try {
    const list = JSON.parse(fs.readFileSync(file, 'utf8'));
    return list.filter((t: any) => t.agentId === agentId);
  } catch (e) {
    return [];
  }
}

function addTicket(agentId: string, ticket: any) {
  const file = getTicketsPath();
  let list: any[] = [];
  if (fs.existsSync(file)) {
    try {
      list = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {}
  }
  const newTicket = {
    id: `TCK-${Math.floor(100000 + Math.random() * 900000)}`,
    agentId,
    status: 'Open',
    createdAt: new Date().toISOString(),
    ...ticket
  };
  list.push(newTicket);
  fs.writeFileSync(file, JSON.stringify(list, null, 2), 'utf8');
  return newTicket;
}

@Controller()
@UseGuards(AgentGuard)
export class AgentMiscController {
  constructor(private readonly chatService: ChatService) {}

  @Get('chat/:staffId')
  async getChatMessages(@Req() req: any, @Param('staffId') staffId: string) {
    const agent = req.user;
    const conversation = await this.chatService.getOrCreateConversation(
      agent.phoneNumber || agent.mobile || '9999999999',
      agent.email,
      'staff',
      `${agent.firstName || ''} ${agent.lastName || ''}`.trim(),
      undefined,
      { staffId }
    );
    const messages = await this.chatService.getMessages(conversation.id);
    return { success: true, conversationId: conversation.id, messages };
  }

  @Post('chat/:staffId')
  async sendChatMessage(@Req() req: any, @Param('staffId') staffId: string, @Body() body: any) {
    const agent = req.user;
    const { content } = body;
    const conversation = await this.chatService.getOrCreateConversation(
      agent.phoneNumber || agent.mobile || '9999999999',
      agent.email,
      'staff',
      `${agent.firstName || ''} ${agent.lastName || ''}`.trim(),
      undefined,
      { staffId }
    );
    const message = await this.chatService.saveMessage({
      conversationId: conversation.id,
      senderType: 'agent',
      senderId: agent.id,
      content,
      senderName: `${agent.firstName || ''} ${agent.lastName || ''}`.trim()
    });
    return { success: true, data: message };
  }

  @Get('agent-scratch/tickets')
  async getTickets(@Req() req: any) {
    const agentId = req.user.id;
    const tickets = readTickets(agentId);
    return { success: true, tickets };
  }

  @Post('agent-scratch/tickets')
  async createTicket(@Req() req: any, @Body() body: any) {
    const agentId = req.user.id;
    const ticket = addTicket(agentId, {
      subject: body.subject,
      description: body.description,
      category: body.category
    });
    return { success: true, data: ticket };
  }
}
