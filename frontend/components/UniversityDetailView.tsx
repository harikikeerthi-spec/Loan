"use client";

import React, { useState, useEffect } from "react";
import ImageLightbox from './ImageLightbox';
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface UniversityData {
    slug: string;
    name: string;
    shortName: string;
    location: string;
    country: string;
    countryCode: string;
    flag: string;
    founded: number;
    type: string;
    rank: number;
    rankBy: string;
    acceptanceRate: number;
    tuition: number;
    currency: string;
    description: string;
    heroImage: string;
    campusImages: string[];
    logo: string;
    primaryColor: string;
    gradient: string;
    badge: string;
    website: string;
    stats: {
        totalStudents: string;
        internationalStudents: string;
        facultyRatio: string;
        researchOutput: string;
        employmentRate: string;
        avgSalary: string;
    };
    programs: {
        name: string;
        degree: string;
        duration: string;
        tuition: string;
        icon: string;
    }[];
    topRecruiters: string[];
    requirements: {
        gpa: string;
        ielts: string;
        toefl: string;
        gre: string;
    };
    loanInfo: {
        availableLenders: string[];
        avgLoanAmount: string;
        collateralFree: boolean;
        fastTrack: boolean;
        notes: string;
    };
    pros: string[];
    campusFacilities: any[];
    funFacts?: string[];
    whyStudyHere?: string[];
    notableAlumni?: any[];
}

interface UniversityDetailViewProps {
    university: UniversityData;
    onApply?: (uni: UniversityData) => void;
    onClose?: () => void;
}

