import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import JourneyPath from "../../components/JourneyPath";

export const metadata: Metadata = {
    title: "Vidhya Loans - Fund Your Dream Education Abroad",
    description:
        "Compare education loans from 50+ banks & NBFCs. Get the best rates, quick approvals, and expert guidance — all in one place.",
};

const lenders = [
    { name: "IDFC First Bank", badge: "Digital First", rate: "10.50% - 12.50%", time: "48 hours", fee: "1% + GST", logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/IDFC_First_Bank_logo.jpg" },
    { name: "HDFC Credila", badge: "Most Popular", rate: "10.75% - 12.50%", time: "5-7 days", fee: "1% of loan", logo: "https://www.credila.com/images/Credila-Logo.png" },
    { name: "Auxilo Finserve", badge: "Fast Approval", rate: "11.25% - 13.50%", time: "3 days", fee: "1.5% + GST", logo: "https://www.studentcover.in/auxilo_no_bg.png" },
    { name: "Avanse Financial", badge: "High Limits", rate: "10.99% - 13.00%", time: "4 days", fee: "1% + GST", logo: "https://mma.prnewswire.com/media/1986642/Avanse_Logo.jpg?p=facebook" },
    { name: "Poonawalla Fincorp", badge: "Easy Process", rate: "11.50% - 14.50%", time: "3 days", fee: "1.5% + GST", logo: "https://collegepond.com/wp-content/uploads/2025/03/image-8.png" },
];

const features = [
    { icon: "hub", title: "Top Lender Network", desc: "Access India's best education loan marketplace with our curated network of premium banks and NBFCs." },
    { icon: "apartment", title: "University-Specific Offers", desc: "Get tailored loan offers based on your university, course, and country of study." },
    { icon: "handshake", title: "Guaranteed Best Rate", desc: "We negotiate with lenders to get you the lowest interest rates available in the market." },
    { icon: "devices", title: "Digital Application", desc: "Apply 100% online. Upload documents, e-sign, and track your application in real-time." },
    { icon: "psychology", title: "Free Expert Counseling", desc: "Free 1-on-1 guidance from education loan experts throughout your journey." },
    { icon: "bolt", title: "Quick Disbursement", desc: "Get your loan sanctioned in 48 hours and disbursed before your university deadline." },
];

const testimonials = [
    { quote: `"Vidhya Loans helped me secure a ₹45L education loan at 8.5% interest. The process was seamless and I got my sanction letter in just 3 days!"`, name: "Priya Sharma", school: "Stanford University, USA", avatar: "priya" },
    { quote: `"I compared 12 lenders on the platform and saved ₹2.3L in total interest. The EMI calculator and expert counseling were invaluable."`, name: "Rahul Menon", school: "University of Toronto, Canada", avatar: "rahul" },
    { quote: `"As a first-generation student going abroad, I was overwhelmed. The team guided me through every step — from choosing the right loan to disbursement."`, name: "Ananya Reddy", school: "Imperial College London, UK", avatar: "ananya" },
];

export default function HomePage() {
    return (
        <div className="relative min-h-screen text-gray-900">
            <div className="relative z-10">
                {/* Floating Gift / Referral Icon */}
                <Link
                    href="/referral"
                    className="fixed left-6 top-[75%] -translate-y-1/2 z-50 group animate-bounce hover:animate-none"
                    title="Refer &amp; Earn"
                >
                    <div className="relative flex items-center gap-0">
                        {/* Tooltip label – slides in from left on hover */}
                        <span className="
                            absolute left-14 whitespace-nowrap
                            bg-[#6605c7] text-white text-xs font-bold px-3 py-1.5 rounded-full
                            shadow-lg shadow-purple-500/30
                            opacity-0 -translate-x-2 pointer-events-none
                            group-hover:opacity-100 group-hover:translate-x-0
                            transition-all duration-200
                        ">
                            Refer &amp; Earn 🎁
                        </span>
                        {/* Icon bubble */}
                        <div className="w-12 h-12 bg-gradient-to-br from-[#6605c7] to-purple-400 rounded-full flex items-center justify-center text-white shadow-xl shadow-purple-500/40 border border-white/30 group-hover:scale-110 transition-transform duration-200">
                            <span className="material-symbols-outlined text-2xl">card_giftcard</span>
                        </div>
                    </div>
                </Link>

                {/* Hero Section */}
                <section className="relative min-h-screen flex items-center pt-28 overflow-hidden" style={{ background: 'linear-gradient(135deg, #ede0ff 0%, #f3eaff 25%, #fdf6ff 55%, #fef3e8 80%, #fde8c8 100%)' }}>

                    {/* Background glow blobs */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-50" style={{ background: 'radial-gradient(circle, #d8b4fe, transparent)' }} />
                        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-40" style={{ background: 'radial-gradient(circle, #fed7aa, transparent)' }} />
                        <div className="absolute top-1/3 right-1/3 w-64 h-64 rounded-full blur-[80px] opacity-20" style={{ background: 'radial-gradient(circle, #c4b5fd, transparent)' }} />
                        {/* Subtle dot grid overlay */}
                        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #6605c7 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                    </div>

                    {/* Decorative arc (top-right corner) */}
                    <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full border border-purple-200/40 pointer-events-none" />
                    <div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full border border-purple-100/30 pointer-events-none" />

                    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 w-full">
                        {/* Left — Text */}
                        <div>
                            {/* Trust pill */}
                            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full mb-8 border border-[#6605c7]/20" style={{ background: 'rgba(102,5,199,0.08)' }}>
                                <span className="w-3 h-3 rounded-full bg-[#6605c7] animate-pulse flex-shrink-0" />
                                <span className="text-[#6605c7] text-xs font-black tracking-wide">Trusted by 10,000+ students across 20+ countries</span>
                            </div>

                            <h1 className="text-5xl md:text-7xl font-bold font-display leading-[1.08] mb-8 text-[#1a1626] tracking-tight">
                                Fund Your{' '}
                                <span className="text-[#6605c7] italic">Dream</span>
                                <br />
                                Education Abroad
                            </h1>

                            <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-lg font-medium">
                                Compare education loans from our top lending partners. Get the best rates, quick approvals, and expert guidance — all in one place.
                            </p>

                            {/* CTAs */}
                            <div className="flex flex-col sm:flex-row gap-4 mb-12">
                                <Link
                                    href="/apply-loan"
                                    className="px-10 py-5 text-white font-bold rounded-2xl text-center text-lg whitespace-nowrap transition-all hover:-translate-y-1 hover:shadow-2xl"
                                    style={{ background: 'linear-gradient(135deg, #6605c7, #8b24e5)', boxShadow: '0 8px 32px rgba(102,5,199,0.35)' }}
                                >
                                    Check Your Eligibility
                                </Link>
                                <Link
                                    href="/emi"
                                    className="px-10 py-5 bg-white text-[#1a1626] border border-white/80 font-bold rounded-2xl text-center text-lg whitespace-nowrap shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all backdrop-blur-sm"
                                >
                                    Calculate EMI
                                </Link>
                            </div>

                            {/* Social proof + quick stats row */}
                            <div className="flex flex-wrap items-center gap-8">
                                {/* Avatars */}
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="w-10 h-10 rounded-full border-[3px] border-white overflow-hidden shadow-sm">
                                                <Image src={`https://i.pravatar.cc/80?u=${i + 10}`} className="w-full h-full object-cover" alt="Student" width={40} height={40} />
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-[#1a1626]">4.9/5 ★</div>
                                        <div className="text-xs text-gray-500">2,000+ reviews</div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="hidden sm:block w-px h-10 bg-gray-200" />

                                {/* Mini stats */}
                                {[
                                    { val: '50+', label: 'Lenders' },
                                    { val: '48h', label: 'Approval' },
                                    { val: '₹500Cr+', label: 'Disbursed' },
                                ].map(s => (
                                    <div key={s.label} className="text-center">
                                        <div className="text-lg font-black text-[#6605c7]">{s.val}</div>
                                        <div className="text-xs text-gray-500 font-medium">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right — Image card */}
                        <div className="relative">
                            {/* Decorative blob behind image */}
                            <div className="absolute inset-0 scale-110 rounded-[3rem] blur-2xl opacity-30" style={{ background: 'linear-gradient(135deg, #d8b4fe, #fed7aa)' }} />

                            {/* Main image */}
                            <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_40px_80px_-10px_rgba(102,5,199,0.2)] border-[6px] border-white/70 group">
                                <Image
                                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                                    alt="Students studying abroad"
                                    width={1200}
                                    height={900}
                                    className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-105"
                                    priority
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            </div>

                            {/* Floating Rate Badge */}
                            <div
                                className="absolute -bottom-5 -left-8 flex items-center gap-4 px-6 py-4 rounded-[2rem] shadow-2xl border border-white/60"
                                style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(20px)' }}
                            >
                                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(102,5,199,0.12)', border: '1.5px solid rgba(102,5,199,0.25)' }}>
                                    <span className="material-symbols-outlined text-[#6605c7] text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>verified</span>
                                </div>
                                <div>
                                    <div className="text-[9px] text-gray-400 uppercase font-black tracking-[0.25em] mb-0.5">Lowest Rate</div>
                                    <div className="text-2xl font-black text-[#1a1626] leading-none">8.5% p.a.</div>
                                </div>
                            </div>

                            {/* Floating top-right badge — approval time */}
                            <div
                                className="absolute -top-4 -right-4 flex items-center gap-3 px-5 py-3 rounded-[1.5rem] shadow-xl border border-white/60"
                                style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(20px)' }}
                            >
                                <span className="text-2xl">⚡</span>
                                <div>
                                    <div className="text-[9px] text-gray-400 uppercase font-black tracking-widest">Approval</div>
                                    <div className="text-base font-black text-[#1a1626]">48 Hours</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Trust Badges */}
                <div className="bg-white border-t border-gray-100 py-12 shadow-sm">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { icon: "account_balance", num: "50+", label: "Lending Partners" },
                                { icon: "speed", num: "48hrs", label: "Quick Approval" },
                                { icon: "verified_user", num: "100%", label: "Secure & Trusted" },
                                { icon: "public", num: "30+", label: "Countries Covered" },
                            ].map((s) => (
                                <div key={s.label} className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#6605c7]/8 rounded-xl flex items-center justify-center text-[#6605c7]">
                                        <span className="material-symbols-outlined text-3xl">{s.icon}</span>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-gray-900">{s.num}</div>
                                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">{s.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Why Choose Us */}
                <section className="py-24 bg-transparent overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <span className="text-[#6605c7] font-bold text-sm tracking-widest uppercase mb-4 block">Why Choose Us</span>
                            <h2 className="text-4xl md:text-5xl font-bold font-display text-gray-900 mb-6">
                                Everything you need to finance your <br />
                                <span className="text-[#6605c7] italic">international education</span>, simplified
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {features.map((f) => (
                                <div key={f.title} className="p-8 rounded-3xl border border-gray-100 hover:border-[#6605c7]/30 transition-all hover:shadow-xl group bg-white">
                                    <div className="w-14 h-14 bg-[#6605c7]/10 rounded-2xl flex items-center justify-center text-[#6605c7] mb-6 group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-3xl">{f.icon}</span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-4 text-gray-900">{f.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Study Abroad Journey */}
                <JourneyPath />

                {/* Your Study Abroad Universe */}
                <section className="py-28 bg-transparent overflow-hidden relative">
                    {/* Soft glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(102,5,199,0.05) 0%, transparent 70%)' }} />

                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        {/* Header */}
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
                            <div>
                                <span className="inline-block px-4 py-1.5 rounded-full bg-[#6605c7]/10 text-[#6605c7] text-[11px] font-black uppercase tracking-widest mb-4 border border-[#6605c7]/15">
                                    YOUR UNIVERSE
                                </span>
                                <h2 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight">
                                    Your Study Abroad <br />
                                    <span style={{ background: 'linear-gradient(135deg, #6605c7, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Universe</span>
                                </h2>
                                <p className="text-gray-500 text-lg mt-4 max-w-lg leading-relaxed">
                                    Everything you need to kickstart your global education journey — all in one place.
                                </p>
                            </div>
                            <Link href="/explore" className="flex-shrink-0 inline-flex items-center gap-2 px-7 py-4 rounded-2xl border-2 border-[#6605c7]/20 text-[#6605c7] font-black hover:bg-[#6605c7] hover:text-white hover:border-[#6605c7] transition-all group text-sm">
                                Explore All
                                <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </Link>
                        </div>

                        {/* Bento Grid */}
                        <div className="grid grid-cols-12 grid-rows-2 gap-5 h-auto lg:h-[600px]">

                            {/* 1 — Trending Courses (large left) */}
                            <Link href="/explore" className="col-span-12 lg:col-span-5 row-span-1 lg:row-span-2 group relative overflow-hidden rounded-[2.5rem] shadow-xl flex flex-col justify-end min-h-[280px]" style={{ background: 'linear-gradient(135deg, #1a0533 0%, #3b0764 100%)' }}>
                                <div className="absolute inset-0 opacity-30" style={{ background: "url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80') center/cover" }} />
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(26,5,51,0.95) 0%, rgba(26,5,51,0.3) 60%, transparent 100%)' }} />
                                <div className="absolute top-6 left-6">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
                                        🔥 Trending
                                    </span>
                                </div>
                                <div className="absolute top-4 right-4 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <span className="text-2xl">📚</span>
                                </div>
                                <div className="relative z-10 p-7">
                                    <div className="text-4xl font-black text-white mb-1">200+</div>
                                    <div className="text-white/50 text-xs uppercase tracking-widest font-bold mb-3">Courses Available</div>
                                    <h3 className="text-2xl font-black text-white mb-2">Trending Courses</h3>
                                    <p className="text-white/60 text-sm mb-5 leading-relaxed">CS, Data Science, MBA, Engineering & more. Filter by country, duration, ROI.</p>
                                    <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-sm group-hover:gap-3 transition-all">
                                        Explore Courses <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </span>
                                </div>
                            </Link>

                            {/* 2 — Popular Universities (top middle) */}
                            <Link href="/explore" className="col-span-12 sm:col-span-6 lg:col-span-4 row-span-1 group relative overflow-hidden rounded-[2.5rem] shadow-xl flex flex-col justify-end min-h-[280px]" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
                                <div className="absolute inset-0 opacity-25" style={{ background: "url('https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=600&q=80') center/cover" }} />
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,23,42,0.98) 0%, rgba(15,23,42,0.4) 60%, transparent 100%)' }} />
                                <div className="absolute top-4 right-4">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 backdrop-blur-sm text-blue-300 text-[10px] font-black uppercase tracking-widest border border-blue-400/20">
                                        🏛️ Top Ranked
                                    </span>
                                </div>
                                <div className="relative z-10 p-6">
                                    <div className="text-3xl font-black text-white mb-1">500+</div>
                                    <div className="text-white/40 text-xs uppercase tracking-widest font-bold mb-2">Global Universities</div>
                                    <h3 className="text-xl font-black text-white mb-2">Popular Universities</h3>
                                    <p className="text-white/55 text-sm mb-4 leading-relaxed">MIT, Stanford, Oxford & more. AI match for your profile.</p>
                                    <span className="inline-flex items-center gap-2 text-blue-300 font-bold text-sm group-hover:gap-3 transition-all">
                                        Find Match <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </span>
                                </div>
                            </Link>

                            {/* 3 — Scholarships (top right) */}
                            <Link href="/explore" className="col-span-12 sm:col-span-6 lg:col-span-3 row-span-1 group relative overflow-hidden rounded-[2.5rem] shadow-xl flex flex-col justify-end min-h-[280px]" style={{ background: 'linear-gradient(135deg, #78350f 0%, #b45309 100%)' }}>
                                <div className="absolute inset-0 opacity-20" style={{ background: "url('https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=400&q=80') center/cover" }} />
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(120,53,15,0.97) 0%, rgba(120,53,15,0.3) 70%, transparent 100%)' }} />
                                <div className="absolute top-4 left-4">
                                    <span className="text-3xl">🏆</span>
                                </div>
                                <div className="relative z-10 p-6">
                                    <div className="text-3xl font-black text-white mb-1">₹50L+</div>
                                    <div className="text-amber-200/50 text-xs uppercase tracking-widest font-bold mb-2">Avg. Award</div>
                                    <h3 className="text-xl font-black text-white mb-2">HOT Scholarships</h3>
                                    <span className="inline-flex items-center gap-2 text-amber-300 font-bold text-sm group-hover:gap-3 transition-all">
                                        Apply Now <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </span>
                                </div>
                            </Link>

                            {/* 4 — Exam Prep (bottom middle) */}
                            <Link href="/practice" className="col-span-12 sm:col-span-6 lg:col-span-4 row-span-1 group relative overflow-hidden rounded-[2.5rem] shadow-xl flex flex-col justify-end min-h-[260px]" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)' }}>
                                <div className="absolute inset-0 opacity-20" style={{ background: "url('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&q=80') center/cover" }} />
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(6,78,59,0.98) 0%, rgba(6,78,59,0.3) 70%, transparent 100%)' }} />
                                <div className="absolute top-4 right-4 w-11 h-11 rounded-2xl bg-emerald-400/20 backdrop-blur-sm flex items-center justify-center">
                                    <span className="text-xl">✍️</span>
                                </div>
                                {/* Floating score chips */}
                                <div className="absolute top-4 left-4 flex gap-2">
                                    {['GRE', 'IELTS', 'TOEFL'].map(t => (
                                        <span key={t} className="px-2 py-1 rounded-lg bg-emerald-400/20 backdrop-blur-sm text-emerald-300 text-[10px] font-black border border-emerald-400/20">{t}</span>
                                    ))}
                                </div>
                                <div className="relative z-10 p-6">
                                    <div className="text-3xl font-black text-white mb-1">5,000+</div>
                                    <div className="text-emerald-200/50 text-xs uppercase tracking-widest font-bold mb-2">Practice Questions</div>
                                    <h3 className="text-xl font-black text-white mb-2">Exam Prep</h3>
                                    <p className="text-white/55 text-sm mb-4 leading-relaxed">GRE, IELTS, TOEFL & more. AI‑adaptive tests.</p>
                                    <span className="inline-flex items-center gap-2 text-emerald-300 font-bold text-sm group-hover:gap-3 transition-all">
                                        Start Practicing <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </span>
                                </div>
                            </Link>

                            {/* 5 — Education Loan (bottom right — featured, purple) */}
                            <Link href="/apply-loan" className="col-span-12 sm:col-span-6 lg:col-span-3 row-span-1 group relative overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col justify-end min-h-[260px]" style={{ background: 'linear-gradient(135deg, #6605c7 0%, #9333ea 100%)' }}>
                                <div className="absolute inset-0 opacity-10" style={{ background: "url('https://images.unsplash.com/photo-1579621970590-9d624316904b?w=400&q=80') center/cover" }} />
                                {/* Animated ring */}
                                <div className="absolute top-6 right-6 w-20 h-20 rounded-full border-4 border-white/20 animate-ping opacity-30" />
                                <div className="absolute top-6 right-6 w-20 h-20 rounded-full border-4 border-white/10 flex items-center justify-center">
                                    <span className="text-2xl">💰</span>
                                </div>
                                <div className="relative z-10 p-6">
                                    <span className="inline-block px-2.5 py-1 rounded-lg bg-white/20 text-white text-[10px] font-black uppercase tracking-widest mb-3">⭐ Best Rates</span>
                                    <div className="text-3xl font-black text-white mb-1">₹1 Crore</div>
                                    <div className="text-purple-200/60 text-xs uppercase tracking-widest font-bold mb-2">Collateral-Free</div>
                                    <h3 className="text-xl font-black text-white mb-2">Education Loans</h3>
                                    <span className="inline-flex items-center gap-2 text-purple-200 font-bold text-sm group-hover:gap-3 transition-all">
                                        Check Eligibility <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </span>
                                </div>
                            </Link>

                        </div>

                        {/* Floating Stats Bar */}
                        <div className="mt-8 flex flex-wrap gap-4 justify-center">
                            {[
                                { icon: '🌍', val: '30+', label: 'Countries' },
                                { icon: '🏛️', val: '500+', label: 'Universities' },
                                { icon: '📚', val: '200+', label: 'Courses' },
                                { icon: '🏆', val: '150+', label: 'Scholarships' },
                                { icon: '💰', val: '50+', label: 'Loan Partners' },
                            ].map(s => (
                                <div key={s.label} className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
                                    <span className="text-lg group-hover:scale-125 transition-transform">{s.icon}</span>
                                    <div>
                                        <div className="font-black text-gray-900 text-sm leading-none">{s.val}</div>
                                        <div className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">{s.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>


                {/* AI Tools Section */}
                <section className="py-24 bg-transparent overflow-hidden relative">
                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="text-center mb-20">
                            <span className="inline-block px-4 py-2 rounded-full bg-[#6605c7]/10 text-[#6605c7] text-[10px] font-bold uppercase tracking-widest mb-4">Premium AI Ecosystem</span>
                            <h2 className="text-4xl md:text-6xl font-bold font-display mb-6 text-gray-900">
                                Smart Tools for <span className="text-[#6605c7] italic">Global Success</span>
                            </h2>
                            <p className="text-gray-600 max-w-2xl mx-auto">Empowering your study abroad journey with data-driven insights and AI precision.</p>
                        </div>

                        <div className="space-y-6">
                            {/* Top Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <ToolCard
                                    href="/sop-writer"
                                    bg="bg-[#e7e1f7]"
                                    icon="https://img.icons8.com/isometric/50/6605c7/edit-file.png"
                                    title="Automated SOP Writer"
                                    desc="Draft your Statement of Purpose evaluated on matter, grammar, and readability using AI."
                                    cta="Submit SOP"
                                />
                                <ToolCard
                                    href="/admit-predictor"
                                    bg="bg-[#fdfaf2]"
                                    icon="https://img.icons8.com/isometric/50/6605c7/hourglass.png"
                                    title="Estimate Future Earnings"
                                    desc="Project your potential future earnings and compare countries based on ROI."
                                    cta="Estimate Now"
                                />
                                <ToolCard
                                    href="/compare-universities"
                                    bg="bg-[#e1f0f7]"
                                    icon="https://img.icons8.com/isometric/50/6605c7/scales.png"
                                    title="University Compare"
                                    desc="Get insights on income, employability, costs, and top recruiters of up to 4 universities."
                                    cta="Compare Now"
                                />
                            </div>

                            {/* Middle Row */}
                            <div className="max-w-3xl mx-auto">
                                <ToolCard
                                    href="/admit-predictor"
                                    bg="bg-[#e7e1f7]"
                                    icon="https://img.icons8.com/isometric/50/6605c7/document.png"
                                    title="Admit Predictor"
                                    desc="Check the probability of your MS in US admission. Predict your admission chances with 98% accuracy."
                                    cta="Evaluate Now"
                                    large
                                />
                            </div>

                            {/* Bottom Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <ToolCard
                                    href="/grade-converter"
                                    bg="bg-[#e1f0f7]"
                                    icon="https://img.icons8.com/isometric/50/6605c7/calculator.png"
                                    title="Grade Converter"
                                    desc="Convert your percentage or 10-point CGPA to GPA score with just a single click."
                                    cta="Convert Now"
                                />
                                <ToolCard
                                    href="/emi"
                                    bg="bg-white"
                                    icon="https://img.icons8.com/isometric/50/6605c7/sand-watch.png"
                                    title="EMI Calculator"
                                    desc="Determine your EMIs and repayment schedules before committing to a student loan."
                                    cta="Calculate Now"
                                    border
                                />
                                <ToolCard
                                    href="/loan-eligibility"
                                    bg="bg-[#e7e1f7]"
                                    icon="https://img.icons8.com/isometric/50/6605c7/money.png"
                                    title="Loan Eligibility Checker"
                                    desc="Find the best education loan for you in just 2 minutes with our intelligent checker."
                                    cta="Check Eligibility"
                                />
                            </div>
                        </div>

                        <div className="mt-12 flex flex-wrap justify-center gap-12 text-center border-t border-black/5 pt-12">
                            {[{ num: "7", label: "AI Tools" }, { num: "3,000+", label: "Universities Covered" }, { num: "98%", label: "Accuracy Rate" }, { num: "50K+", label: "Students Helped" }].map((s) => (
                                <div key={s.label}>
                                    <div className="text-4xl font-bold text-gray-900">{s.num}</div>
                                    <div className="text-xs text-gray-500 uppercase font-bold tracking-widest mt-1">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="py-28 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f5f0ff 0%, #faf5ff 40%, #f0f9ff 70%, #fefce8 100%)' }}>
                    {/* Background blobs */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute -top-24 left-1/4 w-96 h-96 rounded-full blur-[100px] opacity-40" style={{ background: 'radial-gradient(circle, #c084fc, transparent)' }} />
                        <div className="absolute -bottom-24 right-1/4 w-96 h-96 rounded-full blur-[100px] opacity-30" style={{ background: 'radial-gradient(circle, #67e8f9, transparent)' }} />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[80px] opacity-20" style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />
                        {/* Dot grid */}
                        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #6605c7 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
                    </div>

                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        {/* Header */}
                        <div className="text-center mb-20">
                            <span className="inline-block px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest mb-5 border border-[#6605c7]/20" style={{ background: 'rgba(102,5,199,0.08)', color: '#6605c7' }}>
                                Simple Process
                            </span>
                            <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-5 leading-tight">
                                Get Funded in{' '}
                                <span style={{ background: 'linear-gradient(135deg, #6605c7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>4 Easy Steps</span>
                            </h2>
                            <p className="text-gray-500 text-lg max-w-xl mx-auto">
                                From eligibility check to full disbursement — the fastest education loan experience in India.
                            </p>
                        </div>

                        {/* Steps */}
                        <div className="relative">
                            {/* Connector line (desktop only) */}
                            <div className="hidden lg:block absolute top-[3.5rem] left-[12%] right-[12%] h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, transparent, #c084fc 20%, #6605c7 50%, #c084fc 80%, transparent)' }} />
                            {/* Animated dot */}
                            <div className="hidden lg:block absolute top-[3.5rem] w-3 h-3 rounded-full -translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ background: '#6605c7', left: '50%', boxShadow: '0 0 16px #a855f7' }} />

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                {[
                                    {
                                        num: '01',
                                        emoji: '📋',
                                        title: 'Check Eligibility',
                                        desc: 'Answer a few smart questions about your university, course, and financial profile.',
                                        time: '2 minutes',
                                        chips: ['No credit score needed', 'AI-assisted'],
                                        color: '#7c3aed',
                                        bg: '#f5f0ff',
                                        border: '#c4b5fd',
                                    },
                                    {
                                        num: '02',
                                        emoji: '⚖️',
                                        title: 'Compare Offers',
                                        desc: 'Get personalized loan offers from 50+ lenders. Compare rates, tenure, and terms side by side.',
                                        time: '5 minutes',
                                        chips: ['50+ lenders', 'Best rate guaranteed'],
                                        color: '#0284c7',
                                        bg: '#e0f2fe',
                                        border: '#7dd3fc',
                                    },
                                    {
                                        num: '03',
                                        emoji: '📁',
                                        title: 'Apply Online',
                                        desc: 'Complete your application digitally. Upload documents and e-sign your agreement securely.',
                                        time: '10 minutes',
                                        chips: ['100% digital', 'e-KYC enabled'],
                                        color: '#059669',
                                        bg: '#ecfdf5',
                                        border: '#6ee7b7',
                                    },
                                    {
                                        num: '04',
                                        emoji: '💸',
                                        title: 'Get Funded',
                                        desc: 'Receive your sanction letter in 48 hours. Funds disbursed directly to your university.',
                                        time: '48 hours',
                                        chips: ['Fastest in India', 'Zero hidden fees'],
                                        color: '#b45309',
                                        bg: '#fffbeb',
                                        border: '#fcd34d',
                                    },
                                ].map((step, idx) => (
                                    <div key={step.num} className="group relative flex flex-col items-center text-center">

                                        {/* Icon circle */}
                                        <div
                                            className="relative w-28 h-28 rounded-[2rem] flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 shadow-lg"
                                            style={{
                                                background: step.bg,
                                                border: `2px solid ${step.border}`,
                                                boxShadow: `0 8px 32px ${step.color}18`,
                                            }}
                                        >
                                            {/* Hover shadow glow */}
                                            <div className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: `0 12px 40px ${step.color}30` }} />

                                            {/* Large watermark number */}
                                            <div className="absolute -top-3 -left-3 text-6xl font-black opacity-[0.08] select-none leading-none" style={{ color: step.color }}>{step.num}</div>

                                            <span className="text-4xl relative z-10">{step.emoji}</span>

                                            {/* Step number badge */}
                                            <div
                                                className="absolute -top-3 -right-3 w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-md"
                                                style={{ background: `linear-gradient(135deg, ${step.color}, ${step.color}bb)` }}
                                            >
                                                {idx + 1}
                                            </div>

                                            {/* Time badge */}
                                            <div
                                                className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black whitespace-nowrap backdrop-blur-sm"
                                                style={{ background: 'white', color: step.color, border: `1.5px solid ${step.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                                            >
                                                ⏱ {step.time}
                                            </div>
                                        </div>

                                        {/* Content card */}
                                        <div
                                            className="mt-4 px-4 py-6 rounded-3xl w-full group-hover:shadow-xl transition-all duration-300"
                                            style={{ background: 'white', border: `1px solid ${step.border}50` }}
                                        >
                                            <h3 className="text-lg font-black text-gray-900 mb-2 group-hover:text-[#6605c7] transition-colors">{step.title}</h3>
                                            <p className="text-gray-500 text-sm leading-relaxed mb-4">{step.desc}</p>

                                            {/* Feature chips */}
                                            <div className="flex flex-wrap gap-2 justify-center">
                                                {step.chips.map(c => (
                                                    <span
                                                        key={c}
                                                        className="px-3 py-1 rounded-full text-[10px] font-black"
                                                        style={{ background: step.bg, color: step.color, border: `1px solid ${step.border}` }}
                                                    >
                                                        ✓ {c}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Arrow chevron between steps */}
                                        {idx < 3 && (
                                            <div className="hidden lg:flex absolute top-14 -right-5 z-20 w-10 h-10 rounded-full items-center justify-center bg-white shadow-md" style={{ border: '1.5px solid #e9d5ff' }}>
                                                <span className="material-symbols-outlined text-[#6605c7] text-base">chevron_right</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bottom CTA strip */}
                        <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-6 p-8 rounded-[2rem] bg-white shadow-lg" style={{ border: '1.5px solid #e9d5ff' }}>
                            <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
                                {[
                                    { icon: 'security', text: 'Bank-grade security' },
                                    { icon: 'support_agent', text: 'Dedicated advisor' },
                                    { icon: 'verified', text: 'RBI regulated' },
                                ].map(t => (
                                    <div key={t.text} className="flex items-center gap-2 text-gray-600 text-sm">
                                        <span className="material-symbols-outlined text-[#6605c7] text-base" style={{ fontVariationSettings: '"FILL" 1' }}>{t.icon}</span>
                                        <span className="font-bold">{t.text}</span>
                                    </div>
                                ))}
                            </div>
                            <Link
                                href="/apply-loan"
                                className="flex-shrink-0 flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-white text-sm transition-all hover:opacity-90 hover:-translate-y-0.5"
                                style={{ background: 'linear-gradient(135deg, #6605c7, #a855f7)', boxShadow: '0 8px 32px rgba(102,5,199,0.3)' }}
                            >
                                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: '"FILL" 1' }}>rocket_launch</span>
                                Start Application — It&apos;s Free
                            </Link>
                        </div>
                    </div>
                </section>

                {/* EMI Calculator Section */}
                <section className="py-24 bg-transparent">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-4xl md:text-5xl font-bold font-display text-gray-900 mb-6">Calculate Your EMI</h2>
                                <p className="text-lg text-gray-600 mb-10">Plan your education financing with our instant EMI calculator. Get a detailed breakdown of your monthly payments.</p>

                                <div className="space-y-6">
                                    {[
                                        "Compare monthly payments across different interest rates",
                                        "Understand total interest payable over the loan tenure",
                                        "Adjust tenure to find an EMI that fits your budget"
                                    ].map((p, i) => (
                                        <div key={i} className="flex items-start gap-4">
                                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-sm">check</span>
                                            </div>
                                            <p className="text-gray-700 font-medium">{p}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-12">
                                    <Link href="/emi" className="inline-flex items-center gap-2 text-[#6605c7] font-bold hover:gap-4 transition-all">
                                        Try Calculator Now <span className="material-symbols-outlined">arrow_forward</span>
                                    </Link>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-gray-100">
                                <div className="space-y-8">
                                    <div>
                                        <div className="flex justify-between mb-4">
                                            <label className="font-bold text-gray-900">Loan Amount</label>
                                            <span className="text-[#6605c7] font-bold">₹ 20,00,000</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full">
                                            <div className="h-full bg-[#6605c7] w-2/3 rounded-full relative">
                                                <div className="w-4 h-4 bg-white border-2 border-[#6605c7] rounded-full absolute right-0 top-1/2 -translate-y-1/2"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-4">
                                            <label className="font-bold text-gray-900">Interest Rate</label>
                                            <span className="text-[#6605c7] font-bold">9.5%</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full">
                                            <div className="h-full bg-[#6605c7] w-1/3 rounded-full relative">
                                                <div className="w-4 h-4 bg-white border-2 border-[#6605c7] rounded-full absolute right-0 top-1/2 -translate-y-1/2"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-gray-100 text-center">
                                        <div className="text-sm text-gray-500 uppercase font-bold tracking-widest mb-2">Monthly EMI</div>
                                        <div className="text-5xl font-black text-gray-900 font-sans">₹ 42,004</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Lending Partners Table */}
                <section className="py-24 bg-transparent">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-bold font-display text-gray-900">Our Lending Partners</h2>
                            <p className="text-gray-500 mt-4">Compare interest rates, processing times & fees from India's top lenders</p>
                        </div>
                        <div className="overflow-x-auto rounded-3xl border border-gray-100 shadow-xl">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-900">
                                    <tr>
                                        {["Lender", "Interest Rate", "Processing Time", "Processing Fee"].map((h) => (
                                            <th key={h} className="p-6 font-bold">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {lenders.map((l) => (
                                        <tr key={l.name} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center p-2 overflow-hidden">
                                                        <img src={l.logo} alt={l.name} className="w-full h-full object-contain" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 text-sm">{l.name}</div>
                                                        {l.badge && <div className="text-[10px] text-green-600 font-bold uppercase tracking-tight">{l.badge}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-gray-600 text-sm font-bold">{l.rate}</td>
                                            <td className="p-6 text-gray-600 text-sm font-bold">{l.time}</td>
                                            <td className="p-6 text-gray-600 text-sm font-bold">{l.fee}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Testimonials */}
                <section className="py-24 bg-transparent">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <span className="text-[#6605c7] font-bold text-sm tracking-widest uppercase mb-4 block">Testimonials</span>
                            <h2 className="text-4xl md:text-5xl font-bold font-display text-gray-900">Loved by 10,000+ Students</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {testimonials.map((t) => (
                                <div key={t.name} className="p-8 rounded-[2.5rem] bg-white shadow-sm hover:shadow-xl transition-all border border-gray-100">
                                    <div className="flex gap-1 text-amber-500 mb-6">
                                        {[...Array(5)].map((_, i) => <span key={i} className="material-symbols-outlined fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
                                    </div>
                                    <p className="text-gray-600 mb-8 leading-relaxed italic italic">"{t.quote}"</p>
                                    <div className="flex items-center gap-4">
                                        <Image src={`https://i.pravatar.cc/100?u=${t.avatar}`} className="w-12 h-12 rounded-full ring-2 ring-[#6605c7]/20" alt={t.name} width={48} height={48} />
                                        <div>
                                            <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                                            <div className="text-xs text-gray-500">{t.school}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-24 bg-transparent mb-12">
                    <div className="max-w-5xl mx-auto px-6">
                        <div className="bg-[#6605c7] rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-32 -mb-32" />
                            <h2 className="text-4xl md:text-6xl font-bold font-display mb-8 relative z-10">Ready to Fund Your Education?</h2>
                            <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto relative z-10 font-medium">
                                Join 10,000+ students who found their perfect education loan. Start your journey in under 5 minutes.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
                                <Link href="/apply-loan" className="px-10 py-5 bg-white text-[#6605c7] font-bold rounded-2xl shadow-xl hover:-translate-y-1 transition-all">Start Application</Link>
                                <Link href="/emi" className="px-10 py-5 bg-[#6605c7]/20 text-white border border-white/30 font-bold rounded-2xl hover:bg-white/10 transition-all">Try EMI Calculator</Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Reference */}
                {/* <div className="text-center py-12 text-gray-400 text-xs border-t border-black/5">
                    Design inspired by <a href="https://vidhya-path-aid.lovable.app/" className="underline hover:text-[#6605c7]">Vidhya Path Aid</a>
                </div> */}
            </div>
        </div >
    );
}

function ToolCard({ href, bg, icon, title, desc, cta, large = false, border = false }: {
    href: string; bg: string; icon: string; title: string; desc: string; cta: string; large?: boolean; border?: boolean;
}) {
    return (
        <Link
            href={href}
            className={`flex ${large ? "flex-col md:flex-row md:items-center" : "flex-col"} p-8 rounded-[2rem] ${bg} hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group border ${border ? "border-[#6605c7]/10" : "border-white/50"}`}
        >
            <div className={`flex items-start ${large ? "gap-8 mb-0" : "gap-6 mb-8"}`}>
                <div className={`${large ? "w-20 h-20" : "w-16 h-16"} bg-white/80 rounded-full flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-3`}>
                    <img src={icon} alt={title} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                    <h3 className={`${large ? "text-2xl" : "text-xl"} font-bold mb-3 text-gray-900 leading-tight`}>{title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
                </div>
            </div>
            <div className={`${large ? "mt-6 md:mt-0 md:ml-auto" : "mt-auto"} flex justify-end`}>
                <span className={`inline-flex items-center gap-2 text-[#6605c7] font-bold ${large ? "text-base" : "text-sm"} group-hover:gap-3 transition-all`}>
                    {cta} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
            </div>
        </Link>
    );
}
