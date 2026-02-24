
import { banks } from "@/lib/bankData";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateMetadata({ params }: Props) {
    const { slug } = await params;
    const bank = banks[slug];
    if (!bank) return { title: "Bank Not Found" };
    return {
        title: `${bank.name} Education Loan - VidhyaLoan`,
        description: bank.description,
    };
}

export default async function BankPage({ params }: Props) {
    const { slug } = await params;
    const bank = banks[slug];

    if (!bank) {
        notFound();
    }

    return (
        <main className="relative z-10 pt-32 pb-24">
            <div className="max-w-7xl mx-auto px-6">
                {/* Hero Section */}
                <section className="mb-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="animate-fade-in-left">
                            <Link href="/bank-reviews" className="inline-flex items-center gap-2 text-sm font-bold text-primary mb-6 hover:underline group">
                                <span className="material-symbols-outlined text-lg transition-transform group-hover:-translate-x-1">arrow_back</span>
                                Back to All Banks
                            </Link>
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-24 h-24 rounded-[2rem] bg-white shadow-xl flex items-center justify-center p-4 border border-gray-100 overflow-hidden">
                                    <img src={bank.logo} alt={bank.name} className="w-full h-auto object-contain" />
                                </div>
                                <div className="space-y-1">
                                    <h1 className="text-4xl md:text-5xl font-bold font-display text-gray-900 leading-tight">
                                        {bank.name}
                                    </h1>
                                    <div className="flex items-center gap-2">
                                        <div className="flex text-yellow-500">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className="material-symbols-outlined text-sm flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                                                    {i < Math.floor(Number(bank.rating)) ? "star" : "star_half"}
                                                </span>
                                            ))}
                                        </div>
                                        <span className="text-gray-500 font-bold text-sm">{bank.rating} / 5.0</span>
                                        <div className="w-1 h-1 bg-gray-300 rounded-full mx-1" />
                                        <span className="text-[#6605c7] font-bold text-sm uppercase tracking-wider">Lending Partner</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xl text-gray-500 leading-relaxed mb-10 max-w-xl font-sans">
                                {bank.description}
                            </p>

                            {/* Key Highlights Grid */}
                            <div className="grid grid-cols-3 gap-4 mb-10">
                                <div className="bg-white/60 backdrop-blur-xl border border-white/40 p-5 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all">
                                    <p className="text-[10px] font-bold text-[#6605c7] uppercase tracking-widest mb-2 opacity-70">Interest Rate</p>
                                    <p className="text-3xl font-bold font-display text-gray-900">{bank.interestRate}</p>
                                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">p.a. onwards</p>
                                </div>
                                <div className="bg-white/60 backdrop-blur-xl border border-white/40 p-5 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all">
                                    <p className="text-[10px] font-bold text-[#6605c7] uppercase tracking-widest mb-2 opacity-70">Max Loan</p>
                                    <p className="text-3xl font-bold font-display text-gray-900">{bank.maxLoan}</p>
                                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">100% COVERAGE</p>
                                </div>
                                <div className="bg-white/60 backdrop-blur-xl border border-white/40 p-5 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all">
                                    <p className="text-[10px] font-bold text-[#6605c7] uppercase tracking-widest mb-2 opacity-70">Approval Time</p>
                                    <p className="text-3xl font-bold font-display text-gray-900">{bank.approvalTime}</p>
                                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">FAST TRACK</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="/apply-loan" className="flex-1 py-5 rounded-[1.5rem] font-bold text-white text-center shadow-2xl hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2" style={{ background: bank.gradient }}>
                                    <span className="material-symbols-outlined text-xl">send</span>
                                    Apply Now
                                </Link>
                                <Link href="/loan-eligibility" className="flex-1 py-5 bg-white border border-[#6605c7]/20 rounded-[1.5rem] font-bold text-[#6605c7] text-center hover:bg-gray-50 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-xl">verified_user</span>
                                    Check Eligibility
                                </Link>
                            </div>
                        </div>

                        <div className="relative animate-fade-in-right">
                            <div className="bg-gradient-to-br from-[#6605c7]/10 to-transparent p-3 rounded-[3.5rem] border border-white/20">
                                <div className="relative overflow-hidden rounded-[3rem] shadow-2xl">
                                    <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80" alt="Students" className="w-full h-auto" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent" />
                                    <div className="absolute bottom-10 left-10 p-6 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl flex items-center gap-4 max-w-[280px]">
                                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                                            <span className="material-symbols-outlined text-2xl">done_all</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm leading-tight">Direct Liaison</p>
                                            <p className="text-xs text-gray-500 mt-1">Faster communication via VidhyaLoan</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Counter Section */}
                <section className="mb-24">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { label: "Students Funded", value: bank.stats.studentsFunded, icon: "groups" },
                            { label: "Universities Covered", value: bank.stats.universitiesCovered, icon: "school" },
                            { label: "Countries Supported", value: bank.stats.countriesSupported, icon: "public" },
                            { label: "Customer Rating", value: bank.stats.customerRating, icon: "star" }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-3xl p-8 text-center hover:shadow-xl transition-all hover:-translate-y-1">
                                <div className="w-12 h-12 bg-[#6605c7]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#6605c7]">
                                    <span className="material-symbols-outlined">{stat.icon}</span>
                                </div>
                                <p className="text-3xl font-bold font-display text-gray-900 mb-1">{stat.value}</p>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Features Section */}
                <section className="mb-24">
                    <div className="text-center mb-12">
                        <span className="text-[#6605c7] font-bold text-[10px] tracking-[0.2em] uppercase mb-3 block">Perks & Benefits</span>
                        <h2 className="text-4xl font-bold font-display text-gray-900">Why Choose {bank.name}?</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {bank.features.map((feature, i) => (
                            <div key={i} className="bg-white/80 backdrop-blur-xl border border-gray-100 p-8 rounded-[2.5rem] text-center hover:shadow-2xl transition-all hover:-translate-y-2 group">
                                <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-6 scale-110 group-hover:rotate-6 transition-transform`}>
                                    <span className={`material-symbols-outlined text-4xl ${feature.iconColor}`}>{feature.icon}</span>
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg mb-3">{feature.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Loan Details & Documents Grid */}
                <section className="bg-white/80 backdrop-blur-2xl border border-gray-100 rounded-[3.5rem] p-12 lg:p-20 shadow-xl mb-24 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#6605c7]/5 to-transparent rounded-full -mr-64 -mt-64 blur-[100px]" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 relative z-10">
                        {/* Specifications */}
                        <div>
                            <div className="flex items-center gap-3 mb-12">
                                <div className="w-12 h-12 bg-[#6605c7]/10 rounded-2xl flex items-center justify-center text-[#6605c7]">
                                    <span className="material-symbols-outlined text-2xl">description</span>
                                </div>
                                <h2 className="text-2xl font-bold font-display">Loan Specifications</h2>
                            </div>
                            <div className="space-y-2">
                                {bank.specifications.map((spec, i) => (
                                    <div key={i} className="flex justify-between items-center py-4 border-b border-gray-100 last:border-0 hover:px-2 transition-all rounded-xl hover:bg-[#6605c7]/5 group">
                                        <span className="text-gray-500 font-medium group-hover:text-gray-900 transition-colors">{spec.label}</span>
                                        <span className="font-bold text-gray-900">{spec.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Documents */}
                        <div>
                            <div className="flex items-center gap-3 mb-12">
                                <div className="w-12 h-12 bg-[#6605c7]/10 rounded-2xl flex items-center justify-center text-[#6605c7]">
                                    <span className="material-symbols-outlined text-2xl">library_books</span>
                                </div>
                                <h2 className="text-2xl font-bold font-display">Documents Required</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {bank.documents.map((doc, i) => (
                                    <div key={i} className="bg-gray-50/50 p-5 rounded-2xl border border-transparent hover:border-[#6605c7]/20 hover:bg-white transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <span className={`material-symbols-outlined text-xl`} style={{ color: bank.primaryColor }}>{doc.icon}</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-900 leading-tight">{doc.title}</p>
                                                <p className="text-[11px] text-gray-500 mt-1">{doc.desc}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Popular Courses Section */}
                <section className="mb-24">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold font-display mb-4">Popular Programs Funded</h2>
                        <div className="h-1 w-20 bg-[#6605c7] rounded-full mx-auto" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {bank.courses.map((course, i) => (
                            <div key={i} className="bg-white/80 border border-gray-100 p-6 rounded-2xl text-center hover:shadow-lg transition-all hover:scale-105 cursor-default">
                                <span className="material-symbols-outlined text-3xl mb-3 block" style={{ color: bank.primaryColor }}>{course.icon}</span>
                                <p className="font-bold text-[11px] uppercase tracking-wider text-gray-700 leading-tight">{course.title}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Final CTA Section */}
                <section>
                    <div className="rounded-[4rem] p-12 lg:p-20 text-white text-center relative overflow-hidden group shadow-3xl" style={{ background: bank.gradient }}>
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08759df9a73?auto=format&fit=crop&w=1200&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay group-hover:scale-110 transition-transform duration-1000" />
                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-6xl font-bold font-display mb-6">Ready to study abroad?</h2>
                            <p className="text-xl opacity-90 mb-12 max-w-2xl mx-auto leading-relaxed">
                                Submit your referral through VidhyaLoan and we'll fast-track your application with {bank.name}'s dedicated team.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-6 justify-center">
                                <Link href="/apply-loan" className="px-12 py-5 bg-white text-gray-900 rounded-[1.5rem] font-bold text-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all">
                                    Start Application
                                </Link>
                                <Link href="/loan-eligibility" className="px-12 py-5 bg-white/20 backdrop-blur-md border border-white/40 text-white rounded-[1.5rem] font-bold text-lg hover:bg-white/30 transition-all">
                                    Check Eligibility
                                </Link>
                            </div>
                            <div className="mt-12 flex flex-wrap justify-center gap-8 items-center opacity-80 text-sm font-medium">
                                <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">verified</span> No Hidden Fees</span>
                                <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">verified</span> Doorstep Pickup</span>
                                <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">verified</span> Tax Benefits</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
