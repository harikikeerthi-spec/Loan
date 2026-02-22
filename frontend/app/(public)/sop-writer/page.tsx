"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { aiApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

const sopTypes = ["MS/ME – Engineering", "MBA – Business Management", "MS – Computer Science", "MS – Data Science", "MBA – International", "Other"];

interface SopResult {
    sop?: string;
    text?: string;
    feedback?: string;
}

export default function SopWriterPage() {
    const { isAuthenticated } = useAuth();
    const [formData, setFormData] = useState({
        sopType: "",
        university: "",
        course: "",
        background: "",
        experience: "",
        goals: "",
        achievements: "",
        whyUniversity: "",
    });
    const [result, setResult] = useState<SopResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const update = (field: string, value: string) =>
        setFormData((p) => ({ ...p, [field]: value }));

    const handleGenerate = async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        setError("");
        try {
            const data = await aiApi.sopReview(formData) as SopResult;
            setResult(data);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to generate SOP");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        const text = result?.sop || result?.text || "";
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="min-h-screen bg-transparent">
            <Navbar />
            <div className="pt-28 pb-16 px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 text-pink-500 text-sm font-bold mb-4">
                            <span className="material-symbols-outlined text-lg">auto_fix_high</span>
                            AI-Powered
                        </span>
                        <h1 className="text-4xl md:text-5xl font-bold font-display text-gray-900 dark:text-white mb-4">
                            AI SOP Writer
                        </h1>
                        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                            Generate a professionally-written Statement of Purpose tailored to your university and course in seconds.
                        </p>
                    </div>

                    {!isAuthenticated ? (
                        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700">
                            <span className="material-symbols-outlined text-6xl text-[#6605c7] block mb-4">lock</span>
                            <h3 className="text-xl font-bold dark:text-white mb-2">Login Required</h3>
                            <p className="text-gray-500 mb-6">Sign in to use the AI SOP Writer</p>
                            <Link href="/login?redirect=/sop-writer" className="px-8 py-3 bg-[#6605c7] text-white font-bold rounded-xl">
                                Login to Continue
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Form */}
                            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-slate-700">
                                <h2 className="text-xl font-bold dark:text-white mb-6">Your Details</h2>
                                <div className="space-y-5">
                                    <div>
                                        <label className="text-sm font-bold dark:text-gray-300 block mb-2">SOP Type</label>
                                        <select
                                            value={formData.sopType}
                                            onChange={(e) => update("sopType", e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6605c7]"
                                        >
                                            <option value="">Select program type</option>
                                            {sopTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    {[
                                        { key: "university", label: "Target University", placeholder: "e.g. University of Toronto" },
                                        { key: "course", label: "Specific Course", placeholder: "e.g. MS Computer Science" },
                                        { key: "background", label: "Academic Background", placeholder: "Your degrees, GPA, CGPA..." },
                                        { key: "experience", label: "Work/Research Experience", placeholder: "Internships, projects, research..." },
                                        { key: "goals", label: "Career Goals", placeholder: "What do you aspire to achieve..." },
                                        { key: "achievements", label: "Key Achievements", placeholder: "Awards, publications, certifications..." },
                                        { key: "whyUniversity", label: "Why This University?", placeholder: "Specific reasons: faculty, programs..." },
                                    ].map(({ key, label, placeholder }) => (
                                        <div key={key}>
                                            <label className="text-sm font-bold dark:text-gray-300 block mb-2">{label}</label>
                                            <textarea
                                                value={formData[key as keyof typeof formData]}
                                                onChange={(e) => update(key, e.target.value)}
                                                placeholder={placeholder}
                                                rows={2}
                                                className="w-full px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6605c7] resize-none"
                                            />
                                        </div>
                                    ))}

                                    {error && (
                                        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
                                    )}

                                    <button
                                        onClick={handleGenerate}
                                        disabled={loading || !formData.sopType}
                                        className="w-full py-4 bg-gradient-to-r from-pink-500 to-[#6605c7] text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                        ) : (
                                            <span className="material-symbols-outlined">auto_fix_high</span>
                                        )}
                                        {loading ? "Generating..." : "Generate SOP"}
                                    </button>
                                </div>
                            </div>

                            {/* Result */}
                            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold dark:text-white">Generated SOP</h2>
                                    {result && (
                                        <button onClick={copyToClipboard} className="flex items-center gap-1 text-xs text-[#6605c7] font-bold hover:underline">
                                            <span className="material-symbols-outlined text-sm">content_copy</span> Copy
                                        </button>
                                    )}
                                </div>
                                {loading ? (
                                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                                        <div className="w-16 h-16 border-4 border-[#6605c7]/20 border-t-[#6605c7] rounded-full animate-spin" />
                                        <p className="text-gray-400 text-sm">Our AI is crafting your SOP...</p>
                                    </div>
                                ) : result ? (
                                    <div className="flex-1 overflow-auto">
                                        <div className="prose dark:prose-invert prose-sm max-w-none whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                                            {result.sop || result.text || JSON.stringify(result)}
                                        </div>
                                        {result.feedback && (
                                            <div className="mt-6 p-4 bg-[#6605c7]/5 border border-[#6605c7]/10 rounded-xl">
                                                <h4 className="font-bold text-[#6605c7] mb-2 text-sm">AI Feedback</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{result.feedback}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                                        <span className="material-symbols-outlined text-6xl text-gray-200 block mb-4">description</span>
                                        <p className="text-gray-400">Fill in your details and click Generate to create your personalized SOP</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}
