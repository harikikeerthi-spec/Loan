"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ────────────────────────── Types ────────────────────────── */
interface InterviewMessage {
    role: "officer" | "applicant";
    content: string;
    timestamp: string;
}

interface EvaluationResult {
    clarity: number;
    confidence: number;
    relevance: number;
    risk: "Low" | "Medium" | "High";
    redFlags: string[];
    missingDetails: string[];
    suggestedImprovement: string[];
}

interface InterviewSection {
    id: string;
    label: string;
    completed: boolean;
}

interface FinalReport {
    overallScore: number;
    overallRisk: string;
    approvalLikelihood: string;
    strengths: string[];
    weaknesses: string[];
    criticalIssues: string[];
    sectionScores: Record<string, number>;
    tips: string[];
    verdict: string;
}

const VISA_TYPES = [
    { value: "F1 Student Visa", label: "F-1 Student Visa", icon: "school", desc: "For full-time students at accredited institutions" },
    { value: "B1/B2 Tourist/Business Visa", label: "B-1/B-2 Visitor Visa", icon: "flight_takeoff", desc: "Tourism, business, medical treatment" },
    { value: "H1B Work Visa", label: "H-1B Work Visa", icon: "work", desc: "Specialty occupation workers" },
    { value: "J1 Exchange Visitor Visa", label: "J-1 Exchange Visa", icon: "swap_horiz", desc: "Exchange visitor programs" },
    { value: "L1 Intracompany Transfer Visa", label: "L-1 Transfer Visa", icon: "business", desc: "Intracompany transferees" },
];

const DEFAULT_SECTIONS: InterviewSection[] = [
    { id: "purpose", label: "Purpose of Travel", completed: false },
    { id: "funding", label: "Funding & Financial Credibility", completed: false },
    { id: "ties", label: "Ties to Home Country", completed: false },
    { id: "background", label: "Employment / Academic Background", completed: false },
    { id: "travel", label: "Travel History", completed: false },
    { id: "accommodation", label: "Accommodation & Itinerary", completed: false },
    { id: "return", label: "Return Intent", completed: false },
];

