import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { StaffGuard } from '../auth/staff.guard';
import { ReassignLoanDto, BulkReassignDto, LockApplicationDto, UpdateStaffAvailabilityDto } from './dto/assign.dto';

@Controller('assignment')
@UseGuards(StaffGuard)
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  /**
   * Trigger round-robin assignment for a single loan application.
   * POST /assignment/assign/:loanId
   */
  @Post('assign/:loanId')
  async assignLoan(
    @Param('loanId') loanId: string,
    @Req() req: any,
  ) {
    const triggeredBy = req.user?.id || req.user?.uid || 'staff';
    const result = await this.assignmentService.assignLoan(loanId, triggeredBy);
    return { success: result.success, data: result };
  }

  /**
   * Assign ALL currently unassigned loan applications via round-robin.
   * POST /assignment/assign-all-unassigned
   * Useful for backfill on startup or after adding new staff members.
   */
  @Post('assign-all-unassigned')
  async assignAllUnassigned(@Req() req: any) {
    const triggeredBy = req.user?.id || req.user?.uid || 'system';
    const result = await this.assignmentService.assignAllUnassigned(triggeredBy);
    return { success: true, data: result };
  }

  @Post('reassign/:loanId')
  async reassignLoan(
    @Param('loanId') loanId: string,
    @Body() dto: ReassignLoanDto,
    @Req() req: any,
  ) {
    const assignedBy = req.user?.id || req.user?.uid || 'manager';
    const result = await this.assignmentService.reassignLoan(
      loanId,
      dto.toStaffId,
      dto.reason || 'manual',
      assignedBy
    );
    return result;
  }

  @Post('bulk-reassign')
  async bulkReassignLoans(
    @Body() dto: BulkReassignDto,
    @Req() req: any,
  ) {
    const assignedBy = req.user?.id || req.user?.uid || 'admin';
    return await this.assignmentService.bulkReassignLoans(
      dto.loanIds,
      dto.toStaffId,
      dto.reason || 'bulk_reassign_admin',
      assignedBy
    );
  }

  @Post('lock/:loanId')
  async lockApplication(
    @Param('loanId') loanId: string,
    @Body() dto: LockApplicationDto,
    @Req() req: any,
  ) {
    const staffId = dto.staffId || req.user?.id || 'staff';
    return await this.assignmentService.lockApplication(loanId, staffId);
  }

  @Get('my-applications')
  async getMyApplications(
    @Req() req: any,
    @Query('staffId') staffIdQuery?: string,
    @Query('status') status?: string,
    @Query('includeUnassigned') includeUnassignedQuery?: string,
  ) {
    const staffId = staffIdQuery || req.user?.id || req.user?.uid;
    const includeUnassigned = includeUnassignedQuery === 'true' || includeUnassignedQuery === '1';
    const applications = await this.assignmentService.getMyApplications(staffId, status, includeUnassigned);
    return { success: true, data: applications, count: applications.length };
  }

  @Get('team-dashboard')
  async getTeamWorkloadSummary() {
    const summary = await this.assignmentService.getTeamWorkloadSummary();
    return { success: true, data: summary };
  }

  @Get('unassigned-queue')
  async getUnassignedQueue() {
    const queue = await this.assignmentService.getUnassignedQueue();
    return { success: true, data: queue, count: queue.length };
  }

  @Get('history')
  async getAssignmentHistory(@Query('loanId') loanId?: string) {
    const history = await this.assignmentService.getAssignmentHistory(loanId);
    return { success: true, data: history };
  }

  @Get('history/:loanId')
  async getLoanAssignmentHistory(@Param('loanId') loanId: string) {
    const history = await this.assignmentService.getAssignmentHistory(loanId);
    return { success: true, data: history };
  }

  @Patch('staff/:staffId/availability')
  async updateStaffAvailability(
    @Param('staffId') staffId: string,
    @Body() dto: UpdateStaffAvailabilityDto,
  ) {
    const result = await this.assignmentService.updateStaffAvailability(staffId, dto);
    return { success: true, data: result };
  }
}
