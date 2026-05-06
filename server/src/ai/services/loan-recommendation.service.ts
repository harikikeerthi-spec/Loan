import { Injectable } from '@nestjs/common';

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
  private readonly loanOffers: LoanOffer[] = [
    {
      id: 'aurora-student-core',
      bank: 'Aurora Bank',
      name: 'Global Scholar Starter Loan',
      minScore: 55,
      minCredit: 640,
      minRatio: 0.8,
      maxLoan: 85000,
      requiresCoApplicant: true,
      requiresCollateral: false,
      apr: '10.2% - 12.9%',
      coverage: 'Up to 85% of course cost',
      bestFor: 'Undergraduate and masters students with co-applicant support.',
    },
    {
      id: 'veridian-secured',
      bank: 'Veridian Capital',
      name: 'Secure Path Education Loan',
      minScore: 60,
      minCredit: 670,
      minRatio: 0.9,
      maxLoan: 180000,
      requiresCoApplicant: false,
      requiresCollateral: true,
      apr: '8.8% - 11.4%',
      coverage: 'Up to 95% of course cost',
      bestFor: 'Higher loan amounts backed by collateral.',
    },
    {
      id: 'summit-premier',
      bank: 'Summit Federal',
      name: 'Premier International Student Loan',
      minScore: 70,
      minCredit: 720,
      minRatio: 1.1,
      maxLoan: 220000,
      requiresCoApplicant: false,
      requiresCollateral: false,
      apr: '8.1% - 10.5%',
      coverage: 'Up to 90% of course cost',
      bestFor: 'Strong credit profiles seeking competitive rates.',
    },
    {
      id: 'nova-flex',
      bank: 'Nova Learners Bank',
      name: 'Flexi Study Loan',
      minScore: 48,
      minCredit: 610,
      minRatio: 0.7,
      maxLoan: 60000,
      requiresCoApplicant: false,
      requiresCollateral: false,
      apr: '12.0% - 15.8%',
      coverage: 'Up to 70% of course cost',
      bestFor: 'Students needing smaller loan sizes with quick approvals.',
    },
    {
      id: 'harbor-support',
      bank: 'Harbor Trust',
      name: 'Co-Applicant Advantage Loan',
      minScore: 50,
      minCredit: 630,
      minRatio: 0.75,
      maxLoan: 120000,
      requiresCoApplicant: true,
      requiresCollateral: false,
      apr: '9.9% - 12.6%',
      coverage: 'Up to 88% of course cost',
      bestFor: 'Applicants with a reliable co-applicant and stable income.',
    },
  ];

  recommendLoans(
    score: number,
    credit: number,
    ratio: number,
    loan: number,
    coApplicant: 'yes' | 'no',
    collateral: 'yes' | 'no',
    study: string,
  ): LoanRecommendationResult {
    const scored = this.loanOffers.map((offer) => ({
      offer,
      fit: this.calculateOfferFit(
        offer,
        score,
        credit,
        ratio,
        loan,
        coApplicant,
        collateral,
        study,
      ),
    }));

    scored.sort((a, b) => b.fit - a.fit);

    return {
      primary: scored[0],
      alternatives: scored.slice(1, 3),
    };
  }

  private calculateOfferFit(
    offer: LoanOffer,
    score: number,
    credit: number,
    ratio: number,
    loan: number,
    coApplicant: 'yes' | 'no',
    collateral: 'yes' | 'no',
    study: string,
  ): number {
    let fit = 0;

    if (score >= offer.minScore) {
      fit += 25;
    } else {
      fit -= offer.minScore - score;
    }

    if (credit >= offer.minCredit) {
      fit += 20;
    } else {
      fit -= (offer.minCredit - credit) / 5;
    }

    if (ratio >= offer.minRatio) {
      fit += 20;
    } else {
      fit -= (offer.minRatio - ratio) * 40;
    }

    if (loan <= offer.maxLoan) {
      fit += 15;
    } else {
      fit -= (loan - offer.maxLoan) / 2000;
    }

    if (offer.requiresCoApplicant) {
      fit += coApplicant === 'yes' ? 10 : -20;
    }

    if (offer.requiresCollateral) {
      fit += collateral === 'yes' ? 10 : -20;
    }

    if (study === 'doctoral' || study === 'masters') {
      fit += 5;
    }

    return fit;
  }
}