/* ────────────────────────── Main Page ────────────────────────── */
export default function VisaMockPage() {
    // Phase: "setup" | "interview" | "report"
    const [phase, setPhase] = useState<"setup" | "interview" | "report">("setup");

    // Setup state
    const [visaType, setVisaType] = useState("F1 Student Visa");
    const [profile, setProfile] = useState({
        fullName: "",
        nationality: "Indian",
        age: "",
        occupation: "",
        university: "",
        course: "",
        funding: "",
        previousTravel: "",
    });

    // Interview state
    const [messages, setMessages] = useState<InterviewMessage[]>([]);
    const [currentInput, setCurrentInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentSection, setCurrentSection] = useState("purpose");
    const [sections, setSections] = useState<InterviewSection[]>(DEFAULT_SECTIONS);
    const [evaluations, setEvaluations] = useState<EvaluationResult[]>([]);
    const [latestEval, setLatestEval] = useState<EvaluationResult | null>(null);
    const [questionCount, setQuestionCount] = useState(0);
    const [showEvalPanel, setShowEvalPanel] = useState(false);

    // Report state
    const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
    const [reportLoading, setReportLoading] = useState(false);

    // Refs
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    /* ────── API Calls ────── */
    const startInterview = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/ai/visa-interview/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userProfile: profile, visaType }),
            });
            const data = await res.json();
            if (data.success) {
                const officerMsg: InterviewMessage = {
                    role: "officer",
                    content: data.question,
                    timestamp: new Date().toISOString(),
                };
                setMessages([officerMsg]);
                setCurrentSection(data.currentSection || "purpose");
                if (data.sections) setSections(data.sections);
                setQuestionCount(1);
                setPhase("interview");
            }
        } catch (err) {
            console.error("Failed to start interview:", err);
        }
        setIsLoading(false);
    }, [profile, visaType]);

    const sendAnswer = useCallback(async () => {
        if (!currentInput.trim() || isLoading) return;

        const answer = currentInput.trim();
        setCurrentInput("");

        const applicantMsg: InterviewMessage = {
            role: "applicant",
            content: answer,
            timestamp: new Date().toISOString(),
        };
        const updatedMessages = [...messages, applicantMsg];
        setMessages(updatedMessages);
        setIsLoading(true);

        // Get the last officer question
        const lastOfficerMsg = [...messages].reverse().find(m => m.role === "officer");

        // Parallel: evaluate + get next question
        const [evalRes, continueRes] = await Promise.all([
            fetch("/api/ai/visa-interview/evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    visaType,
                    question: lastOfficerMsg?.content || "",
                    transcript: answer,
                }),
            }).then(r => r.json()).catch(() => null),

            fetch("/api/ai/visa-interview/continue", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userProfile: profile,
                    visaType,
                    previousQuestion: lastOfficerMsg?.content || "",
                    transcript: answer,
                    currentSection,
                    conversationHistory: updatedMessages,
                }),
            }).then(r => r.json()).catch(() => null),
        ]);

        // Handle evaluation
        if (evalRes?.success && evalRes.evaluation) {
            setLatestEval(evalRes.evaluation);
            setEvaluations(prev => [...prev, evalRes.evaluation]);
            setShowEvalPanel(true);
        }

        // Handle next question
        if (continueRes?.success) {
            const officerMsg: InterviewMessage = {
                role: "officer",
                content: continueRes.question,
                timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, officerMsg]);
            setQuestionCount(prev => prev + 1);

            // Auto-advance section based on question count (rough heuristic)
            const sectionIdx = Math.min(Math.floor(questionCount / 3), DEFAULT_SECTIONS.length - 1);
            const newSection = DEFAULT_SECTIONS[sectionIdx]?.id || currentSection;
            setCurrentSection(newSection);

            // Mark completed sections
            setSections(prev =>
                prev.map((s, i) => ({
                    ...s,
                    completed: i < sectionIdx,
                }))
            );
        }

        setIsLoading(false);
        inputRef.current?.focus();
    }, [currentInput, isLoading, messages, visaType, profile, currentSection, questionCount]);

    const endInterview = useCallback(async () => {
        setReportLoading(true);
        setPhase("report");
        try {
            const res = await fetch("/api/ai/visa-interview/final-report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    visaType,
                    conversationHistory: messages,
                    evaluations,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setFinalReport(data.report);
            }
        } catch (err) {
            console.error("Failed to generate report:", err);
        }
        setReportLoading(false);
    }, [visaType, messages, evaluations]);

    const resetAll = useCallback(() => {
        setPhase("setup");
        setMessages([]);
        setEvaluations([]);
        setLatestEval(null);
        setQuestionCount(0);
        setCurrentSection("purpose");
        setSections(DEFAULT_SECTIONS);
        setFinalReport(null);
        setShowEvalPanel(false);
        setCurrentInput("");
    }, []);

    /* ────── Key Handler ────── */
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendAnswer();
        }
    };

    /* ────── Render ────── */
    return (
        <div className="min-h-screen pt-28 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <AnimatePresence mode="wait">
                    {phase === "setup" && (
                        <SetupPhase
                            key="setup"
                            visaType={visaType}
                            setVisaType={setVisaType}
                            profile={profile}
                            setProfile={setProfile}
                            onStart={startInterview}
                            isLoading={isLoading}
                        />
                    )}
                    {phase === "interview" && (
                        <InterviewPhase
                            key="interview"
                            messages={messages}
                            currentInput={currentInput}
                            setCurrentInput={setCurrentInput}
                            isLoading={isLoading}
                            sections={sections}
                            currentSection={currentSection}
                            latestEval={latestEval}
                            showEvalPanel={showEvalPanel}
                            setShowEvalPanel={setShowEvalPanel}
                            questionCount={questionCount}
                            evaluations={evaluations}
                            chatEndRef={chatEndRef}
                            inputRef={inputRef}
                            onSend={sendAnswer}
                            onEnd={endInterview}
                            onKeyDown={handleKeyDown}
                            visaType={visaType}
                        />
                    )}
                    {phase === "report" && (
                        <ReportPhase
                            key="report"
                            report={finalReport}
                            loading={reportLoading}
                            messages={messages}
                            evaluations={evaluations}
                            onRestart={resetAll}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   SETUP PHASE
   ═══════════════════════════════════════════════════════════════ */
function SetupPhase({
    visaType, setVisaType, profile, setProfile, onStart, isLoading,
}: {
    visaType: string;
    setVisaType: (v: string) => void;
    profile: Record<string, string>;
    setProfile: (p: Record<string, string>) => void;
    onStart: () => void;
    isLoading: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
        >
            {/* Hero */}
            <div className="text-center mb-12">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
                    style={{ background: "linear-gradient(135deg, #6605c7 0%, #a855f7 100%)" }}
                >
                    <span className="material-symbols-outlined text-white text-4xl">record_voice_over</span>
                </motion.div>
                <h1 className="text-3xl md:text-5xl font-black text-[#1a1626] uppercase tracking-tight mb-4">
                    Visa Interview <span className="text-[#6605c7] italic">Simulator</span>
                </h1>
                <p className="text-gray-500 text-[14px] max-w-2xl mx-auto font-medium leading-relaxed">
                    Practice with our AI-powered consular officer. Get real-time evaluation, risk analysis,
                    and personalized tips to ace your U.S. visa interview.
                </p>
                <div className="flex items-center justify-center gap-6 mt-6 flex-wrap">
                    {[
                        { icon: "smart_toy", label: "AI Officer" },
                        { icon: "analytics", label: "Live Scoring" },
                        { icon: "shield", label: "Risk Analysis" },
                        { icon: "lightbulb", label: "Expert Tips" },
                    ].map((f) => (
                        <div key={f.label} className="flex items-center gap-2 text-[11px] font-bold text-[#6605c7] uppercase tracking-widest">
                            <span className="material-symbols-outlined text-base">{f.icon}</span>
                            {f.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Visa Type Selection */}
            <div className="mb-10">
                <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 text-center">Select Visa Type</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 max-w-5xl mx-auto">
                    {VISA_TYPES.map((v) => (
                        <motion.button
                            key={v.value}
                            whileHover={{ y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setVisaType(v.value)}
                            className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${visaType === v.value
                                    ? "border-[#6605c7] bg-[#6605c7]/5 shadow-lg shadow-[#6605c7]/10"
                                    : "border-gray-200/80 bg-white/60 backdrop-blur-sm hover:border-[#6605c7]/30"
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${visaType === v.value ? "bg-[#6605c7] text-white" : "bg-gray-100 text-gray-500"
                                }`}>
                                <span className="material-symbols-outlined">{v.icon}</span>
                            </div>
                            <div className="text-[13px] font-bold text-gray-900 mb-1">{v.label}</div>
                            <div className="text-[10px] text-gray-400 leading-snug">{v.desc}</div>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Profile Form */}
            <div className="max-w-3xl mx-auto">
                <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 text-center">Applicant Profile</h2>
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg p-6 md:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ProfileInput
                            label="Full Name"
                            icon="person"
                            value={profile.fullName}
                            onChange={(v) => setProfile({ ...profile, fullName: v })}
                            placeholder="John Doe"
                        />
                        <ProfileInput
                            label="Nationality"
                            icon="flag"
                            value={profile.nationality}
                            onChange={(v) => setProfile({ ...profile, nationality: v })}
                            placeholder="Indian"
                        />
                        <ProfileInput
                            label="Age"
                            icon="cake"
                            value={profile.age}
                            onChange={(v) => setProfile({ ...profile, age: v })}
                            placeholder="24"
                            type="number"
                        />
                        <ProfileInput
                            label="Occupation"
                            icon="work"
                            value={profile.occupation}
                            onChange={(v) => setProfile({ ...profile, occupation: v })}
                            placeholder="Software Engineer"
                        />
                        <ProfileInput
                            label="University / Institution"
                            icon="school"
                            value={profile.university}
                            onChange={(v) => setProfile({ ...profile, university: v })}
                            placeholder="Stanford University"
                        />
                        <ProfileInput
                            label="Course / Program"
                            icon="menu_book"
                            value={profile.course}
                            onChange={(v) => setProfile({ ...profile, course: v })}
                            placeholder="MS Computer Science"
                        />
                        <ProfileInput
                            label="Funding Source"
                            icon="account_balance"
                            value={profile.funding}
                            onChange={(v) => setProfile({ ...profile, funding: v })}
                            placeholder="Education loan + savings"
                        />
                        <ProfileInput
                            label="Previous Travel History"
                            icon="travel_explore"
                            value={profile.previousTravel}
                            onChange={(v) => setProfile({ ...profile, previousTravel: v })}
                            placeholder="UK (2023), Singapore (2024)"
                        />
                    </div>

                    <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onStart}
                        disabled={isLoading || !profile.fullName}
                        className="w-full mt-8 px-8 py-4 bg-[#6605c7] text-white font-black rounded-xl text-[13px] uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-2xl hover:bg-[#5204a0] transition-all duration-300 flex items-center justify-center gap-3"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Initializing Interview...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">mic</span>
                                Start Mock Interview
                            </>
                        )}
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   INTERVIEW PHASE
   ═══════════════════════════════════════════════════════════════ */
function InterviewPhase({
    messages, currentInput, setCurrentInput, isLoading, sections,
    currentSection, latestEval, showEvalPanel, setShowEvalPanel,
    questionCount, evaluations, chatEndRef, inputRef, onSend, onEnd, onKeyDown, visaType,
}: {
    messages: InterviewMessage[];
    currentInput: string;
    setCurrentInput: (v: string) => void;
    isLoading: boolean;
    sections: InterviewSection[];
    currentSection: string;
    latestEval: EvaluationResult | null;
    showEvalPanel: boolean;
    setShowEvalPanel: (v: boolean) => void;
    questionCount: number;
    evaluations: EvaluationResult[];
    chatEndRef: React.RefObject<HTMLDivElement | null>;
    inputRef: React.RefObject<HTMLTextAreaElement | null>;
    onSend: () => void;
    onEnd: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    visaType: string;
}) {
    const avgScore = evaluations.length
        ? Math.round(evaluations.reduce((a, e) => a + (e.clarity + e.confidence + e.relevance) / 3, 0) / evaluations.length * 10)
        : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
            {/* Left Sidebar — Progress */}
            <div className="lg:col-span-3 order-2 lg:order-1">
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg p-5 sticky top-28">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-[#6605c7]/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#6605c7] text-lg">checklist</span>
                        </div>
                        <div>
                            <div className="text-[13px] font-black text-gray-900">Interview Progress</div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-widest">{visaType}</div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        {sections.map((s, i) => {
                            const isCurrent = s.id === currentSection;
                            return (
                                <div
                                    key={s.id}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ${isCurrent ? "bg-[#6605c7]/8 border border-[#6605c7]/15" : s.completed ? "opacity-70" : "opacity-50"
                                        }`}
                                >
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${s.completed ? "bg-green-500 text-white" : isCurrent ? "bg-[#6605c7] text-white" : "bg-gray-200 text-gray-500"
                                        }`}>
                                        {s.completed ? (
                                            <span className="material-symbols-outlined text-xs">check</span>
                                        ) : (
                                            i + 1
                                        )}
                                    </div>
                                    <span className={`text-[11px] font-semibold ${isCurrent ? "text-[#6605c7]" : "text-gray-600"}`}>
                                        {s.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Mini Stats */}
                    <div className="mt-5 pt-5 border-t border-gray-100 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Questions</span>
                            <span className="text-[14px] font-black text-gray-900">{questionCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Avg Score</span>
                            <span className={`text-[14px] font-black ${avgScore >= 70 ? "text-green-600" : avgScore >= 40 ? "text-yellow-600" : "text-red-600"}`}>
                                {avgScore}%
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Answers</span>
                            <span className="text-[14px] font-black text-gray-900">{evaluations.length}</span>
                        </div>
                    </div>

                    <button
                        onClick={onEnd}
                        disabled={messages.length < 4}
                        className="w-full mt-5 px-4 py-3 bg-red-500/10 text-red-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        End & Get Report
                    </button>
                </div>
            </div>

            {/* Center — Chat */}
            <div className="lg:col-span-6 order-1 lg:order-2">
                {/* Header Bar */}
                <div className="bg-white/70 backdrop-blur-xl rounded-t-2xl border border-white/50 border-b-0 shadow-sm px-5 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #1a1626, #3b0768)" }}>
                        <span className="material-symbols-outlined text-white text-lg">gavel</span>
                    </div>
                    <div className="flex-1">
                        <div className="text-[13px] font-black text-gray-900">U.S. Consular Officer</div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active Interview</span>
                        </div>
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full uppercase tracking-widest">
                        Q{questionCount}
                    </div>
                </div>

                {/* Chat Body */}
                <div className="bg-white/50 backdrop-blur-md border-x border-white/50 min-h-[450px] max-h-[550px] overflow-y-auto p-5 space-y-4 scrollbar-hide">
                    {messages.map((msg, idx) => (
                        <ChatBubble key={idx} message={msg} />
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #1a1626, #3b0768)" }}>
                                <span className="material-symbols-outlined text-white text-sm">gavel</span>
                            </div>
                            <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-[#6605c7]/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <div className="w-2 h-2 rounded-full bg-[#6605c7]/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <div className="w-2 h-2 rounded-full bg-[#6605c7]/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-white/70 backdrop-blur-xl rounded-b-2xl border border-white/50 border-t-0 shadow-lg px-4 py-3">
                    <div className="flex gap-3 items-end">
                        <textarea
                            ref={inputRef}
                            value={currentInput}
                            onChange={(e) => setCurrentInput(e.target.value)}
                            onKeyDown={onKeyDown}
                            placeholder="Type your answer..."
                            disabled={isLoading}
                            rows={2}
                            className="flex-1 resize-none rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-[13px] font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#6605c7] focus:ring-2 focus:ring-[#6605c7]/10 transition-all disabled:opacity-50"
                        />
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onSend}
                            disabled={!currentInput.trim() || isLoading}
                            className="w-11 h-11 bg-[#6605c7] text-white rounded-xl flex items-center justify-center shrink-0 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#5204a0] transition-all shadow-lg shadow-[#6605c7]/20"
                        >
                            <span className="material-symbols-outlined text-lg">send</span>
                        </motion.button>
                    </div>
                    <div className="flex items-center justify-between mt-2 px-1">
                        <span className="text-[10px] text-gray-400">Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[9px] font-bold">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[9px] font-bold">Shift+Enter</kbd> for new line</span>
                    </div>
                </div>
            </div>

            {/* Right Sidebar — Evaluation */}
            <div className="lg:col-span-3 order-3">
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg p-5 sticky top-28">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-amber-600 text-lg">analytics</span>
                            </div>
                            <span className="text-[13px] font-black text-gray-900">Live Evaluation</span>
                        </div>
                        {latestEval && (
                            <button
                                onClick={() => setShowEvalPanel(!showEvalPanel)}
                                className="text-[10px] font-bold text-[#6605c7] uppercase tracking-widest"
                            >
                                {showEvalPanel ? "Hide" : "Show"}
                            </button>
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        {latestEval && showEvalPanel ? (
                            <motion.div
                                key="eval"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                {/* Scores */}
                                <div className="space-y-2">
                                    <ScoreBar label="Clarity" value={latestEval.clarity} color="#6605c7" />
                                    <ScoreBar label="Confidence" value={latestEval.confidence} color="#059669" />
                                    <ScoreBar label="Relevance" value={latestEval.relevance} color="#2563eb" />
                                </div>

                                {/* Risk Badge */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Risk Level</span>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${latestEval.risk === "Low" ? "bg-green-100 text-green-700" :
                                            latestEval.risk === "Medium" ? "bg-yellow-100 text-yellow-700" :
                                                "bg-red-100 text-red-700"
                                        }`}>
                                        {latestEval.risk}
                                    </span>
                                </div>

                                {/* Red Flags */}
                                {latestEval.redFlags.length > 0 && (
                                    <div>
                                        <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">flag</span> Red Flags
                                        </div>
                                        {latestEval.redFlags.map((f, i) => (
                                            <div key={i} className="text-[11px] text-red-600/80 bg-red-50 rounded-lg px-3 py-1.5 mb-1 font-medium">
                                                {f}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Missing Details */}
                                {latestEval.missingDetails.length > 0 && (
                                    <div>
                                        <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">warning</span> Missing Details
                                        </div>
                                        {latestEval.missingDetails.map((d, i) => (
                                            <div key={i} className="text-[11px] text-amber-700/80 bg-amber-50 rounded-lg px-3 py-1.5 mb-1 font-medium">
                                                {d}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Improvements */}
                                {latestEval.suggestedImprovement.length > 0 && (
                                    <div>
                                        <div className="text-[10px] font-bold text-[#6605c7] uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">lightbulb</span> Suggestions
                                        </div>
                                        {latestEval.suggestedImprovement.map((s, i) => (
                                            <div key={i} className="text-[11px] text-[#6605c7]/80 bg-[#6605c7]/5 rounded-lg px-3 py-1.5 mb-1 font-medium">
                                                {s}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-8"
                            >
                                <span className="material-symbols-outlined text-4xl text-gray-200 mb-3 block">assessment</span>
                                <p className="text-[11px] text-gray-400 font-medium">
                                    Answer a question to see<br />your real-time evaluation
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   REPORT PHASE
   ═══════════════════════════════════════════════════════════════ */
function ReportPhase({
    report, loading, messages, evaluations, onRestart,
}: {
    report: FinalReport | null;
    loading: boolean;
    messages: InterviewMessage[];
    evaluations: EvaluationResult[];
    onRestart: () => void;
}) {
    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center min-h-[60vh]"
            >
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ background: "linear-gradient(135deg, #6605c7, #a855f7)" }}>
                    <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
                <h2 className="text-xl font-black text-gray-900 mb-2">Generating Your Report</h2>
                <p className="text-[13px] text-gray-500 font-medium">Analyzing {messages.length} messages and {evaluations.length} evaluations...</p>
            </motion.div>
        );
    }

    if (!report) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                <p className="text-gray-500">Failed to generate report. Please try again.</p>
                <button onClick={onRestart} className="mt-4 px-6 py-3 bg-[#6605c7] text-white rounded-xl font-bold text-[13px]">
                    Restart Interview
                </button>
            </motion.div>
        );
    }

    const likelihoodColor = {
        "Very Likely": "text-green-600 bg-green-50 border-green-200",
        "Likely": "text-green-500 bg-green-50 border-green-200",
        "Uncertain": "text-yellow-600 bg-yellow-50 border-yellow-200",
        "Unlikely": "text-red-500 bg-red-50 border-red-200",
        "Very Unlikely": "text-red-600 bg-red-50 border-red-200",
    }[report.approvalLikelihood] || "text-gray-600 bg-gray-50 border-gray-200";

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            {/* Report Header */}
            <div className="text-center mb-10">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
                    style={{ background: `linear-gradient(135deg, ${report.overallScore >= 70 ? "#059669" : report.overallScore >= 40 ? "#d97706" : "#dc2626"}, ${report.overallScore >= 70 ? "#10b981" : report.overallScore >= 40 ? "#f59e0b" : "#ef4444"})` }}
                >
                    <span className="text-white text-3xl font-black">{report.overallScore}</span>
                </motion.div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight mb-2">
                    Interview <span className="text-[#6605c7] italic">Report</span>
                </h1>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[12px] font-black uppercase tracking-widest ${likelihoodColor}`}>
                    <span className="material-symbols-outlined text-sm">
                        {report.approvalLikelihood.includes("Likely") && !report.approvalLikelihood.includes("Unlikely") ? "check_circle" : report.approvalLikelihood === "Uncertain" ? "help" : "cancel"}
                    </span>
                    Approval: {report.approvalLikelihood}
                </div>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-5xl mx-auto">
                <ReportCard title="Overall Score" icon="speed">
                    <div className="text-5xl font-black text-gray-900">{report.overallScore}
                        <span className="text-lg text-gray-400 font-bold">/100</span>
                    </div>
                </ReportCard>
                <ReportCard title="Risk Level" icon="shield">
                    <div className={`text-3xl font-black ${report.overallRisk === "Low" ? "text-green-600" : report.overallRisk === "Medium" ? "text-yellow-600" : "text-red-600"
                        }`}>{report.overallRisk}</div>
                </ReportCard>
                <ReportCard title="Interview Stats" icon="bar_chart">
                    <div className="flex gap-4">
                        <div>
                            <div className="text-2xl font-black text-gray-900">{messages.filter(m => m.role === "officer").length}</div>
                            <div className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Questions</div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-gray-900">{evaluations.length}</div>
                            <div className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Answers</div>
                        </div>
                    </div>
                </ReportCard>
            </div>

            {/* Section Scores */}
            {report.sectionScores && (
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg p-6 mb-6 max-w-5xl mx-auto">
                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#6605c7] text-base">category</span>
                        Section-Wise Scores
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(report.sectionScores).map(([key, val]) => (
                            <div key={key} className="text-center p-3 rounded-xl bg-gray-50/50">
                                <div className={`text-2xl font-black ${(val as number) >= 7 ? "text-green-600" : (val as number) >= 4 ? "text-yellow-600" : "text-red-600"}`}>
                                    {val as number}
                                    <span className="text-sm text-gray-400">/10</span>
                                </div>
                                <div className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mt-1 capitalize">{key}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Strengths / Weaknesses / Tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto mb-6">
                {report.strengths.length > 0 && (
                    <ListCard title="Strengths" icon="thumb_up" color="green" items={report.strengths} />
                )}
                {report.weaknesses.length > 0 && (
                    <ListCard title="Weaknesses" icon="thumb_down" color="red" items={report.weaknesses} />
                )}
                {report.criticalIssues.length > 0 && (
                    <ListCard title="Critical Issues" icon="error" color="red" items={report.criticalIssues} />
                )}
                {report.tips.length > 0 && (
                    <ListCard title="Expert Tips" icon="lightbulb" color="purple" items={report.tips} />
                )}
            </div>

            {/* Verdict */}
            {report.verdict && (
                <div className="max-w-5xl mx-auto mb-8">
                    <div className="bg-[#6605c7]/5 border border-[#6605c7]/15 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-[#6605c7]">gavel</span>
                            <span className="text-[11px] font-black text-[#6605c7] uppercase tracking-widest">Final Verdict</span>
                        </div>
                        <p className="text-[14px] text-gray-700 leading-relaxed font-medium">{report.verdict}</p>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mb-8">
                <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onRestart}
                    className="px-8 py-4 bg-[#6605c7] text-white font-black rounded-xl text-[13px] uppercase tracking-widest hover:shadow-2xl hover:bg-[#5204a0] transition-all"
                >
                    Practice Again
                </motion.button>
            </div>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
function ProfileInput({ label, icon, value, onChange, placeholder, type = "text" }: {
    label: string; icon: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
    return (
        <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs text-[#6605c7]">{icon}</span>
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white/80 text-[13px] font-medium text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-[#6605c7] focus:ring-2 focus:ring-[#6605c7]/10 transition-all"
            />
        </div>
    );
}

function ChatBubble({ message }: { message: InterviewMessage }) {
    const isOfficer = message.role === "officer";
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, x: isOfficer ? -10 : 10 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex items-start gap-3 ${isOfficer ? "" : "flex-row-reverse"}`}
        >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isOfficer ? "" : "bg-[#6605c7]/10"
                }`} style={isOfficer ? { background: "linear-gradient(135deg, #1a1626, #3b0768)" } : {}}>
                <span className={`material-symbols-outlined text-sm ${isOfficer ? "text-white" : "text-[#6605c7]"}`}>
                    {isOfficer ? "gavel" : "person"}
                </span>
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isOfficer
                    ? "bg-gray-100 rounded-tl-none"
                    : "bg-[#6605c7] text-white rounded-tr-none"
                }`}>
                <p className={`text-[13px] font-medium leading-relaxed ${isOfficer ? "text-gray-800" : "text-white"}`}>
                    {message.content}
                </p>
                <div className={`text-[9px] mt-1.5 ${isOfficer ? "text-gray-400" : "text-white/60"}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
            </div>
        </motion.div>
    );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
                <span className="text-[12px] font-black" style={{ color }}>{value}/10</span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value * 10}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: color }}
                />
            </div>
        </div>
    );
}

function ReportCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg p-6"
        >
            <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[#6605c7] text-base">{icon}</span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</span>
            </div>
            {children}
        </motion.div>
    );
}

function ListCard({ title, icon, color, items }: { title: string; icon: string; color: string; items: string[] }) {
    const colorMap: Record<string, { bg: string; text: string; itemBg: string; itemText: string }> = {
        green: { bg: "bg-green-500/10", text: "text-green-600", itemBg: "bg-green-50", itemText: "text-green-700" },
        red: { bg: "bg-red-500/10", text: "text-red-600", itemBg: "bg-red-50", itemText: "text-red-700" },
        purple: { bg: "bg-[#6605c7]/10", text: "text-[#6605c7]", itemBg: "bg-[#6605c7]/5", itemText: "text-[#6605c7]" },
    };
    const c = colorMap[color] || colorMap.purple;

    return (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg p-5">
            <div className="flex items-center gap-2 mb-3">
                <div className={`w-7 h-7 rounded-lg ${c.bg} flex items-center justify-center`}>
                    <span className={`material-symbols-outlined text-sm ${c.text}`}>{icon}</span>
                </div>
                <span className={`text-[11px] font-black uppercase tracking-widest ${c.text}`}>{title}</span>
            </div>
            <div className="space-y-1.5">
                {items.map((item, i) => (
                    <div key={i} className={`text-[11px] ${c.itemText} ${c.itemBg} rounded-lg px-3 py-2 font-medium leading-relaxed`}>
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
}
