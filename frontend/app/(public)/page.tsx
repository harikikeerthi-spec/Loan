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
                {/* Floating Referral Badge - Premium Design */}
                <Link
                    href="/referral"
                    className="fixed left-6 top-[75%] -translate-y-1/2 z-50 group"
                    title="Refer & Earn ₹3,000"
                >
                    <div className="relative">
                        {/* Animated rings */}
                        <div className="absolute inset-0 animate-ping rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 opacity-20" />
                        <div className="absolute -inset-1 animate-pulse rounded-xl bg-gradient-to-r from-amber-400/30 to-orange-500/30 blur-md" />
                        
                        {/* Main badge */}
                        <div className="relative flex items-center gap-0">
                            {/* Hover tooltip */}
                            <span className="absolute left-full ml-3 whitespace-nowrap bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[11px] font-black px-4 py-2 rounded-xl shadow-xl shadow-orange-500/30 opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 uppercase tracking-wider">
                                <span className="flex items-center gap-2">
                                    <span>Earn ₹3,000</span>
                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </span>
                            </span>
                            
                            {/* Custom Logo Container */}
                            <div className="relative w-14 h-14 group-hover:scale-110 transition-all duration-300">
                                {/* Rotating border */}
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 animate-[spin_3s_linear_infinite] opacity-80" style={{ padding: '2px' }}>
                                    <div className="w-full h-full rounded-xl bg-white" />
                                </div>
                                
                                {/* Icon container */}
                                <div className="absolute inset-[2px] rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center shadow-lg overflow-hidden">
                                    {/* Shine effect */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                    
                                    {/* Custom referral icon - coins/gift mashup */}
                                    <div className="relative z-10 flex flex-col items-center">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white drop-shadow-lg">
                                            <path d="M12 2L14.09 8.26L20.81 9.27L15.91 13.97L17.18 20.73L12 17.77L6.82 20.73L8.09 13.97L3.19 9.27L9.91 8.26L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                                            <circle cx="12" cy="12" r="3" fill="#fbbf24" stroke="white" strokeWidth="1"/>
                                        </svg>
                                    </div>
                                </div>
                                
                                {/* Sparkle decorations */}
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full animate-pulse shadow-lg shadow-yellow-400/50" />
                                <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 bg-orange-300 rounded-full animate-pulse delay-300" />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Hero Section */}
                <section className="relative min-h-screen flex items-center pt-28 overflow-hidden" style={{ background: 'linear-gradient(135deg, #ede0ff 0%, #f3eaff 25%, #fdf6ff 55%, #fef3e8 80%, #fde8c8 100%)' }}>
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-50" style={{ background: 'radial-gradient(circle, #d8b4fe, transparent)' }} />
                        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-40" style={{ background: 'radial-gradient(circle, #fed7aa, transparent)' }} />
                        <div className="absolute top-1/3 right-1/3 w-64 h-64 rounded-full blur-[80px] opacity-20" style={{ background: 'radial-gradient(circle, #c4b5fd, transparent)' }} />
                        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #6605c7 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                    </div>

                    <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full border border-purple-200/40 pointer-events-none" />
                    <div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full border border-purple-100/30 pointer-events-none" />

                    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 w-full">
                        <div>
                            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full mb-8 border border-[#6605c7]/20" style={{ background: 'rgba(102,5,199,0.08)' }}>
                                <span className="w-3 h-3 rounded-full bg-[#6605c7] animate-pulse flex-shrink-0" />
                                <span className="text-[#6605c7] text-xs font-black tracking-wide">Trusted by 10,000+ students across 20+ countries</span>
                            </div>

                            <h1 className="text-4xl md:text-6xl font-bold font-display leading-[1.1] mb-6 text-[#1a1626] tracking-tight">
                                Fund Your{' '}
                                <span className="text-[#6605c7] italic">Dream</span>
                                <br />
                                Education Abroad
                            </h1>

                            <p className="text-[13px] text-gray-500 mb-8 leading-relaxed max-w-lg font-medium">
                                Compare education loans from our top lending partners. Get the best rates, quick approvals, and expert guidance — all in one place.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-10">
                                <Link
                                    href="/apply-loan"
                                    className="px-8 py-3.5 text-white font-bold rounded-xl text-center text-[13px] whitespace-nowrap transition-all hover:-translate-y-1 hover:shadow-2xl"
                                    style={{ background: 'linear-gradient(135deg, #6605c7, #8b24e5)', boxShadow: '0 8px 32px rgba(102,5,199,0.35)' }}
                                >
                                    Check Your Eligibility
                                </Link>
                                <Link
                                    href="/emi"
                                    className="px-8 py-3.5 bg-white text-[#1a1626] border border-gray-100 font-bold rounded-xl text-center text-[13px] whitespace-nowrap shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all backdrop-blur-sm"
                                >
                                    Calculate EMI
                                </Link>
                            </div>

                            <div className="flex flex-wrap items-center gap-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-sm">
                                                <Image src={`https://i.pravatar.cc/80?u=${i + 10}`} className="w-full h-full object-cover" alt="Student" width={32} height={32} />
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <div className="text-[13px] font-black text-[#1a1626]">4.9/5 ★</div>
                                        <div className="text-[11px] text-gray-400">2,000+ reviews</div>
                                    </div>
                                </div>
                                <div className="hidden sm:block w-px h-8 bg-gray-100" />
                                {[
                                    { val: '50+', label: 'Lenders' },
                                    { val: '48h', label: 'Approval' },
                                    { val: '₹500Cr+', label: 'Disbursed' },
                                ].map(s => (
                                    <div key={s.label} className="text-center">
                                        <div className="text-[13px] font-black text-[#6605c7]">{s.val}</div>
                                        <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 scale-105 rounded-xl blur-2xl opacity-20" style={{ background: 'linear-gradient(135deg, #d8b4fe, #fed7aa)' }} />
                            <div className="relative rounded-xl overflow-hidden shadow-[0_30px_60px_-15px_rgba(102,5,199,0.15)] border-4 border-white/70 group">
                                <Image
                                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                                    alt="Students studying abroad"
                                    width={1200}
                                    height={900}
                                    className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-105"
                                    priority
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            </div>

                            <div
                                className="absolute -bottom-4 -left-6 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border border-white/60"
                                style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)' }}
                            >
                                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(102,5,199,0.1)', border: '1px solid rgba(102,5,199,0.2)' }}>
                                    <span className="material-symbols-outlined text-[#6605c7] text-lg" style={{ fontVariationSettings: '"FILL" 1' }}>verified</span>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-0.5">Lowest Rate</div>
                                    <div className="text-xl font-black text-[#1a1626] leading-none">8.5% p.a.</div>
                                </div>
                            </div>

                            <div
                                className="absolute -top-3 -right-3 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg border border-white/60"
                                style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)' }}
                            >
                                <span className="text-xl">⚡</span>
                                <div>
                                    <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Approval</div>
                                    <div className="text-[13px] font-black text-[#1a1626]">48 Hours</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Trust Badges */}
                <div className="bg-white/50 backdrop-blur-sm border-y border-gray-100 py-10">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { icon: "account_balance", num: "50+", label: "Lending Partners" },
                                { icon: "speed", num: "48hrs", label: "Quick Approval" },
                                { icon: "verified_user", num: "100%", label: "Secure & Trusted" },
                                { icon: "public", num: "30+", label: "Countries Covered" },
                            ].map((s) => (
                                <div key={s.label} className="flex items-center gap-4">
                                    <div className="w-11 h-11 bg-[#6605c7]/5 rounded-xl flex items-center justify-center text-[#6605c7]">
                                        <span className="material-symbols-outlined text-2xl">{s.icon}</span>
                                    </div>
                                    <div>
                                        <div className="text-xl font-black text-gray-900 leading-none mb-1">{s.num}</div>
                                        <div className="text-[11px] text-gray-400 font-black uppercase tracking-widest">{s.label}</div>
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
                            <span className="inline-block px-4 py-1.5 rounded-full bg-[#6605c7]/10 text-[#6605c7] text-[11px] font-black uppercase tracking-widest mb-4 border border-[#6605c7]/15">
                                Why Choose Us
                            </span>
                            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
                                Everything you need to finance your <br />
                                <span className="text-[#6605c7] italic">international education</span>, simplified
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {features.map((f) => (
                                <div key={f.title} className="p-8 rounded-xl border border-gray-100 hover:border-[#6605c7]/20 transition-all hover:shadow-xl group bg-white/60 backdrop-blur-sm">
                                    <div className="w-12 h-12 bg-[#6605c7]/5 rounded-xl flex items-center justify-center text-[#6605c7] mb-6 group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-2xl">{f.icon}</span>
                                    </div>
                                    <h3 className="text-[15px] font-bold mb-3 text-gray-900">{f.title}</h3>
                                    <p className="text-[13px] text-gray-500 leading-relaxed font-medium">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Study Abroad Journey */}
                <JourneyPath />

                {/* Your Study Abroad Universe */}
                <section className="py-28 bg-transparent overflow-hidden relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(102,5,199,0.05) 0%, transparent 70%)' }} />

                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
                            <div>
                                <span className="inline-block px-4 py-1.5 rounded-full bg-[#6605c7]/10 text-[#6605c7] text-[11px] font-black uppercase tracking-widest mb-4 border border-[#6605c7]/15">
                                    YOUR UNIVERSE
                                </span>
                                <h2 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight">
                                    Your Study Abroad <br />
                                    <span style={{ background: 'linear-gradient(135deg, #6605c7, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Universe</span>
                                </h2>
                                <p className="text-gray-500 text-[13px] font-medium mt-4 max-w-lg leading-relaxed">
                                    Everything you need to kickstart your global education journey — all in one place.
                                </p>
                            </div>
                            <Link href="/explore" className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-[#6605c7]/20 text-[#6605c7] font-bold hover:bg-[#6605c7] hover:text-white hover:border-[#6605c7] transition-all group text-[13px]">
                                Explore All
                                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </Link>
                        </div>

                        {/* Bento Grid */}
                        <div className="grid grid-cols-12 grid-rows-2 gap-5 h-auto lg:h-[550px]">
                            {/* 1 — Trending Courses */}
                            <Link href="/explore" className="col-span-12 lg:col-span-5 row-span-1 lg:row-span-2 group relative overflow-hidden rounded-xl shadow-lg flex flex-col justify-end min-h-[260px]" style={{ background: 'linear-gradient(135deg, #1a0533 0%, #3b0764 100%)' }}>
                                <div className="absolute inset-0 opacity-30" style={{ background: "url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80') center/cover" }} />
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(26,5,51,0.9) 0%, rgba(26,5,51,0.2) 60%, transparent 100%)' }} />
                                <div className="absolute top-6 left-6">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
                                        🔥 Trending
                                    </span>
                                </div>
                                <div className="absolute top-4 right-4 w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <span className="text-2xl">📚</span>
                                </div>
                                <div className="relative z-10 p-7">
                                    <div className="text-3xl font-black text-white mb-1">200+</div>
                                    <div className="text-white/40 text-[10px] uppercase tracking-widest font-black mb-3">Courses Available</div>
                                    <h3 className="text-xl font-bold text-white mb-2">Trending Courses</h3>
                                    <p className="text-white/60 text-[13px] mb-5 leading-relaxed font-medium">CS, Data Science, MBA & more. Filter by country, ROI.</p>
                                    <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-[13px] group-hover:gap-3 transition-all">
                                        Explore Courses <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                                    </span>
                                </div>
                            </Link>

                            {/* 2 — Popular Universities */}
                            <Link href="/explore" className="col-span-12 sm:col-span-6 lg:col-span-4 row-span-1 group relative overflow-hidden rounded-xl shadow-lg flex flex-col justify-end min-h-[260px]" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
                                <div className="absolute inset-0 opacity-25" style={{ background: "url('https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=600&q=80') center/cover" }} />
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.3) 60%, transparent 100%)' }} />
                                <div className="absolute top-4 right-4">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 backdrop-blur-sm text-blue-300 text-[10px] font-black uppercase tracking-widest border border-blue-400/20">
                                        🏛️ Top Ranked
                                    </span>
                                </div>
                                <div className="relative z-10 p-6">
                                    <div className="text-2xl font-black text-white mb-1">500+</div>
                                    <h3 className="text-lg font-bold text-white mb-2">Popular Universities</h3>
                                    <p className="text-white/55 text-[13px] mb-4 leading-relaxed font-medium">MIT, Stanford, Oxford & more. AI match for your profile.</p>
                                    <span className="inline-flex items-center gap-2 text-blue-300 font-bold text-[13px] group-hover:gap-3 transition-all">
                                        Find Match <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                                    </span>
                                </div>
                            </Link>

                            {/* 3 — Scholarships */}
                            <Link href="/explore" className="col-span-12 sm:col-span-6 lg:col-span-3 row-span-1 group relative overflow-hidden rounded-xl shadow-lg flex flex-col justify-end min-h-[260px]" style={{ background: 'linear-gradient(135deg, #78350f 0%, #b45309 100%)' }}>
                                <div className="absolute inset-0 opacity-20" style={{ background: "url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&q=80') center/cover" }} />
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(120,53,15,0.9) 0%, rgba(120,53,15,0.3) 70%, transparent 100%)' }} />
                                <div className="relative z-10 p-6">
                                    <div className="text-2xl font-black text-white mb-1">₹50L+</div>
                                    <div className="text-amber-200/40 text-[10px] uppercase tracking-widest font-black mb-2">Avg. Award</div>
                                    <h3 className="text-lg font-bold text-white mb-4">HOT Scholarships</h3>
                                    <span className="inline-flex items-center gap-2 text-amber-300 font-bold text-[13px] group-hover:gap-3 transition-all">
                                        Apply Now <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                                    </span>
                                </div>
                            </Link>

                            {/* 4 — Exam Prep */}
                            <Link href="/practice" className="col-span-12 sm:col-span-6 lg:col-span-4 row-span-1 group relative overflow-hidden rounded-xl shadow-lg flex flex-col justify-end min-h-[240px]" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)' }}>
                                <div className="absolute inset-0 opacity-20" style={{ background: "url('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&q=80') center/cover" }} />
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(6,78,59,0.9) 0%, rgba(6,78,59,0.3) 70%, transparent 100%)' }} />
                                <div className="absolute top-4 right-4 w-11 h-11 rounded-xl bg-emerald-400/20 backdrop-blur-sm flex items-center justify-center">
                                    <span className="text-xl">✍️</span>
                                </div>
                                <div className="absolute top-4 left-4 flex gap-1.5">
                                    {['GRE', 'IELTS', 'TOEFL'].map(t => (
                                        <span key={t} className="px-2 py-0.5 rounded-lg bg-emerald-400/20 backdrop-blur-sm text-emerald-300 text-[10px] font-black border border-emerald-400/20">{t}</span>
                                    ))}
                                </div>
                                <div className="relative z-10 p-6">
                                    <div className="text-2xl font-black text-white mb-1">5,000+</div>
                                    <h3 className="text-lg font-bold text-white mb-2">Exam Prep</h3>
                                    <p className="text-white/55 text-[13px] font-medium leading-relaxed mb-4">GRE, IELTS, TOEFL & more. AI‑adaptive tests.</p>
                                    <span className="inline-flex items-center gap-2 text-emerald-300 font-bold text-[13px] group-hover:gap-3 transition-all">
                                        Start <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                                    </span>
                                </div>
                            </Link>

                            {/* 5 — Education Loan */}
                            <Link href="/apply-loan" className="col-span-12 sm:col-span-6 lg:col-span-3 row-span-1 group relative overflow-hidden rounded-xl shadow-xl flex flex-col justify-end min-h-[240px]" style={{ background: 'linear-gradient(135deg, #6605c7 0%, #9333ea 100%)' }}>
                                <div className="absolute inset-0 opacity-10" style={{ background: "url('https://images.unsplash.com/photo-1579621970590-9d624316904b?w=400&q=80') center/cover" }} />
                                <div className="relative z-10 p-6">
                                    <span className="inline-block px-2 py-0.5 rounded-lg bg-white/10 text-white text-[10px] font-black uppercase tracking-widest mb-3 border border-white/10">⭐ Best Rates</span>
                                    <h3 className="text-lg font-bold text-white mb-2">Education Loans</h3>
                                    <span className="inline-flex items-center gap-2 text-purple-200 font-bold text-[13px] group-hover:gap-3 transition-all">
                                        Check Now <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
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
                                <div key={s.label} className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
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
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <ToolCard href="/sop-writer" bg="bg-[#e7e1f7]" icon="https://img.icons8.com/isometric/50/6605c7/edit-file.png" title="Automated SOP Writer" desc="Draft your Statement of Purpose evaluated on matter, grammar, and readability using AI." cta="Submit SOP" />
                                <ToolCard href="/admit-predictor" bg="bg-[#fdfaf2]" icon="https://img.icons8.com/isometric/50/6605c7/hourglass.png" title="Estimate Future Earnings" desc="Project your potential future earnings and compare countries based on ROI." cta="Estimate Now" />
                                <ToolCard href="/compare-universities" bg="bg-[#e1f0f7]" icon="https://img.icons8.com/isometric/50/6605c7/scales.png" title="University Compare" desc="Get insights on income, employability, costs, and top recruiters of up to 4 universities." cta="Compare Now" />
                            </div>
                            <div className="max-w-3xl mx-auto">
                                <ToolCard href="/admit-predictor" bg="bg-[#e7e1f7]" icon="https://img.icons8.com/isometric/50/6605c7/document.png" title="Admit Predictor" desc="Check the probability of your MS in US admission. Predict your admission chances with 98% accuracy." cta="Evaluate Now" large />
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <ToolCard href="/grade-converter" bg="bg-[#e1f0f7]" icon="https://img.icons8.com/isometric/50/6605c7/calculator.png" title="Grade Converter" desc="Convert your percentage or 10-point CGPA to GPA score with just a single click." cta="Convert Now" />
                                <ToolCard href="/emi" bg="bg-white" icon="https://img.icons8.com/isometric/50/6605c7/sand-watch.png" title="EMI Calculator" desc="Determine your EMIs and repayment schedules before committing to a student loan." cta="Calculate Now" border />
                                <ToolCard href="/loan-eligibility" bg="bg-[#e7e1f7]" icon="https://img.icons8.com/isometric/50/6605c7/money.png" title="Loan Eligibility Checker" desc="Find the best education loan for you in just 2 minutes with our intelligent checker." cta="Check Eligibility" />
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
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute -top-24 left-1/4 w-96 h-96 rounded-full blur-[100px] opacity-40" style={{ background: 'radial-gradient(circle, #c084fc, transparent)' }} />
                        <div className="absolute -bottom-24 right-1/4 w-96 h-96 rounded-full blur-[100px] opacity-30" style={{ background: 'radial-gradient(circle, #67e8f9, transparent)' }} />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[80px] opacity-20" style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />
                        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #6605c7 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
                    </div>

                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        <div className="text-center mb-20">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-[#6605c7]/10 text-[#6605c7] text-[11px] font-black uppercase tracking-widest mb-4 border border-[#6605c7]/15">
                                Simple Process
                            </span>
                            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-5 leading-tight">
                                Get Funded in{' '}
                                <span style={{ background: 'linear-gradient(135deg, #6605c7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>4 Easy Steps</span>
                            </h2>
                            <p className="text-gray-500 text-[13px] font-medium max-w-xl mx-auto leading-relaxed">
                                From eligibility check to full disbursement — the fastest education loan experience in India.
                            </p>
                        </div>

                        <div className="relative">
                            <div className="hidden lg:block absolute top-[3.5rem] left-[12%] right-[12%] h-px rounded-full" style={{ background: 'linear-gradient(90deg, transparent, #c084fc 20%, #6605c7 50%, #c084fc 80%, transparent)' }} />
                            <div className="hidden lg:block absolute top-[3.5rem] w-2 h-2 rounded-full -translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ background: '#6605c7', left: '50%', boxShadow: '0 0 12px #a855f7' }} />

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { num: '01', emoji: '📋', title: 'Check Eligibility', desc: 'Answer a few smart questions about your university, course, and financial profile.', time: '2 mins', chips: ['No credit score', 'AI-assisted'], color: '#7c3aed', bg: '#f5f0ff', border: '#c4b5fd' },
                                    { num: '02', emoji: '⚖️', title: 'Compare Offers', desc: 'Get personalized loan offers from 50+ lenders. Compare rates and terms.', time: '5 mins', chips: ['50+ lenders', 'Best rates'], color: '#0284c7', bg: '#e0f2fe', border: '#7dd3fc' },
                                    { num: '03', emoji: '📁', title: 'Apply Online', desc: 'Complete your application digitally. Upload documents and e-sign securely.', time: '10 mins', chips: ['100% digital', 'e-KYC'], color: '#059669', bg: '#ecfdf5', border: '#6ee7b7' },
                                    { num: '04', emoji: '💸', title: 'Get Funded', desc: 'Receive your sanction letter in 48 hours. Funds disbursed to your university.', time: '48 hrs', chips: ['Fastest', 'Zero fees'], color: '#b45309', bg: '#fffbeb', border: '#fcd34d' },
                                ].map((step, idx) => (
                                    <div key={step.num} className="group relative flex flex-col items-center text-center">
                                        <div
                                            className="relative w-24 h-24 rounded-xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 shadow-lg"
                                            style={{ background: step.bg, border: `1.5px solid ${step.border}`, boxShadow: `0 8px 32px ${step.color}15` }}
                                        >
                                            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: `0 12px 40px ${step.color}20` }} />
                                            <div className="absolute -top-2 -left-2 text-4xl font-black opacity-[0.06] select-none leading-none" style={{ color: step.color }}>{step.num}</div>
                                            <span className="text-3xl relative z-10">{step.emoji}</span>
                                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black whitespace-nowrap backdrop-blur-sm" style={{ background: 'white', color: step.color, border: `1px solid ${step.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                                ⏱ {step.time}
                                            </div>
                                        </div>
                                        <div className="mt-2 px-4 py-6 rounded-xl w-full group-hover:shadow-xl transition-all duration-300 bg-white/60 backdrop-blur-sm border border-gray-100">
                                            <h3 className="text-[15px] font-black text-gray-900 mb-2 group-hover:text-[#6605c7] transition-colors">{step.title}</h3>
                                            <p className="text-gray-500 text-[13px] leading-relaxed mb-4">{step.desc}</p>
                                            <div className="flex flex-wrap gap-1.5 justify-center">
                                                {step.chips.map(c => (
                                                    <span key={c} className="px-2.5 py-1 rounded-full text-[10px] font-black" style={{ background: step.bg, color: step.color, border: `1px solid ${step.border}50` }}>
                                                        ✓ {c}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-100 shadow-lg">
                            <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
                                {[
                                    { icon: 'security', text: 'Bank-grade security' },
                                    { icon: 'support_agent', text: 'Dedicated advisor' },
                                    { icon: 'verified', text: 'RBI regulated' },
                                ].map(t => (
                                    <div key={t.text} className="flex items-center gap-2 text-gray-500 text-[13px] font-bold">
                                        <span className="material-symbols-outlined text-[#6605c7] text-base" style={{ fontVariationSettings: '"FILL" 1' }}>{t.icon}</span>
                                        <span>{t.text}</span>
                                    </div>
                                ))}
                            </div>
                            <Link
                                href="/apply-loan"
                                className="flex-shrink-0 flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white text-[13px] transition-all hover:opacity-90 hover:-translate-y-0.5"
                                style={{ background: 'linear-gradient(135deg, #6605c7, #a855f7)', boxShadow: '0 8px 32px rgba(102,5,199,0.3)' }}
                            >
                                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: '"FILL" 1' }}>rocket_launch</span>
                                Start Application — It&apos;s Free
                            </Link>
                        </div>
                    </div>
                </section>

                {/* EMI Calculator Section */}
                <section className="py-24 bg-transparent border-t border-gray-100">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <span className="inline-block px-4 py-1.5 rounded-full bg-[#6605c7]/10 text-[#6605c7] text-[11px] font-black uppercase tracking-widest mb-4 border border-[#6605c7]/15">
                                    EMI Calculator
                                </span>
                                <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 leading-[1.1]">Calculate Your EMI</h2>
                                <p className="text-[13px] text-gray-500 font-medium mb-10 leading-relaxed max-w-lg">Plan your education financing with our instant EMI calculator. Get a detailed breakdown of your monthly payments.</p>
                                <div className="space-y-4">
                                    {[
                                        "Compare monthly payments across interest rates",
                                        "Understand total interest payable over tenure",
                                        "Adjust tenure to find an EMI that fits your budget"
                                    ].map((p, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[10px] font-black">check</span>
                                            </div>
                                            <p className="text-gray-600 font-medium text-[13px]">{p}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-12">
                                    <Link href="/emi" className="inline-flex items-center gap-2 text-[#6605c7] font-black text-[13px] hover:gap-4 transition-all">
                                        Try Calculator Now <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                                    </Link>
                                </div>
                            </div>
                            <div className="bg-white/70 backdrop-blur-md p-8 rounded-xl shadow-2xl border border-gray-100">
                                <div className="space-y-8">
                                    <div>
                                        <div className="flex justify-between mb-4">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Loan Amount</label>
                                            <span className="text-[#6605c7] font-black text-[13px]">₹ 20,00,000</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-100 rounded-full">
                                            <div className="h-full bg-[#6605c7] w-2/3 rounded-full relative">
                                                <div className="w-3.5 h-3.5 bg-white border-2 border-[#6605c7] rounded-full absolute right-0 top-1/2 -translate-y-1/2 shadow-md"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-4">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Interest Rate</label>
                                            <span className="text-[#6605c7] font-black text-[13px]">9.5%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-100 rounded-full">
                                            <div className="h-full bg-[#6605c7] w-1/3 rounded-full relative">
                                                <div className="w-3.5 h-3.5 bg-white border-2 border-[#6605c7] rounded-full absolute right-0 top-1/2 -translate-y-1/2 shadow-md"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-8 border-t border-gray-100 text-center">
                                        <div className="text-[11px] text-gray-400 font-black uppercase tracking-widest mb-2">Monthly EMI</div>
                                        <div className="text-4xl font-black text-gray-900 font-sans">₹ 42,004</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Lending Partners Table */}
                <section className="py-24 bg-transparent border-t border-gray-100">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-[#6605c7]/10 text-[#6605c7] text-[11px] font-black uppercase tracking-widest mb-4 border border-[#6605c7]/15">
                                Banking Network
                            </span>
                            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">Our Lending Partners</h2>
                            <p className="text-gray-500 text-[13px] font-medium">Compare interest rates, processing times & fees from India&apos;s top lenders</p>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-xl bg-white/40 backdrop-blur-sm">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 text-gray-900 border-b border-gray-100">
                                    <tr>
                                        {["Lender", "Interest Rate", "Processing Time", "Processing Fee"].map((h) => (
                                            <th key={h} className="p-6 text-[11px] font-black uppercase tracking-widest text-gray-400">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {lenders.map((l) => (
                                        <tr key={l.name} className="hover:bg-gray-50/30 transition-colors">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-24 h-12 flex items-center justify-center p-1.5 overflow-hidden">
                                                        <img src={l.logo} alt={l.name} className="w-full h-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 text-[13px]">{l.name}</div>
                                                        {l.badge && <div className="text-[10px] text-green-600 font-bold uppercase tracking-tight">{l.badge}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-gray-600 text-[13px] font-bold">{l.rate}</td>
                                            <td className="p-6 text-gray-600 text-[13px] font-bold">{l.time}</td>
                                            <td className="p-6 text-gray-600 text-[13px] font-bold">{l.fee}</td>
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
                                    <p className="text-gray-600 mb-8 leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
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

                {/* Post-Admission Services — Bento Grid (same style as Universe) */}
                <section className="py-24 bg-transparent overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-[#6605c7]/5 rounded-full blur-[120px] -mr-[10vw] -mt-[10vw] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-blue-500/5 rounded-full blur-[120px] -ml-[10vw] -mb-[10vw] pointer-events-none" />

                    <div className="max-w-7xl mx-auto px-6 relative z-10">
                        {/* Header */}
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
                            <div>
                                <span className="inline-block px-4 py-1.5 rounded-full bg-[#6605c7]/10 text-[#6605c7] text-[11px] font-black uppercase tracking-widest mb-4 border border-[#6605c7]/15">
                                    VALUE ADDED SERVICES
                                </span>
                                <h2 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight">
                                    Beyond Admissions: <br />
                                    <span style={{ background: 'linear-gradient(135deg, #6605c7, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Post-Admission Services</span>
                                </h2>
                                <p className="text-gray-500 text-[13px] mt-4 max-w-lg leading-relaxed font-medium">
                                    We stay with you even after your offer letter. Complete your pre-departure checklist with our curated global services.
                                </p>
                            </div>
                            <Link href="/explore" className="flex-shrink-0 inline-flex items-center gap-2 px-7 py-4 rounded-xl border-2 border-[#6605c7]/20 text-[#6605c7] font-black hover:bg-[#6605c7] hover:text-white hover:border-[#6605c7] transition-all group text-[11px] uppercase tracking-widest">
                                View All Services
                                <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </Link>
                        </div>

                        {/* Bento Grid */}
                        <div className="grid grid-cols-12 gap-5">
                            {/* Row 1 */}
                            {/* 1 — Forex & Cards (large left) */}
                            <Link href="/forex" className="col-span-12 lg:col-span-5 row-span-1 group relative overflow-hidden rounded-xl shadow-xl flex flex-col justify-end min-h-[320px]" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)' }}>
                                <div className="absolute inset-0 opacity-15" style={{ background: "url('https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&q=80') center/cover" }} />
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(30,58,138,0.97) 0%, rgba(30,58,138,0.3) 60%, transparent 100%)' }} />
                                <div className="absolute top-6 left-6">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
                                        🌐 Global
                                    </span>
                                </div>
                                <div className="absolute top-4 right-4 w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform border border-white/20">
                                    <span className="text-3xl">💳</span>
                                </div>
                                <div className="relative z-10 p-7">
                                    <div className="text-4xl font-black text-white mb-1">0%</div>
                                    <div className="text-white/50 text-[10px] uppercase tracking-widest font-black mb-3">Markup Fee</div>
                                    <h3 className="text-xl font-black text-white mb-2">Forex & Cards</h3>
                                    <p className="text-white/60 text-[13px] mb-5 leading-relaxed font-medium">Lock in the best exchange rates with zero-markup cards for all your expenses abroad.</p>
                                    <span className="inline-flex items-center gap-2 text-blue-300 font-bold text-[11px] uppercase tracking-widest group-hover:gap-3 transition-all">
                                        Get Your Card <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </span>
                                </div>
                            </Link>

                            {/* 2 — Student Housing (top middle) */}
                            <Link href="/housing" className="col-span-12 sm:col-span-6 lg:col-span-4 row-span-1 group relative overflow-hidden rounded-xl shadow-xl flex flex-col justify-end min-h-[320px]" style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%)' }}>
                                <div className="absolute inset-0 opacity-20" style={{ background: "url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80') center/cover" }} />
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(76,29,149,0.98) 0%, rgba(76,29,149,0.3) 60%, transparent 100%)' }} />
                                <div className="absolute top-4 right-4">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-400/20 backdrop-blur-sm text-purple-200 text-[10px] font-black uppercase tracking-widest border border-purple-400/20">
                                        ✅ Verified
                                    </span>
                                </div>
                                <div className="relative z-10 p-6">
                                    <div className="text-3xl font-black text-white mb-1">1,000+</div>
                                    <div className="text-white/40 text-[10px] uppercase tracking-widest font-black mb-2">Verified Listings</div>
                                    <h3 className="text-lg font-black text-white mb-2">Student Housing</h3>
                                    <p className="text-white/55 text-[13px] mb-4 leading-relaxed font-medium">Verified accommodations near top global universities with pre-booking support.</p>
                                    <span className="inline-flex items-center gap-2 text-purple-300 font-bold text-[11px] uppercase tracking-widest group-hover:gap-3 transition-all">
                                        Find Housing <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </span>
                                </div>
                            </Link>

                            {/* 3 — Visa Slot Booking (top right) */}
                            <Link href="/visa-slots" className="col-span-12 sm:col-span-6 lg:col-span-3 row-span-1 group relative overflow-hidden rounded-xl shadow-xl flex flex-col justify-end min-h-[320px]" style={{ background: 'linear-gradient(135deg, #7c2d12 0%, #9a3412 100%)' }}>
                                <div className="absolute inset-0 opacity-15" style={{ background: "url('https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=400&q=80') center/cover" }} />
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(124,45,18,0.97) 0%, rgba(124,45,18,0.3) 70%, transparent 100%)' }} />
                                <div className="absolute top-4 left-4">
                                    <span className="text-3xl">📅</span>
                                </div>
                                <div className="relative z-10 p-6">
                                    <div className="text-3xl font-black text-white mb-1">24/7</div>
                                    <div className="text-orange-200/50 text-[10px] uppercase tracking-widest font-black mb-2">Slot Alerts</div>
                                    <h3 className="text-lg font-black text-white mb-2">Visa Slot Booking</h3>
                                    <span className="inline-flex items-center gap-2 text-orange-300 font-bold text-[11px] uppercase tracking-widest group-hover:gap-3 transition-all">
                                        Book Slot <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </span>
                                </div>
                            </Link>

                            {/* Row 2 */}
                            {/* 4 — Mock Visa Interview (bottom left) */}
                            <Link href="/visa-mock" className="col-span-12 sm:col-span-6 lg:col-span-4 row-span-1 group relative overflow-hidden rounded-xl shadow-xl flex flex-col justify-end min-h-[280px]" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)' }}>
                                <div className="absolute inset-0 opacity-15" style={{ background: "url('https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&q=80') center/cover" }} />
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(6,78,59,0.98) 0%, rgba(6,78,59,0.3) 70%, transparent 100%)' }} />
                                <div className="absolute top-4 right-4 w-11 h-11 rounded-xl bg-emerald-400/20 backdrop-blur-sm flex items-center justify-center border border-emerald-400/20">
                                    <span className="text-xl">🎙️</span>
                                </div>
                                <div className="absolute top-4 left-4 flex gap-2">
                                    {['F1', 'B1/B2', 'Schengen'].map(t => (
                                        <span key={t} className="px-2 py-1 rounded-lg bg-emerald-400/20 backdrop-blur-sm text-emerald-300 text-[10px] font-black border border-emerald-400/20">{t}</span>
                                    ))}
                                </div>
                                <div className="relative z-10 p-6">
                                    <div className="text-3xl font-black text-white mb-1">10K+</div>
                                    <div className="text-emerald-200/50 text-[10px] uppercase tracking-widest font-black mb-2">Students Coached</div>
                                    <h3 className="text-lg font-black text-white mb-2">Mock Visa Interview</h3>
                                    <p className="text-white/55 text-[13px] mb-4 leading-relaxed font-medium">Practice with experts who have helped 10k+ students clear their visa interviews.</p>
                                    <span className="inline-flex items-center gap-2 text-emerald-300 font-bold text-[11px] uppercase tracking-widest group-hover:gap-3 transition-all">
                                        Book Session <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </span>
                                </div>
                            </Link>

                            {/* 5 — Courier Services (bottom middle) */}
                            <Link href="/courier" className="col-span-12 sm:col-span-6 lg:col-span-5 row-span-1 group relative overflow-hidden rounded-xl shadow-xl flex flex-col justify-end min-h-[280px]" style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)' }}>
                                <div className="absolute inset-0 opacity-15" style={{ background: "url('https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&q=80') center/cover" }} />
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(127,29,29,0.97) 0%, rgba(127,29,29,0.3) 60%, transparent 100%)' }} />
                                <div className="absolute top-6 left-6">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
                                        📦 Express
                                    </span>
                                </div>
                                <div className="absolute top-4 right-4 w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform border border-white/20">
                                    <span className="text-3xl">📦</span>
                                </div>
                                <div className="relative z-10 p-7">
                                    <div className="text-4xl font-black text-white mb-1">40%</div>
                                    <div className="text-white/50 text-[10px] uppercase tracking-widest font-black mb-3">Student Discount</div>
                                    <h3 className="text-xl font-black text-white mb-2">Courier Services</h3>
                                    <p className="text-white/60 text-[13px] mb-5 leading-relaxed font-medium">Send your documents globally with special student discounts and real-time tracking.</p>
                                    <span className="inline-flex items-center gap-2 text-red-300 font-bold text-[11px] uppercase tracking-widest group-hover:gap-3 transition-all">
                                        Ship Now <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </span>
                                </div>
                            </Link>

                            {/* 6 — Bank Account (bottom right, featured purple) */}
                            <Link href="/bank-account" className="col-span-12 sm:col-span-6 lg:col-span-3 row-span-1 group relative overflow-hidden rounded-xl shadow-2xl flex flex-col justify-end min-h-[280px]" style={{ background: 'linear-gradient(135deg, #164e63 0%, #155e75 100%)' }}>
                                <div className="absolute inset-0 opacity-10" style={{ background: "url('https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=400&q=80') center/cover" }} />
                                <div className="absolute top-6 right-6 w-20 h-20 rounded-full border-4 border-white/15 animate-ping opacity-20" />
                                <div className="absolute top-6 right-6 w-20 h-20 rounded-xl border-4 border-white/10 flex items-center justify-center">
                                    <span className="text-2xl">🏦</span>
                                </div>
                                <div className="relative z-10 p-6">
                                    <span className="inline-block px-2.5 py-1 rounded-lg bg-white/20 text-white text-[10px] font-black uppercase tracking-widest mb-3">🌟 Zero Balance</span>
                                    <div className="text-3xl font-black text-white mb-1">₹0</div>
                                    <div className="text-cyan-200/60 text-[10px] uppercase tracking-widest font-black mb-2">Min. Balance</div>
                                    <h3 className="text-lg font-black text-white mb-2">Bank Account</h3>
                                    <span className="inline-flex items-center gap-2 text-cyan-200 font-bold text-[11px] uppercase tracking-widest group-hover:gap-3 transition-all">
                                        Open Account <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </span>
                                </div>
                            </Link>
                        </div>

                        {/* Stats Bar */}
                        <div className="mt-8 flex flex-wrap gap-4 justify-center">
                            {[
                                { icon: '💳', val: '0%', label: 'Forex Markup' },
                                { icon: '🏠', val: '1,000+', label: 'Verified Stays' },
                                { icon: '📅', val: '24/7', label: 'Slot Alerts' },
                                { icon: '🎙️', val: '10K+', label: 'Mock Sessions' },
                                { icon: '📦', val: '40%', label: 'Courier Savings' },
                                { icon: '🏦', val: '₹0', label: 'Min. Balance' },
                            ].map(s => (
                                <div key={s.label} className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
                                    <span className="text-lg group-hover:scale-125 transition-transform">{s.icon}</span>
                                    <div>
                                        <div className="font-black text-gray-900 text-[13px] leading-none">{s.val}</div>
                                        <div className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">{s.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Refer & Earn Section */}
                <section className="py-20 bg-transparent">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="relative rounded-3xl overflow-hidden">
                            {/* Animated gradient background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600" />
                            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.2) 0%, transparent 40%)' }} />
                            
                            {/* Pattern overlay */}
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 0L60 30L30 60L0 30L30 0z\' fill=\'%23fff\' fill-opacity=\'0.1\'/%3E%3C/svg%3E")', backgroundSize: '30px 30px' }} />
                            
                            {/* Floating elements */}
                            <div className="absolute top-10 left-10 w-16 h-16 bg-white/10 rounded-2xl rotate-12 animate-pulse" />
                            <div className="absolute bottom-10 right-20 w-20 h-20 bg-white/10 rounded-full animate-bounce" style={{ animationDuration: '3s' }} />
                            <div className="absolute top-1/2 right-10 w-8 h-8 bg-yellow-300/30 rounded-lg rotate-45" />
                            
                            <div className="relative z-10 p-10 md:p-16">
                                <div className="flex flex-col lg:flex-row items-center gap-10">
                                    {/* Custom Referral Logo/Icon */}
                                    <div className="relative flex-shrink-0">
                                        {/* Outer glow */}
                                        <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl scale-110" />
                                        
                                        {/* Main container */}
                                        <div className="relative w-32 h-32 md:w-40 md:h-40">
                                            {/* Rotating ring */}
                                            <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-white/30 animate-[spin_20s_linear_infinite]" />
                                            
                                            {/* Inner container */}
                                            <div className="absolute inset-2 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                {/* Custom SVG Logo */}
                                                <svg width="80" height="80" viewBox="0 0 100 100" fill="none" className="drop-shadow-2xl">
                                                    {/* Gift box base */}
                                                    <rect x="15" y="45" width="70" height="45" rx="8" fill="white" />
                                                    <rect x="15" y="45" width="70" height="45" rx="8" fill="url(#gift-gradient)" fillOpacity="0.3" />
                                                    
                                                    {/* Gift box lid */}
                                                    <rect x="10" y="35" width="80" height="15" rx="4" fill="white" />
                                                    <rect x="10" y="35" width="80" height="15" rx="4" fill="url(#gift-gradient)" fillOpacity="0.2" />
                                                    
                                                    {/* Ribbon vertical */}
                                                    <rect x="45" y="35" width="10" height="55" fill="#f59e0b" />
                                                    
                                                    {/* Ribbon horizontal */}
                                                    <rect x="15" y="55" width="70" height="10" fill="#f59e0b" />
                                                    
                                                    {/* Bow */}
                                                    <ellipse cx="35" cy="30" rx="12" ry="10" fill="#f59e0b" />
                                                    <ellipse cx="65" cy="30" rx="12" ry="10" fill="#f59e0b" />
                                                    <circle cx="50" cy="32" r="8" fill="#fbbf24" />
                                                    
                                                    {/* Coins coming out */}
                                                    <circle cx="70" cy="20" r="8" fill="#fcd34d" stroke="#f59e0b" strokeWidth="2" />
                                                    <text x="70" y="24" textAnchor="middle" fill="#92400e" fontSize="10" fontWeight="bold">₹</text>
                                                    
                                                    <circle cx="82" cy="28" r="6" fill="#fcd34d" stroke="#f59e0b" strokeWidth="2" />
                                                    <circle cx="25" cy="18" r="7" fill="#fcd34d" stroke="#f59e0b" strokeWidth="2" />
                                                    <text x="25" y="22" textAnchor="middle" fill="#92400e" fontSize="9" fontWeight="bold">₹</text>
                                                    
                                                    {/* Sparkles */}
                                                    <path d="M88 15L90 10L92 15L97 17L92 19L90 24L88 19L83 17L88 15Z" fill="white" />
                                                    <path d="M15 25L16 22L17 25L20 26L17 27L16 30L15 27L12 26L15 25Z" fill="white" />
                                                    
                                                    <defs>
                                                        <linearGradient id="gift-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#f59e0b" />
                                                            <stop offset="100%" stopColor="#ea580c" />
                                                        </linearGradient>
                                                    </defs>
                                                </svg>
                                            </div>
                                            
                                            {/* Sparkle accents */}
                                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-300 rounded-full animate-ping" />
                                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-300 rounded-full flex items-center justify-center">
                                                <span className="text-amber-700 text-xs">✦</span>
                                            </div>
                                            <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-white rounded-full animate-pulse" />
                                        </div>
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="flex-1 text-center lg:text-left">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-4">
                                            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                            <span className="text-white text-[11px] font-black uppercase tracking-widest">Exclusive Rewards Program</span>
                                        </div>
                                        
                                        <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
                                            Refer Friends,<br />
                                            <span className="text-yellow-200">Earn ₹3,000</span> Each!
                                        </h2>
                                        
                                        <p className="text-white/90 text-[15px] mb-8 max-w-lg leading-relaxed font-medium">
                                            Know someone planning to study abroad? Refer them to VidhyaLoan and earn rewards for every successful loan disbursement. Plus, unlock ₹10,000 bonus when you hit 5 referrals!
                                        </p>
                                        
                                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                            <Link href="/referral" className="px-8 py-4 bg-white text-amber-600 font-black rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all text-[13px] uppercase tracking-widest flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined">share</span>
                                                Start Referring
                                            </Link>
                                            <Link href="/referral" className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 font-bold rounded-xl hover:bg-white/30 transition-all text-[13px] uppercase tracking-widest flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined">info</span>
                                                Learn More
                                            </Link>
                                        </div>
                                        
                                        {/* Stats */}
                                        <div className="flex flex-wrap gap-6 mt-8 justify-center lg:justify-start">
                                            {[
                                                { value: '₹3,000', label: 'Per Referral' },
                                                { value: '₹10K', label: 'Bonus at 5' },
                                                { value: 'Unlimited', label: 'Earnings' },
                                            ].map(stat => (
                                                <div key={stat.label} className="text-center lg:text-left">
                                                    <div className="text-2xl font-black text-white">{stat.value}</div>
                                                    <div className="text-white/70 text-[11px] uppercase tracking-wider font-bold">{stat.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-24 bg-transparent mb-12">
                    <div className="max-w-5xl mx-auto px-6">
                        <div className="bg-[#6605c7] rounded-xl p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-32 -mb-32" />
                            <h2 className="text-3xl md:text-5xl font-bold font-display mb-8 relative z-10 uppercase tracking-tight">Ready to Fund Your Education?</h2>
                            <p className="text-[15px] text-white/80 mb-12 max-w-2xl mx-auto relative z-10 font-medium leading-relaxed">
                                Join 10,000+ students who found their perfect education loan. <br className="hidden md:block" /> Start your journey in under 5 minutes.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
                                <Link href="/apply-loan" className="px-10 py-5 bg-white text-[#6605c7] font-bold rounded-xl shadow-xl hover:-translate-y-1 transition-all text-[13px] uppercase tracking-widest">Start Application</Link>
                                <Link href="/emi" className="px-10 py-5 bg-[#6605c7]/20 text-white border border-white/30 font-bold rounded-xl hover:bg-white/10 transition-all text-[13px] uppercase tracking-widest">Try EMI Calculator</Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

function ToolCard({ href, bg, icon, title, desc, cta, large = false, border = false }: {
    href: string; bg: string; icon: string; title: string; desc: string; cta: string; large?: boolean; border?: boolean;
}) {
    return (
        <Link
            href={href}
            className={`flex ${large ? "flex-col md:flex-row md:items-center" : "flex-col"} p-8 rounded-xl ${bg} hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group border ${border ? "border-[#6605c7]/10" : "border-white/50"}`}
        >
            <div className={`flex items-start ${large ? "gap-8 mb-0" : "gap-6 mb-8"}`}>
                <div className={`${large ? "w-16 h-16" : "w-12 h-12"} bg-white/80 rounded-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-2.5`}>
                    <img src={icon} alt={title} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                    <h3 className={`${large ? "text-xl" : "text-[15px]"} font-bold mb-2 text-gray-900 leading-tight`}>{title}</h3>
                    <p className="text-gray-500 text-[13px] leading-relaxed font-medium">{desc}</p>
                </div>
            </div>
            <div className={`${large ? "mt-6 md:mt-0 md:ml-auto" : "mt-auto"} flex justify-end`}>
                <span className={`inline-flex items-center gap-2 text-[#6605c7] font-bold ${large ? "text-[13px]" : "text-[11px]"} uppercase tracking-widest group-hover:gap-3 transition-all`}>
                    {cta} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
            </div>
        </Link>
    );
}
