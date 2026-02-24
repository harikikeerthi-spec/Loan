import os

content = """
"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// --- DATA ---
const UNIVERSITY_DB = [
  { name: 'Massachusetts Institute of Technology', loc: 'Cambridge, USA', country: 'USA', rank: 1, accept: 7, min_gpa: 9.0, min_ielts: 7.0, min_toefl: 100, tuition: 57986, courses: ['computer science', 'engineering', 'data science', 'electrical', 'mechanical', 'physics', 'mathematics', 'ai', 'robotics'], loan: true, tag: 'World #1' },
  { name: 'Stanford University', loc: 'Stanford, USA', country: 'USA', rank: 3, accept: 4, min_gpa: 9.2, min_ielts: 7.0, min_toefl: 100, tuition: 62484, courses: ['computer science', 'engineering', 'data science', 'ai', 'business', 'management', 'electrical', 'mechanical'], loan: true, tag: 'Silicon Valley' },
  { name: 'Carnegie Mellon University', loc: 'Pittsburgh, USA', country: 'USA', rank: 22, accept: 17, min_gpa: 8.5, min_ielts: 6.5, min_toefl: 94, tuition: 58924, courses: ['computer science', 'software engineering', 'data science', 'ai', 'machine learning', 'information systems', 'robotics', 'electrical'], loan: true, tag: 'CS Powerhouse' },
  { name: 'University of Oxford', loc: 'Oxford, UK', country: 'UK', rank: 1, accept: 17, min_gpa: 8.5, min_ielts: 7.0, min_toefl: 110, tuition: 30500, courses: ['computer science', 'engineering', 'data science', 'business', 'law', 'medicine', 'physics', 'mathematics', 'ai'], loan: false, tag: 'World #1 UK' },
  { name: 'University of Toronto', loc: 'Toronto, Canada', country: 'Canada', rank: 18, accept: 43, min_gpa: 7.5, min_ielts: 6.5, min_toefl: 93, tuition: 43000, courses: ['computer science', 'engineering', 'data science', 'business', 'medicine', 'electrical', 'mechanical', 'chemical', 'ai'], loan: true, tag: 'Canada #1' },
  { name: 'University of Melbourne', loc: 'Melbourne, Australia', country: 'Australia', rank: 33, accept: 70, min_gpa: 7.0, min_ielts: 6.5, min_toefl: 79, tuition: 42000, courses: ['computer science', 'engineering', 'data science', 'business', 'medicine', 'electrical', 'mechanical', 'arts'], loan: true, tag: 'Go8 Elite' },
  { name: 'Technical University of Munich', loc: 'Munich, Germany', country: 'Germany', rank: 37, accept: 8, min_gpa: 8.0, min_ielts: 6.5, min_toefl: 88, tuition: 2600, courses: ['computer science', 'engineering', 'data science', 'electrical', 'mechanical', 'chemical', 'robotics', 'ai', 'mathematics'], loan: false, tag: 'TU9 Elite' },
  { name: 'Trinity College Dublin', loc: 'Dublin, Ireland', country: 'Ireland', rank: 81, accept: 30, min_gpa: 7.5, min_ielts: 6.5, min_toefl: 90, tuition: 22000, courses: ['computer science', 'engineering', 'data science', 'business', 'medicine', 'law', 'arts', 'mathematics'], loan: true, tag: 'Oldest Irish Uni' },
];

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
  { label: 'USA', code: 'us' }, { label: 'UK', code: 'gb' }, { label: 'Canada', code: 'ca' }, { label: 'Australia', code: 'au' },
  { label: 'Germany', code: 'de' }, { label: 'Ireland', code: 'ie' }, { label: 'Netherlands', code: 'nl' }, { label: 'Sweden', code: 'se' },
  { label: 'France', code: 'fr' }, { label: 'Italy', code: 'it' }, { label: 'Spain', code: 'es' }, { label: 'Singapore', code: 'sg' },
];

const ALL_COURSES = [
  'Computer Science', 'Data Science', 'Business Administration (MBA)', 'Mechanical Engineering', 'Electrical Engineering',
  'Civil Engineering', 'Artificial Intelligence', 'Information Technology', 'Finance', 'Marketing', 'Public Health', 'Nursing'
];

const steps = [
  {
    id: 'goal',
    header: "Looking for answers to your masters abroad questions?",
    q: "How can we support you with your master's?",
    type: 'goal_grid',
    options: [
      { value: 'plan', label: "Help me on my Master's plan", icon: 'help', iconClass: 'icon-purple' },
      { value: 'loan', label: 'Need help with an education loan', icon: 'payments', iconClass: 'icon-green' },
      { value: 'compare', label: 'Evaluate my shortlisted universities', icon: 'menu_book', iconClass: 'icon-yellow' },
    ]
  },
  {
    id: 'country',
    q: "Where are you planning to do your master's?",
    type: 'countries',
    options: [
      { value: 'USA', label: 'USA' }, { value: 'UK', label: 'UK' }, { value: 'Canada', label: 'Canada' },
      { value: 'Australia', label: 'Australia' }, { value: 'Germany', label: 'Germany' }, { value: 'Ireland', label: 'Ireland' },
      { value: 'Other', label: 'Other' },
    ]
  },
  {
    id: 'course',
    q: "Which course are you going to pursue?",
    type: 'course_search',
    placeholder: 'e.g. Computer Science, Data Science, MBA'
  },
  {
    id: 'ai_search',
    type: 'ai_search'
  },
  {
    id: 'admit_status',
    q: "Help me understand your admit status.",
    type: 'cards', cols: 2,
    options: [
      { value: 'received', label: 'Received Admit' }, { value: 'awaiting', label: 'Awaiting Decision' },
      { value: 'waitlisted', label: 'Waitlisted' }, { value: 'not_yet', label: 'Yet to Apply' },
      { value: 'on_campus', label: 'Already On Campus' },
    ]
  },
  {
    id: 'intake_month',
    q: "Please select your enrolling month for your masters.",
    type: 'months',
    year: new Date().getFullYear() + (new Date().getMonth() >= 9 ? 1 : 0),
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  },
  {
    id: 'gpa',
    q: "What is your current academic score?",
    type: 'gpa_input'
  },
  {
    id: 'english_test',
    q: "Have you taken any English proficiency test?",
    type: 'cards', cols: 3,
    options: [
      { value: 'ielts', label: 'IELTS' }, { value: 'toefl', label: 'TOEFL' }, { value: 'pte', label: 'PTE' },
      { value: 'duolingo', label: 'Duolingo' }, { value: 'none', label: 'Not Yet' },
    ]
  },
  {
    id: 'english_score',
    type: 'english_score'
  },
  {
    id: 'loan_amount',
    q: 'How much loan amount do you need?',
    type: 'rupee',
    placeholder: '0'
  },
  {
    id: 'work_exp',
    q: "Enter your work experience (in months).",
    type: 'number',
    placeholder: '0'
  },
  {
    id: 'ai_match',
    type: 'ai_match'
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

    // Search states
    const [countrySearch, setCountrySearch] = useState('');
    const [showCountrySearch, setShowCountrySearch] = useState(false);
    const [courseSearch, setCourseSearch] = useState('');
    const [showCourseSearch, setShowCourseSearch] = useState(false);

    // GPA state
    const [gpaMode, setGpaMode] = useState<'cgpa' | 'pct'>('cgpa');
    const [gpaValue, setGpaValue] = useState('');

    // Generic input state
    const [inputValue, setInputValue] = useState('');

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

    // Handle AI steps
    useEffect(() => {
        const step = steps[currentIdx];
        if (!step) return;

        if (step.type === 'ai_search' && !isAiSearching) {
            setIsAiSearching(true);
            const country = answers.country?.value || 'USA';
            const course = answers.course?.value || '';
            
            setTimeout(() => {
                let pool = UNIVERSITY_DB.filter(u => u.country === country);
                if (pool.length === 0) pool = UNIVERSITY_DB;
                
                const kw = course.toLowerCase().replace(/[^a-z ]/g, '').trim();
                const keywords = kw.split(/\\s+/).filter(Boolean);
                pool = pool.map(u => {
                    let rel = 0;
                    keywords.forEach(k => {
                        if (u.courses.some(c => c.includes(k) || k.includes(c.split(' ')[0]))) rel++;
                    });
                    return { ...u, _rel: rel };
                }).sort((a, b) => b._rel - a._rel || a.rank - b.rank);
                
                setAiUniversities(pool.slice(0, 10));
                setIsAiSearching(false);
                setCurrentIdx(currentIdx + 1);
            }, 2000);
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
        setCurrentIdx(currentIdx + 1);
    };

    const editStep = (idx: number) => {
        setCurrentIdx(idx);
        // Clear answers from this step onwards
        const newAnswers = { ...answers };
        for (let i = idx; i < steps.length; i++) {
            delete newAnswers[steps[i].id];
        }
        setAnswers(newAnswers);
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
                                <span style={{ fontWeight: 700 }}>Search other countries...</span>
                            </div>
                            <div className="cst-arrow">v</div>
                        </div>
                        {showCountrySearch && (
                            <div className="country-search-box" style={{ display: 'block' }}>
                                <input className="country-search-input" placeholder="Type a country name..." value={countrySearch} onChange={e => setCountrySearch(e.target.value)} />
                                <div className="country-search-results">
                                    {ALL_COUNTRIES.filter(c => c.label.toLowerCase().includes(countrySearch.toLowerCase())).slice(0, 10).map(c => (
                                        <div key={c.code} className="csr-item" onClick={() => submitAnswer(step.id, c.label, c.label)}>
                                            <img src={`https://flagcdn.com/w40/${c.code}.png`} alt="" className="csr-flag-img" style={{ width: 20, marginRight: 8, verticalAlign: 'middle' }} />
                                            {c.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (step.type === 'course_search') {
            return (
                <div>
                    <div className="input-group">
                        <input className="chat-input" placeholder={step.placeholder} value={courseSearch} onChange={e => { setCourseSearch(e.target.value); setShowCourseSearch(true); }} onFocus={() => setShowCourseSearch(true)} />
                    </div>
                    {showCourseSearch && courseSearch && (
                        <div className="country-search-box" style={{ display: 'block', marginTop: 4 }}>
                            <div className="country-search-results">
                                {ALL_COURSES.filter(c => c.toLowerCase().includes(courseSearch.toLowerCase())).slice(0, 5).map(c => (
                                    <div key={c} className="csr-item" onClick={() => { setCourseSearch(c); setShowCourseSearch(false); }}>{c}</div>
                                ))}
                            </div>
                        </div>
                    )}
                    <button className="chat-submit" style={{ marginTop: 12 }} onClick={() => submitAnswer(step.id, courseSearch, courseSearch)}>Continue</button>
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

        return null;
    };

    const renderAiMatch = () => {
        if (isAiMatching) {
            return (
                <div className="ai-bubble-row fade-in">
                    <div className="ai-avatar blob-mascot" style={{ width: 32, height: 32, margin: 0 }}>
                        <img src="/web/assets/img/mascot_ai.png" alt="AI Mascot" className="mascot-img rounded-full" />
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

        const pool = aiUniversities.length > 0 ? aiUniversities : UNIVERSITY_DB.filter(u => u.country === country).slice(0, 10);
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

            const kws = course.toLowerCase().split(/\\s+/);
            const hasMatch = u.courses.some(c => kws.some(k => c.includes(k) || k.includes(c.split(' ')[0])));
            score += hasMatch ? 20 : 8;

            if (u.accept >= 50) score += 15; else if (u.accept >= 25) score += 10; else if (u.accept >= 10) score += 5;
            if (u.loan && loanAmt > 0) score += 5;
            if (workExp >= 12) score += 3; else if (workExp >= 6) score += 1;

            return { ...u, _score: Math.min(score, 100) };
        }).sort((a, b) => b._score - a._score).slice(0, 5);

        return (
            <div className="fade-in">
                <div className="ai-bubble-row fade-in">
                    <div className="ai-avatar blob-mascot" style={{ width: 32, height: 32, margin: 0 }}>
                        <img src="/web/assets/img/mascot_ai.png" alt="AI Mascot" className="mascot-img rounded-full" />
                    </div>
                    <div className="ai-bubble">
                        Matched <strong>{scored.length} top universities</strong> based on your profile!<br/>
                        <span style={{ fontSize: 12, color: '#888', marginTop: 4, display: 'block' }}>Ranked by compatibility with your GPA, test scores, and preferences.</span>
                    </div>
                </div>
                <div className="section-label">Your Top Universities</div>
                <div className="univ-results-grid">
                    {scored.map((u, i) => {
                        const pct = u._score;
                        const cls = pct >= 70 ? 'match-high' : pct >= 45 ? 'match-mid' : 'match-low';
                        const stroke = pct >= 70 ? '#4ade80' : pct >= 45 ? '#fbbf24' : '#a78bfa';
                        const circ = 2 * Math.PI * 22;
                        const dash = circ - (pct / 100) * circ;
                        const tuition = u.country === 'Germany' ? `€${u.tuition.toLocaleString()}/yr` : `$${u.tuition.toLocaleString()}/yr`;

                        return (
                            <div key={u.name} className="univ-card">
                                <div className="univ-rank-badge">#{i + 1}</div>
                                <div className="univ-card-body">
                                    <div className="univ-card-name">{u.name}</div>
                                    <div className="univ-card-location">{u.loc}</div>
                                    <div className="univ-card-tags">
                                        <span className="tag tag-rank">Rank #{u.rank}</span>
                                        <span className="tag tag-tuition">{tuition}</span>
                                        <span className="tag tag-accept">{u.accept}% accept</span>
                                        {u.loan && <span className="tag tag-loan">Loan Ready</span>}
                                    </div>
                                </div>
                                <div className="match-col">
                                    <div className={`match-ring ${cls}`}>
                                        <svg viewBox="0 0 52 52">
                                            <circle className="ring-bg" cx="26" cy="26" r="22"/>
                                            <circle className="ring-fill" cx="26" cy="26" r="22" stroke={stroke} strokeDasharray={circ.toFixed(1)} strokeDashoffset={dash.toFixed(1)}/>
                                        </svg>
                                        <span className="ring-text">{pct}%</span>
                                    </div>
                                    <button className="univ-apply-btn">Details</button>
                                </div>
                            </div>
                        );
                    })}
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

                        if (step.type === 'ai_search') {
                            if (idx === currentIdx && isAiSearching) {
                                return (
                                    <div key={step.id} className="ai-bubble-row fade-in">
                                        <div className="ai-avatar blob-mascot" style={{ width: 32, height: 32, margin: 0 }}>
                                            <img src="/web/assets/img/mascot_ai.png" alt="AI Mascot" className="mascot-img rounded-full" />
                                        </div>
                                        <div className="ai-bubble">
                                            <div className="typing-dots">
                                                <div className="typing-dot"></div><div className="typing-dot"></div><div className="typing-dot"></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            if (isCompleted) {
                                const country = answers.country?.value || 'USA';
                                const course = answers.course?.value || '';
                                return (
                                    <div key={step.id} className="ai-bubble-row fade-in">
                                        <div className="ai-avatar blob-mascot" style={{ width: 32, height: 32, margin: 0 }}>
                                            <img src="/web/assets/img/mascot_ai.png" alt="AI Mascot" className="mascot-img rounded-full" />
                                        </div>
                                        <div className="ai-bubble">
                                            Found <span style={{ color: '#6605c7', fontWeight: 800 }}>{aiUniversities.length}+</span> universities in <strong>{country}</strong> offering <strong>{course || 'this course'}</strong>.
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
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
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
"""

with open("app/(onboarding)/onboarding/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("File written successfully.")
