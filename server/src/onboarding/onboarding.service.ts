import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { EmailService } from '../auth/email.service';

@Injectable()
export class OnboardingService {
  private get db() {
    return this.supabase.getClient();
  }

  constructor(
    private supabase: SupabaseService,
    private emailService: EmailService
  ) {}

  async saveOnboardingData(data: any, userId?: string) {
    try {
      let user: any;
      if (userId) {
        const { data: u } = await this.db.from('User').select('*').eq('id', userId).single();
        user = u;
      } else if (data.email) {
        const { data: u } = await this.db.from('User').select('*').eq('email', data.email).single();
        user = u;
      }

      const personal = data.personal || {};
      const academic = data.academic || {};
      const testScores = data.testScores || data.tests || {};

      const goalValue = data.goal?.value || data.goal || data.courseLevel || academic.highestLevel;
      const countryValue = data.country?.value || data.studyDestination || data.study_destination || academic.countryOfEducation || academic.undergrad?.country;
      const courseValue = data.course?.value || data.courseName || data.course_name;
      const targetUniValue = data.target_university?.label || data.targetUniversity || data.target_university;
      const intakeValue = data.start_when?.value || data.intakeSeason || data.intake_season;
      const bachelorsValue = data.bachelors_degree?.label || data.bachelorsDegree || data.currentEducation || academic.highestLevel;
      const gpaValue = data.gpa?.value ? parseFloat(data.gpa.value) : data.gpa ? parseFloat(data.gpa) : undefined;
      const workExpValue = data.work_exp?.value
        ? parseInt(data.work_exp.value)
        : data.workExperience
        ? parseInt(data.workExperience)
        : undefined;
      const entranceTestValue = data.entrance_test?.value || data.entranceTest || (testScores.gre ? 'GRE' : testScores.gmat ? 'GMAT' : testScores.sat ? 'SAT' : undefined);
      const entranceScoreValue = data.entrance_score?.value || data.entranceScore || testScores.gre || testScores.gmat || testScores.sat;
      const englishTestValue = data.english_test?.value || data.englishTest || (testScores.ielts ? 'IELTS' : testScores.toefl ? 'TOEFL' : testScores.pte ? 'PTE' : undefined);
      const englishScoreValue = data.english_score?.value || data.englishScore || testScores.ielts || testScores.toefl || testScores.pte;
      const budgetValue = data.study_budget?.label || data.budget || data.estimatedCost;
      const pincodeValue = data.loan_pincode?.value || data.pincode;
      const loanAmountValue = data.loan_amount?.label || data.loanAmount;
      const admitStatusValue = data.admit_status?.value || data.admitStatus;

      let permAddrStr = user?.permanentAddress || null;
      const permanentAddrObj = data.address?.permanent || personal.permanentAddress || data.permanentAddress;
      if (permanentAddrObj && typeof permanentAddrObj === 'object') {
        const parts = [
          permanentAddrObj.address1,
          permanentAddrObj.address2,
          permanentAddrObj.city,
          permanentAddrObj.state,
          permanentAddrObj.country,
          permanentAddrObj.pincode
        ].filter(Boolean);
        if (parts.length > 0) {
          permAddrStr = parts.join(', ');
        }
      } else if (typeof permanentAddrObj === 'string') {
        permAddrStr = permanentAddrObj;
      }

      const nonEmpty = (v: unknown): string | undefined => {
        if (v == null) return undefined;
        const s = String(v).trim();
        return s === '' ? undefined : s;
      };

      let parsedDob = user?.dateOfBirth || null;
      const dobVal = nonEmpty(personal.dob) || nonEmpty(personal.dateOfBirth) || nonEmpty(data.dob) || nonEmpty(data.dateOfBirth);
      if (dobVal) {
        const parseSimpleDate = (dateStr: string) => {
          if (!dateStr) return null;
          let d = new Date(dateStr);
          if (!isNaN(d.getTime())) return d.toISOString();
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
        };
        const resDob = parseSimpleDate(dobVal);
        if (resDob) parsedDob = resDob;
      }

      const updateData: any = {
        firstName: personal.firstName || data.firstName || user?.firstName,
        lastName: personal.lastName || data.lastName || user?.lastName,
        phoneNumber: personal.mobile || data.phone || data.phoneNumber || user?.phoneNumber,
        mobile: personal.mobile || data.phone || data.phoneNumber || user?.mobile,
        goal: goalValue,
        studyDestination: countryValue,
        courseName: courseValue,
        targetUniversity: targetUniValue,
        intakeSeason: intakeValue,
        bachelorsDegree: bachelorsValue,
        workExp: workExpValue,
        gpa: gpaValue,
        entranceTest: entranceTestValue,
        entranceScore: entranceScoreValue,
        englishTest: englishTestValue,
        englishScore: englishScoreValue,
        budget: budgetValue,
        pincode: pincodeValue,
        loanAmount: loanAmountValue,
        admitStatus: admitStatusValue,
        aadhaarNumber: nonEmpty(personal.aadhaarNumber) || nonEmpty(data.aadhaarNumber) || user?.aadhaarNumber || null,
        panNumber: nonEmpty(personal.pan) || nonEmpty(personal.panNumber) || nonEmpty(data.pan) || nonEmpty(data.panNumber) || user?.panNumber || null,
        fatherName: nonEmpty(personal.fatherName) || nonEmpty(data.fatherName) || user?.fatherName || null,
        dateOfBirth: parsedDob,
        permanentAddress: permAddrStr,
        gender: nonEmpty(personal.gender) || nonEmpty(data.gender) || user?.gender || null,
        passport: data.passport ? JSON.stringify(data.passport) : (user?.passport || null),
        nationality: data.nationality ? JSON.stringify(data.nationality) : (user?.nationality || null),
        mailingAddress: (data.address?.mailing || data.mailingAddress) ? JSON.stringify(data.address?.mailing || data.mailingAddress) : (user?.mailingAddress || null),
        emergencyContact: data.emergencyContact ? JSON.stringify(data.emergencyContact) : (user?.emergencyContact || null),
        academic: data.academic ? JSON.stringify(data.academic) : (user?.academic || null),
        workExperience: data.workExperience ? JSON.stringify(data.workExperience) : (user?.workExperience || null),
        tests: (data.testScores || data.tests) ? JSON.stringify(data.testScores || data.tests) : (user?.tests || null),
        family: (data.familyDetails || data.family) ? JSON.stringify(data.familyDetails || data.family) : (user?.family || null),
        coApplicant: data.coApplicant ? JSON.stringify(data.coApplicant) : (user?.coApplicant || null),
      };

      if (!user) {
        if (!data.email) return { success: false, message: 'Email required for new user' };
        const { data: created, error } = await this.db
          .from('User')
          .insert({ email: data.email, firstName: updateData.firstName || 'User', mobile: updateData.mobile || '', password: '', role: 'user', ...updateData })
          .select()
          .single();
        if (error) throw error;
        user = created;
      } else {
        const { data: updated, error } = await this.db
          .from('User')
          .update(updateData)
          .eq('id', user.id)
          .select()
          .single();
        if (error) throw error;
        user = updated;
      }

      const leadData = {
        userId: user.id,
        email: user.email,
        fullName: updateData.firstName && updateData.lastName
          ? `${updateData.firstName} ${updateData.lastName}`
          : (user.firstName + ' ' + (user.lastName || '')).trim(),
        phone: updateData.mobile,
        goal: goalValue,
        studyDestination: countryValue,
        courseName: courseValue,
        targetUniversity: targetUniValue,
        intakeSeason: intakeValue,
        bachelorsDegree: bachelorsValue,
        gpa: gpaValue,
        workExp: workExpValue,
        entranceTest: entranceTestValue,
        entranceScore: entranceScoreValue,
        englishTest: englishTestValue,
        englishScore: englishScoreValue,
        budget: budgetValue,
        pincode: pincodeValue,
        loanAmount: loanAmountValue,
        admitStatus: admitStatusValue,
        source: 'onboarding_bot',
        status: user.admitStatus ? 'processing' : 'pending',
      };

      // Upsert OnboardingApplication
      const { data: existingLead } = await this.db.from('OnboardingApplication').select('id').eq('userId', user.id).single();
      if (existingLead) {
        await this.db.from('OnboardingApplication').update(leadData).eq('userId', user.id);
      } else {
        await this.db.from('OnboardingApplication').insert(leadData);
      }

      // Upsert study, academic, financial preferences
      await Promise.all([
        (async () => {
          const { data: existing } = await this.db.from('UserStudyPreference').select('id').eq('userId', user.id).single();
          const pref = { userId: user.id, goal: goalValue, studyDestination: countryValue, courseName: courseValue, targetUniversity: targetUniValue, intakeSeason: intakeValue, admitStatus: admitStatusValue };
          if (existing) { await this.db.from('UserStudyPreference').update(pref).eq('userId', user.id); }
          else { await this.db.from('UserStudyPreference').insert(pref); }
        })(),
        (async () => {
          const { data: existing } = await this.db.from('UserAcademicProfile').select('id').eq('userId', user.id).single();
          const prof = { userId: user.id, bachelorsDegree: bachelorsValue, gpa: gpaValue, workExp: workExpValue, entranceTest: entranceTestValue, entranceScore: entranceScoreValue, englishTest: englishTestValue, englishScore: englishScoreValue };
          if (existing) { await this.db.from('UserAcademicProfile').update(prof).eq('userId', user.id); }
          else { await this.db.from('UserAcademicProfile').insert(prof); }
        })(),
        (async () => {
          const { data: existing } = await this.db.from('UserFinancialProfile').select('id').eq('userId', user.id).single();
          const fin = { userId: user.id, budget: budgetValue, pincode: pincodeValue, loanAmount: loanAmountValue };
          if (existing) { await this.db.from('UserFinancialProfile').update(fin).eq('userId', user.id); }
          else { await this.db.from('UserFinancialProfile').insert(fin); }
        })(),
      ]);

      return { success: true, message: 'Onboarding data saved successfully', user };
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      return { success: false, message: 'Failed to save onboarding data', error: error.message };
    }
  }

