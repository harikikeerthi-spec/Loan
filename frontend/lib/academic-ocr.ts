/**
 * Client-side academic OCR field normalization (mirrors server academic-ocr.util.ts).
 */

import { dedupeOcrFullName } from './ocr-fields';

const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
    'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
    'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir',
    'Puducherry', 'Chandigarh', 'Ladakh',
];

const BOARD_TO_STATE_MAP: Record<string, string> = {
    'board of secondary education andhra pradesh': 'Andhra Pradesh',
    'board of intermediate education andhra pradesh': 'Andhra Pradesh',
    'bseap': 'Andhra Pradesh',
    'bieap': 'Andhra Pradesh',
    'board of secondary education telangana': 'Telangana',
    'board of intermediate education telangana': 'Telangana',
    'bset': 'Telangana',
    'maharashtra state board': 'Maharashtra',
    'karnataka secondary education': 'Karnataka',
    'board of secondary education rajasthan': 'Rajasthan',
    'up board': 'Uttar Pradesh',
    'uttar pradesh board': 'Uttar Pradesh',
    'madhyamik shiksha parishad': 'Uttar Pradesh',
    'west bengal board': 'West Bengal',
    'bihar school examination board': 'Bihar',
    'gujarat secondary': 'Gujarat',
    'punjab school education board': 'Punjab',
    'haryana board': 'Haryana',
};

export function normalizeStateName(stateStr?: string): string {
    if (!stateStr) return '';
    const clean = String(stateStr).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Check for common abbreviations
    if (clean === 'ap' || clean === 'andhra') return 'Andhra Pradesh';
    if (clean === 'ts' || clean === 'tel') return 'Telangana';
    if (clean === 'mh' || clean === 'maha') return 'Maharashtra';
    if (clean === 'up') return 'Uttar Pradesh';
    if (clean === 'mp') return 'Madhya Pradesh';
    if (clean === 'dl') return 'Delhi';
    if (clean === 'wb') return 'West Bengal';
    if (clean === 'tn') return 'Tamil Nadu';
    if (clean === 'ka') return 'Karnataka';
    if (clean === 'kl') return 'Kerala';
    if (clean === 'gj') return 'Gujarat';
    if (clean === 'hr') return 'Haryana';
    if (clean === 'pb') return 'Punjab';
    if (clean === 'rj') return 'Rajasthan';
    if (clean === 'or' || clean === 'od') return 'Odisha';
    
    // Find closest match in INDIAN_STATES
    for (const s of INDIAN_STATES) {
        const sClean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (clean.includes(sClean) || sClean.includes(clean)) {
            return s;
        }
    }
    
    // Fallback: title case the original string
    return String(stateStr)
        .trim()
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}

export type AcademicLevel = 'grade10' | 'grade12' | 'undergrad' | 'postgrad';

function inferStateFromText(...parts: (string | undefined)[]): string | undefined {
    const combined = parts.filter(Boolean).join(' ').toLowerCase();
    for (const state of INDIAN_STATES) {
        if (combined.includes(state.toLowerCase())) return state;
    }
    if (/\bandhra\s+pradesh\b/i.test(combined)) return 'Andhra Pradesh';
    return undefined;
}

function inferCityFromInstitution(institution?: string): string | undefined {
    if (!institution) return undefined;
    const cityMatch = String(institution).match(
        /\b(REPALLE|GUNTUR|HYDERABAD|VIJAYAWADA|VISAKHAPATNAM|CHENNAI|MUMBAI|DELHI|BENGALURU|BANGALORE|PUNE|JAIPUR|LUCKNOW|KOLKATA|NAGPUR|INDORE|BHOPAL|COIMBATORE)\b/i,
    );
    if (cityMatch) return cityMatch[1].charAt(0).toUpperCase() + cityMatch[1].slice(1).toLowerCase();
    return undefined;
}

function parseExamYear(examPeriod?: string): string | undefined {
    if (!examPeriod) return undefined;
    const match = String(examPeriod).match(/\b(19|20)\d{2}\b/);
    return match ? match[0] : undefined;
}

export function examYearToEndDate(examPeriod?: string): string | undefined {
    const year = parseExamYear(examPeriod);
    if (!year) return undefined;
    const lower = String(examPeriod).toLowerCase();
    if (lower.includes('march') || lower.includes('mar')) return `${year}-03-31`;
    if (lower.includes('may')) return `${year}-05-31`;
    return `${year}-05-31`;
}

export function inferStartDate(endDate: string, yearsBack = 2): string | undefined {
    const m = endDate.match(/^(\d{4})-/);
    if (!m) return undefined;
    return `${parseInt(m[1], 10) - yearsBack}-06-01`;
}

