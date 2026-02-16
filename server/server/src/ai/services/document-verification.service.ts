
import { Injectable } from '@nestjs/common';
import { GroqService } from './groq.service';

@Injectable()
export class DocumentVerificationService {
    constructor(private readonly groqService: GroqService) { }

    async explainRejection(docType: string, reason: string): Promise<string> {
        const prompt = `
            You are a helpful banking assistant for a student loan application platform.
            A user's document for "${docType}" was rejected during verification.
            
            Technical Reason: "${reason}"
            
            Please provide a friendly, clear, and actionable explanation for the user. 
            Tell them why it was rejected and what they should do to fix it (e.g., upload a clearer copy, ensure details match, etc.).
            Keep it concise (2-3 sentences max).
        `;

        try {
            const explanation = await this.groqService.chat(prompt);
            return explanation || "We couldn't verify your document. Please ensure it is clear and valid.";
        } catch (error) {
            console.error('AI Explanation generation failed:', error);
            return "Document verification failed. Please try uploading a valid document again.";
        }
    }
}
