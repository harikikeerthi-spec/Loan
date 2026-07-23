import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto, UpdateStatusDto, UpdatePriorityDto, AssignTicketDto } from './dto/update-ticket.dto';
import { CreateCommentDto, CreateCategoryDto, CreateTeamDto, UpdateSlaDto, CreateKBArticleDto } from './dto/create-comment.dto';
import { randomUUID } from 'crypto';

// Ticket status transitions
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  open: ['assigned', 'in_progress', 'closed'],
  assigned: ['in_progress', 'waiting_customer', 'resolved', 'closed'],
  in_progress: ['waiting_customer', 'resolved', 'closed'],
  waiting_customer: ['in_progress', 'resolved', 'closed'],
  resolved: ['closed', 'open'],
  closed: ['open'],
};

// Auto-assignment by category
const CATEGORY_TEAM_MAP: Record<string, string> = {
  'EVV': 'Finance Team',
  'OCR': 'OCR Team',
  'Digilocker': 'Integration Team',
  'Technical Issue': 'IT Team',
  'API Error': 'IT Team',
  'Payment': 'Finance Team',
  'Disbursement': 'Finance Team',
  'EMI': 'Finance Team',
  'Loan Application': 'Loan Processing Team',
  'Document Verification': 'Document Team',
  'Authentication': 'IT Team',
};

// SLA defaults in minutes
const SLA_DEFAULTS: Record<string, { responseMinutes: number; resolveMinutes: number }> = {
  critical: { responseMinutes: 30, resolveMinutes: 240 },
  high: { responseMinutes: 120, resolveMinutes: 480 },
  medium: { responseMinutes: 240, resolveMinutes: 1440 },
  low: { responseMinutes: 1440, resolveMinutes: 4320 },
};

@Injectable()
export class SupportService {
  private get db() {
    return this.supabase.getClient();
  }

  constructor(private supabase: SupabaseService) {}

  // ─── Ticket Number Generator ─────────────────────────────────────────────────
  private async generateTicketNumber(): Promise<string> {
    const { count } = await this.db
      .from('SupportTicket')
      .select('id', { count: 'exact', head: true });
    return `TKT-${String((count || 0) + 1).padStart(5, '0')}`;
  }

  // ─── SLA Deadline Calculator ─────────────────────────────────────────────────
  private async getSLADeadlines(priority: string, createdAt: Date) {
    const { data: slaConfig } = await this.db
      .from('SupportSLA')
      .select('responseMinutes, resolveMinutes')
      .eq('priority', priority)
      .single();

    const cfg = slaConfig || SLA_DEFAULTS[priority] || SLA_DEFAULTS.medium;
    const slaResponseAt = new Date(createdAt.getTime() + cfg.responseMinutes * 60 * 1000).toISOString();
    const slaResolveAt = new Date(createdAt.getTime() + cfg.resolveMinutes * 60 * 1000).toISOString();
    return { slaResponseAt, slaResolveAt };
  }

