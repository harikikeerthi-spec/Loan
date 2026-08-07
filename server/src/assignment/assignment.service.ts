import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { EmailService } from '../auth/email.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class AssignmentService {
  private readonly logger = new Logger(AssignmentService.name);

  private get db() {
    return this.supabase.getClient();
  }

  constructor(
    private readonly supabase: SupabaseService,
    private readonly emailService: EmailService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('application.created')
  async handleApplicationCreated(payload: any) {
    if (payload?.applicationId) {
      this.logger.log(`[AssignmentEngine] Auto-assigning application.created event for loan: ${payload.applicationId}`);
      try {
        await this.assignLoan(payload.applicationId, 'auto_assign_event');
      } catch (err: any) {
        this.logger.error(`[AssignmentEngine] Auto-assign on application.created failed for ${payload.applicationId}: ${err?.message}`);
      }
    }
  }

  @OnEvent('application.submitted')
  async handleApplicationSubmitted(payload: any) {
    if (payload?.applicationId) {
      this.logger.log(`[AssignmentEngine] Auto-assigning application.submitted event for loan: ${payload.applicationId}`);
      try {
        await this.assignLoan(payload.applicationId, 'auto_assign_event');
      } catch (err: any) {
        this.logger.error(`[AssignmentEngine] Auto-assign on application.submitted failed for ${payload.applicationId}: ${err?.message}`);
      }
    }
  }

  async assignLoan(loanId: string, triggeredBy = 'system'): Promise<{ success: boolean; assignedStaffId?: string; message?: string }> {
    this.logger.log(`[AssignmentEngine] Attempting round-robin assignment for loan application: ${loanId}`);

    let loan: any = null;
    let loanErr: any = null;

    try {
      const res1 = await this.db
        .from('LoanApplication')
        .select('id, applicationNumber, assignedStaffId, loanType, bank, firstName, lastName, email')
        .eq('id', loanId)
        .maybeSingle();
      if (res1.data) {
        loan = res1.data;
      } else {
        const res2 = await this.db
          .from('LoanApplication')
          .select('id, applicationNumber, assignedStaffId, loanType, bank, firstName, lastName, email')
          .eq('applicationNumber', loanId)
          .maybeSingle();
        loan = res2.data;
        loanErr = res2.error;
      }
    } catch (err) {
      loanErr = err;
    }

    if (!loan) {
      this.logger.error(`[AssignmentEngine] Loan fetch error for ${loanId}:`, loanErr);
      throw new NotFoundException(`Loan application ${loanId} not found`);
    }

    const currAssigned = (loan.assignedStaffId || '').trim().toLowerCase();
    if (currAssigned && currAssigned !== 'unassigned' && currAssigned !== 'null' && currAssigned !== 'undefined') {
      return { success: false, assignedStaffId: loan.assignedStaffId, message: 'Application is already assigned' };
    }

    const eligibleStaff = await this.getEligibleStaff(loan.loanType);

    if (!eligibleStaff || eligibleStaff.length === 0) {
      return { success: false, message: 'No eligible staff members available at this moment' };
    }

    // 1. Fetch tracker for last assigned staff pointer
    let lastAssignedStaffId: string | null = null;
    try {
      const { data: tracker } = await this.db
        .from('AssignmentTracker')
        .select('lastAssignedStaffId')
        .eq('scope', 'global')
        .maybeSingle();
      if (tracker?.lastAssignedStaffId) {
        lastAssignedStaffId = tracker.lastAssignedStaffId;
      }
    } catch (_) {}

    let nextIndex = 0;
    if (lastAssignedStaffId) {
      const currentIndex = eligibleStaff.findIndex(
        s => s.id === lastAssignedStaffId
          || s.linkedUserId === lastAssignedStaffId
          || (s.email && s.email.toLowerCase() === lastAssignedStaffId.toLowerCase())
      );
      if (currentIndex !== -1) {
        nextIndex = (currentIndex + 1) % eligibleStaff.length;
        this.logger.log(`[AssignmentEngine] Pure Sequential RR — Last assigned: ${lastAssignedStaffId} (idx ${currentIndex}). Next target idx ${nextIndex}`);
      } else {
        this.logger.log(`[AssignmentEngine] Pure Sequential RR — Last assigned ${lastAssignedStaffId} not found in current staff list. Starting at idx 0`);
        nextIndex = 0;
      }
    } else {
      this.logger.log(`[AssignmentEngine] Pure Sequential RR — No tracker found. Starting sequence at idx 0`);
      nextIndex = 0;
    }

    this.logger.log(
      `[AssignmentEngine] Staff sequence (${eligibleStaff.length}): ${eligibleStaff
        .map((s, idx) => `[${idx}] ${s.email}`)
        .join(', ')}`
    );

    const selectedStaff = eligibleStaff[nextIndex];
    this.logger.log(`[AssignmentEngine] SELECTED STAFF [idx ${nextIndex}]: ${selectedStaff.email}`);

    const staffUserId = selectedStaff.linkedUserId || selectedStaff.assignedStaffId || selectedStaff.id;
    const staffName = `${selectedStaff.linkedUser?.firstName || selectedStaff.firstName || ''} ${selectedStaff.linkedUser?.lastName || selectedStaff.lastName || ''}`.trim() || selectedStaff.email || 'Staff Member';
    const staffEmail = selectedStaff.linkedUser?.email || selectedStaff.email || '';
    const now = new Date().toISOString();

    let assignSuccess = false;

    // STEP 1 — Critical write: assignedStaffId (the only field we MUST set for routing)
    // This uses only the base column guaranteed to exist in the DB schema.
    const { data: updateRes, error: updateErr } = await this.db
      .from('LoanApplication')
      .update({ assignedStaffId: staffUserId })
      .eq('id', loan.id)
      .select('id, assignedStaffId')
      .maybeSingle();

    if (updateErr || !updateRes) {
      this.logger.error(`[AssignmentEngine] Critical assignedStaffId write failed for loan ${loan.id}:`, updateErr);
      return { success: false, message: 'Loan assignment failed: ' + (updateErr?.message || 'unknown error') };
    }

    // STEP 2 — Optional write: extended metadata columns (may fail if schema cache is stale — non-fatal)
    try {
      await this.db
        .from('LoanApplication')
        .update({
          assignedStaffName: staffName,
          assignedStaffEmail: staffEmail,
          processingStaff: staffName,
          assignmentStatus: 'assigned',
          lastActivityAt: now,
        })
        .eq('id', loan.id);
    } catch (metaErr: any) {
      this.logger.warn(`[AssignmentEngine] Extended metadata write skipped (schema cache may be stale): ${metaErr?.message}`);
    }

    const currentWork = selectedStaff.currentWorkload || 0;
    try {
      await this.db
        .from('StaffProfile')
        .update({ currentWorkload: currentWork + 1 })
        .eq('id', selectedStaff.id);
    } catch (_) {}

    try {
      await this.db.from('LoanAssignmentHistory').insert({
        applicationId: loanId,
        fromStaffId: null,
        toStaffId: staffUserId,
        assignedBy: triggeredBy,
        reason: 'round_robin',
        createdAt: now,
      });
    } catch (_) {}

    assignSuccess = true;

    if (assignSuccess) {
      await this.db
        .from('AssignmentTracker')
        .upsert({
          scope: 'global',
          lastAssignedStaffId: staffUserId,
          updatedAt: now,
        }, { onConflict: 'scope' });

      try {
        if (selectedStaff.linkedUser?.email) {
          await this.emailService.sendMail(
            selectedStaff.linkedUser.email,
            'New Loan Application Assigned to You',
            `<p>Hello ${selectedStaff.linkedUser.firstName || 'Team Member'},</p>
             <p>Loan Application <strong>#${loan.applicationNumber || loanId}</strong> (${loan.firstName} ${loan.lastName}) has been assigned to you.</p>
             <p>Please review and begin processing.</p>`
          );
        }
      } catch (notifyErr: any) {
        this.logger.error(`Failed to send assignment notification email: ${notifyErr.message}`);
      }

      // Emit event so NotificationService creates an in-app notification
      // strictly for the assigned staff member only
      try {
        this.eventEmitter.emit('loan.assigned', {
          assignedStaffId: staffUserId,
          staffName: `${selectedStaff.linkedUser?.firstName || ''} ${selectedStaff.linkedUser?.lastName || ''}`.trim() || 'Staff Member',
          loanId,
          applicationNumber: loan.applicationNumber,
          candidateName: `${loan.firstName || ''} ${loan.lastName || ''}`.trim() || loan.email || 'Applicant',
          bank: loan.bank,
          loanType: loan.loanType,
          assignedBy: triggeredBy,
        });
      } catch (emitErr: any) {
        this.logger.error(`Failed to emit loan.assigned event: ${emitErr.message}`);
      }

      return { success: true, assignedStaffId: staffUserId, message: 'Application assigned successfully' };
    }

    return { success: false, message: 'Assignment process failed' };
  }

  async getEligibleStaff(loanType?: string): Promise<any[]> {
    const staffMap = new Map<string, any>();

    // 1. Fetch from StaffProfile table — only profiles linked to staff role users
    try {
      const { data: profiles } = await this.db
        .from('StaffProfile')
        .select('*, linkedUser:User!linkedUserId(id, firstName, lastName, email, role, createdAt)');

      if (profiles && profiles.length > 0) {
        for (const p of profiles) {
          const linkedRole = (p.linkedUser?.role || '').toLowerCase();
          // Skip admin/super_admin linked profiles — only pure 'staff' role
          if (linkedRole && linkedRole !== 'staff') continue;

          const uid = p.linkedUserId || p.id;
          const email = p.linkedUser?.email || p.email;
          if (uid) {
            staffMap.set(uid.toLowerCase(), {
              id: p.id,
              linkedUserId: uid,
              email: email,
              role: p.linkedUser?.role || 'staff',
              linkedUser: p.linkedUser || { id: uid, email },
              isAvailable: p.isAvailable !== false,
              isOnLeave: p.isOnLeave === true,
              // FIX: include resignation fields so resigned staff are properly excluded
              isResigned: p.isResigned === true,
              status: p.status || 'active',
              currentWorkload: p.currentWorkload || 0,
              createdAt: p.createdAt || p.linkedUser?.createdAt || '1970-01-01T00:00:00.000Z',
            });
          }
        }
      }
    } catch (err) {
      this.logger.warn(`[AssignmentEngine] Could not query StaffProfile table: ${err}`);
    }

    // 2. Fetch all Users with STAFF role only from User table (admins must not receive loan assignments)
    try {
      const { data: users } = await this.db
        .from('User')
        .select('id, email, firstName, lastName, role, createdAt');

      if (users && users.length > 0) {
        for (const u of users) {
          const roleLower = (u.role || '').toLowerCase();
          // Only include pure 'staff' role — NOT admin or super_admin
          const isStaffOnly = roleLower === 'staff';
          if (!isStaffOnly) continue;

          const uidKey = u.id?.toLowerCase();
          const emailKey = u.email?.toLowerCase();
          
          const alreadyExists = (uidKey && staffMap.has(uidKey)) ||
            (emailKey && Array.from(staffMap.values()).some(s => s.email?.toLowerCase() === emailKey));

          if (!alreadyExists) {
            staffMap.set(u.id.toLowerCase(), {
              id: u.id,
              linkedUserId: u.id,
              email: u.email,
              role: u.role,
              linkedUser: u,
              isAvailable: true,
              isOnLeave: false,
              createdAt: u.createdAt || '1970-01-01T00:00:00.000Z',
            });
          }
        }
      }
    } catch (err) {
      this.logger.warn(`[AssignmentEngine] Could not query User table: ${err}`);
    }

    const staffList = Array.from(staffMap.values());
    let eligible = staffList.filter(staff => {
      const isAvailable = staff.isAvailable !== false;
      const isOnLeave = staff.isOnLeave === true;
      const isResigned = staff.isResigned === true || ['resigned', 'inactive', 'invalid'].includes((staff.status || '').toLowerCase());
      return isAvailable && !isOnLeave && !isResigned;
    });

    if (eligible.length === 0) {
      eligible = staffList;
    }

    // Sort by createdAt ASC — oldest staff members first (Staff V -> Loans Staff -> Kiran Staff -> new staff)
    return eligible.sort((a, b) => {
      const tA = new Date(a.createdAt || 0).getTime();
      const tB = new Date(b.createdAt || 0).getTime();
      if (tA !== tB) return tA - tB;
      return (a.email || '').toLowerCase().localeCompare((b.email || '').toLowerCase());
    });
  }

  async reassignLoan(
    loanId: string,
    toStaffId: string,
    reason: string = 'manual',
    assignedBy: string = 'system'
  ): Promise<{ success: boolean; message: string }> {
    // Guard against reassigning sanctioned / approved applications
    const { data: currentLoan } = await this.db
      .from('LoanApplication')
      .select('assignedStaffId, status')
      .eq('id', loanId)
      .maybeSingle();

    const currentStatus = (currentLoan?.status || '').toLowerCase();
    const sanctionedStatuses = [
      'sanctioned',
      'conditional_sanction',
      'partial_sanction',
      'disbursed',
      'partially_disbursed',
      'approved',
    ];
    if (currentLoan && sanctionedStatuses.includes(currentStatus)) {
      return {
        success: false,
        message: 'Cannot reassign loan application: Application has already been sanctioned/approved and is permanently locked to the assigned staff member.',
      };
    }

    let targetStaffUserId = toStaffId;

    if (toStaffId === 'auto' || toStaffId === 'round_robin') {
      const eligibleStaff = await this.getEligibleStaff();
      if (!eligibleStaff || eligibleStaff.length === 0) {
        return { success: false, message: 'No eligible staff members available for reassignment' };
      }
      const { data: activeApps } = await this.db
        .from('LoanApplication')
        .select('id, assignedStaffId, status')
        .not('status', 'in', '("rejected","cancelled","draft","closed")');
      const appList = activeApps || [];

      for (const staff of eligibleStaff) {
        const uid = (staff.linkedUserId || '').toLowerCase();
        const sid = (staff.id || '').toLowerCase();
        const semail = (staff.email || '').toLowerCase();

        const count = appList.filter((app: any) => {
          const target = (app.assignedStaffId || '').trim().toLowerCase();
          if (!target) return false;
          return target === uid || target === sid || target === semail;
        }).length;

        staff.liveWorkload = count;
      }
      eligibleStaff.sort((a, b) => {
        if (a.liveWorkload !== b.liveWorkload) return a.liveWorkload - b.liveWorkload;
        return (a.email || '').toLowerCase().localeCompare((b.email || '').toLowerCase());
      });
      const selected = eligibleStaff[0];
      targetStaffUserId = selected.linkedUserId || selected.assignedStaffId || selected.id;
    }

    try {
      const { data: rpcRes, error: rpcErr } = await this.db.rpc('reassign_loan_atomic', {
        p_loan_id: loanId,
        p_new_staff_id: targetStaffUserId,
        p_assigned_by: assignedBy,
        p_reason: reason,
      });

      if (!rpcErr && rpcRes && rpcRes.success) {
        return { success: true, message: `Loan successfully reassigned to ${targetStaffUserId}` };
      }
    } catch (err) {
      this.logger.warn(`[AssignmentEngine] RPC reassign_loan_atomic failed. Fallback manual update.`);
    }

    const { data: oldLoan } = await this.db
      .from('LoanApplication')
      .select('assignedStaffId')
      .eq('id', loanId)
      .single();

    const previousStaffId = oldLoan?.assignedStaffId;
    const now = new Date().toISOString();

    let targetStaffName = 'Staff Member';
    let targetStaffEmail = '';
    try {
      const { data: targetUser } = await this.db
        .from('User')
        .select('id, firstName, lastName, email')
        .or(`id.eq.${targetStaffUserId},email.eq.${targetStaffUserId}`)
        .maybeSingle();

      if (targetUser) {
        targetStaffName = `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || targetUser.email || 'Staff Member';
        targetStaffEmail = targetUser.email || '';
      }
    } catch (_) {}

    // STEP 1 — Critical write: assignedStaffId only (guaranteed column)
    const { error: reassignErr } = await this.db
      .from('LoanApplication')
      .update({ assignedStaffId: targetStaffUserId })
      .eq('id', loanId);

    if (reassignErr) {
      this.logger.error(`[AssignmentEngine] reassignLoan critical write failed for ${loanId}:`, reassignErr);
    }

    // STEP 2 — Optional extended metadata write (non-fatal if schema cache stale)
    try {
      await this.db
        .from('LoanApplication')
        .update({
          assignedStaffName: targetStaffName,
          assignedStaffEmail: targetStaffEmail,
          processingStaff: targetStaffName,
          assignmentStatus: 'assigned',
          lastActivityAt: now,
        })
        .eq('id', loanId);
    } catch (metaErr: any) {
      this.logger.warn(`[AssignmentEngine] reassignLoan extended metadata write skipped: ${metaErr?.message}`);
    }

    if (previousStaffId) {
      const { data: oldStaff } = await this.db.from('StaffProfile').select('currentWorkload').eq('linkedUserId', previousStaffId).maybeSingle();
      if (oldStaff) {
        await this.db.from('StaffProfile').update({ currentWorkload: Math.max((oldStaff.currentWorkload || 1) - 1, 0) }).eq('linkedUserId', previousStaffId);
      }
    }

    const { data: newStaff } = await this.db.from('StaffProfile').select('currentWorkload').eq('linkedUserId', targetStaffUserId).maybeSingle();
    if (newStaff) {
      await this.db.from('StaffProfile').update({ currentWorkload: (newStaff.currentWorkload || 0) + 1 }).eq('linkedUserId', targetStaffUserId);
    }

    await this.db.from('LoanAssignmentHistory').insert({
      applicationId: loanId,
      fromStaffId: previousStaffId || null,
      toStaffId: targetStaffUserId,
      assignedBy,
      reason,
      createdAt: now,
    });

    return { success: true, message: 'Loan application reassigned successfully' };
  }

  async bulkReassignLoans(
    loanIds: string[],
    toStaffId: string,
    reason: string = 'bulk_reassign_admin',
    assignedBy: string = 'admin'
  ): Promise<{ success: boolean; count: number; message: string }> {
    if (!loanIds || !Array.isArray(loanIds) || loanIds.length === 0) {
      return { success: false, count: 0, message: 'No applications specified for bulk reassign' };
    }

    let successCount = 0;

    for (const loanId of loanIds) {
      try {
        const res = await this.reassignLoan(loanId, toStaffId, reason, assignedBy);
        if (res.success) successCount++;
      } catch (err) {
        this.logger.error(`[BulkReassign] Failed to reassign loan ${loanId}:`, err);
      }
    }

    return {
      success: true,
      count: successCount,
      message: `Successfully reassigned ${successCount} application(s).`,
    };
  }


  async lockApplication(loanId: string, staffId: string): Promise<{ success: boolean; message: string; lockedBy?: string }> {
    const { data: loan } = await this.db
      .from('LoanApplication')
      .select('assignedStaffId, lockedAt, lockedByStaffId')
      .eq('id', loanId)
      .single();

    if (!loan) throw new NotFoundException('Loan application not found');

    if (loan.assignedStaffId && loan.assignedStaffId !== staffId) {
      return {
        success: false,
        message: `This application is assigned to another staff member (${loan.assignedStaffId}).`,
        lockedBy: loan.assignedStaffId,
      };
    }

    const now = new Date().toISOString();
    await this.db
      .from('LoanApplication')
      .update({
        lockedAt: now,
        lockedByStaffId: staffId,
        lastActivityAt: now,
      })
      .eq('id', loanId);

    return { success: true, message: 'Application locked for editing' };
  }

  /**
   * Enforces exclusive staff access: Once an application is assigned to a staff member,
   * only that staff member can access/edit it until completion (or formal reassignment).
   */
  async verifyStaffAccess(loanId: string, staffId: string): Promise<boolean> {
    const { data: loan, error } = await this.db
      .from('LoanApplication')
      .select('id, assignedStaffId')
      .eq('id', loanId)
      .single();

    if (error || !loan) {
      throw new NotFoundException(`Loan application ${loanId} not found`);
    }

    if (loan.assignedStaffId && loan.assignedStaffId !== staffId) {
      throw new ForbiddenException(
        `Access Denied: This application is exclusively assigned to staff member ${loan.assignedStaffId}.`
      );
    }

    return true;
  }

  async checkInactivityAndReassign(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 48);

    const { data: inactiveLoans, error } = await this.db
      .from('LoanApplication')
      .select('id, assignedStaffId, lastActivityAt, updatedAt')
      .not('assignedStaffId', 'is', null)
      .neq('status', 'approved')
      .neq('status', 'rejected')
      .neq('status', 'disbursed')
      .lt('lastActivityAt', cutoffDate.toISOString());

    if (error || !inactiveLoans || inactiveLoans.length === 0) {
      return;
    }

    for (const loan of inactiveLoans) {
      const eligibleStaff = await this.getEligibleStaff();
      const candidates = eligibleStaff.filter(s => s.linkedUserId !== loan.assignedStaffId && s.id !== loan.assignedStaffId);

      if (candidates.length > 0) {
        const targetStaff = candidates[0];
        const newStaffId = targetStaff.linkedUserId || targetStaff.id;
        await this.reassignLoan(loan.id, newStaffId, 'inactivity_timeout_48h', 'system_cron');
      }
    }
  }

  async getMyApplications(staffId: string, statusFilter?: string, includeUnassigned: boolean = false): Promise<any[]> {
    // staffId might be a UUID or a custom ID like VL-STU-2026-xxxxx.
    // Try matching assignedStaffId by both the raw staffId AND the staff's email
    // by first resolving who this user actually is.
    let resolvedIds: string[] = [staffId];

    try {
      const { data: staffUser } = await this.db
        .from('User')
        .select('id, email')
        .or(`id.eq.${staffId},email.eq.${staffId}`)
        .maybeSingle();

      if (staffUser) {
        resolvedIds = Array.from(new Set([...resolvedIds, staffUser.id, staffUser.email].filter(Boolean)));
      }
    } catch (_) {}

    try {
      const { data: profile } = await this.db
        .from('StaffProfile')
        .select('id, linkedUserId, email')
        .or(`id.eq.${staffId},linkedUserId.eq.${staffId},email.eq.${staffId}`)
        .maybeSingle();

      if (profile) {
        resolvedIds = Array.from(new Set([...resolvedIds, profile.id, profile.linkedUserId, profile.email].filter(Boolean)));
      }
    } catch (_) {}

    // Build OR filter across all resolved IDs
    const orConditions = resolvedIds.map(id => `assignedStaffId.eq.${id}`);
    if (includeUnassigned) {
      orConditions.push('assignedStaffId.is.null');
    }
    const orFilter = orConditions.join(',');

    let query = this.db
      .from('LoanApplication')
      .select('*, user:User!userId(id, firstName, lastName, email, mobile)')
      .or(orFilter)
      .order('updatedAt', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async getTeamWorkloadSummary(): Promise<any[]> {
    const { data: staffProfiles, error } = await this.db
      .from('StaffProfile')
      .select('*, linkedUser:User!linkedUserId(id, firstName, lastName, email)');

    if (error) throw new BadRequestException(error.message);

    const result = await Promise.all((staffProfiles || []).map(async (staff) => {
      const staffUserId = staff.linkedUserId || staff.id;
      const { count } = await this.db
        .from('LoanApplication')
        .select('*', { count: 'exact', head: true })
        .eq('assignedStaffId', staffUserId);

      return {
        id: staff.id,
        linkedUserId: staffUserId,
        name: `${staff.linkedUser?.firstName || ''} ${staff.linkedUser?.lastName || ''}`.trim() || 'Staff Member',
        email: staff.linkedUser?.email || '',
        isAvailable: staff.isAvailable !== false,
        isOnLeave: staff.isOnLeave === true,
        currentWorkload: count || staff.currentWorkload || 0,
        maxWorkload: staff.maxWorkload || 20,
        specialization: staff.specialization || [],
      };
    }));

    return result;
  }

  async getUnassignedQueue(): Promise<any[]> {
    const { data, error } = await this.db
      .from('LoanApplication')
      .select('*, user:User!userId(id, firstName, lastName, email)')
      .is('assignedStaffId', null)
      .order('date', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async getAssignmentHistory(loanId?: string): Promise<any[]> {
    let query = this.db
      .from('LoanAssignmentHistory')
      .select('*')
      .order('createdAt', { ascending: false });

    if (loanId) {
      query = query.eq('applicationId', loanId);
    }

    const { data, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return data || [];
  }

  async updateStaffAvailability(staffId: string, dto: any): Promise<any> {
    const { data, error } = await this.db
      .from('StaffProfile')
      .update({
        ...(dto.isAvailable !== undefined ? { isAvailable: dto.isAvailable } : {}),
        ...(dto.isOnLeave !== undefined ? { isOnLeave: dto.isOnLeave } : {}),
        ...(dto.maxWorkload !== undefined ? { maxWorkload: dto.maxWorkload } : {}),
        ...(dto.specialization ? { specialization: dto.specialization } : {}),
      })
      .or(`id.eq.${staffId},linkedUserId.eq.${staffId}`)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  /**
   * Assign all currently unassigned loan applications via round-robin.
   * Called on startup / by a scheduled job or admin trigger to catch
   * any apps that slipped through without being auto-assigned.
   */
  async assignAllUnassigned(triggeredBy = 'system'): Promise<{ assigned: number; skipped: number; failed: number }> {
    const { data: unassigned, error } = await this.db
      .from('LoanApplication')
      .select('id, applicationNumber, loanType, firstName, lastName, email')
      .or('assignedStaffId.is.null,assignedStaffId.eq.unassigned,assignedStaffId.eq.,assignedStaffId.eq.null')
      .not('status', 'in', '("rejected","cancelled","draft")');

    if (error) {
      this.logger.error(`[assignAllUnassigned] Failed to fetch unassigned apps: ${error.message}`);
      return { assigned: 0, skipped: 0, failed: 0 };
    }

    const queue = unassigned || [];
    let assigned = 0;
    let skipped = 0;
    let failed = 0;

    this.logger.log(`[assignAllUnassigned] Found ${queue.length} unassigned applications. Assigning now...`);

    for (const loan of queue) {
      try {
        const result = await this.assignLoan(loan.id, triggeredBy);
        if (result.success) {
          assigned++;
        } else if (result.message === 'Application is already assigned') {
          skipped++;
        } else {
          // No eligible staff — stop trying further to avoid empty loops
          this.logger.warn(`[assignAllUnassigned] Stopped at ${loan.id}: ${result.message}`);
          skipped += queue.length - assigned - failed - skipped;
          break;
        }
      } catch (err: any) {
        this.logger.error(`[assignAllUnassigned] Failed for ${loan.id}: ${err.message}`);
        failed++;
      }
    }

    this.logger.log(`[assignAllUnassigned] Done. assigned=${assigned}, skipped=${skipped}, failed=${failed}`);
    return { assigned, skipped, failed };
  }
}
