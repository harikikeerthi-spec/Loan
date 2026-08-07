"use client";

import { useState, useEffect } from "react";
import { aiApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";

export default function GradeConverterPage() {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
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

    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("pending_grade_converter_data");
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed.activeTab) setActiveTab(parsed.activeTab);
                    if (parsed.formData) setFormData(parsed.formData);
                    if (parsed.multipleData) setMultipleData(parsed.multipleData);
                } catch (e) {
                    console.error("Failed to restore saved grade converter data", e);
                }
                localStorage.removeItem("pending_grade_converter_data");
            }
        }
    }, []);

    const [singleError, setSingleError] = useState<string | null>(null);
    const [multipleError, setMultipleError] = useState<string | null>(null);

    // Reset input value and errors when input type changes
    const handleInputTypeChange = (newType: string) => {
        setFormData(prev => ({ ...prev, inputType: newType, inputValue: "" }));
        setSingleError(null);
    };

    // Helper for input type constraints
    const getInputConstraints = (type: string) => {
        switch (type) {
            case "percentage":
                return {
                    placeholder: "e.g. 85.5 (0 - 100%)",
                    maxLength: 6,
                    hint: "Enter percentage between 0 and 100",
                    validate: (val: string) => {
                        const num = parseFloat(val);
                        if (isNaN(num)) return "Please enter a valid percentage";
                        if (num < 0 || num > 100) return "Percentage must be between 0 and 100";
                        return null;
                    }
                };
            case "gpa":
                return {
                    placeholder: "e.g. 3.8 (0.0 - 4.0)",
                    maxLength: 4,
                    hint: "Enter GPA on 4.0 scale (0.0 - 4.0)",
                    validate: (val: string) => {
                        const num = parseFloat(val);
                        if (isNaN(num)) return "Please enter a valid GPA number";
                        if (num < 0 || num > 4.0) return "GPA must be between 0.0 and 4.0";
                        return null;
                    }
                };
            case "cgpa":
                return {
                    placeholder: "e.g. 8.5 (0.0 - 10.0)",
                    maxLength: 5,
                    hint: "Enter CGPA on 10.0 scale (0.0 - 10.0)",
                    validate: (val: string) => {
                        const num = parseFloat(val);
                        if (isNaN(num)) return "Please enter a valid CGPA number";
                        if (num < 0 || num > 10.0) return "CGPA must be between 0.0 and 10.0";
                        return null;
                    }
                };
            case "letterGrade":
                return {
                    placeholder: "e.g. A+, A, B, C",
                    maxLength: 3,
                    hint: "Enter letter grade (A+, A, A-, B+, B, B-, C+, C, C-, D, F)",
                    validate: (val: string) => {
                        const validGrades = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F", "S", "O", "E"];
                        if (!validGrades.includes(val.trim().toUpperCase())) {
                            return "Invalid letter grade (accepted: A+, A, A-, B+, B, B-, C+, C, C-, D, F, O, S, E)";
                        }
                        return null;
                    }
                };
            case "marks":
            default:
                return {
                    placeholder: "e.g. 85",
                    maxLength: 6,
                    hint: "Enter obtained marks",
                    validate: (val: string, totalMarksStr?: string) => {
                        const num = parseFloat(val);
                        if (isNaN(num) || num < 0) return "Please enter valid obtained marks";
                        if (totalMarksStr && totalMarksStr.trim()) {
                            const total = parseFloat(totalMarksStr);
                            if (!isNaN(total) && num > total) return `Obtained marks (${num}) cannot exceed Total Marks (${total})`;
                        }
                        return null;
                    }
                };
        }
    };

    const currentConstraints = getInputConstraints(formData.inputType);

    const handleSingleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSingleError(null);

        // Client validation
        const valErr = currentConstraints.validate(formData.inputValue, formData.totalMarks);
        if (valErr) {
            setSingleError(valErr);
            return;
        }

        if (formData.totalMarks && (isNaN(Number(formData.totalMarks)) || Number(formData.totalMarks) <= 0)) {
            setSingleError("Total Marks must be a positive number");
            return;
        }

        if (!isAuthenticated) {
            localStorage.setItem("pending_grade_converter_data", JSON.stringify({ activeTab, formData, multipleData }));
            alert("To view your grade conversion results and AI analysis, please login. You will be redirected to the login page.");
            router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
            return;
        }

        setLoading(true);
        try {
            const res = await aiApi.gradeConverter({
                ...formData,
                inputValue: formData.inputType === "letterGrade" ? formData.inputValue.trim().toUpperCase() : Number(formData.inputValue),
                totalMarks: formData.totalMarks ? Number(formData.totalMarks) : null
            }) as any;
            setResult(res.gradeConversion);
        } catch (err) {
            console.error(err);
            setSingleError(err instanceof Error ? err.message : "Failed to convert grade");
        } finally {
            setLoading(false);
        }
    };

    const handleMultipleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMultipleError(null);

        if (!multipleData.marks.trim()) {
            setMultipleError("Please enter marks separated by commas");
            return;
        }

        const totalPerSub = Number(multipleData.totalMarks);
        if (isNaN(totalPerSub) || totalPerSub <= 0) {
            setMultipleError("Total marks per subject must be a positive number");
            return;
        }

        const rawMarks = multipleData.marks.split(",").map(m => m.trim()).filter(m => m !== "");
        const parsedMarks: number[] = [];

        for (const m of rawMarks) {
            const num = Number(m);
            if (isNaN(num) || num < 0) {
                setMultipleError(`Invalid mark value '${m}'. Please enter valid numbers only.`);
                return;
            }
            if (num > totalPerSub) {
                setMultipleError(`Mark '${num}' exceeds Total Marks per subject (${totalPerSub})`);
                return;
            }
            parsedMarks.push(num);
        }

        if (parsedMarks.length === 0) {
            setMultipleError("Please enter at least one valid mark");
            return;
        }

        if (!isAuthenticated) {
            localStorage.setItem("pending_grade_converter_data", JSON.stringify({ activeTab, formData, multipleData }));
            alert("To view your grade conversion results and AI analysis, please login. You will be redirected to the login page.");
            router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
            return;
        }

        setLoading(true);
        try {
            const subjects = multipleData.subjects ? multipleData.subjects.split(",").map(s => s.trim()) : undefined;
            const res = await aiApi.gradeAnalyzer({
                marks: parsedMarks,
                totalMarks: totalPerSub,
                subjects
            }) as any;
            setResult(res.gradeAnalysis);
        } catch (err) {
            console.error(err);
            setMultipleError(err instanceof Error ? err.message : "Failed to analyze grades");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative z-10 pt-32 pb-24">
            <section className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <span className="text-[#6605c7] font-bold text-[11px] tracking-[0.2em] uppercase mb-3 block">Expert Tools</span>
                    <h1 className="text-3xl md:text-5xl font-display font-black text-gray-900 mb-6">
                        Grade <span className="italic text-[#6605c7]">Converter</span>
                    </h1>
                    <p className="text-gray-500 text-[13px] max-w-2xl mx-auto leading-relaxed">
                        Convert grades between different formats and grading systems worldwide with AI-powered analysis.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 bg-white p-8 border border-gray-100 rounded-xl shadow-xl">
                        <div className="flex gap-8 border-b border-gray-100 mb-10">
                            {["single", "multiple"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); setResult(null); }}
                                    className={`pb-4 text-[11px] font-bold uppercase tracking-widest transition-all relative ${activeTab === tab ? "text-[#6605c7]" : "text-gray-400 hover:text-gray-600"}`}
                                >
                                    {tab} Grade
                                    {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#6605c7] rounded-full" />}
                                </button>
                            ))}
                        </div>

                        {activeTab === "single" ? (
                            <form onSubmit={handleSingleSubmit} className="space-y-6">
                                {singleError && (
                                    <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-2">
                                        <span className="material-symbols-outlined text-base">error</span>
                                        {singleError}
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Input Type</label>
                                        <select
                                            value={formData.inputType}
                                            onChange={e => handleInputTypeChange(e.target.value)}
                                            className="w-full px-4 py-3.5 rounded-xl border border-gray-100 bg-gray-50/50 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900 text-sm outline-none cursor-pointer"
                                        >
                                            <option value="percentage">Percentage (0 - 100%)</option>
                                            <option value="gpa">GPA (4.0 Scale)</option>
                                            <option value="cgpa">CGPA (10.0 Scale)</option>
                                            <option value="marks">Raw Marks</option>
                                            <option value="letterGrade">Letter Grade (A+, A, B...)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Output Type</label>
                                        <select
                                            value={formData.outputType}
                                            onChange={e => setFormData({ ...formData, outputType: e.target.value })}
                                            className="w-full px-4 py-3.5 rounded-xl border border-gray-100 bg-gray-50/50 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900 text-sm outline-none cursor-pointer"
                                        >
                                            <option value="percentage">Percentage</option>
                                            <option value="gpa">GPA (4.0)</option>
                                            <option value="cgpa">CGPA (10.0)</option>
                                            <option value="letterGrade">Letter Grade</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Input Value</label>
                                            <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                                                Max {currentConstraints.maxLength} chars
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.inputValue}
                                            onChange={e => setFormData({ ...formData, inputValue: e.target.value })}
                                            maxLength={currentConstraints.maxLength}
                                            required
                                            placeholder={currentConstraints.placeholder}
                                            className="w-full px-4 py-3.5 rounded-xl border border-gray-100 bg-gray-50/50 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900 text-sm"
                                        />
                                        <p className="text-[10px] text-gray-400 font-medium ml-1">{currentConstraints.hint}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Marks (Optional)</label>
                                        <input
                                            type="number"
                                            value={formData.totalMarks}
                                            onChange={e => setFormData({ ...formData, totalMarks: e.target.value })}
                                            maxLength={6}
                                            placeholder="100"
                                            className="w-full px-4 py-3.5 rounded-xl border border-gray-100 bg-gray-50/50 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900 text-sm"
                                        />
                                        <p className="text-[10px] text-gray-400 font-medium ml-1">Max 6 digits (e.g. 100, 1000)</p>
                                    </div>
                                    <div className="col-span-full space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Grading System</label>
                                        <select
                                            value={formData.gradingSystem}
                                            onChange={e => setFormData({ ...formData, gradingSystem: e.target.value })}
                                            className="w-full px-4 py-3.5 rounded-xl border border-gray-100 bg-gray-50/50 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900 text-sm outline-none cursor-pointer"
                                        >
                                            <option value="US">US System</option>
                                            <option value="UK">UK System</option>
                                            <option value="India">India System</option>
                                            <option value="Canada">Canada System</option>
                                            <option value="Australia">Australia System</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="w-full py-4 bg-[#6605c7] text-white rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-[#5504a6] transition-all shadow-lg shadow-purple-500/10 disabled:opacity-50 mt-4">
                                    {loading ? "Converting..." : "Convert Grade"}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleMultipleSubmit} className="space-y-6">
                                {multipleError && (
                                    <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-2">
                                        <span className="material-symbols-outlined text-base">error</span>
                                        {multipleError}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Marks (Comma Separated)</label>
                                        <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                                            {multipleData.marks.length}/200
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        value={multipleData.marks}
                                        onChange={e => setMultipleData({ ...multipleData, marks: e.target.value })}
                                        maxLength={200}
                                        required
                                        placeholder="e.g. 85, 92, 78, 88"
                                        className="w-full px-4 py-3.5 rounded-xl border border-gray-100 bg-gray-50/50 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900 text-sm"
                                    />
                                    <p className="text-[10px] text-gray-400 font-medium ml-1">Enter marks separated by commas</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Marks Per Subject</label>
                                        <input
                                            type="number"
                                            value={multipleData.totalMarks}
                                            onChange={e => setMultipleData({ ...multipleData, totalMarks: e.target.value })}
                                            maxLength={5}
                                            required
                                            className="w-full px-4 py-3.5 rounded-xl border border-gray-100 bg-gray-50/50 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900 text-sm"
                                        />
                                        <p className="text-[10px] text-gray-400 font-medium ml-1">Max 5 digits (e.g. 100)</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Subjects (Optional)</label>
                                            <span className="text-[9px] font-bold text-gray-400">
                                                {multipleData.subjects.length}/150
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            value={multipleData.subjects}
                                            onChange={e => setMultipleData({ ...multipleData, subjects: e.target.value })}
                                            maxLength={150}
                                            placeholder="e.g. Math, Physics, CS"
                                            className="w-full px-4 py-3.5 rounded-xl border border-gray-100 bg-gray-50/50 focus:border-[#6605c7] focus:ring-0 transition-all font-bold text-gray-900 text-sm"
                                        />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="w-full py-4 bg-[#6605c7] text-white rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-[#5504a6] shadow-lg shadow-purple-500/10 transition-all disabled:opacity-50">
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
