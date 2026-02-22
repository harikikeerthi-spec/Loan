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
    { name: "SBI", badge: "Lowest Rate", rate: "8.50% - 10.15%", time: "7-15 days", fee: "₹10,000", color: "bg-blue-100 text-blue-800" },
    { name: "HDFC Credila", rate: "9.00% - 11.50%", time: "5-10 days", fee: "1% of loan", color: "bg-red-100 text-red-800" },
    { name: "ICICI Bank", badge: "Fastest", rate: "9.50% - 12.00%", time: "5-7 days", fee: "₹12,500", color: "bg-orange-100 text-orange-800" },
    { name: "Prodigy Finance", badge: "No Collateral", rate: "7.50% - 12.50%", time: "10-14 days", fee: "$0", color: "bg-indigo-100 text-indigo-800" },
];

const features = [
    { icon: "hub", title: "Top 50+ Lender Network", desc: "Access India's largest education loan marketplace with banks, NBFCs, and international lenders." },
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
                {/* Floating Gift Icon */}
                <div className="fixed left-6 top-[75%] -translate-y-1/2 z-50 animate-bounce">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#6605c7] to-purple-400 rounded-full flex items-center justify-center text-white shadow-xl shadow-purple-500/40 cursor-pointer hover:scale-125 transition-transform border border-white/30">
                        <span className="material-symbols-outlined text-2xl">card_giftcard</span>
                    </div>
                </div>

                {/* Hero Section */}
                <section className="relative min-h-screen flex items-center pt-24 overflow-hidden bg-transparent">
                    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                        <div className="animate-fade-in-up">
                            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-[#6605c7]/10 text-[#6605c7] text-xs font-black mb-8 border border-[#6605c7]/20 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#6605c7] animate-pulse" />
                                <span>Trusted by 10,000+ students across 20+ countries</span>
                            </div>

                            <h1 className="text-5xl md:text-7xl font-bold font-display leading-[1.1] mb-8 text-[#1a1626] tracking-tight">
                                Fund Your <span className="text-[#6605c7] italic">Dream</span> <br />
                                Education Abroad
                            </h1>

                            <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-xl font-medium">
                                Compare education loans from 50+ banks & NBFCs. Get the best rates, quick approvals, and expert guidance — all in one place.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-5 mb-14">
                                <Link
                                    href="/apply-loan"
                                    className="px-10 py-5 bg-[#6605c7] text-white font-bold rounded-2xl shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-1 transition-all text-center text-lg whitespace-nowrap"
                                >
                                    Check Your Eligibility
                                </Link>
                                <Link
                                    href="/emi"
                                    className="px-10 py-5 bg-white/90 backdrop-blur-md text-[#1a1626] border border-[#E5E7EB] font-bold rounded-2xl shadow-sm hover:bg-white transition-all text-center text-lg whitespace-nowrap"
                                >
                                    Calculate EMI
                                </Link>
                            </div>

                            <div className="flex items-center gap-5">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="w-10 h-10 rounded-full border-4 border-white/50 overflow-hidden shadow-sm">
                                            <Image
                                                src={`https://i.pravatar.cc/80?u=${i + 10}`}
                                                className="w-full h-full object-cover"
                                                alt="Student"
                                                width={40}
                                                height={40}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="text-sm font-medium">
                                    <span className="font-bold text-[#1a1626] text-lg">4.9/5</span>{" "}
                                    <span className="text-gray-400">from 2,000+ reviews</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative animate-fade-in-up delay-200">
                            {/* Main Hero Image */}
                            <div className="relative rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border-8 border-white/60 group">
                                <Image
                                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                                    alt="Students studying abroad"
                                    width={1200}
                                    height={900}
                                    className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-105"
                                    priority
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            </div>

                            {/* Floating Lowest Rate Badge */}
                            <div className="absolute -bottom-6 -left-12 bg-white/40 backdrop-blur-[20px] p-6 pr-12 rounded-[2.5rem] shadow-2xl border border-white/50 float-animation flex items-center gap-5">
                                <div className="w-14 h-14 bg-[#6605c7]/20 rounded-full flex items-center justify-center text-[#6605c7] border border-[#6605c7]/30">
                                    <span className="material-symbols-outlined text-2xl">verified</span>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-1">Lowest Rate</div>
                                    <div className="text-3xl font-black text-[#1a1626] tracking-tight">8.5% p.a.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Trust Badges */}
                <div className="bg-gray-50 py-12">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { icon: "account_balance", num: "50+", label: "Lending Partners" },
                                { icon: "speed", num: "48hrs", label: "Quick Approval" },
                                { icon: "verified_user", num: "100%", label: "Secure & Trusted" },
                                { icon: "public", num: "30+", label: "Countries Covered" },
                            ].map((s) => (
                                <div key={s.label} className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#6605c7]">
                                        <span className="material-symbols-outlined text-3xl">{s.icon}</span>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">{s.num}</div>
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
                <section className="py-24 bg-transparent">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-col lg:flex-row gap-16 items-center">
                            <div className="flex-1">
                                <h2 className="text-4xl md:text-5xl font-bold font-display text-gray-900 mb-6">Your Study Abroad Universe</h2>
                                <p className="text-lg text-gray-600 mb-8 leading-relaxed">Everything you need to kickstart your global education journey</p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { icon: "📚", title: "TRENDING Courses" },
                                        { icon: "🏛️", title: "POPULAR Universities" },
                                        { icon: "✍️", title: "Exams Prep" },
                                        { icon: "🏆", title: "HOT Scholarships" },
                                    ].map((univ, i) => (
                                        <Link key={i} href="/explore" className="p-4 rounded-2xl border border-gray-100 hover:border-[#6605c7]/20 transition-all flex items-center gap-4 bg-white">
                                            <span className="text-2xl">{univ.icon}</span>
                                            <span className="font-bold text-gray-900 text-sm">{univ.title}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1">
                                <img
                                    src="https://images.unsplash.com/photo-1541339907198-e08756ebafe3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                                    alt="Universe"
                                    className="rounded-[3rem] shadow-2xl"
                                />
                            </div>
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
                <section className="py-24 bg-transparent">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <span className="text-[#6605c7] font-bold text-sm tracking-widest uppercase mb-4 block">Process</span>
                            <h2 className="text-4xl md:text-5xl font-bold font-display text-gray-900 mb-6">How It Works</h2>
                            <p className="text-gray-500 max-w-2xl mx-auto">From eligibility check to disbursement — in 4 simple steps</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { num: "01", title: "Check Eligibility", desc: "Answer a few questions about your education plans and financial profile.", w: "w-1/4" },
                                { num: "02", title: "Compare Offers", desc: "Get personalized loan offers from 50+ lenders. Compare rates, tenure, and terms.", w: "w-1/2" },
                                { num: "03", title: "Apply Online", desc: "Complete your application digitally. Upload documents and e-sign securely.", w: "w-3/4" },
                                { num: "04", title: "Get Funded", desc: "Receive your sanction letter in 48 hours. Funds disbursed directly.", w: "w-full" },
                            ].map((s) => (
                                <div key={s.num} className="relative group">
                                    <div className="text-8xl font-black text-gray-100 absolute -top-10 -left-6 z-0">{s.num}</div>
                                    <div className="relative z-10 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all h-full">
                                        <h3 className="text-xl font-bold mb-4 text-gray-900">{s.title}</h3>
                                        <p className="text-gray-500 text-sm mb-6">{s.desc}</p>
                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full bg-[#6605c7] ${s.w}`} />
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                                                    <div className={`w-10 h-10 ${l.color} rounded flex items-center justify-center font-bold`}>{l.name[0]}</div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 text-sm">{l.name}</div>
                                                        {l.badge && <div className="text-[10px] text-green-600 font-bold uppercase tracking-tight">{l.badge}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-gray-600 text-sm">{l.rate}</td>
                                            <td className="p-6 text-gray-600 text-sm">{l.time}</td>
                                            <td className="p-6 text-gray-600 text-sm">{l.fee}</td>
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
                <div className="text-center py-12 text-gray-400 text-xs border-t border-black/5">
                    Design inspired by <a href="https://vidhya-path-aid.lovable.app/" className="underline hover:text-[#6605c7]">Vidhya Path Aid</a>
                </div>
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
