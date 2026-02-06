import { Injectable } from '@nestjs/common';
import { OpenRouterService } from './open-router.service';

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
  constructor(private readonly openRouter: OpenRouterService) { }

  async calculateEligibilityScore(data: EligibilityCheckDto): Promise<EligibilityResult> {
    const prompt = `
    Evaluate the loan eligibility for the following applicant:
    - Age: ${data.age}
    - Credit Score: ${data.credit}
    - Annual Income: ${data.income}
    - Loan Amount Requested: ${data.loan}
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

    Note: Credit score < 600 is generally risky. High loan vs low income is risky.
    `;

    try {
      return await this.openRouter.getJson<EligibilityResult>(prompt);
    } catch (error) {
      console.error('Eligibility check failed', error);
      // Fallback
      return {
        score: 50,
        status: 'borderline',
        ratio: 0,
        rateRange: '10-15%',
        coverage: 'Unknown',
        summary: 'AI Service Unavailable. Please try again later.',
        recommendations: ['Check internet connection', 'Try again later']
      };
    }
  }
}
