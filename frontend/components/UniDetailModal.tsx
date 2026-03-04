"use client";

import React, { useEffect, useState } from "react";

const COUNTRY_FLAGS: Record<string, string> = {
    US: "🇺🇸", USA: "🇺🇸", "United States": "🇺🇸",
    UK: "🇬🇧", "United Kingdom": "🇬🇧",
    Canada: "🇨🇦", CA: "🇨🇦",
    Australia: "🇦🇺", AU: "🇦🇺",
    Germany: "🇩🇪", DE: "🇩🇪",
    Ireland: "🇮🇪", IE: "🇮🇪",
    France: "🇫🇷", FR: "🇫🇷",
    Netherlands: "🇳🇱", NL: "🇳🇱",
    Switzerland: "🇨🇭", CH: "🇨🇭",
    Singapore: "🇸🇬", SG: "🇸🇬",
    Japan: "🇯🇵", JP: "🇯🇵",
    "New Zealand": "🇳🇿", NZ: "🇳🇿",
    Sweden: "🇸🇪", SE: "🇸🇪",
    Spain: "🇪🇸", ES: "🇪🇸",
    Italy: "🇮🇹", IT: "🇮🇹",
};

interface AiDetails {
    overview: string;
    programs: string[];
    facilities: string[];
    funFacts: string[];
    whyStudyHere: string[];
    notablAlumni: string[];
}

interface UniDetailModalProps {
    university: any;
    answers: Record<string, { value: string; label: string }>;
    onClose: () => void;
}

