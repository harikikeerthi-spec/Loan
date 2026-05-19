/**
 * Helpers for canonicalizing academic certificate / marksheet OCR output.
 */

import { dedupeOcrFullName } from './ocr-fields.util';

const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
    'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
    'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir',
    'Jammu and Kashmir', 'Puducherry', 'Chandigarh', 'Ladakh',
];

export type AcademicLevel = 'grade10' | 'grade12' | 'undergrad' | 'postgrad';

export function inferStateFromText(...parts: (string | undefined)[]): string | undefined {
    const combined = parts.filter(Boolean).join(' ').toLowerCase();
    if (!combined) return undefined;
    for (const state of INDIAN_STATES) {
        if (combined.includes(state.toLowerCase())) return state;
    }
    if (/\bandhra\s+pradesh\b/i.test(combined)) return 'Andhra Pradesh';
    if (/\btelangana\b/i.test(combined)) return 'Telangana';
    if (/\btamil\s+nadu\b/i.test(combined)) return 'Tamil Nadu';
    if (/\buttar\s+pradesh\b/i.test(combined)) return 'Uttar Pradesh';
    if (/\bwest\s+bengal\b/i.test(combined)) return 'West Bengal';
    return undefined;
}

export function inferCityFromInstitution(institution?: string): string | undefined {
    if (!institution) return undefined;
    const text = String(institution).trim();
    const beforeDistrict = text.split(/,|\s+GUNTUR|\s+DISTRICT/i)[0];
    const parts = beforeDistrict.split(',').map((p) => p.trim()).filter(Boolean);
    const lastPart = parts[parts.length - 1] || beforeDistrict;
    const cityMatch = lastPart.match(
        /\b(REPALLE|GUNTUR|HYDERABAD|VIJAYAWADA|VISAKHAPATNAM|CHENNAI|MUMBAI|DELHI|BENGALURU|BANGALORE|PUNE|JAIPUR|LUCKNOW|KOLKATA|NAGPUR|INDORE|BHOPAL|COIMBATORE|MADURAI|SALEM|TRICHY|TIRUCHIRAPPALLI|KOCHI|THIRUVANANTHAPURAM|TRIVANDRUM|HUBLI|MYSORE|MYSURU|SURAT|AHMEDABAD|VADODARA|RAJKOT|NASHIK|AURANGABAD|MEERUT|AGRA|VARANASI|KANPUR|NOIDA|GHAZIABAD|FARIDABAD|GURGAON|GURUGRAM|CHANDIGARH|LUDHIANA|AMRITSAR|PATNA|RANCHI|RAIPUR|BHUBANESWAR|CUTTACK|GUWAHATI)\b/i,
    );
    if (cityMatch) {
        const c = cityMatch[1];
        return c.charAt(0).toUpperCase() + c.slice(1).toLowerCase();
    }
    return undefined;
}

export function parseExamYear(examPeriod?: string): string | undefined {
    if (!examPeriod) return undefined;
    const match = String(examPeriod).match(/\b(19|20)\d{2}\b/);
    return match ? match[0] : undefined;
}

/** End date as YYYY-MM-DD from exam month/year (e.g. MARCH 2016 → 2016-03-31) */
export function examYearToEndDate(examPeriod?: string): string | undefined {
    const year = parseExamYear(examPeriod);
    if (!year) return undefined;
    const lower = String(examPeriod).toLowerCase();
    const monthMap: Record<string, string> = {
        january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
        july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
        jan: '01', feb: '02', mar: '03', apr: '04', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };
    for (const [name, mm] of Object.entries(monthMap)) {
        if (lower.includes(name)) {
            const lastDay = mm === '02' ? '28' : ['04', '06', '09', '11'].includes(mm) ? '30' : '31';
            return `${year}-${mm}-${lastDay}`;
        }
    }
    return `${year}-05-31`;
}

/** Typical start: 2 years before end for 10th/12th, 3–4 years for degree */
export function inferStartDate(endDate: string, yearsBack = 2): string | undefined {
    const m = endDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return undefined;
    const y = parseInt(m[1], 10) - yearsBack;
    return `${y}-06-01`;
}

export function normalizeGradingSystem(
    grading?: string,
    score?: string | number,
): 'CGPA' | 'Percentage' | '' {
    const g = String(grading || '').toLowerCase();
    if (g.includes('cgpa') || g.includes('gpa') || g.includes('grade point')) return 'CGPA';
    if (g.includes('percent') || g.includes('%')) return 'Percentage';
    const s = String(score ?? '');
    if (/^\d(\.\d)?$/.test(s.trim()) && parseFloat(s) <= 10) return 'CGPA';
    if (parseFloat(s) > 10 && parseFloat(s) <= 100) return 'Percentage';
    return '';
}

