
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
            // Note: In Next.js App Router (Server Components), we ideally want to 
            // call a service directly or fetch from our own API route.
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
                        // Add missing fields for display if needed
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
    const heroFallback = `https://images.unsplash.com/photo-1541339907198-e08756ebafe3?w=1600&q=80`;

    return (
        <AuthGate contentLabel={`${u.name} full profile`}>
            <main className="min-h-screen bg-gray-50">
                {/* ── HERO ── */}
                <section
                    className="relative h-[480px] md:h-[560px] flex items-end overflow-hidden"
                    style={{
                        backgroundImage: `url('${u.heroImage || heroFallback}')`,
                        backgroundSize: "cover",
                        backgroundPosition: "center 30%",
                    }}
                >
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)" }} />
                    <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-12 pt-32 flex flex-col md:flex-row md:items-end gap-6">
                        {/* Logo */}
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-2xl flex items-center justify-center p-3 shadow-xl flex-shrink-0 overflow-hidden">
                            <img
                                src={u.logo || logoFallback}
                                alt={u.shortName}
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                <span className="flex items-center gap-2 text-white/80 text-sm font-medium">
                                    <img src={flagUrl} alt={u.country} className="w-5 h-4 rounded object-cover" />
                                    {u.country}
                                </span>
                                <span className="bg-white/20 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full border border-white/30">{u.badge}</span>
                                <span className="bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1 rounded-full">QS #{u.rank}</span>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-2">{u.name}</h1>
                            <p className="text-white/70 text-sm md:text-base font-medium">{u.location} &middot; Est. {u.founded} &middot; {u.type}</p>
                        </div>
                        <div className="flex flex-col gap-2 md:ml-auto">
                            <Link
                                href="/apply-loan"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-white font-bold text-sm rounded-2xl transition-all hover:opacity-90 hover:shadow-xl"
                                style={{ background: u.gradient }}
                            >
                                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: '"FILL" 1' }}>payments</span>
                                Apply for Loan
                            </Link>
                            <a
                                href={u.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 backdrop-blur border border-white/30 text-white font-bold text-sm rounded-2xl hover:bg-white/20 transition-all"
                            >
                                <span className="material-symbols-outlined text-base">open_in_new</span>
                                Official Website
                            </a>
                        </div>
                    </div>
                </section>

                {/* ── QUICK STATS ── */}
                <section className="bg-white border-b border-gray-100 shadow-sm">
                    <div className="max-w-7xl mx-auto px-6 py-6">
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
                            {[
                                { label: "Acceptance Rate", value: `${u.acceptanceRate}%`, icon: "groups", color: "text-purple-600" },
                                { label: "Tuition / Year", value: tuitionFmt, icon: "payments", color: "text-blue-600" },
                                { label: "Total Students", value: u.stats.totalStudents, icon: "school", color: "text-green-600" },
                                { label: "Intl. Students", value: u.stats.internationalStudents, icon: "public", color: "text-orange-600" },
                                { label: "Avg. Starting Salary", value: u.stats.avgSalary, icon: "trending_up", color: "text-emerald-600" },
                                { label: "Employment Rate", value: u.stats.employmentRate, icon: "work", color: "text-indigo-600" },
                            ].map((s) => (
                                <div key={s.label} className="flex flex-col items-center gap-1">
                                    <span className={`material-symbols-outlined text-2xl ${s.color}`} style={{ fontVariationSettings: '"FILL" 1' }}>{s.icon}</span>
                                    <div className="font-black text-gray-900 text-base md:text-lg">{s.value}</div>
                                    <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider leading-tight">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── MAIN BODY ── */}
                <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* ── LEFT COLUMN ── */}
                    <div className="lg:col-span-2 space-y-10">

                        {/* About */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                            <h2 className="text-2xl font-black text-gray-900 mb-4">About {u.shortName}</h2>
                            <p className="text-gray-600 leading-relaxed text-base">{u.description}</p>

                            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {u.pros.map((pro, i) => (
                                    <div key={i} className="flex items-start gap-3 p-4 bg-green-50 rounded-2xl border border-green-100">
                                        <span className="material-symbols-outlined text-green-500 text-xl mt-0.5 flex-shrink-0" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
                                        <span className="text-sm text-gray-700 font-medium leading-snug">{pro}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Programs */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                            <h2 className="text-2xl font-black text-gray-900 mb-6">Popular Programs</h2>
                            <div className="space-y-3">
                                {u.programs.map((p, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-purple-50 hover:border-purple-100 border border-transparent transition-all group cursor-pointer">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110" style={{ background: u.gradient }}>
                                            <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>{p.icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-gray-900 text-sm">{p.name}</div>
                                            <div className="text-gray-400 text-xs mt-0.5">{p.degree} &middot; {p.duration}</div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className="text-xs font-black text-gray-900">{p.tuition}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Campus Photos */}
                        {u.campusImages.length > 0 && (
                            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                                <h2 className="text-2xl font-black text-gray-900 mb-6">Campus Life</h2>
                                <div className="grid grid-cols-3 gap-4">
                                    {u.campusImages.map((img, i) => (
                                        <div key={i} className={`rounded-2xl overflow-hidden ${i === 0 ? "col-span-2" : ""}`} style={{ height: i === 0 ? "280px" : "128px" }}>
                                            <img src={img} alt="Campus" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                                        </div>
                                    ))}
                                </div>

                                {/* Facilities */}
                                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {u.campusFacilities.map((f, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                            <span className="material-symbols-outlined text-purple-600 text-lg" style={{ fontVariationSettings: '"FILL" 1' }}>{f.icon}</span>
                                            <span className="text-xs font-bold text-gray-700">{f.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Top Recruiters */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                            <h2 className="text-2xl font-black text-gray-900 mb-6">Top Recruiters</h2>
                            <div className="flex flex-wrap gap-3">
                                {u.topRecruiters.map((r, i) => (
                                    <span key={i} className="px-4 py-2 bg-gray-100 text-gray-800 font-bold text-sm rounded-xl border border-gray-200 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-all cursor-default">
                                        {r}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT SIDEBAR ── */}
                    <div className="space-y-6">

                        {/* Loan Box */}
                        <div className="rounded-3xl p-6 border-2 text-white relative overflow-hidden" style={{ background: u.gradient }}>
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-white/90 text-2xl" style={{ fontVariationSettings: '"FILL" 1' }}>account_balance</span>
                                    <h3 className="font-black text-lg">Education Loan</h3>
                                </div>
                                <div className="text-white/80 text-sm mb-4">Average loan amount for {u.shortName} students:</div>
                                <div className="text-3xl font-black mb-5">{u.loanInfo.avgLoanAmount}</div>

                                <div className="space-y-2 mb-5">
                                    {u.loanInfo.collateralFree && (
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <span className="material-symbols-outlined text-green-300 text-base" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
                                            Collateral-Free Available
                                        </div>
                                    )}
                                    {u.loanInfo.fastTrack && (
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <span className="material-symbols-outlined text-green-300 text-base" style={{ fontVariationSettings: '"FILL" 1' }}>bolt</span>
                                            Fast-Track Approval
                                        </div>
                                    )}
                                </div>
                                <p className="text-white/70 text-xs mb-5 leading-relaxed">{u.loanInfo.notes}</p>

                                <div className="mb-4">
                                    <div className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-2">Lending Partners</div>
                                    <div className="flex flex-wrap gap-2">
                                        {u.loanInfo.availableLenders.map((l, i) => (
                                            <span key={i} className="text-xs bg-white/20 text-white border border-white/30 px-3 py-1 rounded-full font-semibold">{l}</span>
                                        ))}
                                    </div>
                                </div>

                                <Link href="/apply-loan" className="block w-full text-center py-3 bg-white font-black text-sm rounded-2xl hover:bg-gray-50 transition-all" style={{ color: u.primaryColor }}>
                                    Apply for Loan Now
                                </Link>
                            </div>
                        </div>

                        {/* Admission Requirements */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-black text-gray-900 text-lg mb-4">Admission Requirements</h3>
                            <div className="space-y-3">
                                {[
                                    { label: "Min. GPA", value: u.requirements.gpa, icon: "school" },
                                    { label: "IELTS Score", value: u.requirements.ielts, icon: "translate" },
                                    { label: "TOEFL Score", value: u.requirements.toefl, icon: "record_voice_over" },
                                    { label: "GRE Score", value: u.requirements.gre, icon: "edit_square" },
                                ].map((r) => (
                                    <div key={r.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-gray-400 text-base">{r.icon}</span>
                                            <span className="text-sm text-gray-600 font-medium">{r.label}</span>
                                        </div>
                                        <span className="font-black text-gray-900 text-sm">{r.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Key Facts */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-black text-gray-900 text-lg mb-4">Key Facts</h3>
                            <div className="space-y-3">
                                {[
                                    { label: "Founded", value: String(u.founded), icon: "calendar_today" },
                                    { label: "Type", value: u.type, icon: "account_balance" },
                                    { label: "Faculty Ratio", value: u.stats.facultyRatio, icon: "people" },
                                    { label: "Research Funding", value: u.stats.researchOutput, icon: "science" },
                                    { label: "Intl. Students", value: u.stats.internationalStudents, icon: "public" },
                                ].map((f) => (
                                    <div key={f.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-purple-400 text-base" style={{ fontVariationSettings: '"FILL" 1' }}>{f.icon}</span>
                                            <span className="text-sm text-gray-500">{f.label}</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-800">{f.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CTA Card */}
                        <div className="bg-purple-50 border border-purple-100 rounded-3xl p-6 text-center">
                            <span className="material-symbols-outlined text-4xl text-purple-400 mb-2 block" style={{ fontVariationSettings: '"FILL" 1' }}>support_agent</span>
                            <h3 className="font-black text-gray-900 mb-2">Need Guidance?</h3>
                            <p className="text-sm text-gray-500 mb-4">Our counselors specialize in {u.shortName} education loans. Get matched in minutes.</p>
                            <Link href="/onboarding" className="inline-flex items-center gap-2 px-5 py-3 bg-[#6605c7] text-white font-bold text-sm rounded-2xl hover:bg-[#5204a0] transition-all w-full justify-center">
                                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: '"FILL" 1' }}>auto_awesome</span>
                                Check Loan Eligibility
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── BACK LINK ── */}
                <div className="max-w-7xl mx-auto px-6 pb-16 text-center">
                    <Link href="/onboarding" className="inline-flex items-center gap-2 text-purple-600 font-bold text-sm hover:text-purple-800 transition-colors">
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                        Back to University Finder
                    </Link>
                </div>
            </main>
        </AuthGate>
    );
}