export default function UniDetailModal({ university: u, answers, onClose }: UniDetailModalProps) {
    const [aiDetails, setAiDetails] = useState<AiDetails | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState(false);

    const admitChance = u._score || Math.min(92, Math.round((10 - (u.min_gpa || 7)) * 17 + (u.accept || 28)));
    const loanChance = u.loan ? 88 : 62;
    const tuitionInr = Math.round((u.tuition || 30000) * 85);
    const livingInr = Math.round((u.tuition || 30000) * 0.55 * 85);
    const totalInr = tuitionInr + livingInr;
    const courseName = u.courses?.[0] || answers.course?.value || "Master's Program";
    const isStem = ['AI', 'ML', 'CS', 'Software', 'Data', 'Comp', 'Eng', 'Tech', 'Cyber', 'Quant'].some((k: string) => courseName.toLowerCase().includes(k.toLowerCase()));
    const category = isStem ? 'STEM' : 'Business';
    const flag = COUNTRY_FLAGS[u.country] || '🌐';

    // Fetch AI-generated university details
    useEffect(() => {
        const fetchAiDetails = async () => {
            setAiLoading(true);
            setAiError(false);
            try {
                const res = await fetch(`/api/university-details?name=${encodeURIComponent(u.name)}&country=${encodeURIComponent(u.country)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.details) {
                        const d = data.details;
                        setAiDetails({
                            overview: d.overview || d.description || u.description || '',
                            programs: d.popular_programs || d.programs || u.courses || [],
                            facilities: d.facilities || d.campus_facilities || [],
                            funFacts: d.fun_facts || d.highlights || [],
                            whyStudyHere: d.why_study_here || d.strengths || [],
                            notablAlumni: d.notable_alumni || [],
                        });
                    } else {
                        // Use fallback content
                        setAiDetails(generateFallbackContent(u, courseName));
                    }
                } else {
                    setAiDetails(generateFallbackContent(u, courseName));
                }
            } catch {
                setAiDetails(generateFallbackContent(u, courseName));
            } finally {
                setAiLoading(false);
            }
        };
        fetchAiDetails();
    }, [u.name, u.country]);

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
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={onClose}>
            <div style={{
                width: '100%', maxWidth: '1100px', maxHeight: '92vh', background: '#fff',
                display: 'flex', flexDirection: 'column', position: 'relative',
                animation: 'modalSlideUp 0.4s ease-out', borderRadius: '28px',
                overflow: 'hidden', boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.35)'
            }} onClick={e => e.stopPropagation()}>

                {/* ── TOP HEADER ── */}
                <div style={{ flexShrink: 0, padding: '20px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 14,
                            background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                            border: '1.5px solid #e9d5ff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 24, fontWeight: 900, color: '#6605c7'
                        }}>{u.name?.[0] || 'U'}</div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5 }}>{flag} {u.country}</span>
                                {u.rank && <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', background: '#fef3c7', color: '#92400e', borderRadius: 99 }}>QS #{u.rank}</span>}
                            </div>
                            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>{u.name}</h2>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', background: '#f0fdf4', borderRadius: 99, fontSize: 11, fontWeight: 800, color: '#15803d' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                            AI Enhanced
                        </div>
                        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: '#f8fafc', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>✕</button>
                    </div>
                </div>

                {/* ── SCROLLABLE CONTENT ── */}
                <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc', paddingBottom: 100 }}>

                    {/* ── HERO SECTION ── */}
                    <div style={{ margin: '24px 28px', background: 'white', borderRadius: 20, padding: '28px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', marginBottom: 6 }}>Target Program</div>
                                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: '0 0 12px', lineHeight: 1.15 }}>{courseName}</h1>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {[category, '2 Years', u.rank ? `QS #${u.rank}` : null, u.loc ? u.loc.split(',')[0] : null].filter(Boolean).map((tag, i) => (
                                        <span key={i} style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', background: '#f5f3ff', color: '#7c3aed', borderRadius: 9999 }}>{tag}</span>
                                    ))}
                                </div>
                                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65, marginTop: 16, marginBottom: 0 }}>
                                    {u.description || `${u.name} is a prestigious institution in ${u.country} known for academic excellence and strong industry connections.`}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                                <Ring pct={admitChance} color="#6605c7" label="Admit Match" value={`${admitChance}%`} />
                                <Ring pct={loanChance} color="#0d9488" label="Loan Match" value={loanChance >= 75 ? 'High' : 'Med'} />
                            </div>
                        </div>
                    </div>

                    {/* ── QUICK STATS ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, margin: '0 28px 24px' }}>
                        {[
                            { label: 'Estimated Cost', val: `₹${(totalInr / 100000).toFixed(1)}L`, icon: '💰', bg: '#fefce8' },
                            { label: 'Acceptance Rate', val: `${u.accept || '—'}%`, icon: '📊', bg: '#ecfdf5' },
                            { label: 'Min GPA Req', val: `${u.min_gpa || 6.5}/10`, icon: '🎓', bg: '#eff6ff' },
                            { label: 'Entrance Req', val: u.min_ielts ? `IELTS ${u.min_ielts}` : 'Waivable*', icon: '📄', bg: '#fdf4ff' }
                        ].map((stat, i) => (
                            <div key={i} style={{ background: stat.bg, padding: '16px', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', border: '1px solid rgba(0,0,0,0.04)' }}>
                                <div style={{ fontSize: 20, marginBottom: 6 }}>{stat.icon}</div>
                                <div style={{ fontSize: 16, fontWeight: 900, color: '#1e293b' }}>{stat.val}</div>
                                <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginTop: 3 }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* ── AI-GENERATED CONTENT ── */}
                    {aiLoading ? (
                        <div style={{ margin: '0 28px 24px', background: 'white', borderRadius: 20, padding: '32px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #e9d5ff', borderTopColor: '#7c3aed', animation: 'spin 0.8s linear infinite' }} />
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>AI is researching {u.name}...</div>
                                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Generating detailed university insights</div>
                                </div>
                            </div>
                        </div>
                    ) : aiDetails && (
                        <>
                            {/* AI Overview */}
                            {aiDetails.overview && (
                                <div style={{ margin: '0 28px 20px', background: 'white', borderRadius: 20, padding: '24px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                        <span style={{ fontSize: 16 }}>✨</span>
                                        <h3 style={{ fontSize: 13, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>AI University Overview</h3>
                                        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', background: '#f0fdf4', color: '#16a34a', borderRadius: 99 }}>AI Generated</span>
                                    </div>
                                    <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, margin: 0 }}>{aiDetails.overview}</p>
                                </div>
                            )}

                            {/* Why Study Here + Fun Facts */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '0 28px 20px' }}>
                                {aiDetails.whyStudyHere.length > 0 && (
                                    <div style={{ background: 'linear-gradient(135deg, #faf5ff, #f5f3ff)', borderRadius: 20, padding: '24px', border: '1px solid #e9d5ff' }}>
                                        <h3 style={{ fontSize: 13, fontWeight: 900, color: '#6605c7', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16, margin: '0 0 16px' }}>🎯 Why Study Here</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {aiDetails.whyStudyHere.slice(0, 5).map((item, i) => (
                                                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#7c3aed', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{i + 1}</span>
                                                    <span style={{ fontSize: 13, color: '#4c1d95', lineHeight: 1.5, fontWeight: 500 }}>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {aiDetails.funFacts.length > 0 && (
                                    <div style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', borderRadius: 20, padding: '24px', border: '1px solid #fde68a' }}>
                                        <h3 style={{ fontSize: 13, fontWeight: 900, color: '#92400e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16, margin: '0 0 16px' }}>💡 Did You Know?</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {aiDetails.funFacts.slice(0, 5).map((fact, i) => (
                                                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                                    <span style={{ fontSize: 16, flexShrink: 0 }}>•</span>
                                                    <span style={{ fontSize: 13, color: '#78350f', lineHeight: 1.5, fontWeight: 500 }}>{fact}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Programs */}
                            {aiDetails.programs.length > 0 && (
                                <div style={{ margin: '0 28px 20px', background: 'white', borderRadius: 20, padding: '24px', border: '1px solid #f1f5f9' }}>
                                    <h3 style={{ fontSize: 13, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16, margin: '0 0 16px' }}>📚 Popular Programs</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {aiDetails.programs.slice(0, 8).map((prog, i) => (
                                            <span key={i} style={{
                                                padding: '8px 16px', background: '#f8fafc',
                                                borderRadius: 12, fontSize: 13, fontWeight: 600,
                                                color: '#334155', border: '1px solid #e2e8f0',
                                                transition: 'all 0.15s'
                                            }}>{prog}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Facilities */}
                            {aiDetails.facilities.length > 0 && (
                                <div style={{ margin: '0 28px 20px', background: 'white', borderRadius: 20, padding: '24px', border: '1px solid #f1f5f9' }}>
                                    <h3 style={{ fontSize: 13, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16, margin: '0 0 16px' }}>🏛️ Campus Facilities</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                        {aiDetails.facilities.slice(0, 6).map((fac, i) => (
                                            <div key={i} style={{
                                                padding: '14px', background: '#f8fafc',
                                                borderRadius: 14, fontSize: 13, fontWeight: 600,
                                                color: '#334155', textAlign: 'center',
                                                border: '1px solid #e2e8f0'
                                            }}>{fac}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── CONTENT SECTIONS (Financial + Expert) ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, margin: '0 28px 24px' }}>
                        {/* Left: Academic Fit + Cost */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ background: 'white', borderRadius: 20, padding: '24px', border: '1px solid #f1f5f9' }}>
                                <h3 style={{ fontSize: 13, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 20, margin: '0 0 20px' }}>Academic Fit</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {[
                                        { req: 'GPA (out of 10)', min: (u.min_gpa || 7.0), ok: parseFloat(answers.gpa?.value || '0') >= (u.min_gpa || 7.0) },
                                        { req: 'Language Proficiency', min: (u.min_ielts || 6.5), ok: parseFloat(answers.english_score?.value || '0') >= (u.min_ielts || 6.5) }
                                    ].map((r, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: r.ok ? '#f0fdf4' : '#fff1f2', borderRadius: 14 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: r.ok ? '#166534' : '#991b1b' }}>{r.req}</div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: 12, fontWeight: 800, color: r.ok ? '#15803d' : '#ef4444' }}>{r.ok ? '✓ Match' : '✗ Below Req.'}</div>
                                                <div style={{ fontSize: 10, color: r.ok ? '#16a34a' : '#ef4444', opacity: 0.7 }}>Min: {r.min}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ background: 'white', borderRadius: 20, padding: '24px', border: '1px solid #f1f5f9' }}>
                                <h3 style={{ fontSize: 13, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 20, margin: '0 0 20px' }}>Financial Outlook (Yearly)</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                                    <div style={{ marginTop: 8, padding: '14px', background: '#f8fafc', borderRadius: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>Combined Total</span>
                                        <span style={{ fontSize: 18, fontWeight: 900, color: '#7c3aed' }}>₹{totalInr.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Expert + Portal + Loan */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderRadius: 20, padding: '24px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: -10, right: -10, width: 80, height: 80, background: 'white', opacity: 0.05, borderRadius: '50%' }} />
                                <h3 style={{ fontSize: 12, fontWeight: 900, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, margin: '0 0 16px' }}>Expert Guidance</h3>
                                <p style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.5, marginBottom: 20, margin: '0 0 20px' }}>Get a free 15-min profile evaluation from our senior study abroad consultants.</p>
                                <button style={{ width: '100%', padding: '12px', background: 'white', color: '#1e1b4b', border: 'none', borderRadius: 14, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Book Free Call</button>
                            </div>

                            <div style={{ background: 'white', borderRadius: 20, padding: '24px', border: '1px solid #f1f5f9' }}>
                                <h3 style={{ fontSize: 13, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16, margin: '0 0 16px' }}>Official Portal</h3>
                                {u.website ? (
                                    <a href={u.website} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: '#f8fafc', borderRadius: 14, textDecoration: 'none' }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Visit Website</span>
                                        <span style={{ color: '#94a3b8' }}>↗</span>
                                    </a>
                                ) : (
                                    <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 14, fontSize: 12, color: '#64748b', textAlign: 'center' }}>Official portal not available</div>
                                )}
                            </div>

                            <div style={{ background: '#fdf4ff', borderRadius: 20, padding: '24px', border: '1px solid #f5d0fe' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                    <span style={{ fontSize: 20 }}>⚡</span>
                                    <span style={{ fontSize: 13, fontWeight: 900, color: '#86198f' }}>Instant Loan Check</span>
                                </div>
                                <p style={{ fontSize: 12, color: '#a21caf', lineHeight: 1.4, margin: '0 0 16px' }}>Pre-approve your education loan for {u.name} in minutes.</p>
                                <button onClick={() => { onClose(); window.location.href = '/loans/apply'; }} style={{ width: '100%', padding: '10px', background: '#86198f', color: 'white', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>Check Eligibility</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── STICKY FOOTER ── */}
                <div style={{ flexShrink: 0, padding: '16px 28px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 14 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '14px', background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: 14, fontWeight: 800, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s' }}>Close</button>
                    <button onClick={() => { onClose(); window.location.href = '/loans/apply?university=' + encodeURIComponent(u.name); }} style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #7c3aed, #6605c7)', color: 'white', border: 'none', borderRadius: 14, fontWeight: 900, fontSize: 14, cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(102, 5, 199, 0.3)', transition: 'all 0.15s' }}>Apply with VidhyaLoans →</button>
                </div>

                <style>{`
                    @keyframes modalSlideUp {
                        from { opacity: 0; transform: translateY(40px) scale(0.98); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    @keyframes spin { to { transform: rotate(360deg); } }
                `}</style>
            </div>
        </div>
    );
}

function generateFallbackContent(u: any, courseName: string): AiDetails {
    return {
        overview: u.description || `${u.name} is a leading institution in ${u.country}, known for its strong academic programs and vibrant campus life. The university offers world-class education with a focus on innovation, research, and preparing students for successful careers globally.`,
        programs: u.courses || [courseName, 'Computer Science', 'Business Administration', 'Engineering', 'Data Science'],
        facilities: ['Modern Library', 'Research Labs', 'Student Housing', 'Sports Center', 'Career Services', 'Innovation Hub'],
        funFacts: [
            `Located in ${u.loc || u.country}, one of the top study destinations worldwide`,
            `Acceptance rate of ${u.accept || 30}% — competitive but achievable`,
            `Strong alumni network across major industries`,
        ],
        whyStudyHere: [
            'World-class faculty and cutting-edge research opportunities',
            'Strong industry partnerships and internship programs',
            `International student community from ${u.country} and beyond`,
            'Comprehensive career support and job placement assistance',
            'Modern campus with state-of-the-art facilities',
        ],
        notablAlumni: [],
    };
}
