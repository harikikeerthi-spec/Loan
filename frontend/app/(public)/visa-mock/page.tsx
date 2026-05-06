"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";
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

interface InterviewDraft {
    visaType: string;
    agentType: string;
    profile: Record<string, string>;
    messages: InterviewMessage[];
    sections: InterviewSection[];
    currentSection: string;
    questionCount: number;
    evaluations: EvaluationResult[];
    latestEval: EvaluationResult | null;
    updatedAt: string;
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
    { value: "agent_smith", label: "Officer Smith", icon: "security", desc: "Strict and intimidating. Short sentences. No small talk. 20 years of experience.", pitch: 0.88, rate: 0.94, avatar: "/images/agents/officer_smith.png" },
    { value: "agent_sarah", label: "Officer Sarah", icon: "psychology", desc: "Friendly and conversational, but catches everything. Feels like a real chat.", pitch: 1.04, rate: 1.0, avatar: "/images/agents/officer_sarah.png" },
    { value: "agent_michael", label: "Officer Michael", icon: "badge", desc: "Completely neutral and methodical. Clinical, efficient, by-the-book.", pitch: 0.95, rate: 0.96, avatar: "/images/agents/officer_michael.png" },
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

const INTERVIEW_DRAFT_STORAGE_KEY = "visa_mock_interview_draft_v1";

async function fetchJsonWithTimeout(url: string, options: RequestInit, timeoutMs = 18000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return await response.json();
    } finally {
        clearTimeout(timer);
    }
}

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
    const [recoveryHint, setRecoveryHint] = useState<string | null>(null);

    // Report state
    const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
    const [reportLoading, setReportLoading] = useState(false);

    const saveInterviewDraft = useCallback(() => {
        if (typeof window === "undefined") return;
        if (phase !== "interview") return;

        const payload: InterviewDraft = {
            visaType,
            agentType,
            profile,
            messages,
            sections,
            currentSection,
            questionCount,
            evaluations,
            latestEval,
            updatedAt: new Date().toISOString(),
        };

        localStorage.setItem(INTERVIEW_DRAFT_STORAGE_KEY, JSON.stringify(payload));
    }, [
        phase,
        visaType,
        agentType,
        profile,
        messages,
        sections,
        currentSection,
        questionCount,
        evaluations,
        latestEval,
    ]);

    const clearInterviewDraft = useCallback(() => {
        if (typeof window === "undefined") return;
        localStorage.removeItem(INTERVIEW_DRAFT_STORAGE_KEY);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const raw = localStorage.getItem(INTERVIEW_DRAFT_STORAGE_KEY);
            if (!raw) return;

            const draft = JSON.parse(raw) as InterviewDraft;
            if (!draft.messages?.length) return;

            setVisaType(draft.visaType || "F1 Student Visa");
            setAgentType(draft.agentType || "agent_michael");
            setProfile((prev) => ({ ...prev, ...(draft.profile || {}) }));
            setMessages(draft.messages || []);
            setSections(draft.sections?.length ? draft.sections : DEFAULT_SECTIONS);
            setCurrentSection(draft.currentSection || "personal_background");
            setQuestionCount(draft.questionCount || 0);
            setEvaluations(draft.evaluations || []);
            setLatestEval(draft.latestEval || null);
            setPhase("interview");
            setRecoveryHint("Recovered previous mock interview session.");
        } catch {
            localStorage.removeItem(INTERVIEW_DRAFT_STORAGE_KEY);
        }
    }, []);

    useEffect(() => {
        saveInterviewDraft();
    }, [saveInterviewDraft]);

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
        setRecoveryHint(null);
        try {
            const data = await fetchJsonWithTimeout(
                "/api/ai/visa-interview/start",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userProfile: profile, visaType, agentType }),
                },
                22000
            );
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
                return;
            }
            setRecoveryHint(data?.message || "Unable to start interview. Please retry.");
        } catch (err) {
            console.error("Failed to start interview:", err);
            setRecoveryHint("Connection issue while starting interview. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [profile, visaType, agentType]);

    const sendAnswer = useCallback(async (overrideText?: string) => {
        const answer = (overrideText || currentInput).trim();
        if (!answer || isLoading) return;
        setCurrentInput("");
        setRecoveryHint(null);

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

        try {
            // Parallel: evaluate + get next question
            const [evalRes, continueRes] = await Promise.all([
                fetchJsonWithTimeout(
                    "/api/ai/visa-interview/evaluate",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            visaType,
                            question: lastOfficerMsg?.content || "",
                            transcript: answer,
                        }),
                    },
                    18000
                ).catch(() => null),

                fetchJsonWithTimeout(
                    "/api/ai/visa-interview/continue",
                    {
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
                    },
                    22000
                ).catch(() => null),
            ]);

            // Handle evaluation
            if (evalRes?.success && evalRes.evaluation) {
                setLatestEval(evalRes.evaluation);
                setEvaluations(prev => [...prev, evalRes.evaluation]);
            }

            // Handle next question
            if (continueRes?.success && continueRes.question) {
                const completedCount = sections.filter((s) => s.completed).length;
                const totalSections = sections.length;
                const hasCompletedAllSections = completedCount >= totalSections;
                const hasAskedMinimumQuestions = questionCount >= totalSections;

                // End only after full topic coverage and enough questions.
                if (continueRes.endInterview && hasCompletedAllSections && hasAskedMinimumQuestions) {
                    setIsLoading(false);
                    setTimeout(() => {
                        void endInterview();
                    }, 0);
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

                return;
            }

            // Fallback question prevents dead-end when continue API fails mid-session
            const fallbackOfficerMsg: InterviewMessage = {
                role: "officer",
                content: "I could not process that response fully. Please continue: why is this program and university the right fit for your goals?",
                timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, fallbackOfficerMsg]);
            setQuestionCount(prev => prev + 1);
            setRecoveryHint("Recovered from a temporary connection issue. Interview continued.");
        } catch (err) {
            console.error("Failed to continue interview:", err);
            setRecoveryHint("Temporary interruption detected. Please resend your answer.");
        } finally {
            setIsLoading(false);
        }
    }, [
        currentInput,
        isLoading,
        messages,
        visaType,
        profile,
        currentSection,
        questionCount,
        agentType,
        sections,
    ]);

    const endInterview = useCallback(async () => {
        // Stop all voice activity when ending
        if (typeof window !== "undefined") window.speechSynthesis.cancel();
        setReportLoading(true);
        setPhase("report");
        clearInterviewDraft();
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
    }, [visaType, agentType, profile, messages, evaluations, clearInterviewDraft]);

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
        setRecoveryHint(null);
        clearInterviewDraft();
    }, [clearInterviewDraft]);

    /* ────── Render ────── */
    return (
        <div className="min-h-screen bg-[#fcfdff] text-gray-900 overflow-x-hidden selection:bg-[#6605c7] selection:text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
                {/* Background Decorative Elements */}
                <div className="fixed inset-0 pointer-events-none -z-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#6605c7]/5 blur-[150px] rounded-full" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#a855f7]/5 blur-[150px] rounded-full" />
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
                        <>
                            {recoveryHint && (
                                <div className="mx-auto max-w-5xl mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 font-medium shadow-sm">
                                    {recoveryHint}
                                </div>
                            )}
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
                        </>
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
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);
    const previewAudioUrlRef = useRef<string | null>(null);
    const lastRequestIdRef = useRef<number>(0);
    const [previewError, setPreviewError] = useState<string | null>(null);

    const playPreviewVoice = useCallback(async (agentValue: string, text: string) => {
        const requestId = ++lastRequestIdRef.current;
        try {
            setPreviewError(null);
            if (previewAudioRef.current) {
                previewAudioRef.current.pause();
                previewAudioRef.current = null;
            }
            if (previewAudioUrlRef.current) {
                URL.revokeObjectURL(previewAudioUrlRef.current);
                previewAudioUrlRef.current = null;
            }

            const response = await fetch("/api/ai/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text,
                    agentType: agentValue,
                    speed: 1,
                }),
            });

            if (requestId !== lastRequestIdRef.current) return;

            if (!response.ok) {
                const errPayload = await response.json().catch(() => null);
                const serverMessage = errPayload?.message || "Preview voice unavailable.";
                setPreviewError(serverMessage);
                return;
            }

            const audioBlob = await response.blob();
            if (requestId !== lastRequestIdRef.current) return;

            if (!audioBlob.size) {
                setPreviewError("Preview voice returned empty audio.");
                return;
            }
            const audioUrl = URL.createObjectURL(audioBlob);
            previewAudioUrlRef.current = audioUrl;
            const audio = new Audio(audioUrl);
            previewAudioRef.current = audio;
            
            if (requestId === lastRequestIdRef.current) {
                await audio.play();
            }
        } catch (err) {
            if (requestId === lastRequestIdRef.current) {
                console.error("Voice preview failed:", err);
                setPreviewError("Voice preview unavailable.");
            }
        }
    }, []);

    useEffect(() => {
        return () => {
            if (previewAudioRef.current) {
                previewAudioRef.current.pause();
            }
            if (previewAudioUrlRef.current) {
                URL.revokeObjectURL(previewAudioUrlRef.current);
            }
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center min-h-[80vh] py-16"
        >
            {/* Hero */}
            <div className="text-center mb-16 px-4">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-8 relative group"
                >
                    <div className="absolute inset-0 bg-[#6605c7] rounded-3xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
                    <div className="relative w-full h-full rounded-2xl bg-white border border-[#6605c7]/10 flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-[#6605c7] text-4xl">psychology</span>
                    </div>
                </motion.div>
                <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight mb-6 uppercase">
                    MOCK <span className="text-[#6605c7] italic">SIMULATOR</span>
                </h1>
                <p className="text-gray-500 text-base max-w-2xl mx-auto font-medium leading-relaxed">
                    Practice your visa interview with our AI consular officer.
                    Real-time evaluation, DS-160 consistency checking, and detailed feedback to boost your confidence.
                </p>
            </div>

            {/* Visa Type Selection */}
            <div className="w-full max-w-4xl mb-16">
                <div className="flex items-center gap-3 mb-8 justify-center sm:justify-start">
                    <span className="inline-block px-3 py-1 rounded-full bg-[#6605c7]/5 text-[#6605c7] text-[10px] font-black uppercase tracking-widest border border-[#6605c7]/10">Step 01</span>
                    <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Select Your Visa Path</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {VISA_TYPES.map((v) => (
                        <motion.button
                            key={v.value}
                            whileHover={{ y: -6 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setVisaType(v.value)}
                            className={`p-8 rounded-2xl border transition-all duration-400 text-left relative overflow-hidden group ${visaType === v.value
                                ? "border-[#6605c7] bg-white shadow-2xl shadow-[#6605c7]/10"
                                : "border-gray-100 bg-white/60 hover:bg-white hover:border-gray-200 shadow-sm"
                                }`}
                        >
                            <div className="relative z-10 flex items-start gap-5">
                                <div
                                    className={`relative w-16 h-16 rounded-xl overflow-hidden border shrink-0 transition-all ${visaType === v.value
                                        ? "border-[#6605c7]/30 scale-105"
                                        : "border-gray-100 grayscale hover:grayscale-0"
                                        }`}
                                >
                                    <Image
                                        src={v.image}
                                        alt={v.label}
                                        fill
                                        sizes="64px"
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/5" />
                                </div>
                                <div className="flex-1">
                                    <h3 className={`text-lg font-black transition-colors ${visaType === v.value ? "text-gray-900" : "text-gray-500 group-hover:text-gray-900"}`}>{v.label}</h3>
                                    <p className="text-[13px] text-gray-500 mt-1 leading-relaxed font-medium">{v.desc}</p>
                                    <div className={`mt-3 inline-flex items-center rounded-lg px-2.5 py-1 text-[9px] font-black tracking-widest uppercase transition-all ${
                                        visaType === v.value ? "bg-[#6605c7] text-white" : "bg-gray-100 text-gray-400"
                                    }`}>
                                        {v.countryTag}
                                    </div>
                                </div>
                                {visaType === v.value && (
                                    <div className="w-5 h-5 rounded-full bg-[#6605c7] text-white flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-[14px] font-black">check</span>
                                    </div>
                                )}
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Agent Type Selection */}
            <div className="w-full max-w-4xl mb-16">
                <div className="flex items-center gap-3 mb-8 justify-center sm:justify-start">
                    <span className="inline-block px-3 py-1 rounded-full bg-[#6605c7]/5 text-[#6605c7] text-[10px] font-black uppercase tracking-widest border border-[#6605c7]/10">Step 02</span>
                    <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Choose Your Interviewer</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {AGENT_TYPES.map((a) => (
                        <div key={a.value} className="relative group">
                            <motion.button
                                whileHover={{ y: -6 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setAgentType(a.value)}
                                className={`w-full p-6 h-full rounded-2xl border transition-all duration-400 text-left relative overflow-hidden ${agentType === a.value
                                    ? "border-[#6605c7] bg-white shadow-2xl shadow-[#6605c7]/10"
                                    : "border-gray-100 bg-white/60 hover:bg-white hover:border-gray-200 shadow-sm"
                                    }`}
                            >
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className={`w-12 h-12 rounded-xl overflow-hidden border transition-all ${
                                            agentType === a.value ? "border-[#6605c7]/30 scale-105" : "border-gray-100"
                                        }`}>
                                            <img src={a.avatar} alt={a.label} className="w-full h-full object-cover" />
                                        </div>
                                        <div className={`font-black text-[15px] transition-colors ${agentType === a.value ? "text-gray-900" : "text-gray-500 group-hover:text-gray-900"}`}>
                                            {a.label}
                                        </div>
                                    </div>
                                    <p className="text-[12px] text-gray-500 leading-relaxed font-medium mb-8 flex-1">
                                        {a.desc}
                                    </p>
                                    
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const text = a.value === "agent_smith" ? "Good morning. I am Officer Smith. State your full name." :
                                                        a.value === "agent_sarah" ? "Hi, I am Officer Sarah. Nice to meet you. Could you tell me your name?" :
                                                        "Good morning. I am Officer Michael. Please state your full name.";
                                            void playPreviewVoice(a.value, text);
                                        }}
                                        className="inline-flex items-center gap-2 text-[10px] font-black text-[#6605c7] uppercase tracking-widest hover:gap-3 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-base">volume_up</span>
                                        Preview Voice
                                    </button>

                                    {agentType === a.value && (
                                        <div className="absolute right-4 top-4 w-5 h-5 rounded-full bg-[#6605c7] text-white flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[14px] font-black">check</span>
                                        </div>
                                    )}
                                </div>
                            </motion.button>
                        </div>
                    ))}
                </div>
                {previewError && (
                    <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-100 text-[11px] font-bold text-amber-700 flex items-center gap-2 animate-shake">
                        <span className="material-symbols-outlined text-base">error</span>
                        {previewError}
                    </div>
                )}
            </div>

            {/* Start Button */}
            <div className="w-full max-w-xl">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onStart}
                    disabled={isLoading}
                    className="w-full py-6 bg-[#6605c7] text-white font-black rounded-2xl text-[13px] uppercase tracking-[0.25em] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-[#6605c7]/30 hover:shadow-2xl hover:bg-[#5204a0] flex items-center justify-center gap-4"
                >
                    {isLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Initializing Room...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-2xl">sensors</span>
                            Enter Interview Room
                        </>
                    )}
                </motion.button>
            </div>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   PERMISSION PHASE
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
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col items-center justify-center min-h-[80vh] py-16"
        >
            <div className="w-full max-w-xl text-center">
                {/* Mic Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className="inline-flex items-center justify-center w-28 h-28 rounded-3xl mb-12 relative mx-auto"
                >
                    <div className={`absolute inset-0 rounded-3xl blur-[30px] transition-colors duration-500 ${
                        granted ? "bg-green-500/10" : requesting ? "bg-[#6605c7]/10 animate-pulse" : error ? "bg-red-500/10" : "bg-[#6605c7]/5"
                    }`} />
                    <div className={`relative w-full h-full rounded-2xl bg-white border flex items-center justify-center transition-all duration-500 ${
                        granted ? "border-green-200" : error ? "border-red-200" : "border-gray-100 shadow-sm"
                    }`}>
                        {requesting ? (
                            <div className="w-8 h-8 border-2 border-[#6605c7]/30 border-t-[#6605c7] rounded-full animate-spin" />
                        ) : granted ? (
                            <span className="material-symbols-outlined text-green-500 text-5xl">mic</span>
                        ) : (
                            <span className={`material-symbols-outlined text-5xl ${error ? "text-red-400" : "text-gray-300"}`}>
                                {error ? "mic_off" : "mic_none"}
                            </span>
                        )}
                    </div>
                </motion.div>

                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-4">
                    {granted ? "Microphone Ready" : requesting ? "Authorizing..." : "Voice Access Required"}
                </h2>

                {granted ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <p className="text-gray-500 text-base mb-10 leading-relaxed font-medium">
                            Your microphone is now connected. The AI Officer will correspond via voice, and your verbal responses will be analyzed in real-time.
                        </p>

                        <div className="bg-white/60 border border-gray-100 rounded-2xl p-8 mb-10 text-left shadow-sm">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Simulation Workflow</div>
                            <div className="space-y-4">
                                {[
                                    { icon: "hearing", text: "Listen to the officer's verbal query", color: "text-[#6605c7]" },
                                    { icon: "mic", text: "Speak your response clearly into the mic", color: "text-blue-500" },
                                    { icon: "bolt", text: "AI analyzes response & continues naturally", color: "text-amber-500" },
                                ].map((step, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                                            <span className={`material-symbols-outlined ${step.color} text-base`}>{step.icon}</span>
                                        </div>
                                        <span className="text-[13px] text-gray-600 font-bold">{step.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={onStartInterview}
                            disabled={isLoading}
                            className="w-full py-6 bg-[#6605c7] text-white font-black rounded-2xl text-[13px] uppercase tracking-[0.25em] shadow-xl hover:bg-[#5204a0] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Start Simulation"}
                        </button>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0 }}>
                        <p className="text-gray-500 text-base mb-10 leading-relaxed font-medium">
                            To replicate a real interview environment, this simulation uses high-precision voice recognition.
                        </p>
                        
                        {error && (
                            <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-[11px] font-bold text-red-700 mb-8 text-left">
                                <span className="material-symbols-outlined text-base align-middle mr-2">error</span>
                                {error}
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={onBack}
                                className="flex-1 py-5 rounded-2xl bg-white border border-gray-100 text-gray-400 font-black text-[11px] uppercase tracking-widest hover:bg-gray-50 transition-all"
                            >
                                Go Back
                            </button>
                            <button
                                onClick={handleRequest}
                                disabled={requesting}
                                className="flex-[2] py-5 rounded-2xl bg-[#6605c7] text-white font-black text-[11px] uppercase tracking-widest hover:bg-[#5204a0] transition-all shadow-lg"
                            >
                                {requesting ? "Waiting..." : "Grant Mic Access"}
                            </button>
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
                className="flex flex-col items-center justify-center min-h-[70vh] py-16"
            >
                <div className="w-20 h-20 rounded-3xl bg-[#6605c7]/5 flex items-center justify-center mb-8 border border-[#6605c7]/10">
                    <div className="w-8 h-8 border-3 border-[#6605c7]/20 border-t-[#6605c7] rounded-full animate-spin" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tight">Synthesizing Feedback</h2>
                <p className="text-[13px] text-gray-500 font-medium">Analyzing conversation nodes and evaluation metrics...</p>
            </motion.div>
        );
    }

    if (!report) {
        return (
            <div className="text-center py-32">
                <span className="material-symbols-outlined text-5xl text-gray-200 mb-6 font-thin">sentiment_dissatisfied</span>
                <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Synthesis Failed</p>
                <button onClick={onRestart} className="mt-8 px-8 py-4 bg-[#6605c7] text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg">
                    Retry Interview
                </button>
            </div>
        );
    }

    const likelihoodColor = {
        "Very Likely": "text-green-600 bg-green-50 border-green-100",
        "Likely": "text-green-500 bg-green-50 border-green-100",
        "Uncertain": "text-yellow-600 bg-yellow-50 border-yellow-100",
        "Unlikely": "text-red-500 bg-red-50 border-red-100",
        "Very Unlikely": "text-red-600 bg-red-50 border-red-100",
    }[report.approvalLikelihood] || "text-gray-500 bg-gray-50 border-gray-100";

    const scoreColor = report.overallScore >= 70 ? "text-green-500" : report.overallScore >= 40 ? "text-amber-500" : "text-red-500";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-16 gap-8"
        >
            {/* Main Report Card */}
            <div className="w-full max-w-5xl bg-white border border-gray-100 rounded-[32px] p-10 md:p-12 shadow-2xl shadow-[#6605c7]/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#6605c7]/5 blur-[80px] rounded-full -mr-32 -mt-32" />
                
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 relative z-10">
                    <div className="max-w-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="inline-block px-3 py-1 rounded-full bg-[#6605c7]/5 text-[#6605c7] text-[10px] font-black uppercase tracking-widest border border-[#6605c7]/10">Official Audit</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date().toLocaleDateString()}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight uppercase italic mb-6">
                            Consular <span className="text-[#6605c7]">Performance</span> Audit
                        </h1>
                        <p className="text-base text-gray-500 leading-relaxed font-medium">
                            Our AI audit system has processed your mock session. Below is your detailed breakdown of strengths, risks, and necessary strategic pivots.
                        </p>
                    </div>
                    
                    <div className="flex flex-col items-start md:items-end">
                        <div className="text-7xl font-black font-display tracking-tighter leading-none mb-4 italic">
                            <span className={scoreColor}>{report.overallScore}</span>
                            <span className="text-xl text-gray-300 font-bold ml-1 uppercase">Score</span>
                        </div>
                        <div className={`px-5 py-2.5 rounded-full border text-[11px] font-black uppercase tracking-[0.2em] shadow-sm flex items-center gap-2 ${likelihoodColor}`}>
                            <span className="material-symbols-outlined text-lg">verified</span>
                            {report.approvalLikelihood}
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex flex-wrap gap-4 pt-10 border-t border-gray-50 relative z-10">
                    <button onClick={() => window.print()} className="px-8 py-4 bg-gray-900 text-white font-black rounded-2xl text-[11px] uppercase tracking-widest transition-all hover:bg-black shadow-lg shadow-black/10 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">download</span> Export Audit
                    </button>
                    <button onClick={onRestart} className="px-8 py-4 bg-white border border-gray-100 text-[#6605c7] font-black rounded-2xl text-[11px] uppercase tracking-widest transition-all hover:bg-gray-50 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">refresh</span> New Simulation
                    </button>
                </div>
            </div>

            {/* Metrics Triple Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                <MetricBox title="Risk Profile" icon="security">
                    <div className={`text-4xl font-black uppercase tracking-tight italic ${
                        report.overallRisk === "Low" ? "text-green-500" : report.overallRisk === "Medium" ? "text-amber-500" : "text-red-500"
                    }`}>
                        {report.overallRisk}
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">{report.overallRisk === "Low" ? "Acceptable Stability" : "Intervention Required"}</p>
                </MetricBox>
                <MetricBox title="Engagement Data" icon="hub">
                    <div className="flex items-end gap-6">
                        <div>
                            <div className="text-4xl font-black text-gray-900 italic">{messages.filter(m => m.role === "officer").length}</div>
                            <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Queries</div>
                        </div>
                        <div className="h-10 w-px bg-gray-100" />
                        <div>
                            <div className="text-4xl font-black text-gray-900 italic">{evaluations.length}</div>
                            <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Evaluated</div>
                        </div>
                    </div>
                </MetricBox>
                <MetricBox title="Synaptic Score" icon="analytics">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-4 border-[#6605c7]/10 border-t-[#6605c7] flex items-center justify-center font-black text-sm text-[#6605c7] italic">
                            {report.overallScore}%
                        </div>
                        <div className="text-[10px] text-gray-500 font-bold leading-relaxed uppercase tracking-widest">Global Percentile Standing</div>
                    </div>
                </MetricBox>
            </div>

            {/* Section Progress Bars */}
            <div className="w-full max-w-5xl bg-white/60 border border-gray-100 rounded-[32px] p-10 shadow-sm backdrop-blur-sm">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] mb-10 text-center">Sectional Performance Matrix</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {Object.entries(report.sectionScores || {}).map(([key, val]) => (
                        <div key={key}>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[11px] font-black text-gray-600 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</span>
                                <span className={`text-[13px] font-black italic ${(val as number) >= 7 ? "text-green-500" : "text-amber-500"}`}>{(val as number) * 10}%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(val as number) * 10}%` }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className={`h-full rounded-full ${(val as number) >= 7 ? "bg-green-500" : "bg-amber-500"}`} 
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Strength/Weakness Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
                {report.strengths.length > 0 && (
                    <FeedbackList title="Elite Signals" icon="verified" color="text-green-500" items={report.strengths} />
                )}
                {report.weaknesses.length > 0 && (
                    <FeedbackList title="Risk Signal" icon="warning" color="text-amber-500" items={report.weaknesses} />
                )}
                {report.criticalIssues.length > 0 && (
                    <FeedbackList title="Critical Faults" icon="dangerous" color="text-red-500" items={report.criticalIssues} />
                )}
                {report.ds160Inconsistencies?.length > 0 && (
                    <FeedbackList title="Data Variance" icon="rule" color="text-blue-500" items={report.ds160Inconsistencies} />
                )}
                {report.tips.length > 0 && (
                    <FeedbackList title="Pivot Strategy" icon="lightbulb" color="text-[#6605c7]" items={report.tips} isLarge />
                )}
            </div>

            {/* Verdict */}
            {report.verdict && (
                <div className="w-full max-w-5xl">
                    <div className="p-12 rounded-[40px] bg-gray-900 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#6605c7]/20 to-transparent" />
                        <div className="flex items-center gap-4 mb-8 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-[#6605c7] flex items-center justify-center shadow-lg">
                                <span className="material-symbols-outlined text-white text-2xl">gavel</span>
                            </div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] italic text-[#a855f7]">Final Executive Verdict</h4>
                        </div>
                        <p className="text-xl md:text-2xl font-black italic leading-relaxed text-purple-50 underline decoration-[#6605c7] decoration-4 underline-offset-8 relative z-10">
                            "{report.verdict}"
                        </p>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   UI MINI-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function MetricBox({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
    return (
        <div className="bg-white/60 border border-gray-100 rounded-3xl p-8 shadow-sm backdrop-blur-sm group hover:border-[#6605c7]/20 transition-all">
            <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[#6605c7] text-xl font-black">{icon}</span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</span>
            </div>
            {children}
        </div>
    );
}

function FeedbackList({ title, icon, color, items, isLarge }: { title: string; icon: string; color: string; items: string[]; isLarge?: boolean }) {
    return (
        <div className={`bg-white border border-gray-50 rounded-3xl p-8 shadow-sm ${isLarge ? "md:col-span-2 lg:col-span-1" : ""}`}>
            <div className="flex items-center gap-3 mb-8">
                <span className={`material-symbols-outlined ${color} text-2xl`}>{icon}</span>
                <span className={`text-[12px] font-black uppercase tracking-[0.16em] ${color}`}>{title}</span>
            </div>
            <div className="space-y-4">
                {items.map((it, idx) => (
                    <div key={idx} className="flex gap-4 items-start">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${color.replace('text', 'bg')}`} />
                        <span className="text-[13px] text-gray-600 font-bold leading-relaxed">{it}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