export function normalizeAcademicScore(score?: string | number, grading?: string): string {
    if (score == null || score === '') return '';
    const s = String(score).trim();
    const num = parseFloat(s.replace(/[^\d.]/g, ''));
    if (isNaN(num)) return s;
    const sys = normalizeGradingSystem(grading, num);
    if (sys === 'CGPA') return num <= 10 ? String(num) : String(num);
    if (sys === 'Percentage') return num <= 100 ? String(Math.round(num * 10) / 10) : s;
    return s;
}

/** Compute percentage from total marks if max is known or infer ~1000 for AP intermediate */
export function percentageFromTotalMarks(
    secured?: string | number,
    maximum?: string | number,
): string | undefined {
    const sec = parseFloat(String(secured ?? '').replace(/[^\d.]/g, ''));
    const max = parseFloat(String(maximum ?? '').replace(/[^\d.]/g, ''));
    if (!isNaN(sec) && !isNaN(max) && max > 0) {
        return String(Math.round((sec / max) * 1000) / 10);
    }
    if (!isNaN(sec) && sec > 100 && sec < 1200) {
        const inferredMax = 1000;
        return String(Math.round((sec / inferredMax) * 1000) / 10);
    }
    return undefined;
}

/** Normalize OCR dates (DD/MM/YYYY, DD.MM.YYYY) to YYYY-MM-DD */
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
    raw: Record<string, any>,
    level: AcademicLevel,
): Record<string, any> {
    const out: Record<string, any> = {};

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
        inferCityFromInstitution(institution);
    if (city) out.city = String(city).trim();

    const state =
        raw.state ||
        raw.state_of_study ||
        inferStateFromText(board, institution, raw.country);
    if (state) out.state = state;

    const country = raw.country || raw.country_of_study || (state ? 'India' : undefined);
    if (country) out.country = String(country).trim();

    const language = raw.medium_of_instruction || raw.language || raw.medium;
    if (language) out.language = String(language).trim();

    const examPeriod =
        raw.examination_month_year ||
        raw.exam_month_year ||
        raw.exam_period ||
        raw.year_of_passing ||
        raw.passing_year;
    if (examPeriod) out.exam_period = String(examPeriod).trim();

    const marksSecured = raw.total_marks_secured ?? raw.total_marks;
    const marksMaximum = raw.total_marks_maximum;
    const hasGpa = raw.overall_gpa != null || raw.gpa != null || raw.cgpa != null;

    let score: string | number | undefined =
        raw.percentage ||
        raw.overall_percentage ||
        percentageFromTotalMarks(marksSecured, marksMaximum);

    if (!score && hasGpa) {
        score = raw.overall_gpa ?? raw.gpa ?? raw.cgpa;
    }
    if (!score) {
        score = raw.score;
    }

    let grading = normalizeGradingSystem(
        raw.grading_system || raw.grading,
        score,
    );

    if (level === 'grade10' || level === 'grade12') {
        let converted = false;

        if (marksSecured != null && marksSecured !== '') {
            const pctFromMarks = percentageFromTotalMarks(marksSecured, marksMaximum);
            if (pctFromMarks) {
                score = pctFromMarks;
                grading = 'Percentage';
                converted = true;
            }
        }

        if (!converted && hasGpa) {
            score = raw.overall_gpa ?? raw.gpa ?? raw.cgpa;
            grading = 'CGPA';
        } else if (!converted && score) {
            const scoreNum = parseFloat(String(score).replace(/[^\d.]/g, ''));
            if (!isNaN(scoreNum) && scoreNum > 10 && scoreNum <= 100) {
                grading = 'Percentage';
            }
        }
    }

    if (grading) out.grading = grading;
    if (score != null && score !== '') out.score = normalizeAcademicScore(score, grading);

    const endFromExam = examYearToEndDate(examPeriod);
    const endFromIssue = formatAcademicDate(raw.end_date || raw.date_of_issue);
    const endDate = endFromExam || endFromIssue;
    if (endDate) out.end_date = endDate;

    const startDate =
        raw.start_date
            ? formatAcademicDate(raw.start_date)
            : endDate
                ? inferStartDate(endDate, yearsBackForLevel(level))
                : undefined;
    if (startDate) out.start_date = startDate;

    const rollNumber =
        raw.roll_number || raw.registration_number || raw.registered_number;
    if (rollNumber) out.roll_number = String(rollNumber).trim();

    if (raw.father_name) out.father_name = String(raw.father_name).trim();
    if (raw.dob || raw.date_of_birth) out.dob = String(raw.dob || raw.date_of_birth).trim();

    return out;
}
