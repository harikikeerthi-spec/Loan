/**
 * Client-side OCR field cleanup (matches server canonicalizeOcrFields).
 */

import { academicLevelFromDocType, canonicalizeAcademicFields } from './academic-ocr';

const PLACEHOLDERS = new Set([
    'resident name',
    'pan holder',
    'passport holder',
    'unknown',
    'n/a',
]);

function isPlaceholder(v: unknown): boolean {
    if (v == null) return true;
    return PLACEHOLDERS.has(String(v).trim().toLowerCase());
}

function pick(...values: (string | undefined | null)[]): string | undefined {
    for (const v of values) {
        if (v != null && String(v).trim() && !isPlaceholder(v)) return String(v).trim();
    }
    return undefined;
}

/** Match server `dedupeOcrFullName` — collapse repeated name phrases from vision OCR. */
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
        if (ok) return words.slice(0, p).join(' ');
    }
    return s;
}

const NAME_PLACEHOLDERS = new Set([
    ...PLACEHOLDERS,
    'not visible',
    'not available',
]);

function isNamePlaceholder(v: unknown): boolean {
    if (v == null) return true;
    return NAME_PLACEHOLDERS.has(String(v).trim().toLowerCase());
}

function pickName(...values: (string | undefined | null)[]): string | undefined {
    for (const v of values) {
        if (v != null && String(v).trim() && !isNamePlaceholder(v)) return String(v).trim();
    }
    return undefined;
}

/** Extract name after Name:/नाम label from OCR raw text (matches server). */
export function extractNameFromLabeledOcrText(text: string): string | undefined {
    if (!text || isNamePlaceholder(text)) return undefined;
    const clean = String(text).replace(/\r/g, '\n');
    const patterns = [
        /(?:^|[\n,;])\s*(?:name|नाम)\s*[:：]?\s*([\p{L}\p{M}][\p{L}\p{M}'\-.]*(?:\s+[\p{L}\p{M}][\p{L}\p{M}'\-.]*){0,7})/iu,
        /(?:name|नाम)\s*[:：]\s*([^\n,;]{2,80})/iu,
    ];
    for (const re of patterns) {
        const m = clean.match(re);
        if (!m?.[1]) continue;
        let candidate = m[1]
            .replace(/\s+/g, ' ')
            .replace(
                /\s+(?:dob|date\s*of\s*birth|year\s*of\s*birth|yob|gender|sex|male|female|जन्म|वर्ष).*$/iu,
                '',
            )
            .trim();
        if (candidate.length >= 2 && !isNamePlaceholder(candidate)) {
            const deduped = dedupeOcrFullName(candidate);
            if (deduped && !isNamePlaceholder(deduped)) return deduped;
        }
    }
    return undefined;
}

/**
 * Map vision JSON person-name fields to one full_name (matches server extractFullNameFromOcrRaw).
 */
export function extractFullNameFromOcrRaw(
    raw: Record<string, unknown>,
    docType: string,
): string | undefined {
    const d = docType.toLowerCase();
    const isPassport = d.includes('passport');

    // For passports, prioritize structured given names and surname first to prevent garbled splitting
    if (isPassport) {
        const sur = pickName(
            raw.surname as string,
            raw.last_name as string,
            raw.family_name as string,
            raw.lastName as string,
        );
        const given = pickName(
            raw.given_names as string,
            raw.given_name as string,
            raw.first_name as string,
            raw.other_names as string,
            raw.firstName as string,
        );
        if (given && sur) {
            const combined = dedupeOcrFullName(`${given} ${sur}`.replace(/\s+/g, ' '));
            return combined || undefined;
        }
    }

    const direct = pickName(
        raw.full_name as string,
        raw.fullName as string,
        raw.holder_name as string,
        raw.holderName as string,
        raw.cardholder_name as string,
        raw.cardholderName as string,
        raw.candidate_name as string,
        raw.candidateName as string,
        raw.student_name as string,
        raw.studentName as string,
        raw.applicant_name as string,
        raw.applicantName as string,
        raw.account_holder_name as string,
        raw.accountHolderName as string,
        raw.taxpayer_name as string,
        raw.taxpayerName as string,
        raw.person_name as string,
        raw.personName as string,
        raw.printed_name as string,
        raw.printedName as string,
        raw.name as string,
    );
    if (direct) {
        const cleaned = dedupeOcrFullName(direct);
        return cleaned || undefined;
    }

    if (isPassport) {
        const sur = pickName(
            raw.surname as string,
            raw.last_name as string,
            raw.family_name as string,
            raw.lastName as string,
        );
        const given = pickName(
            raw.given_names as string,
            raw.given_name as string,
            raw.first_name as string,
            raw.other_names as string,
            raw.firstName as string,
        );
        const one = given || sur;
        if (one) {
            const cleaned = dedupeOcrFullName(one);
            return cleaned || undefined;
        }
    }

    const rawText = pickName(
        raw.raw_text_summary as string,
        raw.rawOcrText as string,
        raw.raw_text as string,
    );
    if (rawText) {
        const fromLabel = extractNameFromLabeledOcrText(rawText);
        if (fromLabel) return fromLabel;
    }

    return undefined;
}

