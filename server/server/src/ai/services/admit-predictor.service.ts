import { Injectable } from '@nestjs/common';

export interface StudentProfile {
    targetUniversity: string;
    gpa: number; // Assumed to be converted to 4.0 scale or 10.0 scale by frontend, but we'll normalize here
    gpaScale: 4 | 10;
    testScoreType: 'GRE' | 'GMAT' | 'SAT' | 'ACT' | 'None';
    testScore: number;
    englishTestType: 'IELTS' | 'TOEFL' | 'PTE' | 'None';
    englishTestScore: number;
    experienceYears: number;
    researchPapers: number;
    programLevel: 'Undergraduate' | 'Masters' | 'PhD' | 'MBA';
}

interface UniversityParams {
    name: string;
    tier: 1 | 2 | 3; // 1 = Ivy/Top, 2 = Mid/Good, 3 = Safe/Regional
    minGpa: number; // 4.0 scale
    avgGre?: number;
    avgGmat?: number;
    avgSat?: number;
    minIelts?: number;
    minToefl?: number;
    acceptanceRate: number; // percent
}

@Injectable()
export class AdmitPredictorService {
    // extensive mock db
    private universities: UniversityParams[] = [
        { name: 'Stanford University', tier: 1, minGpa: 3.8, avgGre: 328, avgSat: 1520, minIelts: 7.5, minToefl: 100, acceptanceRate: 4 },
        { name: 'Massachusetts Institute of Technology (MIT)', tier: 1, minGpa: 3.9, avgGre: 330, avgSat: 1540, minIelts: 7.5, minToefl: 100, acceptanceRate: 4 },
        { name: 'Harvard University', tier: 1, minGpa: 3.9, avgGre: 326, avgSat: 1530, minIelts: 7.5, minToefl: 100, acceptanceRate: 3 },
        { name: 'University of Oxford', tier: 1, minGpa: 3.7, avgGre: 320, minIelts: 7.5, acceptanceRate: 17 },
        { name: 'University of Cambridge', tier: 1, minGpa: 3.8, minIelts: 7.5, acceptanceRate: 21 },
        { name: 'Imperial College London', tier: 1, minGpa: 3.6, minIelts: 7.0, acceptanceRate: 14 },
        { name: 'University of Toronto', tier: 2, minGpa: 3.5, minIelts: 6.5, acceptanceRate: 43 },
        { name: 'University of British Columbia', tier: 2, minGpa: 3.3, minIelts: 6.5, acceptanceRate: 52 },
        { name: 'National University of Singapore (NUS)', tier: 1, minGpa: 3.7, minIelts: 6.5, acceptanceRate: 5 },
        { name: 'University of Melbourne', tier: 2, minGpa: 3.2, minIelts: 6.5, acceptanceRate: 70 },
        { name: 'Arizona State University', tier: 3, minGpa: 3.0, avgGre: 300, minIelts: 6.0, acceptanceRate: 88 },
        { name: 'Northeastern University', tier: 2, minGpa: 3.5, avgGre: 310, minIelts: 7.0, acceptanceRate: 18 },
        { name: 'University of Texas at Dallas', tier: 2, minGpa: 3.2, avgGre: 310, minIelts: 6.5, acceptanceRate: 79 },
        // Add generic fallback
        { name: 'Generic Top Tier', tier: 1, minGpa: 3.8, avgGre: 325, minIelts: 7.5, acceptanceRate: 10 },
        { name: 'Generic Mid Tier', tier: 2, minGpa: 3.2, avgGre: 310, minIelts: 6.5, acceptanceRate: 50 },
        { name: 'Generic Safe Tier', tier: 3, minGpa: 2.8, avgGre: 290, minIelts: 6.0, acceptanceRate: 80 },
    ];

