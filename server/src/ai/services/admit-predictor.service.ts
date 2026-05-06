import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { OpenRouterService } from './open-router.service';

export interface StudentProfile {
  targetUniversity: string;
  gpa: number;
  gpaScale: 4 | 10;
  testScoreType: 'GRE' | 'GMAT' | 'SAT' | 'ACT' | 'None';
  testScore: number;
  englishTestType: 'IELTS' | 'TOEFL' | 'PTE' | 'Duolingo' | 'MOI' | 'None';
  englishTestScore: number;
  experienceYears: number;
  researchPapers: number;
  programLevel: 'Undergraduate' | 'Masters' | 'PhD' | 'MBA';
  moiIntermediateMarks?: number;
  moiInstitution?: string;
}

@Injectable()
export class AdmitPredictorService {
  private readonly logger = new Logger(AdmitPredictorService.name);

  constructor(private readonly openRouterService: OpenRouterService) {}

  async predict(profile: StudentProfile): Promise<any> {
    // Validate Inputs
    if (profile.gpa < 0 || profile.gpa > profile.gpaScale) {
      throw new BadRequestException(
        `GPA must be between 0 and ${profile.gpaScale}`,
      );
    }

    if (
      profile.testScoreType === 'GRE' &&
      (profile.testScore < 260 || profile.testScore > 340)
    ) {
      throw new BadRequestException('GRE score must be between 260 and 340');
    }
    if (
      profile.testScoreType === 'GMAT' &&
      (profile.testScore < 200 || profile.testScore > 800)
    ) {
      throw new BadRequestException('GMAT score must be between 200 and 800');
    }
    if (
      profile.testScoreType === 'SAT' &&
      (profile.testScore < 400 || profile.testScore > 1600)
    ) {
      throw new BadRequestException('SAT score must be between 400 and 1600');
    }

    if (
      profile.englishTestType === 'IELTS' &&
      (profile.englishTestScore < 0 || profile.englishTestScore > 9)
    ) {
      throw new BadRequestException('IELTS score must be between 0 and 9');
    }
    if (
      profile.englishTestType === 'TOEFL' &&
      (profile.englishTestScore < 0 || profile.englishTestScore > 120)
    ) {
      throw new BadRequestException('TOEFL score must be between 0 and 120');
    }
    if (
      profile.englishTestType === 'PTE' &&
      (profile.englishTestScore < 10 || profile.englishTestScore > 90)
    ) {
      throw new BadRequestException('PTE score must be between 10 and 90');
    }
    if (
      profile.englishTestType === 'Duolingo' &&
      (profile.englishTestScore < 10 || profile.englishTestScore > 160)
    ) {
      throw new BadRequestException(
        'Duolingo score must be between 10 and 160',
      );
    }
    if (profile.englishTestType === 'MOI') {
      if (
        profile.moiIntermediateMarks === undefined ||
        profile.moiIntermediateMarks < 0 ||
        profile.moiIntermediateMarks > 200
      ) {
        throw new BadRequestException(
          'Intermediate English marks must be between 0 and 200',
        );
      }
    }

    try {
      const systemPrompt = `You are an expert university admissions counselor. 
            Evaluate the student's chances of admission to the target university based on their profile.
            Return the response in strict JSON format matching the following structure:
            {
                "university": "Target University Name",
                "probability": number (0-100),
                "tier": 1 | 2 | 3 (1=Top/Ivy, 2=Good/Mid, 3=Safe),
                "feedback": ["string", "string"] // List of specific feedback/suggestions
            }
            CRITICAL: If 'moiInstitution' is provided, you MUST verify if it is a legitimate, real educational institution in India.
            - If the institution name appears to be fake, gibberish, or clearly invalid (e.g. "Abc College", "Fake Info", random characters), set "probability" to 0 and add "Invalid Institution Name" to feedback.
            - Be strict about this. Only accept plausible real institution names.
            Be realistic with admission chances. Top universities (Harvard, MIT, etc.) should rarely have high probabilities (>30%) unless the profile is exceptional.
            Ensure strict valid JSON output only. No markdown formatting.`;

      let userPrompt = `Profile:
            Target University: ${profile.targetUniversity}
            Program Level: ${profile.programLevel}
            GPA: ${profile.gpa} (Scale: ${profile.gpaScale})
            Test Score: ${profile.testScoreType} - ${profile.testScore}
            English Test: ${profile.englishTestType} - ${profile.englishTestScore}
            Experience: ${profile.experienceYears} years
            Research Papers: ${profile.researchPapers}`;

      if (profile.englishTestType === 'MOI') {
        userPrompt += `
                MOI Details:
                - Intermediate/12th Grade English Marks: ${profile.moiIntermediateMarks || 'Not provided'}
                - Previous Institution: ${profile.moiInstitution || 'Not provided'}`;
      }

      const jsonResponse = await this.openRouterService.generateResponse(
        systemPrompt,
        userPrompt,
      );
      const jsonMatch = jsonResponse.match(/\{[\s\S]*\}/);
      const cleanJson = jsonMatch ? jsonMatch[0] : jsonResponse;

      return JSON.parse(cleanJson);
    } catch (error) {
      this.logger.error('Admit prediction failed', error);
      // Fallback
      return {
        university: profile.targetUniversity,
        probability: 50,
        tier: 2,
        feedback: ['AI Analysis failed. Please try again later.'],
      };
    }
  }
}
