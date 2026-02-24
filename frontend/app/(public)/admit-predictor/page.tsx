"use client";

import { useState } from "react";
import { aiApi } from "@/lib/api";

export default function AdmitPredictorPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [formData, setFormData] = useState({
        targetUniversity: "",
        programLevel: "Masters",
        gpa: "",
        gpaScale: "4",
        testScoreType: "GRE",
        testScore: "",
        englishTestType: "IELTS",
        englishTestScore: "",
        experienceYears: "0",
        researchPapers: "0"
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await aiApi.admitPredictor(formData) as any;
            setResult(res.prediction);
        } catch (err) {
            console.error(err);
            alert("Failed to predict admission chances");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <main className="relative z-10 pt-32 pb-24">
            <section className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <span className="text-[#6605c7] font-bold text-[11px] tracking-[0.2em] uppercase mb-3 block">AI-Powered Insights</span>
                    <h1 className="text-5xl md:text-6xl font-display font-medium text-gray-900 mb-6">
                        Admission <span className="italic text-gray-500">Predictor</span>
                    </h1>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
                        Estimate your chances of getting into your dream university. Our AI analyzes your profile against
                        historical data to provide a detailed probability score.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-10 items-start">
                    <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[2.5rem] p-10 shadow-xl">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="col-span-full space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Target University</label>
                                    <input name="targetUniversity" type="text" placeholder="e.g. Stanford University" required value={formData.targetUniversity} onChange={handleChange} className="w-full px-4 py-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900 placeholder:text-gray-300" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Program Level</label>
                                    <select name="programLevel" value={formData.programLevel} onChange={handleChange} className="w-full px-4 py-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900">
                                        <option value="Undergraduate">Undergraduate</option>
                                        <option value="Masters">Masters (MS/MA)</option>
                                        <option value="MBA">MBA</option>
                                        <option value="PhD">PhD</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">GPA ({formData.gpaScale}.0 Scale)</label>
                                    <div className="flex gap-4">
                                        <input name="gpa" type="number" step="0.01" placeholder="3.8" required value={formData.gpa} onChange={handleChange} className="flex-1 px-4 py-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900" />
                                        <select name="gpaScale" value={formData.gpaScale} onChange={handleChange} className="w-24 px-4 py-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900">
                                            <option value="4">4.0</option>
                                            <option value="10">10.0</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Standardized Test</label>
                                    <div className="flex gap-4">
                                        <select name="testScoreType" value={formData.testScoreType} onChange={handleChange} className="w-28 px-4 py-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900">
                                            <option value="None">None</option>
                                            <option value="GRE">GRE</option>
                                            <option value="GMAT">GMAT</option>
                                            <option value="SAT">SAT</option>
                                        </select>
                                        <input name="testScore" type="number" placeholder="Score" value={formData.testScore} onChange={handleChange} className="flex-1 px-4 py-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">English Proficiency</label>
                                    <div className="flex gap-4">
                                        <select name="englishTestType" value={formData.englishTestType} onChange={handleChange} className="w-28 px-4 py-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900">
                                            <option value="IELTS">IELTS</option>
                                            <option value="TOEFL">TOEFL</option>
                                            <option value="PTE">PTE</option>
                                        </select>
                                        <input name="englishTestScore" type="number" step="0.5" placeholder="7.5" value={formData.englishTestScore} onChange={handleChange} className="flex-1 px-4 py-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Work Exp (Years)</label>
                                    <input name="experienceYears" type="number" value={formData.experienceYears} onChange={handleChange} className="w-full px-4 py-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Research Papers</label>
                                    <input name="researchPapers" type="number" value={formData.researchPapers} onChange={handleChange} className="w-full px-4 py-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900" />
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full py-5 bg-[#6605c7] text-white rounded-full font-bold uppercase tracking-widest text-xs hover:scale-[1.02] shadow-xl transition-all disabled:opacity-50">
                                {loading ? "Analyzing Profile..." : "Predict Chance"}
                            </button>
                        </form>
                    </div>

                    <div className="sticky top-32">
                        {!result ? (
                            <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[2.5rem] p-12 text-center shadow-xl">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                                    <span className="material-symbols-outlined text-4xl">query_stats</span>
                                </div>
                                <h3 className="text-xl font-display font-bold text-gray-900 mb-2">Ready to crunch numbers</h3>
                                <p className="text-gray-400 text-sm">Fill out your profile details to see your<br />admission chances.</p>
                            </div>
                        ) : (
                            <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[2.5rem] p-10 shadow-xl space-y-8 animate-fade-in-up">
                                <div className="text-center">
                                    <h3 className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-6">Admission Probability</h3>
                                    <div className="relative inline-flex items-center justify-center w-48 h-48 mx-auto">
                                        <svg className="transform -rotate-90 w-full h-full">
                                            <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
                                            <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={502.4} strokeDashoffset={502.4 - (result.probability / 100 * 502.4)} className="text-[#6605c7] transition-all duration-1000 ease-out" strokeLinecap="round" />
                                        </svg>
                                        <span className="absolute text-5xl font-bold text-gray-900">{result.probability}%</span>
                                    </div>
                                    <p className="text-2xl font-display font-bold text-gray-900 mt-6">{formData.targetUniversity}</p>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2 text-sm uppercase tracking-widest">Analysis & Feedback</h4>
                                    <ul className="space-y-4">
                                        {result.feedback?.map((item: string, i: number) => (
                                            <li key={i} className="flex items-start gap-4 text-sm text-gray-600">
                                                <span className="w-2 h-2 rounded-full bg-[#6605c7] mt-1.5 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="p-6 rounded-3xl bg-orange-50 border border-orange-100">
                                    <p className="text-xs text-orange-700 flex gap-3">
                                        <span className="material-symbols-outlined text-lg">info</span>
                                        <span>This prediction is based on historical data trends and is not an official guarantee.</span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}
