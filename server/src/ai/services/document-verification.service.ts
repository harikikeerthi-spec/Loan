
import { Injectable } from '@nestjs/common';
import { canonicalizeOcrFields } from '../utils/ocr-fields.util';
import { PanDocumentValidation, validatePanExtraction } from '../utils/pan-validation.util';
import { OpenRouterService } from './openrouter.service';

export interface AadhaarStructuredAddress {
    house_details?: string;
    area?: string;
    landmark?: string;
    mandal?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
}

export interface AadhaarDocumentValidation {
    aadhaar_logo_present: boolean;
    govt_of_india_branding_present: boolean;
    uidai_text_present: boolean;
    aadhaar_number_format_valid: boolean;
    vid_present: boolean;
    photo_present: boolean;
    dob_and_gender_fields_present: boolean;
}

export interface OcrVerificationResult {
    isValid: boolean;
    confidence: number; // 0-100
    docType: string;
    extractedFields: {
        full_name?: string;
        date_of_birth?: string;
        document_number?: string;
        address?: string | AadhaarStructuredAddress;
        address_formatted?: string;
        father_name?: string;
        expiry_date?: string;
        issuing_authority?: string;
        gender?: string;
        vid?: string;
        panNumber?: string;
        aadhaarNumber?: string;
        passportNumber?: string;
        universityName?: string;
        programName?: string;
        studentId?: string;
        admissionYear?: string;
        [key: string]: string | AadhaarStructuredAddress | undefined;
    };
    document_validation?: AadhaarDocumentValidation | PanDocumentValidation;
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
- Gender (Male/Female)
- 16-digit VID if visible
- Address as structured JSON:
  "address": {
    "house_details": "B-14 Plot No-10-26/46",
    "area": "Teachers colony",
    "landmark": "Opp Ashara convent school",
    "mandal": "Kondapur Mandal",
    "city": "Malkapur",
    "district": "Sangareddy",
    "state": "Telangana",
    "pincode": "502295"
  }
- Father/Guardian name if visible

Document validation (set booleans from visible card features):
- Aadhaar logo present
- Government of India branding present
- UIDAI text present
- Aadhaar number format valid (12 digits)
- VID present (16 digits)
- Photo present
- DOB and gender fields present`,

    pan: `This is a PAN Card (Permanent Account Number, Indian tax document). Extract exactly as printed:
- Full Name
- Father's Name
- Date of Birth (DD/MM/YYYY)
- PAN Number (10-character format AAAAA9999A, uppercase)
- country (typically India)
- authority (e.g. Income Tax Department)
- government (e.g. Govt. of India)
- signature_present, photo_present, qr_code_present (booleans for visible card features)

Document validation (set booleans from visible card features):
- Income Tax Department heading present
- Govt. of India branding present
- PAN number format valid (AAAAA9999A)
- Photo present
- Signature present
- QR code present
- DOB field present`,

    passport: `This is a Passport (travel document). Extract exactly as printed:
- Full Name, Passport Number, Date of Birth, Gender
- Date of Issue, Date of Expiry
- issue_country (country of issue, e.g. India)
- place_of_issue (city/office only, e.g. HYDERABAD)
- birth_city, birth_country (from Place of Birth)
- place_of_birth (full line if shown)
- nationality
- address (full residential address from passport, with city/state/pincode/country if visible)`,

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

    marksheet_10: `This is a Grade 10 / SSC / Secondary School Certificate (Indian state board, e.g. Andhra Pradesh BSE).
Extract exactly as printed using these JSON keys:
- full_name (candidate_name on certificate)
- father_name, mother_name if visible
- date_of_birth (DD/MM/YYYY)
- board_name (e.g. Board of Secondary Education, Andhra Pradesh, India)
- institution_name or school_name (e.g. BHASHYAM HIGH SCHOOL)
- district (e.g. GUNTUR — use as city_of_study if no separate city)
- roll_number
- examination_month_year or exam_month_year (e.g. MARCH 2016)
- medium_of_instruction (e.g. ENGLISH)
- gpa or overall_gpa if shown (e.g. 9.0 on 10-point scale); grading_system "CGPA"
- city_of_study, state_of_study (infer from board/district; default country_of_study India)
- date_of_issue if visible`,

    marksheet_12: `This is a Grade 12 / HSC / Intermediate certificate (Indian state board, e.g. AP Board of Intermediate Education).
Extract exactly as printed using these JSON keys:
- full_name (candidate_name on certificate)
- father_name, mother_name if visible
- board_name (e.g. Board of Intermediate Education, Andhra Pradesh, India)
- institution_name or college_name if visible
- registration_number or roll_number
- examination_month_year or exam_month_year (e.g. MARCH-2018)
- total_marks_secured or total_marks (e.g. 857); total_marks_maximum if printed else omit
- percentage if computable (857/1000 = 85.7); grading_system "Percentage"
- medium_of_instruction
- city_of_study, state_of_study, country_of_study (infer from board; default India)
- date_of_issue`,

    marksheet_ug: `This is an Undergraduate degree certificate, marksheet, or consolidated transcript.
Extract:
- full_name (student name)
- university_name
- institution_name / college name if different from university
- qualification or degree awarded (e.g. B.Tech, B.E., B.Sc, B.Com)
- program_name or branch (e.g. Computer Science)
- city_of_study, state_of_study, country_of_study
- percentage or CGPA (overall)
- grading_system: "CGPA" or "Percentage"
- medium_of_instruction if shown
- year_of_passing or examination period
- start_date and end_date if visible`,

    marksheet_pg: `This is a Postgraduate degree certificate, marksheet, or consolidated transcript.
Extract:
- full_name (student name)
- university_name
- institution_name / college if shown
- qualification or degree (e.g. M.Tech, MBA, M.Sc)
- program_name or specialization
- city_of_study, state_of_study, country_of_study
- percentage or CGPA
- grading_system: "CGPA" or "Percentage"
- medium_of_instruction if shown
- year_of_passing
- start_date and end_date if visible`,
};

function getDocumentValidationSchema(normalizedType: string): string {
    if (normalizedType === 'pan') {
        return `{
    "income_tax_department_heading_present": boolean,
    "govt_of_india_branding_present": boolean,
    "pan_number_format_valid": boolean,
    "photo_present": boolean,
    "signature_present": boolean,
    "qr_code_present": boolean,
    "dob_field_present": boolean
  }`;
    }
    if (normalizedType === 'aadhaar') {
        return `{
    "aadhaar_logo_present": boolean,
    "govt_of_india_branding_present": boolean,
    "uidai_text_present": boolean,
    "aadhaar_number_format_valid": boolean,
    "vid_present": boolean,
    "photo_present": boolean,
    "dob_and_gender_fields_present": boolean
  }`;
    }
    return '{}';
}

function getExtractedDataSchema(normalizedType: string): string {
    if (normalizedType === 'aadhaar') {
        return `{
    "full_name": "string — holder name exactly once as printed (do not repeat or duplicate)",
    "date_of_birth": "DD/MM/YYYY",
    "aadhaar_number": "12 digits or masked XXXX XXXX 1234",
    "gender": "Male or Female",
    "vid": "16-digit VID or null",
    "father_name": "string or null",
    "address": { "house_details": "...", "area": "...", "landmark": "...", "mandal": "...", "city": "...", "district": "...", "state": "...", "pincode": "..." } or null,
    "pin_code": "6-digit or null"
  }`;
    }
    if (normalizedType === 'passport') {
        return `{
    "full_name": "string — biodata name line once only (surname and given names; never repeat the line or paste MRZ twice). If the card only shows separate fields, use given_names + surname instead and full_name may be null",
    "given_names": "string or null — as printed (all given / other names)",
    "surname": "string or null — as printed",
    "passport_number": "string",
    "date_of_birth": "DD/MM/YYYY",
    "gender": "Male or Female",
    "date_of_issue": "DD/MM/YYYY",
    "date_of_expiry": "DD/MM/YYYY",
    "issue_country": "string",
    "place_of_issue": "string",
    "birth_city": "string",
    "birth_country": "string",
    "place_of_birth": "string or null",
    "nationality": "string",
    "address": "string or { address1, address2, city, state, pincode, country } or null"
  }`;
    }
    if (normalizedType === 'pan') {
        return `{
    "full_name": "string — cardholder name exactly once as printed (do not duplicate)",
    "father_name": "string",
    "date_of_birth": "DD/MM/YYYY",
    "pan_number": "AAAAA9999A",
    "country": "string",
    "authority": "string",
    "government": "string",
    "signature_present": boolean,
    "photo_present": boolean,
    "qr_code_present": boolean
  }`;
    }
    if (normalizedType === 'marksheet_10' || normalizedType === 'marksheet_12') {
        return `{
    "full_name": "string (candidate name)",
    "father_name": "string or null",
    "mother_name": "string or null",
    "date_of_birth": "DD/MM/YYYY or null",
    "board_name": "string",
    "institution_name": "string or null",
    "school_name": "string or null",
    "district": "string or null",
    "roll_number": "string or null",
    "registration_number": "string or null",
    "examination_month_year": "string",
    "medium_of_instruction": "string",
    "gpa": "number or null",
    "overall_gpa": "number or null",
    "percentage": "number or null",
    "total_marks": "number or null",
    "total_marks_secured": "number or null",
    "total_marks_maximum": "number or null",
    "grading_system": "CGPA or Percentage",
    "city_of_study": "string",
    "state_of_study": "string",
    "country_of_study": "string",
    "date_of_issue": "DD/MM/YYYY or null"
  }`;
    }
    if (normalizedType === 'marksheet_ug' || normalizedType === 'marksheet_pg') {
        return `{
    "full_name": "string",
    "university_name": "string",
    "institution_name": "string or null",
    "qualification": "string",
    "program_name": "string or null",
    "percentage": "number or null",
    "cgpa": "number or null",
    "grading_system": "CGPA or Percentage",
    "medium_of_instruction": "string or null",
    "city_of_study": "string",
    "state_of_study": "string",
    "country_of_study": "string",
    "year_of_passing": "string",
    "start_date": "YYYY-MM-DD or null",
    "end_date": "YYYY-MM-DD or null"
  }`;
    }
    return `{
    "full_name": "string",
    "date_of_birth": "DD-MM-YYYY",
    "document_number": "string",
    "father_name": "string",
    "expiry_date": "DD-MM-YYYY or null",
    "issuing_authority": "string",
    "address": { "house_details": "...", "area": "...", "landmark": "...", "mandal": "...", "city": "...", "district": "...", "state": "...", "pincode": "..." } or null,
    "gender": "Male or Female",
    "vid": "16-digit VID or null"
  }`;
}

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
  "extracted_data": ${getExtractedDataSchema(normalizedType)},
  "document_validation": ${getDocumentValidationSchema(normalizedType)},
  "verification_flags": {
    "is_expired": "boolean",
    "name_match_score": "number (0-100, compare to: '${studentProfile?.firstName || ''} ${studentProfile?.lastName || ''}')"
  },
  "reason": "explanation of results",
  "rawOcrText": "verbatim text snippet"
}

IMPORTANT:
- Respond with ONLY the JSON object.
- Extract each field ONCE (no duplicate aliases like dob and date_of_birth).
- For full_name: copy the printed name a single time — never concatenate the same name twice, never duplicate MRZ or bilingual lines.
- Copy values exactly as printed on the document; do not guess.
- Be precise with dates (DD/MM/YYYY).`;
}

