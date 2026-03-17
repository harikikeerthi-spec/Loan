"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AGENT_TYPES } from "../app/(public)/visa-mock/page";

/* ────────── Types (shared with page) ────────── */
export interface InterviewMessage {
    role: "officer" | "applicant";
    content: string;
    timestamp: string;
}

export interface EvaluationResult {
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

export interface InterviewSection {
    id: string;
    label: string;
    completed: boolean;
}

/* ────────── Props ────────── */
interface VisaMockInterviewProps {
    messages: InterviewMessage[];
    currentInput: string;
    setCurrentInput: (v: string) => void;
    isLoading: boolean;
    onSend: (overrideText?: string) => void;
    onEnd: () => void;
    visaType: string;
    agentType: string;
    latestEval: EvaluationResult | null;
    sections: InterviewSection[];
    currentSection: string;
    questionCount: number;
    evaluations: EvaluationResult[];
}

/* ════════════════════════════════════════════════════════════
   VisaMockInterview – Immersive Embassy‑style Interview
   ════════════════════════════════════════════════════════════ */
export default function VisaMockInterview({
    messages,
    currentInput,
    setCurrentInput,
    isLoading,
    onSend,
    onEnd,
    visaType,
    agentType,
    latestEval,
    sections,
    currentSection,
    questionCount,
    evaluations,
}: VisaMockInterviewProps) {
    /* ── Local media (WebRTC getUserMedia) ── */
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [cameraOn, setCameraOn] = useState(true);
    const [micOn, setMicOn] = useState(true);
    const [mediaReady, setMediaReady] = useState(false);
    const [mediaError, setMediaError] = useState<string | null>(null);

    /* ── Audio analysis (Web Audio API) ── */
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const rafRef = useRef<number>(0);
    const [userAudioLevel, setUserAudioLevel] = useState(0);

    /* ── AI speaking state ── */
    const [aiSpeaking, setAiSpeaking] = useState(false);

    /* ── Resolved agent info ── */
    const agentInfo = AGENT_TYPES.find(a => a.value === agentType) || AGENT_TYPES[2];

    /* ── Typewriter effect for officer message ── */
    const [displayedText, setDisplayedText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const lastOfficerMsg = [...messages].reverse().find(m => m.role === "officer");

    useEffect(() => {
        if (!lastOfficerMsg) return;
        const text = lastOfficerMsg.content;
        setIsTyping(true);
        setDisplayedText("");
        let i = 0;
        const interval = setInterval(() => {
            i++;
            setDisplayedText(text.slice(0, i));
            if (i >= text.length) {
                clearInterval(interval);
                setIsTyping(false);
            }
        }, 25);
        return () => clearInterval(interval);
    }, [lastOfficerMsg?.content]);

    /* ── Voice selection for distinct agent voices ── */
    const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
    useEffect(() => {
        if (typeof window === "undefined" || !window.speechSynthesis) return;
        const pickVoice = () => {
            const voices = window.speechSynthesis.getVoices();
            if (!voices.length) return;

            const voicePrefs: Record<string, { patterns: RegExp[]; gender: string }> = {
                agent_smith: {
                    patterns: [/david/i, /daniel/i, /mark/i, /google uk english male/i, /male/i],
                    gender: "male",
                },
                agent_sarah: {
                    patterns: [/zira/i, /samantha/i, /karen/i, /victoria/i, /google uk english female/i, /female/i],
                    gender: "female",
                },
                agent_michael: {
                    patterns: [/alex/i, /tom/i, /james/i, /fred/i, /google us english/i, /male/i],
                    gender: "male",
                },
            };

            const pref = voicePrefs[agentType] || voicePrefs.agent_michael;
            const englishVoices = voices.filter(v => v.lang.startsWith("en"));

            let matchedVoice: SpeechSynthesisVoice | null = null;
            for (const pat of pref.patterns) {
                matchedVoice = englishVoices.find(v => pat.test(v.name)) || null;
                if (matchedVoice) break;
            }

            selectedVoiceRef.current = matchedVoice || englishVoices[0] || voices[0];
        };
        pickVoice();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = pickVoice;
        }
    }, [agentType]);

    /* ── Speech Recognition ── */
    const recognitionRef = useRef<any>(null);
    const [isListening, setIsListening] = useState(false);
    const [interimTranscript, setInterimTranscript] = useState("");
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const accumulatedRef = useRef("");
    const autoSendRef = useRef<() => void>(() => { });
    const intentionalStopRef = useRef(false);

    /* ── Transcript log ── */
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [showTranscript, setShowTranscript] = useState(false);

    /* ── Quick tip visibility ── */
    const [showTip, setShowTip] = useState(false);

    /* ── Duration timer ── */
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setElapsed((p) => p + 1), 1000);
        return () => clearInterval(t);
    }, []);
    const fmtTime = (s: number) =>
        `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    /* ═══════════════ Initialise WebRTC media ═══════════════ */
    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            try {
                const ms = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
                    audio: true,
                });
                if (cancelled) {
                    ms.getTracks().forEach((t) => t.stop());
                    return;
                }
                streamRef.current = ms;
                if (videoRef.current) {
                    videoRef.current.srcObject = ms;
                }

                /* Audio analyser */
                const ctx = new AudioContext();
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 256;
                const src = ctx.createMediaStreamSource(ms);
                src.connect(analyser);
                audioCtxRef.current = ctx;
                analyserRef.current = analyser;

                const buf = new Uint8Array(analyser.frequencyBinCount);
                const tick = () => {
                    analyser.getByteFrequencyData(buf);
                    const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
                    setUserAudioLevel(avg / 128);
                    rafRef.current = requestAnimationFrame(tick);
                };
                tick();

                setMediaReady(true);
            } catch (err: any) {
                console.error("getUserMedia failed:", err);
                setMediaError(err.message || "Camera/mic access denied");
                setMediaReady(true);
            }
        };

        init();
        return () => {
            cancelled = true;
            cancelAnimationFrame(rafRef.current);
            streamRef.current?.getTracks().forEach((t) => t.stop());
            audioCtxRef.current?.close().catch(() => { });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ═══════════════ Speech Recognition ═══════════════ */
    useEffect(() => {
        if (typeof window === "undefined") return;
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) return;

        const rec = new SR();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";

        rec.onresult = (e: any) => {
            let interim = "";
            let finalText = "";
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const t = e.results[i][0].transcript;
                if (e.results[i].isFinal) finalText += t;
                else interim += t;
            }
            if (finalText) {
                accumulatedRef.current = (accumulatedRef.current + " " + finalText).trim();
                setCurrentInput(accumulatedRef.current);
                setInterimTranscript("");
            } else {
                setInterimTranscript(interim);
            }

            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            const silenceDelay = questionCount <= 1 ? 3000 : 2200;
            silenceTimerRef.current = setTimeout(() => {
                autoSendRef.current();
            }, silenceDelay);
        };

        rec.onend = () => {
            setIsListening(false);
            if (!intentionalStopRef.current) {
                setTimeout(() => {
                    try {
                        rec.start();
                        setIsListening(true);
                    } catch (_) { }
                }, 300);
            }
            intentionalStopRef.current = false;
        };
        rec.onerror = (e: any) => {
            if (e.error === "aborted" || e.error === "no-speech") return;
            setIsListening(false);
        };

        recognitionRef.current = rec;
    }, [setCurrentInput]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !aiSpeaking) {
            if (isListening) {
                intentionalStopRef.current = true;
                try { recognitionRef.current.stop(); } catch (_) { }
            }
            setCurrentInput("");
            accumulatedRef.current = "";
            setInterimTranscript("");
            intentionalStopRef.current = false;
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (_) {
                setTimeout(() => {
                    try {
                        recognitionRef.current?.start();
                        setIsListening(true);
                    } catch (_) { }
                }, 200);
            }
        }
    }, [isListening, aiSpeaking, setCurrentInput]);

    const stopListening = useCallback(() => {
        intentionalStopRef.current = true;
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    const toggleListening = useCallback(() => {
        if (isListening) stopListening();
        else startListening();
    }, [isListening, startListening, stopListening]);

    /* ═══════════════ Auto-send after silence ═══════════════ */
    const autoSend = useCallback(() => {
        const text = accumulatedRef.current.trim();
        if (text && !isLoading && !aiSpeaking) {
            stopListening();
            accumulatedRef.current = "";
            setInterimTranscript("");
            setCurrentInput("");
            onSend(text);
        }
    }, [isLoading, aiSpeaking, onSend, stopListening, setCurrentInput]);

    useEffect(() => { autoSendRef.current = autoSend; }, [autoSend]);

    /* ═══════════════ AI TTS (speak officer messages) ═══════════════ */
    const lastSpokenIndexRef = useRef(-1);

    useEffect(() => {
        const lastIdx = messages.length - 1;
        const last = messages[lastIdx];
        if (
            last?.role === "officer" &&
            lastIdx > lastSpokenIndexRef.current &&
            typeof window !== "undefined"
        ) {
            lastSpokenIndexRef.current = lastIdx;

            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(last.content);
            if (selectedVoiceRef.current) {
                utterance.voice = selectedVoiceRef.current;
            }
            utterance.rate = agentInfo.rate;
            utterance.pitch = agentInfo.pitch;

            utterance.onstart = () => setAiSpeaking(true);
            utterance.onend = () => {
                setAiSpeaking(false);
                setTimeout(() => startListening(), 600);
            };
            utterance.onerror = () => setAiSpeaking(false);

            setTimeout(() => {
                window.speechSynthesis.speak(utterance);
            }, 300);
        }
    }, [messages, startListening]);

    /* Auto scroll transcript */
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    /* ═══════════════ Camera / Mic toggles ═══════════════ */
    const toggleCamera = () => {
        streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
        setCameraOn((p) => !p);
    };

    const toggleMic = () => {
        streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
        setMicOn((p) => !p);
    };

    /* ═══════════════ Send handler ═══════════════ */
    const handleSend = useCallback(() => {
        if (isListening) stopListening();
        const text = accumulatedRef.current.trim() || currentInput.trim();
        if (text) {
            accumulatedRef.current = "";
            setInterimTranscript("");
            onSend(text);
        }
    }, [currentInput, isListening, onSend, stopListening]);

    /* ═══════════════ Handle Enter ═══════════════ */
    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    /* avg eval score */
    const avgScore = evaluations.length
        ? Math.round(
            (evaluations.reduce((a, e) => a + (e.clarity + e.confidence + e.relevance) / 3, 0) /
                evaluations.length) *
            10
        )
        : 0;

    /* Current section label */
    const currentSectionLabel = sections.find(s => s.id === currentSection)?.label || "Interview";
    const completedCount = sections.filter(s => s.completed).length;

    /* ═══════════════════════ RENDER ═══════════════════════ */
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col w-full max-w-6xl mx-auto pt-4 pb-44 gap-5"
        >
            {/* ─── Top Bar: Embassy Header ─── */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em]">
                            LIVE • {fmtTime(elapsed)}
                        </span>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/5">
                        <span className="material-symbols-outlined text-[#6605c7] text-sm">flag</span>
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                            {visaType}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/5">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                            Q{questionCount} • {completedCount}/{sections.length} topics
                        </span>
                    </div>
                    <button
                        onClick={() => setShowTranscript((p) => !p)}
                        className="h-10 px-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">chat</span>
                        {showTranscript ? "Hide" : "Log"}
                    </button>
                    {latestEval && (
                        <button
                            onClick={() => setShowTip(p => !p)}
                            className="h-10 px-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">lightbulb</span>
                            Tip
                        </button>
                    )}
                </div>
            </div>

            {/* ─── Main Interview Area ─── */}
            <div className="relative">
                {/* Embassy Window — Officer Side (Full Width) */}
                <div className="relative rounded-[36px] overflow-hidden bg-gradient-to-b from-[#0d0818] via-[#110d20] to-[#0a0612] border border-white/[0.06] min-h-[420px] md:min-h-[520px]">
                    
                    {/* Subtle embassy texture */}
                    <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: "radial-gradient(#fff 0.5px, transparent 0.5px)", backgroundSize: "16px 16px" }} />

                    {/* Ambient glow behind officer */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <motion.div
                            animate={{
                                scale: aiSpeaking ? [1, 1.15, 1] : 1,
                                opacity: aiSpeaking ? [0.08, 0.2, 0.08] : 0.05,
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute w-[500px] h-[500px] rounded-full bg-[#6605c7] blur-[120px]"
                        />
                    </div>

                    {/* Officer Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[420px] md:min-h-[520px] py-10 px-6">
                        
                        {/* Officer Avatar */}
                        <motion.div
                            animate={{
                                scale: aiSpeaking ? [1, 1.04, 1] : 1,
                            }}
                            transition={{ duration: 1.2, repeat: aiSpeaking ? Infinity : 0, ease: "easeInOut" }}
                            className="relative mb-6"
                        >
                            {/* Speaking pulse ring */}
                            <AnimatePresence>
                                {aiSpeaking && (
                                    <>
                                        <motion.div
                                            initial={{ scale: 1, opacity: 0.6 }}
                                            animate={{ scale: 1.5, opacity: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                            className="absolute -inset-3 rounded-full border-2 border-[#6605c7]"
                                        />
                                        <motion.div
                                            initial={{ scale: 1, opacity: 0.3 }}
                                            animate={{ scale: 1.8, opacity: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                                            className="absolute -inset-3 rounded-full border border-[#a855f7]"
                                        />
                                    </>
                                )}
                            </AnimatePresence>
                            <div className={`w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center shadow-2xl transition-shadow duration-500 ${aiSpeaking ? "shadow-[#6605c7]/40" : "shadow-black/40"}`}
                                style={{ background: "linear-gradient(145deg, #6605c7, #3d0275)" }}
                            >
                                <span className="material-symbols-outlined text-white/90 text-5xl md:text-6xl">
                                    {agentType === "agent_sarah" ? "face_3" : agentType === "agent_smith" ? "face_6" : "face_4"}
                                </span>
                            </div>
                        </motion.div>

                        {/* Officer Name & Status */}
                        <div className="text-center mb-5">
                            <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-[0.15em] mb-1">
                                {agentInfo.label}
                            </h3>
                            <p className="text-[11px] text-gray-600 font-medium">U.S. Consular Officer</p>
                            <div className="flex items-center justify-center gap-2 mt-2.5">
                                <div
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${aiSpeaking
                                        ? "bg-[#6605c7] animate-pulse ring-4 ring-[#6605c7]/20"
                                        : isLoading
                                            ? "bg-amber-500 animate-pulse"
                                            : "bg-emerald-500"
                                        }`}
                                />
                                <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                                    {aiSpeaking ? "SPEAKING" : isLoading ? "THINKING…" : "WAITING FOR YOUR RESPONSE"}
                                </span>
                            </div>
                        </div>

                        {/* Audio Waveform */}
                        <div className="flex items-end gap-[3px] h-8 mb-6">
                            {Array.from({ length: 28 }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        height: aiSpeaking
                                            ? `${6 + Math.random() * 26}px`
                                            : "3px",
                                    }}
                                    transition={{ duration: 0.12, repeat: aiSpeaking ? Infinity : 0, repeatType: "mirror" }}
                                    className={`w-[3px] rounded-full ${aiSpeaking ? "bg-[#6605c7]" : "bg-white/10"}`}
                                />
                            ))}
                        </div>

                        {/* Speech Bubble — Officer's current question */}
                        {lastOfficerMsg && (
                            <motion.div
                                key={lastOfficerMsg.content}
                                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="max-w-2xl w-full"
                            >
                                <div className="relative bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl px-7 py-5">
                                    {/* Notch */}
                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-white/[0.04] border-l border-t border-white/[0.08]" />
                                    <p className="text-[15px] md:text-[16px] text-gray-200 leading-relaxed font-medium relative z-10">
                                        &ldquo;{displayedText}&rdquo;
                                        {isTyping && <span className="inline-block w-0.5 h-4 bg-[#6605c7] ml-0.5 animate-pulse align-middle" />}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Top-left badge */}
                    <div className="absolute top-5 left-5 flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/[0.06]">
                        <span className="material-symbols-outlined text-[#6605c7] text-sm">verified_user</span>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            {currentSectionLabel}
                        </span>
                    </div>

                    {/* Top-right: User webcam PIP */}
                    <div className="absolute top-5 right-5 w-32 h-24 md:w-44 md:h-32 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl shadow-black/60 bg-black">
                        {mediaError ? (
                            <div className="w-full h-full flex items-center justify-center bg-[#0a0c10]">
                                <span className="material-symbols-outlined text-gray-700 text-2xl">videocam_off</span>
                            </div>
                        ) : (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`w-full h-full object-cover ${!cameraOn ? "hidden" : ""}`}
                                style={{ transform: "scaleX(-1)" }}
                            />
                        )}
                        {!cameraOn && !mediaError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-[#0a0c10]">
                                <span className="material-symbols-outlined text-gray-600 text-2xl">person</span>
                            </div>
                        )}
                        {/* PIP user label */}
                        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md">
                            <div className={`w-1.5 h-1.5 rounded-full ${isListening ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`} />
                            <span className="text-[8px] font-black text-white/70 uppercase tracking-widest">YOU</span>
                        </div>

                        {/* User audio bars overlay */}
                        {isListening && (
                            <div className="absolute top-1.5 right-1.5 flex items-end gap-[1.5px] h-3">
                                {Array.from({ length: 5 }).map((_, i) => {
                                    const h = Math.max(2, userAudioLevel * 8 * (0.5 + Math.random()));
                                    return (
                                        <div
                                            key={i}
                                            className="w-[2px] rounded-full bg-red-400 transition-all duration-100"
                                            style={{ height: `${h}px` }}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Section Progress Rail — Right side */}
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-1.5 mr-1">
                        {sections.map((s, i) => (
                            <div
                                key={s.id}
                                title={s.label}
                                className={`w-1.5 h-4 rounded-full transition-all duration-500 ${s.completed
                                    ? "bg-emerald-500"
                                    : s.id === currentSection
                                        ? "bg-[#6605c7] scale-125"
                                        : "bg-white/[0.06]"
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── Quick Tip (collapsible) ─── */}
            <AnimatePresence>
                {showTip && latestEval && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-[#6605c7]/5 border border-[#6605c7]/15 rounded-2xl px-5 py-4 flex items-start gap-3">
                            <span className="material-symbols-outlined text-[#a855f7] text-lg mt-0.5 shrink-0">tips_and_updates</span>
                            <div className="flex-1">
                                <p className="text-xs text-[#a855f7] font-bold uppercase tracking-widest mb-1">Quick Tip</p>
                                <p className="text-sm text-gray-300 font-medium leading-relaxed">{latestEval.quickTip}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${latestEval.risk === "Low"
                                    ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
                                    : latestEval.risk === "Medium"
                                        ? "text-amber-400 border-amber-500/20 bg-amber-500/5"
                                        : "text-red-400 border-red-500/20 bg-red-500/5"
                                    }`}>
                                    {latestEval.risk} Risk
                                </div>
                                <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-white tracking-widest">
                                    {latestEval.overallScore}/100
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Evaluation mini-pills ─── */}
            {latestEval && !showTip && (
                <div className="flex flex-wrap items-center justify-center gap-2 px-2">
                    <EvalPill label="Clarity" value={latestEval.clarity} color="#6605c7" />
                    <EvalPill label="Confidence" value={latestEval.confidence} color="#a855f7" />
                    <EvalPill label="Relevance" value={latestEval.relevance} color="#7c3aed" />
                    <EvalPill label="Specificity" value={latestEval.specificity} color="#6d28d9" />
                    <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${latestEval.risk === "Low"
                        ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
                        : latestEval.risk === "Medium"
                            ? "text-amber-400 border-amber-500/20 bg-amber-500/5"
                            : "text-red-400 border-red-500/20 bg-red-500/5"
                        }`}>
                        {latestEval.overallScore}/100
                    </div>
                </div>
            )}

            {/* ─── Transcript overlay (toggled) ─── */}
            <AnimatePresence>
                {showTranscript && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white/[0.02] border border-white/5 rounded-[24px] p-6 max-h-72 overflow-y-auto">
                            <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-xs">history</span>
                                Conversation Log
                            </div>
                            <div className="space-y-3">
                                {messages.map((m, i) => (
                                    <div
                                        key={i}
                                        className={`flex gap-3 items-start ${m.role === "applicant" ? "flex-row-reverse text-right" : ""}`}
                                    >
                                        <div
                                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${m.role === "officer"
                                                ? "bg-[#6605c7]/20 text-[#a855f7]"
                                                : "bg-white/5 text-gray-400"
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-sm">
                                                {m.role === "officer" ? "security" : "person"}
                                            </span>
                                        </div>
                                        <div className={`max-w-[85%] ${m.role === "applicant" ? "bg-white/[0.03] border border-white/5" : "bg-[#6605c7]/5 border border-[#6605c7]/10"} rounded-2xl px-4 py-2.5`}>
                                            <p className="text-xs text-gray-300 font-medium leading-relaxed">
                                                {m.content}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ Sticky bottom input / controls bar ═══ */}
            <div className="fixed bottom-6 inset-x-4 md:inset-x-0 mx-auto max-w-3xl z-50">
                <div className="bg-[#0a0c10]/90 backdrop-blur-2xl border border-white/[0.08] rounded-[28px] p-3 shadow-2xl shadow-black/60">
                    {/* Interim transcript preview */}
                    <AnimatePresence>
                        {(isListening && (interimTranscript || currentInput)) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <div className="px-5 pb-3 border-b border-white/5 mb-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-[9px] font-black text-red-400/70 uppercase tracking-widest">Transcribing...</span>
                                    </div>
                                    <p className="text-sm text-gray-400 font-medium truncate">
                                        {currentInput}
                                        {interimTranscript && (
                                            <span className="text-gray-600"> {interimTranscript}</span>
                                        )}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex items-end gap-2.5">
                        {/* Text input */}
                        <textarea
                            value={currentInput}
                            onChange={(e) => setCurrentInput(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder={
                                isListening
                                    ? "Listening… speak your answer naturally"
                                    : aiSpeaking
                                        ? `${agentInfo.label} is speaking…`
                                        : "Type your answer or press the mic button…"
                            }
                            disabled={isLoading || aiSpeaking}
                            rows={1}
                            className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-white placeholder:text-gray-700 resize-none py-3 px-4 text-[15px] font-medium min-h-[48px] max-h-28"
                        />

                        {/* Control buttons */}
                        <div className="flex items-center gap-2 pb-1 flex-shrink-0">
                            {/* Camera toggle */}
                            <button
                                onClick={toggleCamera}
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${cameraOn
                                    ? "bg-white/5 text-gray-500 border border-white/[0.06] hover:bg-white/10"
                                    : "bg-red-500/15 text-red-400 border border-red-500/20"
                                    }`}
                                title={cameraOn ? "Turn off camera" : "Turn on camera"}
                            >
                                <span className="material-symbols-outlined text-lg">
                                    {cameraOn ? "videocam" : "videocam_off"}
                                </span>
                            </button>

                            {/* Mic toggle (speech recognition) */}
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={toggleListening}
                                disabled={aiSpeaking}
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isListening
                                    ? "bg-red-500 text-white ring-4 ring-red-500/20"
                                    : "bg-white/5 text-gray-500 border border-white/[0.06] hover:bg-white/10"
                                    } disabled:opacity-30`}
                                title={isListening ? "Stop recording" : "Start recording"}
                            >
                                <span className="material-symbols-outlined text-lg font-black">
                                    {isListening ? "mic" : "mic_none"}
                                </span>
                            </motion.button>

                            {/* End interview */}
                            {messages.length >= 4 && (
                                <button
                                    onClick={onEnd}
                                    className="h-10 px-4 rounded-2xl bg-white/5 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/20 text-gray-600 text-[10px] font-black uppercase tracking-widest transition-all border border-white/[0.06]"
                                >
                                    END
                                </button>
                            )}

                            {/* Send */}
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={handleSend}
                                disabled={!currentInput.trim() || isLoading || aiSpeaking}
                                className="w-10 h-10 bg-gradient-to-br from-[#6605c7] to-[#a855f7] text-white rounded-2xl flex items-center justify-center shrink-0 disabled:opacity-20 transition-all shadow-lg shadow-[#6605c7]/20"
                            >
                                <span className="material-symbols-outlined font-black text-lg">
                                    arrow_upward
                                </span>
                            </motion.button>
                        </div>
                    </div>
                </div>

                <div className="mt-2 text-center">
                    <span className="text-[9px] text-gray-700 font-bold uppercase tracking-[0.15em]">
                        {isListening ? "🔴 Recording — speak naturally, answer will auto-send after you pause" : `${agentInfo.label} • ${visaType} • Press ENTER to send`}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

/* ─── Small sub-components ─── */
function EvalPill({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                {label}
            </span>
            <div className="w-12 h-1 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value * 10}%` }}
                    className="h-full rounded-full"
                    style={{ background: color }}
                />
            </div>
            <span className="text-[9px] font-black text-white">{value}</span>
        </div>
    );
}
