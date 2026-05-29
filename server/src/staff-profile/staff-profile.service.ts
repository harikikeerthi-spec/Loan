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
import { EmailService } from '../auth/email.service';

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
    private emailService: EmailService,
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
        `*, linkedUser:User!linkedUserId(id, firstName, lastName, email, mobile, phoneNumber, dateOfBirth, role, createdAt)`,
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
        `*, linkedUser:User!linkedUserId(id, firstName, lastName, email, mobile, phoneNumber, dateOfBirth),
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
        `*, linkedUser:User!linkedUserId(id, firstName, lastName, email, mobile, phoneNumber, dateOfBirth)`,
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
    const type = data?.type || 'info';
    const msg = data?.msg || 'Activity logged';
    const icon = data?.icon || 'event_note';
    const color = data?.color || 'text-slate-600 bg-slate-50';

    const actorName = user
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Staff'
      : 'System';

    await this.auditLog.logAction(
      `STAFF_ACTIVITY`,
      'DASHBOARD',
      type.toUpperCase(),
      user || { id: 'system' },
      {
        msg,
        icon,
        color,
        activityType: type,
        actorName,
        isDashboardActivity: true,
      },
    );

    // Broadcast the activity log dynamically via NestJS event emitter to socket.io
    this.eventEmitter.emit('dashboard.activity', {
      type,
      msg,
      icon,
      color,
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

  private parseDate(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;

    // Try native parsing first
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString();

    // Try DD-MM-YYYY or DD/MM/YYYY
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);

      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d.toISOString();
      }
    }

    return null;
  }

  private mapOnboardingToApplication(onboarding: any) {
    if (!onboarding) return {};

    const academic = onboarding.academic || {};
    const highestLevel = academic.highestLevel || '';
    
    // Pick university/course details based on highest level or default to undergrad/postgrad if available
    let universityName = '';
    let courseName = '';
    if (highestLevel === 'Postgraduate') {
      universityName = academic.postgrad?.university || '';
      courseName = academic.postgrad?.qualification || '';
    } else if (highestLevel === 'Undergraduate') {
      universityName = academic.undergrad?.university || '';
      courseName = academic.undergrad?.qualification || '';
    } else if (academic.postgrad?.university) {
      universityName = academic.postgrad.university;
      courseName = academic.postgrad.qualification;
    } else if (academic.undergrad?.university) {
      universityName = academic.undergrad.university;
      courseName = academic.undergrad.qualification;
    }

    // Co-applicant income
    let coApplicantIncome: number | null = null;
    if (onboarding.coApplicant?.monthlyIncome) {
      coApplicantIncome = parseFloat(onboarding.coApplicant.monthlyIncome) * 12; // convert monthly to annual
    }

    // Co-applicant mapping
    const hasCoApplicant = !!(onboarding.coApplicant?.name || onboarding.coApplicant?.email || onboarding.coApplicant?.mobile);

    // Primary address (using mailing address)
    const mailing = onboarding.mailingAddress || {};
    const addressString = [mailing.address1, mailing.address2].filter(Boolean).join(', ');

    return {
      firstName: onboarding.firstName || null,
      lastName: onboarding.lastName || null,
      email: onboarding.email || null,
      phone: onboarding.mobile || null,
      dateOfBirth: onboarding.dob ? this.parseDate(onboarding.dob) : null,
      gender: onboarding.gender || null,
      nationality: onboarding.nationality?.name || null,
      address: addressString || null,
      city: mailing.city || null,
      state: mailing.state || null,
      pincode: mailing.pincode || null,
      country: mailing.country || null,
      universityName: universityName || null,
      courseName: courseName || null,
      employmentType: onboarding.coApplicant?.employmentType || null,
      hasCoApplicant: hasCoApplicant,
      coApplicantName: onboarding.coApplicant?.name || null,
      coApplicantRelation: onboarding.coApplicant?.relation || null,
      coApplicantPhone: onboarding.coApplicant?.mobile || null,
      coApplicantEmail: onboarding.coApplicant?.email || null,
      coApplicantIncome: coApplicantIncome,
      fatherName: onboarding.family?.fatherName || null,
      fatherPhone: onboarding.family?.fatherMobile || null,
      fatherEmail: onboarding.family?.fatherEmail || null,
      motherName: onboarding.family?.motherName || null,
      motherPhone: onboarding.family?.motherMobile || null,
      motherEmail: onboarding.family?.motherEmail || null,
    };
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
      studentDetails?: any;
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

    // 4. Handle recipient types: skip application creation if sharing with student, instead email summary
    const { data: studentUser } = await this.db
      .from('User')
      .select('*')
      .eq('id', studentId)
      .maybeSingle();

    const isRecipientStudent = body.recipientType?.toLowerCase() === 'student';

    if (isRecipientStudent) {
      const studentEmail = studentUser?.email || body.recipientEmail;
      const personal = body.studentDetails?.personal || body.studentDetails || {};
      const academic = body.studentDetails?.academic || {};
      const coApplicant = body.studentDetails?.coApplicant || {};
      const address = body.studentDetails?.address?.mailing || body.studentDetails?.mailingAddress || {};

      const formatCurrency = (val: any) => {
        if (!val) return '—';
        const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
        if (isNaN(num)) return '₹' + val;
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
      };

      const studentName = body.recipientName || `${personal.firstName || ''} ${personal.lastName || ''}`.trim() || studentUser?.firstName || 'Student';
      const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/share/${token}`;

      const subject = `🎓 Your Complete VidyaLoans Onboarding Profile Details`;
      const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 35px 30px; text-align: center; color: white;">
            <span style="font-size: 40px; margin-bottom: 10px; display: inline-block;">🎓</span>
            <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">VidyaLoans Onboarding Dossier</h1>
            <p style="margin: 5px 0 0; font-size: 14px; color: #d1fae5; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Verified Onboarding Summary</p>
          </div>
          
          <div style="padding: 30px; background-color: #ffffff;">
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              Dear <strong>${studentName}</strong>,
            </p>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
              Your onboarding process is complete! Below is the complete dossier of details registered in your profile. You can access your verified portfolio and all academic/KYC documents securely using the link below.
            </p>

            <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background-color: #f8fafc; margin-bottom: 24px;">
              <h3 style="color: #059669; font-size: 15px; font-weight: 700; margin: 0 0 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">📂 Study & Loan Information</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 45%;">Target University:</td>
                  <td style="padding: 6px 0; color: #1e293b; font-weight: 700;">${body.studentDetails?.targetUniversity || body.studentDetails?.university || '—'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Course Name:</td>
                  <td style="padding: 6px 0; color: #1e293b; font-weight: 700;">${body.studentDetails?.courseName || '—'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Requested Loan Amount:</td>
                  <td style="padding: 6px 0; color: #1e293b; font-weight: 700; font-size: 16px;">${formatCurrency(body.studentDetails?.loanAmount)}</td>
                </tr>
              </table>
            </div>

            <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background-color: #f8fafc; margin-bottom: 24px;">
              <h3 style="color: #059669; font-size: 15px; font-weight: 700; margin: 0 0 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">👤 Personal & Contact Info</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 45%;">Full Name:</td>
                  <td style="padding: 6px 0; color: #1e293b; font-weight: 700;">${studentName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Email Address:</td>
                  <td style="padding: 6px 0; color: #1e293b; font-weight: 700;">${studentEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Mobile Number:</td>
                  <td style="padding: 6px 0; color: #1e293b; font-weight: 700;">${personal.mobile || personal.phone || studentUser?.mobile || studentUser?.phone || '—'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Date of Birth:</td>
                  <td style="padding: 6px 0; color: #1e293b; font-weight: 700;">${personal.dob || '—'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Pan Card Status:</td>
                  <td style="padding: 6px 0; color: #1e293b; font-weight: 700;">${personal.pan || 'Provided'}</td>
                </tr>
              </table>
            </div>

            <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background-color: #f8fafc; margin-bottom: 24px;">
              <h3 style="color: #059669; font-size: 15px; font-weight: 700; margin: 0 0 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">👥 Co-Applicant Details</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 45%;">Name:</td>
                  <td style="padding: 6px 0; color: #1e293b; font-weight: 700;">${coApplicant.firstName || coApplicant.name ? `${coApplicant.firstName || coApplicant.name} ${coApplicant.lastName || ''}`.trim() : '—'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Relation to Applicant:</td>
                  <td style="padding: 6px 0; color: #1e293b; font-weight: 700;">${coApplicant.relationship || '—'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Employment Type:</td>
                  <td style="padding: 6px 0; color: #1e293b; font-weight: 700;">${coApplicant.employmentType || '—'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Monthly Income:</td>
                  <td style="padding: 6px 0; color: #1e293b; font-weight: 700;">${formatCurrency(coApplicant.monthlyIncome)}</td>
                </tr>
              </table>
            </div>

            <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background-color: #f8fafc; margin-bottom: 24px;">
              <h3 style="color: #059669; font-size: 15px; font-weight: 700; margin: 0 0 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">📍 Mailing Address</h3>
              <p style="color: #1e293b; font-size: 14px; margin: 0; font-weight: 700; line-height: 1.4;">
                ${address.address1 || '—'}<br>
                ${address.city || ''}${address.city && address.state ? ', ' : ''}${address.state || ''} ${address.pincode || ''}<br>
                ${address.country || ''}
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${shareUrl}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                📂 View Onboarding Portfolio
              </a>
            </div>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                If you did not request this email, please contact support@vidyaloans.com.<br>
                © ${new Date().getFullYear()} VidyaLoans. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `;

      await this.emailService.sendMail(studentEmail, subject, html);
    } else {
      let { data: application, error: appErr } = await this.db
        .from('LoanApplication')
        .select('*')
        .eq('userId', studentId)
        .maybeSingle();

      const authorName = staffUser 
        ? `${staffUser.firstName || ''} ${staffUser.lastName || ''}`.trim() || staffUser.email || 'Staff' 
        : 'Staff';

      if (!application) {
        const mappedDetails = this.mapOnboardingToApplication(body.studentDetails);
        const appNumber = await this.generateApplicationNumber();
        const insertApp = {
          id: 'la-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          userId: studentId,
          bank: body.recipientName || 'Credila',
          loanType: 'Education Loan',
          amount: body.studentDetails?.loanAmount ? parseFloat(body.studentDetails.loanAmount) : 1500000,
          status: 'pending',
          stage: 'Pre-login',
          progress: 10,
          date: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          applicationNumber: appNumber,
          priorityLevel: 'medium',
          ...mappedDetails,
          firstName: mappedDetails.firstName || studentUser?.firstName || 'Student',
          lastName: mappedDetails.lastName || studentUser?.lastName || 'Applicant',
          email: mappedDetails.email || studentUser?.email || null,
          phone: mappedDetails.phone || studentUser?.mobile || studentUser?.phone || null,
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
      } else {
        // If application already exists, update it with onboarding details!
        const mappedDetails = this.mapOnboardingToApplication(body.studentDetails);
        const { data: updatedApp, error: updateAppErr } = await this.db
          .from('LoanApplication')
          .update({
            bank: body.recipientName || application.bank,
            updatedAt: new Date().toISOString(),
            ...mappedDetails,
            firstName: mappedDetails.firstName || application.firstName || studentUser?.firstName || 'Student',
            lastName: mappedDetails.lastName || application.lastName || studentUser?.lastName || 'Applicant',
            email: mappedDetails.email || application.email || studentUser?.email || null,
            phone: mappedDetails.phone || application.phone || studentUser?.mobile || studentUser?.phone || null,
          })
          .eq('id', application.id)
          .select()
          .single();
        
        if (!updateAppErr && updatedApp) {
          application = updatedApp;
        } else if (updateAppErr) {
          console.error('[StaffProfileService.shareProfile] Failed to update existing LoanApplication with onboarding details:', updateAppErr);
        }
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
    }

    // 7. Log and emit dashboard activity log
    await this.logDashboardActivity(staffUser, {
      type: 'share',
      msg: isRecipientStudent
        ? `Shared onboarding dossier directly with student (${studentUser?.email || body.recipientEmail})`
        : `Shared profile for ${studentUser?.firstName || 'Student'} ${studentUser?.lastName || ''} with ${body.recipientName}`,
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

  private async generateApplicationNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `VL-APP-${year}-`;
    
    try {
      const { data, error } = await this.db
        .from('LoanApplication')
        .select('applicationNumber')
        .like('applicationNumber', `${prefix}%`)
        .order('applicationNumber', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[StaffProfileService] Error fetching max application number:', error);
      }

      let nextSeq = 1;
      if (data && data.applicationNumber) {
        const parts = data.applicationNumber.split('-');
        if (parts.length === 4) {
          const currentSeq = parseInt(parts[3], 10);
          if (!isNaN(currentSeq)) {
            nextSeq = currentSeq + 1;
          }
        }
      }
      return `${prefix}${String(nextSeq).padStart(5, '0')}`;
    } catch (err) {
      console.error('[StaffProfileService] Failed to generate sequential application number, falling back to random:', err);
      const seq = String(Math.floor(Math.random() * 100_000)).padStart(5, '0');
      return `${prefix}${seq}`;
    }
  }
}

