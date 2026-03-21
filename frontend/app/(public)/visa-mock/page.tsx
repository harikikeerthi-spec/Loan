"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";
import { getConsularVoice } from "../../../lib/consularVoices";
import { aiApi } from "../../../lib/api";

const VisaMockInterview = dynamic(() => import("../../../components/VisaMockInterview"), { ssr: false });

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
    specificity: number;
    consistency: number;
    conciseness: number;
    persuasiveness: number;
    risk: "Low" | "Medium" | "High";
    redFlags: string[];
    missingDetails: string[];
    suggestedImprovement: string[];
    overallScore: number;
    quickTip: string;
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
    ds160Inconsistencies: string[];
    tips: string[];
    verdict: string;
}

const VISA_TYPES = [
    {
        value: "F1 Student Visa",
        label: "F-1 Student Visa",
        desc: "For full-time students at accredited US institutions",
        image: "/images/services/visa-interview.jpg",
        countryTag: "USA",
    },
    {
        value: "Tier 4 UK Student Visa",
        label: "Tier 4 UK Visa",
        desc: "General student visa for studying in the United Kingdom",
        image: "/images/services/uk-bank.jpg",
        countryTag: "UK",
    },
];

export const AGENT_TYPES = [
    { value: "agent_smith", label: "Officer Smith", icon: "security", desc: "Strict and intimidating. Short sentences. No small talk. 20 years of experience.", pitch: 0.55, rate: 0.9 },
    { value: "agent_sarah", label: "Officer Sarah", icon: "psychology", desc: "Friendly and conversational, but catches everything. Feels like a real chat.", pitch: 1.3, rate: 1.05 },
    { value: "agent_michael", label: "Officer Michael", icon: "badge", desc: "Completely neutral and methodical. Clinical, efficient, by-the-book.", pitch: 0.85, rate: 0.98 },
];


const DEFAULT_SECTIONS: InterviewSection[] = [
    { id: "personal_background", label: "Personal Background", completed: false },
    { id: "purpose_of_travel", label: "Purpose of Travel", completed: false },
    { id: "university_program", label: "University & Program", completed: false },
    { id: "academic_history", label: "Academic History", completed: false },
    { id: "funding_finances", label: "Funding & Finances", completed: false },
    { id: "sponsor_details", label: "Sponsor Details", completed: false },
    { id: "ties_home", label: "Ties to Home Country", completed: false },
    { id: "travel_history", label: "Travel History", completed: false },
    { id: "post_study_plans", label: "Post-Study Plans", completed: false },
    { id: "accommodation", label: "Accommodation & Logistics", completed: false },
    { id: "immigration_intent", label: "Immigration Intent", completed: false },
];

