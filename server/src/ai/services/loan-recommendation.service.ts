import { Injectable } from '@nestjs/common';
import { OpenRouterService } from './openrouter.service';
import { SupabaseService } from '../../supabase/supabase.service';

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

const DEFAULT_PARTNERS = [
  {
    id: 'avanse',
    name: 'Avanse Financial',
    type: 'NBFC',
    interestRateMin: 10.0,
    interestRateMax: 13.0,
    maxLoanAmount: '50 Lakhs',
    collateralRequired: false,
    collateralFreeLimit: '45 Lakhs',
    processingFee: '1% - 2%',
    processingTime: '4-6 Days',
    features: ['100% funding', 'Fast sanction', 'No upper limit on loan amount']
  },
  {
    id: 'credila',
    name: 'HDFC Credila',
    type: 'NBFC',
    interestRateMin: 8.5,
    interestRateMax: 11.5,
    maxLoanAmount: '1.5 Crore',
    collateralRequired: false,
    collateralFreeLimit: '75 Lakhs',
    processingFee: '1%',
    processingTime: '3-5 Days',
    features: ['Tax benefits under Sec 80E', 'HDFC Trust', 'No upper limit on loan amount']
  },
  {
    id: 'idfc',
    name: 'IDFC FIRST Bank',
    type: 'Private Bank',
    interestRateMin: 9.0,
    interestRateMax: 12.0,
    maxLoanAmount: '75 Lakhs',
    collateralRequired: false,
    collateralFreeLimit: '50 Lakhs',
    processingFee: '1%',
    processingTime: '5-7 Days',
    features: ['Paperless application', 'Attractive interest rates', 'Multi-city co-applicant permitted']
  },
  {
    id: 'auxilo',
    name: 'Auxilo Finserve',
    type: 'NBFC',
    interestRateMin: 9.5,
    interestRateMax: 12.5,
    maxLoanAmount: '40 Lakhs',
    collateralRequired: false,
    collateralFreeLimit: '40 Lakhs',
    processingFee: '1% - 1.5%',
    processingTime: '5-7 Days',
    features: ['Customized loans', 'Multi-city co-applicants', 'Flexible collateral options']
  },
  {
    id: 'incred',
    name: 'InCred',
    type: 'NBFC',
    interestRateMin: 10.25,
    interestRateMax: 13.5,
    maxLoanAmount: '45 Lakhs',
    collateralRequired: false,
    collateralFreeLimit: '40 Lakhs',
    processingFee: '1% - 1.5%',
    processingTime: '5-7 Days',
    features: ['Minimal documentation', 'Flexible repayment options', 'No collateral required']
  }
];

@Injectable()
export class LoanRecommendationService {
  constructor(
    private readonly openRouter: OpenRouterService,
    private readonly supabase: SupabaseService,
  ) { }

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

    let partnerBanks: any[] = [];
    try {
      const { data: priorities, error: pError } = await this.supabase
        .from('BankPriority')
        .select('bankName')
        .eq('status', 'Active');
      
      if (pError) throw pError;
      
      const partnerNames = priorities ? priorities.map((p: any) => p.bankName) : [];
      
      if (partnerNames.length > 0) {
        const { data: banks, error: bError } = await this.supabase
          .from('Bank')
          .select('*')
          .in('name', partnerNames);
        
        if (bError) throw bError;
        
        if (banks && banks.length > 0) {
          partnerBanks = banks;
        }
      }
    } catch (e) {
      console.error('Failed to query partner banks, using default partner list:', e);
    }

    if (partnerBanks.length === 0) {
      partnerBanks = DEFAULT_PARTNERS;
    }

    const partnerListString = JSON.stringify(partnerBanks.map((b: any) => ({
      id: b.id,
      bank: b.name,
      type: b.type,
      interestRateRange: `${b.interestRateMin || b.interestRateMin === 0 ? b.interestRateMin : 9.5}% - ${b.interestRateMax || b.interestRateMax === 0 ? b.interestRateMax : 12.5}%`,
      maxLoanAmount: b.maxLoanAmount || '40 Lakhs',
      collateralRequired: !!b.collateralRequired,
      collateralFreeLimit: b.collateralFreeLimit || 'Not Specified',
      processingFee: b.processingFee || '1%',
      processingTime: b.processingTime || '5-7 Days',
      features: b.features || []
    })), null, 2);

    const prompt = `
    Based on the following student loan applicant profile, recommend the best loan offers chosen ONLY from the provided list of partner banks.
    Do not recommend any bank that is not in the partner list below.

    Applicant Profile:
    ${profile}

    Available Partner Banks:
    ${partnerListString}

    Task:
    1. Select the "Primary" loan offer that is the best fit for the applicant from the partner banks list.
    2. Select 2 "Alternative" loan offers with slightly different terms from the other partner banks in the list.
    3. Calculate a "fit" score (0-100) for each.

    Return JSON format:
    {
      "primary": { 
        "offer": {
          "id": "partner-bank-id-from-list",
          "bank": "Bank Name from list",
          "name": "Loan Product Name (e.g. [Bank Name] Education Loan)",
          "minScore": number,
          "minCredit": number,
          "minRatio": number,
          "maxLoan": number,
          "requiresCoApplicant": boolean,
          "requiresCollateral": boolean,
          "apr": "string range (aligned with the partner bank's interest rate range, e.g. 9.5% - 11.0%)",
          "coverage": "string (e.g. Up to 100% or Up to 80%)",
          "bestFor": "string reason (e.g. No collateral, low rate, etc.)"
        }, 
        "fit": number 
      },
      "alternatives": [
        { 
          "offer": {
            "id": "partner-bank-id-from-list",
            "bank": "Bank Name from list",
            "name": "Loan Product Name (e.g. [Bank Name] Education Loan)",
            "minScore": number,
            "minCredit": number,
            "minRatio": number,
            "maxLoan": number,
            "requiresCoApplicant": boolean,
            "requiresCollateral": boolean,
            "apr": "string range (aligned with the partner bank's interest rate range, e.g. 9.5% - 11.0%)",
            "coverage": "string (e.g. Up to 100% or Up to 80%)",
            "bestFor": "string reason (e.g. No collateral, low rate, etc.)"
          }, 
          "fit": number 
        }
      ]
    }
    
    Ensure the terms are realistic for the applicant's profile and match the partner bank's details.
    `;

    try {
      return await this.openRouter.getJson<LoanRecommendationResult>(prompt);
    } catch (error) {
      console.error('Loan recommendation failed', error);
      // Fallback using actual partner banks only
      return {
        primary: {
          offer: {
            id: 'fallback-credila',
            bank: 'HDFC Credila',
            name: 'HDFC Credila Unsecured Education Loan',
            minScore: 60,
            minCredit: 700,
            minRatio: 0.1,
            maxLoan: 15000000,
            requiresCoApplicant: true,
            requiresCollateral: false,
            apr: '8.50% - 11.50%',
            coverage: 'Up to 100%',
            bestFor: 'Higher loan limits and lower rates'
          },
          fit: 85
        },
        alternatives: [
          {
            offer: {
              id: 'fallback-idfc',
              bank: 'IDFC FIRST Bank',
              name: 'IDFC FIRST Education Loan',
              minScore: 50,
              minCredit: 650,
              minRatio: 0.2,
              maxLoan: 7500000,
              requiresCoApplicant: true,
              requiresCollateral: false,
              apr: '9.00% - 12.00%',
              coverage: 'Up to 100%',
              bestFor: 'Attractive rate and paperless approval'
            },
            fit: 75
          }
        ]
      };
    }
  }
}
