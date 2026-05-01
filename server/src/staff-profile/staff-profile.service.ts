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
    const { data: existing } = await this.db
      .from('StaffProfile')
      .select('id')
      .eq('linkedUserId', body.linked_user_id)
      .single();

    if (existing) throw new ConflictException('A profile already exists for this user');

    // 3. Insert profile
    const { data: profile, error } = await this.db
      .from('StaffProfile')
      .insert({
        linkedUserId: body.linked_user_id,
        assignedStaffId: staffUser.id,
        targetBank: body.target_bank || null,
        loanType: body.loan_type || null,
        internalNotes: body.internal_notes || null,
        bankStatus: 'NOT_SENT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    await this.auditLog.logAction('PROFILE_CREATED', 'staff_profile', profile.id, staffUser, {
      linked_user_id: body.linked_user_id,
    });

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
}
