
import { Injectable } from '@nestjs/common';
import { OpenRouterService } from './openrouter.service';

export interface OcrVerificationResult {
    isValid: boolean;
    confidence: number; // 0-100
    docType: string;
    extractedFields: {
        full_name?: string;
        date_of_birth?: string;
        document_number?: string;
        address?: string;
        father_name?: string;
        expiry_date?: string;
        issuing_authority?: string;
        gender?: string;
        panNumber?: string;
        aadhaarNumber?: string;
        passportNumber?: string;
        universityName?: string;
        programName?: string;
        studentId?: string;
        admissionYear?: string;
        [key: string]: string | undefined;
    };
    verification_flags?: {
        is_expired: boolean;
        name_match_score: number;
    };
    matchResults?: {
        nameMatch?: boolean;
        dobMatch?: boolean;
        overallMatch: boolean;
        mismatches: string[];
    };
    reason?: string;
    rawOcrText?: string;
}

const DOC_TYPE_PROMPTS: Record<string, string> = {
    aadhaar: `This is an Aadhaar Card (Indian national identity document). Extract:
- Full Name (as printed on card)
- Date of Birth (DD/MM/YYYY format)
- 12-digit Aadhaar number (masked format like XXXX XXXX 1234 is OK)
- Gender
- Address
- Father/Guardian name if visible`,

    pan: `This is a PAN Card (Permanent Account Number, Indian tax document). Extract:
- Full Name
- Father's Name
- Date of Birth (DD/MM/YYYY)
- PAN Number (10-character alphanumeric like ABCDE1234F)`,

    passport: `This is a Passport (travel document). Extract:
- Full Name (Given + Surname)
- Passport Number
- Date of Birth
- Date of Issue
- Date of Expiry
- Nationality
- Gender`,

    admission_letter: `This is a University Admission Letter or I-20/CAS/Offer Letter. Extract:
- Student Full Name
- University/Institution Name
- Program/Course Name
- Student ID / Reference Number
- Intake Year / Start Date
- Any loan/fee amounts mentioned`,

    bank_statement: `This is a Bank Statement. Extract:
- Account Holder Name
- Account Number (last 4 digits only for security)
- Bank Name
- Statement Period
- Opening/Closing Balance`,

    itr: `This is an Income Tax Return (ITR) document. Extract:
- Taxpayer Name
- PAN Number
- Assessment Year
- Total Income
- Tax Amount`,

    marksheet: `This is an Academic Marksheet/Transcript. Extract:
- Student Name
- Institution Name
- Year/Semester
- Percentage or CGPA
- Course/Program Name`,
};

function buildOcrPrompt(docType: string, studentProfile?: any): string {
    const normalizedType = normalizeDocType(docType);
    const docSpecificInstructions = DOC_TYPE_PROMPTS[normalizedType] ||
        `This is a ${docType} document. Extract all visible key information fields such as name, date, ID numbers, and any other relevant data.`;

    const profileContext = studentProfile ? `
STUDENT PROFILE TO VERIFY AGAINST:
- Name: ${studentProfile.firstName || ''} ${studentProfile.lastName || ''}
- Date of Birth: ${studentProfile.dateOfBirth || 'Not provided'}
- Email: ${studentProfile.email || 'Not provided'}
` : '';

    return `You are a specialized Document OCR Extraction agent for an Education Loan platform.

Task: Extract specific data from the provided image. If the data is not clearly visible or the document type is incorrect, return null for those fields. Do not guess information.

${profileContext}

TASK 1 - DOCUMENT IDENTIFICATION:
First, confirm whether this image actually shows ${docType}.

TASK 2 - OCR EXTRACTION:
${docSpecificInstructions}

Output Format:
Return ONLY a valid JSON object with the following structure:

{
  "document_type": "${docType}",
  "confidence_score": 0-100,
  "isValid": boolean,
  "extracted_data": {
    "full_name": "string",
    "date_of_birth": "DD-MM-YYYY",
    "document_number": "string (e.g., PAN Number)",
    "father_name": "string",
    "expiry_date": "DD-MM-YYYY or null",
    "issuing_authority": "string",
    "address": "string or null"
  },
  "verification_flags": {
    "is_expired": "boolean",
    "name_match_score": "number (0-100, compare to: '${studentProfile?.firstName || ''} ${studentProfile?.lastName || ''}')"
  },
  "reason": "explanation of results",
  "rawOcrText": "verbatim text snippet"
}

IMPORTANT: 
- Respond with ONLY the JSON object.
- For aadhaarNumber, ONLY include last 4 digits for security.
- Be precise with dates (DD-MM-YYYY).`;
}