export function normalizeGradingSystem(grading?: string, score?: string | number): string {
    const g = String(grading || '').toLowerCase();
    if (g.includes('cgpa') || g.includes('gpa')) return 'CGPA';
    if (g.includes('percent') || g.includes('%')) return 'Percentage';
    const s = String(score ?? '');
    if (/^\d(\.\d)?$/.test(s.trim()) && parseFloat(s) <= 10) return 'CGPA';
    if (parseFloat(s) > 10 && parseFloat(s) <= 100) return 'Percentage';
    return '';
}

function percentageFromTotalMarks(secured?: string | number, maximum?: string | number): string | undefined {
    const sec = parseFloat(String(secured ?? '').replace(/[^\d.]/g, ''));
    const max = parseFloat(String(maximum ?? '').replace(/[^\d.]/g, ''));
    if (!isNaN(sec) && !isNaN(max) && max > 0) {
        return String(Math.round((sec / max) * 1000) / 10);
    }
    if (!isNaN(sec) && sec > 100 && sec < 1200) {
        return String(Math.round((sec / 1000) * 1000) / 10);
    }
    return undefined;
}

/** Normalize OCR dates (DD/MM/YYYY, DD.MM.YYYY) to YYYY-MM-DD for form inputs */
export function formatAcademicDate(dateStr?: string): string | undefined {
    if (!dateStr) return undefined;
    const raw = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const dmy = raw.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
    if (dmy) {
        return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    }
    return raw;
}