export default function UniversityDetailView({ university: initialUni, onApply, onClose }: UniversityDetailViewProps) {
    const router = useRouter();
    const [u, setU] = useState<UniversityData>(initialUni);

    useEffect(() => {
        setU(initialUni);
    }, [initialUni]);
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState("overview");
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    const logoFallback = (() => {
        // Try Clearbit logo from website domain first, then fall back to initials
        if (u.website) {
            try {
                const domain = new URL(u.website).hostname.replace(/^www\./, '');
                return `https://logo.clearbit.com/${domain}`;
            } catch { /* ignore */ }
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=6605c7&color=fff`;
    })();

    // AI enrichment is now handled by the parent UniversityPageClient

    const handleScroll = (id: string) => {
        setActiveSection(id);
        const el = document.getElementById(id);
        if (el) {
            const offset = 100;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = el.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

    const navItems = [
        { id: 'overview', label: 'Overview', icon: 'info' },
        { id: 'programs', label: 'Programs', icon: 'auto_stories' },
        { id: 'admissions', label: 'Admissions', icon: 'assignment_turned_in' },
        { id: 'scholarships', label: 'Scholarships', icon: 'card_giftcard' },
        { id: 'campus-life', label: 'Campus life', icon: 'apartment' },
        { id: 'alumni', label: 'Alumni', icon: 'groups_3' },
        { id: 'financing', label: 'Financing', icon: 'payments' },
    ];

    return (
        <div className="min-h-screen bg-[#fcfaff]">
            {/* ── HERO SECTION ── */}
            <section className="relative h-[65vh] min-h-[500px] flex items-end overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src={u.heroImage || "https://images.unsplash.com/photo-1523050335392-93851179ae22?w=1600&q=80"}
                        alt={u.name}
                        className="w-full h-full object-cover scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1626] via-[#1a1626]/60 to-transparent" />
                </div>

                <button
                    onClick={() => onClose ? onClose() : router.back()}
                    className="absolute top-8 right-8 z-50 w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-2xl"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <div className="max-w-[1600px] mx-auto w-full px-6 pb-16 relative z-10 flex flex-col md:flex-row items-end justify-between gap-8">
                    <div className="flex-1 flex items-start gap-6">
                        <div className="w-28 h-28 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden border border-white/20 shadow-xl">
                            <img
                                src={u.logo || logoFallback}
                                alt={u.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=6605c7&color=fff&size=128`;
                                }}
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-3 py-1.5 bg-purple-600/90 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">{u.badge || 'AI Verified'}</span>
                                <span className="text-sm font-bold text-white/90">{u.country}</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white mb-3 tracking-tight leading-[0.95] drop-shadow-2xl">{u.name}</h1>
                            <div className="flex flex-wrap items-center gap-6 text-white/80 font-bold text-sm">
                                <div className="flex items-center gap-2.5"><span className="material-symbols-outlined text-purple-400">location_on</span>{u.location}</div>
                                <div className="flex items-center gap-2.5"><span className="material-symbols-outlined text-purple-400">workspace_premium</span>Rank #{u.rank} ({u.rankBy})</div>
                                <div className="flex items-center gap-2.5"><span className="material-symbols-outlined text-purple-400">history_edu</span>Founded {u.founded}</div>
                                {u.website && (
                                    <a href={u.website} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-purple-300 hover:text-white transition-colors group">
                                        <span className="material-symbols-outlined text-purple-400">public</span>
                                        <span>{u.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                                        <span className="material-symbols-outlined text-xs group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">north_east</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                            <div className="text-purple-400 text-[10px] font-black uppercase tracking-widest mb-1">Acceptance Rate</div>
                            <div className="text-3xl font-black text-white">{u.acceptanceRate}%</div>
                        </div>
                        <div className="w-px h-12 bg-white/10 mx-2" />
                        <div className="text-right">
                            <div className="text-purple-400 text-[10px] font-black uppercase tracking-widest mb-1">Avg. Tuition</div>
                            <div className="text-3xl font-black text-white">{u.currency} {Math.round(u.tuition / 1000)}k</div>
                        </div>
                        <div className="ml-4 flex flex-col gap-3">
                            {u.website && (
                                <a href={u.website} target="_blank" rel="noreferrer" className="px-4 py-3 bg-white text-gray-900 font-black text-sm rounded-xl shadow hover:shadow-md">Visit Website</a>
                            )}
                            <Link href={`/apply-loan?university=${encodeURIComponent(u.name)}&country=${encodeURIComponent(u.country)}`} className="px-4 py-3 bg-[#ffebff] text-[#6605c7] font-black text-sm rounded-xl shadow hover:shadow-md">Start Loan Application</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── STICKY NAVIGATION ── */}
            <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-gray-100 px-6 py-2 shadow-sm hidden md:block">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleScroll(item.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeSection === item.id
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                                    : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                                    }`}
                            >
                                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/apply-loan?university=${encodeURIComponent(u.name)}&country=${encodeURIComponent(u.country)}`}
                            className="px-6 py-3 bg-[#6605c7] text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg hover:shadow-purple-500/30 transition-all hover:-translate-y-0.5"
                        >
                            Start Loan Application
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── CONTENT GRID ── */}
            <div className="max-w-[1600px] mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Left Main Content (8 cols) */}
                    <div className="lg:col-span-8 space-y-20">

                        {/* Overview Section */}
                        <section id="overview">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
                                    <span className="material-symbols-outlined">info</span>
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">University Overview</h2>
                            </div>
                            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-purple-500/5 border border-purple-50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <img src={u.logo || logoFallback} alt="" className="w-64 h-64 grayscale object-contain" />
                                </div>
                                <p className="text-gray-600 text-lg leading-relaxed mb-10 relative z-10">
                                    {u.description}
                                </p>

                                {u.whyStudyHere && u.whyStudyHere.length > 0 && (
                                    <div className="mb-10 relative z-10">
                                        <h4 className="text-sm font-black text-purple-600 uppercase tracking-widest mb-6">Why Study at {u.shortName}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {u.whyStudyHere.map((reason, i) => (
                                                <div key={i} className="flex gap-4">
                                                    <span className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs flex-shrink-0">{i + 1}</span>
                                                    <p className="text-gray-600 text-sm font-medium leading-relaxed">{reason}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* Gallery */}
                                {u.campusImages && u.campusImages.length > 0 && (
                                    <div className="mb-10 relative z-10">
                                        <h4 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-6">Campus Gallery</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {u.campusImages.map((img: string, i: number) => (
                                                <button key={i} onClick={() => setLightboxImage(img)}
                                                    className="overflow-hidden rounded-2xl shadow-sm bg-white border border-gray-100 p-0">
                                                    <img src={img} alt={`${u.name} campus ${i + 1}`} className="w-full h-40 object-cover hover:scale-105 transition-transform" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {lightboxImage && <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                    {u.pros.map((pro, i) => (
                                        <div key={i} className="flex items-start gap-4 p-5 bg-purple-50/50 rounded-2xl border border-purple-100/50 group hover:bg-purple-50 transition-colors">
                                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 shrink-0">
                                                <span className="material-symbols-outlined text-sm">verified</span>
                                            </div>
                                            <span className="text-gray-700 font-bold text-sm leading-snug">{pro}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Fun Facts Section */}
                        {u.funFacts && u.funFacts.length > 0 && (
                            <section id="fun-facts">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                                        <span className="material-symbols-outlined text-2xl">lightbulb</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">University Highlights</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {u.funFacts.map((fact, i) => (
                                        <div key={i} className="p-8 bg-gradient-to-br from-amber-50 to-orange-50 rounded-[2rem] border border-amber-100 shadow-sm relative overflow-hidden group">
                                            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                                                <span className="material-symbols-outlined text-8xl text-amber-600">auto_awesome</span>
                                            </div>
                                            <p className="text-gray-800 text-sm font-bold leading-relaxed relative z-10">{fact}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Programs Grid */}
                        <section id="programs">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                                        <span className="material-symbols-outlined">auto_stories</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Top Programs</h2>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {u.programs.map((p, i) => (
                                    <div key={i} className="group p-6 bg-white rounded-3xl border border-gray-100 hover:border-purple-200 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 relative overflow-hidden">
                                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-50 rounded-full transition-transform duration-500 group-hover:scale-150" />
                                        <div className="relative z-10">
                                            <div
                                                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3"
                                                style={{ background: u.gradient || 'linear-gradient(135deg, #6605c7, #8b5cf6)' }}
                                            >
                                                <span className="material-symbols-outlined text-2xl">{p.icon}</span>
                                            </div>
                                            <h3 className="text-xl font-black text-gray-900 mb-2">{p.name}</h3>
                                            <p className="text-gray-500 text-sm font-medium mb-6">{p.degree} • {p.duration}</p>
                                            <div className="flex items-center justify-between pt-6 border-t border-gray-50 text-xs font-black text-purple-600 uppercase tracking-widest">{p.tuition}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Admissions Section */}
                        <section id="admissions">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                                    <span className="material-symbols-outlined">assignment_turned_in</span>
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Admission Criteria</h2>
                            </div>
                            <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div>
                                        <h4 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">Documents</h4>
                                        <ul className="space-y-4">
                                            {["Academic Transcripts", "Statement of Purpose", "LORs", "Updated Resume", "Passport Copy"].map((doc, i) => (
                                                <li key={i} className="flex items-center gap-3 text-gray-600 font-bold text-sm">
                                                    <span className="material-symbols-outlined text-amber-500 text-lg">check_circle</span>
                                                    {doc}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="space-y-6">
                                        <h4 className="text-lg font-black text-gray-900">Minimum Requirements</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-gray-50 rounded-2xl">
                                                <div className="text-[10px] font-black text-gray-400 uppercase mb-1">GPA Req.</div>
                                                <div className="text-lg font-black text-gray-900">{u.requirements.gpa}</div>
                                            </div>
                                            <div className="p-4 bg-gray-50 rounded-2xl">
                                                <div className="text-[10px] font-black text-gray-400 uppercase mb-1">IELTS</div>
                                                <div className="text-lg font-black text-gray-900">{u.requirements.ielts}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Scholarships Section */}
                        <section id="scholarships">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                                    <span className="material-symbols-outlined">card_giftcard</span>
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Financial Aid</h2>
                            </div>
                            <div className="bg-emerald-50/50 rounded-[2.5rem] p-10 border border-emerald-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { name: "Academic Merit", amount: "Up to 50%", desc: "Top 5% profiles." },
                                        { name: "International Excellence", amount: "Fixed amount", desc: "Holistic evaluation." }
                                    ].map((s, i) => (
                                        <div key={i} className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm">
                                            <div className="text-xs font-black text-emerald-600 uppercase mb-1">{s.amount}</div>
                                            <h4 className="text-lg font-black text-gray-900 mb-2">{s.name}</h4>
                                            <p className="text-gray-500 text-sm font-medium">{s.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Campus Facilities */}
                        {u.campusFacilities && u.campusFacilities.length > 0 && (
                            <section id="campus-life">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                                        <span className="material-symbols-outlined">apartment</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Campus Facilities</h2>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {u.campusFacilities.map((fac, i) => {
                                        const name = typeof fac === 'string' ? fac : fac.name;
                                        const icon = typeof fac === 'string' ? 'apartment' : fac.icon;
                                        return (
                                            <div key={i} className="p-6 bg-white rounded-3xl border border-gray-100 flex flex-col items-center text-center hover:bg-indigo-50/50 transition-all">
                                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
                                                    <span className="material-symbols-outlined">{icon || 'apartment'}</span>
                                                </div>
                                                <span className="text-xs font-black text-gray-900 uppercase tracking-tight leading-tight">{name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Alumni Section */}
                        {u.notableAlumni && u.notableAlumni.length > 0 && (
                            <section id="alumni">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
                                        <span className="material-symbols-outlined">groups_3</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Notable Alumni</h2>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                    {u.notableAlumni.map((a: any, i: number) => (
                                        <div key={i} className="text-center group">
                                            <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-white shadow-lg mb-4 ring-2 ring-rose-50 transition-transform group-hover:scale-110">
                                                <img src={a.img || `https://i.pravatar.cc/150?u=${i + 10}`} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="text-sm font-black text-gray-900">{typeof a === 'string' ? a : a.name}</div>
                                            <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">{a.company || 'Distinguished Alumni'}</div>
                                            <div className="text-[9px] text-gray-400 font-bold uppercase">{a.role || 'Professional'}</div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Financing Section */}
                        <section id="financing">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
                                    <span className="material-symbols-outlined">analytics</span>
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Financing & ROI</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white p-8 rounded-[2.5rem] border border-purple-100 shadow-md">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-[#6605c7] rounded-xl flex items-center justify-center text-white">
                                            <span className="material-symbols-outlined">verified</span>
                                        </div>
                                        <div className="text-lg font-black text-gray-900">GradRight Insights</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-purple-50 rounded-2xl">
                                            <div className="text-2xl font-black text-purple-600">{u.stats.employmentRate}</div>
                                            <div className="text-[10px] text-purple-400 font-black uppercase tracking-widest mt-1">Employment Rate</div>
                                        </div>
                                        <div className="p-4 bg-emerald-50 rounded-2xl">
                                            <div className="text-2xl font-black text-emerald-600">4.5x</div>
                                            <div className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mt-1">ROI Multiplier</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white flex flex-col justify-between">
                                    <h3 className="text-xl font-black mb-4">VidhyaLoan Advantage</h3>
                                    <Link href={`/apply-loan?university=${encodeURIComponent(u.name)}&country=${encodeURIComponent(u.country)}`} className="block w-full py-5 bg-white text-gray-900 font-black rounded-2xl text-center shadow-xl hover:-translate-y-1 transition-all">Get Funding Now</Link>
                                    {u.loanInfo && (
                                        <div className="mt-6 text-sm text-gray-100">
                                            <div className="font-bold mb-2">Loan Info</div>
                                            <div className="text-xs">Lenders: {Array.isArray(u.loanInfo.availableLenders) ? u.loanInfo.availableLenders.join(', ') : u.loanInfo.availableLenders}</div>
                                            <div className="text-xs">Avg Loan: {u.loanInfo.avgLoanAmount}</div>
                                            <div className="text-xs">Collateral Free: {u.loanInfo.collateralFree ? 'Yes' : 'Usually No'}</div>
                                            <div className="text-xs">Fast-track: {u.loanInfo.fastTrack ? 'Available' : 'Standard'}</div>
                                            {u.loanInfo.notes && <div className="mt-2 text-xs italic">{u.loanInfo.notes}</div>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Sidebar (4 cols) */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="sticky top-28 space-y-8">
                            <div className="rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl" style={{ background: u.gradient || 'linear-gradient(135deg, #1e0b50, #6605c7)' }}>
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-black mb-4">Instant Loan Check</h3>
                                    <p className="text-white/70 text-sm font-medium mb-10 leading-relaxed">
                                        Matched funding available for programs at {u.name}.
                                    </p>
                                    <Link href={`/apply-loan?university=${encodeURIComponent(u.name)}&country=${encodeURIComponent(u.country)}`} className="block w-full py-5 bg-white text-[#6605c7] font-black rounded-2xl text-center shadow-xl hover:-translate-y-1 transition-all">Apply with VidhyaLoans</Link>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Key Stats</h3>
                                <div className="space-y-6">
                                    {[
                                        { label: 'Total Students', val: u.stats.totalStudents, icon: 'groups' },
                                        { label: 'International', val: u.stats.internationalStudents, icon: 'public' },
                                        { label: 'Faculty Ratio', val: u.stats.facultyRatio, icon: 'person_search' },
                                        { label: 'Avg Graduate Salary', val: u.stats.avgSalary, icon: 'payments' }
                                    ].map((stat, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-gray-400">{stat.icon}</span>
                                                <span className="text-sm font-bold text-gray-600">{stat.label}</span>
                                            </div>
                                            <span className="text-sm font-black text-gray-900">{stat.val}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {u.topRecruiters && u.topRecruiters.length > 0 && (
                                <div className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Top Recruiters</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {u.topRecruiters.map((r: string, i: number) => (
                                            <span key={i} className="px-3 py-2 bg-gray-50 rounded-full text-xs font-bold text-gray-700 border border-gray-100">{r}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
