
import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import {
    canonicalizeOcrFields,
    extractNameFromLabeledOcrText,
} from '../utils/ocr-fields.util';
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

export interface AcademicDocumentValidation {
    official_board_formatting_present?: boolean;
    seal_or_signature_area_present?: boolean;
    barcode_present?: boolean;
    certificate_number_present?: boolean;
    ssc_grade_format_consistent?: boolean;
    subject_table_present?: boolean;
}

export interface KycExtractionResult {
    document_type: 'aadhaar' | 'pan' | 'passport' | 'unknown';
    confidence_score: number;
    is_valid: boolean;
    fraud_detected?: boolean;
    fraud_reason?: string;
    extracted_data: any;
    document_validation?: AadhaarDocumentValidation | PanDocumentValidation | AcademicDocumentValidation;
    missing_fields?: string[];
    ocr_issues?: string[];
    raw_text_summary?: string;
    error?: string;
}

@Injectable()
export class KycService {
    constructor(private readonly openRouterService: OpenRouterService) { }

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
            console.warn('[KycService] Preprocessing failed, using original buffer:', error instanceof Error ? error.message : String(error));
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
                'google/gemini-2.5-flash'
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

        // 1. Determine expected doc type
        const docType = expectedType || 'unknown';

        // 2. Check if file is supported (images or PDF)
        const isImage = mimetype.startsWith('image/jpeg') || mimetype.startsWith('image/png') || mimetype.startsWith('image/jpg') || mimetype.startsWith('image/webp');
        const isPdf = mimetype === 'application/pdf';

        if (!isImage && !isPdf) {
            console.log(`[KycService] Document format ${mimetype} is not directly supported by AI Vision. Utilizing robust fallback.`);

            let text = '';
            if (mimetype.startsWith('text/') || mimetype.includes('json') || mimetype.includes('xml')) {
                text = buffer.toString('utf-8');
            }
            const dynamicData = canonicalizeOcrFields(
                this.extractDynamicFieldsFromText(text, docType),
                docType,
            );

            return {
                document_type: docType as any,
                confidence_score: 100,
                is_valid: true,
                extracted_data: dynamicData,
                raw_text_summary: 'Manual fallback verification for unsupported types'
            };
        }

        // Use original image bytes for vision models (grayscale preprocessing reduces accuracy)
        const base64 = buffer.toString('base64');
        const prompt = this.getPromptForType(docType);

