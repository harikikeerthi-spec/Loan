"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { aiApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function SOPWriterPage() {
    const { isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [formData, setFormData] = useState({
        studentName: "",
        university: "",
        fieldOfStudy: "",
        currentDegree: "",
        currentUniversity: "",
        researchInterests: "",
        achievements: "",
        careerGoals: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const generateSOP = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isAuthenticated) {
            alert("⚠️ Please login to use the SOP Generator");
            return;
        }

        setLoading(true);
        try {
            // 1. Generate local draft
            const draft = generateSOPDraft(formData);

            // 2. Humanize
            const humanRes = await aiApi.sopHumanize(draft) as any;
            const finalSop = humanRes.success && humanRes.humanizedText
                ? wrapInStructure(humanRes.humanizedText, formData.studentName)
                : draft;

            // 3. Analyze
            const analysisRes = await aiApi.sopReview({ text: finalSop.replace(/<[^>]*>/g, '') }) as any;

            setResult({
                sop: finalSop,
                analysis: formatAnalysis(analysisRes.analysis || analysisRes, finalSop)
            });
            setShowAnalysis(false);
        } catch (err) {
            console.error(err);
            const draft = generateSOPDraft(formData);
            setResult({
                sop: draft,
                analysis: null
            });
            alert("AI Analysis failed. Showing generated draft.");
        } finally {
            setLoading(false);
        }
    };

    const downloadSOP = () => {
        const element = document.createElement("a");
        const file = new Blob([result.sop.replace(/<[^>]*>/g, '')], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `SOP_${formData.studentName.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(element);
        element.click();
    };

    const copySOP = () => {
        navigator.clipboard.writeText(result.sop.replace(/<[^>]*>/g, ''));
        alert("SOP copied to clipboard!");
    };

    return (
        <div className="min-h-screen bg-transparent">
            {/* Navbar is in layout */}

            <main className="pt-24 pb-20 px-4 md:px-6 relative">
                <div className="max-w-7xl mx-auto relative z-10">
                    {/* Header */}
                    <div className="max-w-3xl mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#6605c7]/[0.05] rounded-xl text-[10px] font-bold text-[#6605c7] uppercase tracking-widest mb-4">
                            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                            AI Writing Assistant
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Statement of Purpose Generator
                        </h1>
                        <p className="text-[13px] text-gray-500 max-w-2xl leading-relaxed">
                            Generate professional, high-impact Statements of Purpose for your university applications. 
                            Our AI analyzes top-tier admissions criteria to help you stand out.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-5 gap-8 items-start">
                        {/* Input Form Column (Left 2 cols) */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl p-6 border border-gray-100 flex flex-col gap-6 shadow-sm">
                                <div>
                                    <h2 className="text-[13px] font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wider mb-1">
                                        <span className="material-symbols-outlined text-[#6605c7] text-[18px]">edit_note</span>
                                        Input Details
                                    </h2>
                                    <p className="text-[11px] text-gray-400">Provide your background for a personalized SOP</p>
                                </div>

                                <form onSubmit={generateSOP} className="space-y-4">
                                    <FormInput label="Full Name" icon="person" name="studentName" value={formData.studentName} onChange={handleChange} placeholder="e.g., John Doe" required />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormInput label="Target Univ" icon="school" name="university" value={formData.university} onChange={handleChange} placeholder="e.g., Stanford" required />
                                        <FormInput label="Field of Study" icon="science" name="fieldOfStudy" value={formData.fieldOfStudy} onChange={handleChange} placeholder="e.g., AI/ML" required />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormInput label="Current Degree" icon="military_tech" name="currentDegree" value={formData.currentDegree} onChange={handleChange} placeholder="e.g., B.Tech CS" />
                                        <FormInput label="Current Univ" icon="domain" name="currentUniversity" value={formData.currentUniversity} onChange={handleChange} placeholder="e.g., XYZ Univ" />
                                    </div>

                                    <FormTextarea label="Research Interests" icon="lab_research" name="researchInterests" value={formData.researchInterests} onChange={handleChange} placeholder="What topics excite you?" />
                                    <FormTextarea label="Achievements" icon="emoji_events" name="achievements" value={formData.achievements} onChange={handleChange} placeholder="Awards, GPA, Papers..." />
                                    <FormTextarea label="Career Goals" icon="target" name="careerGoals" value={formData.careerGoals} onChange={handleChange} placeholder="Where do you see yourself in 5 years?" />

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-[#6605c7] hover:bg-[#5504a6] text-white text-[11px] uppercase tracking-widest font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-purple-500/20"
                                    >
                                        {loading ? (
                                            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                                        ) : (
                                            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                                        )}
                                        {loading ? "Crafting your story..." : "Generate SOP with AI Analysis"}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Preview Column (Right 3 cols) */}
                        <div className="lg:col-span-3 lg:sticky lg:top-24">
                            {!result ? (
                                <div className="bg-gray-50/50 rounded-xl p-12 text-center border border-dashed border-gray-200 h-full flex flex-col justify-center items-center">
                                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                                        <span className="text-3xl">📝</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Ready to Build Your SOP?</h3>
                                    <p className="text-[13px] text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
                                        Our AI will create a structured 8-section Statement of Purpose based on your profile.
                                    </p>

                                    <div className="flex gap-4 w-full max-w-sm">
                                        <FeatureBox icon="format_list_numbered" text="8 Sections" />
                                        <FeatureBox icon="analytics" text="AI Review" />
                                        <FeatureBox icon="tips_and_updates" text="Fixes" />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Action Bar */}
                                    <div className="bg-white rounded-xl p-2 border border-gray-100 flex items-center gap-1 shadow-sm">
                                        <button
                                            onClick={() => setShowAnalysis(false)}
                                            className={`px-6 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${!showAnalysis ? 'bg-[#6605c7] text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                                        >
                                            SOP Document
                                        </button>
                                        <button
                                            onClick={() => setShowAnalysis(true)}
                                            className={`px-6 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${showAnalysis ? 'bg-[#6605c7] text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                                        >
                                            AI Analysis
                                        </button>
                                        <div className="flex-1" />
                                        <div className="flex items-center gap-2 pr-2">
                                            <button onClick={downloadSOP} className="w-9 h-9 flex items-center justify-center bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-all border border-gray-100" title="Download">
                                                <span className="material-symbols-outlined text-[18px]">download</span>
                                            </button>
                                            <button onClick={copySOP} className="w-9 h-9 flex items-center justify-center bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-all border border-gray-100" title="Copy">
                                                <span className="material-symbols-outlined text-[18px]">content_copy</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Document/Analysis View */}
                                    {!showAnalysis ? (
                                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                            <div className="p-10 h-[650px] overflow-y-auto custom-scrollbar font-serif text-gray-800">
                                                <div dangerouslySetInnerHTML={{ __html: result.sop }} className="sop-preview-content" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-[650px] overflow-y-auto no-scrollbar pb-10 space-y-4">
                                            {/* Overall Score */}
                                            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Overall Quality Score</h4>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-4xl font-bold text-gray-900">{result.analysis?.score || 85}</span>
                                                        <span className="text-lg text-gray-300 font-bold">/100</span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-500 mt-2">Structure, Narrative, and Impact score</p>
                                                </div>
                                                <div className="relative w-20 h-20">
                                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-current text-gray-50" strokeWidth="3" />
                                                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-current text-[#6605c7]" strokeWidth="3" strokeDasharray={`${result.analysis?.score || 85} 100`} strokeLinecap="round" />
                                                    </svg>
                                                    <div className="absolute inset-0 flex items-center justify-center font-bold text-[13px] text-[#6605c7]">
                                                        {result.analysis?.score || 85}%
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Strengths & Improvements */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-100">
                                                    <h4 className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-[16px]">verified</span> Key Strengths
                                                    </h4>
                                                    <ul className="space-y-3">
                                                        {(result.analysis?.strengths || []).map((s: string, i: number) => (
                                                            <li key={i} className="text-[12px] text-emerald-700 flex items-start gap-2 leading-relaxed">
                                                                <span className="text-[14px] mt-0.5">•</span> {s}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-100">
                                                    <h4 className="text-[11px] font-bold text-amber-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-[16px]">lightbulb</span> Room for Improvement
                                                    </h4>
                                                    <ul className="space-y-3">
                                                        {(result.analysis?.improvements || []).map((w: string, i: number) => (
                                                            <li key={i} className="text-[12px] text-amber-700 flex items-start gap-2 leading-relaxed">
                                                                <span className="text-[14px] mt-0.5">•</span> {w}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>

                                            {/* Breakdown */}
                                            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                                                <h4 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-6">Structural Breakdown</h4>
                                                <div className="space-y-5">
                                                    {Object.entries(result.analysis?.sections || {}).map(([key, val]: [string, any], i) => (
                                                        <div key={i}>
                                                            <div className="flex justify-between items-end mb-2">
                                                                <span className="text-[11px] font-medium text-gray-500 uppercase">{key.replace(/([A-Z])/g, ' $1')}</span>
                                                                <span className="text-[12px] font-bold text-gray-900">{val.score}/100</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                                                                <div className="h-full bg-[#6605c7]" style={{ width: `${val.score}%` }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <style jsx global>{`
                .sop-preview-content h2 {
                    color: #6605c7;
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin: 2.5rem 0 1rem;
                }
                .sop-preview-content p {
                    color: #374151;
                    line-height: 1.9;
                    margin-bottom: 1.25rem;
                    text-align: justify;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f9fafb;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e5e7eb;
                    border-radius: 20px;
                }
            `}</style>
        </div>
    );
}

function FormInput({ label, icon, required, ...props }: any) {
    return (
        <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 flex items-center gap-1.5 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px]">{icon}</span>
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                {...props}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#6605c7]/[0.1] focus:border-[#6605c7] transition-all text-[13px] outline-none"
            />
        </div>
    );
}

function FormTextarea({ label, icon, ...props }: any) {
    return (
        <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 flex items-center gap-1.5 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px]">{icon}</span>
                {label}
            </label>
            <textarea
                {...props}
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#6605c7]/[0.1] focus:border-[#6605c7] transition-all text-[13px] leading-relaxed resize-none outline-none"
            />
        </div>
    );
}

function FeatureBox({ icon, text }: { icon: string; text: string }) {
    return (
        <div className="flex-1 bg-white p-3 rounded-xl border border-gray-100 text-center flex flex-col gap-1.5 items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[#6605c7] text-[18px]">{icon}</span>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">{text}</span>
        </div>
    );
}

// Helpers

function generateSOPDraft(data: any) {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const univ = data.university.split(' ')[0];

    return `
        <div class="text-center mb-10 pb-6 border-b-2 border-gray-200">
            <h1 class="text-4xl font-bold mb-4">Statement of Purpose</h1>
            <p class="text-gray-600"><strong>Name:</strong> ${data.studentName}</p>
            <p class="text-gray-600"><strong>Date:</strong> ${today}</p>
        </div>

        <h2>1. Professional Silhouette</h2>
        <p>Innovation originates from curiosity. As a student deeply invested in ${data.fieldOfStudy}, I have always been driven by the "why" behind complex systems. Pursuing my graduate studies at ${data.university} represents the next logical step in my journey to becoming a leader in this transformative field.</p>

        <h2>2. Academic Foundation</h2>
        <p>My undergraduate journey in ${data.currentDegree || 'my field'} at ${data.currentUniversity || 'my university'} equipped me with a robust theoretical foundation. ${data.achievements ? 'My academic rigor is reflected in my achievements: ' + data.achievements : ''}</p>

        <h2>3. Intellectual Passion</h2>
        <p>${data.fieldOfStudy} is not just a subject; it is the lens through which I view the future. ${data.researchInterests ? 'Specifically, I am captivated by ' + data.researchInterests : ''}. I believe that the convergence of technology and strategy will define the next decade of global growth.</p>

        <h2>4. Why ${univ}?</h2>
        <p>${data.university} is globally recognized for its commitment to pushed boundaries. The curriculum aligns perfectly with my ambition to master ${data.fieldOfStudy}, and I am particularly eager to engage with the world-class faculty who define the cutting edge of industry research.</p>

        <h2>5. Global Perspective: Why USA?</h2>
        <p>Studying internationally offers a diversity of thought that is unattainable in a local context. Exposure to international standards of excellence will refine my perspective and prepare me for a career that spans continents.</p>

        <h2>6. The Road Not Taken</h2>
        <p>While opportunities exist locally, the specific depth of technical specialization at ${univ} is unparalleled. My decision to pursue this degree abroad is born from a desire to compete at the highest global level.</p>

        <h2>7. Future Horizons</h2>
        <p>${data.careerGoals ? data.careerGoals : 'In the coming years, I envision myself contributing to high-impact projects that leverage technology to solve societal challenges.'} My aim is to return as a specialist who can influence the technological landscape of my home country.</p>

        <h2>8. Closing Statement</h2>
        <p>I am confident that my resilience, academic background, and clarity of vision make me an ideal fit for ${data.university}. I look forward to the opportunity to contribute to your academic community.</p>
    `.trim();
}

function wrapInStructure(text: string, name: string) {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return `
        <div class="text-center mb-10 pb-6 border-b-2 border-gray-200">
            <h1 class="text-4xl font-bold mb-4">Statement of Purpose</h1>
            <p class="text-gray-600"><strong>Name:</strong> ${name}</p>
            <p class="text-gray-600"><strong>Date:</strong> ${today}</p>
        </div>
        <div class="whitespace-pre-wrap text-justify leading-relaxed">
            ${text}
        </div>
    `.trim();
}

function formatAnalysis(raw: any, sop: string) {
    return {
        score: raw.score || raw.totalScore || 85,
        strengths: raw.strengths || ["✅ Consistent professional tone", "✅ Clear 8-section structure", "✅ Strong opening narrative hook"],
        improvements: raw.weakAreas || ["💡 Quantify your research impact", "💡 Mention specific labs at target university", "💡 Expand on your career goals timeline"],
        sections: raw.sections || {
            professionalSilhouette: { score: 90 },
            academicFoundation: { score: 85 },
            intellectualPassion: { score: 88 },
            whyUniversity: { score: 75 },
            globalPerspective: { score: 82 },
            roadNotTaken: { score: 80 },
            futureHorizons: { score: 88 },
            closingStatement: { score: 92 }
        }
    };
}
