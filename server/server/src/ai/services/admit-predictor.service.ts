import { Injectable } from '@nestjs/common';
import { OpenRouterService } from './open-router.service';

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
    constructor(private readonly openRouter: OpenRouterService) { }

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
    ];

    async predict(profile: StudentProfile) {
        const prompt = `
        Predict the admission probability for a student applying to ${profile.targetUniversity}.
        
        Student Profile:
        - Program Level: ${profile.programLevel}
        - GPA: ${profile.gpa} (Scale: ${profile.gpaScale})
        - Test Score: ${profile.testScoreType} ${profile.testScore}
        - English Efficiency: ${profile.englishTestType} ${profile.englishTestScore}
        - Experience: ${profile.experienceYears} years
        - Research Papers: ${profile.researchPapers}
        
        Provide the result in JSON format:
        {
          "university": "${profile.targetUniversity}",
          "probability": number (0-100),
          "feedback": ["string", "string"],
          "tier": number (1, 2, or 3 based on university reputation)
        }

        Be realistic. Top universities (Ivy League, etc.) should have lower probabilities unless the profile is exceptional.
        `;

        try {
            return await this.openRouter.getJson(prompt);
        } catch (error) {
            console.error('Admit Predictor failed', error);
            // Fallback to simple logic if AI fails
            return {
                university: profile.targetUniversity,
                probability: 50,
                feedback: ['AI service unavailable. Using default prediction.', 'Please check connection.'],
                tier: 2
            };
        }
    }

    getUniversitiesList() {
        return this.universities.map(u => u.name);
    }
}
