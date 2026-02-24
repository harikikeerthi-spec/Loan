"use client";

import { useState } from "react";
import { aiApi } from "@/lib/api";

export default function GradeConverterPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [activeTab, setActiveTab] = useState("single");
    const [formData, setFormData] = useState({
        inputType: "percentage",
        inputValue: "",
        totalMarks: "",
        outputType: "gpa",
        gradingSystem: "US"
    });

    const [multipleData, setMultipleData] = useState({
        marks: "",
        totalMarks: "100",
        subjects: ""
    });

    const handleSingleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await aiApi.gradeConverter({
                ...formData,
                inputValue: Number(formData.inputValue),
                totalMarks: formData.totalMarks ? Number(formData.totalMarks) : null
            }) as any;
            setResult(res.gradeConversion);
        } catch (err) {
            console.error(err);
            alert("Failed to convert grade");
        } finally {
            setLoading(false);
        }
    };

    const handleMultipleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const marks = multipleData.marks.split(",").map(m => Number(m.trim())).filter(m => !isNaN(m));
            const subjects = multipleData.subjects ? multipleData.subjects.split(",").map(s => s.trim()) : undefined;
            const res = await aiApi.gradeAnalyzer({
                marks,
                totalMarks: Number(multipleData.totalMarks),
                subjects
            }) as any;
            setResult(res.gradeAnalysis);
        } catch (err) {
            console.error(err);
            alert("Failed to analyze grades");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative z-10 pt-32 pb-24">
            <section className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <span className="text-[#6605c7] font-bold text-[11px] tracking-[0.2em] uppercase mb-3 block">Expert Tools</span>
                    <h1 className="text-5xl md:text-6xl font-display font-medium text-gray-900 mb-6">
                        Grade <span className="italic text-gray-500">Converter</span>
                    </h1>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
                        Convert grades between different formats and grading systems worldwide with AI-powered analysis.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[2.5rem] p-10 shadow-xl">
                        <div className="flex gap-8 border-b border-gray-100 mb-10">
                            {["single", "multiple"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); setResult(null); }}
                                    className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === tab ? "text-[#6605c7]" : "text-gray-400 hover:text-gray-600"}`}
                                >
                                    {tab} Grade
                                    {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#6605c7] rounded-full" />}
                                </button>
                            ))}
                        </div>

                        {activeTab === "single" ? (
                            <form onSubmit={handleSingleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Input Type</label>
                                        <select value={formData.inputType} onChange={e => setFormData({ ...formData, inputType: e.target.value })} className="w-full px-4 py-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900">
                                            <option value="marks">Marks</option>
                                            <option value="percentage">Percentage</option>
                                            <option value="gpa">GPA (4.0)</option>
                                            <option value="cgpa">CGPA (10.0)</option>
                                            <option value="letterGrade">Letter Grade</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Output Type</label>
                                        <select value={formData.outputType} onChange={e => setFormData({ ...formData, outputType: e.target.value })} className="w-full px-4 py-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900">
                                            <option value="percentage">Percentage</option>
                                            <option value="gpa">GPA (4.0)</option>
                                            <option value="cgpa">CGPA (10.0)</option>
                                            <option value="letterGrade">Letter Grade</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Input Value</label>
                                        <input type="text" value={formData.inputValue} onChange={e => setFormData({ ...formData, inputValue: e.target.value })} required placeholder="e.g. 85" className="w-full px-4 py-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Marks (Optional)</label>
                                        <input type="number" value={formData.totalMarks} onChange={e => setFormData({ ...formData, totalMarks: e.target.value })} placeholder="100" className="w-full px-4 py-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900" />
                                    </div>
                                    <div className="col-span-full space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Grading System</label>
                                        <select value={formData.gradingSystem} onChange={e => setFormData({ ...formData, gradingSystem: e.target.value })} className="w-full px-4 py-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900">
                                            <option value="US">US System</option>
                                            <option value="UK">UK System</option>
                                            <option value="India">India System</option>
                                            <option value="Canada">Canada System</option>
                                            <option value="Australia">Australia System</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="w-full py-5 bg-[#6605c7] text-white rounded-full font-bold uppercase tracking-widest text-xs hover:scale-[1.02] shadow-xl transition-all disabled:opacity-50">
                                    {loading ? "Converting..." : "Convert Grade"}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleMultipleSubmit} className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Marks (Comma Separated)</label>
                                    <input type="text" value={multipleData.marks} onChange={e => setMultipleData({ ...multipleData, marks: e.target.value })} required placeholder="e.g. 85, 92, 78, 88" className="w-full px-4 py-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Marks Per Subject</label>
                                        <input type="number" value={multipleData.totalMarks} onChange={e => setMultipleData({ ...multipleData, totalMarks: e.target.value })} required className="w-full px-4 py-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Subjects (Optional)</label>
                                        <input type="text" value={multipleData.subjects} onChange={e => setMultipleData({ ...multipleData, subjects: e.target.value })} placeholder="e.g. Math, Physics, CS" className="w-full px-4 py-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900" />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="w-full py-5 bg-[#6605c7] text-white rounded-full font-bold uppercase tracking-widest text-xs hover:scale-[1.02] shadow-xl transition-all disabled:opacity-50">
                                    {loading ? "Analyzing..." : "Analyze Grades"}
                                </button>
                            </form>
                        )}
                    </div>

                    <div className="sticky top-32">
                        {!result ? (
                            <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[2.5rem] p-12 text-center shadow-xl">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                                    <span className="material-symbols-outlined text-4xl">grade</span>
                                </div>
                                <h3 className="text-xl font-display font-bold text-gray-900 mb-2">Results</h3>
                                <p className="text-gray-400 text-sm">Enter your grades to see<br />detailed conversion and analysis.</p>
                            </div>
                        ) : (
                            <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[2.5rem] p-10 shadow-xl space-y-8 animate-fade-in-up">
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: "Percentage", value: `${result.percentage?.toFixed(1)}%`, bg: "bg-blue-50", text: "text-blue-600" },
                                        { label: "GPA (4.0)", value: result.gpa?.toFixed(2) || result.letterGrade, bg: "bg-green-50", text: "text-green-600" },
                                        { label: "CGPA (10.0)", value: result.cgpa?.toFixed(1) || result.classification, bg: "bg-purple-50", text: "text-purple-600" },
                                        { label: "Classification", value: result.classification || "Good", bg: "bg-amber-50", text: "text-amber-600" }
                                    ].map((item, i) => (
                                        <div key={i} className={`${item.bg} p-4 rounded-2xl border border-gray-100`}>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">{item.label}</span>
                                            <span className={`font-bold text-lg ${item.text}`}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>

                                {result.analysis && (
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2 text-sm uppercase tracking-widest">AI Analysis</h4>
                                        <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                                            {result.analysis.strength && <p><strong className="text-gray-900">Strength:</strong> {result.analysis.strength}</p>}
                                            {result.analysis.scholarshipEligibility && <p><strong className="text-gray-900">Scholarship:</strong> {result.analysis.scholarshipEligibility}</p>}
                                            {result.analysis.recommendations && (
                                                <div className="space-y-2">
                                                    <strong className="text-gray-900">Next Steps:</strong>
                                                    <ul className="space-y-2">
                                                        {result.analysis.recommendations.map((rec: string, i: number) => (
                                                            <li key={i} className="flex gap-2">
                                                                <span className="text-[#6605c7]">•</span>
                                                                {rec}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}
