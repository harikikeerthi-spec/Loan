import { Injectable } from '@nestjs/common';

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
}

@Injectable()
export class EligibilityService {
  calculateEligibilityScore(data: EligibilityCheckDto): EligibilityResult {
    let score = 0;

    // Age factor (15 points max)
    if (data.age >= 18 && data.age <= 60) {
      score += 15;
    } else {
      score -= 20;
    }

    // Credit score (25 points max)
    if (data.credit >= 750) {
      score += 25;
    } else if (data.credit >= 700) {
      score += 15;
    } else if (data.credit >= 650) {
      score += 8;
    } else if (data.credit >= 600) {
      score += 2;
    } else {
      score -= 15;
    }

    // Employment status (10 points max)
    if (data.employment === 'employed') {
      score += 10;
    } else if (data.employment === 'self') {
      score += 7;
    } else if (data.employment === 'student') {
      score += 4;
    } else {
      score -= 10;
    }

    // Education level (7 points max)
    if (data.study === 'doctoral') {
      score += 7;
    } else if (data.study === 'masters') {
      score += 6;
    } else if (data.study === 'undergrad') {
      score += 4;
    } else {
      score += 2;
    }

    // Co-applicant (8 points max)
    if (data.coApplicant === 'yes') {
      score += 8;
    }

    // Collateral (10 points max)
    if (data.collateral === 'yes') {
      score += 10;
    }

    // Income-to-Loan Ratio (20 points max)
    const ratio = data.income / Math.max(1, data.loan);
    if (ratio >= 1.5) {
      score += 20;
    } else if (ratio >= 1) {
      score += 12;
    } else if (ratio >= 0.6) {
      score += 6;
    } else {
      score -= 10;
    }

    const normalized = Math.max(0, Math.min(100, score));

    let status: 'eligible' | 'borderline' | 'unlikely' = 'unlikely';
    if (normalized >= 70) {
      status = 'eligible';
    } else if (normalized >= 50) {
      status = 'borderline';
    }

    const rateRange =
      normalized >= 70 ? '8.5% - 10.9%' : normalized >= 50 ? '10.5% - 13.5%' : '12.5% - 16.5%';
    const coverage =
      normalized >= 70 ? 'Up to 95% of course cost' : normalized >= 50 ? 'Up to 80% of course cost' : 'Up to 60% of course cost';

    const summary =
      normalized >= 70
        ? `Based on your profile, estimated coverage is ${coverage}. Expected rate range: ${rateRange}. Your affordability ratio is ${ratio.toFixed(2)} with an annual income of $${data.income.toLocaleString()}.`
        : `Your profile shows moderate eligibility. Consider improving your credit score or increasing co-applicant support. Coverage: ${coverage}, Rate: ${rateRange}`;

    return {
      score: normalized,
      status,
      ratio,
      rateRange,
      coverage,
      summary,
    };
  }
}
