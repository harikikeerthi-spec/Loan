/**
 * PAN card OCR extraction and document_validation checks.
 */

export const PAN_NUMBER_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export interface PanDocumentValidation {
    income_tax_department_heading_present: boolean;
    govt_of_india_branding_present: boolean;
    pan_number_format_valid: boolean;
    photo_present: boolean;
    signature_present: boolean;
    qr_code_present: boolean;
    dob_field_present: boolean;
}

const PAN_VALIDATION_LABELS: Record<keyof PanDocumentValidation, string> = {
    income_tax_department_heading_present: 'Income Tax Department heading',
    govt_of_india_branding_present: 'Govt. of India branding',
    pan_number_format_valid: 'PAN format (AAAAA9999A)',
    photo_present: 'photo',
    signature_present: 'signature',
    qr_code_present: 'QR code',
    dob_field_present: 'date of birth field',
};

/** Always enforced from extracted data even when AI omits flags */
const SERVER_ENFORCED_KEYS: (keyof PanDocumentValidation)[] = [
    'pan_number_format_valid',
    'dob_field_present',
];

/** Enforced only when AI explicitly returns false */
const AI_FLAG_KEYS: (keyof PanDocumentValidation)[] = [
    'income_tax_department_heading_present',
    'govt_of_india_branding_present',
    'photo_present',
    'signature_present',
    'qr_code_present',
];

export function isValidPanNumber(pan: string | undefined | null): boolean {
    if (!pan) return false;
    return PAN_NUMBER_REGEX.test(String(pan).trim().toUpperCase());
}

function coerceBool(value: unknown): boolean | undefined {
    if (value === true || value === false) return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
}

/** Build document_validation from AI response + server-side inference. */
export function buildPanDocumentValidation(
    parsed: Record<string, any> | null | undefined,
    extracted: Record<string, any>,
): PanDocumentValidation {
    const raw = parsed?.document_validation ?? {};
    const fromExtracted = parsed?.extracted_data ?? extracted;

    return {
        income_tax_department_heading_present:
            coerceBool(raw.income_tax_department_heading_present) ?? false,
        govt_of_india_branding_present:
            coerceBool(raw.govt_of_india_branding_present) ?? false,
        pan_number_format_valid:
            coerceBool(raw.pan_number_format_valid) ?? isValidPanNumber(extracted.pan_number),
        photo_present:
            coerceBool(raw.photo_present ?? fromExtracted.photo_present) ?? false,
        signature_present:
            coerceBool(raw.signature_present ?? fromExtracted.signature_present) ?? false,
        qr_code_present:
            coerceBool(raw.qr_code_present ?? fromExtracted.qr_code_present) ?? false,
        dob_field_present: coerceBool(raw.dob_field_present) ?? !!extracted.dob,
    };
}

function getExplicitAiFlag(
    raw: Record<string, any>,
    key: keyof PanDocumentValidation,
): boolean | undefined {
    return coerceBool(raw[key]);
}

export function validatePanExtraction(
    extracted: Record<string, any>,
    parsed?: Record<string, any> | null,
): { is_valid: boolean; error?: string; document_validation?: PanDocumentValidation } {
    const failedFields: string[] = [];

    if (!extracted.full_name) failedFields.push('full name');
    if (!extracted.father_name) failedFields.push("father's name");
    if (!extracted.dob) failedFields.push('date of birth');
    if (!extracted.pan_number) {
        failedFields.push('PAN number');
    } else if (!isValidPanNumber(extracted.pan_number)) {
        failedFields.push('PAN number (invalid format AAAAA9999A)');
    }

    const document_validation = buildPanDocumentValidation(parsed, extracted);
    const rawDv = parsed?.document_validation ?? {};

    if (failedFields.length > 0) {
        return {
            is_valid: false,
            error: `Could not read required PAN fields: ${failedFields.join(', ')}`,
            document_validation,
        };
    }

    const failedChecks: string[] = [];

    for (const key of SERVER_ENFORCED_KEYS) {
        if (!document_validation[key]) {
            failedChecks.push(PAN_VALIDATION_LABELS[key]);
        }
    }

    for (const key of AI_FLAG_KEYS) {
        const explicit = getExplicitAiFlag(rawDv, key);
        if (explicit === false) {
            failedChecks.push(PAN_VALIDATION_LABELS[key]);
        }
    }

    if (failedChecks.length > 0) {
        return {
            is_valid: false,
            error: `PAN document validation failed: ${failedChecks.join(', ')}`,
            document_validation,
        };
    }

    return { is_valid: true, document_validation };
}
