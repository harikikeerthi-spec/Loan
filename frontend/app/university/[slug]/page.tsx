
import { universities } from "@/lib/universityData";
import { notFound } from "next/navigation";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    return Object.keys(universities).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
    const { slug } = await params;
    const u = universities[slug];
    if (!u) return {};
    return {
        title: `${u.name} – Rankings, Programs & Education Loan | VidhyaLoan`,
        description: `Apply to ${u.shortName} with a VidhyaLoan education loan. Explore QS Rank #${u.rank}, ${u.acceptanceRate}% acceptance rate, programs, tuition, and loan info.`,
    };
}

export default async function UniversityPage({ params }: Props) {
    const { slug } = await params;
    let u = universities[slug];

    // If not found in static data, try to fetch from AI API
    if (!u) {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const resp = await fetch(`${baseUrl}/api/ai-search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'university_detail', slug })
            });
            if (resp.ok) {
                const data = await resp.json();
                if (data.university) {
                    u = {
                        ...data.university,
                        badge: data.university.badge || 'AI Verified',
                        gradient: data.university.gradient || 'linear-gradient(135deg, #6605c7 0%, #4c0495 100%)',
                        stats: data.university.stats || {
                            totalStudents: '10,000+',
                            internationalStudents: '15%',
                            facultyRatio: '12:1',
                            researchOutput: 'High',
                            employmentRate: '90%',
                            avgSalary: '$70K'
                        },
                        programs: data.university.programs || [],
                        pros: data.university.pros || [],
                        campusImages: data.university.campusImages || [],
                        campusFacilities: data.university.campusFacilities || [],
                        requirements: data.university.requirements || { gpa: '7.0+', ielts: '6.5', toefl: '90', gre: 'Optional' },
                        loanInfo: data.university.loanInfo || {
                            availableLenders: ['VidhyaLoan Partners'],
                            avgLoanAmount: '₹30-50L',
                            collateralFree: true,
                            fastTrack: true,
                            notes: 'Contact counselor for best rates.'
                        }
                    };
                }
            }
        } catch (e) {
            console.error('Failed to fetch AI university details', e);
        }
    }

    if (!u) notFound();

    const tuitionFmt = u.currency === "USD"
        ? `$${u.tuition.toLocaleString()}/yr`
        : u.currency === "GBP"
            ? `£${u.tuition.toLocaleString()}/yr`
            : u.currency === "EUR"
                ? `€${u.tuition.toLocaleString()}/yr`
                : `${u.currency || 'USD'} ${u.tuition?.toLocaleString() || '0'}/yr`;

    const flagUrl = `https://flagcdn.com/w40/${u.countryCode || 'us'}.png`;
    const logoFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.shortName || u.name)}&background=6605c7&color=fff&size=120`;
    const heroFallback = `https://images.unsplash.com/photo-1523050335392-93851179ae22?w=1600&q=80`;

    return (
        <main className="min-h-screen bg-[#fcfaff] selection:bg-purple-100 selection:text-purple-900">
            {/* ── CUSTOM HEADER (Replacing Navbar) ── */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-purple-100/50 px-6 py-4">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/onboarding" className="p-2 hover:bg-purple-50 rounded-full transition-colors group">
                            <span className="material-symbols-outlined text-purple-600 block group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        </Link>
                        <div className="hidden sm:flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center p-2">
                                <img src={u.logo || logoFallback} alt="" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{u.country}</div>
                                <div className="text-sm font-black text-gray-900 leading-tight">{u.shortName}</div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 group mr-4">
                            <div className="w-8 h-8 bg-[#6605c7] rounded-lg flex items-center justify-center text-white shadow-lg shadow-[#6605c7]/30">
                                <span className="material-symbols-outlined text-sm">school</span>
                            </div>
                            <span className="text-lg font-bold tracking-tight text-[#1a1626]">VidhyaLoan</span>
                        </Link>
                        <Link
                            href="/apply-loan"
                            className="px-6 py-2.5 bg-gradient-to-r from-[#6605c7] to-[#8b5cf6] text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all hidden md:flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-base">payments</span>
                            Apply Now
                        </Link>
                    </div>
                </div>
            </header>

            {/* ── HERO SECTION ── */}
            <section className="relative pt-[88px]">
                <div className="mx-6 rounded-[2.5rem] overflow-hidden relative group">
                    <div
                        className="h-[500px] md:h-[650px] w-full bg-no-repeat bg-center bg-cover transition-transform duration-1000 group-hover:scale-105"
                        style={{ backgroundImage: `url('${u.heroImage || heroFallback}')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

                    {/* Hero Content Overlays */}
                    <div className="absolute inset-0 flex items-end">
                        <div className="w-full max-w-[1600px] mx-auto px-8 md:px-12 pb-12 md:pb-20">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                                <div className="max-w-3xl">
                                    <div className="flex flex-wrap items-center gap-3 mb-6">
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                                            <img src={flagUrl} alt="" className="w-5 h-3.5 object-cover rounded-sm" />
                                            <span className="text-white text-xs font-bold uppercase tracking-wider">{u.country}</span>
                                        </div>
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-400 rounded-full text-yellow-900 font-black text-xs">
                                            <span className="material-symbols-outlined text-sm">trophy</span>
                                            QS Rank #{u.rank}
                                        </div>
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-400 rounded-full text-emerald-950 font-black text-xs">
                                            <span className="material-symbols-outlined text-sm">check_circle</span>
                                            {u.badge}
                                        </div>
                                    </div>
                                    <h1 className="text-4xl md:text-7xl font-black text-white leading-[1.1] mb-6 tracking-tight">
                                        {u.name}
                                    </h1>
                                    {/* AI Insight Pill */}
                                    <div className="mb-8 p-4 bg-purple-500/20 backdrop-blur-md rounded-2xl border border-purple-400/30 flex items-start gap-3 group/ai">
                                        <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-purple-500/40">
                                            <span className="material-symbols-outlined text-lg animate-pulse">psychology</span>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-purple-300 uppercase tracking-widest mb-1">AI Match Insight</div>
                                            <p className="text-white/90 text-[13px] font-medium leading-relaxed italic">
                                                "Highly competitive profile match for {u.shortName}. Recommended for students seeking {u.stats.researchOutput === 'High' ? 'research-heavy' : 'industry-focused'} careers with potentially high ROI of {(parseFloat(u.stats.avgSalary.replace(/[^0-9.]/g, '')) / 50).toFixed(1)}x."
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-y-4 gap-x-8 text-white/70 text-sm md:text-base font-medium">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-purple-400">location_on</span>
                                            {u.location}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-purple-400">history</span>
                                            Established {u.founded}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-purple-400">account_balance</span>
                                            {u.type}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Snapshot Card on Hero */}
                                <div className="bg-white/10 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/20 min-w-[280px] hidden lg:block">
                                    <div className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Quick Snapshot</div>
                                    <div className="space-y-6">
                                        <div>
                                            <div className="text-emerald-400 text-2xl font-black mb-1">{u.acceptanceRate}%</div>
                                            <div className="text-white/70 text-xs font-bold">Acceptance Rate</div>
                                        </div>
                                        <div>
                                            <div className="text-purple-400 text-2xl font-black mb-1">{tuitionFmt}</div>
                                            <div className="text-white/70 text-xs font-bold">Base Tuition Fees</div>
                                        </div>
                                        <div>
                                            <div className="text-blue-400 text-2xl font-black mb-1">{u.stats.avgSalary}</div>
                                            <div className="text-white/70 text-xs font-bold">Avg. Starting Salary</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── STICKY SUB-NAV ── */}
            <div className="sticky top-[80px] z-40 bg-white/95 backdrop-blur-md border-b border-purple-100 hidden md:block">
                <div className="max-w-[1600px] mx-auto px-10 flex items-center gap-12 h-16">
                    {['Overview', 'Programs', 'Admissions', 'Scholarships', 'Campus Life', 'Alumni', 'Financing'].map((section) => (
                        <button
                            key={section}
                            onClick={() => document.getElementById(section.toLowerCase().replace(' ', '-'))?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                            className="text-sm font-black text-gray-400 hover:text-purple-600 transition-colors uppercase tracking-[0.1em]"
                        >
                            {section}
                        </button>
                    ))}
                </div>
            </div>

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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                    {u.pros.map((pro: string, i: number) => (
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

                        {/* Programs Grid */}
                        <section id="programs">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                                        <span className="material-symbols-outlined">auto_stories</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Top Programs</h2>
                                </div>
                                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest bg-purple-50 px-4 py-2 rounded-full border border-purple-100">
                                    {u.programs.length} Specializations
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {u.programs.map((p: any, i: number) => (
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
                                            <p className="text-gray-500 text-sm font-medium mb-6">Master's • {p.duration}</p>
                                            <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                                <div className="text-xs font-black text-purple-600 uppercase tracking-widest">{p.tuition}</div>
                                                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Admissions Detailed Section */}
                        <section id="admissions">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                                    <span className="material-symbols-outlined">assignment_turned_in</span>
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Admission Criteria & Deadlines</h2>
                            </div>
                            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div>
                                        <h4 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                                            Required Documents
                                        </h4>
                                        <ul className="space-y-4">
                                            {["Academic Transcripts (official)", "SOP - High Impact", "3 Professional/Academic LORs", "Updated Resume/CV", "Valid Passport copy"].map((doc, i) => (
                                                <li key={i} className="flex items-center gap-3 text-gray-600 font-bold text-sm">
                                                    <span className="material-symbols-outlined text-amber-500 text-lg">check_circle</span>
                                                    {doc}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                            Intake Deadlines
                                        </h4>
                                        <div className="space-y-4">
                                            {[
                                                { intake: "Fall 2025", deadline: "15 Jan 2025", status: "Priority" },
                                                { intake: "Fall 2025", deadline: "01 Mar 2025", status: "Final" },
                                                { intake: "Spring 2026", deadline: "01 Sep 2025", status: "Upcoming" }
                                            ].map((d, i) => (
                                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                    <div>
                                                        <div className="text-sm font-black text-gray-900">{d.intake}</div>
                                                        <div className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Deadline: {d.deadline}</div>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${d.status === 'Priority' ? 'bg-amber-100 text-amber-600' : 'bg-gray-200 text-gray-500'}`}>
                                                        {d.status}
                                                    </span>
                                                </div>
                                            ))}
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
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Financial Aid & Scholarships</h2>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[2.5rem] p-10 border border-emerald-100 relative overflow-hidden">
                                <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-emerald-200/20 rounded-full blur-[60px]" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                    {[
                                        { name: "Academic Merit Scholarship", amount: "Up to 50% Tuition", desc: "Awarded automatically to top 5% profiles." },
                                        { name: "International Excellence Award", amount: "Fixed $10,000", desc: "Based on holistic profile evaluation." },
                                        { name: "Diversity Grant", amount: "Up to 25% Tuition", desc: "For underrepresented region candidates." },
                                        { name: "Need-based Bursaries", amount: "Variable", desc: "Based on proven financial requirements." }
                                    ].map((s, i) => (
                                        <div key={i} className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm hover:shadow-lg transition-all group">
                                            <div className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">{s.amount}</div>
                                            <h4 className="text-lg font-black text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">{s.name}</h4>
                                            <p className="text-gray-500 text-sm font-medium leading-relaxed">{s.desc}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-10 p-6 bg-emerald-600 rounded-3xl flex items-center justify-between text-white">
                                    <div className="flex items-center gap-4">
                                        <span className="material-symbols-outlined text-3xl">lightbulb</span>
                                        <div>
                                            <div className="font-black text-lg">Scholarship Strategy Session</div>
                                            <div className="text-emerald-100 text-sm">Our mentors help you draft high-impact essays.</div>
                                        </div>
                                    </div>
                                    <button className="px-6 py-3 bg-white text-emerald-600 font-black rounded-2xl hover:bg-emerald-50 transition-colors">Apply Strategy</button>
                                </div>
                            </div>
                        </section>

                        {/* Campus Atmosphere & Housing */}
                        <section id="campus-life">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                                    <span className="material-symbols-outlined">apartment</span>
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Accommodation & Living</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white rounded-[2.5rem] overflow-hidden border border-indigo-50 shadow-sm group">
                                    <div className="h-64 overflow-hidden relative">
                                        <img src="https://images.unsplash.com/photo-1555854817-40e098ee7f25?w=800&q=80" alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                        <div className="absolute top-6 left-6 px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl">On-Campus</div>
                                    </div>
                                    <div className="p-8">
                                        <h4 className="text-xl font-black text-gray-900 mb-4">University Halls</h4>
                                        <p className="text-gray-500 text-sm mb-6 font-medium">Safe, connected and inclusive living sharing spaces with peers from 100+ nations.</p>
                                        <div className="space-y-3">
                                            {["Fully Furnished Rooms", "Meal Plans Included", "24/7 Security", "Gym & Study Zones"].map(f => (
                                                <div key={f} className="flex items-center gap-2 text-gray-600 font-bold text-xs uppercase tracking-tight">
                                                    <span className="material-symbols-outlined text-indigo-500 text-base">task_alt</span>
                                                    {f}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-[2.5rem] overflow-hidden border border-purple-50 shadow-sm group">
                                    <div className="h-64 overflow-hidden relative">
                                        <img src="https://images.unsplash.com/photo-1513584684374-8bdb7489feef?w=800&q=80" alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                        <div className="absolute top-6 left-6 px-4 py-2 bg-purple-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl">Off-Campus</div>
                                    </div>
                                    <div className="p-8">
                                        <h4 className="text-xl font-black text-gray-900 mb-4">Private Studios</h4>
                                        <p className="text-gray-500 text-sm mb-6 font-medium">Independent living within walking distance of the university building.</p>
                                        <div className="space-y-3">
                                            {["Private En-suite", "Shared Kitchen Options", "Broadband Included", "Near City Center"].map(f => (
                                                <div key={f} className="flex items-center gap-2 text-gray-600 font-bold text-xs uppercase tracking-tight">
                                                    <span className="material-symbols-outlined text-purple-500 text-base">task_alt</span>
                                                    {f}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Notable Alumni */}
                        <section id="alumni">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
                                    <span className="material-symbols-outlined">groups_3</span>
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">The Alumni Legacy</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                {[
                                    { name: "Arjun Mehta", company: "Google AI", role: "Principal Scientist", img: "https://i.pravatar.cc/150?u=1" },
                                    { name: "Sarah Chen", company: "Tesla", role: "VP Engineering", img: "https://i.pravatar.cc/150?u=2" },
                                    { name: "Rahul Gupta", company: "Goldman Sachs", role: "Managing Director", img: "https://i.pravatar.cc/150?u=3" },
                                    { name: "David Kim", company: "OpenAI", role: "Founding Engineer", img: "https://i.pravatar.cc/150?u=4" }
                                ].map((a, i) => (
                                    <div key={i} className="text-center group">
                                        <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-white shadow-lg mb-4 ring-2 ring-rose-50 transition-transform group-hover:scale-110">
                                            <img src={a.img} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="text-sm font-black text-gray-900">{a.name}</div>
                                        <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">{a.company}</div>
                                        <div className="text-[9px] text-gray-400 font-bold uppercase">{a.role}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-12 p-10 bg-gray-900 rounded-[2.5rem] text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#rose-500 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                                <h3 className="text-2xl font-black text-white mb-4 relative z-10">Global Alumni Network: 250,000+ Strong</h3>
                                <p className="text-gray-400 text-sm max-w-2xl mx-auto leading-relaxed relative z-10">Connect with peers across 140 countries. Our dedicated alumni portal facilitates mentorships, job referrals, and networking events for all graduates.</p>
                            </div>
                        </section>

                        {/* Financing & GradRight Integration */}
                        <section id="financing">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
                                    <span className="material-symbols-outlined">analytics</span>
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight">GradRight Insights & Financing</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white p-8 rounded-[2.5rem] border border-purple-100 shadow-[0_20px_40px_rgba(102,5,199,0.05)] relative group">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 bg-[#6605c7] rounded-xl flex items-center justify-center text-white">
                                            <span className="material-symbols-outlined text-xl">verified</span>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-purple-600 uppercase tracking-widest leading-none">Powered By</div>
                                            <div className="text-lg font-black text-gray-900 tracking-tight">GradRight Data</div>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 text-sm font-medium leading-relaxed mb-10">
                                        Leveraging official GradRight/Credenc algorithms to analyze loan success rates and ROI for <strong>{u.shortName}</strong> applicants.
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="p-4 bg-purple-50 rounded-2xl">
                                            <div className="text-2xl font-black text-purple-600">92%</div>
                                            <div className="text-[10px] text-purple-400 font-black uppercase tracking-widest mt-1">Loan Success Rate</div>
                                        </div>
                                        <div className="p-4 bg-emerald-50 rounded-2xl">
                                            <div className="text-2xl font-black text-emerald-600">4.5x</div>
                                            <div className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mt-1">ROI Multiplier</div>
                                        </div>
                                    </div>
                                    <a href="https://gradright.com" target="_blank" rel="noopener noreferrer" className="block text-center py-4 text-purple-600 font-black text-xs uppercase tracking-[0.2em] border-2 border-purple-100 rounded-2xl hover:bg-purple-50 transition-colors">
                                        Deep Dive on GradRight →
                                    </a>
                                </div>

                                <div className="bg-gradient-to-br from-gray-900 to-[#1a1626] p-8 rounded-[2.5rem] text-white relative flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-2xl font-black mb-4">VidhyaLoan Advantage</h3>
                                        <p className="text-gray-400 text-sm leading-relaxed mb-8">Exclusive financing pathways for {u.country} institutions with lower processing fees and collateral-free options.</p>
                                    </div>
                                    <div className="space-y-4">
                                        <button onClick={() => window.location.href = '/apply-loan'} className="w-full py-5 bg-white text-gray-900 font-black rounded-2xl shadow-xl hover:-translate-y-1 transition-all">Get Your Ref Number</button>
                                        <div className="text-[10px] text-center text-gray-500 font-bold uppercase tracking-widest">Takes less than 3 minutes</div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Sidebar (4 cols) */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* Sticky Sidebar Container */}
                        <div className="sticky top-28 space-y-8">

                            {/* Loan Application Magic Card */}
                            <div className="rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-purple-900/40" style={{ background: u.gradient || 'linear-gradient(135deg, #1e0b50, #6605c7)' }}>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-150" />
                                <div className="relative z-10">
                                    <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8 border border-white/20">
                                        <span className="material-symbols-outlined text-white text-3xl">account_balance</span>
                                    </div>
                                    <h3 className="text-2xl font-black mb-2 leading-tight">Secure Your Education Fund</h3>
                                    <p className="text-white/70 text-sm font-medium mb-10 leading-relaxed">
                                        Matched funding available for {u.shortName} programs. Get your sanction letter in 48 hours.
                                    </p>

                                    <div className="space-y-6 mb-12">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-emerald-400/20 rounded-full flex items-center justify-center text-emerald-400">
                                                <span className="material-symbols-outlined text-base">check</span>
                                            </div>
                                            <div>
                                                <div className="text-xs font-black uppercase tracking-widest text-emerald-400">Low Interest</div>
                                                <div className="text-white font-bold">Starting @ 8.5% p.a.</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-blue-400/20 rounded-full flex items-center justify-center text-blue-400">
                                                <span className="material-symbols-outlined text-base">bolt</span>
                                            </div>
                                            <div>
                                                <div className="text-xs font-black uppercase tracking-widest text-blue-400">Fast Disbursement</div>
                                                <div className="text-white font-bold">Funds in 2-4 Days</div>
                                            </div>
                                        </div>
                                    </div>

                                    <Link
                                        href="/apply-loan"
                                        className="block w-full py-5 bg-white text-[#6605c7] font-black text-center rounded-[2rem] shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95"
                                    >
                                        Get Approved Fast
                                    </Link>
                                </div>
                            </div>

                            {/* Admission Criteria Box */}
                            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-purple-500/5 border border-purple-50">
                                <h3 className="text-xl font-black text-gray-900 mb-8 tracking-tight">Eligibility Criteria</h3>
                                <div className="space-y-4">
                                    {[
                                        { label: "Recommended GPA", value: u.requirements.gpa, icon: "grade", color: "text-amber-500", bg: "bg-amber-50" },
                                        { label: "IELTS Proficiency", value: u.requirements.ielts, icon: "translate", color: "text-blue-500", bg: "bg-blue-50" },
                                        { label: "TOEFL Equivalent", value: u.requirements.toefl, icon: "record_voice_over", color: "text-purple-500", bg: "bg-purple-50" },
                                        { label: "GRE Requirement", value: u.requirements.gre, icon: "edit_calendar", color: "text-rose-500", bg: "bg-rose-50" },
                                    ].map((item: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl group hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 ${item.bg} ${item.color} rounded-lg flex items-center justify-center`}>
                                                    <span className="material-symbols-outlined text-sm">{item.icon}</span>
                                                </div>
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{item.label}</span>
                                            </div>
                                            <span className="text-sm font-black text-gray-900">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Counseling CTA */}
                            <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                                <div className="absolute bottom-0 right-0 p-4 opacity-20 transform translate-x-4 translate-y-4">
                                    <span className="material-symbols-outlined text-[120px]">psychology</span>
                                </div>
                                <h3 className="text-xl font-black mb-4 relative z-10">Expert Counseling</h3>
                                <p className="text-gray-400 text-sm mb-8 leading-relaxed relative z-10">
                                    Talk to our {u.country} education experts for a personalized roadmap to {u.shortName}.
                                </p>
                                <Link href="/contact" className="inline-flex items-center gap-2 text-white font-bold text-sm bg-purple-600 px-8 py-4 rounded-2xl hover:bg-purple-500 transition-all relative z-10">
                                    Book Free Session
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FOOTER REFERENCE ── */}
            <footer className="max-w-[1600px] mx-auto px-6 py-20 border-t border-purple-100/50 text-center">
                <div className="flex flex-col items-center gap-6">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-[#6605c7] rounded-xl flex items-center justify-center text-white shadow-lg">
                            <span className="material-symbols-outlined text-base">school</span>
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-[#1a1626]">VidhyaLoan</span>
                    </Link>
                    <p className="text-gray-400 text-sm max-w-lg leading-relaxed">
                        Helping you secure your future at global institutions like <strong>{u.name}</strong> without financial barriers. Verified data powered by GradRight.
                    </p>
                    <div className="flex gap-4 mt-8">
                        <Link href="/onboarding" className="text-purple-600 font-bold hover:underline">Find More Universities</Link>
                        <span className="text-gray-300">•</span>
                        <Link href="/apply-loan" className="text-purple-600 font-bold hover:underline">Loan Comparison</Link>
                    </div>
                </div>
            </footer>
        </main>
    );
}
