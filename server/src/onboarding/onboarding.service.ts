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

      const goalValue = data.goal?.value || data.goal || data.courseLevel;
      const countryValue = data.country?.value || data.studyDestination || data.study_destination;
      const courseValue = data.course?.value || data.courseName || data.course_name;
      const targetUniValue = data.target_university?.label || data.targetUniversity || data.target_university;
      const intakeValue = data.start_when?.value || data.intakeSeason || data.intake_season;
      const bachelorsValue = data.bachelors_degree?.label || data.bachelorsDegree || data.currentEducation;
      const gpaValue = data.gpa?.value ? parseFloat(data.gpa.value) : data.gpa ? parseFloat(data.gpa) : undefined;
      const workExpValue = data.work_exp?.value
        ? parseInt(data.work_exp.value)
        : data.workExperience
        ? parseInt(data.workExperience)
        : undefined;
      const entranceTestValue = data.entrance_test?.value || data.entranceTest;
      const entranceScoreValue = data.entrance_score?.value || data.entranceScore;
      const englishTestValue = data.english_test?.value || data.englishTest;
      const englishScoreValue = data.english_score?.value || data.englishScore;
      const budgetValue = data.study_budget?.label || data.budget || data.estimatedCost;
      const pincodeValue = data.loan_pincode?.value || data.pincode;
      const loanAmountValue = data.loan_amount?.label || data.loanAmount;
      const admitStatusValue = data.admit_status?.value || data.admitStatus;

      const updateData: any = {
        firstName: data.firstName || user?.firstName,
        lastName: data.lastName || user?.lastName,
        phoneNumber: data.phone || data.phoneNumber || user?.phoneNumber,
        mobile: data.phone || data.phoneNumber || user?.mobile,
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
