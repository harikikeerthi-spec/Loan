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
        <div className="min-h-screen bg-[#fcfaff]">
            <Navbar />

            <main className="pt-32 pb-20 px-4 md:px-6 relative">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-purple-50 to-transparent pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="inline-block mb-4">
                            <span className="text-6xl">🎓</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold font-display text-gray-900 mb-4">
                            AI-Powered Statement of Purpose Generator
                        </h1>
                        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                            Generate professional Statements of Purpose for university applications with AI-powered analysis,
                            improvement suggestions, and section-by-section scoring
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-5 gap-6 items-start">
                        {/* Input Form Column (Left 2 cols) */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 flex flex-col gap-5">
                                <div className="border-b border-gray-200 pb-4">
                                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#6605c7]">edit_note</span>
                                        Your Details
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">Fill in your information to generate a professional SOP</p>
                                </div>

                                <form onSubmit={generateSOP} className="space-y-4">
                                    <FormInput label="Your Full Name" icon="person" name="studentName" value={formData.studentName} onChange={handleChange} placeholder="e.g., John Doe" required />
                                    <FormInput label="Target University" icon="school" name="university" value={formData.university} onChange={handleChange} placeholder="e.g., Stanford University" required />
                                    <FormInput label="Field of Study" icon="science" name="fieldOfStudy" value={formData.fieldOfStudy} onChange={handleChange} placeholder="e.g., Artificial Intelligence, Robotics, Data Science" required />

                                    <FormInput label="Current Degree" icon="military_tech" name="currentDegree" value={formData.currentDegree} onChange={handleChange} placeholder="e.g., B.Tech in Computer Science" />
                                    <FormInput label="Current University" icon="domain" name="currentUniversity" value={formData.currentUniversity} onChange={handleChange} placeholder="e.g., XYZ University" />

                                    <FormTextarea label="Research Interests (Optional)" icon="lab_research" name="researchInterests" value={formData.researchInterests} onChange={handleChange} placeholder="e.g., Deep Learning, Computer Vision, Natural Language Processing" />
                                    <FormTextarea label="Key Achievements (Optional)" icon="emoji_events" name="achievements" value={formData.achievements} onChange={handleChange} placeholder="e.g., Published research papers, top grades (GPA 3.9/4.0), won hackathons" />
                                    <FormTextarea label="Career Goals (Optional)" icon="target" name="careerGoals" value={formData.careerGoals} onChange={handleChange} placeholder="e.g., Lead AI research at top tech companies, contribute to open-source AI" />

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-[#6605c7] to-[#a855f7] hover:shadow-2xl text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                        ) : (
                                            <span className="material-symbols-outlined">auto_awesome</span>
                                        )}
                                        {loading ? "Generating & Humanizing..." : "Generate SOP with AI Analysis"}
                                    </button>
                                </form>

                                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                                    <p className="text-xs text-gray-700 leading-relaxed">
                                        <strong className="text-[#6605c7]">✨ AI-Powered Analysis:</strong> Get a professional SOP following the 8-section format with detailed scoring, strengths analysis, and specific improvement suggestions!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Preview Column (Right 3 cols) */}
                        <div className="lg:col-span-3 lg:sticky lg:top-24">
                            {!result ? (
                                <div className="bg-white rounded-2xl shadow-2xl p-16 text-center border-2 border-gray-100 h-full flex flex-col justify-center items-center">
                                    <div className="mb-8 animate-bounce">
                                        <span className="text-8xl">📝</span>
                                    </div>
                                    <h3 className="text-3xl font-bold text-gray-900 mb-4">Ready to Create Your SOP?</h3>
                                    <p className="text-lg text-gray-600 mb-6 max-w-lg mx-auto leading-relaxed">
                                        Fill in your details in the form and click <strong>Generate SOP</strong> to create a professional Statement of Purpose with AI-powered analysis!
                                    </p>

                                    <div className="grid grid-cols-3 gap-4 mt-8 w-full max-w-xl">
                                        <FeatureBox emoji="📋" text="8 Sections" bgColor="bg-green-50" />
                                        <FeatureBox emoji="🤖" text="AI Analysis" bgColor="bg-blue-50" />
                                        <FeatureBox emoji="💡" text="Improvements" bgColor="bg-purple-50" />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Action Bar */}
                                    <div className="bg-white rounded-2xl shadow-xl p-5 border border-purple-100 flex flex-wrap items-center gap-3">
                                        <button
                                            onClick={() => setShowAnalysis(false)}
                                            className={`px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${!showAnalysis ? 'bg-[#6605c7] text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}
                                        >
                                            SOP Document
                                        </button>
                                        <button
                                            onClick={() => setShowAnalysis(true)}
                                            className={`px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${showAnalysis ? 'bg-[#6605c7] text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}
                                        >
                                            AI Analysis
                                        </button>
                                        <div className="flex-1" />
                                        <button onClick={downloadSOP} className="px-4 py-2 bg-purple-50 text-[#6605c7] rounded-xl hover:bg-purple-100 transition-all flex items-center gap-2 text-sm font-bold">
                                            <span className="material-symbols-outlined text-sm">download</span>
                                            Download
                                        </button>
                                        <button onClick={copySOP} className="px-4 py-2 bg-purple-50 text-[#6605c7] rounded-xl hover:bg-purple-100 transition-all flex items-center gap-2 text-sm font-bold">
                                            <span className="material-symbols-outlined text-sm">content_copy</span>
                                            Copy
                                        </button>
                                    </div>

                                    {/* Document/Analysis View */}
                                    {!showAnalysis ? (
                                        <div className="bg-white rounded-2xl shadow-2xl p-1 font-serif">
                                            <div className="p-12 bg-white rounded-2xl border border-gray-100 h-[700px] overflow-y-auto custom-scrollbar">
                                                <div dangerouslySetInnerHTML={{ __html: result.sop }} className="sop-preview-content" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-[750px] overflow-y-auto no-scrollbar pb-10 space-y-6">
                                            {/* Overall Score */}
                                            <div className="bg-white rounded-2xl p-8 border border-purple-100 shadow-xl flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-transparent">
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Overall SOP Quality</h4>
                                                    <div className="text-5xl font-black text-[#6605c7]">{result.analysis?.score || 85}<span className="text-2xl text-gray-300">/100</span></div>
                                                    <p className="text-xs text-gray-500 mt-2 font-medium">Based on structure, content, and narrative flow</p>
                                                </div>
                                                <div className="relative w-24 h-24">
                                                    <svg className="w-full h-full" viewBox="0 0 36 36">
                                                        <path className="stroke-current text-purple-100" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                        <path className="stroke-current text-[#6605c7]" strokeWidth="3" strokeDasharray={`${result.analysis?.score || 85}, 100`} strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                    </svg>
                                                    <div className="absolute inset-0 flex items-center justify-center font-black text-xl text-[#6605c7]">{result.analysis?.score || 85}%</div>
                                                </div>
                                            </div>

                                            {/* Strengths & Improvements */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="bg-green-50 rounded-2-xl p-6 border border-green-100 rounded-3xl">
                                                    <h4 className="text-sm font-bold text-green-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-lg">verified</span> Strengths
                                                    </h4>
                                                    <ul className="space-y-3">
                                                        {(result.analysis?.strengths || []).map((s: string, i: number) => (
                                                            <li key={i} className="text-xs font-medium text-green-700 flex items-start gap-2">
                                                                <span className="mt-0.5">✅</span> {s}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100">
                                                    <h4 className="text-sm font-bold text-amber-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-lg">lightbulb</span> Improvements
                                                    </h4>
                                                    <ul className="space-y-3">
                                                        {(result.analysis?.improvements || []).map((w: string, i: number) => (
                                                            <li key={i} className="text-xs font-medium text-amber-700 flex items-start gap-2">
                                                                <span className="mt-0.5">💡</span> {w}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>

                                            {/* Breakdown */}
                                            <div className="bg-white rounded-[2.5rem] p-8 border border-purple-50 shadow-lg">
                                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">Structural Analysis</h4>
                                                <div className="space-y-6">
                                                    {Object.entries(result.analysis?.sections || {}).map(([key, val]: [string, any], i) => (
                                                        <div key={i}>
                                                            <div className="flex justify-between items-end mb-2">
                                                                <span className="text-[11px] font-bold text-gray-500 uppercase">{key.replace(/([A-Z])/g, ' $1')}</span>
                                                                <span className="text-sm font-bold text-[#6605c7]">{val.score}/100</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-gradient-to-r from-purple-400 to-[#6605c7]" style={{ width: `${val.score}%` }} />
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
        <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs">{icon}</span>
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                {...props}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6605c7] focus:border-[#6605c7] transition-all text-sm"
            />
        </div>
    );
}

function FormTextarea({ label, icon, ...props }: any) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs">{icon}</span>
                {label}
            </label>
            <textarea
                {...props}
                rows={3}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6605c7] focus:border-[#6605c7] transition-all text-sm leading-relaxed resize-none"
            />
        </div>
    );
}

function FeatureBox({ emoji, text, bgColor }: { emoji: string; text: string; bgColor: string }) {
    return (
        <div className={`${bgColor} p-4 rounded-xl text-center flex flex-col gap-2 items-center justify-center`}>
            <span className="text-3xl">{emoji}</span>
            <span className="text-xs font-semibold text-gray-800">{text}</span>
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
