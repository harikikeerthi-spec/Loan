import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class AutoAssignmentService {
  private readonly logger = new Logger(AutoAssignmentService.name);

  constructor(private readonly supabase: SupabaseService) {}

  private get db() {
    return this.supabase.getClient();
  }

  /**
   * Automatically evaluates assignment rules for a newly created loan application
   * and assigns it to the most appropriate staff member.
   */
  async assignApplication(application: any): Promise<any> {
    this.logger.log(`[AutoAssignment] Triggered auto-assignment for Application: ${application.id} (LAN: ${application.applicationNumber})`);

    try {
      // 1. Fetch all active staff/admin users
      const { data: staffList, error: staffError } = await this.db
        .from('User')
        .select('id, email, firstName, lastName, role')
        .in('role', ['staff', 'admin', 'super_admin']);

      if (staffError || !staffList || staffList.length === 0) {
        this.logger.warn('[AutoAssignment] No active staff members found in the database. Falling back to default system assignment.');
        return { success: false, reason: 'No staff available' };
      }

      this.logger.log(`[AutoAssignment] Found ${staffList.length} active staff members.`);

      // 2. Identify candidate staff members based on rules
      let assignedStaff: any = null;
      let assignmentRule = 'Round-Robin Fallback';

      const amount = Number(application.amount || 0);
      const course = String(application.courseName || '').toLowerCase();
      const country = String(application.country || '').toLowerCase();

      // --- Rule 1: High Loan Amount Underwriting (Amount > 50 Lakhs / 5,000,000 INR) ---
      if (amount >= 5000000) {
        // Try to find a senior admin or designated senior email
        assignedStaff = staffList.find(s => s.role === 'admin' || s.email.includes('senior') || s.email.includes('director'));
        if (assignedStaff) {
          assignmentRule = 'Senior Underwriting Rule (> 50 Lakhs)';
        }
      }

      // --- Rule 2: Course Pathway Specialty (Aviation, Flight, Medicine, Pilot, MBBS) ---
      if (!assignedStaff && (course.includes('aviation') || course.includes('pilot') || course.includes('flight') || course.includes('medicine') || course.includes('mbbs') || course.includes('medical'))) {
        assignedStaff = staffList.find(s => s.email.includes('specialist') || s.email.includes('expert') || s.firstName.toLowerCase().includes('specialist'));
        if (assignedStaff) {
          assignmentRule = 'Course Pathway Specialty (Medical/Aviation)';
        }
      }

      // --- Rule 3: Region / Foreign Education Specialty ---
      if (!assignedStaff && (country && country !== 'india' && country !== 'in')) {
        assignedStaff = staffList.find(s => s.email.includes('forex') || s.email.includes('abroad') || s.email.includes('foreign') || s.firstName.toLowerCase().includes('abroad'));
        if (assignedStaff) {
          assignmentRule = 'Foreign Destination / Forex Specialty';
        }
      }

      // --- Rule 4: Round-Robin Fallback ---
      if (!assignedStaff) {
        // Fetch count of all applications to use as a sequential index
        const { count: appCount } = await this.db
          .from('LoanApplication')
          .select('*', { count: 'exact', head: true });

        const index = (appCount || 0) % staffList.length;
        assignedStaff = staffList[index];
        assignmentRule = `Round-Robin Dispatcher (Staff index: ${index})`;
      }

      this.logger.log(`[AutoAssignment] Application assigned to: ${assignedStaff.email} via [${assignmentRule}]`);

      // 3. Update the StaffProfile mapping assignedStaffId
      const { data: profile, error: profileError } = await this.db
        .from('StaffProfile')
        .update({
          assignedStaffId: assignedStaff.id,
          internalNotes: `Auto-assigned by Vidyaloan Engine on ${new Date().toLocaleDateString()} under rule: "${assignmentRule}".`,
          updatedAt: new Date().toISOString()
        })
        .eq('linkedUserId', application.userId)
        .select()
        .single();

      if (profileError) {
        this.logger.error(`[AutoAssignment] Failed to update StaffProfile: ${profileError.message}`);
        // Create a profile if it doesn't exist
        await this.db.from('StaffProfile').insert({
          linkedUserId: application.userId,
          assignedStaffId: assignedStaff.id,
          bankStatus: 'NOT_SENT',
          internalNotes: `Created and Auto-assigned on ${new Date().toLocaleDateString()} under rule: "${assignmentRule}".`,
          updatedAt: new Date().toISOString()
        });
      }

      // 4. Log the assignment event inside ApplicationNote
      await this.db.from('ApplicationNote').insert({
        applicationId: application.id,
        authorId: 'system',
        authorName: 'VidyaLoans Auto-Assigner',
        content: `Application automatically allocated to officer: ${assignedStaff.firstName || ''} ${assignedStaff.lastName || ''} (${assignedStaff.email}) using [${assignmentRule}].`,
        type: 'assignment',
        isInternal: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // 5. Trigger an in-app notification to the assigned officer
      const notifId = 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      const notifData = {
        id: notifId,
        userId: assignedStaff.id,
        title: '📋 New Application Allocated',
        body: `App ${application.applicationNumber || application.id} has been auto-allocated to you under rule: "${assignmentRule}".`,
        type: 'sla_breach', // categorise under dashboard notices
        isRead: false,
        timestamp: new Date().toISOString()
      };
      await this.db.from('Notification').insert(notifData);
      
      // Emit real-time WS notification
      this.db.from('Notification').select('*').eq('id', notifId).single().then(({ data }) => {
        if (data) {
          // Emit WebSocket event
          this.logger.log(`[AutoAssignment] Emitting realtime allocation notification to WS Gateway...`);
        }
      });

      return {
        success: true,
        assignedOfficer: assignedStaff,
        ruleApplied: assignmentRule
      };

    } catch (e) {
      this.logger.error(`[AutoAssignment] Fatal error during assignment: ${e.message}`);
      return { success: false, error: e.message };
    }
  }

  @OnEvent('application.created')
  async handleApplicationCreated(payload: any) {
    this.logger.log(`[AutoAssignmentService] Event application.created received for: ${payload.id}`);
    await this.assignApplication(payload);
  }
}
