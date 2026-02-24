"use client";

import { useState } from "react";
import { aiApi } from "@/lib/api";

export default function LoanEligibilityPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [formData, setFormData] = useState({
        age: 22,
        credit: 750,
        income: 600000,
        loan: 2000000,
        employment: "student",
        study: "masters",
        coApplicant: "yes",
        collateral: "no"
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await aiApi.loanEligibility(formData);
            setResult(data);
        } catch (err) {
            console.error(err);
            alert("Failed to check eligibility");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "number" ? Number(value) : value
        }));
    };

    return (
        <main className="relative z-10 pt-32 pb-24">
            <section className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
                    <div>
                        <span className="text-[#6605c7] font-bold text-[11px] tracking-[0.2em] uppercase mb-3 block">AI Tools</span>
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4">
                            Instant eligibility <br />
                            <span className="italic font-normal text-gray-400">check in minutes</span>
                        </h1>
                        <p className="text-gray-500 text-lg leading-relaxed mb-8">
                            Get an AI-powered pre-check for your education loan. We analyze your profile to estimate
                            eligibility, rate range, and next best steps.
                        </p>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/50 backdrop-blur-xl border border-gray-100 rounded-[2rem] p-8 shadow-sm">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Age</label>
                                <input name="age" type="number" value={formData.age} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-gray-100 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">CIBIL Score</label>
                                <input name="credit" type="number" value={formData.credit} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-gray-100 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Annual Income (₹)</label>
                                <input name="income" type="number" value={formData.income} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-gray-100 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loan Amount (₹)</label>
                                <input name="loan" type="number" value={formData.loan} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-gray-100 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Employment</label>
                                <select name="employment" value={formData.employment} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-gray-100 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900">
                                    <option value="employed">Employed</option>
                                    <option value="self">Self-employed</option>
                                    <option value="student">Student</option>
                                    <option value="unemployed">Unemployed</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Study Level</label>
                                <select name="study" value={formData.study} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-gray-100 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900">
                                    <option value="undergrad">Undergraduate</option>
                                    <option value="masters">Masters</option>
                                    <option value="doctoral">Doctoral</option>
                                    <option value="diploma">Diploma</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Co-applicant</label>
                                <select name="coApplicant" value={formData.coApplicant} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-gray-100 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900">
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Collateral</label>
                                <select name="collateral" value={formData.collateral} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border-gray-100 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900">
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                            </div>
                            <div className="md:col-span-2 mt-4">
                                <button type="submit" disabled={loading} className="w-full py-4 bg-[#6605c7] text-white rounded-full font-bold uppercase tracking-widest text-xs hover:scale-[1.02] shadow-xl transition-all disabled:opacity-50">
                                    {loading ? "Checking..." : "Check Eligibility"}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="sticky top-32 bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[2.5rem] p-10 shadow-xl">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-display font-bold text-gray-900">Eligibility Snapshot</h3>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full ${!result ? "bg-gray-100 text-gray-400" : "bg-green-50 text-green-600"}`}>
                                {!result ? "Awaiting Input" : result.eligibility?.status}
                            </span>
                        </div>

                        {!result ? (
                            <div className="text-center py-10">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                                    <span className="material-symbols-outlined text-4xl">analytics</span>
                                </div>
                                <p className="text-gray-400 font-medium">Complete the form to see your<br />personalized eligibility score.</p>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-fade-in-up">
                                <div>
                                    <div className="flex items-center justify-between text-sm mb-3">
                                        <span className="font-bold text-gray-400 uppercase tracking-wider">Score</span>
                                        <span className="font-bold text-[#6605c7] text-lg">{result.eligibility?.score} / 100</span>
                                    </div>
                                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-[#6605c7] to-purple-400 transition-all duration-1000" style={{ width: `${result.eligibility?.score}%` }}></div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-gray-900 font-bold text-lg">{result.eligibility?.summary}</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Rate Range</span>
                                            <span className="font-bold text-[#6605c7]">{result.eligibility?.rateRange}</span>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Coverage</span>
                                            <span className="font-bold text-[#6605c7]">{result.eligibility?.coverage}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recommendations</h4>
                                    <ul className="space-y-2">
                                        {result.eligibility?.recommendations?.map((rec: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                                <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                                                {rec}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="p-6 bg-[#6605c7]/5 rounded-3xl border border-[#6605c7]/10">
                                    <h4 className="text-[10px] font-bold text-[#6605c7] uppercase tracking-widest mb-4">Top Match</h4>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="font-bold text-gray-900">{result.recommendations?.primary?.offer?.bank}</div>
                                        <div className="text-xs font-bold text-[#6605c7] bg-white px-3 py-1 rounded-full border border-[#6605c7]/10 shadow-sm">{result.recommendations?.primary?.fit}% Fit</div>
                                    </div>
                                    <div className="text-xs text-gray-500 mb-4">{result.recommendations?.primary?.offer?.name}</div>
                                    <a href="/apply-loan" className="block w-full py-3 bg-[#6605c7] text-white text-center rounded-xl font-bold text-[10px] uppercase tracking-widest hover:shadow-lg transition-all">Apply Now</a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}
