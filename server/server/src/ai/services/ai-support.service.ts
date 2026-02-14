import { Injectable, Logger } from '@nestjs/common';
import { OpenRouterService } from './open-router.service';

@Injectable()
export class AiSupportService {
  private readonly logger = new Logger(AiSupportService.name);

  constructor(private readonly openRouterService: OpenRouterService) {}

  async getResponse(userMessage: string): Promise<string> {
    const systemPrompt = `You are the EduLoan AI Assistant, a helpful and knowledgeable support bot for an education loan application app.
    Your goal is to assist users with questions about loans, eligibility, documentation, and the application process.
    
    Key Information about EduLoan:
    - Interest Rates: Start from 8.5% for international studies and 9% for domestic studies.
    - Documents Required: ID Proof, Academic Records, Admission Letter, Income Proof (Co-applicant).
    - Features: We have an 'Eligibility Checker', 'EMI Calculator', 'Admit Predictor', and 'University Comparator'.
    - Contact: Human support is available at support@eduloan.com or +1-800-EDU-LOAN.

    Guidelines:
    - Be polite, professional, and concise (keep answers under 3-4 sentences if possible).
    - If you are unsure, suggest checking the specific tool in the app or contacting support.
    - Do not make up false policies.
    - Encourage users to apply for a loan if they seem interested.
    `;

    try {
      return await this.openRouterService.generateResponse(
        systemPrompt,
        userMessage,
      );
    } catch (error) {
      this.logger.error('Failed to generate support response', error);
      return "I'm currently having trouble connecting to my brain. Please try again or contact human support.";
    }
  }
}