  // ─── Create Ticket ────────────────────────────────────────────────────────────
  async createTicket(dto: CreateTicketDto, user: any) {
    const ticketNumber = await this.generateTicketNumber();
    const now = new Date();
    const { slaResponseAt, slaResolveAt } = await this.getSLADeadlines(dto.priority || 'medium', now);
    const autoTeamName = CATEGORY_TEAM_MAP[dto.category] || null;
    const id = randomUUID();

    const ticketData = {
      id,
      ticketNumber,
      subject: dto.subject,
      description: dto.description,
      category: dto.category,
      priority: dto.priority || 'medium',
      status: 'open',
      source: 'web',
      createdById: user.id,
      createdByName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      createdByEmail: user.email,
      createdByRole: user.role,
      teamName: autoTeamName,
      loanApplicationId: dto.loanApplicationId || null,
      loanApplicationNum: dto.loanApplicationNum || null,
      loanStage: dto.loanStage || null,
      studentId: dto.studentId || null,
      studentName: dto.studentName || null,
      universityName: dto.universityName || null,
      slaResponseAt,
      slaResolveAt,
      slaBreached: false,
      tags: dto.tags || [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const { data: ticket, error } = await this.db
      .from('SupportTicket')
      .insert(ticketData)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // Log creation
    await this.db.from('SupportActivityLog').insert({
      id: randomUUID(),
      ticketId: id,
      actorId: user.id,
      actorName: ticketData.createdByName,
      action: 'created',
      newValue: 'open',
      createdAt: now.toISOString(),
    });

    // Create notification for admins
    await this.createNotification({
      ticketId: id,
      userId: user.id,
      title: `New Ticket: ${ticketNumber}`,
      message: `${ticketData.createdByName} created a ${dto.priority || 'medium'} priority ticket: "${dto.subject}"`,
      type: 'new_ticket',
    });

    return ticket;
  }

  // ─── List Tickets ─────────────────────────────────────────────────────────────
  async getTickets(query: any, user: any) {
    const {
      page = 1,
      limit = 25,
      search,
      status,
      priority,
      category,
      assignedToId,
      createdById,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    let q = this.db
      .from('SupportTicket')
      .select('*', { count: 'exact' });

    if (search) {
      q = q.or(
        `ticketNumber.ilike.%${search}%,subject.ilike.%${search}%,createdByName.ilike.%${search}%,createdByEmail.ilike.%${search}%,assignedToName.ilike.%${search}%,category.ilike.%${search}%,loanApplicationNum.ilike.%${search}%`
      );
    }

    if (status && status !== 'all') q = q.eq('status', status);
    if (priority && priority !== 'all') q = q.eq('priority', priority);
    const userRole = (user?.role || '').toLowerCase();
    const isStudentOnly = userRole === 'user';
    if (assignedToId) q = q.eq('assignedToId', assignedToId);
    if (createdById) {
      q = q.eq('createdById', createdById);
    } else if (isStudentOnly && user) {
      q = q.eq('createdById', user.id);
    }

    const col = sortBy === 'created_at' ? 'createdAt' : sortBy === 'updated_at' ? 'updatedAt' : sortBy;
    q = q.order(col, { ascending: sortOrder === 'asc' });
    q = q.range(from, to);

    const { data: tickets, count, error } = await q;
    if (error) throw new BadRequestException(error.message);

    // Get comment counts
    const ticketsWithCounts = await Promise.all(
      (tickets || []).map(async (ticket: any) => {
        const { count: commentCount } = await this.db
          .from('SupportComment')
          .select('id', { count: 'exact', head: true })
          .eq('ticketId', ticket.id);
        const { count: attachCount } = await this.db
          .from('SupportAttachment')
          .select('id', { count: 'exact', head: true })
          .eq('ticketId', ticket.id);
        return { ...ticket, _count: { comments: commentCount || 0, attachments: attachCount || 0 } };
      })
    );

    const total = count || 0;
    return {
      data: ticketsWithCounts,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  // ─── Get Single Ticket ────────────────────────────────────────────────────────
  async getTicket(id: string, user: any) {
    const { data: ticket, error } = await this.db
      .from('SupportTicket')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !ticket) throw new NotFoundException(`Ticket ${id} not found`);

    const isAdmin = ['admin', 'super_admin', 'staff', 'it', 'support', 'bank'].includes(user.role);

    let commentsQ = this.db
      .from('SupportComment')
      .select('*')
      .eq('ticketId', id)
      .order('created_at', { ascending: true });

    if (!isAdmin) {
      commentsQ = commentsQ.eq('isInternal', false);
    }

    const [
      { data: comments },
      { data: attachments },
      { data: activityLogs },
      { data: watchers },
    ] = await Promise.all([
      commentsQ,
      this.db.from('SupportAttachment').select('*').eq('ticketId', id).order('created_at', { ascending: true }),
      this.db.from('SupportActivityLog').select('*').eq('ticketId', id).order('created_at', { ascending: false }),
      this.db.from('SupportWatcher').select('*').eq('ticketId', id),
    ]);

    return { ...ticket, comments: comments || [], attachments: attachments || [], activityLogs: activityLogs || [], watchers: watchers || [] };
  }

  // ─── Update Ticket ────────────────────────────────────────────────────────────
  async updateTicket(id: string, dto: UpdateTicketDto, user: any) {
    const { data: ticket, error: findError } = await this.db
      .from('SupportTicket').select('id').eq('id', id).single();
    if (findError || !ticket) throw new NotFoundException(`Ticket ${id} not found`);

    const { data, error } = await this.db
      .from('SupportTicket')
      .update({ ...dto, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    await this.db.from('SupportActivityLog').insert({
      id: randomUUID(),
      ticketId: id,
      actorId: user.id,
      actorName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      action: 'updated',
      createdAt: new Date().toISOString(),
    });

    return data;
  }

  // ─── Update Status ────────────────────────────────────────────────────────────
  async updateStatus(id: string, dto: UpdateStatusDto, user: any) {
    const { data: ticket, error: findError } = await this.db
      .from('SupportTicket').select('*').eq('id', id).single();
    if (findError || !ticket) throw new NotFoundException(`Ticket ${id} not found`);

    const validNext = VALID_STATUS_TRANSITIONS[ticket.status] || [];
    if (!validNext.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from "${ticket.status}" to "${dto.status}". Valid: ${validNext.join(', ')}`
      );
    }

    const now = new Date().toISOString();
    const updatePayload: any = { status: dto.status, updatedAt: now };
    if (dto.status === 'resolved') updatePayload.resolvedAt = now;
    if (dto.status === 'closed') updatePayload.closedAt = now;
    if (dto.status === 'open' && ticket.status === 'closed') updatePayload.reopenedAt = now;

    const { data, error } = await this.db
      .from('SupportTicket')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    await this.db.from('SupportActivityLog').insert({
      id: randomUUID(),
      ticketId: id,
      actorId: user.id,
      actorName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      action: 'status_changed',
      oldValue: ticket.status,
      newValue: dto.status,
      createdAt: now,
    });

    await this.createNotification({
      ticketId: id,
      userId: ticket.createdById,
      title: `Ticket ${ticket.ticketNumber} Status Updated`,
      message: `Your ticket status changed from ${ticket.status} to ${dto.status}`,
      type: 'status_changed',
    });

    return data;
  }

  // ─── Update Priority ──────────────────────────────────────────────────────────
  async updatePriority(id: string, dto: UpdatePriorityDto, user: any) {
    const { data: ticket, error: findError } = await this.db
      .from('SupportTicket').select('*').eq('id', id).single();
    if (findError || !ticket) throw new NotFoundException(`Ticket ${id} not found`);

    const { slaResponseAt, slaResolveAt } = await this.getSLADeadlines(dto.priority, new Date(ticket.createdAt));

    const { data, error } = await this.db
      .from('SupportTicket')
      .update({ priority: dto.priority, slaResponseAt, slaResolveAt, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    await this.db.from('SupportActivityLog').insert({
      id: randomUUID(),
      ticketId: id,
      actorId: user.id,
      actorName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      action: 'priority_changed',
      oldValue: ticket.priority,
      newValue: dto.priority,
      createdAt: new Date().toISOString(),
    });

    return data;
  }

  // ─── Assign Ticket ────────────────────────────────────────────────────────────
  async assignTicket(id: string, dto: AssignTicketDto, user: any) {
    const { data: ticket, error: findError } = await this.db
      .from('SupportTicket').select('*').eq('id', id).single();
    if (findError || !ticket) throw new NotFoundException(`Ticket ${id} not found`);

    const newStatus = ticket.status === 'open' ? 'assigned' : ticket.status;

    const { data, error } = await this.db
      .from('SupportTicket')
      .update({
        assignedToId: dto.assignedToId || null,
        assignedToName: dto.assignedToName || null,
        teamId: dto.teamId || null,
        teamName: dto.teamName || null,
        departmentId: dto.departmentId || null,
        departmentName: dto.departmentName || null,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    await this.db.from('SupportActivityLog').insert({
      id: randomUUID(),
      ticketId: id,
      actorId: user.id,
      actorName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      action: 'assigned',
      oldValue: ticket.assignedToName || 'Unassigned',
      newValue: dto.assignedToName || dto.teamName || 'Unassigned',
      createdAt: new Date().toISOString(),
    });

    if (dto.assignedToId) {
      await this.createNotification({
        ticketId: id,
        userId: dto.assignedToId,
        title: `Ticket Assigned: ${ticket.ticketNumber}`,
        message: `You have been assigned ticket "${ticket.subject}"`,
        type: 'assigned',
      });
    }

    return data;
  }

  // ─── Add Comment ──────────────────────────────────────────────────────────────
  async addComment(ticketId: string, dto: CreateCommentDto, user: any) {
    const { data: ticket, error: findError } = await this.db
      .from('SupportTicket').select('*').eq('id', ticketId).single();
    if (findError || !ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);

    const isAdmin = ['admin', 'super_admin', 'staff'].includes(user.role);
    const isInternal = dto.isInternal && isAdmin;
    const now = new Date().toISOString();

    const { data: comment, error } = await this.db
      .from('SupportComment')
      .insert({
        id: randomUUID(),
        ticketId,
        authorId: user.id,
        authorName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        authorRole: user.role,
        content: dto.content,
        type: isInternal ? 'internal_note' : 'public',
        isInternal: isInternal || false,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // Update first response time
    if (isAdmin && !ticket.firstResponseAt) {
      await this.db.from('SupportTicket')
        .update({ firstResponseAt: now })
        .eq('id', ticketId);
    }

    await this.db.from('SupportActivityLog').insert({
      id: randomUUID(),
      ticketId,
      actorId: user.id,
      actorName: comment.authorName,
      action: isInternal ? 'internal_note_added' : 'commented',
      createdAt: now,
    });

    if (!isInternal) {
      await this.createNotification({
        ticketId,
        userId: ticket.createdById,
        title: `New Comment on ${ticket.ticketNumber}`,
        message: `${comment.authorName} replied to your ticket`,
        type: 'comment_added',
      });
    }

    return comment;
  }

  // ─── Dashboard Stats ──────────────────────────────────────────────────────────
  async getDashboard() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: totalTickets },
      { count: openTickets },
      { count: inProgressTickets },
      { count: resolvedToday },
      { count: criticalTickets },
      { count: overdueTickets },
      { data: recentTickets },
    ] = await Promise.all([
      this.db.from('SupportTicket').select('id', { count: 'exact', head: true }),
      this.db.from('SupportTicket').select('id', { count: 'exact', head: true }).in('status', ['open', 'assigned']),
      this.db.from('SupportTicket').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
      this.db.from('SupportTicket').select('id', { count: 'exact', head: true }).gte('resolvedAt', todayStart),
      this.db.from('SupportTicket').select('id', { count: 'exact', head: true }).eq('priority', 'critical').not('status', 'in', '("resolved","closed")'),
      this.db.from('SupportTicket').select('id', { count: 'exact', head: true }).lt('slaResolveAt', now.toISOString()).not('status', 'in', '("resolved","closed")'),
      this.db.from('SupportTicket').select('id,ticketNumber,subject,status,priority,createdByName,createdByRole,createdAt,category').order('created_at', { ascending: false }).limit(10),
    ]);

    // Category breakdown
    const { data: allTickets } = await this.db
      .from('SupportTicket')
      .select('category,priority,status')
      .gte('createdAt', last30);

    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    (allTickets || []).forEach((t: any) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    });

    // Daily trend
    const dailyTrend = await this.getDailyTrend(7);

    // Avg resolution time
    const { data: resolved } = await this.db
      .from('SupportTicket')
      .select('createdAt,resolvedAt')
      .not('resolvedAt', 'is', null)
      .limit(100);

    const avgResolutionHours = resolved && resolved.length > 0
      ? resolved.reduce((s: number, t: any) => s + (new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()) / 3600000, 0) / resolved.length
      : 0;

    const { data: withFirstResp } = await this.db
      .from('SupportTicket')
      .select('createdAt,firstResponseAt')
      .not('firstResponseAt', 'is', null)
      .limit(100);

    const avgFirstResponseHours = withFirstResp && withFirstResp.length > 0
      ? withFirstResp.reduce((s: number, t: any) => s + (new Date(t.firstResponseAt).getTime() - new Date(t.createdAt).getTime()) / 3600000, 0) / withFirstResp.length
      : 0;

    return {
      stats: {
        totalTickets: totalTickets || 0,
        openTickets: openTickets || 0,
        inProgressTickets: inProgressTickets || 0,
        resolvedToday: resolvedToday || 0,
        criticalTickets: criticalTickets || 0,
        overdueTickets: overdueTickets || 0,
        avgResolutionHours: Math.round(avgResolutionHours * 10) / 10,
        avgFirstResponseHours: Math.round(avgFirstResponseHours * 10) / 10,
        satisfactionScore: 4.2,
      },
      recentActivity: recentTickets || [],
      charts: {
        byCategory: Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, value]) => ({ label, value })),
        byPriority: Object.entries(byPriority).map(([label, value]) => ({ label, value })),
        byStatus: Object.entries(byStatus).map(([label, value]) => ({ label, value })),
        dailyTrend,
      },
    };
  }

  private async getDailyTrend(days: number) {
    const result: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();
      const { count } = await this.db
        .from('SupportTicket')
        .select('id', { count: 'exact', head: true })
        .gte('createdAt', start)
        .lt('createdAt', end);
      result.push({ date: start.split('T')[0], count: count || 0 });
    }
    return result;
  }

  // ─── Analytics ────────────────────────────────────────────────────────────────
  async getAnalytics(query: any) {
    const days = Number(query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data: tickets } = await this.db
      .from('SupportTicket')
      .select('category,priority,status,createdByRole')
      .gte('createdAt', since);

    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byRole: Record<string, number> = {};

    (tickets || []).forEach((t: any) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byRole[t.createdByRole] = (byRole[t.createdByRole] || 0) + 1;
    });

    return {
      byCategory: Object.entries(byCategory).map(([label, value]) => ({ label, value })),
      byPriority: Object.entries(byPriority).map(([label, value]) => ({ label, value })),
      byStatus: Object.entries(byStatus).map(([label, value]) => ({ label, value })),
      byRole: Object.entries(byRole).map(([label, value]) => ({ label, value })),
      dailyTrend: await this.getDailyTrend(Math.min(days, 30)),
    };
  }

  // ─── Categories ───────────────────────────────────────────────────────────────
  async getCategories() {
    const { data, error } = await this.db
      .from('SupportCategory')
      .select('*')
      .eq('isActive', true)
      .order('sortOrder', { ascending: true });
    if (error) return [];
    return data || [];
  }

  async createCategory(dto: CreateCategoryDto, user: any) {
    const slug = dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const now = new Date().toISOString();
    const { data, error } = await this.db.from('SupportCategory').insert({
      id: randomUUID(),
      name: dto.name,
      slug,
      description: dto.description || null,
      color: dto.color || '#6366f1',
      teamId: dto.teamId || null,
      isActive: true,
      isDefault: false,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    }).select().single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // ─── Teams ────────────────────────────────────────────────────────────────────
  async getTeams() {
    const { data } = await this.db
      .from('SupportTeam')
      .select('*')
      .eq('isActive', true)
      .order('name', { ascending: true });
    return data || [];
  }

  async createTeam(dto: CreateTeamDto, user: any) {
    const now = new Date().toISOString();
    const { data, error } = await this.db.from('SupportTeam').insert({
      id: randomUUID(),
      name: dto.name,
      description: dto.description || null,
      email: dto.email || null,
      color: dto.color || '#6366f1',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }).select().single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // ─── SLA ─────────────────────────────────────────────────────────────────────
  async getSLA() {
    const { data } = await this.db.from('SupportSLA').select('*').order('priority');
    if (!data || data.length === 0) {
      return Object.entries(SLA_DEFAULTS).map(([priority, cfg]) => ({
        priority, ...cfg, isActive: true,
      }));
    }
    return data;
  }

  async updateSLA(priority: string, dto: UpdateSlaDto, user: any) {
    const { data: existing } = await this.db.from('SupportSLA').select('id').eq('priority', priority).single();
    const now = new Date().toISOString();

    if (existing) {
      const { data } = await this.db.from('SupportSLA')
        .update({ responseMinutes: dto.responseMinutes, resolveMinutes: dto.resolveMinutes, updatedAt: now })
        .eq('priority', priority).select().single();
      return data;
    } else {
      const { data } = await this.db.from('SupportSLA').insert({
        id: randomUUID(), priority,
        responseMinutes: dto.responseMinutes,
        resolveMinutes: dto.resolveMinutes,
        isActive: true,
        updatedAt: now,
      }).select().single();
      return data;
    }
  }

  // ─── Attachments ─────────────────────────────────────────────────────────────
  async addAttachment(ticketId: string, file: Express.Multer.File, user: any) {
    const { data: ticket } = await this.db.from('SupportTicket').select('id').eq('id', ticketId).single();
    if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);

    const { data, error } = await this.db.from('SupportAttachment').insert({
      id: randomUUID(),
      ticketId,
      fileName: file.originalname,
      filePath: `/uploads/support/${file.filename}`,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedBy: user.id,
      uploadedByName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      createdAt: new Date().toISOString(),
    }).select().single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // ─── Knowledge Base ───────────────────────────────────────────────────────────
  async getKBArticles(query: any) {
    let q = this.db.from('KnowledgeBaseArticle').select('*').order('created_at', { ascending: false });
    if (query.published === 'true') q = q.eq('isPublished', true);
    if (query.category) q = q.eq('category', query.category);
    const { data } = await q;
    return data || [];
  }

  async createKBArticle(dto: CreateKBArticleDto, user: any) {
    const slug = dto.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
    const now = new Date().toISOString();
    const { data, error } = await this.db.from('KnowledgeBaseArticle').insert({
      id: randomUUID(),
      title: dto.title,
      slug,
      content: dto.content,
      category: dto.category,
      tags: dto.tags || [],
      isPublished: dto.isPublished || false,
      views: 0,
      authorId: user.id,
      authorName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      createdAt: now,
      updatedAt: now,
    }).select().single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // ─── Notifications ────────────────────────────────────────────────────────────
  async getNotifications(userId: string) {
    const { data } = await this.db
      .from('SupportNotification')
      .select('*')
      .eq('userId', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    return data || [];
  }

  async markNotificationRead(id: string) {
    const { data } = await this.db
      .from('SupportNotification')
      .update({ isRead: true, readAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return data;
  }

  private async createNotification(data: {
    ticketId: string;
    userId: string;
    title: string;
    message: string;
    type: string;
  }) {
    try {
      await this.db.from('SupportNotification').insert({
        id: randomUUID(),
        ticketId: data.ticketId,
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    } catch {
      // Non-critical
    }
  }
}
