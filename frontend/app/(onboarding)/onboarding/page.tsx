

"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import UniversityCard from "@/components/UniversityCard";

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

const steps = [
    {
        id: 'goal',
        header: "Looking for answers to your masters abroad questions?",
        q: "How can we support you with your master's?",
        type: 'goal_grid',
        options: [
            { value: 'plan', label: "Help me find the right university", icon: 'help', iconClass: 'icon-purple' },
            { value: 'loan', label: 'Need help with an education loan', icon: 'payments', iconClass: 'icon-green' },
            { value: 'compare', label: 'Evaluate my shortlisted universities', icon: 'menu_book', iconClass: 'icon-yellow' },
        ]
    },
    // Plan flow intro (appreciation + begin)
    {
        id: 'plan_intro',
        type: 'plan_intro',
        flows: ['plan']
    },
    {
        id: 'country',
        q: "Which country would you like to study in?",
        type: 'countries',
        options: [
            { value: 'USA', label: 'USA' }, { value: 'UK', label: 'UK' }, { value: 'Canada', label: 'Canada' },
            { value: 'Australia', label: 'Australia' }, { value: 'Germany', label: 'Germany' }, { value: 'Ireland', label: 'Ireland' },
            { value: 'Other', label: 'Other' },
        ],
        flows: ['plan', 'loan', 'compare']
    },

    // Course / Field selection (popular chips + search)
    {
        id: 'course',
        q: "Perfect, let's narrow it down. Which field interests you the most?",
        type: 'course_search',
        placeholder: 'e.g. Computer Science, Data Science, MBA',
        flows: ['plan']
    },

    // Show a quick count of programs matching the selected field in the selected country
    {
        id: 'university_preview',
        type: 'university_preview',
        flows: ['plan']
    },

    // When do you plan to start?
    {
        id: 'start_when',
        q: "When are you planning to start your Master's?",
        type: 'months',
        year: new Date().getFullYear(),
        months: ['Jan to Mar', 'Apr to Jun', 'Jul to Sep', 'Oct to Dec'],
        flows: ['plan']
    },

    // Profile collection
    {
        id: 'bachelors_degree',
        q: "What is your bachelor's degree?",
        type: 'bachelors_search',
        placeholder: 'e.g. B.Tech in Computer Science',
        flows: ['plan']
    },
    {
        id: 'target_university',
        q: "Any specific university you're targeting? (optional)",
        type: 'university_search',
        flows: ['plan']
    },
    {
        id: 'work_exp',
        q: "Enter your work experience (in months).",
        type: 'number',
        placeholder: '0',
        flows: ['plan']
    },
    {
        id: 'gpa',
        q: "What is your current academic score (CGPA / Percentage)?",
        type: 'gpa_input',
        flows: ['plan']
    },

    // Entrance / standardized tests (GRE/GMAT/TOEFL etc)
    {
        id: 'entrance_test',
        q: "Have you taken any entrance or standardized tests?",
        type: 'cards',
        cols: 3,
        options: [
            { value: 'gre', label: 'GRE' }, { value: 'gmat', label: 'GMAT' }, { value: 'toefl', label: 'TOEFL' },
            { value: 'ielts', label: 'IELTS' }, { value: 'none', label: 'None' }
        ],
        flows: ['plan']
    },
    {
        id: 'entrance_score',
        type: 'exam_score',
        flows: ['plan']
    },

    // ai_search fires AFTER data collection for any flow
    {
        id: 'ai_search',
        type: 'ai_search',
        flows: ['plan', 'compare', 'loan']
    },
    {
        id: 'ai_match',
        type: 'ai_match',
        flows: ['plan', 'compare', 'loan']
    }
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

    // Fetch AI results helper — used by ai_search and by preview "show all" actions
    const fetchAiResults = async (opts?: { advanceToMatch?: boolean }) => {
        const country = answers.country?.value || 'USA';
        const course = answers.course?.value || '';
        const gpa = parseFloat(answers.gpa?.value || '0');
        const bachelors = answers.bachelors_degree?.value || '';
        const targetUni = answers.target_university?.label || '';

        setIsAiSearching(true);
        try {
            const resp = await fetch('/api/ai-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ country, course, gpa, bachelors, target_university: targetUni })
            });
            const data = await resp.json();
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

    // Handle auto steps
    useEffect(() => {
        const step = steps[currentIdx];
        if (!step) return;

        // If a step declares `flows`, ensure we are in the selected goal flow.
        // If no goal selected yet, wait. If step isn't part of the flow, auto-skip it.
        if (step.flows) {
            const goal = answers.goal?.value;
            if (!goal) return; // wait for user to pick a goal first
            if (!step.flows.includes(goal)) {
                setCurrentIdx(currentIdx + 1);
                return;
            }
        }

        // ── university_preview: show universities in the selected country ──
        if (step.type === 'university_preview' && !isUniCounting && !uniCountResult) {
            setIsUniCounting(true);
            const country = answers.country?.value || '';
            const course = answers.course?.value || '';

            const loadPreview = async () => {
                try {
                    const res = await fetch('/api/ai-search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ country, course })
                    });
                    const data = await res.json();
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
                    const resp = await fetch('/api/ai-search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ country, course, gpa, bachelors, target_university: targetUni })
                    });
                    const aiData = await resp.json();
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
                    setCurrentIdx(currentIdx + 1);
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

        // Skip english score if none
        if (step.id === 'english_score' && answers.english_test?.value === 'none') {
            setAnswers(prev => ({ ...prev, english_score: { value: 'none', label: 'N/A' } }));
            setCurrentIdx(currentIdx + 1);
        }

        // Skip entrance exam score if none
        if (step.id === 'entrance_score' && answers.entrance_test?.value === 'none') {
            setAnswers(prev => ({ ...prev, entrance_score: { value: 'none', label: 'N/A' } }));
            setCurrentIdx(currentIdx + 1);
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
        setAnswers(prev => ({ ...prev, [stepId]: { value, label } }));
        setInputValue('');
        setGpaValue('');
        setAiSearchResults([]); // clear AI results
        setIsSearchingAI(false);
        setCurrentIdx(currentIdx + 1);
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

            const resp = await fetch('/api/ai-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, type, ...context })
            });
            const data = await resp.json();
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
            setAiSearchResults([]);
            return;
        }
        aiSearchDebounceRef.current = window.setTimeout(() => {
            handleAiSearch('university', inputValue.trim());
        }, 400);

        return () => { if (aiSearchDebounceRef.current) window.clearTimeout(aiSearchDebounceRef.current); };
    }, [inputValue, currentIdx]);

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
                <div className="goal-grid">
                    <div className="goal-card-large opt-card" onClick={() => submitAnswer(step.id, o[0].value, o[0].label)}>
                        <div className={"icon-box " + o[0].iconClass}><span className="material-symbols-outlined text-3xl">{o[0].icon}</span></div>
                        <p className="font-bold text-gray-700">{o[0].label}</p>
                    </div>
                    <div className="goal-card-small opt-card" onClick={() => submitAnswer(step.id, o[1].value, o[1].label)}>
                        <div className={"icon-box " + o[1].iconClass + " text-2xl"}><span className="material-symbols-outlined">{o[1].icon}</span></div>
                        <p className="text-sm font-semibold text-gray-600">{o[1].label}</p>
                    </div>
                    <div className="goal-card-small opt-card" onClick={() => submitAnswer(step.id, o[2].value, o[2].label)}>
                        <div className={"icon-box " + o[2].iconClass + " text-2xl"}><span className="material-symbols-outlined">{o[2].icon}</span></div>
                        <p className="text-sm font-semibold text-gray-600">{o[2].label}</p>
                    </div>
                </div>
            );
        }

        if (step.type === 'countries') {
            return (
                <div>
                    <div className="country-img-grid">
                        {step.options.filter((o: any) => o.value !== 'Other').map((o: any) => {
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

        if (step.type === 'university_search') {
            return (
                <div>
                    <div className="input-group">
                        <input className="chat-input" placeholder="Search university (type name)..." value={inputValue} onChange={e => setInputValue(e.target.value)} />
                    </div>
                    {inputValue && (
                        <div className="country-search-box" style={{ display: 'block', marginTop: 8 }}>
                            <div className="country-search-results">
                                {/* AI Search Option for Unis */}
                                <div className="csr-item" style={{ background: '#f5f3ff', borderTop: '1px dashed #d8b4fe' }}
                                    onClick={() => handleAiSearch('university', inputValue)}>
                                    <span style={{ marginRight: 8 }}>🌍</span> Search AI Global University Database...
                                </div>
                                {isSearchingAI && <div className="p-3 text-center text-xs text-gray-400">Loading from AI index...</div>}
                                {aiSearchResults.length > 0 && typeof aiSearchResults[0] === 'object' && aiSearchResults.map(u => (
                                    <div key={u.slug} className="csr-item" style={{ borderLeft: '3px solid #7c3aed' }} onClick={() => submitAnswer(step.id, u.slug, u.name)}>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                            <div style={{ width: 36, height: 36, background: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eee' }}>🏛️</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 700 }}>{u.name} <span style={{ fontSize: 10, color: '#7c3aed', background: '#f5f3ff', padding: '1px 4px', borderRadius: 4, marginLeft: 4 }}>AI</span></div>
                                                <div style={{ fontSize: 11, color: '#6b7280' }}>{u.loc} • Rank #{u.rank}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button className="chat-submit" style={{ marginTop: 12, background: 'none', border: '1px solid #7c3aed', color: '#7c3aed' }}
                            onClick={() => handleAiSearch('university', inputValue)} disabled={!inputValue || isSearchingAI}>
                            {isSearchingAI ? 'Searching...' : 'AI Global Search'}
                        </button>
                        <button className="chat-submit" style={{ marginTop: 12 }} onClick={() => submitAnswer(step.id, inputValue, inputValue)} disabled={!inputValue}>Continue</button>
                    </div>
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
                        <UniversityCard key={u.slug || u.name || i} uni={u as any} index={i} />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <main className="relative z-10 bg-white min-h-screen">
            <style jsx global>{`
                .progress-track{position:fixed;top:80px;left:0;right:0;z-index:49;height:3px;background:#f0e9fc}
                .progress-fill{height:3px;background:linear-gradient(90deg,#7c3aed,#6605c7);transition:width 0.55s ease}
                .page-wrap{min-height:100vh;padding-top:100px;padding-bottom:110px}
                .welcome-hero{text-align:center;padding:36px 20px 32px;max-width:720px;margin:0 auto 8px;transition:all 0.5s ease}
                .hero-badge{display:inline-flex;align-items:center;gap:7px;background:linear-gradient(135deg,#ede9fe,#e0d9ff);color:#6605c7;font-size:11.5px;font-weight:700;padding:5px 14px;border-radius:9999px;margin-bottom:16px;border:1px solid #d8b4fe}
                .hero-title{font-size:clamp(24px,5vw,34px);font-weight:800;color:#1a1a2e;margin-bottom:12px}
                .hero-gradient{background:linear-gradient(135deg,#6605c7 0%,#a855f7 50%,#7c3aed 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
                .hero-sub{font-size:14.5px;color:#6b7280;line-height:1.6;max-width:480px;margin:0 auto 22px}
                .stats-row{display:flex;align-items:center;justify-content:center;gap:0;background:linear-gradient(135deg,#faf5ff,#f5f3ff);border:1.5px solid #ede9fe;border-radius:18px;padding:20px 24px;max-width:560px;margin:0 auto;box-shadow:0 4px 24px rgba(102,5,199,0.07)}
                .stat-item{flex:1;text-align:center}
                .stat-number{font-size:22px;font-weight:800;color:#6605c7}
                .stat-label{font-size:10px;font-weight:600;color:#9ca3af;margin-top:4px}
                .chat-col{max-width:720px;margin:0 auto;padding:28px 20px 16px}
                .q-row{margin-bottom:6px}
                .q-text{font-size:15.5px;font-weight:500;color:#1a1a2e;line-height:1.55;padding:6px 0 2px}
                .ans-row{display:flex;flex-direction:column;align-items:flex-end;margin-bottom:18px}
                .ans-bubble{background:#ede9fe;color:#2d1a4e;font-size:14.5px;font-weight:700;padding:10px 18px;border-radius:18px 18px 4px 18px;max-width:72%;animation:popIn 0.35s cubic-bezier(0.175,0.885,0.32,1.275) forwards}
                .ans-edit{font-size:11px;color:#c4b5d4;cursor:pointer;margin-top:5px;display:flex;align-items:center;gap:3px}
                .ans-edit:hover{color:#6605c7}
                .ia-wrap{margin-bottom:24px}
                .opts-grid{display:grid;gap:10px;margin-top:10px}
                .opts-2{grid-template-columns:repeat(2,1fr)}
                .opts-3{grid-template-columns:repeat(3,1fr)}
                .opt-card{padding:13px 16px;border:1.5px solid #e5e7eb;border-radius:12px;background:#fff;font-size:14px;font-weight:500;color:#1a1a2e;cursor:pointer;text-align:center;transition:all 0.16s}
                .opt-card:hover{border-color:#a855f7;background:#faf5ff;transform:translateY(-1px)}
                .goal-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:12px}
                .goal-card-large{grid-column:1 / -1;display:flex;align-items:center;gap:16px;padding:20px;text-align:left}
                .goal-card-small{display:flex;flex-direction:column;align-items:center;gap:12px;padding:20px 16px;text-align:center}
                .icon-box{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px}
                .icon-purple{background:#f3e8ff;color:#7e22ce}
                .icon-green{background:#dcfce7;color:#15803d}
                .icon-yellow{background:#fef3c7;color:#b45309}
                .country-img-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:12px}
                .country-img-card{position:relative;border-radius:16px;overflow:hidden;height:140px;border:none;cursor:pointer;background:var(--bg) center/cover;text-align:left;padding:14px;display:flex;flex-direction:column;justify-content:flex-end;transition:transform 0.2s}
                .country-img-card:hover{transform:translateY(-3px)}
                .cic-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.8) 0%,rgba(0,0,0,0.2) 50%,transparent 100%)}
                .cic-flag{position:absolute;top:12px;right:12px;width:28px;height:20px;border-radius:4px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.2)}
                .cic-flag-img{width:100%;height:100%;object-fit:cover}
                .cic-name{position:relative;z-index:1;color:#fff;font-weight:800;font-size:16px;line-height:1.2}
                .cic-sub{position:relative;z-index:1;color:rgba(255,255,255,0.8);font-size:10px;font-weight:500;margin-top:2px}
                .country-search-trigger{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:#faf5ff;border:1.5px dashed #d8b4fe;border-radius:14px;cursor:pointer;font-size:14px;color:#4c1d95;transition:all 0.2s}
                .country-search-box{margin-top:8px;background:#fff;border:1.5px solid #e5e7eb;border-radius:14px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.06)}
                .country-search-input{width:100%;padding:14px 16px;border:none;border-bottom:1px solid #f3f4f6;font-size:14px;outline:none}
                .country-search-results{max-height:200px;overflow-y:auto}
                .csr-item{padding:12px 16px;font-size:14px;color:#374151;cursor:pointer;display:flex;align-items:center;border-bottom:1px solid #f9fafb}
                .csr-item:hover{background:#f3f4f6}
                .input-group{position:relative;margin-top:10px}
                .chat-input{width:100%;padding:14px 18px;border:1.5px solid #e5e7eb;border-radius:14px;font-size:15px;color:#1a1a2e;outline:none;transition:border-color 0.2s}
                .chat-input:focus{border-color:#7c3aed;box-shadow:0 0 0 4px rgba(124,58,237,0.1)}
                .chat-input.with-prefix{padding-left:36px}
                .input-prefix{position:absolute;left:16px;top:50%;transform:translateY(-50%);color:#6b7280;font-weight:600}
                .chat-submit{background:linear-gradient(135deg,#7c3aed,#6605c7);color:#fff;border:none;padding:14px 24px;border-radius:14px;font-size:14.5px;font-weight:700;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 12px rgba(102,5,199,0.2)}
                .chat-submit:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(102,5,199,0.3)}
                .months-wrap{margin-top:10px}
                .year-label{font-size:11px;font-weight:800;color:#9ca3af;letter-spacing:1px;margin-bottom:10px}
                .chips-row{display:flex;flex-wrap:wrap;gap:8px}
                .month-chip{padding:10px 16px;border:1.5px solid #e5e7eb;border-radius:9999px;background:#fff;font-size:13.5px;font-weight:600;color:#4b5563;cursor:pointer;transition:all 0.15s}
                .month-chip:hover{border-color:#a855f7;color:#7c3aed}
                .gpa-mode-btn{padding:6px 14px;border-radius:9999px;border:1.5px solid #e5e7eb;background:#fff;font-size:12px;font-weight:600;color:#555;cursor:pointer;transition:all .15s}
                .gpa-mode-btn.active{background:#6605c7;color:#fff;border-color:#6605c7}
                .ai-bubble-row{display:flex;align-items:flex-start;gap:12px;margin-bottom:20px}
                .ai-bubble{background:#f3f4f6;color:#1f2937;font-size:14.5px;padding:12px 18px;border-radius:4px 18px 18px 18px;max-width:85%;line-height:1.5}
                .typing-dots{display:flex;gap:4px;padding:4px 0}
                .typing-dot{width:6px;height:6px;background:#9ca3af;border-radius:50%;animation:bop 1.4s infinite ease-in-out both}
                .typing-dot:nth-child(1){animation-delay:-0.32s}
                .typing-dot:nth-child(2){animation-delay:-0.16s}
                @keyframes bop{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
                .univ-results-grid{display:grid;gap:16px;margin-top:16px}
                .univ-card{background:#fff;border:1.5px solid #e5e7eb;border-radius:16px;padding:16px;display:flex;gap:16px;position:relative;transition:all 0.2s}
                .univ-card:hover{border-color:#d8b4fe;box-shadow:0 12px 32px rgba(102,5,199,0.08);transform:translateY(-2px)}
                .univ-rank-badge{position:absolute;top:-10px;left:16px;background:linear-gradient(135deg,#1a1a2e,#2d1a4e);color:#fff;font-size:11px;font-weight:800;padding:4px 10px;border-radius:9999px;box-shadow:0 4px 12px rgba(0,0,0,0.15)}
                .univ-card-body{flex:1;min-width:0;padding-top:6px}
                .univ-card-name{font-size:16px;font-weight:800;color:#1a1a2e;line-height:1.3;margin-bottom:4px}
                .univ-card-location{font-size:12.5px;color:#6b7280;margin-bottom:10px}
                .univ-card-tags{display:flex;flex-wrap:wrap;gap:6px}
                .tag{font-size:10px;font-weight:700;padding:4px 8px;border-radius:6px}
                .tag-rank{background:#f3f4f6;color:#4b5563}
                .tag-tuition{background:#fef3c7;color:#b45309}
                .tag-accept{background:#dcfce7;color:#15803d}
                .tag-loan{background:#f3e8ff;color:#7e22ce}
                .match-col{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;min-width:70px}
                .match-ring{position:relative;width:52px;height:52px}
                .match-ring svg{width:100%;height:100%;transform:rotate(-90deg)}
                .ring-bg{fill:none;stroke:#f3f4f6;stroke-width:4}
                .ring-fill{fill:none;stroke-width:4;stroke-linecap:round;transition:stroke-dashoffset 1s ease-out}
                .ring-text{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#1a1a2e}
                .match-high .ring-fill{stroke:#4ade80}
                .match-mid .ring-fill{stroke:#fbbf24}
                .match-low .ring-fill{stroke:#a78bfa}
                .univ-apply-btn{background:#fff;border:1.5px solid #e5e7eb;color:#1a1a2e;font-size:12px;font-weight:700;padding:6px 16px;border-radius:9999px;cursor:pointer;transition:all 0.2s}
                .univ-apply-btn:hover{background:#f9f5ff;border-color:#d8b4fe;color:#6605c7}
                .section-label{display:flex;align-items:center;gap:12px;font-size:12px;font-weight:800;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;margin:32px 0 16px}
                .section-label::after{content:'';flex:1;height:1px;background:#e5e7eb}
                .fade-in{animation:fadeIn 0.4s ease forwards}
                @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
                .sp-toast{position:fixed;bottom:90px;left:20px;z-index:9000;background:#fff;border:1.5px solid #e5e7eb;border-radius:16px;padding:12px 16px;display:flex;align-items:center;gap:11px;box-shadow:0 8px 32px rgba(0,0,0,0.12);max-width:280px;min-width:220px;transform:translateX(-120%);opacity:0;transition:all 0.5s cubic-bezier(0.175,0.885,0.32,1.275)}
                .sp-toast.show{transform:translateX(0);opacity:1}
                .sp-avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#6605c7);display:flex;align-items:center;justify-content:center;flex-shrink:0}
                .sp-name{font-size:12px;font-weight:800;color:#1a1a2e}
                .sp-msg{font-size:11.5px;color:#4b5563;line-height:1.3;margin-top:1px}
                .sp-check{width:16px;height:16px;border-radius:50%;background:#dcfce7;color:#16a34a;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;flex-shrink:0}
            `}</style>

            <div className="progress-track">
                <div ref={progressRef} className="progress-fill" style={{ width: '0%' }} />
            </div>

            {!hasStarted ? (
                <div className="welcome-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px', textAlign: 'center', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
                    <div style={{ maxWidth: '600px', background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                        <div style={{ width: '80px', height: '80px', background: '#f3e8ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <span style={{ fontSize: '40px' }}>🎓</span>
                        </div>
                        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1f2937', marginBottom: '16px' }}>We got your back!</h1>
                        <p style={{ fontSize: '18px', color: '#4b5563', lineHeight: '1.6', marginBottom: '32px' }}>
                            We've helped over <strong style={{ color: '#7c3aed' }}>2.6 lakh</strong> students across <strong style={{ color: '#7c3aed' }}>18+</strong> countries and <strong style={{ color: '#7c3aed' }}>18,000+</strong> programs. Let's find the right program for you.
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
                            AI-Powered Loan Matching
                        </div>
                        <h1 className="hero-title">Find Your Perfect<br /><span className="hero-gradient">Education Loan</span></h1>
                        <p className="hero-sub">Answer a few quick questions and we'll match you with the best loan — in under 2 minutes. No paperwork. No hassle.</p>

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
                                    <div className="q-row"><p className="q-text">{step.q}</p></div>

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
        </main>
    );
}
