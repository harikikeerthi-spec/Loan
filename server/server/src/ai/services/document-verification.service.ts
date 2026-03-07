
import { Injectable } from '@nestjs/common';
import { GroqService } from './groq.service';

@Injectable()
export class DocumentVerificationService {
    constructor(private readonly groqService: GroqService) { }

    async explainRejection(docType: string, reason: string): Promise<string> {
        const prompt = `
            You are an expert document examiner for a student loan system.
            A user's document ("${docType}") failed verification against DigiLocker/API Setu records.
            
            Technical Error: "${reason}"
            
            Please provide a high-quality, professional, and empathetic explanation for the student.
            1. Clearly state the exact reason for the failure.
            2. Tell them exactly what to double-check in their uploaded file or their profile (e.g. name spelling, date of birth, document quality).
            3. Use a tone that is helpful and authoritative.
            Avoid generic phrases. Maximum 40 words.
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