function titleCaseDistrict(value: string): string {
    const t = value.trim();
    if (!t) return t;
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

function yearsBackForLevel(level: AcademicLevel): number {
    if (level === 'grade10') return 1;
    if (level === 'grade12') return 2;
    if (level === 'undergrad' || level === 'postgrad') return 3;
    return 2;
}

export function canonicalizeAcademicFields(
    raw: Record<string, unknown>,
    level: AcademicLevel,
): Record<string, unknown> {
    const out: Record<string, unknown> = {};

    const fullName =
        raw.full_name ||
        raw.fullName ||
        raw.candidate_name ||
        raw.candidateName ||
        raw.student_name ||
        raw.name;
    if (fullName) {
        const cleaned = dedupeOcrFullName(String(fullName));
        if (cleaned) out.full_name = cleaned;
    }

    const board = raw.board_name || raw.board || raw.examining_body;
    if (board) out.board = String(board).trim();

    const institution =
        raw.institution_name ||
        raw.institution ||
        raw.school_name ||
        raw.college_name;
    if (institution) out.institution = String(institution).trim();

    const university =
        raw.university_name ||
        raw.university ||
        (level !== 'grade10' && level !== 'grade12' ? institution : undefined);
    if (university) out.university = String(university).trim();

    const qualification = raw.qualification || raw.degree || raw.program_name || raw.course_name;
    if (qualification) out.qualification = String(qualification).trim();

    const districtCity = raw.district ? titleCaseDistrict(String(raw.district)) : undefined;
    const city =
        raw.city ||
        raw.city_of_study ||
        districtCity ||
        inferCityFromInstitution(institution as string);
    if (city) out.city = String(city).trim();

    const state =
        raw.state ||
        raw.state_of_study ||
        inferStateFromText(board as string, institution as string, raw.country as string);
    if (state) out.state = normalizeStateName(state as string);

    // Auto-fill state based on Board of Secondary Education mapping
    if (out.board) {
        const cleanBoard = String(out.board).toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
        for (const [key, stateName] of Object.entries(BOARD_TO_STATE_MAP)) {
            if (cleanBoard.includes(key) || key.includes(cleanBoard)) {
                out.state = stateName;
                break;
            }
        }
    }

    // High-precision school and city extraction from marksheet text
    const rawText = raw.raw_text_summary || raw.rawOcrText || raw.raw_text || raw.rawText || '';
    if (rawText) {
        const belongingMatch = String(rawText).match(/belonging\s+to\s+([^,.\n]+),\s*([^,.\n]+)(?:,\s*([^,.\n]+))?/i);
        if (belongingMatch) {
            const extractedSchool = belongingMatch[1].trim();
            const extractedCity = belongingMatch[2].trim();
            
            if (extractedSchool && !extractedSchool.toLowerCase().includes('roll')) {
                out.institution = extractedSchool;
                if (level !== 'grade10' && level !== 'grade12') {
                    out.university = extractedSchool;
                }
            }
            if (extractedCity) {
                out.city = extractedCity;
            }
        }
    }

    const country = raw.country || raw.country_of_study || (out.state ? 'India' : undefined);
    if (country) out.country = String(country).trim();

    const language = raw.medium_of_instruction || raw.language || raw.medium;
    if (language) out.language = String(language).trim();

    const examPeriod =
        raw.examination_month_year ||
        raw.exam_month_year ||
        raw.exam_period ||
        raw.year_of_passing;
    if (examPeriod) out.exam_period = String(examPeriod).trim();

    const marksSecured = raw.total_marks_secured ?? raw.total_marks;
    const marksMaximum = raw.total_marks_maximum;
    const hasGpa = raw.overall_gpa != null || raw.gpa != null || raw.cgpa != null;

    let score: unknown =
        raw.percentage ||
        raw.overall_percentage ||
        percentageFromTotalMarks(marksSecured as string | number, marksMaximum as string | number);

    if (!score && hasGpa) {
        score = raw.overall_gpa ?? raw.gpa ?? raw.cgpa;
    }
    if (!score) {
        score = raw.score;
    }

    let grading = normalizeGradingSystem(
        String(raw.grading_system || raw.grading || ''),
        score as string | number,
    );

    let converted = false;
    if (marksSecured != null && marksSecured !== '') {
        const pctFromMarks = percentageFromTotalMarks(
            marksSecured as string | number,
            marksMaximum as string | number,
        );
        if (pctFromMarks) {
            score = pctFromMarks;
            grading = 'Percentage';
            converted = true;
        }
    }

    // Convert CGPA/GPA to Percentage!
    if (!converted && (hasGpa || grading === 'CGPA')) {
        const gpaVal = raw.overall_gpa ?? raw.gpa ?? raw.cgpa ?? score;
        const parsedGpa = parseFloat(String(gpaVal).replace(/[^\d.]/g, ''));
        if (!isNaN(parsedGpa) && parsedGpa <= 10 && parsedGpa > 0) {
            score = String(Math.round(parsedGpa * 9.5 * 10) / 10);
            grading = 'Percentage';
            converted = true;
        }
    }

    if (!converted && score) {
        const scoreNum = parseFloat(String(score).replace(/[^\d.]/g, ''));
        if (!isNaN(scoreNum) && scoreNum > 10 && scoreNum <= 100) {
            grading = 'Percentage';
        }
    }

    if (grading) out.grading = grading;
    if (score != null && score !== '') out.score = String(score).trim();

    const endFromExam = examYearToEndDate(examPeriod as string);
    const endFromIssue = formatAcademicDate(String(raw.end_date || raw.date_of_issue || ''));
    const endDate = endFromExam || endFromIssue;
    if (endDate) out.end_date = endDate;

    const startDate =
        raw.start_date
            ? formatAcademicDate(String(raw.start_date))
            : endDate
                ? inferStartDate(endDate, yearsBackForLevel(level))
                : undefined;
    if (startDate) out.start_date = startDate;

    if (raw.father_name) out.father_name = String(raw.father_name).trim();
    if (raw.dob || raw.date_of_birth) out.dob = String(raw.dob || raw.date_of_birth).trim();

    const rollNumber = raw.roll_number || raw.registration_number || raw.registered_number;
    if (rollNumber) out.roll_number = String(rollNumber).trim();

    const certificateNumber = raw.certificate_number || raw.certificate_no || raw.serial_number;
    if (certificateNumber) out.certificate_number = String(certificateNumber).trim();

    const barcodeNumber = raw.barcode_number || raw.barcode || raw.bar_code;
    if (barcodeNumber) out.barcode_number = String(barcodeNumber).trim();

    return out;
}

export function academicLevelFromDocType(docType: string): AcademicLevel | null {
    const d = docType.toLowerCase().replace(/[_\s-]/g, '_');
    if (
        d.includes('marksheet_10') ||
        d.includes('10th') ||
        d.includes('ssc') ||
        d.includes('secondary_school') ||
        d.includes('grade_10') ||
        d.includes('grade10')
    ) {
        return 'grade10';
    }
    if (
        d.includes('marksheet_12') ||
        d.includes('12th') ||
        d.includes('hsc') ||
        d.includes('intermediate') ||
        d.includes('grade_12') ||
        d.includes('grade12')
    ) {
        return 'grade12';
    }
    if (d.includes('pg_degree') || d.includes('pg_transcript') || d.includes('marksheet_pg') || d.includes('postgraduate')) return 'postgrad';
    if (d.includes('ug_degree') || d.includes('ug_transcript') || d.includes('marksheet_ug') || d.includes('undergraduate') || d.includes('bachelor')) return 'undergrad';
    return null;
}
