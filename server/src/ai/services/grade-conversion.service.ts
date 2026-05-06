import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { OpenRouterService } from './open-router.service';

interface GradeConversionInput {
  inputType: 'letterGrade' | 'percentage' | 'gpa' | 'cgpa' | 'marks';
  inputValue: string | number;
  totalMarks?: number;
  outputType: 'letterGrade' | 'percentage' | 'gpa' | 'cgpa';
  gradingSystem?: 'US' | 'UK' | 'India' | 'Canada' | 'Australia';
}

@Injectable()
export class GradeConversionService {
  private readonly logger = new Logger(GradeConversionService.name);

  constructor(private readonly openRouterService: OpenRouterService) {}

  async convertGrade(input: GradeConversionInput): Promise<any> {
    // Validate Input
    if (input.inputType === 'percentage') {
      const val = Number(input.inputValue);
      if (isNaN(val) || val < 0 || val > 100) {
        throw new BadRequestException('Percentage must be between 0 and 100');
      }
    } else if (input.inputType === 'gpa') {
      const val = Number(input.inputValue);
      if (isNaN(val) || val < 0 || val > 4.0) {
        throw new BadRequestException('GPA must be between 0 and 4.0');
      }
    } else if (input.inputType === 'cgpa') {
      const val = Number(input.inputValue);
      if (isNaN(val) || val < 0 || val > 10.0) {
        throw new BadRequestException('CGPA must be between 0 and 10.0');
      }
    } else if (input.inputType === 'marks') {
      const val = Number(input.inputValue);
      if (
        input.totalMarks &&
        (isNaN(val) || val < 0 || val > input.totalMarks)
      ) {
        throw new BadRequestException('Marks cannot exceed Total Marks');
      }
    }

    const systemPrompt = `You are an expert academic transcript evaluator. 
         Convert the provided grade and provide a brief analysis.
         Ensure strict adherence to the provided 'Input Type'.
         - If Input Type is 'percentage', the value (e.g., 8.5) is out of 100. Do NOT assume it is CGPA (out of 10). 8.5% is a failing grade.
         - If Input Type is 'letterGrade', the value MUST be a string (e.g., A, B+). If a number is provided, return an error in the analysis.
         - SPECIAL RULE: If the Letter Grade is 'O' (Outstanding), treat it as 100% (Perfect Score).
         - SPECIAL RULE: The '+' suffix is ONLY valid for grades 'A' and 'B' (e.g., A+, B+). If a user provides C+, D+, etc., return an error saying "Only A and B grades can have a +".
         - SPECIAL RULE: If the grade has a '+' (e.g., A+), it MUST have a higher percentage than the base grade (e.g., A+ > A).
         - Guideline: A+ should be ~97-99%, A should be ~93-96%.
         - Conversion Guidelines:
            - CGPA (out of 10) must be exactly Percentage / 10. (e.g., 65% -> 6.5).
            - US GPA (out of 4.0): Use a granulary linear scale. 
              - 65% (D grade) should map to approx 1.4 US GPA.
              - 50% (E grade) should map to approx 1.0 US GPA.
              - 40% (Pass) should map to approx 0.7 US GPA.
              - 100% (O grade) is 4.0.
              - 0% is 0.0.
         - If Input Type is 'cgpa', the value is out of 10.
         - If Input Type is 'gpa', the value is out of 4.0.
         
         Return the response in strict JSON format matching the following structure:
         {
             "inputGrade": "string",
             "outputGrade": "string",
             "percentage": number,
             "gpa": number (4.0 scale),
             "cgpa": number (10.0 scale),
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
                 "recommendations": ["string", "string"]
             }
         }
         Ensure strict valid JSON output only. No markdown formatting.`;

    const userPrompt = `Convert Grade:
         Input: ${input.inputValue} (Type: ${input.inputType})
         System: ${input.gradingSystem || 'Standard'}
         Target Output: ${input.outputType}
         Total Marks (if applicable): ${input.totalMarks}`;

    const jsonResponse = await this.openRouterService.generateResponse(
      systemPrompt,
      userPrompt,
      0.0,
    );
    const jsonMatch = jsonResponse.match(/\{[\s\S]*\}/);
    const cleanJson = jsonMatch ? jsonMatch[0] : jsonResponse;

    return JSON.parse(cleanJson);
  }

  async comparePerformance(
    assessments: { name: string; percentage: number }[],
  ): Promise<any> {
    // Validate assessments
    for (const assessment of assessments) {
      if (assessment.percentage < 0 || assessment.percentage > 100) {
        throw new BadRequestException(
          `Percentage for ${assessment.name} must be between 0 and 100`,
        );
      }
    }

    const systemPrompt = `Analyze the student's academic performance trend based on the provided assessments.
          Return the response in strict JSON format:
          {
             "trend": "string (e.g. Improving, Declining)",
             "averagePerformance": number,
             "bestPerformance": "string",
             "worstPerformance": "string",
             "progression": "string"
          }`;

    const userPrompt = `Assessments: ${JSON.stringify(assessments)}`;
    const jsonResponse = await this.openRouterService.generateResponse(
      systemPrompt,
      userPrompt,
    );
    const jsonMatch = jsonResponse.match(/\{[\s\S]*\}/);
    const cleanJson = jsonMatch ? jsonMatch[0] : jsonResponse;

    return JSON.parse(cleanJson);
  }
}
