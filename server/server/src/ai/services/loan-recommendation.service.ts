import { Injectable } from '@nestjs/common';
import { GroqService } from './groq.service';

export interface LoanOffer {
  id: string;
  bank: string;
  name: string;
  minScore: number;
  minCredit: number;
  minRatio: number;
  maxLoan: number;
  requiresCoApplicant: boolean;
  requiresCollateral: boolean;
  apr: string;
  coverage: string;
  bestFor: string;
}

export interface LoanRecommendationResult {
  primary: { offer: LoanOffer; fit: number };
  alternatives: Array<{ offer: LoanOffer; fit: number }>;
}

@Injectable()
export class LoanRecommendationService {
  constructor(private readonly groq: GroqService) { }

  async recommendLoans(
    score: number,
    credit: number,
    ratio: number,
    loan: number,
    coApplicant: 'yes' | 'no',
    collateral: 'yes' | 'no',
    study: string,
  ): Promise<LoanRecommendationResult> {
    const profile = `
      Validation Score: ${score}
      Credit Score: ${credit}
      Income Ratio: ${ratio}
      Loan Amount: ${loan} (in INR)
      Co-Applicant: ${coApplicant}
      Collateral: ${collateral}
      Study Level: ${study}
    `;

    const prompt = `
    Based on the following student loan applicant profile, GENERATE 3 realistic and competitive loan offers.
    Do not use a predefined list. Create offers that would be suitable from major banks or fintech lenders.

    Applicant Profile:
    ${profile}

    Task:
    1. Generate a "Primary" loan offer that is the best fit.
    2. Generate 2 "Alternative" offers with slightly different terms (e.g. lower rate but requires collateral, or flexibility but higher rate).
    3. Calculate a "fit" score (0-100) for each.

    Return JSON format:
    {
      "primary": { 
        "offer": {
          "id": "generated-id-1",
          "bank": "Bank Name",
          "name": "Loan Product Name",
          "minScore": number,
          "minCredit": number,
          "minRatio": number,
          "maxLoan": number,
          "requiresCoApplicant": boolean,
          "requiresCollateral": boolean,
          "apr": "string range (e.g. 9.5% - 11.0%)",
          "coverage": "string (e.g. Up to 100%)",
          "bestFor": "string reason"
        }, 
        "fit": number 
      },
      "alternatives": [
        { "offer": { ...same structure... }, "fit": number }
      ]
    }
    
    Ensure the terms are realistic for the credit variance and profile provided.
    `;

    try {
      return await this.groq.getJson<LoanRecommendationResult>(prompt);
    } catch (error) {
      console.error('Loan recommendation failed', error);
      throw error;
    }
  }
}
