/**
 * Canonicalizes OCR output to one value per field (no duplicate aliases).
 */

import {
    AcademicLevel,
    canonicalizeAcademicFields,
} from './academic-ocr.util';

const PLACEHOLDER_VALUES = new Set([
    'resident name',
    'pan holder',
    'passport holder',
    'unknown',
    'n/a',
    'na',
    'not visible',
    'not available',
    'name',
    'full name',
    'holder',
    'student name',
    'candidate name',
]);

/** Letters in Latin + common Indic scripts (Aadhaar/PAN often print names in English or regional script). */
const OCR_NAME_CHAR = '\\p{L}\\p{M}';
const OCR_NAME_WORD = `[${OCR_NAME_CHAR}][${OCR_NAME_CHAR}'\\-.]*`;

function isPlaceholder(value: unknown): boolean {
    if (value == null) return true;
    const s = String(value).trim().toLowerCase();
    return !s || PLACEHOLDER_VALUES.has(s);
}

/**
 * Vision models often repeat the printed name twice (e.g. "RAJESH KUMAR RAJESH KUMAR")
 * or repeat a multi-word phrase three times. Collapse exact repeated word-chunks only.
 * Skips single-token doubles when n<4 so real names like "Ram Ram" stay unchanged.
 */
export function dedupeOcrFullName(raw: string): string {
    const s = String(raw).replace(/\s+/g, ' ').trim();
    if (!s) return s;
    const words = s.split(' ');
    const n = words.length;
    if (n < 2) return s;

    for (let p = 1; p <= Math.floor(n / 2); p++) {
        if (n % p !== 0) continue;
        const repeats = n / p;
        if (repeats < 2) continue;
        // Avoid turning "Ram Ram" into "Ram" (2 tokens); allow "Ram Ram Ram Ram".
        if (p === 1 && n < 4) continue;

        const chunk = words.slice(0, p).join(' ').toLowerCase();
        let ok = true;
        for (let start = p; start < n; start += p) {
            const part = words.slice(start, start + p).join(' ').toLowerCase();
            if (part !== chunk) {
                ok = false;
                break;
            }
        }
        if (ok) {
            return words.slice(0, p).join(' ');
        }
    }
    return s;
}

function pickFirst<T>(...values: (T | undefined | null)[]): T | undefined {
    for (const v of values) {
        if (v == null) continue;
        if (typeof v === 'string' && isPlaceholder(v)) continue;
        if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) continue;
        return v as T;
    }
    return undefined;
}

function normalizeGender(g?: string): string | undefined {
    if (!g || isPlaceholder(g)) return undefined;
    const lower = String(g).trim().toLowerCase();
    if (lower === 'm' || lower.startsWith('m') || lower.includes('male') || lower.includes('पुरुष')) return 'male';
    if (lower === 'f' || lower.startsWith('f') || lower.includes('female') || lower.includes('महिला')) return 'female';
    if (lower.startsWith('o') || lower === 'other') return 'other';
    return undefined;
}

export function normalizeCountryName(country: string): string {
    const c = String(country).trim().toLowerCase();
    if (!c) return '';
    if (c === 'ind' || c === 'indian' || c === 'india' || c.includes('india')) return 'India';
    if (c === 'usa' || c === 'us' || c.includes('united states')) return 'United States';
    if (c === 'uk' || c.includes('united kingdom')) return 'United Kingdom';
    return String(country)
        .trim()
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}

/** Split "HYDERABAD, TELANGANA" or "MUMBAI, INDIA" into city + country */
export function parsePlaceOfBirth(pob: string): { birth_city?: string; birth_country?: string } {
    if (!pob || isPlaceholder(pob)) return {};
    const parts = String(pob)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    if (parts.length >= 2) {
        const last = parts[parts.length - 1];
        const isLikelyCountry =
            last.length > 3 ||
            /india|indian|states|kingdom|republic/i.test(last);
        if (isLikelyCountry) {
            return {
                birth_city: parts.slice(0, -1).join(', '),
                birth_country: normalizeCountryName(last),
            };
        }
    }
    return { birth_city: String(pob).trim() };
}

function normalizeDobValue(dob: string): string {
    const raw = String(dob).trim();
    const dmy = raw.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
    if (dmy) {
        return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    }
    if (/^(19|20)\d{2}$/.test(raw)) {
        return `${raw}-01-01`;
    }
    return raw;
}

