import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UsersService } from '../users/users.service';
import { AuditLogService } from '../auth/audit-log.service';

@Injectable()
export class StaffProfileService {
  private get db() {
    return this.supabase.getClient();
  }

  constructor(
    private supabase: SupabaseService,
    private usersService: UsersService,
    private auditLog: AuditLogService,
  ) {}

  // ─── Create a staff-portal profile linked to a website user ───────────────
  async createProfile(
    staffUser: any,
    body: {
      linked_user_id: string;
      target_bank?: string;
      loan_type?: string;
      internal_notes?: string;
    },
  ) {
    // 1. Verify the linked user exists
    const linkedUser = await this.usersService.findById(body.linked_user_id);
    if (!linkedUser) throw new NotFoundException('User account not found');

    // 2. Prevent duplicate profiles
    const { data: existing, error: checkError } = await this.db
      .from('StaffProfile')
      .select('id')
      .eq('linkedUserId', body.linked_user_id)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[StaffProfileService.createProfile] Check Existing Error:', checkError);
    }

    if (existing) {
      throw new ConflictException('A profile already exists for this user');
    }

    const insertData: any = {
      linkedUserId: body.linked_user_id,
      assignedStaffId: staffUser?.id || staffUser?.uid || 'system', // Ensure not null
      internalNotes: body.internal_notes || null,
      bankStatus: 'NOT_SENT',
      updatedAt: new Date().toISOString(),
    };

    if (body.target_bank) insertData.targetBank = body.target_bank;
    if (body.loan_type) insertData.loanType = body.loan_type;

