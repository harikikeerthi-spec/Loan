import { Injectable, BadRequestException } from '@nestjs/common';
import { OpenRouterService } from './open-router.service';

interface GradeConversionInput {
  inputType: 'letterGrade' | 'percentage' | 'gpa' | 'cgpa' | 'marks';
  inputValue: string | number;
  totalMarks?: number; // For marks conversion
  outputType: 'letterGrade' | 'percentage' | 'gpa' | 'cgpa';
  gradingSystem?: 'US' | 'UK' | 'India' | 'Canada' | 'Australia';
}

interface GradeConversionResult {
  inputGrade: string;
  outputGrade: string;
  percentage: number;
  gpa: number;
  cgpa: number;
  letterGrade: string;
  classification: string;
  internationalEquivalent: {
    US: string;
    UK: string;
    India: string;
  };
  analysis: {
    strength: string;
    competitiveness: string;
    recommendations: string[];
  };
}

@Injectable()
export class GradeConversionService {
  constructor(private readonly openRouter: OpenRouterService) { }

  async convertGrade(input: GradeConversionInput): Promise<GradeConversionResult> {
    // Input validation to enforce limits and return clear errors on bad input
    if (input.inputType === 'percentage') {
      const val = Number(input.inputValue);
      if (isNaN(val) || val < 0 || val > 100) {
        throw new BadRequestException('Percentage must be a number between 0 and 100');
      }
    }

    if (input.inputType === 'marks') {
      const val = Number(input.inputValue);
      const total = Number(input.totalMarks ?? 100);
      if (isNaN(val) || val < 0) {
        throw new BadRequestException('Marks must be a non-negative number');
      }
      if (isNaN(total) || total <= 0) {
        throw new BadRequestException('totalMarks must be a positive number');
      }
      if (val > total) {
        throw new BadRequestException(`Marks (${val}) cannot exceed total marks (${total})`);
      }
    }

    if (input.inputType === 'gpa') {
      const val = Number(input.inputValue);
      const maxGpa = 4.0;
      if (isNaN(val) || val < 0 || val > maxGpa) {
        throw new BadRequestException(`GPA must be a number between 0 and ${maxGpa}`);
      }
    }

    if (input.inputType === 'cgpa') {
      const val = Number(input.inputValue);
      const maxCgpa = 10.0;
      if (isNaN(val) || val < 0 || val > maxCgpa) {
        throw new BadRequestException(`CGPA must be a number between 0 and ${maxCgpa}`);
      }
    }

    const prompt = `
    Convert the following academic grade:
    - Value: ${input.inputValue}
    - Type: ${input.inputType}
    - Maximum/Total: ${input.totalMarks || 'N/A'}
    - Grading System: ${input.gradingSystem || 'Global Standard'}
    
    Target Output: ${input.outputType}

    Perform a strictly accurate conversion.
    Also provide:
    1. Standardized Percentage (0-100)
    2. GPA (4.0 scale)
    3. CGPA (10.0 scale)
    4. Letter Grade (US Standard)
    5. Classification (First Class, etc.)
    6. Equivalent grades for US, UK, and India.
    7. A brief textual analysis of the grade strength and 3 recommendations.

    Return JSON format:
    {
      "inputGrade": "string representation",
      "outputGrade": "string representation",
      "percentage": number,
      "gpa": number,
      "cgpa": number,
      "letterGrade": "string",
      "classification": "string",
      "internationalEquivalent": {
        "US": "string",
        "UK": "string",
        "India": "string"
      },
      "analysis": {
        "strength": "string",
        "competitiveness": "string",
        "recommendations": ["string"]
      }
    }
    `;

    try {
      return await this.openRouter.getJson<GradeConversionResult>(prompt);
    } catch (error) {
      console.error('Grade conversion failed', error);
      // Fallback to simple zero-value object if AI fails, to prevent crash
      return {
        inputGrade: String(input.inputValue),
        outputGrade: 'N/A',
        percentage: 0,
        gpa: 0,
        cgpa: 0,
        letterGrade: 'N/A',
        classification: 'N/A',
        internationalEquivalent: { US: 'N/A', UK: 'N/A', India: 'N/A' },
        analysis: { strength: 'Error', competitiveness: 'Service unavailable', recommendations: [] }
      };
    }
  }

  async comparePerformance(assessments: { name: string; percentage: number }[]): Promise<any> {
    const prompt = `
      Analyze the performance trend based on these assessments:
      ${JSON.stringify(assessments)}

      Return JSON:
      {
        "trend": "string (e.g. Upward, Downward, Stable)",
        "averagePerformance": number,
        "bestPerformance": "string (subject name)",
        "worstPerformance": "string (subject name)",
        "progression": "string (e.g. Improving, Declining)"
      }
      `;

    try {
      return await this.openRouter.getJson(prompt);
    } catch (error) {
      console.error('Performance comparison failed', error);
      return {
        trend: 'Error',
        averagePerformance: 0,
        bestPerformance: 'N/A',
        worstPerformance: 'N/A',
        progression: 'N/A'
      };
    }
  }
}
