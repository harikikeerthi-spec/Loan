import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UsersService } from '../users/users.service';
import { AuditLogService } from '../auth/audit-log.service';
import { S3Service } from '../document/s3.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class StaffProfileService {
  private get db() {
    return this.supabase.getClient();
  }

  constructor(
    private supabase: SupabaseService,
    private usersService: UsersService,
    private auditLog: AuditLogService,
    private s3Service: S3Service,
    private eventEmitter: EventEmitter2,
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
      console.log(`[StaffProfileService.createProfile] Profile already exists for user ${body.linked_user_id}, returning existing.`);
      return existing;
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
        const existingProfile = await this.getProfileByLinkedUserId(body.linked_user_id);
        if (existingProfile) return existingProfile;
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

  // ─── Upload a document directly as staff (→ S3) ──────────────────────────
  async uploadStaffDocument(
    profileId: string,
    staffUser: any,
    file: Express.Multer.File,
    body: { doc_type: string; description?: string },
  ) {
    if (!file) throw new BadRequestException('File is required');

    // Verify profile exists and get linked user for the S3 key
    const profile = await this.getProfile(profileId);
    const linkedUserId = profile.linkedUserId || profileId;

    // Upload to S3
    const s3Key = this.s3Service.buildKey(
      linkedUserId,
      body.doc_type,
      file.originalname,
    );
    await this.s3Service.upload(s3Key, file.buffer, file.mimetype);
    console.log(`[StaffProfile] Uploaded to S3: ${s3Key}`);

    const { data, error } = await this.db
      .from('StaffProfileDocument')
      .insert({
        staffProfileId: profileId,
        userDocumentId: null,
        docType: body.doc_type,
        filePath: s3Key,            // S3 key stored
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
      s3Key,
    });

    // Return with a short-lived presigned URL
    const previewUrl = await this.s3Service.getPresignedUrl(s3Key, 3600);
    return { ...data, previewUrl };
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

  // ─── Get documents attached to a profile (with fresh presigned URLs) ────────
  async getProfileDocuments(profileId: string) {
    const { data, error } = await this.db
      .from('StaffProfileDocument')
      .select('*')
      .eq('staffProfileId', profileId)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    const docs = data || [];

    // Enrich each doc with a fresh presigned URL if it has an S3 key
    const enriched = await Promise.all(
      docs.map(async (doc: any) => {
        if (doc.filePath && !doc.filePath.startsWith('in.gov.') && !doc.filePath.startsWith('http')) {
          try {
            doc.previewUrl = await this.s3Service.getPresignedUrl(doc.filePath, 3600);
          } catch (e) {
            console.warn(`[StaffProfile] Could not get presigned URL for ${doc.filePath}:`, e);
          }
        }
        return doc;
      }),
    );

    return enriched;
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

  /**
   * Writes a structured dashboard activity entry into the AuditLog.
   * All staff-dashboard actions (doc upload, onboarding, profile sync, etc.) should
   * call this so they appear in the Activity Log section.
   */
  async logDashboardActivity(
    user: any,
    data: { type: string; msg: string; icon: string; color: string },
  ) {
    const actorName = user
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Staff'
      : 'System';

    await this.auditLog.logAction(
      `STAFF_ACTIVITY`,
      'DASHBOARD',
      data.type.toUpperCase(),
      user || { id: 'system' },
      {
        msg: data.msg,
        icon: data.icon,
        color: data.color,
        activityType: data.type,
        actorName,
        isDashboardActivity: true,
      },
    );

    // Broadcast the activity log dynamically via NestJS event emitter to socket.io
    this.eventEmitter.emit('dashboard.activity', {
      type: data.type,
      msg: data.msg,
      icon: data.icon,
      color: data.color,
      actorName,
      actorEmail: user?.email || null,
      createdAt: new Date().toISOString()
    });
  }

  /**
   * Returns the N most recent dashboard activity entries (for the sidebar widget).
   */
  async getDashboardActivities(limit: number = 15) {
    const { data, error } = await this.db
      .from('AuditLog')
      .select(
        'id, action, entityId, initiatedBy, changes, createdAt, initiator:User!initiatedBy(firstName, lastName, email)',
      )
      .eq('action', 'STAFF_ACTIVITY')
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[StaffProfileService.getDashboardActivities] Error:', error);
      return [];
    }

    return (data || []).map((log: any) => {
      const initObj = Array.isArray(log.initiator) ? log.initiator[0] : log.initiator;
      return {
        id: log.id,
        type: log.changes?.activityType || 'info',
        msg: log.changes?.msg || 'Activity recorded',
        icon: log.changes?.icon || 'event_note',
        color: log.changes?.color || 'text-slate-600 bg-slate-50',
        actorName:
          log.changes?.actorName ||
          `${initObj?.firstName || ''} ${initObj?.lastName || ''}`.trim() ||
          'Staff',
        actorEmail: initObj?.email || null,
        createdAt: log.createdAt,
        time: log.createdAt, // Frontend formats this to relative string
      };
    });
  }

  /**
   * Returns paginated, filterable full activity log (for the Activity Log page).
   */
  async getAllDashboardActivities(opts: {
    limit: number;
    offset: number;
    type?: string;
    search?: string;
  }) {
    let query = this.db
      .from('AuditLog')
      .select(
        'id, action, entityId, initiatedBy, changes, createdAt, initiator:User!initiatedBy(firstName, lastName, email)',
        { count: 'exact' },
      )
      .eq('action', 'STAFF_ACTIVITY')
      .order('createdAt', { ascending: false })
      .range(opts.offset, opts.offset + opts.limit - 1);

    if (opts.type && opts.type !== 'all') {
      query = query.eq('changes->>activityType', opts.type);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[StaffProfileService.getAllDashboardActivities] Error:', error);
      return { items: [], total: 0 };
    }

    let items = (data || []).map((log: any) => {
      const initObj = Array.isArray(log.initiator) ? log.initiator[0] : log.initiator;
      return {
        id: log.id,
        type: log.changes?.activityType || 'info',
        msg: log.changes?.msg || 'Activity recorded',
        icon: log.changes?.icon || 'event_note',
        color: log.changes?.color || 'text-slate-600 bg-slate-50',
        actorName:
          log.changes?.actorName ||
          `${initObj?.firstName || ''} ${initObj?.lastName || ''}`.trim() ||
          'Staff',
        actorEmail: initObj?.email || null,
        createdAt: log.createdAt,
      };
    });

    // In-memory search filter (Supabase free tier doesn't support full-text on jsonb easily)
    if (opts.search) {
      const s = opts.search.toLowerCase();
      items = items.filter(
        (a) =>
          a.msg.toLowerCase().includes(s) ||
          a.actorName.toLowerCase().includes(s) ||
          a.type.toLowerCase().includes(s),
      );
    }

    return { items, total: count || items.length };
  }

  // ─── Share applicant profile (Step 4 of onboarding) ────────────────────────
  async shareProfile(
    studentId: string,
    staffUser: any,
    body: {
      recipientType: string;
      recipientName: string;
      recipientEmail: string;
      message?: string;
      sharedBy?: string;
    },
  ) {
    if (!studentId) throw new BadRequestException('studentId is required');
    if (!body.recipientEmail) throw new BadRequestException('Recipient email is required');
    if (!body.recipientName) throw new BadRequestException('Recipient name is required');

    // 1. Get or create the student's StaffProfile
    let { data: profile, error: profileErr } = await this.db
      .from('StaffProfile')
      .select('*')
      .eq('linkedUserId', studentId)
      .maybeSingle();

    if (!profile) {
      const insertData = {
        id: 'sp-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        linkedUserId: studentId,
        assignedStaffId: staffUser?.id || staffUser?.uid || 'system',
        targetBank: body.recipientName,
        loanType: 'Education Loan',
        internalNotes: body.message || null,
        bankStatus: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const { data: newProfile, error: createProfileErr } = await this.db
        .from('StaffProfile')
        .insert(insertData)
        .select()
        .single();
        
      if (createProfileErr) {
        console.error('[StaffProfileService.shareProfile] Failed to create StaffProfile:', createProfileErr);
        throw new BadRequestException(`Failed to create StaffProfile: ${createProfileErr.message}`);
      }
      profile = newProfile;
    } else {
      const { data: updatedProfile, error: updateProfileErr } = await this.db
        .from('StaffProfile')
        .update({
          bankStatus: 'PENDING',
          targetBank: body.recipientName,
          updatedAt: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single();
        
      if (updateProfileErr) {
        console.error('[StaffProfileService.shareProfile] Failed to update StaffProfile:', updateProfileErr);
      } else {
        profile = updatedProfile;
      }
    }

    // 2. Fetch or auto-create documents attached to the profile
    const { data: docs } = await this.db
      .from('StaffProfileDocument')
      .select('id')
      .eq('staffProfileId', profile.id);
    const documentIds = (docs || []).map((d: any) => d.id);

    if (documentIds.length === 0) {
      const { data: userDocs } = await this.db
        .from('UserDocument')
        .select('*')
        .eq('userId', studentId);
      if (userDocs && userDocs.length > 0) {
        const rows = userDocs.map((doc: any) => ({
          id: 'spd-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          staffProfileId: profile.id,
          userDocumentId: doc.id,
          docType: doc.docType || doc.type || 'Academic',
          filePath: doc.filePath,
          originalFilename: doc.filePath?.split('/').pop() || doc.docType || 'Document',
          source: 'USER_UPLOAD',
          status: doc.status || 'pending',
          uploadedBy: doc.userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        const { data: insertedDocs } = await this.db
          .from('StaffProfileDocument')
          .insert(rows)
          .select();
        if (insertedDocs) {
          insertedDocs.forEach((d: any) => documentIds.push(d.id));
        }
      }
    }

    // 3. Create the StaffProfileShare token and record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const token = Buffer.from(
      JSON.stringify({ profileId: profile.id, ts: Date.now(), r: Math.random() })
    ).toString('base64url');

    const shareId = 'share-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const { data: share, error: shareErr } = await this.db
      .from('StaffProfileShare')
      .insert({
        id: shareId,
        staffProfileId: profile.id,
        sharedBy: staffUser?.id || staffUser?.uid || 'system',
        bankName: body.recipientName,
        bankEmail: body.recipientEmail,
        documentIds: documentIds,
        token,
        expiresAt: expiresAt.toISOString(),
        accessNote: body.message || null,
        accessCount: 0,
        revoked: false,
        createdAt: new Date().toISOString()
      })
      .select()
      .single();

    if (shareErr) {
      console.error('[StaffProfileService.shareProfile] Failed to create StaffProfileShare:', shareErr);
      throw new BadRequestException(`Failed to create StaffProfileShare: ${shareErr.message}`);
    }

    // 4. Fetch or create the active LoanApplication for the student
    const { data: studentUser } = await this.db
      .from('User')
      .select('*')
      .eq('id', studentId)
      .maybeSingle();

    let { data: application, error: appErr } = await this.db
      .from('LoanApplication')
      .select('*')
      .eq('userId', studentId)
      .maybeSingle();

    const authorName = staffUser 
      ? `${staffUser.firstName || ''} ${staffUser.lastName || ''}`.trim() || staffUser.email || 'Staff' 
      : 'Staff';

    if (!application) {
      const appNumber = `VL-${Date.now()}`;
      const insertApp = {
        id: 'la-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        userId: studentId,
        bank: body.recipientName || 'Credila',
        loanType: 'Education Loan',
        amount: 1500000,
        status: 'pending',
        stage: 'Pre-login',
        progress: 10,
        date: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        applicationNumber: appNumber,
        firstName: studentUser?.firstName || 'Student',
        lastName: studentUser?.lastName || 'Applicant',
        email: studentUser?.email || null,
        phone: studentUser?.mobile || studentUser?.phone || null,
        hasCoApplicant: false,
        hasCollateral: false,
        priorityLevel: 'medium'
      };

      const { data: newApp, error: createAppErr } = await this.db
        .from('LoanApplication')
        .insert(insertApp)
        .select()
        .single();

      if (createAppErr) {
        console.error('[StaffProfileService.shareProfile] Failed to create LoanApplication:', createAppErr);
        throw new BadRequestException(`Failed to create LoanApplication: ${createAppErr.message}`);
      }
      application = newApp;

      // Log initial pending status history
      await this.db.from('ApplicationStatusHistory').insert({
        id: 'ash-' + Date.now() + '-pending',
        applicationId: application.id,
        fromStatus: null,
        toStatus: 'pending',
        fromStage: null,
        toStage: 'Pre-login',
        changedBy: staffUser?.id || staffUser?.uid || 'system',
        changedByName: authorName,
        changeReason: 'Initial setup',
        notes: 'Loan application initialized in system.',
        isAutomatic: true,
        createdAt: new Date().toISOString()
      });
    }

    // 5. Execute state machine progression to submitted_to_bank
    if (body.recipientType?.toLowerCase() === 'bank') {
      const currentStatus = application.status?.toLowerCase() || 'pending';
      const steps: Array<{
        from: string;
        to: string;
        stage: string;
        progress: number;
        reason: string;
        notes: string;
      }> = [];

      if (currentStatus === 'pending') {
        steps.push({
          from: 'pending',
          to: 'docs_received',
          stage: 'Pre-login',
          progress: 25,
          reason: 'Documents verified',
          notes: 'VidyaLoans staff has received and verified all submitted academic, financial, and PII documents.'
        });
        steps.push({
          from: 'docs_received',
          to: 'staff_verified',
          stage: 'Pre-login',
          progress: 40,
          reason: 'Staff verification completed',
          notes: 'VidyaLoans staff has completed the validation checks and marked the profile as verified.'
        });
        steps.push({
          from: 'staff_verified',
          to: 'submitted_to_bank',
          stage: 'Submitted',
          progress: 50,
          reason: 'Submitted to Bank',
          notes: `Application bundle shared and submitted directly to partner bank ${body.recipientName}.`
        });
      } else if (currentStatus === 'docs_received') {
        steps.push({
          from: 'docs_received',
          to: 'staff_verified',
          stage: 'Pre-login',
          progress: 40,
          reason: 'Staff verification completed',
          notes: 'VidyaLoans staff has completed the validation checks and marked the profile as verified.'
        });
        steps.push({
          from: 'staff_verified',
          to: 'submitted_to_bank',
          stage: 'Submitted',
          progress: 50,
          reason: 'Submitted to Bank',
          notes: `Application bundle shared and submitted directly to partner bank ${body.recipientName}.`
        });
      } else if (currentStatus === 'staff_verified') {
        steps.push({
          from: 'staff_verified',
          to: 'submitted_to_bank',
          stage: 'Submitted',
          progress: 50,
          reason: 'Submitted to Bank',
          notes: `Application bundle shared and submitted directly to partner bank ${body.recipientName}.`
        });
      } else {
        steps.push({
          from: currentStatus,
          to: 'submitted_to_bank',
          stage: 'Submitted',
          progress: 50,
          reason: 'Resubmitted to Bank',
          notes: `Application shared again with partner bank ${body.recipientName}.`
        });
      }

      // Transition sequentially through state changes
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        await this.db
          .from('LoanApplication')
          .update({
            status: step.to,
            stage: step.stage,
            progress: step.progress,
            bank: body.recipientName,
            updatedAt: new Date().toISOString()
          })
          .eq('id', application.id);

        await this.db.from('ApplicationStatusHistory').insert({
          id: `ash-${Date.now()}-${step.to}`,
          applicationId: application.id,
          fromStatus: step.from,
          toStatus: step.to,
          fromStage: i === 0 ? application.stage : steps[i - 1].stage,
          toStage: step.stage,
          changedBy: staffUser?.id || staffUser?.uid || 'system',
          changedByName: authorName,
          changeReason: step.reason,
          notes: step.notes,
          isAutomatic: false,
          createdAt: new Date().toISOString()
        });

        await this.db.from('ApplicationNote').insert({
          id: `note-${Date.now()}-${step.to}`,
          applicationId: application.id,
          authorId: staffUser?.id || staffUser?.uid || 'system',
          authorName: authorName,
          content: `${step.reason}: ${step.notes}`,
          type: 'status_change',
          isInternal: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      // Add user note if supplied
      if (body.message) {
        await this.db.from('ApplicationNote').insert({
          id: `note-msg-${Date.now()}`,
          applicationId: application.id,
          authorId: staffUser?.id || staffUser?.uid || 'system',
          authorName: authorName,
          content: `Staff note: ${body.message}`,
          type: 'general',
          isInternal: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      // Update staff profile bank status to SENT
      await this.db
        .from('StaffProfile')
        .update({
          bankStatus: 'SENT',
          updatedAt: new Date().toISOString()
        })
        .eq('id', profile.id);

      // 6. Notify partner bank representative via in-app alert
      let bankUserId = null;
      const { data: matchedBankUser } = await this.db
        .from('User')
        .select('id')
        .eq('email', body.recipientEmail)
        .maybeSingle();

      if (matchedBankUser) {
        bankUserId = matchedBankUser.id;
      } else {
        const { data: bankUsers } = await this.db
          .from('User')
          .select('id')
          .eq('role', 'bank')
          .limit(1);
        if (bankUsers && bankUsers.length > 0) {
          bankUserId = bankUsers[0].id;
        }
      }

      if (bankUserId) {
        const notifId = 'notif-' + Date.now();
        await this.db
          .from('Notification')
          .insert({
            id: notifId,
            userId: bankUserId,
            title: `📬 New Application Shared: ${application.applicationNumber || 'VL-' + Date.now()}`,
            body: `Student profile ${studentUser?.firstName || 'Student'} ${studentUser?.lastName || ''} has been fully verified and shared with ${body.recipientName} bank representative.`,
            type: 'incoming_file',
            isRead: false,
            timestamp: new Date().toISOString()
          });
      }
    }

    // 7. Log and emit dashboard activity log
    await this.logDashboardActivity(staffUser, {
      type: 'share',
      msg: `Shared profile for ${studentUser?.firstName || 'Student'} ${studentUser?.lastName || ''} with ${body.recipientName}`,
      icon: 'send',
      color: 'text-indigo-600 bg-indigo-50'
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return {
      shareId: share.id,
      token: token,
      url: `${baseUrl}/share/${token}`,
      expiresAt: expiresAt.toISOString(),
      documentsShared: documentIds.length
    };
  }
}