function normalizeDocType(docType: string): string {
    const d = docType.toLowerCase().replace(/[_\s-]/g, '_');
    if (d.includes('aadhaar') || d.includes('aadhar') || d.includes('adhar')) return 'aadhaar';
    if (d.includes('pan')) return 'pan';
    if (d.includes('passport')) return 'passport';
    if (d.includes('admission') || d.includes('offer') || d.includes('i20') || d.includes('i-20') || d.includes('cas')) return 'admission_letter';
    if (d.includes('bank_statement') || d.includes('bank_stmt')) return 'bank_statement';
    if (d.includes('itr') || d.includes('income_tax')) return 'itr';
    if (d.includes('marksheet') || d.includes('transcript') || d.includes('grade')) return 'marksheet';
    return 'generic';
}

@Injectable()
export class DocumentVerificationService {
    constructor(private readonly openRouterService: OpenRouterService) { }

    /**
     * Verifies a document using AI vision/OCR and optionally cross-checks with student profile.
     */
    async verifyAndExtractDocument(
        docType: string,
        fileBuffer: Buffer,
        mimetype: string,
        studentProfile?: any,
    ): Promise<OcrVerificationResult> {
        console.log(`[DocumentVerification] Starting OCR verification for: ${docType} (${mimetype}), Buffer size: ${fileBuffer.length} bytes`);

        // Validate file buffer
        if (!fileBuffer || fileBuffer.length === 0) {
            console.error('[DocumentVerification] Empty file buffer');
            return {
                isValid: false,
                confidence: 0,
                docType,
                extractedFields: {},
                reason: 'File is empty. Please upload a valid document.',
            };
        }

        // Convert buffer to base64
        let base64Data: string;
        try {
            base64Data = fileBuffer.toString('base64');
            console.log(`[DocumentVerification] Base64 conversion successful. Size: ${base64Data.length} chars`);
        } catch (error) {
            console.error('[DocumentVerification] Failed to convert buffer to base64:', error);
            return {
                isValid: false,
                confidence: 0,
                docType,
                extractedFields: {},
                reason: 'Failed to process file. Please try again.',
            };
        }

        const isImage = mimetype.startsWith('image/');
        const isPdf = mimetype === 'application/pdf';

        if (!isImage && !isPdf) {
            return {
                isValid: false,
                confidence: 0,
                docType,
                extractedFields: {},
                reason: 'Unsupported file format. Please upload a JPG, PNG, or PDF file.',
            };
        }

        const prompt = buildOcrPrompt(docType, studentProfile);

        try {
            const apiKey = process.env.OPENROUTER_API_KEY;
            if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
                console.warn('[DocumentVerification] OpenRouter API key not set, using rule-based fallback');
                return this.fallbackVerification(docType);
            }

            console.log(`[DocumentVerification] API Key validation passed (length: ${apiKey.length})`);

            // Use a vision-capable model - preferring Claude 3.5 Sonnet for better vision
            const models = [
                'google/gemini-2.0-flash-001',  // Primary: Fast and good for documents
                'anthropic/claude-3.5-sonnet',   // Fallback: Excellent vision capabilities
                'openai/gpt-4-vision',           // Last resort
            ];

            let response: any;
            let selectedModel = '';
            let lastError: any;

            for (const model of models) {
                try {
                    selectedModel = model;
                    console.log(`[DocumentVerification] Attempting with model: ${model}`);

                    const messages: any[] = [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: prompt,
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `data:${isImage ? mimetype : 'image/jpeg'};base64,${base64Data}`,
                                    },
                                },
                            ],
                        },
                    ];

                    console.log(`[DocumentVerification] Calling vision model: ${model}, Message content types: text, image_url`);

                    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': 'https://vidhyaloan.com',
                            'X-Title': 'VidhyaLoan',
                        },
                        body: JSON.stringify({
                            model,
                            messages,
                            max_tokens: 1200,  // Reduced from 2000 to work with credit-limited scenarios
                        }),
                    });

                    if (response.ok) {
                        console.log(`[DocumentVerification] Success with model ${model}`);
                        break; // Success, use this response
                    } else {
                        const errorBody = await response.text();
                        console.warn(`[DocumentVerification] Model ${model} failed:`, response.status, errorBody.slice(0, 200));
                        lastError = errorBody;
                        continue; // Try next model
                    }
                } catch (modelError) {
                    console.warn(`[DocumentVerification] Model ${model} error:`, modelError);
                    lastError = modelError;
                    continue; // Try next model
                }
            }

            if (!response?.ok) {
                const errorText = typeof lastError === 'string' ? lastError : JSON.stringify(lastError);
                console.error('[DocumentVerification] All vision models failed. Last error:', errorText);
                
                // Check for credit limits (402 error)
                if (errorText.includes('402') || errorText.includes('credits')) {
                    console.warn('[DocumentVerification] Running out of API credits - using enhanced fallback');
                }
                
                return this.fallbackVerification(docType, errorText);
            }

            const data = await response.json();
            console.log(`[DocumentVerification] API Response received. Status: ${response.status}`);
            
            const content = data.choices?.[0]?.message?.content || '';
            console.log(`[DocumentVerification] Response content length: ${content.length} chars`);

            console.log(`[DocumentVerification] Raw AI response (first 500 chars):`, content.slice(0, 500));

            // Parse JSON response
            let parsed: any = {};
            try {
                // Extract JSON from the response (handle markdown code blocks)
                const cleaned = content
                    .replace(/```json/gi, '')
                    .replace(/```/g, '')
                    .trim();
                
                console.log(`[DocumentVerification] Cleaned response (first 300 chars):`, cleaned.slice(0, 300));
                
                const jsonStart = cleaned.indexOf('{');
                const jsonEnd = cleaned.lastIndexOf('}');
                
                if (jsonStart === -1 || jsonEnd === -1) {
                    console.error('[DocumentVerification] No JSON object found in response');
                    console.error('[DocumentVerification] Full response:', cleaned);
                    return this.fallbackVerification(docType, content);
                }
                
                const jsonString = cleaned.slice(jsonStart, jsonEnd + 1);
                console.log(`[DocumentVerification] Extracted JSON (length: ${jsonString.length} chars)`);
                
                parsed = JSON.parse(jsonString);
                console.log(`[DocumentVerification] Successfully parsed JSON response`);
            } catch (parseError) {
                console.error('[DocumentVerification] Failed to parse AI JSON response:', parseError);
                console.error('[DocumentVerification] Raw content:', content.slice(0, 1000));
                return this.fallbackVerification(docType, content);
            }

            const result: OcrVerificationResult = {
                isValid: parsed.isValid ?? (parsed.confidence_score > 70),
                confidence: parsed.confidence_score ?? parsed.confidence ?? 70,
                docType,
                extractedFields: parsed.extracted_data || parsed.extractedFields || {},
                verification_flags: parsed.verification_flags,
                reason: parsed.reason || (parsed.isValid ? 'Document verified successfully' : 'Document verification failed'),
                rawOcrText: parsed.rawOcrText,
            };

            // Add match results if available
            if (parsed.matchResults) {
                result.matchResults = parsed.matchResults;
            } else if (studentProfile && result.extractedFields.full_name) {
                // Compute basic match ourselves
                const studentFullName = `${studentProfile.firstName || ''} ${studentProfile.lastName || ''}`.toLowerCase().trim();
                const extractedName = (result.extractedFields.full_name || '').toLowerCase().trim();
                const nameMatch = studentFullName && extractedName
                    ? this.namesMatch(studentFullName, extractedName)
                    : true;

                result.matchResults = {
                    nameMatch,
                    overallMatch: nameMatch,
                    mismatches: nameMatch ? [] : [`Name mismatch: Profile has "${studentFullName}", document shows "${extractedName}"`],
                };
            }

            // Override validity based on document type check
            if (parsed.isCorrectDocumentType === false) {
                result.isValid = false;
                result.reason = `Wrong document type detected. Expected ${docType}, but this appears to be a different document.`;
            }

            console.log(`[DocumentVerification] OCR result: valid=${result.isValid}, confidence=${result.confidence}%`);
            console.log(`[DocumentVerification] Extracted fields:`, Object.keys(result.extractedFields));
            return result;

        } catch (error: any) {
            console.error('[DocumentVerification] Fatal error during verification:', error);
            return this.fallbackVerification(docType);
        }
    }

    /**
     * Staff-initiated re-verification of an existing document against student profile.
     */
    async reverifyDocumentForAdmin(
        fileBuffer: Buffer,
        mimetype: string,
        docType: string,
        studentProfile: {
            firstName: string;
            lastName: string;
            dateOfBirth?: string;
            email?: string;
        },
    ): Promise<OcrVerificationResult> {
        console.log(`[ReverifyDocument] Starting re-verification for admin. DocType: ${docType}, Buffer size: ${fileBuffer.length}, Mimetype: ${mimetype}`);
        console.log(`[ReverifyDocument] Student profile: ${studentProfile.firstName} ${studentProfile.lastName}`);
        
        const result = await this.verifyAndExtractDocument(docType, fileBuffer, mimetype, studentProfile);
        
        console.log(`[ReverifyDocument] Completed. Result: valid=${result.isValid}, confidence=${result.confidence}%`);
        return result;
    }

    /**
     * Simple name similarity check (handles initials, middle names, etc.)
     */
    private namesMatch(profileName: string, documentName: string): boolean {
        if (!profileName || !documentName) return true; // Can't verify, be lenient

        const normalize = (name: string) =>
            name.toLowerCase()
                .replace(/[^a-z\s]/g, '')
                .split(/\s+/)
                .filter(Boolean);

        const profileParts = normalize(profileName);
        const docParts = normalize(documentName);

        // Check if last names match at minimum
        if (profileParts.length > 0 && docParts.length > 0) {
            const profileLast = profileParts[profileParts.length - 1];
            const docLast = docParts[docParts.length - 1];
            if (profileLast === docLast) return true;
        }

        // Check overlap: at least 50% of name parts should match
        const matches = profileParts.filter(p => docParts.some(d => d === p || d.startsWith(p[0])));
        return matches.length >= Math.ceil(profileParts.length * 0.5);
    }

    /**
     * Rule-based fallback when AI is unavailable.
     */
    private fallbackVerification(docType: string, rawText?: string): OcrVerificationResult {
        console.warn(`[DocumentVerification] Using fallback verification for ${docType}`);
        
        // Attempt basic pattern extraction even without AI
        let extractedFields: any = {};
        
        if (rawText && typeof rawText === 'string') {
            // Try to extract basic patterns
            const namePatterns = [/(?:Name|nama|नाम)[\s:]*([A-Za-z\s]+)/i];
            const datePatterns = [/(?:DOB|Date of Birth|Birth)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i];
            const idPatterns = [/(?:ID|Number|Reference)[\s:]*([A-Z0-9]{8,})/i];
            
            for (const pattern of namePatterns) {
                const match = rawText.match(pattern);
                if (match?.[1]) {
                    extractedFields.name = match[1].trim();
                    break;
                }
            }
            
            for (const pattern of datePatterns) {
                const match = rawText.match(pattern);
                if (match?.[1]) {
                    extractedFields.dateOfBirth = match[1].trim();
                    break;
                }
            }
            
            for (const pattern of idPatterns) {
                const match = rawText.match(pattern);
                if (match?.[1]) {
                    extractedFields.documentNumber = match[1].trim();
                    break;
                }
            }
        }
        
        return {
            isValid: true,
            confidence: 40,
            docType,
            extractedFields,
            reason: 'Document uploaded successfully. AI verification unavailable - manual review recommended.',
            rawOcrText: rawText?.slice?.(0, 500),
        };
    }

    async explainRejection(docType: string, reason: string): Promise<string> {
        const prompt = `
            You are an expert document examiner for a student loan system.
            A user's document ("${docType}") failed verification.
            
            Technical Error: "${reason}"
            
            Please provide a clear, professional, and empathetic explanation for the student.
            1. Clearly state the exact reason for the failure.
            2. Tell them exactly what to double-check (e.g. name spelling, document quality, correct document type).
            3. Use a helpful and authoritative tone.
            Maximum 50 words.
        `;

        try {
            const explanation = await this.openRouterService.chat(prompt);
            return explanation || "We couldn't verify your document. Please ensure it is clear, valid, and matches your profile information.";
        } catch (error) {
            return "Document verification failed. Please ensure the document is clearly photographed and matches your profile details.";
        }
    }
}
