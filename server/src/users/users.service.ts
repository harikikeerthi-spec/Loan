import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UsersService {
  private get db() {
    return this.supabase.getClient();
  }

  constructor(private supabase: SupabaseService) { }

  private parseDate(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;

    // Try native parsing first (e.g., ISO, YYYY-MM-DD)
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString();

    // Try DD-MM-YYYY or DD/MM/YYYY
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);

      // Simple validation for numbers
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d.toISOString();
      }
    }

    return null;
  }

  private safeISO(dateSource: any): string {
    if (!dateSource) return new Date().toISOString();
    const d = dateSource instanceof Date ? dateSource : new Date(dateSource);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }

  /**
   * Converts a UTC date/time to India Standard Time (IST) format
   * IST is UTC+5:30
   * Returns format: YYYY-MM-DD HH:MM:SS IST
   */
  private convertToIndiaTime(utcDate: string | Date | null | undefined): string | null {
    if (!utcDate) return null;
    
    try {
      const date = utcDate instanceof Date ? utcDate : new Date(utcDate);
      if (isNaN(date.getTime())) return null;

      // Convert to IST (UTC+5:30)
      const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
      
      const year = istDate.getUTCFullYear();
      const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(istDate.getUTCDate()).padStart(2, '0');
      const hours = String(istDate.getUTCHours()).padStart(2, '0');
      const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
      const seconds = String(istDate.getUTCSeconds()).padStart(2, '0');

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} IST`;
    } catch (e) {
      console.error('[UsersService.convertToIndiaTime] Error:', e);
      return null;
    }
  }

  async findOne(email: string) {
    try {
      const { data, error } = await this.db.from('User').select('*').eq('email', email).single();
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error(`[UsersService.findOne] Supabase error for ${email}:`, error);
      }
      return data;
    } catch (e) {
      console.error(`[UsersService.findOne] Fatal error for ${email}:`, e);
      throw e;
    }
  }

  async findById(id: string) {
    const { data } = await this.db.from('User').select('*').eq('id', id).single();
    return data;
  }

  async findByMobile(mobile: string) {
    const cleanMobile = mobile.replace(/\D/g, '');
    const cleanMobileNoCountry =
      cleanMobile.length > 10 && cleanMobile.startsWith('91')
        ? cleanMobile.substring(2)
        : cleanMobile;

    const { data } = await this.db
      .from('User')
      .select('*')
      .or(
        `mobile.eq.${mobile},phoneNumber.eq.${mobile},mobile.eq.${cleanMobileNoCountry},phoneNumber.eq.${cleanMobileNoCountry},mobile.ilike.%${cleanMobileNoCountry},phoneNumber.ilike.%${cleanMobileNoCountry}`,
      )
      .limit(1)
      .single();
    return data;
  }

  async create(data: {
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    mobile?: string;
    password?: string;
    role?: string;
  }) {
    const dobDate = this.parseDate(data.dateOfBirth);
    const now = new Date();
    const registeredAtIndia = this.convertToIndiaTime(now);

    const { data: user, error } = await this.db
      .from('User')
      .insert({
        email: data.email,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        phoneNumber: data.phoneNumber || null,
        dateOfBirth: dobDate,
        mobile: data.mobile || '',
        password: data.password || '',
        role: data.role || 'user',
        registeredAtIndia: registeredAtIndia,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    
    console.log('User created in DB:', { user, keys: Object.keys(user || {}), hasId: !!user?.id });
    return user;
  }

  async findAll(limit?: number, offset?: number, search?: string, role?: string) {
    let query = this.db.from('User').select('*', { count: 'exact' });
    
    if (search) {
      query = query.or(`firstName.ilike.%${search}%,lastName.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (role && role !== 'all') {
      if (role === 'staff') {
        query = query.or('role.eq.admin,role.eq.staff');
      } else {
        query = query.eq('role', role);
      }
    }

    query = query.order('createdAt', { ascending: false });

    if (limit !== undefined) {
      const from = offset || 0;
      const to = from + limit - 1;
      query = query.range(from, to);
    }
    
    const { data, count, error } = await query;
    if (error) throw error;
    
    return {
      data: data || [],
      total: count || 0
    };
  }

  async getUserStats() {
    const { count: total } = await this.db.from('User').select('*', { count: 'exact', head: true });
    const { count: student } = await this.db.from('User').select('*', { count: 'exact', head: true }).eq('role', 'student');
    const { count: bank } = await this.db.from('User').select('*', { count: 'exact', head: true }).eq('role', 'bank');
    const { count: staff } = await this.db.from('User').select('*', { count: 'exact', head: true }).or('role.eq.admin,role.eq.staff');
    
    return {
      total: total || 0,
      student: student || 0,
      bank: bank || 0,
      staff: staff || 0,
      other: (total || 0) - (student || 0) - (bank || 0) - (staff || 0)
    };
  }

  async updateUserDetails(
    email: string,
    firstName: string,
    lastName: string,
    phoneNumber: string,
    dateOfBirth: string,
  ) {
    const dobDate = this.parseDate(dateOfBirth);


    const { data, error } = await this.db
      .from('User')
      .update({ firstName, lastName, phoneNumber, dateOfBirth: dobDate })
      .eq('email', email)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateExtractedDetails(userId: string, details: any) {
    try {
      console.log(`[UsersService.updateExtractedDetails] Updating details for user: ${userId}`);
      
      const payload: any = {};
      
      // Map OCR fields to known database columns
      if (details.documentVerified !== undefined) payload.documentVerified = details.documentVerified;
      
      if (details.full_name) {
        const parts = details.full_name.trim().split(/\s+/);
        if (parts.length > 0) {
          payload.firstName = parts[0];
          if (parts.length > 1) {
            payload.lastName = parts.slice(1).join(' ');
          }
        }
      }
      
      if (details.date_of_birth) {
        const parsedDob = this.parseDate(details.date_of_birth);
        if (parsedDob) payload.dateOfBirth = parsedDob;
      }

      // Add fields that might exist but we should be careful
      // These will only work if columns are added to the User table
      if (details.panNumber) payload.panNumber = details.panNumber;
      if (details.aadhaarNumber) payload.aadhaarNumber = details.aadhaarNumber;
      if (details.father_name) payload.fatherName = details.father_name;
      if (details.address) payload.permanentAddress = details.address;

      if (Object.keys(payload).length === 0) {
        console.log('[UsersService.updateExtractedDetails] No fields to update.');
        return { success: true };
      }

      const { data, error } = await this.db
        .from('User')
        .update(payload)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        // If it's a "column does not exist" error (PGRST204), log it but don't fail
        if (error.code === 'PGRST204' || error.message.includes('column')) {
          console.warn(`[UsersService.updateExtractedDetails] Could not update some fields because columns are missing in DB: ${error.message}`);
          
          // Try updating ONLY the verified columns we know exist
          const safePayload: any = {};
          if (payload.firstName) safePayload.firstName = payload.firstName;
          if (payload.lastName) safePayload.lastName = payload.lastName;
          if (payload.dateOfBirth) safePayload.dateOfBirth = payload.dateOfBirth;
          
          if (Object.keys(safePayload).length > 0) {
            await this.db.from('User').update(safePayload).eq('id', userId);
          }
          
          return { success: true, warning: 'Some fields skipped due to missing columns' };
        }
        throw error;
      }

      return { success: true, data };
    } catch (e: any) {
      console.error(`[UsersService.updateExtractedDetails] Failed to update user details: ${e.message}`);
      // Return success anyway so the document upload isn't considered a failure
      return { success: false, error: e.message };
    }
  }

  async updateRefreshToken(email: string, refreshToken: string | null) {
    const { data, error } = await this.db
      .from('User')
      .update({ refreshToken })
      .eq('email', email)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateUserRole(email: string, role: 'admin' | 'user' | 'staff' | 'super_admin' | 'agent' | 'bank') {
    const { data, error } = await this.db
      .from('User')
      .update({ role })
      .eq('email', email)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Loan Application Methods
  async createLoanApplication(
    userId: string,
    data: {
      bank: string;
      loanType: string;
      amount: number;
      purpose?: string;
      courseType?: string;
      country?: string;
      university?: string;
      annualFee?: string;
      livingCost?: string;
      coApplicant?: string;
      income?: string;
      collateral?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      dateOfBirth?: string;
      address?: string;
      notes?: string;
    },
  ) {
    const now = new Date().toISOString();
    
    // Generate application number
    const prefix = ({ education: 'EDU', home: 'HME', personal: 'PRS', business: 'BUS', vehicle: 'VEH' })[data.loanType] || 'APP';
    const applicationNumber = `${prefix}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    // Calculate estimated completion (14 days from now)
    const estimatedCompletionAt = new Date();
    estimatedCompletionAt.setDate(estimatedCompletionAt.getDate() + 14);
    
    const { data: application, error } = await this.db
      .from('LoanApplication')
      .insert({
        applicationNumber,
        userId,
        bank: data.bank,
        loanType: data.loanType,
        amount: data.amount,
        purpose: data.purpose || null,
        universityName: data.university || null,
        country: data.country || null,
        courseName: data.courseType || null,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        email: data.email || null,
        phone: data.phone || null,
        dateOfBirth: this.parseDate(data.dateOfBirth),

        address: data.address || null,
        hasCoApplicant: !!data.coApplicant && data.coApplicant !== 'none',
        coApplicantRelation: data.coApplicant !== 'none' ? data.coApplicant : null,
        coApplicantIncome: data.income ? parseFloat(data.income) : null,
        hasCollateral: !!data.collateral && data.collateral !== 'no',
        collateralType: data.collateral !== 'no' ? data.collateral : null,
        remarks: data.notes || null,
        status: 'pending',
        stage: 'application_submitted',
        progress: 10,
        submittedAt: now,
        estimatedCompletionAt: estimatedCompletionAt.toISOString(),
        updatedAt: now,
      })
      .select()
      .single();

    if (error) throw error;
    return application;
  }

  async getUserApplications(userId: string) {
    // Also try to find applications by email as a fallback
    const user = await this.findById(userId);
    const email = user?.email;

    let query = this.db
      .from('LoanApplication')
      .select('*')
      .order('id', { ascending: false });

    if (email) {
      query = query.or(`userId.eq.${userId},email.eq.${email}`);
    } else {
      query = query.eq('userId', userId);
    }

    const { data } = await query;
    return data || [];
  }

  async updateLoanApplicationStatus(applicationId: string, status: string) {
    const { data, error } = await this.db
      .from('LoanApplication')
      .update({ status })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteLoanApplication(applicationId: string) {
    const { error } = await this.db
      .from('LoanApplication')
      .delete()
      .eq('id', applicationId);
    if (error) throw error;
    return { success: true };
  }

  // Document Methods
  async upsertUserDocument(
    userId: string,
    docType: string,
    data: {
      uploaded: boolean;
      status?: string;
      filePath?: string;
      digilockerTxId?: string;
      verifiedAt?: Date;
      verificationMetadata?: any;
    },
  ) {
    const existing = await this.db
      .from('UserDocument')
      .select('id')
      .eq('userId', userId)
      .eq('docType', docType)
      .single();

    if (existing.error && existing.error.code !== 'PGRST116') {
      console.error(`[UsersService.upsertUserDocument] Lookup error for ${userId}/${docType}:`, existing.error);
      throw existing.error;
    }

    const payload: any = {
      uploaded: data.uploaded,
      status: data.status || 'pending',
      filePath: data.filePath || null,
      uploadedAt: data.uploaded ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    };
    if (data.digilockerTxId !== undefined) payload.digilockerTxId = data.digilockerTxId;
    if (data.verifiedAt !== undefined) payload.verifiedAt = data.verifiedAt?.toISOString();
    if (data.verificationMetadata !== undefined) payload.verificationMetadata = data.verificationMetadata;

    if (existing.data) {
      const { data: updated, error } = await this.db
        .from('UserDocument')
        .update(payload)
        .eq('id', existing.data.id)
        .select()
        .single();
      if (error) {
        console.error(`[UsersService.upsertUserDocument] Update error for ${userId}/${docType}:`, error);
        throw error;
      }
      return updated;
    } else {
      // For new records, we need an ID since it doesn't have a default in DB
      const id = `${userId}_${docType}_${Date.now()}`;
      const { data: created, error } = await this.db
        .from('UserDocument')
        .insert({ id, userId, docType, ...payload })
        .select()
        .single();
      if (error) {
        console.error(`[UsersService.upsertUserDocument] Insert error for ${userId}/${docType}:`, error);
        throw error;
      }
      return created;
    }
  }

  async getUserDocuments(userId: string) {
    const { data } = await this.db
      .from('UserDocument')
      .select('*')
      .eq('userId', userId)
      .order('docType', { ascending: true });
    return data || [];
  }

  async deleteUserDocument(userId: string, docType: string) {
    const { error } = await this.db
      .from('UserDocument')
      .delete()
      .eq('userId', userId)
      .eq('docType', docType);
    if (error) throw error;
    return { success: true };
  }

  // Get user dashboard data with all applications, documents and full activity feed
  async getUserDashboardData(userId: string) {
    try {
      const applications = await this.getUserApplications(userId) || [];
      const documents = await this.getUserDocuments(userId) || [];

      const { data: userWithActivity } = await this.db
        .from('User')
        .select(
          `*, eligibilityChecks:LoanEligibilityCheck(*), visaMockInterviews:VisaMockInterviewResult(*), forumPosts:ForumPost(*), forumComments:ForumComment(*), universityInquiries:UniversityInquiry(*)`,
        )
        .eq('id', userId)
        .single();

      const inquiries = userWithActivity?.universityInquiries || [];

      const activity: Array<{
        type: string;
        title: string;
        description: string;
        timestamp: string;
        link?: string;
      }> = [];

      for (const app of applications) {
        const ts = app.submittedAt || app.date;
        activity.push({
          type: 'application',
          title: `Loan Application — ${app.bank}`,
          description: `₹${(app.amount || 0).toLocaleString('en-IN')} ${app.loanType || ''}${app.universityName ? ` for ${app.universityName}` : ''}. Status: ${app.status || 'pending'}`,
          timestamp: this.safeISO(ts),
          link: '/dashboard',
        });
      }

      for (const doc of documents) {
        if (doc.uploaded) {
          const ts = doc.uploadedAt || doc.createdAt;
          activity.push({
            type: 'upload',
            title: `Document Uploaded`,
            description: `${(doc.docType || '').replace('_', ' ')} uploaded successfully`,
            timestamp: this.safeISO(ts),
            link: '/document-vault',
          });
        }
      }

      for (const inq of inquiries) {
        activity.push({
          type: inq.type === 'callback' ? 'callback' : 'inquiry',
          title: inq.type === 'callback' ? 'Callback Requested' : 'Fasttrack Application',
          description: `University: ${inq.universityName || 'N/A'}. Status: ${inq.status || 'pending'}`,
          timestamp: this.safeISO(inq.createdAt),
          link: '/explore',
        });
      }

      if (userWithActivity?.eligibilityChecks) {
        for (const check of userWithActivity.eligibilityChecks) {
          activity.push({
            type: 'eligibility',
            title: `Eligibility Result: ${check.status || 'Success'}`,
            description: `Score: ${check.score || 0}% for loan of ₹${(check.loan || 0).toLocaleString('en-IN')}`,
            timestamp: this.safeISO(check.createdAt),
            link: '/loan-eligibility',
          });
        }
      }

      if (userWithActivity?.visaMockInterviews) {
        for (const interview of userWithActivity.visaMockInterviews) {
          activity.push({
            type: 'visa_mock',
            title: `Visa Mock Interview — ${interview.visaType || 'F1'}`,
            description: `Likelihood: ${interview.approvalLikelihood || 'High'}. Risk: ${interview.overallRisk || 'Low'}. Score: ${interview.overallScore || 0}/10`,
            timestamp: this.safeISO(interview.createdAt),
            link: '/visa-mock',
          });
        }
      }

      if (userWithActivity?.forumPosts) {
        for (const post of userWithActivity.forumPosts) {
          activity.push({
            type: 'forum_post',
            title: `Forum Post: ${post.title || 'Untitled'}`,
            description: (post.content || '').substring(0, 100) + '...',
            timestamp: this.safeISO(post.createdAt),
            link: `/community/forum/${post.id}`,
          });
        }
      }

      if (userWithActivity?.forumComments) {
        for (const comment of userWithActivity.forumComments) {
          activity.push({
            type: 'forum_comment',
            title: `Commented on Forum`,
            description: (comment.content || '').substring(0, 100) + '...',
            timestamp: this.safeISO(comment.createdAt),
            link: `/community/forum/${comment.postId}`,
          });
        }
      }


      activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const sanitizedUser = userWithActivity ? { ...userWithActivity } : null;
      if (sanitizedUser) {
        delete sanitizedUser.password;
        delete sanitizedUser.refreshToken;
      }

      return {
        applications,
        documents,
        activity: activity.slice(0, 15),
        applicationCount: applications.length,
        user: sanitizedUser,
      };
    } catch (error) {
      console.error('Error in getUserDashboardData:', error);
      throw error;
    }
  }

  async deleteUser(userId: string) {
    const { error } = await this.db
      .from('User')
      .delete()
      .eq('id', userId);
    
    if (error) {
      console.error(`[UsersService.deleteUser] Error deleting user ${userId}:`, error);
      throw error;
    }
    
    return { success: true };
  }
}