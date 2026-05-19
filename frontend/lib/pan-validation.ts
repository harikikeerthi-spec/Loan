/**
 * Client-side PAN format check (matches server pan-validation.util.ts).
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

export const PAN_VALIDATION_LABELS: Record<keyof PanDocumentValidation, string> = {
    income_tax_department_heading_present: 'Income Tax Department heading',
    govt_of_india_branding_present: 'Govt. of India branding',
    pan_number_format_valid: 'PAN format (AAAAA9999A)',
    photo_present: 'Photo',
    signature_present: 'Signature',
    qr_code_present: 'QR code',
    dob_field_present: 'Date of birth field',
};

export function isValidPanNumber(pan: string | undefined | null): boolean {
    if (!pan) return false;
    return PAN_NUMBER_REGEX.test(String(pan).trim().toUpperCase());
}

export function formatPanValidationSummary(validation?: PanDocumentValidation | null): string {
    if (!validation) return '';
    return Object.entries(PAN_VALIDATION_LABELS)
        .map(([key, label]) => {
            const ok = validation[key as keyof PanDocumentValidation];
            return `${ok ? '✓' : '✗'} ${label}`;
        })
        .join('\n');
}
