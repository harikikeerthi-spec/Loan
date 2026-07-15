import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto, UpdateStatusDto, UpdatePriorityDto, AssignTicketDto } from './dto/update-ticket.dto';
import { CreateCommentDto, CreateCategoryDto, CreateTeamDto, UpdateSlaDto, CreateKBArticleDto } from './dto/create-comment.dto';
import { AdminGuard } from '../auth/admin.guard';
import { UserGuard } from '../auth/user.guard';

const uploadStorage = diskStorage({
  destination: join(__dirname, '..', '..', '..', 'uploads', 'support'),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
  },
});

@ApiTags('Support')
@ApiBearerAuth()
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // ─── Tickets ──────────────────────────────────────────────────────────────────

  @Post('tickets')
  @UseGuards(UserGuard)
  @ApiOperation({ summary: 'Create a new support ticket' })
  createTicket(@Body() dto: CreateTicketDto, @Request() req: any) {
    return this.supportService.createTicket(dto, req.user);
  }

  @Get('tickets')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'List all tickets with filters and pagination' })
  getTickets(@Query() query: any, @Request() req: any) {
    return this.supportService.getTickets(query, req.user);
  }

  @Get('tickets/:id')
  @UseGuards(UserGuard)
  @ApiOperation({ summary: 'Get a single ticket with full details' })
  getTicket(@Param('id') id: string, @Request() req: any) {
    return this.supportService.getTicket(id, req.user);
  }

  @Patch('tickets/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update ticket subject/description/category' })
  updateTicket(@Param('id') id: string, @Body() dto: UpdateTicketDto, @Request() req: any) {
    return this.supportService.updateTicket(id, dto, req.user);
  }

  @Patch('tickets/:id/status')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update ticket status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto, @Request() req: any) {
    return this.supportService.updateStatus(id, dto, req.user);
  }

  @Patch('tickets/:id/priority')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update ticket priority' })
  updatePriority(@Param('id') id: string, @Body() dto: UpdatePriorityDto, @Request() req: any) {
    return this.supportService.updatePriority(id, dto, req.user);
  }

  @Patch('tickets/:id/assign')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Assign ticket to an engineer or team' })
  assignTicket(@Param('id') id: string, @Body() dto: AssignTicketDto, @Request() req: any) {
    return this.supportService.assignTicket(id, dto, req.user);
  }

  @Post('tickets/:id/comment')
  @UseGuards(UserGuard)
  @ApiOperation({ summary: 'Add a public comment to a ticket' })
  addComment(@Param('id') id: string, @Body() dto: CreateCommentDto, @Request() req: any) {
    dto.isInternal = false;
    return this.supportService.addComment(id, dto, req.user);
  }

  @Post('tickets/:id/internal-note')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Add an internal note (admin only)' })
  addInternalNote(@Param('id') id: string, @Body() dto: CreateCommentDto, @Request() req: any) {
    dto.isInternal = true;
    return this.supportService.addComment(id, dto, req.user);
  }

  @Post('tickets/:id/attachment')
  @UseGuards(UserGuard)
  @UseInterceptors(FileInterceptor('file', { storage: uploadStorage }))
  @ApiOperation({ summary: 'Upload attachment to a ticket' })
  async uploadAttachment(
    @Param('id') ticketId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 })],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Request() req: any,
  ) {
    return this.supportService.addAttachment(ticketId, file, req.user);
  }

  // ─── Dashboard & Analytics ────────────────────────────────────────────────────

  @Get('dashboard')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get support center dashboard stats and KPIs' })
  getDashboard() {
    return this.supportService.getDashboard();
  }

  @Get('analytics')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get analytics data for charts' })
  getAnalytics(@Query() query: any) {
    return this.supportService.getAnalytics(query);
  }

  // ─── Categories ───────────────────────────────────────────────────────────────

  @Get('categories')
  @UseGuards(UserGuard)
  @ApiOperation({ summary: 'List all ticket categories' })
  getCategories() {
    return this.supportService.getCategories();
  }

  @Post('categories')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create a custom category' })
  createCategory(@Body() dto: CreateCategoryDto, @Request() req: any) {
    return this.supportService.createCategory(dto, req.user);
  }

  // ─── Teams ────────────────────────────────────────────────────────────────────

  @Get('teams')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'List all support teams' })
  getTeams() {
    return this.supportService.getTeams();
  }

  @Post('teams')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create a support team' })
  createTeam(@Body() dto: CreateTeamDto, @Request() req: any) {
    return this.supportService.createTeam(dto, req.user);
  }

  // ─── SLA ─────────────────────────────────────────────────────────────────────

  @Get('sla')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get SLA configuration' })
  getSLA() {
    return this.supportService.getSLA();
  }

  @Patch('sla/:priority')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update SLA config for a priority level' })
  updateSLA(@Param('priority') priority: string, @Body() dto: UpdateSlaDto, @Request() req: any) {
    return this.supportService.updateSLA(priority, dto, req.user);
  }

  // ─── Knowledge Base ───────────────────────────────────────────────────────────

  @Get('knowledge-base')
  @UseGuards(UserGuard)
  @ApiOperation({ summary: 'List knowledge base articles' })
  getKBArticles(@Query() query: any) {
    return this.supportService.getKBArticles(query);
  }

  @Post('knowledge-base')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create a knowledge base article' })
  createKBArticle(@Body() dto: CreateKBArticleDto, @Request() req: any) {
    return this.supportService.createKBArticle(dto, req.user);
  }

  // ─── Notifications ────────────────────────────────────────────────────────────

  @Get('notifications')
  @UseGuards(UserGuard)
  @ApiOperation({ summary: 'Get notifications for current user' })
  getNotifications(@Request() req: any) {
    return this.supportService.getNotifications(req.user.id);
  }

  @Patch('notifications/:id/read')
  @UseGuards(UserGuard)
  @ApiOperation({ summary: 'Mark notification as read' })
  markRead(@Param('id') id: string) {
    return this.supportService.markNotificationRead(id);
  }
}