/** Match gender <select> values: male | female | other */
export function normalizeGenderForForm(g?: unknown): string {
    if (g == null || g === '') return '';
    const s = String(g).trim().toLowerCase();
    if (s === 'm' || s.startsWith('m') || s.includes('male') || s.includes('पुरुष')) return 'male';
    if (s === 'f' || s.startsWith('f') || s.includes('female') || s.includes('महिला') || s.includes('स्त्री')) return 'female';
    if (s.startsWith('o') || s === 'other' || s.includes('trans')) return 'other';
    return '';
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

export function parsePlaceOfBirth(pob: string): { birth_city?: string; birth_country?: string } {
    if (!pob || isPlaceholder(pob)) return {};
    const parts = String(pob)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    if (parts.length >= 2) {
        const last = parts[parts.length - 1];
        const isLikelyCountry =
            last.length > 3 || /india|indian|states|kingdom|republic/i.test(last);
        if (isLikelyCountry) {
            return {
                birth_city: parts.slice(0, -1).join(', '),
                birth_country: normalizeCountryName(last),
            };
        }
    }
    return { birth_city: String(pob).trim() };
}

/** Convert OCR date strings to YYYY-MM-DD for <input type="date"> */
export function parseOcrDateForInput(dateStr: string): string {
    if (!dateStr) return '';
    const raw = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

    const dmy = raw.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
    if (dmy) {
        return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    }

    const ymd = raw.match(/(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
    if (ymd) {
        return `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;
    }

    const yearOnly = raw.match(/^(?:yob|year\s*of\s*birth|birth\s*year)?\s*:?\s*((?:19|20)\d{2})$/i)
        || raw.match(/^((?:19|20)\d{2})$/);
    if (yearOnly) {
        return `${yearOnly[1]}-01-01`;
    }

    try {
        const clean = raw.replace(/[^\d\/\-\.]/g, '').trim();
        const parts = clean.split(/[\/\-\.]/);
        if (parts.length === 3) {
            if (parts[0].length === 4) {
                return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            }
            if (parts[2].length === 4) {
                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }
        const d = new Date(raw);
        if (!isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
        }
    } catch {
        /* ignore */
    }
    return '';
}

export function normalizeOcrFieldsForAutofill(
    raw: Record<string, unknown>,
    docType: string,
): Record<string, unknown> {
    if (!raw || typeof raw !== 'object') return {};

    const d = docType.toLowerCase();
    const isAadhaar = d.includes('aadhaar') || d.includes('aadhar') || d.includes('national_id');
    const out: Record<string, unknown> = {};

    const resolvedName = isAadhaar ? undefined : extractFullNameFromOcrRaw(
        {
            ...raw,
            raw_text_summary: raw.raw_text_summary ?? raw.rawOcrText ?? raw.raw_text,
        },
        docType,
    );

    if (!isAadhaar) {
        if (resolvedName) out.full_name = resolvedName;

        const dobRaw = pick(
            raw.dob as string,
            raw.date_of_birth as string,
            raw.dateOfBirth as string,
            raw.birth_date as string,
            raw.year_of_birth as string,
            raw.yob as string,
        );
        if (dobRaw) {
            const parsed = parseOcrDateForInput(dobRaw);
            out.dob = parsed || dobRaw;
        }

        const gender = normalizeGenderForForm(
            pick(raw.gender as string, raw.sex as string),
        );
        if (gender) out.gender = gender;
    }

    if (isAadhaar) {
        const aadhaar = pick(
            raw.aadhaar_number as string,
            raw.aadhaarNumber as string,
            raw.aadhar_number as string,
            raw.aadharNumber as string,
            raw.national_id as string,
            raw.nationalId as string,
            raw.national_id_number as string,
            raw.document_number as string,
            raw.aadhaar as string,
            raw.aadhar as string,
        );
        if (aadhaar) out.aadhaar_number = aadhaar;
    } else if (d.includes('pan')) {
        const pan = pick(raw.pan_number as string, raw.panNumber as string, raw.document_number as string);
        if (pan) out.pan_number = pan.toUpperCase();
        const father = pick(raw.father_name as string, raw.fatherName as string);
        if (father) out.father_name = dedupeOcrFullName(father);

        const country = pick(raw.country as string, raw.nationality as string);
        if (country) out.country = normalizeCountryName(country);

        const authority = pick(raw.authority as string, raw.issuing_authority as string);
        if (authority) out.authority = authority;

        const government = pick(raw.government as string);
        if (government) out.government = government;

        for (const flag of ['signature_present', 'photo_present', 'qr_code_present'] as const) {
            if (raw[flag] === true || raw[flag] === false) out[flag] = raw[flag];
        }
    } else if (d.includes('passport')) {
        const passport = pick(
            raw.passport_number as string,
            raw.passportNumber as string,
            raw.document_number as string,
        );
        if (passport) out.passport_number = passport;

        const given = pick(
            raw.given_names as string,
            raw.given_name as string,
            raw.first_name as string,
            raw.firstName as string,
        );
        if (given) out.given_names = given;

        const sur = pick(
            raw.surname as string,
            raw.last_name as string,
            raw.lastName as string,
        );
        if (sur) out.surname = sur;

        const nat = pick(raw.nationality as string, raw.citizenship as string);
        if (nat) out.nationality = nat;

        const issue = pick(raw.date_of_issue as string, raw.issue_date as string, raw.issueDate as string);
        if (issue) {
            const parsed = parseOcrDateForInput(issue);
            out.date_of_issue = parsed || issue;
        }

        const expiry = pick(raw.date_of_expiry as string, raw.expiry_date as string, raw.expiryDate as string);
        if (expiry) {
            const parsed = parseOcrDateForInput(expiry);
            out.date_of_expiry = parsed || expiry;
        }

        const issueCountry = pick(
            raw.issue_country as string,
            raw.issueCountry as string,
            raw.country_of_issue as string,
        );
        if (issueCountry) out.issue_country = normalizeCountryName(issueCountry);

        const poi = pick(raw.place_of_issue as string, raw.issue_place as string, raw.issuing_authority as string);
        if (poi) out.place_of_issue = poi;

        const birthCity = pick(raw.birth_city as string, raw.birthCity as string, raw.city_of_birth as string);
        if (birthCity) out.birth_city = birthCity;

        const birthCountry = pick(
            raw.birth_country as string,
            raw.birthCountry as string,
            raw.country_of_birth as string,
        );
        if (birthCountry) out.birth_country = normalizeCountryName(birthCountry);

        const pob = pick(raw.place_of_birth as string, raw.birth_place as string);
        if (pob) {
            out.place_of_birth = pob;
            if (!out.birth_city || !out.birth_country) {
                const parsed = parsePlaceOfBirth(pob);
                if (parsed.birth_city && !out.birth_city) out.birth_city = parsed.birth_city;
                if (parsed.birth_country && !out.birth_country) out.birth_country = parsed.birth_country;
            }
        }

        if (!out.birth_country && nat) {
            const n = String(nat).toLowerCase();
            if (n.includes('indian') || n === 'ind') out.birth_country = 'India';
        }
        if (!out.issue_country && nat) {
            const n = String(nat).toLowerCase();
            if (n.includes('indian') || n === 'ind') out.issue_country = 'India';
        }

        const dobRaw = pick(raw.dob as string, raw.date_of_birth as string);
        if (dobRaw) {
            const parsed = parseOcrDateForInput(dobRaw);
            out.dob = parsed || dobRaw;
        }

        const gender = normalizeGenderForForm(pick(raw.gender as string, raw.sex as string));
        if (gender) out.gender = gender;

        const addr = raw.address ?? raw.residential_address ?? raw.address_formatted;
        if (addr) out.address = addr;
    } else {
        const academicLevel = academicLevelFromDocType(docType);
        if (academicLevel) {
            const academic = canonicalizeAcademicFields(raw, academicLevel) as Record<string, unknown>;
            if (resolvedName) academic.full_name = resolvedName;
            return academic;
        }
        return { ...raw };
    }

    return out;
}