    predict(profile: StudentProfile) {
        const uni = this.findUniversity(profile.targetUniversity);
        const normalizedGpa = this.normalizeExamplesGpa(profile.gpa, profile.gpaScale);

        let score = 0;
        const feedback: string[] = [];

        // 1. GPA Analysis (40%)
        const gpaDiff = normalizedGpa - uni.minGpa;
        if (gpaDiff >= 0.2) score += 40;
        else if (gpaDiff >= 0) score += 35;
        else if (gpaDiff >= -0.3) {
            score += 20;
            feedback.push('GPA is slightly below average for this university.');
        } else {
            score += 5;
            feedback.push('GPA is significantly below the typical range.');
        }

        // 2. Test Scores (30%)
        let testScorePoints = 0;
        if (profile.testScoreType !== 'None') {
            let benchmark = 0;
            if (profile.testScoreType === 'GRE') benchmark = uni.avgGre || 310;
            if (profile.testScoreType === 'GMAT') benchmark = uni.avgGmat || 650;
            if (profile.testScoreType === 'SAT') benchmark = uni.avgSat || 1400;

            if (profile.testScore >= benchmark + 10) testScorePoints = 30;
            else if (profile.testScore >= benchmark) testScorePoints = 25;
            else if (profile.testScore >= benchmark - 20) {
                testScorePoints = 15;
                feedback.push(`Your ${profile.testScoreType} score is below the average (${benchmark}).`);
            } else {
                testScorePoints = 5;
                feedback.push(`Your ${profile.testScoreType} score may be a bottleneck.`);
            }
        } else {
            // If required but missing
            if (uni.tier === 1) {
                testScorePoints = 0;
                feedback.push('A strong test score is highly recommended for this top-tier university.');
            } else {
                testScorePoints = 20; // Tests might be optional for lower tiers
                feedback.push('Check if test scores are optional. Submitting a good score can help.');
            }
        }
        score += testScorePoints;

        // 3. English Proficiency (10%)
        let englishPoints = 10;
        const minIelts = uni.minIelts || 6.5;
        const minToefl = uni.minToefl || 90;

        if (profile.englishTestType === 'IELTS' && profile.englishTestScore < minIelts) {
            englishPoints = 0;
            feedback.push(`IELTS score is below the minimum requirement of ${minIelts}.`);
        } else if (profile.englishTestType === 'TOEFL' && profile.englishTestScore < minToefl) {
            englishPoints = 0;
            feedback.push(`TOEFL score is below the minimum requirement of ${minToefl}.`);
        } else if (profile.englishTestType === 'None') {
            englishPoints = 5;
            feedback.push('English proficiency test is likely required.');
        }
        score += englishPoints;

        // 4. Profile Extracurriculars/Research (20%)
        let extrasPoints = 0;
        // Work Experience
        if (profile.experienceYears >= 2) extrasPoints += 10;
        else if (profile.experienceYears > 0) extrasPoints += 5;

        // Research
        if (profile.programLevel === 'PhD' || profile.programLevel === 'Masters') {
            if (profile.researchPapers >= 2) extrasPoints += 10;
            else if (profile.researchPapers >= 1) extrasPoints += 5;
            else if (uni.tier === 1) feedback.push('Research experience is crucial for top-tier graduate programs.');
        } else {
            // Undergrad - treat papers as significant extracurricular achievements
            if (profile.researchPapers >= 1) extrasPoints += 10; // Very impressive for undergrad
        }

        // Cap extras at 20
        score += Math.min(20, extrasPoints);


        // Final Adjustment based on Tier Difficulty
        if (uni.tier === 1 && score > 90) score = 85 + Math.random() * 10; // Hard to get 100% chance for Ivy
        if (uni.tier === 1 && score > 70 && score < 85) score -= 10; // Selection bias

        return {
            university: uni.name,
            probability: Math.min(98, Math.round(score)),
            feedback: feedback.length ? feedback : ['Your profile looks strong!'],
            tier: uni.tier
        };
    }

    private findUniversity(name: string): UniversityParams {
        const found = this.universities.find(u => u.name.toLowerCase().includes(name.toLowerCase()));
        if (found) return found;

        // Heuristic fallback based on name or just Generic
        if (name.toLowerCase().includes('state') || name.toLowerCase().includes('college')) {
            return this.universities.find(u => u.name === 'Generic Mid Tier')!;
        }
        return this.universities.find(u => u.name === 'Generic Top Tier')!;
    }

    private normalizeExamplesGpa(gpa: number, scale: number): number {
        if (scale === 10) return (gpa / 10) * 4;
        return gpa;
    }

    getUniversitiesList() {
        return this.universities.map(u => u.name).filter(n => !n.startsWith('Generic'));
    }
}
