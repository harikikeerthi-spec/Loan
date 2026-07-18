import { Injectable } from '@nestjs/common';
import { OpenRouterService } from './openrouter.service';
import { SupabaseService } from '../../supabase/supabase.service';

export interface EligibilityCheckDto {
  age: number;
  credit: number;
  income: number;
  loan: number;
  employment: 'employed' | 'self' | 'student' | 'unemployed';
  study: 'undergrad' | 'masters' | 'doctoral' | 'diploma';
  coApplicant: 'yes' | 'no';
  collateral: 'yes' | 'no';
}

export interface EligibilityResult {
  score: number;
  status: 'eligible' | 'borderline' | 'unlikely';
  ratio: number;
  rateRange: string;
  coverage: string;
  summary: string;
  recommendations: string[];
}

@Injectable()
export class EligibilityService {
  constructor(
    private readonly openRouter: OpenRouterService,
    private readonly supabase: SupabaseService,
  ) {}

  async calculateEligibilityScore(data: EligibilityCheckDto): Promise<EligibilityResult> {
    // Mandatory requirement: CIBIL score must be > 700 for loan eligibility to apply
    if (data.credit <= 700) {
      return {
        score: Math.min(35, Math.max(10, Math.round((data.credit / 700) * 35))),
        status: 'unlikely',
        ratio: 0,
        rateRange: 'N/A',
        coverage: 'Not Applicable',
        summary: `Loan eligibility is not applicable because your CIBIL credit score (${data.credit}) is 700 or below. A minimum CIBIL score of more than 700 (> 700) is mandatory for loan eligibility.`,
        recommendations: [
          'Improve your CIBIL score to above 700 by settling outstanding dues and credit card balances',
          'Ensure zero late payments or loan defaults on active credit accounts',
          'Re-check loan eligibility once your CIBIL score exceeds 700'
        ],
      };
    }

    const prompt = `
    Evaluate the loan eligibility for the following applicant:
    - Age: ${data.age}
    - Credit Score: ${data.credit} (Mandatory requirement: CIBIL score > 700)
    - Annual Income: ${data.income} (in INR)
    - Loan Amount Requested: ${data.loan} (in INR)
    - Employment: ${data.employment}
    - Study Level: ${data.study}
    - Co-Applicant: ${data.coApplicant}
    - Collateral: ${data.collateral}

    Perform a strict risk assessment.
    1. Calculate a risk score (0-100), where 100 is perfectly safe and 0 is high risk.
    2. Determine status (eligible, borderline, unlikely).
    3. Calculate Income-to-Loan Ratio.
    4. Estimate Rate Range and Coverage based on risk.
    5. Provide a professional summary explaining the decision.
    6. Provide 3 actionable recommendations to improve eligibility (e.g. "Increase credit score", "Add co-applicant").

    Return JSON format:
    {
      "score": number,
      "status": "eligible" | "borderline" | "unlikely",
      "ratio": number,
      "rateRange": "string",
      "coverage": "string",
      "summary": "string",
      "recommendations": ["string"]
    }

    Note: Credit score must be > 700 for eligibility. High loan vs low income is risky.
    `;

    try {
      return await this.openRouter.getJson<EligibilityResult>(prompt);
    } catch (error) {
      console.error('Eligibility check failed', error);
      return {
        score: 50,
        status: 'borderline',
        ratio: 0,
        rateRange: '10-15%',
        coverage: 'Unknown',
        summary: 'AI Service Unavailable. Please try again later.',
        recommendations: ['Check internet connection', 'Try again later'],
      };
    }
  }

  async saveLog(data: any): Promise<void> {
    try {
      await this.supabase.getClient().from('LoanEligibilityCheck').insert({
        age: data.age,
        credit: data.credit,
        income: data.income,
        loan: data.loan,
        employment: data.employment,
        study: data.study,
        coApplicant: data.coApplicant,
        collateral: data.collateral,
        score: data.score,
        status: data.status,
        rateRange: data.rateRange,
        coverage: data.coverage,
        recommendations: data.recommendations,
        userId: data.userId || null,
      });
    } catch (e) {
      console.error('Failed to save eligibility log:', e);
    }
  }
}