function normalizeDocTypeKey(
    docType: string,
): 'aadhaar' | 'pan' | 'passport' | 'marksheet_10' | 'marksheet_12' | 'marksheet_ug' | 'marksheet_pg' | 'generic' {
    const d = docType.toLowerCase().replace(/[_\s-]/g, '_');
    if (d.includes('aadhaar') || d.includes('aadhar') || d.includes('national_id')) return 'aadhaar';
    if (d.includes('pan') && !d.includes('company')) return 'pan';
    if (d.includes('passport')) return 'passport';
    if (d.includes('marksheet_10') || d.includes('10th') || d.includes('ssc') || d.includes('grade_10') || d.includes('grade10')) return 'marksheet_10';
    if (d.includes('marksheet_12') || d.includes('12th') || d.includes('hsc') || d.includes('intermediate') || d.includes('grade_12') || d.includes('grade12')) return 'marksheet_12';
    if (d.includes('pg_degree') || d.includes('pg_transcript') || d.includes('marksheet_pg') || d.includes('postgraduate') || d.includes('post_grad')) return 'marksheet_pg';
    if (d.includes('ug_degree') || d.includes('ug_transcript') || d.includes('marksheet_ug') || d.includes('undergraduate') || d.includes('under_grad') || d.includes('bachelor')) return 'marksheet_ug';
    return 'generic';
}

/**
 * Pull holder name from OCR text after "Name:" / "नाम" labels (vision summary or Tesseract fallback).
 */
export function extractNameFromLabeledOcrText(text: string): string | undefined {
    if (!text || isPlaceholder(text)) return undefined;
    const clean = String(text).replace(/\r/g, '\n');

    const labelPatterns = [
        new RegExp(
            `(?:^|[\\n,;])\\s*(?:name|नाम)\\s*[:：]?\\s*(${OCR_NAME_WORD}(?:\\s+${OCR_NAME_WORD}){0,7})`,
            'iu',
        ),
        new RegExp(
            `(?:name|नाम)\\s*[:：]\\s*([^\\n,;]{2,80})`,
            'iu',
        ),
    ];

    for (const re of labelPatterns) {
        const m = clean.match(re);
        if (!m?.[1]) continue;
        let candidate = m[1]
            .replace(/\s+/g, ' ')
            .replace(
                /\s+(?:dob|date\s*of\s*birth|year\s*of\s*birth|yob|gender|sex|male|female|जन्म|वर्ष|स्त्री|पुरुष).*$/iu,
                '',
            )
            .trim();
        if (candidate.length >= 2 && !isPlaceholder(candidate)) {
            const deduped = dedupeOcrFullName(candidate);
            if (deduped && !isPlaceholder(deduped)) return deduped;
        }
    }
    return undefined;
}

/**
 * Vision models return the printed person name under many keys. Prefer schema keys, then common alternates.
 * Passports often expose surname + given_names without a single full_name line.
 */
export function extractFullNameFromOcrRaw(
    raw: Record<string, any>,
    docType?: string,
): string | undefined {
    const kind = docType ? normalizeDocTypeKey(docType) : 'generic';

    const direct = pickFirst(
        raw.full_name,
        raw.fullName,
        raw.holder_name,
        raw.holderName,
        raw.cardholder_name,
        raw.cardholderName,
        raw.candidate_name,
        raw.candidateName,
        raw.student_name,
        raw.studentName,
        raw.applicant_name,
        raw.applicantName,
        raw.account_holder_name,
        raw.accountHolderName,
        raw.taxpayer_name,
        raw.taxpayerName,
        raw.person_name,
        raw.personName,
        raw.printed_name,
        raw.printedName,
        raw.name,
    );
    if (direct) {
        const cleaned = dedupeOcrFullName(String(direct));
        return cleaned || undefined;
    }

    if (kind === 'passport') {
        const sur = pickFirst(
            raw.surname,
            raw.last_name,
            raw.family_name,
            raw.lastName,
        ) as string | undefined;
        const given = pickFirst(
            raw.given_names,
            raw.given_name,
            raw.first_name,
            raw.other_names,
            raw.firstName,
        ) as string | undefined;
        if (given && sur) {
            const combined = dedupeOcrFullName(
                `${String(given).trim()} ${String(sur).trim()}`.replace(/\s+/g, ' '),
            );
            return combined || undefined;
        }
        const one = given || sur;
        if (one) {
            const cleaned = dedupeOcrFullName(String(one).trim());
            return cleaned || undefined;
        }
    }

    const rawText = pickFirst(
        raw.raw_text_summary,
        raw.rawOcrText,
        raw.raw_text,
        raw.rawText,
    ) as string | undefined;
    if (rawText) {
        const fromLabel = extractNameFromLabeledOcrText(String(rawText));
        if (fromLabel) return fromLabel;
    }

    return undefined;
}