    const { data: profile, error } = await this.db
      .from('StaffProfile')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[StaffProfileService.createProfile] Insert Error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        insertData
      });
      // Handle Postgres unique constraint violation
      if (error.code === '23505') {
        throw new ConflictException('Staff profile already exists for this user');
      }
      throw new BadRequestException(`Failed to create staff profile: ${error.message || 'Database error'}`);
    }

    // Log the action (async)
    this.auditLog.logAction('PROFILE_CREATED', 'staff_profile', profile.id, staffUser || { id: 'system' }, {
      linked_user_id: body.linked_user_id,
    }).catch(e => console.error('[StaffProfileService] Audit log failed:', e));

    return profile;
  }

  // ─── List all staff profiles (with linked user info) ───────────────────────
  async listProfiles(staffUser: any, query: { search?: string; bankStatus?: string }) {
    let q = this.db
      .from('StaffProfile')
      .select(
        `*, linkedUser:User!linkedUserId(id, firstName, lastName, email, mobile, role, createdAt)`,
      )
      .order('createdAt', { ascending: false });

    if (query.bankStatus && query.bankStatus !== 'all') {
      q = q.eq('bankStatus', query.bankStatus);
    }

    const { data, error } = await q;
    if (error) throw error;

    let results = data || [];

    if (query.search) {
      const s = query.search.toLowerCase();
      results = results.filter(
        (p: any) =>
          p.linkedUser?.firstName?.toLowerCase().includes(s) ||
          p.linkedUser?.lastName?.toLowerCase().includes(s) ||
          p.linkedUser?.email?.toLowerCase().includes(s) ||
          p.loanType?.toLowerCase().includes(s),
      );
    }

    return results;
  }

  // ─── Get a single profile with its documents ───────────────────────────────
  async getProfile(profileId: string) {
    const { data, error } = await this.db
      .from('StaffProfile')
      .select(
        `*, linkedUser:User!linkedUserId(id, firstName, lastName, email, mobile),
         documents:StaffProfileDocument(*)`,
      )
      .eq('id', profileId)
      .single();

    if (error || !data) throw new NotFoundException('Profile not found');
    return data;
  }

  // ─── Get profile by linked user ID ──────────────────────────────────────────
  async getProfileByLinkedUserId(linkedUserId: string) {
    const { data, error } = await this.db
      .from('StaffProfile')
      .select(
        `*, linkedUser:User!linkedUserId(id, firstName, lastName, email, mobile)`,
      )
      .eq('linkedUserId', linkedUserId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('[StaffProfileService.getProfileByLinkedUserId] Error:', error);
      return null;
    }

    return data || null;
  }

  // ─── Fetch & attach documents from the linked user account ─────────────────
  async fetchUserDocuments(profileId: string, staffUser: any) {
    const profile = await this.getProfile(profileId);
    const userDocs = await this.usersService.getUserDocuments(profile.linkedUserId);

    if (!userDocs.length) return { fetched: 0, documents: [], skipped: 0 };

    // Check which docs are already attached
    const { data: alreadyAttached } = await this.db
      .from('StaffProfileDocument')
      .select('userDocumentId')
      .eq('staffProfileId', profileId);

    const attachedIds = new Set((alreadyAttached || []).map((d: any) => d.userDocumentId));

    const toAttach = userDocs.filter((d: any) => !attachedIds.has(d.id));
    const skipped = userDocs.length - toAttach.length;

    let inserted: any[] = [];
    if (toAttach.length) {
      const rows = toAttach.map((doc: any) => ({
        staffProfileId: profileId,
        userDocumentId: doc.id,
        docType: doc.docType,
        filePath: doc.filePath,
        originalFilename: doc.filePath?.split('/').pop() || doc.docType,
        source: 'USER_UPLOAD',
        status: doc.status || 'pending',
        uploadedBy: doc.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      const { data, error } = await this.db
        .from('StaffProfileDocument')
        .insert(rows)
        .select();

      if (error) throw error;
      inserted = data || [];
    }

    await this.auditLog.logAction('DOCUMENT_FETCHED', 'staff_profile', profileId, staffUser, {
      fetched: inserted.length,
      skipped,
    });

    return { fetched: inserted.length, documents: inserted, skipped };
  }

  // ─── Upload a document directly as staff ───────────────────────────────────
  async uploadStaffDocument(
    profileId: string,
    staffUser: any,
    file: Express.Multer.File,
    body: { doc_type: string; description?: string },
  ) {
    if (!file) throw new BadRequestException('File is required');

    // Verify profile exists
    await this.getProfile(profileId);

    const { data, error } = await this.db
      .from('StaffProfileDocument')
      .insert({
        staffProfileId: profileId,
        userDocumentId: null,
        docType: body.doc_type,
        filePath: file.path,
        originalFilename: file.originalname,
        source: 'STAFF_UPLOAD',
        status: 'pending',
        description: body.description || null,
        uploadedBy: staffUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    await this.auditLog.logAction('DOCUMENT_UPLOADED', 'staff_profile', profileId, staffUser, {
      docId: data.id,
      docType: body.doc_type,
      source: 'STAFF_UPLOAD',
    });

    return data;
  }

  // ─── Update document status & propagate back to UserDocument ───────────────
  async updateDocumentStatus(
    profileId: string,
    docId: string,
    staffUser: any,
    body: { status: string; rejection_reason?: string },
  ) {
    const validStatuses = ['pending', 'under_review', 'approved', 'rejected', 'requires_resubmission'];
    if (!validStatuses.includes(body.status)) {
      throw new BadRequestException(`Invalid status. Allowed: ${validStatuses.join(', ')}`);
    }

    // Get the staff-profile document
    const { data: doc, error: fetchErr } = await this.db
      .from('StaffProfileDocument')
      .select('*')
      .eq('id', docId)
      .eq('staffProfileId', profileId)
      .single();

    if (fetchErr || !doc) throw new NotFoundException('Document not found in this profile');
    const oldStatus = doc.status;

    // Update staff-profile document
    const { data: updated, error: updErr } = await this.db
      .from('StaffProfileDocument')
      .update({
        status: body.status,
        rejectionReason: body.rejection_reason || null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', docId)
      .select()
      .single();

    if (updErr) throw updErr;

    // ── Back-sync: propagate to the original UserDocument if linked ──────────
    let syncResult = 'no_user_doc';
    if (doc.userDocumentId) {
      const { error: syncErr } = await this.db
        .from('UserDocument')
        .update({ status: body.status, updatedAt: new Date().toISOString() })
        .eq('id', doc.userDocumentId);

      syncResult = syncErr ? 'sync_failed' : 'synced';
    }

    await this.auditLog.logAction('STATUS_UPDATED', 'staff_profile_document', docId, staffUser, {
      old_status: oldStatus,
      new_status: body.status,
      rejection_reason: body.rejection_reason,
      sync: syncResult,
    });

    return { document: updated, sync: syncResult };
  }

  // ─── Share a document bundle with the bank ─────────────────────────────────
  async shareWithBank(
    profileId: string,
    staffUser: any,
    body: {
      doc_ids: string[];
      bank_name: string;
      bank_email: string;
      expires_in_days?: number;
      access_note?: string;
    },
  ) {
    if (!body.doc_ids?.length) throw new BadRequestException('Select at least one document');
    if (!body.bank_email) throw new BadRequestException('Bank email is required');

    await this.getProfile(profileId);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (body.expires_in_days || 7));

    // Generate a simple share token
    const token = Buffer.from(
      JSON.stringify({ profileId, ts: Date.now(), r: Math.random() }),
    ).toString('base64url');

    const { data: share, error } = await this.db
      .from('StaffProfileShare')
      .insert({
        staffProfileId: profileId,
        sharedBy: staffUser.id,
        bankName: body.bank_name,
        bankEmail: body.bank_email,
        documentIds: body.doc_ids,
        token,
        expiresAt: expiresAt.toISOString(),
        accessNote: body.access_note || null,
        accessCount: 0,
        revoked: false,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Update profile bank status
    await this.db
      .from('StaffProfile')
      .update({ bankStatus: 'PENDING', updatedAt: new Date().toISOString() })
      .eq('id', profileId);

    await this.auditLog.logAction('SHARE_CREATED', 'staff_profile_share', share.id, staffUser, {
      bank_name: body.bank_name,
      bank_email: body.bank_email,
      document_count: body.doc_ids.length,
      expires_at: expiresAt.toISOString(),
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return {
      share_id: share.id,
      token,
      share_url: `${baseUrl}/share/${token}`,
      expires_at: expiresAt.toISOString(),
      documents_shared: body.doc_ids.length,
    };
  }

  // ─── Get documents attached to a profile ───────────────────────────────────
  async getProfileDocuments(profileId: string) {
    const { data, error } = await this.db
      .from('StaffProfileDocument')
      .select('*')
      .eq('staffProfileId', profileId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ─── Get share history for a profile ───────────────────────────────────────
  async getShareHistory(profileId: string) {
    const { data, error } = await this.db
      .from('StaffProfileShare')
      .select('*')
      .eq('staffProfileId', profileId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ─── Delete (detach) a document from a profile ─────────────────────────────
  async removeDocument(profileId: string, docId: string, staffUser: any) {
    const { error } = await this.db
      .from('StaffProfileDocument')
      .delete()
      .eq('id', docId)
      .eq('staffProfileId', profileId);

    if (error) throw error;

    await this.auditLog.logAction('DOCUMENT_REMOVED', 'staff_profile_document', docId, staffUser, {
      profileId,
    });

    return { success: true };
  }

  // ─── Dashboard Activity Logging ───────────────────────────────────────────
  async logDashboardActivity(user: any, data: { type: string; msg: string; icon: string; color: string }) {
    await this.auditLog.logAction(
      data.type.toUpperCase(),
      'DASHBOARD',
      'STAFF_PORTAL',
      user,
      { 
        msg: data.msg, 
        icon: data.icon, 
        color: data.color,
        isDashboardActivity: true 
      }
    );
  }

  async getDashboardActivities(limit: number = 10) {
    const { data, error } = await this.db
      .from('AuditLog')
      .select('id, action, initiatedBy, changes, createdAt, initiator:User!initiatedBy(firstName, lastName, email)')
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Map audit logs back to the activity format expected by the frontend
    return (data || []).map(log => ({
      id: log.id,
      type: log.action.toLowerCase(),
      msg: log.changes?.msg || `${log.action} action performed`,
      time: log.createdAt, // Frontend can format this
      icon: log.changes?.icon || 'event_note',
      color: log.changes?.color || 'text-slate-600 bg-slate-50',
      initiator: log.initiator
    }));
  }
}
