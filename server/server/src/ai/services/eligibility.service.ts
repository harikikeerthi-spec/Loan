import { Injectable, Logger } from '@nestjs/common';
import { OpenRouterService } from './open-router.service';

export interface EligibilityCheckDto {
  age: number;
  credit: number;
  income: number;
  loan: number;
  employment: 'employed' | 'self' | 'student' | 'unemployed';
  study: 'undergrad' | 'masters' | 'doctoral' | 'diploma';
  maritalStatus: 'single' | 'married';
  coApplicant: 'yes' | 'no';
  collateral: 'yes' | 'no';
}

@Injectable()
export class EligibilityService {
  private readonly logger = new Logger(EligibilityService.name);

  constructor(private readonly openRouterService: OpenRouterService) {}

  async calculateEligibilityScore(data: EligibilityCheckDto): Promise<any> {
    try {
      const systemPrompt = `You are a bank loan officer. 
        Evaluate the applicant's eligibility for an education loan.
        Return the response in strict JSON format matching the following structure:
        {
            "score": number (0-100),
            "status": "eligible" | "borderline" | "unlikely",
            "ratio": number (income/loan ratio),
            "rateRange": "string (e.g. 10.5% - 12.0%)",
            "coverage": "string (e.g. Up to 80%)",
            "summary": "string"
        }
        Be strict but fair. High credit scores, co-applicants, and financial stability significantly improve eligibility.
        Ensure strict valid JSON output only. No markdown formatting.`;

      const userPrompt = `Applicant Data:
        Age: ${data.age}
        Credit Score: ${data.credit}
        Annual Income: ${data.income}
        Loan Amount: ${data.loan}
        Employment: ${data.employment}
        Study Level: ${data.study}
        Marital Status: ${data.maritalStatus}
        Co-Applicant: ${data.coApplicant}
        Collateral: ${data.collateral}`;

      const jsonResponse = await this.openRouterService.generateResponse(
        systemPrompt,
        userPrompt,
      );
      const jsonMatch = jsonResponse.match(/\{[\s\S]*\}/);
      const cleanJson = jsonMatch ? jsonMatch[0] : jsonResponse;

      return JSON.parse(cleanJson);
    } catch (error) {
      this.logger.error('Eligibility check failed', error);
      // Fallback
      return {
        score: 0,
        status: 'error',
        summary: 'AI Evaluation failed. Please try again later.',
      };
    }
  }
}