function academicLevelFromKind(kind: string): AcademicLevel | null {
    if (kind === 'marksheet_10') return 'grade10';
    if (kind === 'marksheet_12') return 'grade12';
    if (kind === 'marksheet_ug') return 'undergrad';
    if (kind === 'marksheet_pg') return 'postgrad';
    return null;
}

export function canonicalizeOcrFields(
    raw: Record<string, any>,
    docType: string,
): Record<string, any> {
    if (!raw || typeof raw !== 'object') return {};

    const kind = normalizeDocTypeKey(docType);
    const out: Record<string, any> = {};

    const dob = pickFirst(
        raw.dob,
        raw.date_of_birth,
        raw.dateOfBirth,
        raw.birth_date,
        raw.year_of_birth,
        raw.yob,
    );
    if (dob) out.dob = normalizeDobValue(String(dob).trim());

    const gender = normalizeGender(
        pickFirst(raw.gender, raw.sex) as string | undefined,
    );
    if (gender) out.gender = gender;

    if (kind === 'aadhaar') {
        const aadhaar = pickFirst(
            raw.aadhaar_number,
            raw.aadhaarNumber,
            raw.aadhar_number,
            raw.document_number,
            raw.national_id_number,
        );
        if (aadhaar) out.aadhaar_number = String(aadhaar).replace(/\s+/g, ' ').trim();

        const vid = pickFirst(raw.vid, raw.VID);
        if (vid) out.vid = String(vid).trim();

        const address = raw.address;
        if (address && typeof address === 'object' && !Array.isArray(address)) {
            const addr: Record<string, string> = {};
            for (const [k, v] of Object.entries(address)) {
                if (v != null && String(v).trim()) addr[k] = String(v).trim();
            }
            if (Object.keys(addr).length > 0) {
                out.address = addr;
                if (addr.pincode) out.pin_code = addr.pincode;
            }
        } else {
            const addrStr = pickFirst(
                raw.address_formatted,
                typeof raw.address === 'string' ? raw.address : undefined,
                raw.permanent_address,
                raw.permanentAddress,
            );
            if (addrStr) out.address = String(addrStr).trim();
        }

        const pin = pickFirst(raw.pin_code, raw.pincode, raw.zip);
        if (pin && !out.pin_code) out.pin_code = String(pin).trim();
    } else if (kind === 'pan') {
        const pan = pickFirst(raw.pan_number, raw.panNumber, raw.document_number, raw.pan);
        if (pan) out.pan_number = String(pan).toUpperCase().trim();

        const father = pickFirst(raw.father_name, raw.fatherName, raw.guardian_name);
        if (father) out.father_name = dedupeOcrFullName(String(father));

        const country = pickFirst(raw.country, raw.nationality);
        if (country) out.country = normalizeCountryName(String(country));

        const authority = pickFirst(raw.authority, raw.issuing_authority, raw.issuingAuthority);
        if (authority) out.authority = String(authority).trim();

        const government = pickFirst(raw.government, raw.government_name);
        if (government) out.government = String(government).trim();

        for (const flag of ['signature_present', 'photo_present', 'qr_code_present'] as const) {
            if (raw[flag] === true || raw[flag] === false) out[flag] = raw[flag];
        }
    } else if (kind === 'passport') {
        const passportNum = pickFirst(
            raw.passport_number,
            raw.passportNumber,
            raw.document_number,
        );
        if (passportNum) out.passport_number = String(passportNum).trim();

        const nationality = pickFirst(raw.nationality, raw.citizenship);
        if (nationality) out.nationality = String(nationality).trim();

        const issueDate = pickFirst(raw.date_of_issue, raw.issue_date, raw.issueDate);
        if (issueDate) out.date_of_issue = normalizeDobValue(String(issueDate).trim());

        const expiry = pickFirst(raw.date_of_expiry, raw.expiry_date, raw.expiryDate);
        if (expiry) out.date_of_expiry = normalizeDobValue(String(expiry).trim());

        const issueCountry = pickFirst(
            raw.issue_country,
            raw.issueCountry,
            raw.country_of_issue,
            raw.issuing_country,
        );
        if (issueCountry) out.issue_country = normalizeCountryName(String(issueCountry));

        const poi = pickFirst(
            raw.place_of_issue,
            raw.issue_place,
            raw.issuing_authority,
        );
        if (poi) out.place_of_issue = String(poi).trim();

        const birthCity = pickFirst(raw.birth_city, raw.birthCity, raw.city_of_birth);
        if (birthCity) out.birth_city = String(birthCity).trim();

        const birthCountry = pickFirst(
            raw.birth_country,
            raw.birthCountry,
            raw.country_of_birth,
        );
        if (birthCountry) {
            out.birth_country = normalizeCountryName(String(birthCountry));
        }

        const pob = pickFirst(raw.place_of_birth, raw.birth_place, raw.placeOfBirth);
        if (pob) {
            out.place_of_birth = String(pob).trim();
            if (!out.birth_city || !out.birth_country) {
                const parsed = parsePlaceOfBirth(out.place_of_birth);
                if (parsed.birth_city && !out.birth_city) out.birth_city = parsed.birth_city;
                if (parsed.birth_country && !out.birth_country) out.birth_country = parsed.birth_country;
            }
        }

        if (!out.birth_country && out.nationality) {
            const nat = String(out.nationality).toLowerCase();
            if (nat.includes('indian') || nat === 'ind') out.birth_country = 'India';
        }
        if (!out.issue_country && out.nationality) {
            const nat = String(out.nationality).toLowerCase();
            if (nat.includes('indian') || nat === 'ind') out.issue_country = 'India';
        }

        const addr = raw.address ?? raw.residential_address ?? raw.address_formatted;
        if (addr) out.address = typeof addr === 'object' ? addr : String(addr).trim();
    } else if (kind === 'marksheet_10' || kind === 'marksheet_12' || kind === 'marksheet_ug' || kind === 'marksheet_pg') {
        const level = academicLevelFromKind(kind)!;
        Object.assign(out, canonicalizeAcademicFields(raw, level));
    } else {
        // Generic: pass through non-duplicate scalar fields only
        const skip = new Set([
            'date_of_birth',
            'dateOfBirth',
            'document_number',
            'fullName',
            'name',
            'address_formatted',
            'expiry_date',
            'panNumber',
            'aadhaarNumber',
        ]);
        for (const [k, v] of Object.entries(raw)) {
            if (skip.has(k) || out[k] !== undefined) continue;
            if (v != null && !isPlaceholder(v)) out[k] = v;
        }
    }

    const resolvedName = extractFullNameFromOcrRaw(raw, docType);
    if (resolvedName) out.full_name = resolvedName;

    return out;
}

/** Mask sensitive ID numbers for database persistence only. */
export function maskSensitiveIds(
    data: Record<string, any>,
    docType: string,
): Record<string, any> {
    const masked = { ...data };
    const kind = normalizeDocTypeKey(docType);

    if (kind === 'aadhaar' && masked.aadhaar_number) {
        const clean = String(masked.aadhaar_number).replace(/\D/g, '');
        if (clean.length === 12) {
            masked.aadhaar_number = `XXXX XXXX ${clean.slice(-4)}`;
        }
    } else if (kind === 'pan' && masked.pan_number) {
        const clean = String(masked.pan_number).trim().toUpperCase();
        if (clean.length === 10) {
            masked.pan_number = `${clean.slice(0, 3)}XX${clean.slice(5, 9)}X`;
        }
    } else if (kind === 'passport' && masked.passport_number) {
        const clean = String(masked.passport_number).trim();
        if (clean.length >= 2) {
            masked.passport_number = `${clean[0]}${'X'.repeat(Math.max(clean.length - 2, 5))}${clean.slice(-1)}`;
        }
    }

    return masked;
}
