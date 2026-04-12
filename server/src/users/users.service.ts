import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UsersService {
  private get db() {
    return this.supabase.getClient();
  }

  constructor(private supabase: SupabaseService) {}

  async findOne(email: string) {
    const { data } = await this.db.from('User').select('*').eq('email', email).single();
    return data;
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
  }) {
    let dobDate: string | null = null;
    if (data.dateOfBirth) {
      const dobParts = data.dateOfBirth.split('-');
      if (dobParts.length === 3) {
        const day = parseInt(dobParts[0], 10);
        const month = parseInt(dobParts[1], 10) - 1;
        const year = parseInt(dobParts[2], 10);
        dobDate = new Date(year, month, day).toISOString();
      }
    }

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
      })
      .select()
      .single();

    if (error) throw error;
    return user;
  }

  async findAll() {
    const { data } = await this.db.from('User').select('*');
    return data || [];
  }

  async updateUserDetails(
    email: string,
    firstName: string,
    lastName: string,
    phoneNumber: string,
    dateOfBirth: string,
  ) {
    let dobDate: string | null = null;
    if (dateOfBirth) {
      const dobParts = dateOfBirth.split('-');
      if (dobParts.length === 3) {
        const day = parseInt(dobParts[0], 10);
        const month = parseInt(dobParts[1], 10) - 1;
        const year = parseInt(dobParts[2], 10);
        dobDate = new Date(year, month, day).toISOString();
      }
    }

    const { data, error } = await this.db
      .from('User')
      .update({ firstName, lastName, phoneNumber, dateOfBirth: dobDate })
      .eq('email', email)
      .select()
      .single();

    if (error) throw error;
    return data;
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

  async updateUserRole(email: string, role: 'admin' | 'user' | 'staff' | 'super_admin') {
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
    const { data: application, error } = await this.db
      .from('LoanApplication')
      .insert({
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
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : null,
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
        submittedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return application;
  }

  async getUserApplications(userId: string) {
    const { data } = await this.db
      .from('LoanApplication')
      .select('*')
      .eq('userId', userId)
      .order('date', { ascending: false });
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

    const payload: any = {
      uploaded: data.uploaded,
      status: data.status || 'pending',
      filePath: data.filePath || null,
      uploadedAt: data.uploaded ? new Date().toISOString() : null,
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
      if (error) throw error;
      return updated;
    } else {
      const { data: created, error } = await this.db
        .from('UserDocument')
        .insert({ userId, docType, ...payload })
        .select()
        .single();
      if (error) throw error;
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
          timestamp: ts ? new Date(ts).toISOString() : new Date().toISOString(),
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
            timestamp: ts ? new Date(ts).toISOString() : new Date().toISOString(),
            link: '/document-vault',
          });
        }
      }

      for (const inq of inquiries) {
        activity.push({
          type: inq.type === 'callback' ? 'callback' : 'inquiry',
          title: inq.type === 'callback' ? 'Callback Requested' : 'Fasttrack Application',
          description: `University: ${inq.universityName || 'N/A'}. Status: ${inq.status || 'pending'}`,
          timestamp: new Date(inq.createdAt).toISOString(),
          link: '/explore',
        });
      }

      if (userWithActivity?.eligibilityChecks) {
        for (const check of userWithActivity.eligibilityChecks) {
          activity.push({
            type: 'eligibility',
            title: `Eligibility Result: ${check.status || 'Success'}`,
            description: `Score: ${check.score || 0}% for loan of ₹${(check.loan || 0).toLocaleString('en-IN')}`,
            timestamp: new Date(check.createdAt).toISOString(),
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
            timestamp: new Date(interview.createdAt).toISOString(),
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
            timestamp: new Date(post.createdAt).toISOString(),
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
            timestamp: new Date(comment.createdAt).toISOString(),
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
}