  async shareOnboardingLink(studentId: string, studentEmail: string, studentName: string, shareUrl: string, staffUser: any) {
    try {
      const staffName = staffUser.firstName && staffUser.lastName ? `${staffUser.firstName} ${staffUser.lastName}` : (staffUser.firstName || staffUser.email || 'Your Coordinator');
      const staffEmail = staffUser.email;
      
      const subject = `📋 Complete your VidhyaLoan Onboarding Profile – Shared by ${staffName}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 800;">VidhyaLoan</h1>
            <p style="color: #e0e7ff; margin: 5px 0 0; font-size: 14px; letter-spacing: 0.5px;">SECURE ONBOARDING PORTAL</p>
          </div>
          
          <div style="padding: 0 10px;">
            <h2 style="color: #111827; margin-bottom: 16px; font-size: 20px; font-weight: 700;">Hello ${studentName},</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Your dedicated academic loan coordinator, <strong>${staffName}</strong> (<a href="mailto:${staffEmail}" style="color: #4f46e5; text-decoration: none;">${staffEmail}</a>), has initiated your VidhyaLoan profile onboarding!
            </p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              To proceed with your education loan application, please click the secure link below to access your dynamic onboarding form, fill in your details, and sync your KYC documents directly.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${shareUrl}" style="background: linear-gradient(135deg, #4f46e5, #6366f1); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);">
                📋 Complete Onboarding Profile
              </a>
            </div>

            <div style="background-color: #f9fafb; border-left: 4px solid #4f46e5; border-radius: 6px; padding: 16px 20px; margin: 24px 0;">
              <h4 style="color: #1f2937; margin: 0 0 8px; font-size: 14px; font-weight: 700;">💡 What you need to prepare:</h4>
              <ul style="color: #4b5563; font-size: 13px; line-height: 1.5; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 4px;">Applicant's Aadhaar & PAN details</li>
                <li style="margin-bottom: 4px;">Academic transcripts / Marksheets</li>
                <li style="margin-bottom: 4px;">Co-Applicant/Parent income details & PAN</li>
              </ul>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 24px;">
              If you have any questions or need guidance during the application, you can reach out directly to <strong>${staffName}</strong> by replying to this email.
            </p>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; line-height: 1.5;">
                This is a secure communication from VidhyaLoan.<br>
                For security reasons, please do not share your unique onboarding link with anyone else.
              </p>
            </div>
          </div>
        </div>
      `;
      
      const text = `Hello ${studentName},\n\nYour academic loan coordinator, ${staffName} (${staffEmail}), has initiated your VidhyaLoan onboarding!\n\nTo complete your profile and proceed with your education loan application, please click the secure link below:\n\n${shareUrl}\n\nIf you have any questions, you can contact ${staffName} directly at ${staffEmail}.\n\nWarm regards,\nThe Vidhyaloan Team`;
      
      await this.emailService.sendMail(studentEmail, subject, html, text, staffEmail);
      return { success: true, message: 'Onboarding link shared successfully via email.' };
    } catch (err) {
      console.error('[OnboardingService] Failed to share onboarding link:', err);
      return { success: false, message: 'Failed to send onboarding email.', error: err.message };
    }
  }
}