/* ────────────────────────── Main Page ────────────────────────── */
export default function VisaMockPage() {
    // Phase: "setup" | "permission" | "interview" | "report"
    const [phase, setPhase] = useState<"setup" | "permission" | "interview" | "report">("setup");
    const [micPermissionGranted, setMicPermissionGranted] = useState(false);
    const [micPermissionError, setMicPermissionError] = useState<string | null>(null);

    // Setup state
    const [visaType, setVisaType] = useState("F1 Student Visa");
    const [agentType, setAgentType] = useState("agent_michael");
    const [profile, setProfile] = useState({
        fullName: "",
        nationality: "Indian",
        age: "",
        occupation: "",
        university: "",
        course: "",
        funding: "",
        previousTravel: "",
        sponsorName: "",
        sponsorRelation: "",
        sponsorIncome: "",
        workExperience: "",
        gpa: "",
    });

    // Interview state
    const [messages, setMessages] = useState<InterviewMessage[]>([]);
    const [currentInput, setCurrentInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentSection, setCurrentSection] = useState("personal_background");
    const [sections, setSections] = useState<InterviewSection[]>(DEFAULT_SECTIONS);
    const [evaluations, setEvaluations] = useState<EvaluationResult[]>([]);
    const [latestEval, setLatestEval] = useState<EvaluationResult | null>(null);
    const [questionCount, setQuestionCount] = useState(0);

    // Report state
    const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
    const [reportLoading, setReportLoading] = useState(false);

    /* ────── Microphone Permission ────── */
    const requestMicPermission = useCallback(async () => {
        setMicPermissionError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Stop the test stream immediately — actual stream will be created by the interview components
            stream.getTracks().forEach((t) => t.stop());
            setMicPermissionGranted(true);
            return true;
        } catch (err: any) {
            const msg =
                err.name === "NotAllowedError"
                    ? "Microphone access was denied. Please allow microphone access in your browser settings and try again."
                    : err.name === "NotFoundError"
                        ? "No microphone detected. Please connect a microphone and try again."
                        : `Microphone error: ${err.message || "Unknown error"}`;
            setMicPermissionError(msg);
            return false;
        }
    }, []);

    const handleStartClick = useCallback(() => {
        setPhase("permission");
    }, []);

    /* ────── API Calls ────── */
    const startInterview = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/ai/visa-interview/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userProfile: profile, visaType, agentType }),
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
    }, [profile, visaType, agentType]);

    const sendAnswer = useCallback(async (overrideText?: string) => {
        const answer = (overrideText || currentInput).trim();
        if (!answer || isLoading) return;
        setCurrentInput("");

        // Cancel any ongoing AI speech
        if (typeof window !== "undefined") window.speechSynthesis.cancel();

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
                    questionNumber: questionCount + 1,
                    agentType,
                }),
            }).then(r => r.json()).catch(() => null),
        ]);

        // Handle evaluation
        if (evalRes?.success && evalRes.evaluation) {
            setLatestEval(evalRes.evaluation);
            setEvaluations(prev => [...prev, evalRes.evaluation]);
        }

        // Handle next question
        if (continueRes?.success) {
            if (continueRes.endInterview) {
                // AI decided to end the interview
                setIsLoading(false);
                endInterview();
                return;
            }

            const officerMsg: InterviewMessage = {
                role: "officer",
                content: continueRes.question,
                timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, officerMsg]);
            setQuestionCount(prev => prev + 1);

            // Update current section from AI response
            if (continueRes.currentSection) {
                setCurrentSection(continueRes.currentSection);
            }

            // Mark completed topics from AI response
            if (continueRes.completedTopics && Array.isArray(continueRes.completedTopics)) {
                setSections(prev =>
                    prev.map(s => ({
                        ...s,
                        completed: continueRes.completedTopics.includes(s.id),
                    }))
                );
            }
        }

        setIsLoading(false);
    }, [currentInput, isLoading, messages, visaType, profile, currentSection, questionCount]);

    const endInterview = useCallback(async () => {
        // Stop all voice activity when ending
        if (typeof window !== "undefined") window.speechSynthesis.cancel();
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
                const userId = typeof window !== "undefined" ? localStorage.getItem("userId") || undefined : undefined;
                try {
                    await aiApi.saveVisaReport({
                        userId,
                        visaType,
                        agentType,
                        userProfile: profile,
                        overallScore: data.report.overallScore || 0,
                        overallRisk: data.report.overallRisk || "Unknown",
                        approvalLikelihood: data.report.approvalLikelihood || "Unknown",
                        sectionScores: data.report.sectionScores || {},
                        strengths: data.report.strengths || [],
                        weaknesses: data.report.weaknesses || [],
                        criticalIssues: data.report.criticalIssues || [],
                        ds160Inconsistencies: data.report.ds160Inconsistencies || [],
                        tips: data.report.tips || [],
                        verdict: data.report.verdict || "",
                        messages,
                        evaluations,
                    });
                } catch (saveErr) {
                    console.error("Failed to save report to database:", saveErr);
                }
            }
        } catch (err) {
            console.error("Failed to generate report:", err);
        }
        setReportLoading(false);
    }, [visaType, agentType, profile, messages, evaluations]);

    const resetAll = useCallback(() => {
        if (typeof window !== "undefined") window.speechSynthesis.cancel();
        setPhase("setup");
        setMessages([]);
        setEvaluations([]);
        setLatestEval(null);
        setQuestionCount(0);
        setCurrentSection("personal_background");
        setSections(DEFAULT_SECTIONS);
        setFinalReport(null);
        setCurrentInput("");
        setMicPermissionGranted(false);
        setMicPermissionError(null);
    }, []);

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
                            agentType={agentType}
                            setAgentType={setAgentType}
                            profile={profile}
                            setProfile={(p) => setProfile(prev => ({ ...prev, ...p }))}
                            onStart={handleStartClick}
                            isLoading={isLoading}
                        />
                    )}
                    {phase === "permission" && (
                        <PermissionPhase
                            key="permission"
                            micPermissionGranted={micPermissionGranted}
                            micPermissionError={micPermissionError}
                            onRequestPermission={requestMicPermission}
                            onStartInterview={startInterview}
                            onBack={() => setPhase("setup")}
                            isLoading={isLoading}
                        />
                    )}
                    {phase === "interview" && (
                        <VisaMockInterview
                            key="video-interview"
                            messages={messages}
                            currentInput={currentInput}
                            setCurrentInput={setCurrentInput}
                            isLoading={isLoading}
                            sections={sections}
                            currentSection={currentSection}
                            latestEval={latestEval}
                            questionCount={questionCount}
                            evaluations={evaluations}
                            onSend={sendAnswer}
                            onEnd={endInterview}
                            visaType={visaType}
                            agentType={agentType}
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
    visaType, setVisaType, agentType, setAgentType, profile, setProfile, onStart, isLoading,
}: {
    visaType: string;
    setVisaType: (v: string) => void;
    agentType: string;
    setAgentType: (v: string) => void;
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
                    Practice your visa interview with our AI consular officer.
                    Real-time evaluation, DS-160 consistency checking, and detailed scoring across 11 interview topics.
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
                                    <div
                                        className={`relative w-14 h-14 rounded-2xl overflow-hidden border transition-colors ${visaType === v.value
                                            ? "border-[#a855f7]/50"
                                            : "border-white/10 group-hover:border-white/20"
                                            }`}
                                    >
                                        <Image
                                            src={v.image}
                                            alt={`${v.label} visual`}
                                            fill
                                            sizes="56px"
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/20" />
                                    </div>
                                    <div>
                                        <div className={`text-xl font-bold transition-colors ${visaType === v.value ? "text-white" : "text-gray-400 group-hover:text-white"}`}>{v.label}</div>
                                        <div className="text-sm text-gray-500 mt-1">{v.desc}</div>
                                        <div className="mt-2 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black tracking-widest text-gray-300 uppercase">
                                            {v.countryTag}
                                        </div>
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

            {/* Agent Type Selection */}
            <div className="w-full max-w-4xl mb-16">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-6 bg-[#6605c7] rounded-full" />
                    <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Select Consular Officer</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {AGENT_TYPES.map((a) => (
                        <div key={a.value} className="relative group">
                            <motion.button
                                whileHover={{ y: -6, scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setAgentType(a.value)}
                                className={`w-full p-6 rounded-3xl border-2 text-left transition-all duration-500 relative overflow-hidden ${agentType === a.value
                                    ? "border-[#6605c7] bg-[#6605c7]/5 shadow-2xl shadow-[#6605c7]/20"
                                    : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                                    }`}
                            >
                                <div className="relative z-10 flex flex-col items-start justify-between min-h-[120px]">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${agentType === a.value ? "bg-[#6605c7] text-white" : "bg-white/5 text-gray-400 group-hover:text-white"
                                            }`}>
                                            <span className="material-symbols-outlined text-2xl">{a.icon}</span>
                                        </div>
                                        <div className={`text-lg font-bold transition-colors ${agentType === a.value ? "text-white" : "text-gray-400 group-hover:text-white"}`}>
                                            {a.label}
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500 mb-2Pr">{a.desc}</div>
                                    {agentType === a.value && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute right-0 top-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                                        >
                                            <span className="material-symbols-outlined text-white text-xs font-black">check</span>
                                        </motion.div>
                                    )}
                                </div>
                                <div className={`absolute -right-10 -bottom-10 w-40 h-40 bg-[#6605c7] blur-[80px] rounded-full transition-opacity duration-500 ${agentType === a.value ? "opacity-10" : "opacity-0"}`} />
                            </motion.button>

                            {/* Voice Preview Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (typeof window !== 'undefined') {
                                        window.speechSynthesis.cancel();
                                        const text = a.value === "agent_smith" ? "I am Officer Smith. State your name and purpose." :
                                            a.value === "agent_sarah" ? "Hi, I'm Officer Sarah. Great to meet you! Why are you visiting us today?" :
                                                "I am Officer Michael. Please provide the required information for your visa application.";
                                        const utt = new SpeechSynthesisUtterance(text);
                                        utt.pitch = a.pitch;
                                        utt.rate = a.rate;
                                        utt.volume = 1;

                                        const voices = window.speechSynthesis.getVoices();
                                        const voice = getConsularVoice(a.value, voices);
                                        if (voice) utt.voice = voice;

                                        window.speechSynthesis.speak(utt);
                                    }
                                }}
                                className="absolute bottom-4 right-4 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-[#6605c7] flex items-center justify-center transition-all group-hover:scale-110"
                                title="Preview Voice"
                            >
                                <span className="material-symbols-outlined text-xs text-white">volume_up</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Start Button */}
            <div className="flex justify-center mt-12 relative z-10">
                <motion.button
                    whileHover={{ y: -4, boxShadow: "0 25px 50px -12px rgba(102, 5, 199, 0.5)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onStart}
                    disabled={isLoading}
                    className="w-full max-w-xl px-12 py-7 bg-gradient-to-r from-[#6605c7] to-[#a855f7] text-white font-black rounded-[35px] text-lg uppercase tracking-[0.2em] disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-500 flex items-center justify-center gap-4 shadow-2xl shadow-[#6605c7]/40"
                >
                    {isLoading ? (
                        <>
                            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            INITIALIZING OFFICER...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-3xl">sensors</span>
                            ENTER INTERVIEW ROOM
                        </>
                    )}
                </motion.button>
            </div>

            {/* Background Noise/Grid */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   PERMISSION PHASE — Mic access gate before interview starts
   ═══════════════════════════════════════════════════════════════ */
function PermissionPhase({
    micPermissionGranted, micPermissionError, onRequestPermission, onStartInterview, onBack, isLoading,
}: {
    micPermissionGranted: boolean;
    micPermissionError: string | null;
    onRequestPermission: () => Promise<boolean>;
    onStartInterview: () => void;
    onBack: () => void;
    isLoading: boolean;
}) {
    const [requesting, setRequesting] = useState(false);
    const [granted, setGranted] = useState(micPermissionGranted);
    const [error, setError] = useState(micPermissionError);

    const handleRequest = async () => {
        setRequesting(true);
        setError(null);
        const ok = await onRequestPermission();
        setGranted(ok);
        if (!ok) {
            setError("Microphone access was denied. Please allow it and try again.");
        }
        setRequesting(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center min-h-[80vh] py-12"
        >
            <div className="w-full max-w-lg text-center">
                {/* Mic Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className="inline-flex items-center justify-center w-32 h-32 rounded-[40px] mb-10 relative mx-auto"
                >
                    <div className={`absolute inset-0 rounded-[40px] blur-[40px] transition-colors duration-500 ${granted ? "bg-green-500/30" : requesting ? "bg-[#6605c7]/30 animate-pulse" : error ? "bg-red-500/20" : "bg-[#6605c7]/20"
                        }`} />
                    <div className={`relative w-full h-full rounded-[40px] border flex items-center justify-center transition-all duration-500 ${granted
                        ? "bg-green-500/10 border-green-500/30"
                        : error
                            ? "bg-red-500/5 border-red-500/20"
                            : "bg-white/[0.03] border-white/10"
                        }`}>
                        {requesting ? (
                            <div className="w-10 h-10 border-3 border-[#6605c7]/30 border-t-[#6605c7] rounded-full animate-spin" />
                        ) : granted ? (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 300 }}
                                className="material-symbols-outlined text-green-400 text-6xl"
                            >
                                mic
                            </motion.span>
                        ) : (
                            <span className={`material-symbols-outlined text-6xl ${error ? "text-red-400" : "text-gray-500"}`}>
                                {error ? "mic_off" : "mic_none"}
                            </span>
                        )}
                    </div>
                </motion.div>

                {/* Title & Status */}
                <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-4">
                    {granted ? "Microphone Ready" : requesting ? "Requesting Access..." : "Microphone Access"}
                </h2>

                {granted ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <p className="text-gray-400 text-base mb-3 leading-relaxed">
                            Microphone access granted. The AI Consular Officer will speak to you and your
                            responses will be captured through your microphone automatically.
                        </p>
                        <div className="flex items-center justify-center gap-2 mb-8">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-black text-green-400 uppercase tracking-[0.2em]">READY FOR TWO-WAY COMMUNICATION</span>
                        </div>

                        {/* How it works */}
                        <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 mb-8 text-left">
                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">How it works</div>
                            <div className="space-y-3">
                                {[
                                    { icon: "smart_toy", text: "AI Officer asks you a question via voice" },
                                    { icon: "mic", text: "Your microphone captures your spoken answer" },
                                    { icon: "send", text: "Answer auto-sends after a brief pause" },
                                    { icon: "loop", text: "Conversation continues naturally back and forth" },
                                ].map((step, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-xl bg-[#6605c7]/10 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-[#a855f7] text-sm">{step.icon}</span>
                                        </div>
                                        <span className="text-sm text-gray-400 font-medium">{step.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ y: -4, boxShadow: "0 25px 50px -12px rgba(102, 5, 199, 0.5)" }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onStartInterview}
                            disabled={isLoading}
                            className="w-full px-8 py-6 bg-gradient-to-r from-[#6605c7] to-[#a855f7] text-white font-black rounded-3xl text-sm uppercase tracking-[0.2em] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-500 flex items-center justify-center gap-4 shadow-2xl shadow-[#6605c7]/20"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    CONNECTING...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-2xl">call</span>
                                    BEGIN INTERVIEW
                                </>
                            )}
                        </motion.button>
                    </motion.div>
                ) : error ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <p className="text-red-400/80 text-sm mb-6 leading-relaxed font-medium">
                            {error}
                        </p>
                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 mb-8 text-left">
                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">How to fix</div>
                            <div className="space-y-2 text-xs text-gray-500 font-medium leading-relaxed">
                                <p>1. Click the lock/camera icon in your browser address bar</p>
                                <p>2. Set Microphone to &quot;Allow&quot;</p>
                                <p>3. Click &quot;Try Again&quot; below</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={onBack}
                                className="flex-1 px-6 py-4 rounded-3xl bg-white/5 border border-white/10 text-gray-400 font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-colors"
                            >
                                GO BACK
                            </button>
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleRequest}
                                disabled={requesting}
                                className="flex-1 px-6 py-4 rounded-3xl bg-gradient-to-r from-[#6605c7] to-[#a855f7] text-white font-black text-sm uppercase tracking-widest disabled:opacity-40 flex items-center justify-center gap-3 shadow-xl"
                            >
                                <span className="material-symbols-outlined text-lg">refresh</span>
                                TRY AGAIN
                            </motion.button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <p className="text-gray-400 text-base mb-3 leading-relaxed">
                            This mock interview uses two-way voice communication.
                            Please grant microphone access to continue.
                        </p>
                        <p className="text-gray-600 text-sm mb-8">
                            Your browser will show a permission prompt when you click the button below.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={onBack}
                                className="flex-1 px-6 py-5 rounded-3xl bg-white/5 border border-white/10 text-gray-400 font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-colors"
                            >
                                GO BACK
                            </button>
                            <motion.button
                                whileHover={{ y: -2, boxShadow: "0 20px 40px -10px rgba(102, 5, 199, 0.4)" }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleRequest}
                                disabled={requesting}
                                className="flex-1 px-6 py-5 rounded-3xl bg-gradient-to-r from-[#6605c7] to-[#a855f7] text-white font-black text-sm uppercase tracking-widest disabled:opacity-40 flex items-center justify-center gap-3 shadow-xl"
                            >
                                <span className="material-symbols-outlined text-xl">mic</span>
                                GRANT MIC ACCESS
                            </motion.button>
                        </div>
                    </motion.div>
                )}
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
                {report.ds160Inconsistencies && report.ds160Inconsistencies.length > 0 && (
                    <ListCard title="DS-160 Inconsistencies" icon="rule" color="red" items={report.ds160Inconsistencies} />
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
