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
    { value: "F1 Student Visa", label: "F-1 Student Visa", icon: "school", desc: "For full-time students at accredited US institutions" },
    { value: "Tier 4 UK Student Visa", label: "Tier 4 UK Visa", icon: "potted_plant", desc: "General student visa for studying in the United Kingdom" },
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

    // Voice status
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;

                recognitionRef.current.onresult = (event: any) => {
                    const transcript = Array.from(event.results)
                        .map((result: any) => result[0])
                        .map((result: any) => result.transcript)
                        .join("");
                    setCurrentInput(transcript);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };
            }
        }
    }, []);

    const toggleSpeech = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            setCurrentInput("");
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    // Auto-scroll and Auto-TTS for AI messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

        // Speak last officer message
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.role === "officer" && typeof window !== "undefined") {
            const utterance = new SpeechSynthesisUtterance(lastMsg.content);
            utterance.rate = 1;
            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
        }
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
        <div className="min-h-screen bg-[#0a0c10] text-white overflow-x-hidden selection:bg-[#6605c7] selection:text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
                {/* Background Decorative Elements */}
                <div className="fixed inset-0 pointer-events-none -z-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#6605c7]/20 blur-[150px] rounded-full" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#a855f7]/10 blur-[150px] rounded-full" />
                </div>

                <AnimatePresence mode="wait">
                    {phase === "setup" && (
                        <SetupPhase
                            key="setup"
                            visaType={visaType}
                            setVisaType={setVisaType}
                            profile={profile}
                            setProfile={(p) => setProfile(prev => ({ ...prev, ...p }))}
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
                            isListening={isListening}
                            toggleSpeech={toggleSpeech}
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
    profile: any;
    setProfile: (p: any) => void;
    onStart: () => void;
    isLoading: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center min-h-[80vh] py-12"
        >
            {/* Background Accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-[#6605c7]/20 to-transparent blur-[120px] pointer-events-none -z-10" />

            {/* Hero */}
            <div className="text-center mb-16">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-8 relative group"
                >
                    <div className="absolute inset-0 bg-[#6605c7] rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-[#1a1626] to-[#0a0c10] border border-white/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-5xl">person_search</span>
                    </div>
                </motion.div>
                <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight mb-6">
                    MOCK <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a855f7] to-[#6605c7]">SIMULATOR</span>
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
                    Practice your visa interview with our advanced AI agents.
                    Trained on thousands of real consular interactions.
                </p>
            </div>

            {/* Visa Type Selection */}
            <div className="w-full max-w-4xl mb-16">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-6 bg-[#6605c7] rounded-full" />
                    <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Select Your Path</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {VISA_TYPES.map((v) => (
                        <motion.button
                            key={v.value}
                            whileHover={{ y: -6, scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setVisaType(v.value)}
                            className={`p-6 rounded-3xl border-2 text-left transition-all duration-500 relative overflow-hidden group ${visaType === v.value
                                ? "border-[#6605c7] bg-[#6605c7]/5 shadow-2xl shadow-[#6605c7]/20"
                                : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                                }`}
                        >
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${visaType === v.value ? "bg-[#6605c7] text-white" : "bg-white/5 text-gray-400 group-hover:text-white"
                                        }`}>
                                        <span className="material-symbols-outlined text-3xl">{v.icon}</span>
                                    </div>
                                    <div>
                                        <div className={`text-xl font-bold transition-colors ${visaType === v.value ? "text-white" : "text-gray-400 group-hover:text-white"}`}>{v.label}</div>
                                        <div className="text-sm text-gray-500 mt-1">{v.desc}</div>
                                    </div>
                                </div>
                                {visaType === v.value && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                                    >
                                        <span className="material-symbols-outlined text-white text-xs font-black">check</span>
                                    </motion.div>
                                )}
                            </div>
                            {/* Decorative glow */}
                            <div className={`absolute -right-10 -bottom-10 w-40 h-40 bg-[#6605c7] blur-[80px] rounded-full transition-opacity duration-500 ${visaType === v.value ? "opacity-10" : "opacity-0"}`} />
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Profile Form */}
            <div className="w-full max-w-4xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-6 bg-[#6605c7] rounded-full" />
                    <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Applicant Credentials</h2>
                </div>
                <div className="bg-white/[0.02] border border-white/5 backdrop-blur-3xl rounded-[40px] p-8 md:p-12 relative overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                        <ProfileInput
                            label="Full Name"
                            icon="person"
                            value={profile.fullName}
                            onChange={(v) => setProfile({ ...profile, fullName: v })}
                            placeholder="e.g. Rahul Sharma"
                        />
                        <ProfileInput
                            label="University"
                            icon="school"
                            value={profile.university}
                            onChange={(v) => setProfile({ ...profile, university: v })}
                            placeholder="e.g. Georgia Tech"
                        />
                        <ProfileInput
                            label="Course"
                            icon="menu_book"
                            value={profile.course}
                            onChange={(v) => setProfile({ ...profile, course: v })}
                            placeholder="e.g. MS in Data Science"
                        />
                        <ProfileInput
                            label="Funding"
                            icon="account_balance"
                            value={profile.funding}
                            onChange={(v) => setProfile({ ...profile, funding: v })}
                            placeholder="e.g. Self + Loan"
                        />
                    </div>

                    <motion.button
                        whileHover={{ y: -4, boxShadow: "0 25px 50px -12px rgba(102, 5, 199, 0.5)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onStart}
                        disabled={isLoading || !profile.fullName}
                        className="w-full mt-12 px-8 py-6 bg-gradient-to-r from-[#6605c7] to-[#a855f7] text-white font-black rounded-3xl text-sm uppercase tracking-[0.2em] disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-500 flex items-center justify-center gap-4 relative z-10 shadow-2xl shadow-[#6605c7]/20"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                SYNCING DATA...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-2xl">sensors</span>
                                START SIMULATION
                            </>
                        )}
                    </motion.button>

                    {/* Background Noise/Grid */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
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
    isListening, toggleSpeech
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
    isListening: boolean;
    toggleSpeech: () => void;
}) {
    const avgScore = evaluations.length
        ? Math.round(evaluations.reduce((a, e) => a + (e.clarity + e.confidence + e.relevance) / 3, 0) / evaluations.length * 10)
        : 0;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center max-w-6xl mx-auto gap-8 pt-8 pb-32"
        >
            {/* AI CONSULAR OFFICER VISUAL */}
            <div className="w-full flex flex-col items-center mb-4">
                <div className="relative">
                    <motion.div
                        animate={{
                            scale: isLoading ? [1, 1.05, 1] : 1,
                            opacity: isLoading ? [0.5, 0.8, 0.5] : 0.6
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-x-[-40px] inset-y-[-40px] bg-[#6605c7] blur-[60px] rounded-full pointer-events-none"
                    />
                    <div className="relative w-40 h-40 md:w-56 md:h-56 rounded-[60px] bg-gradient-to-br from-[#1a1626] to-[#0a0c10] border border-white/10 flex items-center justify-center p-8 shadow-2xl overflow-hidden group">
                        {/* Abstract AI Representation */}
                        <div className="relative w-full h-full flex items-center justify-center">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 border-2 border-dashed border-[#6605c7]/30 rounded-full"
                            />
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-4 border border-dashed border-[#a855f7]/20 rounded-full"
                            />
                            <span className="material-symbols-outlined text-7xl text-white opacity-90 relative z-10 group-hover:scale-110 transition-transform duration-500">
                                account_circle
                            </span>
                        </div>
                    </div>
                </div>
                <div className="mt-8 text-center">
                    <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em]">Consular Officer</h2>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <div className={`w-2 h-2 rounded-full ${isLoading ? "bg-amber-500 animate-pulse" : isListening ? "bg-red-500 animate-pulse ring-4 ring-red-500/20" : "bg-green-500"}`} />
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                            {isLoading ? "THINKING..." : isListening ? "LISTENING..." : "READY"}
                        </span>
                    </div>
                </div>
            </div>

            {/* MAIN INTERACTION AREA */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Progress Sidebar */}
                <div className="hidden lg:block">
                    <div className="bg-white/[0.03] border border-white/5 rounded-[32px] p-6 sticky top-32">
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6">Simulation Status</div>
                        <div className="space-y-4">
                            {sections.map((s, i) => (
                                <div key={s.id} className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${s.completed ? "bg-green-500" : s.id === currentSection ? "bg-[#6605c7] shadow-[0_0_10px_#6605c7]" : "bg-white/10"}`} />
                                    <span className={`text-[11px] font-bold uppercase tracking-widest ${s.id === currentSection ? "text-white" : "text-gray-500"}`}>
                                        {s.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chat Column */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="flex flex-col gap-6 min-h-[400px]">
                        <AnimatePresence mode="popLayout">
                            {messages.map((msg, idx) => (
                                <ChatBubble key={idx} message={msg} />
                            ))}
                        </AnimatePresence>
                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-start gap-4"
                            >
                                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                    <div className="w-1 h-1 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <div className="w-1 h-1 rounded-full bg-white/40 animate-bounce mx-1" style={{ animationDelay: "200ms" }} />
                                    <div className="w-1 h-1 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "400ms" }} />
                                </div>
                            </motion.div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                </div>

                {/* Live Analysis Sidebar */}
                <div className="hidden lg:block">
                    <div className="bg-white/[0.03] border border-white/5 rounded-[32px] p-6 sticky top-32">
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6 text-right">Live Analysis</div>
                        {latestEval ? (
                            <div className="space-y-6">
                                <ScoreBar label="Clarity" value={latestEval.clarity} color="#6605c7" dark />
                                <ScoreBar label="Confidence" value={latestEval.confidence} color="#a855f7" dark />
                                <div className="pt-4 border-t border-white/5">
                                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-2">Risk Factor</div>
                                    <div className={`text-lg font-black uppercase tracking-tighter ${latestEval.risk === "Low" ? "text-green-500" :
                                        latestEval.risk === "Medium" ? "text-amber-500" : "text-red-500"
                                        }`}>
                                        {latestEval.risk} Level
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest text-right leading-relaxed">
                                ANALYSIS WILL START<br />AFTER FIRST RESPONSE
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* STICKY INPUT BAR */}
            <div className="fixed bottom-12 inset-x-4 md:inset-x-0 mx-auto max-w-3xl z-50">
                <div className="bg-[#0a0c10]/80 backdrop-blur-2xl border border-white/10 rounded-[32px] p-4 shadow-2xl flex items-end gap-4">
                    <textarea
                        ref={inputRef}
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder={isListening ? "Listening... speak now" : "Speak your response..."}
                        disabled={isLoading}
                        rows={1}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-gray-600 resize-none py-3 px-4 text-base font-medium min-h-[56px] max-h-32"
                    />
                    <div className="flex items-center gap-2 pb-1.5 flex-shrink-0">
                        {messages.length >= 4 && (
                            <button
                                onClick={onEnd}
                                className="h-12 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest transition-colors border border-white/5"
                            >
                                END INTERVIEW
                            </button>
                        )}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleSpeech}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all shadow-xl ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"}`}
                        >
                            <span className="material-symbols-outlined font-black">
                                {isListening ? "mic" : "mic_none"}
                            </span>
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onSend}
                            disabled={!currentInput.trim() || isLoading}
                            className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center shrink-0 disabled:opacity-20 disabled:grayscale transition-all shadow-xl"
                        >
                            <span className="material-symbols-outlined font-black">arrow_upward</span>
                        </motion.button>
                    </div>
                </div>
                <div className="mt-3 text-center">
                    <span className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em]">Press ENTER to transmit • Practicing for {visaType}</span>
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="flex flex-col items-center py-20"
        >
            {/* Report Header */}
            <div className="text-center mb-16">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="inline-flex items-center justify-center w-28 h-28 rounded-[40px] mb-8 relative"
                >
                    <div className="absolute inset-0 blur-[30px] opacity-40" style={{ background: report.overallScore >= 70 ? "#10b981" : report.overallScore >= 40 ? "#f59e0b" : "#ef4444" }} />
                    <div className="relative w-full h-full rounded-[40px] border border-white/20 bg-white/5 flex items-center justify-center">
                        <span className="text-5xl font-black text-white">{report.overallScore}</span>
                    </div>
                </motion.div>
                <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4">
                    SIMULATION <span className="text-[#6605c7] italic">REPORT</span>
                </h1>
                <div className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full border text-[11px] font-black uppercase tracking-[0.2em] ${likelihoodColor}`}>
                    <span className="material-symbols-outlined text-base">
                        {report.approvalLikelihood.includes("Likely") && !report.approvalLikelihood.includes("Unlikely") ? "verified" : report.approvalLikelihood === "Uncertain" ? "help" : "error"}
                    </span>
                    VISA PROBABILITY: {report.approvalLikelihood}
                </div>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full max-w-5xl">
                <ReportCard title="OVERALL GRADE" icon="analytics">
                    <div className="text-6xl font-black text-white">{report.overallScore}
                        <span className="text-xl text-gray-600 font-bold ml-1">/100</span>
                    </div>
                </ReportCard>
                <ReportCard title="RISK INDEX" icon="security">
                    <div className={`text-4xl font-black uppercase tracking-tighter ${report.overallRisk === "Low" ? "text-green-500" : report.overallRisk === "Medium" ? "text-amber-500" : "text-red-500"
                        }`}>{report.overallRisk} RISK</div>
                </ReportCard>
                <ReportCard title="ENGAGEMENT" icon="forum">
                    <div className="flex gap-6">
                        <div>
                            <div className="text-3xl font-black text-white">{messages.filter(m => m.role === "officer").length}</div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Queries</div>
                        </div>
                        <div className="w-px h-10 bg-white/10 self-center" />
                        <div>
                            <div className="text-3xl font-black text-white">{evaluations.length}</div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Responses</div>
                        </div>
                    </div>
                </ReportCard>
            </div>

            {/* Section Scores */}
            {report.sectionScores && (
                <div className="bg-white/[0.02] border border-white/5 backdrop-blur-3xl rounded-[40px] p-8 mb-8 w-full max-w-5xl">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                        <div className="w-1 h-4 bg-[#6605c7] rounded-full" />
                        SECTION METRICS
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {Object.entries(report.sectionScores).map(([key, val]) => (
                            <div key={key} className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
                                <div className={`text-3xl font-black mb-1 ${(val as number) >= 7 ? "text-green-500" : (val as number) >= 4 ? "text-amber-500" : "text-red-500"}`}>
                                    {(val as number) * 10}
                                    <span className="text-xs text-gray-600 ml-1">%</span>
                                </div>
                                <div className="text-[9px] text-gray-500 uppercase font-black tracking-widest group-hover:text-white transition-colors">{key.replace(/([A-Z])/g, ' $1')}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Detailed Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mb-12">
                {report.strengths.length > 0 && (
                    <ListCard title="Key Strengths" icon="verified" color="green" items={report.strengths} />
                )}
                {report.weaknesses.length > 0 && (
                    <ListCard title="Areas of Concern" icon="warning" color="red" items={report.weaknesses} />
                )}
                {report.criticalIssues.length > 0 && (
                    <ListCard title="Critical Failures" icon="dangerous" color="red" items={report.criticalIssues} />
                )}
                {report.tips.length > 0 && (
                    <ListCard title="Improvement Strategy" icon="lightbulb" color="purple" items={report.tips} />
                )}
            </div>

            {/* Verdict */}
            {report.verdict && (
                <div className="w-full max-w-5xl mb-12">
                    <div className="bg-gradient-to-br from-[#6605c7]/10 to-transparent border border-[#6605c7]/20 rounded-[40px] p-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <span className="material-symbols-outlined text-9xl">gavel</span>
                        </div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-[#6605c7] flex items-center justify-center">
                                <span className="material-symbols-outlined text-white">gavel</span>
                            </div>
                            <span className="text-[10px] font-black text-[#6605c7] uppercase tracking-[0.2em]">CONSULAR VERDICT</span>
                        </div>
                        <p className="text-lg text-gray-300 leading-relaxed font-medium relative z-10 italic">"{report.verdict}"</p>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-6">
                <motion.button
                    whileHover={{ y: -4, boxShadow: "0 25px 50px -12px rgba(102, 5, 199, 0.5)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onRestart}
                    className="px-12 py-6 bg-white text-black font-black rounded-[32px] text-sm uppercase tracking-[0.2em] transition-all"
                >
                    INITIATE NEW SESSION
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
        <div className="group">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block transform group-focus-within:text-[#6605c7] group-focus-within:translate-x-1 transition-all">
                {label}
            </label>
            <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 transition-colors group-focus-within:text-[#6605c7]">
                    {icon}
                </span>
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-12 pr-4 py-4 rounded-3xl bg-white/[0.03] border border-white/10 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#6605c7]/50 focus:bg-white/[0.05] transition-all"
                />
            </div>
        </div>
    );
}

function ChatBubble({ message }: { message: InterviewMessage }) {
    const isOfficer = message.role === "officer";
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className={`flex items-start gap-4 ${isOfficer ? "flex-row" : "flex-row-reverse"}`}
        >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-500 hover:rotate-12 ${isOfficer ? "bg-white/5 border-white/10" : "bg-[#6605c7] border-[#6605c7]/50"
                }`}>
                <span className={`material-symbols-outlined text-lg ${isOfficer ? "text-gray-400" : "text-white"}`}>
                    {isOfficer ? "robot_2" : "face"}
                </span>
            </div>
            <div className={`max-w-[85%] rounded-[32px] px-6 py-4 shadow-xl ${isOfficer
                ? "bg-white/[0.03] border border-white/5 text-white rounded-tl-none"
                : "bg-gradient-to-br from-[#6605c7] to-[#8b5cf6] text-white rounded-tr-none"
                }`}>
                <p className="text-base font-medium leading-relaxed">
                    {message.content}
                </p>
                <div className={`text-[9px] mt-3 font-black uppercase tracking-widest ${isOfficer ? "text-gray-600" : "text-white/40"}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
            </div>
        </motion.div>
    );
}

function ScoreBar({ label, value, color, dark = false }: { label: string; value: number; color: string; dark?: boolean }) {
    return (
        <div className="group">
            <div className="flex justify-between items-center mb-2">
                <span className={`text-[10px] font-black uppercase tracking-widest ${dark ? "text-gray-500" : "text-gray-400"}`}>{label}</span>
                <span className="text-xs font-black text-white">{value}/10</span>
            </div>
            <div className={`w-full h-1.5 rounded-full overflow-hidden ${dark ? "bg-white/5" : "bg-gray-100"}`}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value * 10}%` }}
                    transition={{ duration: 1, ease: "circOut" }}
                    className="h-full rounded-full relative"
                    style={{ background: color }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </motion.div>
            </div>
        </div>
    );
}

function ReportCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.03] backdrop-blur-3xl rounded-[32px] border border-white/5 p-8 hover:border-white/10 transition-colors"
        >
            <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[#6605c7] text-lg">{icon}</span>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{title}</span>
            </div>
            {children}
        </motion.div>
    );
}

function ListCard({ title, icon, color, items }: { title: string; icon: string; color: string; items: string[] }) {
    const colorMap: Record<string, { bg: string; text: string; itemBg: string; itemText: string }> = {
        green: { bg: "bg-green-500/10", text: "text-green-500", itemBg: "bg-green-500/5", itemText: "text-green-300" },
        red: { bg: "bg-red-500/10", text: "text-red-500", itemBg: "bg-red-500/5", itemText: "text-red-300" },
        purple: { bg: "bg-[#6605c7]/10", text: "text-[#6605c7]", itemBg: "bg-[#6605c7]/5", itemText: "text-[#a855f7]" },
    };
    const c = colorMap[color] || colorMap.purple;

    return (
        <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[32px] border border-white/5 p-8 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-3 mb-6">
                <div className={`w-8 h-8 rounded-[10px] ${c.bg} flex items-center justify-center`}>
                    <span className={`material-symbols-outlined text-sm ${c.text}`}>{icon}</span>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${c.text}`}>{title}</span>
            </div>
            <div className="space-y-3">
                {items.map((item, i) => (
                    <div key={i} className={`text-xs ${c.itemText} leading-relaxed font-medium flex gap-3 items-start`}>
                        <div className={`w-1 h-1 rounded-full mt-1.5 shrink-0 ${c.text}`} />
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
}