        try {
            // 4. AI Extraction via OpenRouter
            const response = await this.openRouterService.chatWithVision(
                prompt,
                `data:${mimetype};base64,${base64}`,
                'google/gemini-2.5-flash'
            );

            // 5. Parse and Validate Response
            const result = this.parseAiResponse(response, docType);

            // 6. Audit Log
            this.logAudit(docType, result.confidence_score, result.is_valid, result.error);

            return result;
        } catch (error: any) {
            console.error('[KycService] Vision extraction failed, using robust fallback:', error?.message);

            // Perform local keyword verification as a warning indicator
            const integrityCheck = await this.validateDocumentKeywords(buffer, docType, isPdf, isImage);
            if (!integrityCheck.is_valid) {
                console.warn(`[KycService] Fallback validation warning: Uploaded document failed local keyword pattern verification for type: ${docType}`);
            }

            // Extract dynamic fields from local Tesseract text dynamically!
            let text = '';
            try {
                if (isImage) {
                    text = await this.fallbackOcr(buffer);
                } else if (isPdf) {
                    text = buffer.toString('utf-8');
                }
            } catch (ocrErr: any) {
                console.warn('[KycService] Fallback OCR extraction failed:', ocrErr.message);
            }

            const rawDynamic = this.extractDynamicFieldsFromText(text, docType);
            const dynamicData = canonicalizeOcrFields(
                {
                    ...rawDynamic,
                    raw_text_summary: text.slice(0, 2000) || rawDynamic.raw_text_summary,
                },
                docType,
            );
            this.logAudit(docType, 95, integrityCheck.is_valid, `Vision API failure fallback: ${error.message}`);

            const lowerType = String(docType || '').toLowerCase();
            const needsName =
                lowerType.includes('aadhaar') ||
                lowerType.includes('aadhar') ||
                lowerType.includes('national_id') ||
                (lowerType.includes('pan') && !lowerType.includes('company'));
            
            const isValid = integrityCheck.is_valid && (!needsName || !!dynamicData.full_name);
            let errorMsg: string | undefined = undefined;
            if (!integrityCheck.is_valid) {
                errorMsg = integrityCheck.error || `The uploaded document was not recognized as a valid ${docType.toUpperCase().replace(/_/g, ' ')}.`;
            } else if (!isValid) {
                errorMsg = 'Could not read the name from the document image. Try a clearer scan or re-upload.';
            }

            return {
                document_type: docType as any,
                confidence_score: 95,
                is_valid: isValid,
                extracted_data: dynamicData,
                raw_text_summary: text.slice(0, 500) || `Verification service fallback: ${error.message}`,
                error: errorMsg,
            };
        }
    }

    /**
     * Check document text content for expected keywords based on document type.
     */
    async validateDocumentKeywords(buffer: Buffer, docType: string, isPdf: boolean, isImage: boolean): Promise<{ is_valid: boolean; error?: string }> {
        const normalizedType = String(docType || '').toLowerCase();
        const isIdentityDoc = normalizedType.includes('pan') || 
                              normalizedType.includes('aadhar') || 
                              normalizedType.includes('aadhaar') || 
                              normalizedType.includes('national_id') || 
                              normalizedType.includes('passport');

        if (!isIdentityDoc) {
            // Other academic or support files are allowed by default without keyword checks.
            // Bypassing local OCR/Tesseract to save CPU/Memory and avoid offline CDN initialization issues.
            return { is_valid: true };
        }

        let text = '';
        try {
            if (isImage) {
                text = await this.fallbackOcr(buffer);
            } else if (isPdf) {
                text = buffer.toString('utf-8');
            }
        } catch (e: any) {
            console.warn('[KycService] Local keyword extraction failed:', e.message);
        }

        const clean = text.toLowerCase();
        let matches = false;
        let expectedLabel = '';

        if (normalizedType.includes('pan')) {
            expectedLabel = 'PAN Card';
            const hasPanKeywords = clean.includes('income tax') ||
                clean.includes('permanent account') ||
                clean.includes('pan card') ||
                clean.includes('govt. of india') ||
                clean.includes('tax department') ||
                /([a-z]){5}([0-9]){4}([a-z]){1}/i.test(clean);
            
            // Exclude if it is clearly an Aadhaar or Passport
            const isAadhaar = clean.includes('unique identification') || clean.includes('aadhaar') || clean.includes('uidai') || /\b\d{4}\s?\d{4}\s?\d{4}\b/.test(clean);
            const isPassport = clean.includes('passport') || clean.includes('p<ind') || clean.includes('mrz');
            
            matches = hasPanKeywords && !isAadhaar && !isPassport;
        } else if (normalizedType.includes('aadhar') || normalizedType.includes('aadhaar') || normalizedType.includes('national_id')) {
            expectedLabel = 'Aadhaar Card';
            const hasAadhaarKeywords = clean.includes('unique identification') ||
                clean.includes('government of india') ||
                clean.includes('aadhaar') ||
                clean.includes('uidai') ||
                clean.includes('enrollment') ||
                clean.includes('enrolment') ||
                /\b\d{4}\s?\d{4}\s?\d{4}\b/.test(clean);
            
            // Exclude if it is clearly a passport or PAN card
            const isPassport = clean.includes('passport') || clean.includes('p<ind') || clean.includes('mrz');
            const isPan = clean.includes('income tax') || clean.includes('permanent account') || /([a-z]){5}([0-9]){4}([a-z]){1}/i.test(clean);
            
            // Strict Aadhaar validation: must have Aadhaar keywords and must NOT have other document keywords
            matches = hasAadhaarKeywords && !isPassport && !isPan;
        } else if (normalizedType.includes('passport')) {
            expectedLabel = 'Passport';
            const hasPassportKeywords = clean.includes('passport') ||
                clean.includes('republic of india') ||
                clean.includes('p<ind') ||
                clean.includes('nationality') ||
                clean.includes('mrz');
            
            // Exclude if it is clearly an Aadhaar or PAN card
            const isAadhaar = clean.includes('unique identification') || clean.includes('aadhaar') || clean.includes('uidai') || /\b\d{4}\s?\d{4}\s?\d{4}\b/.test(clean);
            const isPan = clean.includes('income tax') || clean.includes('permanent account') || /([a-z]){5}([0-9]){4}([a-z]){1}/i.test(clean);
            
            matches = hasPassportKeywords && !isAadhaar && !isPan;
        } else {
            // Other academic or support files are allowed by default
            return { is_valid: true };
        }

        if (!matches) {
            // For PDFs, if the raw binary is a valid PDF structure, let it pass to allow manual review
            // BUT ONLY IF it does not clearly contain keywords of a DIFFERENT document type!
            if (isPdf && (clean.includes('%pdf') || clean.includes('pdf-'))) {
                if (normalizedType.includes('aadhar') || normalizedType.includes('aadhaar') || normalizedType.includes('national_id')) {
                    const isPassport = clean.includes('passport') || clean.includes('p<ind') || clean.includes('mrz');
                    const isPan = clean.includes('income tax') || clean.includes('permanent account') || /([a-z]){5}([0-9]){4}([a-z]){1}/i.test(clean);
                    if (isPassport || isPan) {
                        return {
                            is_valid: false,
                            error: `Document type rejection: The uploaded PDF contains keywords indicating it is a ${isPassport ? 'Passport' : 'PAN Card'}, not an Aadhaar Card. Only Aadhaar cards should be uploaded for Aadhaar verification. Please upload the correct Aadhaar document.`
                        };
                    }
                    // Even if other PDF is uploaded without clear keywords of other doc types
                    return {
                        is_valid: false,
                        error: `Document verification failed: The uploaded PDF does not contain necessary Aadhaar document keywords. Only official Aadhaar cards should be uploaded for this field.`
                    };
                }
                if (normalizedType.includes('passport')) {
                    const isAadhaar = clean.includes('unique identification') || clean.includes('aadhaar') || clean.includes('uidai') || /\b\d{4}\s?\d{4}\s?\d{4}\b/.test(clean);
                    const isPan = clean.includes('income tax') || clean.includes('permanent account') || /([a-z]){5}([0-9]){4}([a-z]){1}/i.test(clean);
                    if (isAadhaar || isPan) {
                        return {
                            is_valid: false,
                            error: `Document mismatch in PDF. The uploaded PDF contains keywords indicating it is an ${isAadhaar ? 'Aadhaar Card' : 'PAN Card'} instead of a Passport.`
                        };
                    }
                }
                if (normalizedType.includes('pan')) {
                    const isAadhaar = clean.includes('unique identification') || clean.includes('aadhaar') || clean.includes('uidai') || /\b\d{4}\s?\d{4}\s?\d{4}\b/.test(clean);
                    const isPassport = clean.includes('passport') || clean.includes('p<ind') || clean.includes('mrz');
                    if (isAadhaar || isPassport) {
                        return {
                            is_valid: false,
                            error: `Document mismatch in PDF. The uploaded PDF contains keywords indicating it is a ${isAadhaar ? 'Aadhaar Card' : 'Passport'} instead of a PAN Card.`
                        };
                    }
                }
                return { is_valid: true };
            }
            return {
                is_valid: false,
                error: expectedLabel === 'Aadhaar Card' 
                    ? `Document verification failed: The uploaded file does not appear to be a valid Aadhaar card. Only official Aadhaar documents issued by UIDAI should be uploaded for this field.`
                    : `Document integrity check failed. The uploaded file does not contain necessary security keywords or patterns for a valid Indian ${expectedLabel}.`
            };
        }

        return { is_valid: true };
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
            You are an advanced AI-powered OCR engine specialized in Indian identity documents.
            Read the document image and extract ONLY text that is visibly printed on the document.

            CRITICAL RULES:
            - Copy values exactly as printed. Do NOT guess, invent, or duplicate values.
            - Return each concept ONCE with the exact field names specified below.
            - Do NOT output duplicate aliases (e.g. use "dob" only, never both "dob" and "date_of_birth").
            - Do NOT output both a string address and a structured address object — use one format only.
            - If a field is missing or unreadable, omit it or use null. Never use placeholder names like "Resident Name".
            
            ⚠️  DOCUMENT TYPE VERIFICATION (CRITICAL):
            - You MUST verify if the uploaded document matches the expected type: ${docType.toUpperCase()}
            - BEFORE extracting any data, FIRST check for markers of DIFFERENT document types
            - If you detect markers of a DIFFERENT document type, you MUST:
              1. Set is_valid to FALSE
              2. Set confidence_score to 0
              3. Set document_type to the actual detected type (not the expected type)
              4. Set fraud_detected to true
              5. Set fraud_reason to 'WRONG_DOCUMENT_TYPE_UPLOADED'
              6. Do NOT extract any fields
            - DO NOT try to force-fit data from the wrong document type
            - is_valid should ONLY be true when the document is the CORRECT type and core identity fields are readable

            Return ONLY a JSON object. No markdown, no explanation.
            JSON structure: {
                "document_type": "The actual detected document type, e.g. AADHAAR, PAN, PASSPORT, MARKSHEET_10, MARKSHEET_12, MARKSHEET_UG, MARKSHEET_PG, or UNKNOWN",
                "confidence_score": 0-100,
                "is_valid": boolean,
                "fraud_detected": boolean,
                "fraud_reason": "string if any",
                "extracted_data": { ...extracted fields... },
                "document_validation": { ...visible document validation booleans if requested... },
                "missing_fields": ["field1", "field2"],
                "ocr_issues": ["minor OCR artifact notes, if any"],
                "raw_text_summary": "short verbatim snippet from the document"
            }
        `;

        const typeSpecific = {
            aadhaar: `
                EXPECTED DOCUMENT TYPE: AADHAAR CARD (India's unique identity document issued by UIDAI)

                ⚠️  REJECT IMMEDIATELY IF YOU DETECT:
                - "PASSPORT" keyword anywhere
                - "P<" or "MRZ" (Machine Readable Zone - Passport marker)
                - "REPUBLIC OF INDIA" in header with "PASSPORT" 
                - "TRAVEL DOCUMENT"
                - "PASSPORT OFFICE"
                - "DATE OF ISSUE" + "DATE OF EXPIRY" (Passport structure)
                - Passport biodata page layout
                
                If ANY of the above detected: Set is_valid=false, fraud_reason='WRONG_DOCUMENT_TYPE_UPLOADED', document_type='PASSPORT', do NOT extract fields.

                ACCEPT ONLY IF YOU DETECT:
                - "UNIQUE IDENTIFICATION" or "UIDAI"
                - "AADHAAR" text on card
                - 12-digit number in format XXXX XXXX XXXX
                - "GOVT. OF INDIA" + "MINISTRY OF ELECTRONICS AND INFORMATION TECHNOLOGY"
                - Aadhaar-specific layout with name, DOB, gender, address sections

                extracted_data fields (use exactly these keys — dob and gender are REQUIRED):
                - full_name: ONLY the person's name printed on the card in the NAME field (e.g. "RAJESH KUMAR"). Do NOT include titles, prefixes, or labels. Extract ONLY the name text after the "Name:" label. Single name is okay.
                - aadhaar_number: all 12 digits if visible, or masked XXXX XXXX 1234 if only last 4 shown
                - dob: date of birth exactly as printed (DD/MM/YYYY). If only "Year of Birth" is shown, use YYYY-01-01 format.
                - gender: lowercase "male" or "female" (from M/F, Male/Female, or Hindi text on card)
                - vid: 16-digit VID only if printed on card (omit if not visible)
                - address: structured object ONLY:
                  { "house_details", "area", "landmark", "mandal", "city", "district", "state", "pincode" }
                - pin_code: 6-digit pincode (from address if not separate)

                document_validation (advisory booleans — do not fail is_valid solely because VID is absent):
                { "aadhaar_logo_present", "govt_of_india_branding_present", "uidai_text_present",
                  "aadhaar_number_format_valid", "vid_present", "photo_present", "dob_and_gender_fields_present" }

                is_valid: true when this is an Aadhaar card AND full_name, dob, and gender are readable.
            `,
            pan: `
                EXPECTED DOCUMENT TYPE: PAN CARD (Permanent Account Number card issued by Income Tax Department)

                ⚠️  REJECT IMMEDIATELY IF YOU DETECT:
                - "PASSPORT" keyword anywhere
                - "P<" or "MRZ" (Machine Readable Zone - Passport marker)
                - "UNIQUE IDENTIFICATION" or "AADHAAR" or "UIDAI"
                - "REPUBLIC OF INDIA" with "PASSPORT"
                - "TRAVEL DOCUMENT"
                
                If ANY above detected: Set is_valid=false, fraud_reason='WRONG_DOCUMENT_TYPE_UPLOADED', detect actual type, do NOT extract fields.

                ACCEPT ONLY IF YOU DETECT:
                - "INCOME TAX DEPARTMENT" or "TAX DEPARTMENT"
                - "PERMANENT ACCOUNT NUMBER" or "PAN"
                - 10-character code (5 letters + 4 digits + 1 letter)
                - "GOVT. OF INDIA"
                - PAN card layout with name, father's name, DOB sections

                extracted_data fields (use exactly these keys):
                - full_name: name as printed on card
                - father_name: father's name as printed
                - dob: date of birth (DD/MM/YYYY)
                - pan_number: 10-character PAN (AAAAA9999A uppercase)
                - country: e.g. "India"
                - authority: e.g. "Income Tax Department"
                - government: e.g. "Govt. of India"
                - signature_present, photo_present, qr_code_present: booleans for visible card features

                document_validation (set booleans from visible card — report false only when clearly absent):
                { "income_tax_department_heading_present", "govt_of_india_branding_present",
                  "pan_number_format_valid", "photo_present", "signature_present",
                  "qr_code_present", "dob_field_present" }

                is_valid: true when this is a PAN card AND full_name, father_name, dob, and pan_number are readable
                AND all document_validation checks that apply are true.
            `,
            passport: `
                EXPECTED DOCUMENT TYPE: PASSPORT (Travel document issued by Passport Office)

                ⚠️  REJECT IMMEDIATELY IF YOU DETECT:
                - "AADHAAR" or "UNIQUE IDENTIFICATION" or "UIDAI"
                - "INCOME TAX" or "PERMANENT ACCOUNT" or "PAN CARD"
                - "12-digit" Aadhaar number pattern without passport markers
                
                If ANY above detected: Set is_valid=false, fraud_reason='WRONG_DOCUMENT_TYPE_UPLOADED', detect actual type, do NOT extract fields.

                ACCEPT ONLY IF YOU DETECT:
                - "PASSPORT" text
                - "REPUBLIC OF INDIA" with "PASSPORT" header
                - "P<" or MRZ (Machine Readable Zone)
                - Passport office/authority text
                - Passport number in format (e.g., A12345678)

                extracted_data fields (extract each ONCE, exactly as printed on the passport):
                - passport_number
                - full_name: full name as on biodata page (given names then surname, single line)
                - given_names, surname: use when full_name line is split on the card
                - dob (DD/MM/YYYY)
                - gender: lowercase "male" or "female"
                - date_of_issue (DD/MM/YYYY)
                - date_of_expiry (DD/MM/YYYY)
                - issue_country: country where passport was issued (e.g. "India", not the city)
                - place_of_issue: city/passport office only (e.g. "HYDERABAD") — not the country
                - birth_city: city from Place of Birth
                - birth_country: country from Place of Birth (e.g. "India")
                - place_of_birth: full Place of Birth line if shown (e.g. "HYDERABAD, TELANGANA")
                - nationality: e.g. "INDIAN"
                - address: full address printed on the passport (address page). Use string or:
                  { "address1", "address2", "city", "state", "pincode", "country" }
                is_valid: true when passport with readable name and passport_number.
            `,
            marksheet_10: `
                EXPECTED DOCUMENT TYPE: GRADE 10 / SSC MARKSHEET/CERTIFICATE

                ⚠️  REJECT IMMEDIATELY IF YOU DETECT:
                - "PASSPORT", "AADHAAR", "UNIQUE IDENTIFICATION", "PAN CARD", "INCOME TAX"
                - Document that is NOT an academic marksheet/certificate
                
                If ANY above detected: Set is_valid=false, fraud_reason='WRONG_DOCUMENT_TYPE_UPLOADED', detect actual type, do NOT extract fields.

                ACCEPT ONLY IF YOU DETECT:
                - Board name (e.g., "Central Board of Secondary Education", "Board of Secondary Education")
                - Certificate/marksheet layout for Grade 10 / SSC
                - Subject table or result marks
                - Board seal/signature area

                extracted_data fields (use exactly these keys):
                - full_name: The candidate's full name as printed on the certificate.
                - board_name: The name of the educational board (e.g. "Central Board of Secondary Education", "Board of Secondary Education, Andhra Pradesh").
                - institution_name: The name of the school or center where the candidate studied.
                - city: The city/town/village/location of the school. If not explicitly listed, extract it from the school's address, name, or stamp.
                - state: The state of study (e.g. "Andhra Pradesh", "Telangana", "Maharashtra", "Delhi").
                - country: e.g. "India".
                - examination_month_year: The month and year the examination was held, or date of passing/issue (e.g., "MARCH 2017", "MAY 2018").
                - grading_system: The grading system used (e.g. "CGPA" or "Percentage").
                - total_marks_secured: The total number of marks or grand total secured by the candidate.
                - total_marks_maximum: The maximum possible grand total marks (e.g., 600, 1000).
                - overall_percentage: The overall percentage obtained. If not written, leave null.
                - cgpa: The overall CGPA/GPA secured if CBSE/grade-based (e.g., 9.2).
                - roll_number: The candidate's roll number, registration number, or hall ticket number.
                - certificate_number: Certificate serial number if visible.
                - barcode_number: Barcode number or printed barcode text if visible.

                document_validation (advisory booleans based only on visible evidence):
                { "official_board_formatting_present", "seal_or_signature_area_present",
                  "barcode_present", "certificate_number_present",
                  "ssc_grade_format_consistent", "subject_table_present" }

                ocr_issues: short array of harmless OCR artifacts if present, e.g. misspelled words, accent/spacing artifacts, subject-name formatting issues. Do not treat these as tampering by themselves.
                
                is_valid: true if it is a Grade 10 marksheet/certificate.
            `,
            marksheet_12: `
                EXPECTED DOCUMENT TYPE: GRADE 12 / INTERMEDIATE / HSC MARKSHEET/CERTIFICATE

                ⚠️  REJECT IMMEDIATELY IF YOU DETECT:
                - "PASSPORT", "AADHAAR", "UNIQUE IDENTIFICATION", "PAN CARD", "INCOME TAX"
                - Document that is NOT an academic marksheet/certificate
                
                If ANY above detected: Set is_valid=false, fraud_reason='WRONG_DOCUMENT_TYPE_UPLOADED', detect actual type, do NOT extract fields.

                ACCEPT ONLY IF YOU DETECT:
                - Board name (e.g., "Central Board of Secondary Education", "Board of Intermediate Education", "Maharashtra State Board")
                - Certificate/marksheet layout for Grade 12 / Intermediate
                - Subject table or result marks
                - Board seal/signature area

                extracted_data fields (use exactly these keys):
                - full_name: The candidate's full name as printed on the certificate.
                - board_name: The name of the educational board or council (e.g. "Board of Intermediate Education, Andhra Pradesh", "Central Board of Secondary Education", "Maharashtra State Board").
                - institution_name: The junior college, school, or center name where the candidate studied.
                - city: The city/town/village/location of the college or school. If not explicitly listed, extract it from the college's address, name, or stamp.
                - state: The state of study (e.g. "Andhra Pradesh", "Telangana", "Maharashtra", "Delhi").
                - country: e.g. "India".
                - examination_month_year: The month and year the examination was held, or date of passing/issue (e.g., "MARCH 2019", "MAY 2020").
                - grading_system: The grading system used (e.g. "CGPA" or "Percentage").
                - total_marks_secured: The total number of marks or grand total secured by the candidate.
                - total_marks_maximum: The maximum possible grand total marks (e.g., 1000, 600).
                - overall_percentage: The overall percentage obtained. If not written, leave null.
                - cgpa: The overall CGPA/GPA secured if grade-based.
                - roll_number: The candidate's roll number, registration number, or hall ticket number.
                - certificate_number: Certificate serial number if visible.
                - barcode_number: Barcode number or printed barcode text if visible.

                document_validation (advisory booleans based only on visible evidence):
                { "official_board_formatting_present", "seal_or_signature_area_present",
                  "barcode_present", "certificate_number_present",
                  "ssc_grade_format_consistent", "subject_table_present" }

                ocr_issues: short array of harmless OCR artifacts if present, e.g. misspelled words, accent/spacing artifacts, subject-name formatting issues. Do not treat these as tampering by themselves.
                
                is_valid: true if it is a Grade 12 or equivalent marksheet/certificate.
            `,
            marksheet_ug: `
                EXPECTED DOCUMENT TYPE: UNDERGRADUATE DEGREE / MARKSHEET / TRANSCRIPT

                ⚠️  REJECT IMMEDIATELY IF YOU DETECT:
                - "PASSPORT", "AADHAAR", "UNIQUE IDENTIFICATION", "PAN CARD", "INCOME TAX"
                - Document that is NOT an academic degree/marksheet/transcript
                
                If ANY above detected: Set is_valid=false, fraud_reason='WRONG_DOCUMENT_TYPE_UPLOADED', detect actual type, do NOT extract fields.

                ACCEPT ONLY IF YOU DETECT:
                - University name (e.g., "Jawaharlal Nehru Technological University", "Delhi University")
                - Degree name (e.g., "Bachelor of Technology", "B.Tech", "B.Sc")
                - Program/branch name
                - Marksheet or transcript layout
                - University seal/signature area

                extracted_data fields (use exactly these keys):
                - full_name: The candidate's full name as printed on the degree or transcript.
                - university: The name of the awarding university or institute (e.g. "Jawaharlal Nehru Technological University", "Delhi University").
                - institution_name: The name of the college or campus where the candidate studied (if separate from university).
                - qualification: The degree name or program (e.g., "Bachelor of Technology", "B.Tech", "Bachelor of Science", "B.Sc").
                - program_name: The branch, major, or specialized field (e.g., "Computer Science and Engineering", "Mechanical Engineering", "Physics").
                - city: The city of study. If not explicitly listed, extract it from the college's address, name, or stamp.
                - state: The state of study (e.g. "Andhra Pradesh", "Telangana", "Maharashtra", "Delhi").
                - country: e.g. "India".
                - examination_month_year: The month and year the examination was held, or passing/issue date (e.g., "MAY 2021").
                - grading_system: The grading system used (e.g. "CGPA" or "Percentage").
                - total_marks_secured: The total number of marks or grand total secured by the candidate.
                - total_marks_maximum: The maximum possible grand total marks.
                - overall_percentage: The overall percentage obtained. If not written, leave null.
                - cgpa: The overall CGPA/GPA secured (e.g., 8.75).
                - roll_number: The candidate's roll number, registration number, or seat number.
                - certificate_number: Certificate serial number or degree number if visible.
                - barcode_number: Barcode number or printed barcode text if visible.

                ocr_issues: short array of harmless OCR artifacts if present.
                
                is_valid: true if it is an Undergraduate degree certificate, marksheet, or transcript.
            `,
            marksheet_pg: `
                EXPECTED DOCUMENT TYPE: POSTGRADUATE DEGREE / MARKSHEET / TRANSCRIPT

                ⚠️  REJECT IMMEDIATELY IF YOU DETECT:
                - "PASSPORT", "AADHAAR", "UNIQUE IDENTIFICATION", "PAN CARD", "INCOME TAX"
                - Document that is NOT an academic postgraduate degree/marksheet/transcript
                
                If ANY above detected: Set is_valid=false, fraud_reason='WRONG_DOCUMENT_TYPE_UPLOADED', detect actual type, do NOT extract fields.

                ACCEPT ONLY IF YOU DETECT:
                - University name (e.g., "Indian Institute of Technology", "Anna University")
                - Postgraduate degree name (e.g., "Master of Technology", "M.Tech", "MBA", "M.Sc")
                - Postgraduate program/branch name
                - Marksheet or transcript layout
                - University seal/signature area

                extracted_data fields (use exactly these keys):
                - full_name: The candidate's full name as printed on the degree or transcript.
                - university: The name of the awarding university or institute (e.g. "Indian Institute of Technology", "Anna University").
                - institution_name: The name of the postgraduate college or department where the candidate studied.
                - qualification: The postgraduate degree name or program (e.g., "Master of Technology", "M.Tech", "Master of Business Administration", "MBA", "M.Sc").
                - program_name: The branch, major, or specialized field (e.g., "Data Science", "Marketing", "Organic Chemistry").
                - city: The city of study. If not explicitly listed, extract it from the college's address, name, or stamp.
                - state: The state of study (e.g. "Andhra Pradesh", "Telangana", "Maharashtra", "Delhi").
                - country: e.g. "India".
                - examination_month_year: The month and year the examination was held, or passing/issue date (e.g., "JULY 2023").
                - grading_system: The grading system used (e.g. "CGPA" or "Percentage").
                - total_marks_secured: The total number of marks or grand total secured by the candidate.
                - total_marks_maximum: The maximum possible grand total marks.
                - overall_percentage: The overall percentage obtained. If not written, leave null.
                - cgpa: The overall CGPA/GPA secured.
                - roll_number: The candidate's roll number, registration number, or enrollment number.
                - certificate_number: Certificate serial number or degree number if visible.
                - barcode_number: Barcode number or printed barcode text if visible.

                ocr_issues: short array of harmless OCR artifacts if present.
                
                is_valid: true if it is a Postgraduate degree certificate, marksheet, or transcript.
            `
        };

        const normalizedType = docType.toLowerCase();
        let targetType = 'generic';
        if (normalizedType.includes('aadhaar') || normalizedType.includes('aadhar') || normalizedType.includes('national_id')) {
            targetType = 'aadhaar';
        } else if (normalizedType.includes('pan')) {
            targetType = 'pan';
        } else if (normalizedType.includes('passport')) {
            targetType = 'passport';
        } else if (normalizedType.includes('marksheet_10') || normalizedType.includes('10th') || normalizedType.includes('ssc') || normalizedType.includes('grade10') || normalizedType.includes('grade_10')) {
            targetType = 'marksheet_10';
        } else if (normalizedType.includes('marksheet_12') || normalizedType.includes('12th') || normalizedType.includes('hsc') || normalizedType.includes('intermediate') || normalizedType.includes('grade12') || normalizedType.includes('grade_12')) {
            targetType = 'marksheet_12';
        } else if (normalizedType.includes('marksheet_ug') || normalizedType.includes('ug_degree') || normalizedType.includes('ug_transcript') || normalizedType.includes('undergrad') || normalizedType.includes('undergraduate')) {
            targetType = 'marksheet_ug';
        } else if (normalizedType.includes('marksheet_pg') || normalizedType.includes('pg_degree') || normalizedType.includes('pg_transcript') || normalizedType.includes('postgrad') || normalizedType.includes('postgraduate')) {
            targetType = 'marksheet_pg';
        }

        return baseInstructions + (typeSpecific[targetType] || 'Extract all visible fields and verify integrity.');
    }

    private parseAiResponse(response: string, docType: string): KycExtractionResult {
        console.log("=== RAW AI RESPONSE ===");
        console.log(response);
        try {
            const cleaned = response.replace(/```json/gi, '').replace(/```/g, '').trim();
            const jsonStart = cleaned.indexOf('{');
            const jsonEnd = cleaned.lastIndexOf('}');
            const jsonString = cleaned.slice(jsonStart, jsonEnd + 1);
            const parsed = JSON.parse(jsonString);

            const rawExtracted = parsed.extracted_data || parsed.extractedFields || {};
            const extracted = canonicalizeOcrFields(
                {
                    ...rawExtracted,
                    raw_text_summary:
                        parsed.raw_text_summary ||
                        parsed.rawOcrText ||
                        rawExtracted.raw_text_summary,
                },
                docType,
            );

            if (!extracted.full_name) {
                const fromSummary = extractNameFromLabeledOcrText(
                    String(parsed.raw_text_summary || parsed.rawOcrText || ''),
                );
                if (fromSummary) extracted.full_name = fromSummary;
            }

            const lowerType = String(docType || '').toLowerCase();
            const isAadhaar = lowerType.includes('aadhaar') || lowerType.includes('aadhar') || lowerType.includes('national_id');
            const isPan = lowerType.includes('pan');

            let isValid = parsed.is_valid ?? (parsed.confidence_score >= 60);
            let validationError: string | undefined;
            let documentValidation = parsed.document_validation;

            // Check for fraud_reason indicating wrong document type
            if (parsed.fraud_reason === 'WRONG_DOCUMENT_TYPE_UPLOADED') {
                isValid = false;
                validationError = `Document type mismatch: Expected a valid ${docType.toUpperCase().replace(/_/g, ' ')}, but the uploaded document appears to be a ${String(parsed.document_type || 'different document').toUpperCase()}. Please upload the correct document.`;
            } else {
                // Strict document type validation check
                const expectedNorm = this.normalizeDocTypeForComparison(docType);
                const detectedNorm = this.normalizeDocTypeForComparison(parsed.document_type || docType);
                const isCustomDoc = docType.toLowerCase().includes('other');

                if (!isCustomDoc && expectedNorm !== detectedNorm) {
                    isValid = false;
                    validationError = `Document type mismatch: Expected a valid ${docType.toUpperCase().replace(/_/g, ' ')}, but detected a ${String(parsed.document_type || 'different document type').toUpperCase()}. Please upload the correct document.`;
                } else {
                    if (isAadhaar) {
                        const aadhaarValidation = this.validateAadhaarDocument(parsed, extracted);
                        if (!aadhaarValidation.is_valid) {
                            isValid = false;
                            validationError = aadhaarValidation.error;
                        }
                    } else if (isPan) {
                        const panValidation = validatePanExtraction(extracted, parsed);
                        documentValidation = panValidation.document_validation;
                        if (!panValidation.is_valid) {
                            isValid = false;
                            validationError = panValidation.error;
                        }
                    } else if (!extracted.full_name && Object.keys(extracted).length === 0) {
                        isValid = false;
                        validationError = 'No readable fields extracted from document';
                    }
                }
            }

            return {
                document_type: (parsed.document_type || docType).toLowerCase() as any,
                confidence_score: parsed.confidence_score || 0,
                is_valid: isValid,
                fraud_detected: parsed.fraud_detected || false,
                fraud_reason: parsed.fraud_reason,
                extracted_data: extracted,
                document_validation: documentValidation,
                missing_fields: parsed.missing_fields || [],
                ocr_issues: parsed.ocr_issues || rawExtracted.ocr_issues || [],
                raw_text_summary: parsed.raw_text_summary,
                error: validationError,
            };
        } catch (e) {
            console.error('[KycService] JSON Parse Error:', e);
            return {
                document_type: docType as any,
                confidence_score: 0,
                is_valid: false,
                extracted_data: {},
                error: 'AI response was not valid JSON'
            };
        }
    }

    private normalizeDocTypeForComparison(type: string): string {
        const t = String(type || '').toLowerCase();
        if (t.includes('aadhaar') || t.includes('aadhar') || t.includes('national_id')) {
            return 'aadhaar';
        }
        if (t.includes('pan')) {
            return 'pan';
        }
        if (t.includes('passport')) {
            return 'passport';
        }
        if (t.includes('marksheet_10') || t.includes('10th') || t.includes('ssc') || t.includes('grade10') || t.includes('grade_10')) {
            return 'marksheet_10';
        }
        if (t.includes('marksheet_12') || t.includes('12th') || t.includes('hsc') || t.includes('intermediate') || t.includes('grade12') || t.includes('grade_12')) {
            return 'marksheet_12';
        }
        if (t.includes('marksheet_ug') || t.includes('ug_degree') || t.includes('ug_transcript') || t.includes('undergrad') || t.includes('undergraduate')) {
            return 'marksheet_ug';
        }
        if (t.includes('marksheet_pg') || t.includes('pg_degree') || t.includes('pg_transcript') || t.includes('postgrad') || t.includes('postgraduate')) {
            return 'marksheet_pg';
        }
        return t;
    }

    private validateAadhaarDocument(
        _parsed: any,
        extracted: any,
    ): { is_valid: boolean; error?: string } {
        const failedLabels: string[] = [];

        if (!extracted.full_name) {
            failedLabels.push('full name');
        }
        if (!extracted.dob) {
            failedLabels.push('date of birth');
        }
        if (!extracted.gender) {
            failedLabels.push('gender');
        }

        const aadhaarRaw = String(extracted.aadhaar_number || '');
        const digitsOnly = aadhaarRaw.replace(/\D/g, '');
        if (digitsOnly.length > 0 && digitsOnly.length < 4) {
            failedLabels.push('aadhaar number (unreadable)');
        }

        if (failedLabels.length > 0) {
            return {
                is_valid: false,
                error: `Could not read required Aadhaar fields: ${failedLabels.join(', ')}`,
            };
        }

        return { is_valid: true };
    }

    /**
     * Tesseract fallback for basic OCR
     */
    async fallbackOcr(buffer: Buffer): Promise<string> {
        try {
            const worker = await createWorker('eng');
            const { data: { text } } = await worker.recognize(buffer);
            await worker.terminate();
            return text;
        } catch (err: any) {
            console.error('[KycService] Tesseract fallback OCR worker initialization or recognition failed:', err?.message || err);
            return '';
        }
    }

    /**
     * Parse raw text dynamically using regular expressions to extract structured document fields.
     */
    private extractDynamicFieldsFromText(text: string, docType: string): any {
        const clean = text.trim();
        const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
        const data: any = {};

        const normalizedType = String(docType || '').toLowerCase();

        // 1. Extract Aadhaar details
        if (normalizedType.includes('aadhaar') || normalizedType.includes('aadhar') || normalizedType.includes('national_id')) {
            // Find Aadhaar Number (12 digits, optional spaces)
            const aadhaarMatch = clean.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/);
            if (aadhaarMatch) {
                data.aadhaar_number = aadhaarMatch[0];
            }

            // Find DOB (DD/MM/YYYY, DD-MM-YYYY, or Year of Birth)
            const dobMatch = clean.match(/\b\d{2}[-/.]\d{2}[-/.]\d{4}\b/);
            if (dobMatch) {
                data.dob = dobMatch[0];
            } else {
                const yobMatch = clean.match(/(?:year\s*of\s*birth|yob|जन्म\s*वर्ष)[:\s]*((?:19|20)\d{2})/i)
                    || clean.match(/\b((?:19|20)\d{2})\b/);
                if (yobMatch) {
                    data.dob = `${yobMatch[1]}-01-01`;
                }
            }

            // Find Gender (M/F, Male/Female — check female before male)
            if (/\bfemale\b/i.test(clean) || /\bमहिला\b/.test(clean)) {
                data.gender = 'female';
            } else if (/\bmale\b/i.test(clean) || /\bपुरुष\b/.test(clean)) {
                data.gender = 'male';
            } else if (/\b[Ff]\b/.test(clean) && !/\b[Mm]\b/.test(clean.split(/\n/)[0] || '')) {
                data.gender = 'female';
            } else if (/\b[Mm]\b/.test(clean)) {
                data.gender = 'male';
            }

            // Find Name — "Name:" / "नाम" label (supports ALL CAPS and Indic script)
            let foundName = extractNameFromLabeledOcrText(clean) || '';

            if (!foundName) {
                const skipKeywords = [
                    'government', 'india', 'unique', 'identification', 'authority', 'uidai',
                    'enrollment', 'help', 'yojana', 'address', 'father', 'husband', 'mother',
                    'download', 'card', 'generation', 'issued', 'valid', 'year', 'birth',
                    'resident', 'dob', 'gender', 'sex', 'male', 'female', 'aadhaar', 'आधार',
                    'your', 'aadhar', 'vid', 'mobile', 'email', 'www', 'uidai.gov',
                ];

                foundName = lines
                    .filter((line) => {
                        const lower = line.toLowerCase();
                        const hasLetters = /\p{L}/u.test(line);
                        const noLongDigitRun = !/\d{4,}/.test(line);
                        const minLength = line.length >= 2;
                        const maxLength = line.length <= 60;
                        const notSkipped = !skipKeywords.some((kw) => lower.includes(kw));
                        const notLabelOnly = !/^(name|नाम)\s*:?\s*$/iu.test(line.trim());
                        return hasLetters && noLongDigitRun && minLength && maxLength && notSkipped && notLabelOnly;
                    })
                    .sort((a, b) => {
                        const aWords = a.trim().split(/\s+/).length;
                        const bWords = b.trim().split(/\s+/).length;
                        const aGood = aWords >= 2 && aWords <= 5;
                        const bGood = bWords >= 2 && bWords <= 5;
                        if (aGood && !bGood) return -1;
                        if (!aGood && bGood) return 1;
                        return a.length - b.length;
                    })[0] || '';
            }

            if (foundName && foundName.length > 2) {
                data.full_name = foundName.replace(/\s+/g, ' ').trim();
            }

            // Find Address (starts with "address", "पता", "C/O", "S/O", "D/O", "W/O" and ends near pin code or next keywords)
            const addressKeywords = ['address', 'पता', 'c/o', 's/o', 'd/o', 'w/o'];
            let addressStartIdx = -1;
            let matchedKeyword = '';

            for (const kw of addressKeywords) {
                const idx = clean.toLowerCase().indexOf(kw);
                if (idx !== -1) {
                    addressStartIdx = idx;
                    matchedKeyword = kw;
                    break;
                }
            }

            if (addressStartIdx !== -1) {
                let addressText = clean.substring(addressStartIdx + matchedKeyword.length);
                // Remove leading colons, spaces, punctuation
                addressText = addressText.replace(/^[\s::,-]+/g, '');

                // Truncate at standard system texts/footer or pin code
                const limitKeywords = ['unique identification', 'uidai', 'enrollment', 'help@', 'www.uidai', 'information', 'authority'];
                let earliestEnd = addressText.length;
                for (const limitKw of limitKeywords) {
                    const limitIdx = addressText.toLowerCase().indexOf(limitKw);
                    if (limitIdx !== -1 && limitIdx < earliestEnd) {
                        earliestEnd = limitIdx;
                    }
                }

                // Let's also look for a 6-digit pin code and capture up to the pin code + 7 characters
                const pinMatch = addressText.match(/\b\d{6}\b/);
                if (pinMatch && pinMatch.index !== undefined) {
                    const pinEndIdx = pinMatch.index + 6;
                    if (pinEndIdx < earliestEnd) {
                        earliestEnd = pinEndIdx;
                    }
                    data.pin_code = pinMatch[0];
                }

                const finalAddress = addressText.substring(0, earliestEnd).trim().replace(/\n+/g, ', ');
                if (finalAddress.length > 10) {
                    // Parse address into granular Aadhaar format
                    const addressParts = finalAddress.split(/[,\n;-]+/).map(p => p.trim()).filter(Boolean);
                    
                    // Extract pincode and state from the address
                    const states = [
                        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
                        'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
                        'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
                        'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
                        'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir',
                        'Jammu and Kashmir', 'Puducherry', 'Chandigarh'
                    ];
                    
                    let foundState = '';
                    const lowerAddress = finalAddress.toLowerCase();
                    for (const state of states) {
                        if (lowerAddress.includes(state.toLowerCase())) {
                            foundState = state;
                            break;
                        }
                    }
                    
                    // Build structured address object
                    const structuredAddress: Record<string, string> = {};
                    if (addressParts.length > 0) structuredAddress.house_details = addressParts[0];
                    if (addressParts.length > 1) structuredAddress.area = addressParts[1];
                    if (addressParts.length > 2) structuredAddress.landmark = addressParts[2];
                    if (addressParts.length > 3) structuredAddress.mandal = addressParts[3];
                    if (addressParts.length > 4) structuredAddress.district = addressParts[4];
                    if (foundState) structuredAddress.state = foundState;
                    if (data.pin_code) structuredAddress.pincode = data.pin_code;
                    
                    // If we have at least some granular fields, use structured format
                    if (Object.keys(structuredAddress).length > 0) {
                        data.address = structuredAddress;
                    } else {
                        // Fallback to string format
                        data.address = finalAddress;
                    }
                }
            }

            if (!data.pin_code) {
                const pinMatch = clean.match(/\b\d{6}\b/);
                if (pinMatch) {
                    data.pin_code = pinMatch[0];
                }
            }
        }

        // 2. Extract PAN details
        else if (normalizedType.includes('pan')) {
            // Find PAN Number (5 letters, 4 digits, 1 letter)
            const panMatch = clean.match(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/i);
            if (panMatch) {
                data.pan_number = panMatch[0].toUpperCase();
            }

            // Find DOB
            const dobMatch = clean.match(/\b\d{2}[-/]\d{2}[-/]\d{4}\b/);
            if (dobMatch) {
                data.dob = dobMatch[0];
            }

            // Find Name & Father's Name
            const skipKeywords = [
                'income', 'tax', 'department', 'govt', 'india', 'permanent', 'account', 'number', 'card', 'signature'
            ];
            const labeledPanName = extractNameFromLabeledOcrText(clean);
            if (labeledPanName) {
                data.full_name = labeledPanName;
            }

            const validLines = lines.filter(line => {
                const lower = line.toLowerCase();
                const hasLetters = /\p{L}/u.test(line);
                const hasNumbers = /\d/.test(line);
                const isLongEnough = line.length >= 3 && line.length <= 40;
                const matchesSkip = skipKeywords.some(keyword => lower.includes(keyword));
                return hasLetters && !hasNumbers && isLongEnough && !matchesSkip;
            });

            if (!data.full_name && validLines.length > 0) {
                data.full_name = validLines[0];
                if (validLines.length > 1) {
                    data.father_name = validLines[1];
                }
            }
        }

        // 3. Extract Passport details
        else if (normalizedType.includes('passport')) {
            const passportMatch = clean.match(/\b[A-Z][0-9]{7}\b/i);
            if (passportMatch) {
                data.passport_number = passportMatch[0].toUpperCase();
            }

            const allDates = [...clean.matchAll(/\b(\d{2})[-/.](\d{2})[-/.](\d{4})\b/g)];
            if (allDates.length >= 1) data.dob = allDates[0][0];
            if (allDates.length >= 2) data.date_of_issue = allDates[1][0];
            if (allDates.length >= 3) data.date_of_expiry = allDates[2][0];
            else if (allDates.length === 2) data.date_of_expiry = allDates[1][0];

            if (/\bfemale\b/i.test(clean)) data.gender = 'female';
            else if (/\bmale\b/i.test(clean)) data.gender = 'male';

            if (/\bindian\b/i.test(clean) || /\bindia\b/i.test(clean)) {
                data.nationality = 'INDIAN';
                data.issue_country = 'India';
                data.birth_country = 'India';
            }

            const pobMatch = clean.match(/place\s*of\s*birth[:\s]+([^\n]+)/i);
            if (pobMatch) data.place_of_birth = pobMatch[1].trim();

            const poiMatch = clean.match(/place\s*of\s*issue[:\s]+([^\n]+)/i);
            if (poiMatch) data.place_of_issue = poiMatch[1].trim();

            const labeledPassportName = extractNameFromLabeledOcrText(clean);
            if (labeledPassportName) {
                data.full_name = labeledPassportName;
            }

            if (!data.full_name) {
                const nameLine = lines.find(line => {
                    const hasLetters = /\p{L}/u.test(line);
                    const hasNumbers = /\d/.test(line);
                    const isLongEnough = line.length >= 3 && line.length <= 50;
                    const lower = line.toLowerCase();
                    return hasLetters && !hasNumbers && isLongEnough
                        && !lower.includes('passport') && !lower.includes('republic')
                        && !lower.includes('india') && !lower.includes('birth')
                        && !lower.includes('issue') && !lower.includes('expir')
                        && !/^(name|नाम)\s*:?\s*$/i.test(line.trim())
                        && !lower.includes('mrz');
                });
                if (nameLine) data.full_name = nameLine.replace(/\s+/g, ' ').trim();
            }

            const pinMatch = clean.match(/\b\d{6}\b/);
            if (pinMatch) {
                const addrBlock = clean.match(/(?:address|पता)[:\s]*([^\n]{15,200})/i);
                if (addrBlock) {
                    data.address = addrBlock[1].trim().replace(/\s+/g, ' ');
                }
            }
        }

        return data;
    }
}
