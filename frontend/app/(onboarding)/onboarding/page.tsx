

"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import UniversityCard from "@/components/UniversityCard";
import { aiApi } from '@/lib/api';

const COUNTRY_FLAGS: Record<string, string> = {
    'USA': '🇺🇸', 'UK': '🇬🇧', 'Canada': '🇨🇦', 'Australia': '🇦🇺', 'Germany': '🇩🇪', 'Ireland': '🇮🇪', 'Singapore': '🇸🇬', 'Other': '🌍'
};

const COUNTRY_DATA: Record<string, any> = {
    'USA': { code: 'us', img: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=500&q=80', sub: 'Most Popular Destination' },
    'UK': { code: 'gb', img: 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=500&q=80', sub: 'Russell Group Universities' },
    'Canada': { code: 'ca', img: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=500&q=80', sub: 'Post-Study Work Visa' },
    'Australia': { code: 'au', img: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=500&q=80', sub: 'Go8 World-Class Unis' },
    'Germany': { code: 'de', img: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=500&q=80', sub: 'Low / No Tuition Fees' },
    'Ireland': { code: 'ie', img: 'https://images.unsplash.com/photo-1564959130747-897fb406b9af?w=500&q=80', sub: 'EU Tech Hub' },
};

const ALL_COUNTRIES = [
    // Top study destinations (shown first for relevance)
    { label: 'USA', code: 'us' },
    { label: 'UK', code: 'gb' },
    { label: 'Canada', code: 'ca' },
    { label: 'Australia', code: 'au' },
    { label: 'Germany', code: 'de' },
    { label: 'Ireland', code: 'ie' },
    { label: 'Singapore', code: 'sg' },
    { label: 'Netherlands', code: 'nl' },
    { label: 'New Zealand', code: 'nz' },
    { label: 'France', code: 'fr' },
    { label: 'Sweden', code: 'se' },
    { label: 'Switzerland', code: 'ch' },
    { label: 'Japan', code: 'jp' },
    { label: 'South Korea', code: 'kr' },
    { label: 'Italy', code: 'it' },
    { label: 'Spain', code: 'es' },
    { label: 'Denmark', code: 'dk' },
    { label: 'Finland', code: 'fi' },
    { label: 'Norway', code: 'no' },
    { label: 'Belgium', code: 'be' },
    { label: 'Austria', code: 'at' },
    { label: 'Portugal', code: 'pt' },
    { label: 'Czech Republic', code: 'cz' },
    { label: 'Poland', code: 'pl' },
    { label: 'Hungary', code: 'hu' },
    { label: 'Greece', code: 'gr' },
    { label: 'Turkey', code: 'tr' },
    { label: 'Malaysia', code: 'my' },
    { label: 'China', code: 'cn' },
    { label: 'Hong Kong', code: 'hk' },
    { label: 'UAE', code: 'ae' },
    { label: 'Saudi Arabia', code: 'sa' },
    { label: 'Qatar', code: 'qa' },
    { label: 'Kuwait', code: 'kw' },
    { label: 'Bahrain', code: 'bh' },
    { label: 'Oman', code: 'om' },
    { label: 'Jordan', code: 'jo' },
    { label: 'Israel', code: 'il' },
    { label: 'South Africa', code: 'za' },
    { label: 'Egypt', code: 'eg' },
    { label: 'Ghana', code: 'gh' },
    { label: 'Kenya', code: 'ke' },
    { label: 'Nigeria', code: 'ng' },
    { label: 'Ethiopia', code: 'et' },
    { label: 'Tanzania', code: 'tz' },
    { label: 'Uganda', code: 'ug' },
    { label: 'Rwanda', code: 'rw' },
    { label: 'Mauritius', code: 'mu' },
    { label: 'Brazil', code: 'br' },
    { label: 'Mexico', code: 'mx' },
    { label: 'Argentina', code: 'ar' },
    { label: 'Chile', code: 'cl' },
    { label: 'Colombia', code: 'co' },
    { label: 'Peru', code: 'pe' },
    { label: 'Venezuela', code: 've' },
    { label: 'Ecuador', code: 'ec' },
    { label: 'Bolivia', code: 'bo' },
    { label: 'Uruguay', code: 'uy' },
    { label: 'Paraguay', code: 'py' },
    { label: 'Panama', code: 'pa' },
    { label: 'Costa Rica', code: 'cr' },
    { label: 'Cuba', code: 'cu' },
    { label: 'Dominican Republic', code: 'do' },
    { label: 'Guatemala', code: 'gt' },
    { label: 'Honduras', code: 'hn' },
    { label: 'El Salvador', code: 'sv' },
    { label: 'Nicaragua', code: 'ni' },
    { label: 'Jamaica', code: 'jm' },
    { label: 'Trinidad and Tobago', code: 'tt' },
    { label: 'Barbados', code: 'bb' },
    { label: 'Guyana', code: 'gy' },
    { label: 'Russia', code: 'ru' },
    { label: 'Ukraine', code: 'ua' },
    { label: 'Romania', code: 'ro' },
    { label: 'Slovakia', code: 'sk' },
    { label: 'Bulgaria', code: 'bg' },
    { label: 'Croatia', code: 'hr' },
    { label: 'Serbia', code: 'rs' },
    { label: 'Slovenia', code: 'si' },
    { label: 'Bosnia', code: 'ba' },
    { label: 'North Macedonia', code: 'mk' },
    { label: 'Albania', code: 'al' },
    { label: 'Kosovo', code: 'xk' },
    { label: 'Montenegro', code: 'me' },
    { label: 'Lithuania', code: 'lt' },
    { label: 'Latvia', code: 'lv' },
    { label: 'Estonia', code: 'ee' },
    { label: 'Belarus', code: 'by' },
    { label: 'Moldova', code: 'md' },
    { label: 'Luxembourg', code: 'lu' },
    { label: 'Iceland', code: 'is' },
    { label: 'Malta', code: 'mt' },
    { label: 'Cyprus', code: 'cy' },
    { label: 'Liechtenstein', code: 'li' },
    { label: 'Andorra', code: 'ad' },
    { label: 'Monaco', code: 'mc' },
    { label: 'San Marino', code: 'sm' },
    { label: 'Georgia', code: 'ge' },
    { label: 'Armenia', code: 'am' },
    { label: 'Azerbaijan', code: 'az' },
    { label: 'Kazakhstan', code: 'kz' },
    { label: 'Uzbekistan', code: 'uz' },
    { label: 'Kyrgyzstan', code: 'kg' },
    { label: 'Tajikistan', code: 'tj' },
    { label: 'Turkmenistan', code: 'tm' },
    { label: 'Mongolia', code: 'mn' },
    { label: 'Nepal', code: 'np' },
    { label: 'Sri Lanka', code: 'lk' },
    { label: 'Bangladesh', code: 'bd' },
    { label: 'Pakistan', code: 'pk' },
    { label: 'Afghanistan', code: 'af' },
    { label: 'Myanmar', code: 'mm' },
    { label: 'Thailand', code: 'th' },
    { label: 'Vietnam', code: 'vn' },
    { label: 'Indonesia', code: 'id' },
    { label: 'Philippines', code: 'ph' },
    { label: 'Cambodia', code: 'kh' },
    { label: 'Laos', code: 'la' },
    { label: 'Taiwan', code: 'tw' },
    { label: 'Brunei', code: 'bn' },
    { label: 'Timor-Leste', code: 'tl' },
    { label: 'Maldives', code: 'mv' },
    { label: 'Bhutan', code: 'bt' },
    { label: 'Iraq', code: 'iq' },
    { label: 'Iran', code: 'ir' },
    { label: 'Syria', code: 'sy' },
    { label: 'Lebanon', code: 'lb' },
    { label: 'Yemen', code: 'ye' },
    { label: 'Palestine', code: 'ps' },
    { label: 'Libya', code: 'ly' },
    { label: 'Tunisia', code: 'tn' },
    { label: 'Algeria', code: 'dz' },
    { label: 'Morocco', code: 'ma' },
    { label: 'Sudan', code: 'sd' },
    { label: 'South Sudan', code: 'ss' },
    { label: 'Somalia', code: 'so' },
    { label: 'Eritrea', code: 'er' },
    { label: 'Djibouti', code: 'dj' },
    { label: 'Samoa', code: 'so' },
    { label: 'Senegal', code: 'sn' },
    { label: 'Ivory Coast', code: 'ci' },
    { label: 'Cameroon', code: 'cm' },
    { label: 'Mozambique', code: 'mz' },
    { label: 'Madagascar', code: 'mg' },
    { label: 'Zimbabwe', code: 'zw' },
    { label: 'Zambia', code: 'zm' },
    { label: 'Malawi', code: 'mw' },
    { label: 'Botswana', code: 'bw' },
    { label: 'Namibia', code: 'na' },
    { label: 'Angola', code: 'ao' },
    { label: 'Congo', code: 'cg' },
    { label: 'DR Congo', code: 'cd' },
    { label: 'Gabon', code: 'ga' },
    { label: 'Equatorial Guinea', code: 'gq' },
    { label: 'Central African Republic', code: 'cf' },
    { label: 'Chad', code: 'td' },
    { label: 'Niger', code: 'ne' },
    { label: 'Mali', code: 'ml' },
    { label: 'Mauritania', code: 'mr' },
    { label: 'Burkina Faso', code: 'bf' },
    { label: 'Benin', code: 'bj' },
    { label: 'Togo', code: 'tg' },
    { label: 'Guinea', code: 'gn' },
    { label: 'Guinea-Bissau', code: 'gw' },
    { label: 'Sierra Leone', code: 'sl' },
    { label: 'Liberia', code: 'lr' },
    { label: 'Gambia', code: 'gm' },
    { label: 'Cape Verde', code: 'cv' },
    { label: 'Sao Tome and Principe', code: 'st' },
    { label: 'Comoros', code: 'km' },
    { label: 'Papua New Guinea', code: 'pg' },
    { label: 'Fiji', code: 'fj' },
    { label: 'Solomon Islands', code: 'sb' },
    { label: 'Vanuatu', code: 'vu' },
    { label: 'Micronesia', code: 'fm' },
    { label: 'Palau', code: 'pw' },
    { label: 'Marshall Islands', code: 'mh' },
    { label: 'Nauru', code: 'nr' },
    { label: 'Tonga', code: 'to' },
    { label: 'Kiribati', code: 'ki' },
    { label: 'Tuvalu', code: 'tv' },
    { label: 'Samoa', code: 'ws' },
];


const ALL_COURSES = [
    'Computer Science', 'Data Science', 'Business Administration (MBA)', 'Mechanical Engineering', 'Electrical Engineering',
    'Civil Engineering', 'Artificial Intelligence', 'Information Technology', 'Finance', 'Marketing', 'Public Health', 'Nursing'
];

const ALL_BACHELORS = [
    'B.Tech in Computer Science', 'B.Tech in Mechanical Engineering', 'B.Tech in Electrical Engineering',
    'B.Tech in Civil Engineering', 'B.Tech in Information Technology', 'B.Sc in Physics', 'B.Sc in Mathematics',
    'B.Sc in Chemistry', 'B.Sc in Computer Science', 'B.A. in Economics', 'B.A. in English', 'B.A. in History',
    'B.Com', 'BBA', 'BCA', 'MBBS', 'B.Arch', 'B.Des', 'B.Ed', 'B.Pharm'
];

// ══════════════════════════════════════════════════════════════
// Answer-key aliases: map flow-specific step IDs → generic keys
// so every AI function / renderer can read answers.country etc.
// ══════════════════════════════════════════════════════════════
const ANSWER_ALIASES: Record<string, string> = {
    plan_country: 'country', loan_country: 'country', compare_country: 'country',
    plan_course: 'course', loan_field: 'course', compare_course: 'course',
    plan_bachelors: 'bachelors_degree', loan_bachelors: 'bachelors_degree', compare_bachelors: 'bachelors_degree',
    plan_gpa: 'gpa', loan_cgpa: 'gpa', compare_cgpa: 'gpa',
    plan_work_exp: 'work_exp', loan_work_exp: 'work_exp', compare_work_exp: 'work_exp',
    plan_target_uni: 'target_university', loan_university: 'target_university', compare_uni_search: 'target_university',
    plan_entrance_test: 'entrance_test', loan_entrance_test: 'entrance_test', compare_test: 'entrance_test',
    plan_entrance_score: 'entrance_score', loan_entrance_score: 'entrance_score', compare_test_score: 'entrance_score',
    plan_english_test: 'english_test', compare_english_test: 'english_test',
    plan_english_score: 'english_score', compare_english_score: 'english_score',
    plan_start_when: 'start_when', compare_intake: 'start_when',
};

const steps: any[] = [
    // ════════════════════════════════════════
    // GOAL SELECTION (shared entry point)
    // ════════════════════════════════════════
    {
        id: 'goal',
        header: "Looking for answers to your masters abroad questions?",
        q: "How can we support you with your master's?",
        type: 'goal_grid',
        options: [
            { value: 'loan', label: 'Need help with an education loan', icon: 'payments', iconClass: 'icon-green', emoji: '🏦' },
            { value: 'plan', label: 'Help me find the right university', icon: 'school', iconClass: 'icon-purple', emoji: '🎓' },
            { value: 'compare', label: 'Evaluate my shortlisted universities', icon: 'compare_arrows', iconClass: 'icon-yellow', emoji: '📊' },
        ]
    },

    // ════════════════════════════════════════════════════════════
    //  PLAN FLOW – "Help me find the right university"
    //  14 unique questions → AI match
    // ════════════════════════════════════════════════════════════
    { id: 'plan_intro', type: 'plan_intro', flows: ['plan'] },
    {
        id: 'plan_country',
        q: "🌍 Which country is your dream destination for higher studies?",
        type: 'countries',
        flows: ['plan']
    },
    {
        id: 'plan_course',
        q: "What field of study are you most passionate about?",
        type: 'course_search',
        placeholder: 'e.g. Computer Science, Data Science, MBA',
        flows: ['plan']
    },
    { id: 'university_preview', type: 'university_preview', flows: ['plan'] },
    {
        id: 'plan_start_when',
        q: "When do you plan to begin your master's programme?",
        type: 'months',
        year: new Date().getFullYear(),
        months: ['Jan to Mar', 'Apr to Jun', 'Jul to Sep', 'Oct to Dec'],
        flows: ['plan']
    },
    {
        id: 'plan_bachelors',
        q: "Tell me about your undergrad — what did you study?",
        type: 'bachelors_search',
        placeholder: 'e.g. B.Tech in Computer Science',
        flows: ['plan']
    },
    {
        id: 'plan_target_uni',
        q: "Do you have a dream university in mind? (optional)",
        type: 'university_search',
        flows: ['plan']
    },
    {
        id: 'plan_work_exp',
        q: "How many months of professional experience do you have?",
        type: 'number',
        placeholder: '0',
        flows: ['plan']
    },
    {
        id: 'plan_gpa',
        q: "What's your current academic score? (CGPA or Percentage)",
        type: 'gpa_input',
        flows: ['plan']
    },
    {
        id: 'plan_entrance_test',
        q: "Have you taken GRE, GMAT, or any standardised entrance exam?",
        type: 'cards',
        cols: 3,
        options: [
            { value: 'gre', label: 'GRE' }, { value: 'gmat', label: 'GMAT' },
            { value: 'none', label: 'Not yet' }
        ],
        flows: ['plan']
    },
    {
        id: 'plan_entrance_score',
        type: 'exam_score',
        skipIf: { key: 'plan_entrance_test', value: 'none' },
        flows: ['plan']
    },
    {
        id: 'plan_english_test',
        q: "What about English proficiency — have you taken IELTS, TOEFL, or PTE?",
        type: 'cards',
        cols: 3,
        options: [
            { value: 'ielts', label: 'IELTS' }, { value: 'toefl', label: 'TOEFL' },
            { value: 'pte', label: 'PTE' }, { value: 'duolingo', label: 'Duolingo' },
            { value: 'none', label: 'Not yet' }
        ],
        flows: ['plan']
    },
    {
        id: 'plan_english_score',
        type: 'english_score',
        skipIf: { key: 'plan_english_test', value: 'none' },
        flows: ['plan']
    },
    {
        id: 'plan_budget',
        q: "What's your approximate annual budget for tuition + living expenses?",
        type: 'cards',
        cols: 2,
        options: [
            { value: 'below_15', label: 'Below ₹15 Lakhs' },
            { value: '15_25', label: '₹15 – 25 Lakhs' },
            { value: '25_40', label: '₹25 – 40 Lakhs' },
            { value: 'above_40', label: 'Above ₹40 Lakhs' },
        ],
        flows: ['plan']
    },

    // ════════════════════════════════════════════════════════════
    //  LOAN FLOW – "Need help with an education loan"
    //  16 unique questions → AI match
    // ════════════════════════════════════════════════════════════
    { id: 'loan_intro', type: 'loan_intro', flows: ['loan'] },
    {
        id: 'loan_admit_status',
        q: "First things first — what's your current admission status?",
        type: 'admit_status',
        flows: ['loan']
    },
    {
        id: 'loan_country',
        q: "Which country will you be studying in?",
        type: 'countries',
        flows: ['loan']
    },
    {
        id: 'loan_field',
        q: "What subject will you be studying?",
        type: 'course_search',
        placeholder: 'e.g. Computer Science, Data Science, MBA',
        flows: ['loan']
    },
    {
        id: 'loan_university',
        q: "Which university have you got an admit from (or are targeting)?",
        type: 'university_search',
        flows: ['loan']
    },
    {
        id: 'loan_amount',
        q: "How much education loan do you need?",
        type: 'loan_amount',
        flows: ['loan']
    },
    {
        id: 'loan_bachelors',
        q: "What was your undergraduate qualification?",
        type: 'bachelors_search',
        placeholder: 'e.g. B.Tech, BBA, B.Sc',
        flows: ['loan']
    },
    {
        id: 'loan_cgpa',
        q: "What was your graduation CGPA or percentage?",
        type: 'gpa_input',
        flows: ['loan']
    },
    {
        id: 'loan_work_exp',
        q: "Do you have any work experience? (enter months, 0 if fresher)",
        type: 'number',
        placeholder: '0',
        flows: ['loan']
    },
    {
        id: 'loan_entrance_test',
        q: "Have you taken any standardised tests like GRE or GMAT?",
        type: 'cards',
        cols: 3,
        options: [
            { value: 'gre', label: 'GRE' }, { value: 'gmat', label: 'GMAT' },
            { value: 'toefl', label: 'TOEFL' }, { value: 'ielts', label: 'IELTS' },
            { value: 'none', label: 'None' }
        ],
        flows: ['loan']
    },
    {
        id: 'loan_entrance_score',
        type: 'exam_score',
        skipIf: { key: 'loan_entrance_test', value: 'none' },
        flows: ['loan']
    },
    {
        id: 'loan_cosigner',
        q: "Who will be co-signing your loan application?",
        type: 'cosigner_select',
        flows: ['loan']
    },
    {
        id: 'loan_cosigner_type',
        q: "What's your co-signer's source of income?",
        type: 'cosigner_type',
        flows: ['loan']
    },
    {
        id: 'loan_cosigner_income',
        q: "What is their approximate monthly income?",
        type: 'rupee',
        placeholder: 'Monthly income',
        flows: ['loan']
    },
    {
        id: 'loan_collateral',
        q: "Do you have any collateral (property, FD, etc.) to offer?",
        type: 'yes_no',
        flows: ['loan']
    },
    {
        id: 'loan_repayment',
        q: "When would you prefer to start your EMI repayment?",
        type: 'cards',
        cols: 2,
        options: [
            { value: 'during_study', label: 'During studies (partial EMI)' },
            { value: 'after_study', label: 'After completing studies' },
            { value: 'moratorium_6', label: '6 months after course' },
            { value: 'moratorium_12', label: '12 months after course' },
        ],
        flows: ['loan']
    },

    // ════════════════════════════════════════════════════════════
    //  COMPARE FLOW – "Evaluate my shortlisted universities"
    //  13 unique questions → AI match
    // ════════════════════════════════════════════════════════════
    { id: 'compare_intro', type: 'compare_intro', flows: ['compare'] },
    {
        id: 'compare_country',
        q: "In which country are your shortlisted universities?",
        type: 'countries',
        flows: ['compare']
    },
    {
        id: 'compare_uni_search',
        q: "Let's begin — which university do you want to evaluate first?",
        type: 'university_search',
        flows: ['compare']
    },
    {
        id: 'compare_course',
        q: "What programme are you applying to at this university?",
        type: 'course_search',
        placeholder: 'e.g. MS in Computer Science, MBA',
        flows: ['compare']
    },
    {
        id: 'compare_bachelors',
        q: "What was your undergraduate major?",
        type: 'bachelors_search',
        placeholder: 'e.g. B.Tech, BBA, BSc',
        flows: ['compare']
    },
    {
        id: 'compare_cgpa',
        q: "What's your academic score? (CGPA or percentage)",
        type: 'gpa_input',
        flows: ['compare']
    },
    {
        id: 'compare_work_exp',
        q: "Any professional experience? Enter total months (0 if none).",
        type: 'number',
        placeholder: '0',
        flows: ['compare']
    },
    {
        id: 'compare_test',
        q: "Which standardised tests have you completed?",
        type: 'cards',
        cols: 3,
        options: [
            { value: 'gre', label: 'GRE' }, { value: 'gmat', label: 'GMAT' },
            { value: 'toefl', label: 'TOEFL' }, { value: 'ielts', label: 'IELTS' },
            { value: 'none', label: 'None' }
        ],
        flows: ['compare']
    },
    {
        id: 'compare_test_score',
        type: 'exam_score',
        skipIf: { key: 'compare_test', value: 'none' },
        flows: ['compare']
    },
    {
        id: 'compare_english_test',
        q: "Have you taken an English proficiency test?",
        type: 'cards',
        cols: 3,
        options: [
            { value: 'ielts', label: 'IELTS' }, { value: 'toefl', label: 'TOEFL' },
            { value: 'pte', label: 'PTE' }, { value: 'duolingo', label: 'Duolingo' },
            { value: 'none', label: 'Not yet' }
        ],
        flows: ['compare']
    },
    {
        id: 'compare_english_score',
        type: 'english_score',
        skipIf: { key: 'compare_english_test', value: 'none' },
        flows: ['compare']
    },
    {
        id: 'compare_intake',
        q: "Which intake are you targeting?",
        type: 'months',
        year: new Date().getFullYear(),
        months: ['Jan to Mar', 'Apr to Jun', 'Jul to Sep', 'Oct to Dec'],
        flows: ['compare']
    },
    {
        id: 'compare_budget',
        q: "What's your maximum annual budget for this programme?",
        type: 'cards',
        cols: 2,
        options: [
            { value: 'below_15', label: 'Below ₹15 Lakhs' },
            { value: '15_25', label: '₹15 – 25 Lakhs' },
            { value: '25_40', label: '₹25 – 40 Lakhs' },
            { value: 'above_40', label: 'Above ₹40 Lakhs' },
        ],
        flows: ['compare']
    },

    // ════════════════════════════════════════════════════════════
    //  SHARED – AI analysis (runs for whichever flow the user chose)
    // ════════════════════════════════════════════════════════════
    { id: 'ai_search', type: 'ai_search', flows: ['plan', 'compare', 'loan'] },
    { id: 'ai_match', type: 'ai_match', flows: ['plan', 'compare', 'loan'] },
];

export default function OnboardingPage() {
    const router = useRouter();
    const heroRef = useRef<HTMLDivElement | null>(null);
    const progressRef = useRef<HTMLDivElement | null>(null);
    const chatEndRef = useRef<HTMLDivElement | null>(null);

    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<string, { value: string; label: string }>>({});
    const [aiUniversities, setAiUniversities] = useState<any[]>([]);
    const [toastData, setToastData] = useState<any>(null);
    const [isAiSearching, setIsAiSearching] = useState(false);
    const [isAiMatching, setIsAiMatching] = useState(false);
    // University count step state
    const [isUniCounting, setIsUniCounting] = useState(false);
    const [uniCountResult, setUniCountResult] = useState<{ count: number; names: string[]; country: string; course: string } | null>(null);

    // Search states
    const [countrySearch, setCountrySearch] = useState('');
    const [showCountrySearch, setShowCountrySearch] = useState(false);
    const [courseSearch, setCourseSearch] = useState('');
    const [showCourseSearch, setShowCourseSearch] = useState(false);
    const [bachelorsSearch, setBachelorsSearch] = useState('');
    const [showBachelorsSearch, setShowBachelorsSearch] = useState(false);

    // Welcome screen state
    const [hasStarted, setHasStarted] = useState(false);

    // GPA state
    const [gpaMode, setGpaMode] = useState<'cgpa' | 'pct'>('cgpa');
    const [gpaValue, setGpaValue] = useState('');

    // AI Search results local state
    const [aiSearchResults, setAiSearchResults] = useState<any[]>([]);
    const [isSearchingAI, setIsSearchingAI] = useState(false);

    // Generic input state
    const [inputValue, setInputValue] = useState('');

    // Loan slider state
    const [loanSliderValue, setLoanSliderValue] = useState(1400000);

    // University detail modal
    const [selectedUniForModal, setSelectedUniForModal] = useState<any>(null);

    // Universities from selected country for quick selection
    const [countryUniversities, setCountryUniversities] = useState<any[]>([]);
    const [loadingCountryUnis, setLoadingCountryUnis] = useState(false);

    // Selected university in search step (for preview before confirming)
    const [previewUniversity, setPreviewUniversity] = useState<any>(null);

    // Fetch AI results helper — used by ai_search and by preview "show all" actions
    const fetchAiResults = async (opts?: { advanceToMatch?: boolean }) => {
        const country = answers.country?.value || 'USA';
        const course = answers.course?.value || '';
        const gpa = parseFloat(answers.gpa?.value || '0');
        const bachelors = answers.bachelors_degree?.value || '';
        const targetUni = answers.target_university?.label || '';

        setIsAiSearching(true);
        try {
            const data: any = await aiApi.aiSearch({ country, course, gpa, bachelors, target_university: targetUni });
            const unis = data?.universities || data?.results || [];
            // Normalize minimal fields if necessary
            const normalized = (unis || []).map((u: any, i: number) => ({
                name: u.name || `Program ${i + 1}`,
                loc: u.loc || u.location || country,
                country: u.country || country,
                rank: u.rank || (100 + i),
                accept: u.accept || 30,
                min_gpa: u.min_gpa || 7.0,
                min_ielts: u.min_ielts || 6.5,
                min_toefl: u.min_toefl || 90,
                tuition: u.tuition || 20000,
                courses: u.courses || [course || 'Various'],
                loan: u.loan ?? true,
                slug: u.slug || (`ai-${i + 1}`),
                website: u.website || ''
            }));

            setAiUniversities(normalized);
            if (opts?.advanceToMatch) {
                const idx = steps.findIndex(s => s.id === 'ai_match');
                if (idx >= 0) setCurrentIdx(idx);
            }
            return normalized;
        } catch (err) {
            console.error('AI fetch failed', err);
            return [];
        } finally {
            setIsAiSearching(false);
        }
    };

    useEffect(() => {
        const pct = Math.round(((currentIdx + 1) / steps.length) * 100);
        if (progressRef.current) progressRef.current.style.width = `${pct}%`;

        if (heroRef.current) {
            if (currentIdx >= 1) {
                heroRef.current.style.maxHeight = heroRef.current.offsetHeight + 'px';
                requestAnimationFrame(() => {
                    heroRef.current!.style.maxHeight = '0';
                    heroRef.current!.style.opacity = '0';
                    heroRef.current!.style.marginBottom = '0';
                    heroRef.current!.style.overflow = 'hidden';
                    heroRef.current!.style.paddingTop = '0';
                    heroRef.current!.style.paddingBottom = '0';
                });
            } else {
                heroRef.current.style.maxHeight = '';
                heroRef.current.style.opacity = '';
                heroRef.current.style.marginBottom = '';
                heroRef.current.style.overflow = '';
                heroRef.current.style.paddingTop = '';
                heroRef.current.style.paddingBottom = '';
            }
        }

        // Auto-scroll to bottom
        setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }, [currentIdx]);

    // When the user selects a country, proactively fetch AI university suggestions for that country.
    useEffect(() => {
        const country = answers.country?.value;
        if (!country) return;

        let mounted = true;
        (async () => {
            try {
                // fetchAiResults reads `answers` internally and will include country
                await fetchAiResults({ advanceToMatch: false });
                // keep results in state; no navigation here
            } catch (e) {
                console.error('Proactive AI fetch failed for country', country, e);
            }
        })();

        return () => { mounted = false; };
    }, [answers.country]);

    // ── Helper: given a raw index, find the next step that is visible for the current flow ──
    const getNextValidIdx = (fromIdx: number, answersSnapshot?: Record<string, { value: string; label: string }>) => {
        const ans = answersSnapshot || answers;
        const goal = ans.goal?.value;
        let i = fromIdx;
        while (i < steps.length) {
            const s = steps[i];
            // Skip steps not in the user's selected flow
            if (s.flows && goal && !s.flows.includes(goal)) { i++; continue; }
            // Skip steps whose skipIf condition is satisfied
            if (s.skipIf) {
                const ref = ans[s.skipIf.key];
                if (ref && ref.value === s.skipIf.value) { i++; continue; }
            }
            break;
        }
        return i;
    };

    // Handle auto steps
    useEffect(() => {
        const step = steps[currentIdx];
        if (!step) return;

        // Jump past any steps that shouldn't be visible (flow mismatch / skipIf)
        const validIdx = getNextValidIdx(currentIdx);
        if (validIdx !== currentIdx) {
            setCurrentIdx(validIdx);
            return;
        }

        // ── university_preview: show universities in the selected country ──
        if (step.type === 'university_preview' && !isUniCounting && !uniCountResult) {
            setIsUniCounting(true);
            const country = answers.country?.value || '';
            const course = answers.course?.value || '';

            const loadPreview = async () => {
                try {
                    const data: any = await aiApi.aiSearch({ country, course });
                    const unis = data?.universities || data?.results || [];
                    const sampleSize = unis.length > 0 ? unis.length : 12;
                    const inflatedCount = Math.max(sampleSize * 18, 120 + Math.floor(Math.random() * 50));

                    setUniCountResult({
                        count: inflatedCount,
                        names: unis.slice(0, 12).map((u: any) => u.name || u.title || 'Unknown'),
                        country: country || 'worldwide',
                        course: course,
                        unis: unis
                    } as any);
                } catch (e) {
                    console.error("Preview load failed", e);
                    setUniCountResult({ count: 156, names: [], country, course, unis: [] } as any);
                } finally {
                    setIsUniCounting(false);
                }
            };
            loadPreview();
        }

        if (step.type === 'ai_search' && !isAiSearching) {
            setIsAiSearching(true);
            const country = answers.country?.value || 'USA';
            const course = answers.course?.value || '';
            const gpa = parseFloat(answers.gpa?.value || '0');
            const bachelors = answers.bachelors_degree?.value || '';
            const targetUni = answers.target_university?.label || '';

            const performDeepSearch = async () => {
                try {
                    // 1. Get AI recommendations based on full profile via server API
                    const aiData: any = await aiApi.aiSearch({ country, course, gpa, bachelors, target_university: targetUni });
                    const aiResults = aiData?.universities || aiData?.results || [];

                    let pool = [...aiResults];

                    if (pool.length === 0) {
                        // Very basic synthesis if AI failed and no pool
                        pool = Array.from({ length: 12 }).map((_, i) => ({
                            name: `${course || 'Global'} University ${i + 1}`,
                            loc: country,
                            country: country,
                            rank: 100 + i * 15,
                            accept: 25,
                            min_gpa: 7.0,
                            min_ielts: 6.5,
                            min_toefl: 90,
                            tuition: 30000,
                            courses: [course || 'Various'],
                            loan: true,
                            slug: `dynamic-${i}`,
                            tag: 'Suggested'
                        }));
                    }

                    // 2. Score the pool
                    const kw = course.toLowerCase().replace(/[^a-z ]/g, '').trim();
                    const keywords = kw.split(/\s+/).filter(Boolean);

                    pool = pool.map(u => {
                        let rel = 0;
                        const uCourses = u.courses || [];
                        keywords.forEach(k => {
                            if (uCourses.some((c: string) => c.toLowerCase().includes(k))) rel += 3;
                        });
                        if (gpa > 0) {
                            const gpaGap = gpa - (u.min_gpa || 7.0);
                            if (gpaGap >= 1.0) rel += 5;
                            else if (gpaGap >= 0) rel += 3;
                            else if (gpaGap >= -0.5) rel += 1;
                        }
                        return { ...u, _rel: rel };
                    }).sort((a, b) => (b._rel || 0) - (a._rel || 0) || (a.rank || 1000) - (b.rank || 1000));

                    setAiUniversities(pool.slice(0, 30));
                } catch (err) {
                    console.error("Deep Search Failed:", err);
                    setAiUniversities([]);
                } finally {
                    setIsAiSearching(false);
                    setCurrentIdx(getNextValidIdx(currentIdx + 1));
                }
            };

            performDeepSearch();
        }

        if (step.type === 'ai_match' && !isAiMatching) {
            setIsAiMatching(true);
            setTimeout(() => {
                setIsAiMatching(false);
            }, 3000);
        }

    }, [currentIdx, answers]);

    // Stats counters
    useEffect(() => {
        const counters = [
            { id: 'stat1', target: 50000 },
            { id: 'stat2', target: 2500 },
            { id: 'stat3', target: 98 },
            { id: 'stat4', target: 15 },
        ];
        let animated = false;
        const obs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && !animated) {
                animated = true;
                counters.forEach(obj => {
                    const el = document.getElementById(obj.id);
                    if (!el) return;
                    const duration = 1200, step = 16;
                    const steps = duration / step;
                    let current = 0;
                    const inc = obj.target / steps;
                    const timer = setInterval(() => {
                        current = Math.min(current + inc, obj.target);
                        if (obj.id === 'stat1') el.textContent = current >= 1000 ? Math.floor(current / 1000) + 'K+' : String(Math.floor(current));
                        else if (obj.id === 'stat2') el.textContent = '₹' + Math.floor(current) + 'Cr+';
                        else el.textContent = Math.floor(current) + (obj.id === 'stat4' ? '+' : '%');
                        if (current >= obj.target) clearInterval(timer);
                    }, step);
                });
            }
        }, { threshold: 0.3 });
        if (heroRef.current) obs.observe(heroRef.current);
        return () => obs.disconnect();
    }, []);

    // Social proof toast cycling
    useEffect(() => {
        const toasts = [
            { name: 'Priya S.', letter: 'P', msg: 'just got approved for <strong>₹35L</strong> 🎉', time: '2 min ago' },
            { name: 'Arjun M.', letter: 'A', msg: 'received <strong>₹52L</strong> for MS in USA 🇺🇸', time: '5 min ago' },
            { name: 'Sneha R.', letter: 'S', msg: 'got <strong>0% processing fee</strong> waived ✨', time: '8 min ago' },
            { name: 'Karthik V.', letter: 'K', msg: 'loan approved in <strong>48 hours</strong> ⚡', time: '12 min ago' },
        ];
        let idx = 0;
        const first = setTimeout(() => {
            setToastData(toasts[idx % toasts.length]);
            idx++;
            const iv = setInterval(() => {
                setToastData(toasts[idx % toasts.length]);
                idx++;
            }, 8000);
            (window as any)._onb_toast_iv = iv;
        }, 3000);
        return () => {
            clearTimeout(first);
            clearInterval((window as any)._onb_toast_iv);
        };
    }, []);

    const submitAnswer = (stepId: string, value: string, label: string) => {
        const updates: Record<string, { value: string; label: string }> = { [stepId]: { value, label } };
        // Also set the generic alias so AI functions / renderers can read answers.country etc.
        const alias = ANSWER_ALIASES[stepId];
        if (alias) updates[alias] = { value, label };
        const merged = { ...answers, ...updates };
        setAnswers(merged);
        setInputValue('');
        setGpaValue('');
        setAiSearchResults([]); // clear AI results
        setIsSearchingAI(false);
        setPreviewUniversity(null); // clear university preview
        // Jump directly to the next visible step (skip irrelevant flows / skipIf)
        setCurrentIdx(getNextValidIdx(currentIdx + 1, merged));
    };

    const handleAiSearch = async (type: 'university' | 'course', query: string) => {
        if (!query.trim()) return;
        setIsSearchingAI(true);
        try {
            const context = {
                country: answers.country?.value,
                bachelors: answers.bachelors_degree?.value,
                course: answers.course?.value,
                gpa: answers.gpa?.value
            };

            const data: any = await aiApi.aiSearch({ query, type, ...context });
            const results = data?.universities || data?.results || [];
            setAiSearchResults(results.map((u: any, i: number) => ({ name: u.name || u.title || `Result ${i + 1}`, slug: u.slug || `r-${i + 1}`, ...u })));
        } catch (error) {
            console.error('AI Search Error:', error);
        } finally {
            setIsSearchingAI(false);
        }
    };

    // Debounce AI search while typing in university search step
    const aiSearchDebounceRef = useRef<number | null>(null);
    useEffect(() => {
        const step = steps[currentIdx];
        if (!step || step.type !== 'university_search') return;
        if (aiSearchDebounceRef.current) window.clearTimeout(aiSearchDebounceRef.current);
        if (inputValue.trim().length < 3) {
            // If no query but we have country universities, filter locally
            if (countryUniversities.length > 0) {
                setAiSearchResults(countryUniversities.slice(0, 8));
            } else {
                setAiSearchResults([]);
            }
            return;
        }
        aiSearchDebounceRef.current = window.setTimeout(() => {
            handleAiSearch('university', inputValue.trim());
        }, 400);

        return () => { if (aiSearchDebounceRef.current) window.clearTimeout(aiSearchDebounceRef.current); };
    }, [inputValue, currentIdx, countryUniversities]);

    // Auto-fetch universities when entering university_search step
    useEffect(() => {
        const step = steps[currentIdx];
        if (!step || step.type !== 'university_search') return;
        const country = answers.country?.value;
        const course = answers.course?.value;
        if (!country) return;

        // Load universities for selected country
        setLoadingCountryUnis(true);
        aiApi.aiSearch({ country, course, type: 'university' })
            .then((data: any) => {
                const unis = data?.universities || data?.results || [];
                const normalized = unis.map((u: any, i: number) => ({
                    name: u.name || `University ${i + 1}`,
                    loc: u.loc || u.location || country,
                    country: u.country || country,
                    rank: u.rank || (100 + i),
                    accept: u.accept || u.acceptanceRate || 30,
                    min_gpa: u.min_gpa || 7.0,
                    min_ielts: u.min_ielts || 6.5,
                    min_toefl: u.min_toefl || 90,
                    tuition: u.tuition || 25000,
                    courses: u.courses || [course || 'Various'],
                    loan: u.loan ?? true,
                    slug: u.slug || `uni-${i}`,
                    website: u.website || '',
                    description: u.description || '',
                }));
                setCountryUniversities(normalized);
                setAiSearchResults(normalized.slice(0, 8));
            })
            .catch(console.error)
            .finally(() => setLoadingCountryUnis(false));
    }, [currentIdx, answers.country?.value, answers.course?.value]);

    const editStep = (idx: number) => {
        setCurrentIdx(idx);
        // Clear answers from this step onwards
        const newAnswers = { ...answers };
        for (let i = idx; i < steps.length; i++) {
            delete newAnswers[steps[i].id];
        }
        setAnswers(newAnswers);
        // Reset auto-step state if going back past the university_preview step
        const uniCountIdx = steps.findIndex(s => s.id === 'university_preview');
        if (idx <= uniCountIdx) {
            setUniCountResult(null);
            setIsUniCounting(false);
        }
    };

    const renderInteraction = (step: any, idx: number) => {
        if (step.type === 'goal_grid') {
            const o = step.options;
            return (
                <div className="goal-grid-3">
                    {o.map((opt: any) => (
                        <button key={opt.value} className="goal-card-eq" onClick={() => submitAnswer(step.id, opt.value, opt.label)}>
                            <div className={"goal-icon-circle " + opt.iconClass}>
                                <span style={{ fontSize: 28 }}>{opt.emoji}</span>
                            </div>
                            <p className="goal-card-label">{opt.label}</p>
                            <div className="goal-card-arrow">→</div>
                        </button>
                    ))}
                </div>
            );
        }

        if (step.type === 'countries') {
            const defaultCountryOpts = [
                { value: 'USA', label: 'USA' }, { value: 'UK', label: 'UK' }, { value: 'Canada', label: 'Canada' },
                { value: 'Australia', label: 'Australia' }, { value: 'Germany', label: 'Germany' }, { value: 'Ireland', label: 'Ireland' },
            ];
            const countryOpts = (step.options || defaultCountryOpts).filter((o: any) => o.value !== 'Other');
            return (
                <div>
                    <div className="country-img-grid">
                        {countryOpts.map((o: any) => {
                            const d = COUNTRY_DATA[o.value] || { code: '', img: '', sub: '' };
                            const flagUrl = d.code ? `https://flagcdn.com/w80/${d.code}.png` : '';
                            return (
                                <button key={o.value} className="country-img-card" onClick={() => submitAnswer(step.id, o.value, o.label)} style={{ ['--bg' as any]: `url('${d.img}')` }}>
                                    <div className="cic-overlay"></div>
                                    <div className="cic-flag">{flagUrl && <img src={flagUrl} alt={o.label} className="cic-flag-img" />}</div>
                                    <div className="cic-name">{o.label}</div>
                                    <div className="cic-sub">{d.sub}</div>
                                </button>
                            );
                        })}
                    </div>
                    <div className="country-search-wrap" style={{ marginTop: 12 }}>
                        <div className={`country-search-trigger ${showCountrySearch ? 'open' : ''}`} onClick={() => setShowCountrySearch(!showCountrySearch)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: '#7c3aed' }}>🌐</span>
                                <span style={{ fontWeight: 700 }}>Search all countries (180+)...</span>
                            </div>
                            <div className="cst-arrow">{showCountrySearch ? '▲' : '▼'}</div>
                        </div>
                        {showCountrySearch && (
                            <div className="country-search-box" style={{ display: 'block' }}>
                                <input
                                    className="country-search-input"
                                    placeholder="🔍  Type a country name..."
                                    value={countrySearch}
                                    onChange={e => setCountrySearch(e.target.value)}
                                    autoFocus
                                />
                                <div className="country-search-results">
                                    {countrySearch.trim() === '' ? (
                                        <div style={{ padding: '10px 14px', color: '#aaa', fontSize: 13, textAlign: 'center' }}>
                                            Start typing to search from 180+ countries
                                        </div>
                                    ) : ALL_COUNTRIES.filter(c => c.label.toLowerCase().includes(countrySearch.toLowerCase())).length === 0 ? (
                                        <div style={{ padding: '10px 14px', color: '#aaa', fontSize: 13, textAlign: 'center' }}>
                                            No country found for &quot;{countrySearch}&quot;
                                        </div>
                                    ) : (
                                        ALL_COUNTRIES.filter(c => c.label.toLowerCase().includes(countrySearch.toLowerCase())).slice(0, 8).map(c => (
                                            <div key={`${c.code}-${c.label}`} className="csr-item" onClick={() => { submitAnswer(step.id, c.label, c.label); setCountrySearch(''); setShowCountrySearch(false); }}>
                                                <img src={`https://flagcdn.com/w40/${c.code}.png`} alt="" className="csr-flag-img" style={{ width: 20, marginRight: 8, verticalAlign: 'middle', borderRadius: 2 }} />
                                                {c.label}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            );
        }

        if (step.type === 'bachelors_search') {
            return (
                <div>
                    <div className="input-group">
                        <input className="chat-input" placeholder={step.placeholder} value={bachelorsSearch} onChange={e => { setBachelorsSearch(e.target.value); setShowBachelorsSearch(true); }} onFocus={() => setShowBachelorsSearch(true)} />
                    </div>
                    {showBachelorsSearch && bachelorsSearch && (
                        <div className="country-search-box" style={{ display: 'block', marginTop: 4 }}>
                            <div className="country-search-results">
                                {ALL_BACHELORS.filter(c => c.toLowerCase().includes(bachelorsSearch.toLowerCase())).slice(0, 5).map(c => (
                                    <div key={c} className="csr-item" onClick={() => { setBachelorsSearch(c); setShowBachelorsSearch(false); }}>{c}</div>
                                ))}
                            </div>
                        </div>
                    )}
                    <button className="chat-submit" style={{ marginTop: 12 }} onClick={() => submitAnswer(step.id, bachelorsSearch, bachelorsSearch)} disabled={!bachelorsSearch}>Continue</button>
                </div>
            );
        }

        if (step.type === 'course_search') {
            return (
                <div>
                    {/* Popular fields as chips */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                        {ALL_COURSES.slice(0, 10).map(c => (
                            <button key={c} className="month-chip" onClick={() => submitAnswer(step.id, c, c)} style={{ padding: '8px 12px' }}>{c}</button>
                        ))}
                    </div>

                    <div className="input-group">
                        <input className="chat-input" placeholder={step.placeholder} value={courseSearch} onChange={e => { setCourseSearch(e.target.value); setShowCourseSearch(true); }} onFocus={() => setShowCourseSearch(true)} />
                    </div>
                    {showCourseSearch && courseSearch && (
                        <div className="country-search-box" style={{ display: 'block', marginTop: 4 }}>
                            <div className="country-search-results">
                                {ALL_COURSES.filter(c => c.toLowerCase().includes(courseSearch.toLowerCase())).slice(0, 8).map(c => (
                                    <div key={c} className="csr-item" onClick={() => { setCourseSearch(c); setShowCourseSearch(false); submitAnswer(step.id, c, c); }}>{c}</div>
                                ))}
                                {/* AI Search Option */}
                                <div className="csr-item" style={{ background: '#f5f3ff', borderTop: '1px dashed #d8b4fe' }}
                                    onClick={() => handleAiSearch('course', courseSearch)}>
                                    <span style={{ marginRight: 8 }}>✨</span> Try AI search for "{courseSearch}"...
                                </div>
                                {isSearchingAI && <div className="p-3 text-center text-xs text-gray-400">Searching AI database...</div>}
                                {aiSearchResults.length > 0 && typeof aiSearchResults[0] === 'string' && aiSearchResults.map(c => (
                                    <div key={c} className="csr-item" style={{ borderLeft: '3px solid #7c3aed' }} onClick={() => submitAnswer(step.id, c, c)}>
                                        <span style={{ marginRight: 6 }}>💡</span> {c}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button className="chat-submit" style={{ marginTop: 12, background: 'none', border: '1px solid #7c3aed', color: '#7c3aed' }}
                            onClick={() => handleAiSearch('course', courseSearch)} disabled={!courseSearch || isSearchingAI}>
                            {isSearchingAI ? 'Searching...' : 'Deep AI Search'}
                        </button>
                        <button className="chat-submit" style={{ marginTop: 12 }} onClick={() => submitAnswer(step.id, courseSearch, courseSearch)} disabled={!courseSearch}>Continue</button>
                    </div>
                </div>
            );
        }

        if (step.type === 'plan_intro') {
            return (
                <div style={{ textAlign: 'center', padding: 12 }}>
                    <div style={{ maxWidth: 680, margin: '0 auto 12px', background: 'linear-gradient(135deg,#fff,#f8fafc)', padding: 20, borderRadius: 16 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>Great choice — we'll help you find the right university!</h3>
                        <p style={{ color: '#6b7280', marginBottom: 14 }}>Thanks for trusting us — answer a few quick questions and we'll shortlist programmes and universities tailored to your profile.</p>
                        <button className="chat-submit" onClick={() => submitAnswer(step.id, 'started', "Let's begin")}>Let's begin</button>
                    </div>
                </div>
            );
        }

        if (step.type === 'loan_intro') {
            return (
                <div style={{ textAlign: 'center', padding: 12 }}>
                    <div style={{ maxWidth: 680, margin: '0 auto 12px', background: 'linear-gradient(135deg,#fff,#f0fdf4)', padding: 20, borderRadius: 16, border: '1px solid #bbf7d0' }}>
                        <div style={{ fontSize: 36, marginBottom: 12 }}>🏦</div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>Let's find the best education loan for you!</h3>
                        <p style={{ color: '#6b7280', marginBottom: 14 }}>I'll ask a few questions about your profile and match you with the best lenders, interest rates, and processing times.</p>
                        <button className="chat-submit" onClick={() => submitAnswer(step.id, 'started', "Let's begin")}>Let's begin</button>
                    </div>
                </div>
            );
        }

        if (step.type === 'compare_intro') {
            return (
                <div style={{ textAlign: 'center', padding: 12 }}>
                    <div style={{ maxWidth: 680, margin: '0 auto 12px', background: 'linear-gradient(135deg,#fff,#fffbeb)', padding: 20, borderRadius: 16, border: '1px solid #fde68a' }}>
                        <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>Let's evaluate your shortlisted universities!</h3>
                        <p style={{ color: '#6b7280', marginBottom: 14 }}>Share your university picks and academic details — our AI will analyse your chances at each one.</p>
                        <button className="chat-submit" onClick={() => submitAnswer(step.id, 'started', "Let's begin")}>Let's begin</button>
                    </div>
                </div>
            );
        }

        if (step.type === 'admit_status') {
            return (
                <div className="opts-grid opts-2" style={{ marginTop: 10 }}>
                    {['Received Admit', 'Awaiting Decision', 'Waitlisted', 'Yet to Apply', 'Already On Campus'].map(status => (
                        <button key={status} className="opt-card" onClick={() => submitAnswer(step.id, status, status)}>{status}</button>
                    ))}
                </div>
            );
        }

        if (step.type === 'loan_amount') {
            const formatted = loanSliderValue >= 10000000
                ? `₹${(loanSliderValue / 10000000).toFixed(2)} Cr`
                : `₹${(loanSliderValue / 100000).toFixed(0)} Lakhs`;
            return (
                <div style={{ marginTop: 10 }}>
                    <div style={{ padding: 20, background: '#fff', borderRadius: 16, border: '1px solid #f3f4f6' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>LOAN AMOUNT</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 4 }}>{formatted}</div>
                        <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 16 }}>
                            {loanSliderValue >= 10000000 ? `${(loanSliderValue / 10000000).toFixed(2)} CRORE` : `${(loanSliderValue / 100000).toFixed(0)} LAKH`}
                        </div>
                        <input
                            type="range" min="1200000" max="20000000" step="100000"
                            value={loanSliderValue}
                            onChange={e => setLoanSliderValue(Number(e.target.value))}
                            style={{ width: '100%', accentColor: '#6605c7' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
                            <span>₹12L</span><span>₹2Cr</span>
                        </div>
                    </div>
                    <button className="chat-submit" style={{ marginTop: 12 }} onClick={() => submitAnswer(step.id, String(loanSliderValue), formatted)}>Confirm</button>
                </div>
            );
        }

        if (step.type === 'cosigner_select') {
            const relations = ['Mother', 'Father', 'Brother', 'Sister', 'Spouse', 'Maternal Uncle', 'Paternal Uncle', 'Grandfather'];
            return (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    {relations.map(r => (
                        <button key={r} className="month-chip" onClick={() => submitAnswer(step.id, r, r)} style={{ padding: '8px 16px' }}>{r}</button>
                    ))}
                </div>
            );
        }

        if (step.type === 'cosigner_type') {
            const types = ['Self-employed', 'Salaried', 'Farmer', 'Pensioner'];
            return (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    {types.map(t => (
                        <button key={t} className="month-chip" onClick={() => submitAnswer(step.id, t, t)} style={{ padding: '8px 16px' }}>{t}</button>
                    ))}
                </div>
            );
        }

        if (step.type === 'yes_no') {
            return (
                <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                    <button className="opt-card" style={{ flex: 1, padding: '16px' }} onClick={() => submitAnswer(step.id, 'yes', 'Yes')}>Yes</button>
                    <button className="opt-card" style={{ flex: 1, padding: '16px' }} onClick={() => submitAnswer(step.id, 'no', 'No')}>No</button>
                </div>
            );
        }

        if (step.type === 'university_search') {
            const selectedCountry = answers.country?.value || '';
            const selectedCourse = answers.course?.value || '';

            return (
                <div>
                    {/* Selected University Preview Card */}
                    {previewUniversity && (
                        <div style={{ marginBottom: 16, padding: 20, background: 'linear-gradient(135deg, #f8f5ff, #f0e8ff)', borderRadius: 16, border: '2px solid #c4b5fd' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Selected University</div>
                                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e', marginBottom: 4 }}>{previewUniversity.name}</h3>
                                    <p style={{ fontSize: 13, color: '#6b7280' }}>{previewUniversity.loc || previewUniversity.country}</p>
                                </div>
                                <button onClick={() => setPreviewUniversity(null)} style={{ padding: '4px 10px', background: 'rgba(124,58,237,0.1)', border: 'none', borderRadius: 8, color: '#7c3aed', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Change</button>
                            </div>

                            {/* Quick Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
                                {previewUniversity.rank && (
                                    <div style={{ padding: '10px 12px', background: 'white', borderRadius: 10, textAlign: 'center' }}>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: '#7c3aed' }}>#{previewUniversity.rank}</div>
                                        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>QS Rank</div>
                                    </div>
                                )}
                                {previewUniversity.accept && (
                                    <div style={{ padding: '10px 12px', background: 'white', borderRadius: 10, textAlign: 'center' }}>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: '#16a34a' }}>{previewUniversity.accept}%</div>
                                        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>Accept Rate</div>
                                    </div>
                                )}
                                {previewUniversity.tuition && (
                                    <div style={{ padding: '10px 12px', background: 'white', borderRadius: 10, textAlign: 'center' }}>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: '#ea580c' }}>${(previewUniversity.tuition / 1000).toFixed(0)}K</div>
                                        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>Tuition/yr</div>
                                    </div>
                                )}
                                {previewUniversity.min_gpa && (
                                    <div style={{ padding: '10px 12px', background: 'white', borderRadius: 10, textAlign: 'center' }}>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: '#0891b2' }}>{previewUniversity.min_gpa}</div>
                                        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>Min GPA</div>
                                    </div>
                                )}
                            </div>

                            {/* Programs */}
                            {previewUniversity.courses && previewUniversity.courses.length > 0 && (
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 6 }}>Popular Programs</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {previewUniversity.courses.slice(0, 4).map((c: string, i: number) => (
                                            <span key={i} style={{ padding: '4px 10px', background: 'white', borderRadius: 8, fontSize: 11, fontWeight: 600, color: '#4b5563' }}>{c}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 10 }}>
                                {previewUniversity.website && (
                                    <a href={previewUniversity.website} target="_blank" rel="noreferrer" style={{ flex: 1, padding: '12px', background: 'white', border: '1.5px solid #e9d5ff', borderRadius: 10, textAlign: 'center', fontWeight: 700, fontSize: 13, color: '#7c3aed', textDecoration: 'none' }}>
                                        🌐 Visit Website
                                    </a>
                                )}
                                <button onClick={() => setSelectedUniForModal(previewUniversity)} style={{ flex: 1, padding: '12px', background: 'white', border: '1.5px solid #e9d5ff', borderRadius: 10, fontWeight: 700, fontSize: 13, color: '#7c3aed', cursor: 'pointer' }}>
                                    📋 Full Details
                                </button>
                                <button onClick={() => submitAnswer(step.id, previewUniversity.slug || previewUniversity.name, previewUniversity.name)} style={{ flex: 1.5, padding: '12px', background: 'linear-gradient(135deg, #7c3aed, #6605c7)', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, color: 'white', cursor: 'pointer', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}>
                                    Confirm Selection →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Search Input */}
                    {!previewUniversity && (
                        <>
                            <div style={{ marginBottom: 12, padding: '12px 16px', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                                <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>
                                    🎓 Showing top universities in {selectedCountry || 'your selected country'} for {selectedCourse || 'your course'}
                                </div>
                            </div>

                            <div className="input-group" style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>🔍</span>
                                <input className="chat-input" style={{ paddingLeft: 44 }} placeholder="Search university by name..." value={inputValue} onChange={e => setInputValue(e.target.value)} />
                            </div>

                            {/* Loading State */}
                            {loadingCountryUnis && (
                                <div style={{ padding: 20, textAlign: 'center' }}>
                                    <div style={{ width: 32, height: 32, border: '3px solid #e9d5ff', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                                    <div style={{ fontSize: 13, color: '#6b7280' }}>Loading universities from {selectedCountry}...</div>
                                </div>
                            )}

                            {/* University Results */}
                            {!loadingCountryUnis && (aiSearchResults.length > 0 || inputValue) && (
                                <div style={{ marginTop: 12, background: '#fff', borderRadius: 16, border: '1px solid #f3f4f6', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                    {isSearchingAI && (
                                        <div style={{ padding: 16, textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>
                                            <div style={{ fontSize: 13, color: '#7c3aed', fontWeight: 600 }}>✨ Searching AI database...</div>
                                        </div>
                                    )}

                                    {aiSearchResults.length > 0 ? (
                                        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                                            {aiSearchResults.map((u, i) => (
                                                <div key={u.slug || i}
                                                    style={{ padding: '14px 16px', borderBottom: '1px solid #f9fafb', cursor: 'pointer', transition: 'background 0.15s' }}
                                                    onMouseOver={e => e.currentTarget.style.background = '#faf5ff'}
                                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                    onClick={() => setPreviewUniversity(u)}>
                                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                        <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #f3e8ff, #e9d5ff)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#7c3aed', flexShrink: 0 }}>
                                                            {u.name?.charAt(0) || '🏛️'}
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                                                <span style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 14 }}>{u.name}</span>
                                                                <span style={{ fontSize: 9, background: '#f0fdf4', color: '#16a34a', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>AI</span>
                                                            </div>
                                                            <div style={{ fontSize: 12, color: '#6b7280' }}>{u.loc || u.country}</div>
                                                            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                                                                {u.rank && <span style={{ fontSize: 10, background: '#f5f3ff', color: '#7c3aed', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>Rank #{u.rank}</span>}
                                                                {u.accept && <span style={{ fontSize: 10, background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>{u.accept}% Accept</span>}
                                                                {u.tuition && <span style={{ fontSize: 10, background: '#fff7ed', color: '#ea580c', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>${(u.tuition / 1000).toFixed(0)}K/yr</span>}
                                                            </div>
                                                        </div>
                                                        <div style={{ color: '#c4b5fd', fontSize: 18 }}>→</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : inputValue && !isSearchingAI && (
                                        <div style={{ padding: 20, textAlign: 'center' }}>
                                            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                                            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>No universities found for "{inputValue}"</div>
                                            <button onClick={() => handleAiSearch('university', inputValue)} style={{ padding: '8px 16px', background: '#f5f3ff', border: '1px solid #e9d5ff', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#7c3aed', cursor: 'pointer' }}>
                                                Try AI Global Search
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Manual Entry Option */}
                            <div style={{ marginTop: 16, padding: 12, background: '#f9fafb', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ fontSize: 12, color: '#6b7280' }}>Can't find your university? Enter manually:</div>
                                <button onClick={() => { if (inputValue) submitAnswer(step.id, inputValue, inputValue); }} disabled={!inputValue} style={{ padding: '8px 16px', background: inputValue ? '#7c3aed' : '#e5e7eb', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, color: inputValue ? 'white' : '#9ca3af', cursor: inputValue ? 'pointer' : 'not-allowed' }}>
                                    Add "{inputValue || '...'}"
                                </button>
                            </div>
                        </>
                    )}

                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            );
        }

        if (step.type === 'exam_score') {
            const test = answers.entrance_test?.value || 'gre';
            const meta: any = {
                gre: { label: 'GRE', min: 260, max: 340, step: 1, placeholder: 'e.g. 320', hint: 'Total GRE score' },
                gmat: { label: 'GMAT', min: 200, max: 800, step: 1, placeholder: 'e.g. 700', hint: 'Total GMAT score' },
                toefl: { label: 'TOEFL', min: 0, max: 120, step: 1, placeholder: 'e.g. 100', hint: 'Score out of 120' },
                ielts: { label: 'IELTS', min: 0, max: 9, step: 0.5, placeholder: 'e.g. 7.0', hint: 'Band score (0–9)' },
            }[test] || { label: 'Score', min: 0, max: 120, step: 1, placeholder: 'Score', hint: '' };

            return (
                <div>
                    <div className="q-row" style={{ marginBottom: 4 }}><p className="q-text">What is your {meta.label} score?</p></div>
                    <div className="input-group">
                        <input className="chat-input" type="number" step={meta.step} min={meta.min} max={meta.max} placeholder={meta.placeholder} value={inputValue} onChange={e => setInputValue(e.target.value)} />
                    </div>
                    <p style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>{meta.hint}</p>
                    <button className="chat-submit" style={{ marginTop: 12 }} onClick={() => {
                        if (!inputValue) return;
                        submitAnswer(step.id, inputValue, `${answers.entrance_test?.label || meta.label} ${inputValue}`);
                    }}>Continue</button>
                </div>
            );
        }

        if (step.type === 'cards') {
            const cls = step.cols === 3 ? 'opts-3' : 'opts-2';
            return (
                <div className={`opts-grid ${cls}`}>
                    {step.options.map((o: any) => (
                        <button key={o.value} className="opt-card" onClick={() => submitAnswer(step.id, o.value, o.label)}>{o.label}</button>
                    ))}
                </div>
            );
        }

        if (step.type === 'months') {
            return (
                <div className="months-wrap">
                    <div className="year-label">THIS YEAR — {step.year}</div>
                    <div className="chips-row">
                        {step.months.map((m: string) => (
                            <button key={m} className="month-chip" onClick={() => submitAnswer(step.id, `${m}-${step.year}`, `${m} ${step.year}`)}>{m}</button>
                        ))}
                    </div>
                </div>
            );
        }

        if (step.type === 'gpa_input') {
            return (
                <div style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        <button className={`gpa-mode-btn ${gpaMode === 'cgpa' ? 'active' : ''}`} onClick={() => setGpaMode('cgpa')}>CGPA (10)</button>
                        <button className={`gpa-mode-btn ${gpaMode === 'pct' ? 'active' : ''}`} onClick={() => setGpaMode('pct')}>Percentage (%)</button>
                    </div>
                    <div className="input-group">
                        <input className="chat-input" type="number" step="0.1" min="0" max={gpaMode === 'cgpa' ? 10 : 100} placeholder={gpaMode === 'cgpa' ? 'e.g. 8.5' : 'e.g. 78'} value={gpaValue} onChange={e => setGpaValue(e.target.value)} />
                        <span className="input-prefix" style={{ left: 'auto', right: 14, fontSize: 12, color: '#aaa' }}>{gpaMode === 'cgpa' ? '/10' : '%'}</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>{gpaMode === 'cgpa' ? 'Enter your CGPA out of 10' : 'Enter your percentage (0–100)'}</p>
                    <button className="chat-submit" style={{ marginTop: 12 }} onClick={() => {
                        const v = parseFloat(gpaValue);
                        if (isNaN(v) || v < 0) return;
                        let out10 = v;
                        if (gpaMode === 'pct') out10 = parseFloat((v / 10).toFixed(2));
                        const lbl = gpaMode === 'cgpa' ? `${v} / 10` : `${v}%`;
                        submitAnswer(step.id, String(out10), lbl);
                    }}>Continue</button>
                </div>
            );
        }

        if (step.type === 'english_score') {
            const test = answers.english_test?.value || 'ielts';
            const meta: any = {
                ielts: { label: 'IELTS', min: 0, max: 9, step: 0.5, placeholder: 'e.g. 7.0', hint: 'Band score (0–9)' },
                toefl: { label: 'TOEFL', min: 0, max: 120, step: 1, placeholder: 'e.g. 100', hint: 'Score out of 120' },
                pte: { label: 'PTE', min: 10, max: 90, step: 1, placeholder: 'e.g. 65', hint: 'Score out of 90' },
                duolingo: { label: 'Duolingo', min: 10, max: 160, step: 1, placeholder: 'e.g. 120', hint: 'Score out of 160' },
            }[test] || { label: 'Test', min: 0, max: 120, step: 1, placeholder: 'Score', hint: '' };

            return (
                <div>
                    <div className="q-row" style={{ marginBottom: 4 }}><p className="q-text">What is your {meta.label} score?</p></div>
                    <div className="input-group">
                        <input className="chat-input" type="number" step={meta.step} min={meta.min} max={meta.max} placeholder={meta.placeholder} value={inputValue} onChange={e => setInputValue(e.target.value)} />
                    </div>
                    <p style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>{meta.hint}</p>
                    <button className="chat-submit" style={{ marginTop: 12 }} onClick={() => {
                        if (!inputValue) return;
                        submitAnswer(step.id, inputValue, `${answers.english_test?.label} ${inputValue}`);
                    }}>Continue</button>
                </div>
            );
        }

        if (step.type === 'rupee') {
            return (
                <div>
                    <div className="input-group">
                        <span className="input-prefix">₹</span>
                        <input className="chat-input with-prefix" placeholder={step.placeholder} value={inputValue} onChange={e => {
                            const raw = e.target.value.replace(/[^0-9]/g, '');
                            setInputValue(raw ? parseInt(raw, 10).toLocaleString('en-IN') : '');
                        }} />
                    </div>
                    <button className="chat-submit" style={{ marginTop: 12 }} onClick={() => {
                        const raw = inputValue.replace(/[^0-9]/g, '');
                        if (!raw) return;
                        submitAnswer(step.id, raw, `₹${inputValue}`);
                    }}>Continue</button>
                </div>
            );
        }

        if (step.type === 'number') {
            return (
                <div>
                    <div className="input-group">
                        <input className="chat-input" type="number" min="0" placeholder={step.placeholder} value={inputValue} onChange={e => setInputValue(e.target.value)} />
                    </div>
                    <button className="chat-submit" style={{ marginTop: 12 }} onClick={() => {
                        if (!inputValue) return;
                        submitAnswer(step.id, inputValue, `${inputValue} months`);
                    }}>Continue</button>
                </div>
            );
        }

        if (step.type === 'bachelors_search') {
            return (
                <div>
                    <div className="input-group">
                        <input className="chat-input" placeholder={step.placeholder} value={bachelorsSearch} onChange={e => { setBachelorsSearch(e.target.value); setShowBachelorsSearch(true); }} onFocus={() => setShowBachelorsSearch(true)} />
                    </div>
                    {showBachelorsSearch && bachelorsSearch && (
                        <div className="country-search-box" style={{ display: 'block', marginTop: 4 }}>
                            <div className="country-search-results">
                                {ALL_COURSES.filter(c => c.toLowerCase().includes(bachelorsSearch.toLowerCase())).slice(0, 5).map(c => (
                                    <div key={c} className="csr-item" onClick={() => { setBachelorsSearch(c); setShowBachelorsSearch(false); submitAnswer(step.id, c, c); }}>{c}</div>
                                ))}
                                <div className="csr-item" style={{ background: '#f5f3ff', borderTop: '1px dashed #d8b4fe' }} onClick={() => handleAiSearch('course', bachelorsSearch)}>
                                    <span style={{ marginRight: 8 }}>✨</span> AI Search for "{bachelorsSearch}"...
                                </div>
                                {isSearchingAI && <div className="p-3 text-center text-xs text-gray-400">Searching global degrees...</div>}
                                {aiSearchResults.length > 0 && typeof aiSearchResults[0] === 'string' && aiSearchResults.map(c => (
                                    <div key={c} className="csr-item" onClick={() => submitAnswer(step.id, c, c)}>
                                        <span style={{ marginRight: 6 }}>🎓</span> {c}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="chat-submit" style={{ marginTop: 12 }} onClick={() => submitAnswer(step.id, bachelorsSearch, bachelorsSearch)} disabled={!bachelorsSearch}>Continue</button>
                    </div>
                </div>
            );
        }

        if (step.type === 'text') {
            return (
                <div>
                    <div className="input-group">
                        <input className="chat-input" type="text" placeholder={step.placeholder} value={inputValue} onChange={e => setInputValue(e.target.value)} />
                    </div>
                    <button className="chat-submit" style={{ marginTop: 12 }} onClick={() => {
                        if (!inputValue) return;
                        submitAnswer(step.id, inputValue, inputValue);
                    }}>Continue</button>
                </div>
            );
        }

        if (step.type === 'university_preview') {
            if (isUniCounting) return (
                <div className="ai-bubble-row fade-in">
                    <div className="ai-avatar blob-mascot" style={{ width: 32, height: 32, margin: 0, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #6605c7, #a855f7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
                        <span>A</span>
                        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent)' }}></div>
                    </div>
                    <div className="ai-bubble">
                        <div className="typing-dots">
                            <div className="typing-dot"></div><div className="typing-dot"></div><div className="typing-dot"></div>
                        </div>
                    </div>
                </div>
            );

            return (
                <div className="fade-in">
                    <div className="ai-bubble-row fade-in">
                        <div className="ai-avatar blob-mascot" style={{ width: 32, height: 32, margin: 0, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #6605c7, #a855f7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
                            <span>A</span>
                            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent)' }}></div>
                        </div>
                        <div className="ai-bubble">
                            Awesome! I've analyzed the landscape and found over <strong>{uniCountResult?.count || 100}+</strong> universities in <strong>{answers.country?.label}</strong> matching your goals.<br /><br />
                            Let's evaluate your academic profile to see which ones are your best match!
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                        <button className="chat-submit" onClick={() => submitAnswer(step.id, 'viewed', 'Viewed Universities')}>
                            Evaluate My Profile →
                        </button>
                    </div>
                </div>
            );
        }

        return null;
    };

    const renderAiMatch = () => {
        if (isAiMatching) {
            return (
                <div className="ai-bubble-row fade-in">
                    <div className="ai-avatar blob-mascot" style={{ width: 32, height: 32, margin: 0, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #6605c7, #a855f7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
                        <span>A</span>
                        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent)' }}></div>
                    </div>
                    <div className="ai-bubble">
                        <div className="typing-dots">
                            <div className="typing-dot"></div><div className="typing-dot"></div><div className="typing-dot"></div>
                        </div>
                    </div>
                </div>
            );
        }

        const country = answers.country?.value || 'USA';
        const course = answers.course?.value || '';
        const gpa = parseFloat(answers.gpa?.value || '6.5');
        const engTest = answers.english_test?.value || 'none';
        const engScore = parseFloat(answers.english_score?.value || '0');
        const loanAmt = parseInt(answers.loan_amount?.value || '0', 10);
        const workExp = parseInt(answers.work_exp?.value || '0', 10);

        // Only show universities matched via AI Search.
        const pool = (aiUniversities || []).filter((u: any) => (u.country || '').toLowerCase() === (country || '').toLowerCase()).slice(0, 40);

        if (pool.length === 0 && aiUniversities.length > 0) {
            // If filtering by country removed everything but we have results, use the results anyway
            // (user might have typed a different country than their choice)
            pool.push(...aiUniversities.slice(0, 40));
        }

        const scored = pool.map(u => {
            let score = 0;
            const gapGPA = gpa - u.min_gpa;
            if (gapGPA >= 1.0) score += 35; else if (gapGPA >= 0.3) score += 30; else if (gapGPA >= 0) score += 24; else if (gapGPA >= -0.5) score += 14; else if (gapGPA >= -1.0) score += 6;

            if (engTest !== 'none' && engScore > 0) {
                let minReq = u.min_ielts;
                let userScore = engScore;
                if (engTest === 'toefl') minReq = u.min_toefl;
                else if (engTest === 'pte') { minReq = Math.round(u.min_ielts * 9 + 10); userScore = engScore; }
                else if (engTest === 'duolingo') minReq = 100;
                const gap = userScore - minReq;
                if (gap >= 5) score += 25; else if (gap >= 0) score += 20; else if (gap >= -3) score += 12; else score += 5;
            } else score += 12;

            const kws = course.toLowerCase().split(/\s+/);
            const hasMatch = u.courses.some((c: string) => kws.some(k => c.includes(k) || k.includes(c.split(' ')[0])));
            score += hasMatch ? 20 : 8;

            if (u.accept >= 50) score += 15; else if (u.accept >= 25) score += 10; else if (u.accept >= 10) score += 5;
            if (u.loan && loanAmt > 0) score += 5;
            if (workExp >= 12) score += 3; else if (workExp >= 6) score += 1;

            return { ...u, _score: Math.min(score, 100) };
        }).sort((a, b) => b._score - a._score);

        return (
            <div className="fade-in">
                <div className="ai-bubble-row fade-in">
                    <div className="ai-avatar blob-mascot" style={{ width: 32, height: 32, margin: 0, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #6605c7, #a855f7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
                        <span>A</span>
                        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent)' }}></div>
                    </div>
                    <div className="ai-bubble">
                        Matched <strong>{scored.length} top universities</strong> in <strong>{country}</strong> based on your profile!<br />
                        <span style={{ fontSize: 12, color: '#888', marginTop: 4, display: 'block' }}>We've calculated your <strong>Admission Probability</strong> for each based on your GPA and background.</span>
                    </div>
                </div>

                {/* Country Summary Card */}
                <div style={{ margin: '0 0 32px 44px', padding: '20px', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', borderRadius: '24px', border: '1px solid #ddd6fe' }} className="fade-in">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div style={{ fontSize: '24px' }}>{COUNTRY_FLAGS[country] || '🌐'}</div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e' }}>Admission Outlook: {country}</div>
                            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>Profile: {answers.bachelors_degree?.label} from {answers.target_university?.label || 'College'}</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div style={{ background: 'white', padding: '12px', borderRadius: '16px', border: '1px solid #e9d5ff' }}>
                            <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Avg. Chance</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#7c3aed' }}>{Math.round(scored.reduce((acc, u) => acc + (u._score || 0), 0) / (scored.length || 1))}%</div>
                        </div>
                        <div style={{ background: 'white', padding: '12px', borderRadius: '16px', border: '1px solid #e9d5ff' }}>
                            <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Visa Success</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#059669' }}>High</div>
                        </div>
                    </div>

                    <div style={{ marginTop: 16, fontSize: 12, color: '#4b5563', lineHeight: 1.5 }}>
                        💡 <strong>Pro Tip:</strong> Your profile is competitive for {scored[0]?.name}. Our AI suggests you have a high probability of admission in {country} if you apply with your current scores.
                    </div>
                </div>

                <div className="section-label">Your Top Universities in {country}</div>
                <div className="univ-results-grid">
                    {scored.map((u, i) => (
                        <UniversityCard
                            key={u.slug || u.name || i}
                            university={u}
                            onDetails={(uni: any) => setSelectedUniForModal(uni)}
                            onApply={(uni: any) => setSelectedUniForModal(uni)}
                        />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <main className="relative z-10 bg-white min-h-screen">
            <style jsx global>{`
                .progress-track{position:fixed;top:80px;left:0;right:0;z-index:49;height:3px;background:rgba(102,5,199,0.05)}
                .progress-fill{height:3px;background:linear-gradient(90deg,#7c3aed,#6605c7);transition:width 0.55s ease}
                .page-wrap{min-height:100vh;padding-top:100px;padding-bottom:110px}
                .welcome-hero{text-align:center;padding:36px 20px 32px;max-width:720px;margin:0 auto 8px;transition:all 0.5s ease}
                .hero-badge{display:inline-flex;align-items:center;gap:6px;background:white;color:#6605c7;font-size:11px;font-weight:700;padding:4px 12px;border-radius:9999px;margin-bottom:16px;border:1px solid #6605c7/10;box-shadow:0 2px 10px rgba(102,5,199,0.05)}
                .hero-title{font-size:28px;font-weight:bold;color:#1a1626;margin-bottom:12px;letter-spacing:-0.015em}
                .hero-gradient{background:linear-gradient(135deg,#6605c7 0%,#a855f7 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
                .hero-sub{font-size:13px;color:#6b7280;line-height:1.6;max-width:460px;margin:0 auto 22px;font-weight:400}
                .stats-row{display:flex;align-items:center;justify-content:center;gap:0;background:white;border:1px solid #f3f4f6;border-radius:16px;padding:20px;max-width:540px;margin:0 auto;box-shadow:0 4px 20px rgba(0,0,0,0.03)}
                .stat-item{flex:1;text-align:center}
                .stat-number{font-size:18px;font-weight:bold;color:#1a1626}
                .stat-label{font-size:10px;font-weight:600;color:#9ca3af;margin-top:2px;text-transform:uppercase;letter-spacing:0.02em}
                .chat-col{max-width:680px;margin:0 auto;padding:28px 20px 16px}
                .q-row{margin-bottom:4px}
                .q-text{font-size:14px;font-weight:600;color:#1a1626;line-height:1.5;padding:6px 0 2px}
                .ans-row{display:flex;flex-direction:column;align-items:flex-end;margin-bottom:16px}
                .ans-bubble{background:#6605c7;color:#fff;font-size:13px;font-weight:600;padding:8px 16px;border-radius:14px 14px 2px 14px;max-width:75%;animation:popIn 0.3s ease-out forwards}
                .ans-edit{font-size:10px;color:#9ca3af;cursor:pointer;margin-top:4px;display:flex;align-items:center;gap:3px;font-weight:500}
                .ans-edit:hover{color:#6605c7}
                .ia-wrap{margin-bottom:24px}
                .opts-grid{display:grid;gap:8px;margin-top:8px}
                .opts-2{grid-template-columns:repeat(2,1fr)}
                .opts-3{grid-template-columns:repeat(3,1fr)}
                .opt-card{padding:12px 14px;border:1px solid #f3f4f6;border-radius:12px;background:#fff;font-size:13px;font-weight:500;color:#4b5563;cursor:pointer;text-align:center;transition:all 0.15s;box-shadow:0 1px 2px rgba(0,0,0,0.02)}
                .opt-card:hover{border-color:#6605c7;background:#fdfaff;color:#6605c7;transform:translateY(-1px);box-shadow:0 4px 10px rgba(102,5,199,0.05)}
                .goal-grid-3{display:flex;flex-direction:column;gap:12px;margin-top:12px}
                .goal-card-eq{display:flex;align-items:center;gap:16px;padding:18px 20px;border:1.5px solid #f3f4f6;border-radius:16px;background:#fff;cursor:pointer;transition:all 0.2s ease;text-align:left;position:relative}
                .goal-card-eq:hover{border-color:#6605c7;background:#fdfaff;transform:translateY(-2px);box-shadow:0 8px 24px rgba(102,5,199,0.08)}
                .goal-icon-circle{width:52px;height:52px;border-radius:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
                .goal-card-label{flex:1;font-size:15px;font-weight:700;color:#1a1a2e;line-height:1.4}
                .goal-card-arrow{font-size:18px;color:#d1d5db;font-weight:600;transition:color 0.2s}
                .goal-card-eq:hover .goal-card-arrow{color:#6605c7}
                .icon-purple{background:linear-gradient(135deg,rgba(102,5,199,0.08),rgba(168,85,247,0.08));color:#6605c7}
                .icon-green{background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(52,211,153,0.08));color:#10b981}
                .icon-yellow{background:linear-gradient(135deg,rgba(245,158,11,0.08),rgba(251,191,36,0.08));color:#f59e0b}
                .country-img-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:10px}
                .country-img-card{position:relative;border-radius:14px;overflow:hidden;height:120px;border:none;cursor:pointer;background:var(--bg) center/cover;text-align:left;padding:12px;display:flex;flex-direction:column;justify-content:flex-end;transition:all 0.2s}
                .country-img-card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.1)}
                .cic-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.7) 0%,rgba(0,0,0,0.1) 60%)}
                .cic-flag{position:absolute;top:10px;right:10px;width:24px;height:16px;border-radius:3px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.2)}
                .cic-flag-img{width:100%;height:100%;object-fit:cover}
                .cic-name{position:relative;z-index:1;color:#fff;font-weight:700;font-size:14px;line-height:1.2}
                .cic-sub{position:relative;z-index:1;color:rgba(255,255,255,0.7);font-size:9px;font-weight:500;margin-top:1px}
                .country-search-trigger{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#f9fafb;border:1px dashed #e5e7eb;border-radius:12px;cursor:pointer;font-size:13px;color:#6b7280;transition:all 0.2s}
                .country-search-box{margin-top:8px;background:#fff;border:1px solid #f3f4f6;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08)}
                .country-search-input{width:100%;padding:12px 16px;border:none;border-bottom:1px solid #f9fafb;font-size:13px;outline:none}
                .csr-item{padding:10px 16px;font-size:13px;color:#4b5563;cursor:pointer;display:flex;align-items:center;border-bottom:1px solid #f9fafb}
                .csr-item:hover{background:#f9f9fb;color:#6605c7}
                .input-group{position:relative;margin-top:8px}
                .chat-input{width:100%;padding:12px 16px;border:1px solid #f3f4f6;border-radius:12px;font-size:14px;color:#1a1626;outline:none;transition:all 0.2s;background:#fff}
                .chat-input:focus{border-color:#6605c7;box-shadow:0 0 0 4px rgba(102,5,199,0.05)}
                .chat-input.with-prefix{padding-left:32px}
                .input-prefix{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#9ca3af;font-size:14px;font-weight:600}
                .chat-submit{background:#6605c7;color:#fff;border:none;padding:12px 24px;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 10px rgba(102,5,199,0.15)}
                .chat-submit:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(102,5,199,0.2)}
                .months-wrap{margin-top:10px}
                .year-label{font-size:10px;font-weight:700;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px}
                .chips-row{display:flex;flex-wrap:wrap;gap:6px}
                .month-chip{padding:8px 16px;border:1px solid #f3f4f6;border-radius:9999px;background:#fff;font-size:12px;font-weight:600;color:#6b7280;cursor:pointer;transition:all 0.15s}
                .month-chip:hover{border-color:#6605c7;color:#6605c7;background:#fdfaff}
                .gpa-mode-btn{padding:5px 12px;border-radius:9999px;border:1px solid #f3f4f6;background:#fff;font-size:11px;font-weight:600;color:#9ca3af;cursor:pointer;transition:all .15s}
                .gpa-mode-btn.active{background:#6605c7;color:#fff;border-color:#6605c7}
                .ai-bubble-row{display:flex;align-items:flex-start;gap:10px;margin-bottom:16px}
                .ai-bubble{background:#f9fafb;color:#4b5563;font-size:13px;padding:10px 16px;border-radius:2px 14px 14px 14px;max-width:85%;line-height:1.5;border:1px solid #f3f4f6}
                .typing-dots{display:flex;gap:3px;padding:4px 0}
                .typing-dot{width:5px;height:5px;background:#d1d5db;border-radius:50%;animation:bop 1.4s infinite ease-in-out both}
                .typing-dot:nth-child(1){animation-delay:-0.32s}
                .typing-dot:nth-child(2){animation-delay:-0.16s}
                @keyframes bop{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
                .univ-results-grid{display:grid;gap:12px;margin-top:12px}
                .univ-card{background:#fff;border:1px solid #f3f4f6;border-radius:16px;padding:14px;display:flex;gap:14px;position:relative;transition:all 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.02)}
                .univ-card:hover{border-color:#6605c7/20;box-shadow:0 8px 24px rgba(102,5,199,0.06);transform:translateY(-1px)}
                .univ-rank-badge{position:absolute;top:-8px;left:14px;background:#1a1626;color:#fff;font-size:9px;font-weight:800;padding:3px 8px;border-radius:9999px;box-shadow:0 2px 8px rgba(0,0,0,0.1)}
                .univ-card-body{flex:1;min-width:0;padding-top:4px}
                .univ-card-name{font-size:14px;font-weight:700;color:#1a1626;line-height:1.3;margin-bottom:2px}
                .univ-card-location{font-size:11px;color:#9ca3af;margin-bottom:8px}
                .univ-card-tags{display:flex;flex-wrap:wrap;gap:4px}
                .tag{font-size:9px;font-weight:600;padding:3px 8px;border-radius:6px;text-transform:uppercase;letter-spacing:0.02em}
                .tag-rank{background:#f9fafb;color:#6b7280}
                .tag-tuition{background:rgba(245,158,11,0.05);color:#d97706}
                .tag-accept{background:rgba(16,185,129,0.05);color:#059669}
                .tag-loan{background:rgba(102,5,199,0.05);color:#6605c7}
                .match-col{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-width:60px}
                .match-ring{position:relative;width:44px;height:44px}
                .match-ring svg{width:100%;height:100%;transform:rotate(-90deg)}
                .ring-bg{fill:none;stroke:#f3f4f6;stroke-width:3}
                .ring-fill{fill:none;stroke-width:3;stroke-linecap:round;transition:stroke-dashoffset 1s ease-out}
                .ring-text{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#1a1626}
                .match-high .ring-fill{stroke:#10b981}
                .match-mid .ring-fill{stroke:#f59e0b}
                .match-low .ring-fill{stroke:#6605c7}
                .univ-apply-btn{background:#fff;border:1px solid #f3f4f6;color:#1a1626;font-size:11px;font-weight:700;padding:6px 14px;border-radius:9999px;cursor:pointer;transition:all 0.2s}
                .univ-apply-btn:hover{background:#fdfaff;border-color:#6605c7;color:#6605c7}
                .section-label{display:flex;align-items:center;gap:10px;font-size:11px;font-weight:700;color:#d1d5db;letter-spacing:1px;text-transform:uppercase;margin:32px 0 16px}
                .section-label::after{content:'';flex:1;height:1px;background:#f3f4f6}
                .fade-in{animation:fadeIn 0.4s ease forwards}
                @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
                .sp-toast{position:fixed;bottom:90px;left:20px;z-index:9000;background:#fff;border:1px solid #f3f4f6;border-radius:16px;padding:10px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 8px 30px rgba(0,0,0,0.06);max-width:260px;min-width:200px;transform:translateX(-120%);opacity:0;transition:all 0.5s cubic-bezier(0.175,0.885,0.32,1.275)}
                .sp-toast.show{transform:translateX(0);opacity:1}
                .sp-avatar{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#6605c7);display:flex;align-items:center;justify-content:center;flex-shrink:0}
                .sp-name{font-size:11px;font-weight:700;color:#1a1626}
                .sp-msg{font-size:10px;color:#9ca3af;line-height:1.3;margin-top:1px}
                .sp-check{width:14px;height:14px;border-radius:50%;background:#dcfce7;color:#16a34a;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;flex-shrink:0}
            `}</style>

            <div className="progress-track">
                <div ref={progressRef} className="progress-fill" style={{ width: '0%' }} />
            </div>

            {!hasStarted ? (
                <div className="welcome-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px', textAlign: 'center', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
                    <div style={{ maxWidth: '600px', background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                        <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #f3e8ff, #ede9fe)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(124,58,237,0.12)' }}>
                            <span style={{ fontSize: '40px' }}>🎓</span>
                        </div>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1f2937', marginBottom: '12px', lineHeight: 1.3 }}>Looking for answers to your<br /><span style={{ background: 'linear-gradient(135deg,#6605c7,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>masters abroad</span> questions?</h1>
                        <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: '1.6', marginBottom: '32px' }}>
                            We've helped over <strong style={{ color: '#7c3aed' }}>2.6 lakh</strong> students across <strong style={{ color: '#7c3aed' }}>18+</strong> countries and <strong style={{ color: '#7c3aed' }}>18,000+</strong> programs. Let's find the right path for you.
                        </p>
                        <button
                            onClick={() => setHasStarted(true)}
                            style={{
                                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '16px 40px',
                                borderRadius: '100px',
                                fontSize: '18px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            Let's begin
                        </button>
                    </div>
                </div>
            ) : (
                <div className="page-wrap">
                    <div className="welcome-hero" ref={heroRef}>
                        <div className="hero-badge">
                            <span className="hero-badge-dot" style={{ width: 6, height: 6, background: '#a855f7', borderRadius: '50%' }} />
                            AI-Powered Study Abroad Assistant
                        </div>
                        <h1 className="hero-title">Your <span className="hero-gradient">Masters Abroad</span><br />Journey Starts Here</h1>
                        <p className="hero-sub">Answer a few quick questions — we'll match you with the best universities, loans, and admission chances in under 2 minutes.</p>

                        <div className="stats-row">
                            <div className="stat-item">
                                <div className="stat-number" id="stat1">0</div>
                                <div className="stat-label">Students Helped</div>
                            </div>
                            <div style={{ width: 1, height: 36, background: '#ede9fe' }} />
                            <div className="stat-item">
                                <div className="stat-number" id="stat2">₹0 Cr+</div>
                                <div className="stat-label">Loans Disbursed</div>
                            </div>
                            <div style={{ width: 1, height: 36, background: '#ede9fe' }} />
                            <div className="stat-item">
                                <div className="stat-number" id="stat3">0%</div>
                                <div className="stat-label">Approval Rate</div>
                            </div>
                            <div style={{ width: 1, height: 36, background: '#ede9fe' }} />
                            <div className="stat-item">
                                <div className="stat-number" id="stat4">0</div>
                                <div className="stat-label">Partner Banks</div>
                            </div>
                        </div>
                    </div>

                    <div className="chat-col">
                        {steps.map((step, idx) => {
                            if (idx > currentIdx) return null;

                            // Hide steps that don't belong to the selected flow
                            const goal = answers.goal?.value;
                            if (step.flows && goal && !step.flows.includes(goal)) return null;
                            // Hide steps whose skipIf condition is met
                            if (step.skipIf) {
                                const ref = answers[step.skipIf.key];
                                if (ref && ref.value === step.skipIf.value) return null;
                            }

                            const isCompleted = idx < currentIdx;
                            const answer = answers[step.id];

                            // ── uni_count: auto step showing total universities found ──
                            if (step.type === 'uni_count') {
                                // While counting: show pulsing skeleton
                                if (idx === currentIdx && isUniCounting) {
                                    return (
                                        <div key={step.id} className="fade-in" style={{ marginBottom: 24 }}>
                                            <div className="ai-bubble-row">
                                                <div className="ai-avatar blob-mascot" style={{ width: 32, height: 32, margin: 0, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #6605c7, #a855f7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
                                                    <span>A</span>
                                                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent)' }}></div>
                                                </div>
                                                <div className="ai-bubble">
                                                    <div className="typing-dots">
                                                        <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                // After counting: show the university count card
                                if (uniCountResult && (idx === currentIdx || isCompleted)) {
                                    return (
                                        <div key={step.id} className="fade-in" style={{ marginBottom: 20 }}>
                                            <div style={{
                                                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                                                border: '1.5px solid #86efac',
                                                borderRadius: 20,
                                                padding: '20px 24px',
                                                maxWidth: 480,
                                            }}>
                                                {/* Count header */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                                    <div style={{ fontSize: 28 }}>🎓</div>
                                                    <div>
                                                        <div style={{ fontWeight: 800, color: '#14532d', fontSize: 16 }}>
                                                            Found{' '}
                                                            <span style={{ color: '#16a34a', fontSize: 22 }}>{uniCountResult.count}+</span>
                                                            {' '}universities
                                                        </div>
                                                        <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 600 }}>
                                                            in {uniCountResult.country} offering {uniCountResult.course}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Sample university names */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    {uniCountResult.names.map((name, i) => (
                                                        <div key={name} style={{
                                                            display: 'flex', alignItems: 'center', gap: 8,
                                                            padding: '8px 12px',
                                                            background: 'rgba(255,255,255,0.7)',
                                                            borderRadius: 10,
                                                            fontSize: 13, fontWeight: 600, color: '#166534'
                                                        }}>
                                                            <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', minWidth: 18 }}>#{i + 1}</span>
                                                            {name}
                                                        </div>
                                                    ))}
                                                    <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 600, paddingLeft: 4, marginTop: 2 }}>
                                                        + {uniCountResult.count - uniCountResult.names.length} more…
                                                    </div>
                                                </div>

                                                {/* Transition message */}
                                                <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(255,255,255,0.6)', borderRadius: 12, fontSize: 13, color: '#15803d', fontWeight: 600 }}>
                                                    ✨ Now I'll ask a few more questions to personalise your matches!
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }

                            if (step.type === 'ai_search') {
                                if (idx === currentIdx && isAiSearching) {
                                    const country = answers.country?.value || 'USA';
                                    const course = answers.course?.value || '';
                                    const bachelors = answers.bachelors_degree?.label || '';
                                    const gpaLabel = answers.gpa?.label || '';
                                    return (
                                        <div key={step.id} className="fade-in" style={{ marginBottom: 24 }}>
                                            {/* AI profile analysis card */}
                                            <div style={{
                                                background: 'linear-gradient(135deg, #faf5ff, #f5f3ff)',
                                                border: '1.5px solid #e9d5ff',
                                                borderRadius: 20,
                                                padding: '24px 28px',
                                                maxWidth: 480,
                                            }}>
                                                {/* Header */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                                    <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #7c3aed, #6605c7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🤖</div>
                                                    <div>
                                                        <div style={{ fontWeight: 800, color: '#1a1a2e', fontSize: 15 }}>AI is analysing your profile…</div>
                                                        <div style={{ fontSize: 12, color: '#9ca3af' }}>Searching across 500+ universities worldwide</div>
                                                    </div>
                                                </div>

                                                {/* Profile summary chips */}
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                                                    {[
                                                        { icon: '🌍', label: country },
                                                        { icon: '📚', label: course || 'Course' },
                                                        { icon: '🎓', label: bachelors || 'Bachelor\'s' },
                                                        { icon: '📊', label: gpaLabel || 'GPA' },
                                                    ].map((chip) => (
                                                        <div key={chip.label} style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: 6,
                                                            padding: '6px 12px', background: 'white',
                                                            border: '1.5px solid #e9d5ff', borderRadius: 9999,
                                                            fontSize: 12, fontWeight: 700, color: '#4c1d95'
                                                        }}>
                                                            <span>{chip.icon}</span>
                                                            <span>{chip.label}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Scanning steps */}
                                                {[
                                                    { done: true, text: 'Profile captured & validated' },
                                                    { done: true, text: `Filtering universities in ${country}` },
                                                    { done: false, text: 'Matching GPA eligibility criteria' },
                                                    { done: false, text: 'Ranking by course fit & acceptance rate' },
                                                ].map((s, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                                        {s.done ? (
                                                            <div style={{ width: 20, height: 20, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, color: '#15803d' }}>✓</div>
                                                        ) : (
                                                            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #a855f7', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                                                        )}
                                                        <span style={{ fontSize: 13, color: s.done ? '#6b7280' : '#4c1d95', fontWeight: s.done ? 500 : 700 }}>{s.text}</span>
                                                    </div>
                                                ))}

                                                {/* Progress bar */}
                                                <div style={{ marginTop: 16, height: 4, background: '#ede9fe', borderRadius: 9999, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', background: 'linear-gradient(90deg, #7c3aed, #a855f7)', borderRadius: 9999, width: '65%', animation: 'growBar 2.8s ease forwards' }} />
                                                </div>
                                                <style>{`
                                                    @keyframes spin { to { transform: rotate(360deg); } }
                                                    @keyframes growBar { from { width: 20%; } to { width: 92%; } }
                                                `}</style>
                                            </div>
                                        </div>
                                    );
                                }
                                if (isCompleted) {
                                    const country = answers.country?.value || 'USA';
                                    const course = answers.course?.value || '';
                                    const gpaLabel = answers.gpa?.label || '';
                                    return (
                                        <div key={step.id} className="ai-bubble-row fade-in">
                                            <div className="ai-avatar blob-mascot" style={{ width: 32, height: 32, margin: 0, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #6605c7, #a855f7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
                                                <span>A</span>
                                                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent)' }}></div>
                                            </div>
                                            <div className="ai-bubble">
                                                ✅ Found <span style={{ color: '#6605c7', fontWeight: 800 }}>{aiUniversities.length}+</span> universities in <strong>{country}</strong> for <strong>{course || 'your course'}</strong> matching your <strong>{gpaLabel}</strong> score!
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }

                            if (step.type === 'ai_match') {
                                if (idx === currentIdx) {
                                    return <div key={step.id}>{renderAiMatch()}</div>;
                                }
                                return null;
                            }

                            return (
                                <div key={step.id} className="fade-in" style={{ marginBottom: 24 }}>
                                    {step.header && <div className="text-center mb-8 fade-in"><h1 className="text-3xl font-bold text-gray-800">{step.header}</h1></div>}
                                    {step.q && (
                                        <div className="ai-bubble-row fade-in" style={{ marginBottom: 8 }}>
                                            <div className="ai-avatar blob-mascot" style={{ width: 32, height: 32, margin: 0, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #6605c7, #a855f7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', fontWeight: 'bold', flexShrink: 0 }}>
                                                <span>A</span>
                                                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent)' }} />
                                            </div>
                                            <div className="ai-bubble"><p style={{ margin: 0 }}>{step.q}</p></div>
                                        </div>
                                    )}

                                    {!isCompleted ? (
                                        <div className="ia-wrap">
                                            {renderInteraction(step, idx)}
                                        </div>
                                    ) : (
                                        answer && (
                                            <div className="ans-row fade-in">
                                                <div className="ans-bubble">{answer.label}</div>
                                                <span className="ans-edit" onClick={() => editStep(idx)}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 11, height: 11 }}>
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                    Edit
                                                </span>
                                            </div>
                                        )
                                    )}
                                </div>
                            );
                        })}
                        <div ref={chatEndRef} />
                    </div>
                </div>
            )}

            <div className={`sp-toast ${toastData ? 'show' : ''}`} style={{ transitionDelay: '0.05s' }}>
                {toastData && (
                    <>
                        <div className="sp-avatar"><span style={{ color: '#fff', fontWeight: 800 }}>{toastData.letter}</span></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="sp-name">{toastData.name}</div>
                            <div className="sp-msg" dangerouslySetInnerHTML={{ __html: toastData.msg }} />
                            <div style={{ fontSize: 10, color: '#c4b5d4', marginTop: 2 }}>{toastData.time}</div>
                        </div>
                        <div className="sp-check">✓</div>
                    </>
                )}
            </div>
            {/* ══════════════ CLEAN & NEAT UNIVERSITY DETAIL MODAL ══════════════ */}
            {selectedUniForModal && (() => {
                const u = selectedUniForModal;
                const admitChance = u._score || Math.min(92, Math.round((10 - (u.min_gpa || 7)) * 17 + (u.accept || 28)));
                const loanChance = u.loan ? 88 : 62;
                const roi = Math.min(72, Math.round(admitChance * 0.62));
                const tuitionInr = Math.round((u.tuition || 30000) * 85);
                const livingInr = Math.round((u.tuition || 30000) * 0.55 * 85);
                const totalInr = tuitionInr + livingInr;
                const medInr = Math.round((u.tuition || 30000) * 3.4 * 85 / 4);
                const courseName = u.courses?.[0] || answers.course?.value || "Master's Program";
                const isStem = ['AI', 'ML', 'CS', 'Software', 'Data', 'Comp', 'Eng', 'Tech', 'Cyber', 'Quant'].some((k: string) => courseName.toLowerCase().includes(k.toLowerCase()));
                const category = isStem ? 'STEM' : 'Business';
                const flag = COUNTRY_FLAGS[u.country] || '🌐';

                const Ring = ({ pct, color, label, value }: { pct: number; color: string; label: string; value: string }) => {
                    const r = 30, circ = 2 * Math.PI * r;
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{ position: 'relative', width: 72, height: 72 }}>
                                <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
                                    <circle cx="36" cy="36" r={r} fill="none" stroke="#f1f5f9" strokeWidth="6" />
                                    <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
                                        strokeDasharray={circ} strokeDashoffset={circ - (circ * pct / 100)}
                                        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                                </svg>
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: 13, fontWeight: 900, color: '#1a1a2e' }}>{value}</span>
                                </div>
                            </div>
                            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>{label}</div>
                        </div>
                    );
                };

                return (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setSelectedUniForModal(null)}>
                        <div style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', background: '#fff', display: 'flex', flexDirection: 'column', position: 'relative', animation: 'modalSlideUp 0.4s ease-out', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }} onClick={e => e.stopPropagation()}>

                            {/* ── TOP HEADER (CLEAN & MINIMAL) ── */}
                            <div style={{ flexShrink: 0, padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white' }}>
                                <div style={{ display: 'flex', items: 'center', gap: 14 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#6605c7' }}>{u.name?.[0] || 'U'}</div>
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 }}>{flag} {u.country}</div>
                                        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>{u.name}</h2>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedUniForModal(null)} style={{ width: 36, height: 36, borderRadius: '50%', background: '#f8fafc', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                            </div>

                            {/* ── SCROLLABLE AREA ── */}
                            <div style={{ flex: 1, overflowY: 'auto', background: '#fcfcfe', paddingBottom: 100 }}>

                                {/* ── HERO SUMMARY CARD ── */}
                                <div style={{ margin: '24px 32px', background: 'white', borderRadius: 24, padding: '32px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', marginBottom: 6 }}>Target Program</div>
                                                <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: 1.1 }}>{courseName}</h1>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                                                    {[category, '2 Years', u.rank ? `QS #${u.rank}` : null, u.loc ? u.loc.split(',')[0] : null].filter(Boolean).map((tag, i) => (
                                                        <span key={i} style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', background: '#f5f3ff', color: '#7c3aed', borderRadius: 9999 }}>{tag}</span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Top Stat Boxes */}
                                            <div style={{ display: 'flex', gap: 20 }}>
                                                <Ring pct={admitChance} color="#6605c7" label="Admit Match" value={`${admitChance}%`} />
                                                <Ring pct={loanChance} color="#0d9488" label="Loan Match" value={loanChance >= 75 ? 'High' : 'Med'} />
                                            </div>
                                        </div>

                                        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                                            {u.description || `Explore ${u.name}, a leading institution in ${u.country} renowned for its academic excellence. Join a global community and accelerate your career with world-class faculty and state-of-the-art facilities.`}
                                        </p>
                                    </div>
                                </div>

                                {/* ── QUICK STATS GRID ── */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, margin: '0 32px 32px' }}>
                                    {[
                                        { label: 'Estimated Cost', val: `₹${(totalInr / 100000).toFixed(1)}L`, icon: '💰' },
                                        { label: 'Acceptance Rate', val: `${u.accept || '—'}%`, icon: '📊' },
                                        { label: 'Min GPA Req', val: `${u.min_gpa || 6.5}/10`, icon: '🎓' },
                                        { label: 'Entrance Req', val: u.min_ielts ? `IELTS ${u.min_ielts}` : 'Waivable*', icon: '📄' }
                                    ].map((stat, i) => (
                                        <div key={i} style={{ background: 'white', padding: '16px', borderRadius: 20, border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                            <div style={{ fontSize: 20, marginBottom: 8 }}>{stat.icon}</div>
                                            <div style={{ fontSize: 15, fontWeight: 900, color: '#1e293b' }}>{stat.val}</div>
                                            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginTop: 2 }}>{stat.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* ── CONTENT SECTIONS ── */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, margin: '0 32px' }}>

                                    {/* Left Column */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                        {/* Admission Criteria Table */}
                                        <div style={{ background: 'white', borderRadius: 24, padding: '24px', border: '1px solid #f1f5f9' }}>
                                            <h3 style={{ fontSize: 13, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 20 }}>Academic Fit</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                                {[
                                                    { req: 'GPA (out of 10)', min: (u.min_gpa || 7.0), yours: answers.gpa?.value || '0', ok: parseFloat(answers.gpa?.value || '0') >= (u.min_gpa || 7.0) },
                                                    { req: 'Language Proficiency', min: (u.min_ielts || 6.5), yours: answers.english_score?.value || '0', ok: parseFloat(answers.english_score?.value || '0') >= (u.min_ielts || 6.5) }
                                                ].map((r, i) => (
                                                    <div key={i} style={{ display: 'flex', items: 'center', justifyContent: 'space-between', padding: '12px 16px', background: r.ok ? '#f0fdf4' : '#fff1f2', borderRadius: 16 }}>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: r.ok ? '#166534' : '#991b1b' }}>{r.req}</div>
                                                        <div style={{ display: 'flex', items: 'center', gap: 12 }}>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div style={{ fontSize: 12, fontWeight: 800, color: r.ok ? '#15803d' : '#ef4444' }}>{r.ok ? '✓ Match' : '✗ Below Req.'}</div>
                                                                <div style={{ fontSize: 10, color: r.ok ? '#16a34a' : '#ef4444', opacity: 0.7 }}>Min: {r.min}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Cost Breakdown */}
                                        <div style={{ background: 'white', borderRadius: 24, padding: '24px', border: '1px solid #f1f5f9' }}>
                                            <h3 style={{ fontSize: 13, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 20 }}>Financial Outlook (Yearly)</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                                {[
                                                    { label: 'Tuition Fees', val: tuitionInr, color: '#7c3aed' },
                                                    { label: 'Living Expenses', val: livingInr, color: '#6366f1' }
                                                ].map((cost, i) => (
                                                    <div key={i}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>{cost.label}</span>
                                                            <span style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>₹{cost.val.toLocaleString('en-IN')}</span>
                                                        </div>
                                                        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999 }}>
                                                            <div style={{ height: '100%', background: cost.color, borderRadius: 999, width: `${(cost.val / totalInr) * 100}%` }} />
                                                        </div>
                                                    </div>
                                                ))}
                                                <div style={{ marginTop: 8, padding: '16px', background: '#f8fafc', borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>Combined Total</span>
                                                    <span style={{ fontSize: 18, fontWeight: 900, color: '#7c3aed' }}>₹{totalInr.toLocaleString('en-IN')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                        {/* Expert Consultation */}
                                        <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderRadius: 24, padding: '24px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                                            <div style={{ position: 'absolute', top: -10, right: -10, width: 80, height: 80, background: 'white', opacity: 0.05, borderRadius: '50%' }} />
                                            <h3 style={{ fontSize: 12, fontWeight: 900, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Expert Guidance</h3>
                                            <p style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.5, marginBottom: 20 }}>Get a free 15-min profile evaluation from our senior study abroad consultants.</p>
                                            <button style={{ width: '100%', padding: '12px', background: 'white', color: '#1e1b4b', border: 'none', borderRadius: 14, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Book Free Call</button>
                                        </div>

                                        {/* Official Links */}
                                        <div style={{ background: 'white', borderRadius: 24, padding: '24px', border: '1px solid #f1f5f9' }}>
                                            <h3 style={{ fontSize: 13, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>Official Portal</h3>
                                            {u.website ? (
                                                <a href={u.website} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: '#f8fafc', borderRadius: 16, textDecoration: 'none' }}>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Visit Website</span>
                                                    <span style={{ color: '#94a3b8' }}>↗</span>
                                                </a>
                                            ) : (
                                                <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 16, fontSize: 12, color: '#64748b', textAlign: 'center' }}>Official portal not available</div>
                                            )}
                                        </div>

                                        {/* Loan Feature */}
                                        <div style={{ background: '#fdf4ff', borderRadius: 24, padding: '24px', border: '1px solid #f5d0fe' }}>
                                            <div style={{ display: 'flex', items: 'center', gap: 10, marginBottom: 12 }}>
                                                <span style={{ fontSize: 20 }}>⚡</span>
                                                <span style={{ fontSize: 13, fontWeight: 900, color: '#86198f' }}>Instant Loan Check</span>
                                            </div>
                                            <p style={{ fontSize: 12, color: '#a21caf', lineHeight: 1.4, margin: '0 0 16px' }}>Pre-approve your education loan for {u.name} in minutes.</p>
                                            <button onClick={() => { setSelectedUniForModal(null); window.location.href = '/loans/apply'; }} style={{ width: '100%', padding: '10px', background: '#86198f', color: 'white', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>Check Eligibility</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── STICKY FOOTER ── */}
                            <div style={{ flexShrink: 0, padding: '20px 32px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 16 }}>
                                <button onClick={() => setSelectedUniForModal(null)} style={{ flex: 1, padding: '14px', background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: 16, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>Close</button>
                                <button onClick={() => { setSelectedUniForModal(null); window.location.href = '/loans/apply?university=' + encodeURIComponent(u.name); }} style={{ flex: 2, padding: '14px', background: '#6605c7', color: 'white', border: 'none', borderRadius: 16, fontWeight: 900, fontSize: 14, cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(102, 5, 199, 0.3)' }}>Apply with VidhyaLoans →</button>
                            </div>

                            <style>{`
                                @keyframes modalSlideUp {
                                    from { opacity: 0; transform: translateY(40px) scale(0.98); }
                                    to { opacity: 1; transform: translateY(0) scale(1); }
                                }
                            `}</style>
                        </div>
                    </div>
                );
            })()}

        </main>
    );
}
