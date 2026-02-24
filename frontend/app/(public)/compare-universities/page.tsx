"use client";

import { useState } from "react";
import { aiApi } from "@/lib/api";

export default function CompareUniversitiesPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [formData, setFormData] = useState({
        uni1: "",
        uni2: "",
        program1: "",
        program2: ""
    });

    const handleCompare = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.uni1 || !formData.uni2) return;
        setLoading(true);
        try {
            const res = await aiApi.compareUniversities(formData.uni1, formData.uni2) as any;
            setResult(res.data);
        } catch (err) {
            console.error(err);
            alert("Failed to compare universities");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative z-10 pt-32 pb-24">
            <section className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <span className="text-[#6605c7] font-bold text-[11px] tracking-[0.2em] uppercase mb-4 block">University Selection</span>
                    <h1 className="text-5xl md:text-6xl font-display font-medium text-gray-900 mb-6">
                        Compare <span className="italic text-gray-500">Universities</span>
                    </h1>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
                        Make informed decisions for your global education. Compare global universities based on rankings, fees, scholarships, and more.
                    </p>
                </div>

                <form onSubmit={handleCompare} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                    <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[2rem] p-8 shadow-xl relative">
                        <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#6605c7] text-white rounded-full items-center justify-center font-bold text-xs shadow-lg z-10">VS</div>
                        <h3 className="text-lg font-bold text-gray-900 mb-6">University 1</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="University Name" value={formData.uni1} onChange={e => setFormData({ ...formData, uni1: e.target.value })} required className="w-full px-4 py-3 rounded-xl border-gray-100 bg-gray-50/50 focus:border-[#6605c7] transition-all font-bold text-gray-900" />
                            <input type="text" placeholder="Program (Optional)" value={formData.program1} onChange={e => setFormData({ ...formData, program1: e.target.value })} className="w-full px-4 py-3 rounded-xl border-gray-100 bg-gray-50/50 focus:border-[#6605c7] transition-all font-medium text-gray-600" />
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[2rem] p-8 shadow-xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">University 2</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="University Name" value={formData.uni2} onChange={e => setFormData({ ...formData, uni2: e.target.value })} required className="w-full px-4 py-3 rounded-xl border-gray-100 bg-gray-50/50 focus:border-[#6605c7] transition-all font-bold text-gray-900" />
                            <input type="text" placeholder="Program (Optional)" value={formData.program2} onChange={e => setFormData({ ...formData, program2: e.target.value })} className="w-full px-4 py-3 rounded-xl border-gray-100 bg-gray-50/50 focus:border-[#6605c7] transition-all font-medium text-gray-600" />
                        </div>
                    </div>

                    <div className="bg-[#6605c7] rounded-[2rem] p-8 text-white shadow-xl flex flex-col justify-center text-center">
                        <span className="material-symbols-outlined text-5xl mb-4">compare_arrows</span>
                        <h3 className="text-xl font-bold mb-4">Ready to Explore?</h3>
                        <p className="text-purple-100 text-sm mb-8">Get a detailed breakdown of rankings, fees, and career outcomes.</p>
                        <button type="submit" disabled={loading} className="w-full py-4 bg-white text-[#6605c7] rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-purple-50 transition-all shadow-xl disabled:opacity-50">
                            {loading ? "Comparing..." : "Compare Now"}
                        </button>
                    </div>
                </form>

                {result && (
                    <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[2.5rem] p-10 shadow-2xl animate-fade-in-up">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="py-6 px-4 text-left font-bold text-gray-400 uppercase tracking-widest text-[10px] w-1/4">Feature</th>
                                        <th className="py-6 px-4 text-center font-bold text-[#6605c7] text-xl w-1/3">{result.uni1.name}</th>
                                        <th className="py-6 px-4 text-center font-bold text-[#6605c7] text-xl w-1/3">{result.uni2.name}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {[
                                        { label: "Global Ranking", key: "rank" },
                                        { label: "Tuition (Annual)", key: "tuition" },
                                        { label: "Acceptance Rate", key: "rate" },
                                        { label: "Avg. Salary", key: "salary" },
                                        { label: "Location", key: "location" }
                                    ].map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-6 px-4 font-bold text-gray-600 text-sm">{row.label}</td>
                                            <td className="py-6 px-4 text-center font-medium text-gray-900">{result.uni1[row.key] || "N/A"}</td>
                                            <td className="py-6 px-4 text-center font-medium text-gray-900">{result.uni2[row.key] || "N/A"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}
