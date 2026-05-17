import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class OnboardingService {
  private get db() {
    return this.supabase.getClient();
  }

  constructor(private supabase: SupabaseService) {}

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

      let parsedDob = user?.dateOfBirth || null;
      const dobVal = personal.dob || personal.dateOfBirth || data.dob || data.dateOfBirth;
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
        aadhaarNumber: personal.aadhaarNumber || data.aadhaarNumber || user?.aadhaarNumber || null,
        panNumber: personal.pan || personal.panNumber || data.pan || data.panNumber || user?.panNumber || null,
        fatherName: personal.fatherName || data.fatherName || user?.fatherName || null,
        dateOfBirth: parsedDob,
        permanentAddress: permAddrStr,
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
}