function normalizeDocType(docType: string): string {
    const d = docType.toLowerCase().replace(/[_\s-]/g, '_');
    if (d.includes('aadhaar') || d.includes('aadhar') || d.includes('adhar')) return 'aadhaar';
    if (d.includes('pan') && !d.includes('company')) return 'pan';
    if (d.includes('passport')) return 'passport';
    if (d.includes('admission') || d.includes('offer') || d.includes('i20') || d.includes('i_20') || d.includes('cas')) return 'admission_letter';
    if (d.includes('bank_statement') || d.includes('bank_stmt')) return 'bank_statement';
    if (d.includes('itr') || d.includes('income_tax')) return 'itr';
    if (d.includes('marksheet_10') || d.includes('10th') || d.includes('ssc') || d.includes('grade_10') || d.includes('grade10')) return 'marksheet_10';
    if (d.includes('marksheet_12') || d.includes('12th') || d.includes('hsc') || d.includes('intermediate') || d.includes('grade_12') || d.includes('grade12')) return 'marksheet_12';
    if (d.includes('pg_degree') || d.includes('pg_transcript') || d.includes('marksheet_pg') || d.includes('postgraduate') || d.includes('post_grad')) return 'marksheet_pg';
    if (d.includes('ug_degree') || d.includes('ug_transcript') || d.includes('marksheet_ug') || d.includes('undergraduate') || d.includes('under_grad') || d.includes('bachelor')) return 'marksheet_ug';
    if (d.includes('marksheet') || d.includes('transcript')) return 'marksheet';
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

            // Use a vision-capable model - preferring latest cutting-edge models for top-tier document intelligence
            const models = [
                'anthropic/claude-sonnet-4.6',   // High intelligence Claude 4.6
                'google/gemini-3-flash-preview', // High intelligence Gemini 3
                'anthropic/claude-3.7-sonnet',   // Premium Claude 3.7
                'google/gemini-3.1-flash-lite',  // Premium Gemini 3.1
                'anthropic/claude-haiku-4.5',    // Premium Haiku 4.5
                'anthropic/claude-3.7-sonnet:thinking',
                'anthropic/claude-3.5-sonnet',
                'google/gemma-4-31b',
                'google/gemma-4-26b-a4b',
                'openai/gpt-oss-120b:free',
                'nvidia/nemotron-3-super:free',
                'anthropic/claude-3-opus',
                'google/gemini-2.0-flash-001',
                'openai/gpt-4-vision',
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

            const rawExtracted = parsed.extracted_data || parsed.extractedFields || {};
            const extracted = canonicalizeOcrFields(rawExtracted, docType);

            const normalizedType = normalizeDocType(docType);
            let isValid = parsed.isValid ?? (parsed.confidence_score > 70);
            let validationReason = parsed.reason;

            let documentValidation = parsed.document_validation;

            if (normalizedType === 'aadhaar') {
                const aadhaarCheck = this.validateAadhaarExtraction(parsed, extracted);
                if (!aadhaarCheck.is_valid) {
                    isValid = false;
                    validationReason = aadhaarCheck.error || validationReason;
                }
            } else if (normalizedType === 'pan') {
                const panCheck = validatePanExtraction(extracted, parsed);
                documentValidation = panCheck.document_validation;
                if (!panCheck.is_valid) {
                    isValid = false;
                    validationReason = panCheck.error || validationReason;
                }
            }

            const result: OcrVerificationResult = {
                isValid,
                confidence: parsed.confidence_score ?? parsed.confidence ?? 70,
                docType,
                extractedFields: extracted,
                document_validation: documentValidation,
                verification_flags: parsed.verification_flags,
                reason: validationReason || (isValid ? 'Document verified successfully' : 'Document verification failed'),
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

    private normalizeAadhaarExtractedFields(extracted: Record<string, any>): void {
        if (extracted.address && typeof extracted.address === 'string') {
            const pinMatch = extracted.address.match(/\b\d{6}\b/);
            extracted.address = {
                house_details: extracted.address,
                pincode: pinMatch ? pinMatch[0] : undefined,
            };
        }
        if (extracted.address && typeof extracted.address === 'object') {
            const addr = extracted.address as AadhaarStructuredAddress;
            if (addr.pincode && !extracted.pin_code) {
                extracted.pin_code = addr.pincode;
            }
            extracted.address_formatted = [
                addr.house_details,
                addr.area,
                addr.landmark,
                addr.mandal,
                addr.city,
                addr.district,
                addr.state,
                addr.pincode,
            ].filter(Boolean).join(', ');
        }
        if (extracted.gender) {
            const g = String(extracted.gender).toLowerCase();
            extracted.gender = g.startsWith('m') ? 'Male' : g.startsWith('f') ? 'Female' : extracted.gender;
        }
    }

    private validateAadhaarExtraction(
        _parsed: any,
        extracted: Record<string, any>,
    ): { is_valid: boolean; error?: string } {
        const failed: string[] = [];
        if (!extracted.full_name) failed.push('full name');
        if (!extracted.dob) failed.push('date of birth');
        if (!extracted.gender) failed.push('gender');

        if (failed.length > 0) {
            return {
                is_valid: false,
                error: `Could not read required Aadhaar fields: ${failed.join(', ')}`,
            };
        }
        return { is_valid: true };
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
