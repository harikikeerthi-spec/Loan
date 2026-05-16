
import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import { OpenRouterService } from './openrouter.service';

export interface KycExtractionResult {
    document_type: 'aadhaar' | 'pan' | 'passport' | 'unknown';
    confidence_score: number;
    is_valid: boolean;
    data: any;
    raw_text?: string;
    error?: string;
}

@Injectable()
export class KycService {
    constructor(private readonly openRouterService: OpenRouterService) {}

    /**
     * Preprocess image for better OCR results
     */
    async preprocessImage(buffer: Buffer): Promise<Buffer> {
        try {
            // Auto-rotate based on EXIF, convert to grayscale, increase contrast
            return await sharp(buffer)
                .rotate() // Auto-rotate
                .grayscale()
                .normalize() // Enhance contrast
                .sharpen()
                .toBuffer();
        } catch (error) {
            console.warn('[KycService] Preprocessing failed, using original buffer:', error.message);
            return buffer;
        }
    }

    /**
     * Detect document type using OCR keywords and AI
     */
    async detectDocumentType(buffer: Buffer, mimetype: string): Promise<string> {
        // We'll use a fast AI call for detection
        const base64 = buffer.toString('base64');
        const prompt = `Identify this Indian government ID. Is it "aadhaar", "pan", or "passport"? Respond with only the word. If unsure, say "unknown".`;
        
        try {
            const response = await this.openRouterService.chatWithVision(
                prompt,
                `data:${mimetype};base64,${base64}`,
                'google/gemini-2.0-flash-001'
            );
            return response.toLowerCase().trim();
        } catch (error) {
            console.error('[KycService] Detection failed:', error);
            return 'unknown';
        }
    }

    /**
     * Main OCR & Extraction pipeline
     */
    async processDocument(
        buffer: Buffer, 
        mimetype: string, 
        expectedType?: string
    ): Promise<KycExtractionResult> {
        console.log(`[KycService] Processing document. Mimetype: ${mimetype}, Expected: ${expectedType}`);

        // 1. Preprocess if it's an image
        let processedBuffer = buffer;
        if (mimetype.startsWith('image/')) {
            processedBuffer = await this.preprocessImage(buffer);
        }

        const base64 = processedBuffer.toString('base64');
        
        // 2. Build prompt based on type
        const docType = expectedType || await this.detectDocumentType(processedBuffer, mimetype);
        const prompt = this.getPromptForType(docType);

        try {
            // 3. AI Extraction
            const response = await this.openRouterService.chatWithVision(
                prompt,
                `data:${mimetype};base64,${base64}`,
                'google/gemini-2.0-flash-001'
            );

            // 4. Parse and Validate
            const result = this.parseAiResponse(response, docType);
            
            // 5. Mask sensitive data for UI safety
            if (result.data) {
                result.data = this.maskData(result.data, result.document_type);
            }

            // 6. Robust Audit Logging
            this.logAudit(docType, result.confidence_score, result.is_valid, result.error);

            return result;
        } catch (error) {
            console.error('[KycService] Extraction failed:', error);
            this.logAudit(expectedType || 'unknown', 0, false, error.message);
            return {
                document_type: 'unknown',
                confidence_score: 0,
                is_valid: false,
                data: {},
                error: 'Failed to process document. ' + error.message
            };
        }
    }

    private logAudit(type: string, confidence: number, isValid: boolean, error?: string) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] KYC_AUDIT | Type: ${type} | Confidence: ${confidence}% | Valid: ${isValid} | Error: ${error || 'None'}\n`;
        
        console.log(logEntry);
        
        // In a real production app, we would write to a database or a centralized log system.
        // For this task, we'll ensure it's prominently logged for staff visibility in server logs.
        if (confidence < 70 && isValid) {
            console.warn(`[KycService] LOW_CONFIDENCE_WARNING: Document ${type} passed but with only ${confidence}% confidence.`);
        }
    }

    private getPromptForType(docType: string): string {
        const baseInstructions = `
            Extract data from this Indian ${docType} document. 
            Return ONLY a JSON object. No other text.
            JSON structure: {
                "document_type": "${docType}",
                "confidence_score": 0-100,
                "is_valid": boolean,
                "data": { ...extracted fields... },
                "raw_text": "verbatim text snippet"
            }
        `;

        const typeSpecific = {
            aadhaar: `
                Extract: 
                - full_name (Full name of holder)
                - aadhaar_number (12 digits, format XXXX XXXX XXXX)
                - dob (DD/MM/YYYY)
                - gender (Male/Female/Transgender)
                - address (Full address)
                - pin_code (6 digits)
                - vid (if available)
            `,
            pan: `
                Extract:
                - full_name
                - pan_number (10 alphanumeric chars, e.g., ABCDE1234F)
                - father_name
                - dob (DD/MM/YYYY)
            `,
            passport: `
                Extract:
                - passport_number
                - full_name (Given Name + Surname)
                - nationality
                - dob (DD/MM/YYYY)
                - gender
                - date_of_issue (DD/MM/YYYY)
                - date_of_expiry (DD/MM/YYYY)
                - place_of_issue
                - place_of_birth
                - mrz_code (The 2-line code at bottom)
            `
        };

        return baseInstructions + (typeSpecific[docType] || 'Extract all visible fields.');
    }

    private parseAiResponse(response: string, docType: string): KycExtractionResult {
        try {
            const cleaned = response.replace(/```json/gi, '').replace(/```/g, '').trim();
            const jsonStart = cleaned.indexOf('{');
            const jsonEnd = cleaned.lastIndexOf('}');
            const jsonString = cleaned.slice(jsonStart, jsonEnd + 1);
            const parsed = JSON.parse(jsonString);

            return {
                document_type: (parsed.document_type || docType) as any,
                confidence_score: parsed.confidence_score || 0,
                is_valid: parsed.is_valid || false,
                data: parsed.data || {},
                raw_text: parsed.raw_text
            };
        } catch (e) {
            console.error('[KycService] JSON Parse Error:', e);
            return {
                document_type: docType as any,
                confidence_score: 0,
                is_valid: false,
                data: {},
                error: 'AI response was not valid JSON'
            };
        }
    }

    private maskData(data: any, type: string): any {
        const masked = { ...data };
        if (type === 'aadhaar' && masked.aadhaar_number) {
            // Mask all but last 4 digits
            const clean = masked.aadhaar_number.replace(/\s/g, '');
            if (clean.length === 12) {
                masked.aadhaar_number = `XXXX XXXX ${clean.slice(-4)}`;
            }
        } else if (type === 'pan' && masked.pan_number) {
            // Mask middle 5 chars: ABCDE1234F -> ABCXX1234X
            const clean = masked.pan_number.trim();
            if (clean.length === 10) {
                masked.pan_number = `${clean.slice(0, 3)}XX${clean.slice(5, 9)}X`;
            }
        } else if (type === 'passport' && masked.passport_number) {
            const clean = masked.passport_number.trim();
            masked.passport_number = `${clean[0]}XXXXXXX`;
        }
        return masked;
    }

    /**
     * Tesseract fallback for basic OCR
     */
    async fallbackOcr(buffer: Buffer): Promise<string> {
        const worker = await createWorker('eng+hin+tel');
        const { data: { text } } = await worker.recognize(buffer);
        await worker.terminate();
        return text;
    }
}
