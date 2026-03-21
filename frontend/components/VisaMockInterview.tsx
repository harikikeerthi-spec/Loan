"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AGENT_TYPES } from "../app/(public)/visa-mock/page";
import { buildConsularVoiceMap, getConsularVoice } from "../lib/consularVoices";

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
   VisaMockInterview – immersive WebRTC video‑call layout
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
    const aiAudioLevel = aiSpeaking ? 0.4 + Math.random() * 0.5 : 0; // simulated waveform

    /* ── Resolved agent info ── */
    const agentInfo = AGENT_TYPES.find(a => a.value === agentType) || AGENT_TYPES[2];

    /* ── Voice selection for distinct agent voices ── */
    const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
    const officerVoiceMapRef = useRef<Record<string, SpeechSynthesisVoice | null>>({});

    useEffect(() => {
        if (typeof window === "undefined" || !window.speechSynthesis) return;

        const pickVoice = () => {
            const voices = window.speechSynthesis.getVoices();
            if (!voices.length) return;

            const voiceMap = buildConsularVoiceMap(voices);
            officerVoiceMapRef.current = voiceMap;
            selectedVoiceRef.current = getConsularVoice(agentType, voices, voiceMap);
        };

        pickVoice();

        window.speechSynthesis.addEventListener("voiceschanged", pickVoice);
        return () => {
            window.speechSynthesis.removeEventListener("voiceschanged", pickVoice);
        };
    }, [agentType]);

    /* ── Speech Recognition ── */
    const recognitionRef = useRef<any>(null);
    const [isListening, setIsListening] = useState(false);
    const [interimTranscript, setInterimTranscript] = useState("");
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const accumulatedRef = useRef("");  // accumulates recognized text between sends
    const autoSendRef = useRef<() => void>(() => { });
    const intentionalStopRef = useRef(false);  // track if we intentionally stopped recognition

    /* ── Transcript log ── */
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [showTranscript, setShowTranscript] = useState(false);

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
                setMediaReady(true); // still allow text interaction
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
                // setCurrentInput accepts a plain string, so we accumulate via ref
                accumulatedRef.current = (accumulatedRef.current + " " + finalText).trim();
                setCurrentInput(accumulatedRef.current);
                setInterimTranscript("");
            } else {
                setInterimTranscript(interim);
            }

            // Auto-send after silence — longer pause for first answer so user can settle in
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            const silenceDelay = questionCount <= 1 ? 3000 : 2200;
            silenceTimerRef.current = setTimeout(() => {
                autoSendRef.current();
            }, silenceDelay);
        };

        rec.onend = () => {
            setIsListening(false);
            // Auto-restart if recognition ended unexpectedly (Chrome kills it after silence)
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
            // 'aborted' and 'no-speech' are recoverable — don't fully stop
            if (e.error === "aborted" || e.error === "no-speech") return;
            setIsListening(false);
        };

        recognitionRef.current = rec;
    }, [setCurrentInput]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !aiSpeaking) {
            // Stop first if already running to avoid InvalidStateError
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
                // If start fails, retry after a short delay
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
        // Only speak if this is a new officer message we haven't spoken yet
        if (
            last?.role === "officer" &&
            lastIdx > lastSpokenIndexRef.current &&
            typeof window !== "undefined"
        ) {
            lastSpokenIndexRef.current = lastIdx;

            // Stop any current speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(last.content);
            const activeVoice = officerVoiceMapRef.current[agentType] || selectedVoiceRef.current;
            if (activeVoice) {
                utterance.voice = activeVoice;
            }
            utterance.rate = agentInfo.rate;
            utterance.pitch = agentInfo.pitch;
            utterance.volume = 1;

            utterance.onstart = () => setAiSpeaking(true);
            utterance.onend = () => {
                setAiSpeaking(false);
                // Brief pause before listening — feels like the officer is waiting for you
                setTimeout(() => startListening(), 600);
            };
            utterance.onerror = () => setAiSpeaking(false);

            // Small delay to ensure component is fully mounted and audio context is ready
            setTimeout(() => {
                window.speechSynthesis.speak(utterance);
            }, 300);
        }
    }, [agentInfo.pitch, agentInfo.rate, agentType, messages, startListening]);

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

    /* ═══════════════════════ RENDER ═══════════════════════ */
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col w-full max-w-7xl mx-auto pt-6 pb-40 gap-6"
        >
            {/* ─── Top bar: status ─── */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em]">
                            LIVE • {fmtTime(elapsed)}
                        </span>
                    </div>
                    <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest hidden sm:block">
                        {visaType}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest hidden md:block">
                        Q{questionCount} • Score {avgScore}/100
                    </span>
                    <button
                        onClick={() => setShowTranscript((p) => !p)}
                        className="h-9 px-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-white/10 transition-colors"
                    >
                        {showTranscript ? "Hide" : "Show"} Transcript
                    </button>
                </div>
            </div>

            {/* ─── Video call area ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                {/* AI Officer panel */}
                <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-br from-[#0f0a1a] to-[#1a1030] border border-white/5 min-h-[340px] md:min-h-[440px] flex items-center justify-center group">
                    {/* Animated background rings */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <motion.div
                            animate={{
                                scale: aiSpeaking ? [1, 1.2, 1] : 1,
                                opacity: aiSpeaking ? [0.15, 0.35, 0.15] : 0.08,
                            }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute w-72 h-72 rounded-full bg-[#6605c7] blur-[80px]"
                        />
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                            className="absolute w-56 h-56 border border-dashed border-[#6605c7]/20 rounded-full"
                        />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute w-40 h-40 border border-dashed border-[#a855f7]/15 rounded-full"
                        />
                    </div>

                    {/* AI avatar */}
                    <div className="relative z-10 flex flex-col items-center gap-6">
                        <motion.div
                            animate={{
                                scale: aiSpeaking ? [1, 1.06, 1] : 1,
                            }}
                            transition={{ duration: 0.8, repeat: aiSpeaking ? Infinity : 0 }}
                            className="relative"
                        >
                            {/* Speaking ring */}
                            {aiSpeaking && (
                                <motion.div
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                                    transition={{ duration: 1.2, repeat: Infinity }}
                                    className="absolute -inset-4 rounded-full border-2 border-[#6605c7]"
                                />
                            )}
                            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-[#6605c7] to-[#a855f7] flex items-center justify-center shadow-2xl shadow-[#6605c7]/30">
                                <span className="material-symbols-outlined text-white text-6xl md:text-7xl">
                                    account_circle
                                </span>
                            </div>
                        </motion.div>
                        <div className="text-center">
                            <h3 className="text-lg font-black text-white uppercase tracking-[0.15em]">
                                {agentInfo.label}
                            </h3>
                            <p className="text-[10px] text-gray-600 font-medium mt-0.5 mb-1">{agentInfo.desc}</p>
                            <div className="flex items-center justify-center gap-2 mt-1.5">
                                <div
                                    className={`w-2 h-2 rounded-full ${aiSpeaking
                                        ? "bg-[#6605c7] animate-pulse ring-4 ring-[#6605c7]/20"
                                        : isLoading
                                            ? "bg-amber-500 animate-pulse"
                                            : "bg-green-500"
                                        }`}
                                />
                                <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                                    {aiSpeaking ? "SPEAKING" : isLoading ? "THINKING…" : "LISTENING"}
                                </span>
                            </div>
                        </div>

                        {/* AI audio waveform bars */}
                        <div className="flex items-end gap-[3px] h-8">
                            {Array.from({ length: 24 }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        height: aiSpeaking
                                            ? `${8 + Math.random() * 24}px`
                                            : "4px",
                                    }}
                                    transition={{ duration: 0.15, repeat: aiSpeaking ? Infinity : 0, repeatType: "mirror" }}
                                    className="w-[3px] rounded-full bg-[#6605c7]/60"
                                />
                            ))}
                        </div>
                    </div>

                    {/* Badge */}
                    <div className="absolute top-5 left-5 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
                        <span className="material-symbols-outlined text-[#6605c7] text-sm">smart_toy</span>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">AI POWERED</span>
                    </div>
                </div>

                {/* User webcam panel */}
                <div className="relative rounded-[32px] overflow-hidden bg-[#0a0c10] border border-white/5 min-h-[340px] md:min-h-[440px] flex items-center justify-center">
                    {mediaError ? (
                        <div className="flex flex-col items-center gap-4 p-8 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                                <span className="material-symbols-outlined text-3xl text-gray-600">
                                    videocam_off
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 font-medium max-w-xs">
                                Camera not available. You can still use text &amp; voice input below.
                            </p>
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
                            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
                                <span className="material-symbols-outlined text-5xl text-gray-600">
                                    person
                                </span>
                            </div>
                        </div>
                    )}

                    {/* User audio waveform overlay */}
                    <div className="absolute bottom-5 inset-x-5 flex items-end justify-center gap-[2px] h-6">
                        {Array.from({ length: 32 }).map((_, i) => {
                            const h = isListening
                                ? Math.max(3, userAudioLevel * 12 * (0.5 + Math.random()))
                                : 3;
                            return (
                                <div
                                    key={i}
                                    className="w-[2px] rounded-full bg-white/30 transition-all duration-100"
                                    style={{ height: `${h}px` }}
                                />
                            );
                        })}
                    </div>

                    {/* Badge */}
                    <div className="absolute top-5 left-5 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
                        <span className="material-symbols-outlined text-green-500 text-sm">person</span>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">YOU</span>
                    </div>

                    {/* Listening indicator */}
                    {isListening && (
                        <div className="absolute top-5 right-5 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/20 backdrop-blur-md border border-red-500/30">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">
                                RECORDING
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Transcript overlay (toggled) ─── */}
            <AnimatePresence>
                {showTranscript && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white/[0.02] border border-white/5 rounded-[24px] p-6 max-h-64 overflow-y-auto">
                            <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4">
                                Conversation Log
                            </div>
                            <div className="space-y-3">
                                {messages.map((m, i) => (
                                    <div
                                        key={i}
                                        className={`flex gap-3 items-start ${m.role === "applicant" ? "flex-row-reverse text-right" : ""
                                            }`}
                                    >
                                        <div
                                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${m.role === "officer"
                                                ? "bg-[#6605c7]/20 text-[#a855f7]"
                                                : "bg-white/5 text-gray-400"
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-sm">
                                                {m.role === "officer" ? "smart_toy" : "person"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-[85%]">
                                            {m.content}
                                        </p>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Live evaluation strip ─── */}
            {latestEval && (
                <div className="flex flex-wrap items-center justify-center gap-3 px-2">
                    <EvalPill label="Clarity" value={latestEval.clarity} color="#6605c7" />
                    <EvalPill label="Confidence" value={latestEval.confidence} color="#a855f7" />
                    <EvalPill label="Relevance" value={latestEval.relevance} color="#7c3aed" />
                    <EvalPill label="Specificity" value={latestEval.specificity} color="#6d28d9" />
                    <EvalPill label="Persuasive" value={latestEval.persuasiveness} color="#5b21b6" />
                    <div className="px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border bg-white/5 border-white/10 text-white">
                        {latestEval.overallScore}/100
                    </div>
                    <div
                        className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${latestEval.risk === "Low"
                            ? "text-green-400 border-green-500/20 bg-green-500/5"
                            : latestEval.risk === "Medium"
                                ? "text-amber-400 border-amber-500/20 bg-amber-500/5"
                                : "text-red-400 border-red-500/20 bg-red-500/5"
                            }`}
                    >
                        {latestEval.risk} Risk
                    </div>
                </div>
            )}

            {/* ─── Section progress dots Removed per request ─── */}

            {/* ═══ Sticky bottom input / controls bar ═══ */}
            <div className="fixed bottom-8 inset-x-4 md:inset-x-0 mx-auto max-w-4xl z-50">
                <div className="bg-[#0a0c10]/80 backdrop-blur-2xl border border-white/10 rounded-[32px] p-3 md:p-4 shadow-2xl">
                    {/* Interim transcript preview */}
                    {(isListening && (interimTranscript || currentInput)) && (
                        <div className="px-5 pb-3 border-b border-white/5 mb-3">
                            <p className="text-sm text-gray-500 italic truncate">
                                {currentInput}
                                {interimTranscript && (
                                    <span className="text-gray-700"> {interimTranscript}</span>
                                )}
                            </p>
                        </div>
                    )}

                    <div className="flex items-end gap-3">
                        {/* Text input */}
                        <textarea
                            value={currentInput}
                            onChange={(e) => setCurrentInput(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder={
                                isListening
                                    ? "Listening… speak naturally"
                                    : aiSpeaking
                                        ? `${agentInfo.label} is speaking…`
                                        : "Type your answer or press mic to speak…"
                            }
                            disabled={isLoading || aiSpeaking}
                            rows={1}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-gray-700 resize-none py-3 px-4 text-base font-medium min-h-[48px] max-h-28"
                        />

                        {/* Control buttons */}
                        <div className="flex items-center gap-2 pb-1 flex-shrink-0">
                            {/* Camera toggle */}
                            <button
                                onClick={toggleCamera}
                                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${cameraOn
                                    ? "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                                    : "bg-red-500/20 text-red-400 border border-red-500/30"
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
                                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-xl ${isListening
                                    ? "bg-red-500 text-white animate-pulse ring-4 ring-red-500/20"
                                    : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
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
                                    className="h-11 px-5 rounded-2xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-gray-500 text-[10px] font-black uppercase tracking-widest transition-colors border border-white/5 hover:border-red-500/20"
                                >
                                    END
                                </button>
                            )}

                            {/* Send */}
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={handleSend}
                                disabled={!currentInput.trim() || isLoading || aiSpeaking}
                                className="w-11 h-11 bg-white text-black rounded-2xl flex items-center justify-center shrink-0 disabled:opacity-20 disabled:grayscale transition-all shadow-xl"
                            >
                                <span className="material-symbols-outlined font-black">
                                    arrow_upward
                                </span>
                            </motion.button>
                        </div>
                    </div>
                </div>

                <div className="mt-2.5 text-center">
                    <span className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em]">
                        {agentInfo.label} • Voice Interview • Press ENTER to send • {visaType}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

/* ─── Small sub-components ─── */
function EvalPill({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                {label}
            </span>
            <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value * 10}%` }}
                    className="h-full rounded-full"
                    style={{ background: color }}
                />
            </div>
            <span className="text-[10px] font-black text-white">{value}</span>
        </div>
    );
}
