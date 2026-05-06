"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AGENT_TYPES } from "../app/(public)/visa-mock/page";

/* ────────── Types ────────── */
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

/* ─── Waveform bars for speaking animation ─── */
function WaveformBars({ active, color, barCount = 20 }: { active: boolean; color: string; barCount?: number }) {
    return (
        <div className="flex items-center gap-[3px] h-8">
            {Array.from({ length: barCount }).map((_, i) => (
                <motion.div
                    key={i}
                    className="rounded-full w-[3px]"
                    style={{ background: color }}
                    animate={active ? {
                        height: [`${4 + (i % 5) * 3}px`, `${10 + Math.sin(i * 0.8) * 12}px`, `${4 + (i % 3) * 4}px`],
                    } : { height: "4px" }}
                    transition={{
                        duration: 0.5 + (i % 3) * 0.2,
                        repeat: active ? Infinity : 0,
                        repeatType: "mirror",
                        delay: i * 0.04,
                    }}
                />
            ))}
        </div>
    );
}

/* ─── Typing indicator (officer is thinking) ─── */
function ThinkingDots() {
    return (
        <div className="flex items-center gap-1.5">
            {[0, 1, 2].map(i => (
                <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-amber-400"
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                />
            ))}
        </div>
    );
}

/* ════════════════════════════════════ Main Component ════════════════════════════════════ */
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

    const AGENT_SPEECH_STYLE: Record<string, { leadInMs: number; resumeMicMs: number; neuralSpeedFactor: number }> = {
        agent_smith:   { leadInMs: 240, resumeMicMs: 520, neuralSpeedFactor: 0.94 },
        agent_sarah:   { leadInMs: 300, resumeMicMs: 430, neuralSpeedFactor: 1.02 },
        agent_michael: { leadInMs: 360, resumeMicMs: 620, neuralSpeedFactor: 0.92 },
    };

    /* ── WebRTC ── */
    const videoRef  = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [cameraOn, setCameraOn]     = useState(true);
    const [micOn, setMicOn]           = useState(true);
    const [mediaReady, setMediaReady] = useState(false);
    const [mediaError, setMediaError] = useState<string | null>(null);

    /* ── Audio analysis ── */
    const audioCtxRef  = useRef<AudioContext | null>(null);
    const analyserRef  = useRef<AnalyserNode | null>(null);
    const rafRef       = useRef<number>(0);
    const [userAudioLevel, setUserAudioLevel] = useState(0);

    /* ── AI speaking ── */
    const [aiSpeaking, setAiSpeaking]   = useState(false);
    const [captionsEnabled, setCaptionsEnabled] = useState(true);
    const [playbackRate, setPlaybackRate] = useState<0.85 | 1 | 1.15>(1);
    const [neuralBusy, setNeuralBusy]   = useState(false);
    const [voiceError, setVoiceError]   = useState<string | null>(null);
    const ttsAudioRef    = useRef<HTMLAudioElement | null>(null);
    const ttsAudioUrlRef = useRef<string | null>(null);
    const lastRequestIdRef = useRef<number>(0);

    /* ── Speech recognition ── */
    const recognitionRef       = useRef<any>(null);
    const [isListening, setIsListening]           = useState(false);
    const [interimTranscript, setInterimTranscript] = useState("");
    const silenceTimerRef      = useRef<NodeJS.Timeout | null>(null);
    const accumulatedRef       = useRef("");
    const autoSendRef          = useRef<() => void>(() => {});
    const intentionalStopRef   = useRef(false);

    /* ── UI state ── */
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [showTranscript, setShowTranscript] = useState(false);
    const [showTip, setShowTip]               = useState(false);

    /* ── Timer ── */
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setElapsed(p => p + 1), 1000);
        return () => clearInterval(t);
    }, []);
    const fmtTime = (s: number) =>
        `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    const agentInfo   = AGENT_TYPES.find(a => a.value === agentType) || AGENT_TYPES[2];
    const speechStyle = AGENT_SPEECH_STYLE[agentType] || AGENT_SPEECH_STYLE.agent_michael;
    const lastOfficerMessage = [...messages].reverse().find(m => m.role === "officer")?.content || "";

    const avgScore = evaluations.length
        ? Math.round(
            (evaluations.reduce((a, e) => a + (e.clarity + e.confidence + e.relevance) / 3, 0) /
                evaluations.length) * 10
        ) : 0;

    const completedCount = sections.filter(s => s.completed).length;
    const progressPct    = sections.length ? Math.round((completedCount / sections.length) * 100) : 0;

    /* ═══ WebRTC init ═══ */
    useEffect(() => {
        let cancelled = false;
        const init = async () => {
            try {
                const ms = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
                    audio: true,
                });
                if (cancelled) { ms.getTracks().forEach(t => t.stop()); return; }
                streamRef.current = ms;
                if (videoRef.current) videoRef.current.srcObject = ms;

                const ctx      = new AudioContext();
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 256;
                ctx.createMediaStreamSource(ms).connect(analyser);
                audioCtxRef.current  = ctx;
                analyserRef.current  = analyser;

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
                setMediaError(err.message || "Camera/mic access denied");
                setMediaReady(true);
            }
        };
        init();
        return () => {
            cancelled = true;
            cancelAnimationFrame(rafRef.current);
            streamRef.current?.getTracks().forEach(t => t.stop());
            audioCtxRef.current?.close().catch(() => {});
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ═══ Speech recognition setup ═══ */
    useEffect(() => {
        if (typeof window === "undefined") return;
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) return;
        const rec = new SR();
        rec.continuous      = true;
        rec.interimResults  = true;
        rec.lang            = "en-US";

        rec.onresult = (e: any) => {
            let interim = "", finalText = "";
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
            const silenceDelay = questionCount <= 1 ? 3200 : 2400;
            silenceTimerRef.current = setTimeout(() => { autoSendRef.current(); }, silenceDelay);
        };

        rec.onend = () => {
            setIsListening(false);
            if (!intentionalStopRef.current) {
                setTimeout(() => {
                    try { rec.start(); setIsListening(true); } catch (_) {}
                }, 300);
            }
            intentionalStopRef.current = false;
        };
        rec.onerror = (e: any) => {
            if (e.error === "aborted" || e.error === "no-speech") return;
            setIsListening(false);
        };
        recognitionRef.current = rec;
    }, [setCurrentInput, questionCount]);

    /* ═══ Mic controls ═══ */
    const startListening = useCallback(() => {
        if (!recognitionRef.current || aiSpeaking) return;
        if (isListening) {
            intentionalStopRef.current = true;
            try { recognitionRef.current.stop(); } catch (_) {}
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
                try { recognitionRef.current?.start(); setIsListening(true); } catch (_) {}
            }, 200);
        }
    }, [isListening, aiSpeaking, setCurrentInput]);

    const stopListening = useCallback(() => {
        intentionalStopRef.current = true;
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    const toggleListening = useCallback(() => {
        if (isListening) stopListening(); else startListening();
    }, [isListening, startListening, stopListening]);

    /* ═══ Auto-send after silence ═══ */
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

    /* ═══ TTS ═══ */
    const cleanupAudioRef = useCallback(() => {
        if (ttsAudioRef.current) {
            try { ttsAudioRef.current.pause(); } catch {}
            ttsAudioRef.current = null;
        }
        if (ttsAudioUrlRef.current) {
            URL.revokeObjectURL(ttsAudioUrlRef.current);
            ttsAudioUrlRef.current = null;
        }
    }, []);

    const cancelActiveSpeech = useCallback(() => {
        cleanupAudioRef();
        setAiSpeaking(false);
    }, [cleanupAudioRef]);

    useEffect(() => () => { cancelActiveSpeech(); }, [cancelActiveSpeech]);

    const speakWithNeural = useCallback(async (text: string, autoResume: boolean) => {
        const reqId = ++lastRequestIdRef.current;
        cleanupAudioRef();
        setNeuralBusy(true);
        setVoiceError(null);
        try {
            const res = await fetch("/api/ai/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: text.replace(/\s+/g, " ").trim(), agentType, speed: playbackRate * speechStyle.neuralSpeedFactor }),
            });
            if (reqId !== lastRequestIdRef.current) return;
            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(err?.message || "Voice unavailable.");
            }
            const blob = await res.blob();
            if (reqId !== lastRequestIdRef.current) return;
            const url = URL.createObjectURL(blob);
            ttsAudioUrlRef.current = url;
            const audio = new Audio(url);
            ttsAudioRef.current = audio;
            audio.playbackRate = playbackRate;
            audio.onplay  = () => { if (reqId === lastRequestIdRef.current) setAiSpeaking(true); };
            audio.onended = () => {
                if (reqId === lastRequestIdRef.current) {
                    setAiSpeaking(false);
                    cleanupAudioRef();
                    if (autoResume) setTimeout(() => startListening(), speechStyle.resumeMicMs);
                }
            };
            audio.onerror = () => {
                if (reqId === lastRequestIdRef.current) {
                    setAiSpeaking(false);
                    cleanupAudioRef();
                    setVoiceError("Neural playback failed.");
                    if (autoResume) setTimeout(() => startListening(), speechStyle.resumeMicMs);
                }
            };
            if (reqId === lastRequestIdRef.current) await audio.play();
        } catch (err: any) {
            if (reqId === lastRequestIdRef.current) {
                setVoiceError(err?.message || "Neural playback failed.");
                if (autoResume) setTimeout(() => startListening(), speechStyle.resumeMicMs);
            }
        } finally {
            if (reqId === lastRequestIdRef.current) setNeuralBusy(false);
        }
    }, [agentType, cleanupAudioRef, playbackRate, speechStyle.neuralSpeedFactor, speechStyle.resumeMicMs, startListening]);

    const speakOfficerText = useCallback(async (text: string, autoResume: boolean) => {
        if (!text) return;
        if (isListening) stopListening();
        cancelActiveSpeech();
        await speakWithNeural(text, autoResume);
    }, [cancelActiveSpeech, isListening, speakWithNeural, stopListening]);

    /* ═══ Auto-speak new officer messages ═══ */
    const lastSpokenIndexRef = useRef(-1);
    useEffect(() => {
        const lastIdx = messages.length - 1;
        const last    = messages[lastIdx];
        if (last?.role === "officer" && lastIdx > lastSpokenIndexRef.current && typeof window !== "undefined") {
            lastSpokenIndexRef.current = lastIdx;
            setTimeout(() => { void speakOfficerText(last.content, true); }, speechStyle.leadInMs);
        }
    }, [messages, speakOfficerText, speechStyle.leadInMs]);

    const replayLastOfficerPrompt = useCallback(() => {
        if (!lastOfficerMessage) return;
        void speakOfficerText(lastOfficerMessage, true);
    }, [lastOfficerMessage, speakOfficerText]);

    /* Auto-scroll transcript */
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    /* ═══ Camera / Mic hardware toggles ═══ */
    const toggleCamera = () => {
        streamRef.current?.getVideoTracks().forEach(t => (t.enabled = !t.enabled));
        setCameraOn(p => !p);
    };
    const toggleMic = () => {
        streamRef.current?.getAudioTracks().forEach(t => (t.enabled = !t.enabled));
        setMicOn(p => !p);
    };

    /* ═══ Send handler ═══ */
    const handleSend = useCallback(() => {
        if (isListening) stopListening();
        const text = accumulatedRef.current.trim() || currentInput.trim();
        if (text) {
            accumulatedRef.current = "";
            setInterimTranscript("");
            onSend(text);
        }
    }, [currentInput, isListening, onSend, stopListening]);

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    /* ═════════════════════════════ RENDER ════════════════════════════════ */
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex flex-col w-full max-w-6xl mx-auto pt-4 pb-36 gap-4"
        >
            {/* ── Top status bar ── */}
            <div className="flex items-center justify-between gap-2 px-2">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-100 shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.15em]">
                            LIVE • {fmtTime(elapsed)}
                        </span>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{visaType}</span>
                        <div className="w-px h-3 bg-gray-200" />
                        <span className="text-[10px] text-[#6605c7] font-black uppercase tracking-widest">Q{questionCount}</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Progress bar */}
                    <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100">
                        <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest">Progress</span>
                        <div className="w-20 h-1 rounded-full bg-gray-200 overflow-hidden">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-[#6605c7] to-[#a855f7]"
                                animate={{ width: `${progressPct}%` }}
                                transition={{ duration: 0.6 }}
                            />
                        </div>
                        <span className="text-[9px] text-gray-500 font-black">{progressPct}%</span>
                    </div>
                    
                    {avgScore > 0 && (
                        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                            avgScore >= 70 ? "text-green-600 border-green-100 bg-green-50"
                            : avgScore >= 45 ? "text-amber-600 border-amber-100 bg-amber-50"
                            : "text-red-600 border-red-100 bg-red-50"
                        }`}>
                            Score: {avgScore}/100
                        </div>
                    )}

                    <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl p-1">
                        <button
                            onClick={replayLastOfficerPrompt}
                            className="h-8 px-2.5 rounded-lg text-[9px] font-black text-gray-500 uppercase tracking-widest hover:bg-white hover:text-[#6605c7] transition-all"
                        >
                            <span className="material-symbols-outlined text-[14px] align-middle mr-1">replay</span>
                            Replay
                        </button>
                        <button
                            onClick={() => setCaptionsEnabled(p => !p)}
                            className={`h-8 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                captionsEnabled ? "bg-white text-[#6605c7] shadow-sm" : "text-gray-400 hover:text-gray-600"
                            }`}
                        >
                            CC
                        </button>
                        <button
                            onClick={() => setShowTranscript(p => !p)}
                            className={`h-8 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                showTranscript ? "bg-white text-[#6605c7] shadow-sm" : "text-gray-400 hover:text-gray-600"
                            }`}
                        >
                            Log
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Voice error banner ── */}
            <AnimatePresence>
                {voiceError && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="mx-2 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-xs font-bold text-amber-700 flex items-center gap-2 shadow-sm"
                    >
                        <span className="material-symbols-outlined text-sm">warning</span>
                        {voiceError}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Live captions ── */}
            <AnimatePresence>
                {captionsEnabled && lastOfficerMessage && (
                    <motion.div
                        key={lastOfficerMessage.slice(0, 30)}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mx-2 relative px-6 py-4 rounded-2xl border border-gray-100 bg-white/80 backdrop-blur-md shadow-sm overflow-hidden"
                    >
                        <div className="absolute left-0 inset-y-0 w-1 bg-gradient-to-b from-[#6605c7] to-[#a855f7]" />
                        <span className="text-[9px] uppercase tracking-[0.2em] text-[#6605c7] font-black block mb-1">
                            {agentInfo.label}
                        </span>
                        <p className="text-sm text-gray-800 font-bold leading-relaxed pr-10">{lastOfficerMessage}</p>
                        {aiSpeaking && (
                            <div className="absolute top-4 right-6">
                                <WaveformBars active={true} color="#6605c7" barCount={8} />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Main video area ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full px-2">

                {/* ── AI Officer panel ── */}
                <div className="relative rounded-[32px] overflow-hidden border border-gray-100 min-h-[400px] flex items-center justify-center bg-white shadow-xl shadow-gray-200/50">
                    {/* Background Texture */}
                    <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(#6605c7 0.5px, transparent 0.5px)", backgroundSize: "16px 16px" }} />
                    
                    {/* Ambient glow */}
                    <motion.div
                        className="absolute inset-0 pointer-events-none"
                        animate={{
                            background: aiSpeaking
                                ? "radial-gradient(ellipse at 50% 40%, rgba(102, 5, 199, 0.05) 0%, transparent 70%)"
                                : isLoading
                                ? "radial-gradient(ellipse at 50% 40%, rgba(245, 158, 11, 0.03) 0%, transparent 70%)"
                                : "radial-gradient(ellipse at 50% 40%, rgba(102, 5, 199, 0.02) 0%, transparent 70%)",
                        }}
                        transition={{ duration: 0.8 }}
                    />

                    {/* Officer content */}
                    <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center">
                        {/* Avatar */}
                        <div className="relative">
                            <AnimatePresence>
                                {aiSpeaking && (
                                    <motion.div
                                        initial={{ scale: 1, opacity: 0.5 }}
                                        animate={{ scale: 1.3, opacity: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                                        className="absolute inset-0 rounded-full border-2 border-[#6605c7]/20"
                                        style={{ margin: "-12px" }}
                                    />
                                )}
                            </AnimatePresence>

                            <motion.div
                                animate={{ scale: aiSpeaking ? [1, 1.03, 1] : 1 }}
                                transition={{ duration: 0.8, repeat: aiSpeaking ? Infinity : 0 }}
                                className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-2xl relative z-10"
                            >
                                <img src={agentInfo.avatar} alt={agentInfo.label} className="w-full h-full object-cover" />
                            </motion.div>
                        </div>

                        {/* Officer identity */}
                        <div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest mb-1 italic">
                                {agentInfo.label}
                            </h3>
                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-4">
                                Section: <span className="text-[#6605c7]">{sections.find(s => s.id === currentSection)?.label || "Interview"}</span>
                            </p>

                            {/* Status pill */}
                            <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-500 shadow-sm ${
                                aiSpeaking
                                    ? "bg-[#6605c7] text-white border-[#6605c7]"
                                    : isLoading
                                    ? "bg-amber-50 text-amber-600 border-amber-100"
                                    : "bg-green-50 text-green-600 border-green-100"
                            }`}>
                                {isLoading ? (
                                    <ThinkingDots />
                                ) : (
                                    <div className={`w-2 h-2 rounded-full ${aiSpeaking ? "bg-white animate-pulse" : "bg-green-500"}`} />
                                )}
                                <span>{aiSpeaking ? "Transmitting" : isLoading ? "Decoding..." : "Listening"}</span>
                            </div>
                        </div>

                        {/* Audio Waveform */}
                        <div className="h-10 flex items-center">
                             <WaveformBars active={aiSpeaking} color={aiSpeaking ? "#6605c7" : "#e5e7eb"} barCount={24} />
                        </div>
                    </div>

                    {/* Top badges */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 backdrop-blur-md border border-gray-100 shadow-sm">
                        <span className="material-symbols-outlined text-[#6605c7] text-sm">badge</span>
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">Consular Authority</span>
                    </div>

                    <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 backdrop-blur-md border border-gray-100 shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Neural AI Engine</span>
                    </div>
                </div>

                {/* ── User webcam panel ── */}
                <div className="relative rounded-[32px] overflow-hidden bg-gray-50 border border-gray-100 min-h-[400px] flex items-center justify-center shadow-xl shadow-gray-200/50">
                    {mediaError ? (
                        <div className="flex flex-col items-center gap-4 p-12 text-center">
                            <div className="w-20 h-20 rounded-3xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                <span className="material-symbols-outlined text-4xl text-gray-300">videocam_off</span>
                            </div>
                            <p className="text-[11px] text-gray-400 font-black uppercase tracking-widest">Hardware Blocked</p>
                        </div>
                    ) : (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`w-full h-full object-cover grayscale-[0.2] transition-all hover:grayscale-0 ${!cameraOn ? "hidden" : ""}`}
                                style={{ transform: "scaleX(-1)" }}
                            />
                            {!cameraOn && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                    <div className="w-32 h-32 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-inner">
                                        <span className="material-symbols-outlined text-6xl text-gray-200">person</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* User audio level visualization */}
                    <div className="absolute bottom-6 inset-x-8 flex items-end justify-center gap-[3px] h-10 pointer-events-none">
                        {Array.from({ length: 48 }).map((_, i) => {
                            const h = isListening
                                ? Math.max(4, userAudioLevel * 20 * (0.3 + Math.sin(i * 0.5) * 0.6 + Math.random() * 0.1))
                                : 4;
                            return (
                                <div
                                    key={i}
                                    className="w-[3px] rounded-full transition-all duration-75"
                                    style={{
                                        height: `${h}px`,
                                        background: isListening ? (userAudioLevel > 0.1 ? "#6605c7" : "#a855f7") : "#e5e7eb",
                                        opacity: isListening ? 0.8 : 0.4
                                    }}
                                />
                            );
                        })}
                    </div>

                    {/* Badget */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 backdrop-blur-md border border-gray-100 shadow-sm">
                        <span className="material-symbols-outlined text-[#6605c7] text-sm">person_outline</span>
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">Applicant Stream</span>
                    </div>

                    {/* Recording alert */}
                    <AnimatePresence>
                        {isListening && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 text-white shadow-lg"
                            >
                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-widest">TRANSMITTING</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Controls overlay */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                        <button
                            onClick={toggleCamera}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg ${
                                cameraOn ? "bg-white text-gray-500 hover:text-[#6605c7]" : "bg-red-50 text-red-600 border border-red-100"
                            }`}
                        >
                            <span className="material-symbols-outlined text-xl">{cameraOn ? "videocam" : "videocam_off"}</span>
                        </button>
                        <button
                            onClick={toggleMic}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg ${
                                micOn ? "bg-white text-gray-500 hover:text-[#6605c7]" : "bg-red-50 text-red-600 border border-red-100"
                            }`}
                        >
                            <span className="material-symbols-outlined text-xl">{micOn ? "mic" : "mic_off"}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Transcript log ── */}
            <AnimatePresence>
                {showTranscript && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden px-2"
                    >
                        <div className="bg-white border border-gray-100 rounded-[24px] p-6 max-h-64 overflow-y-auto shadow-sm">
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-[0.25em] mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">history</span>
                                Session Log
                            </div>
                            <div className="space-y-4">
                                {messages.map((m, i) => (
                                    <div key={i} className={`flex gap-4 items-start ${m.role === "applicant" ? "flex-row-reverse" : ""}`}>
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm border ${
                                            m.role === "officer" ? "border-[#6605c7]/20 bg-[#6605c7]/5" : "border-gray-100 bg-gray-50"
                                        }`}>
                                            {m.role === "officer"
                                                ? <img src={agentInfo.avatar} alt="Officer" className="w-full h-full object-cover" />
                                                : <span className="material-symbols-outlined text-sm text-gray-400">person</span>
                                            }
                                        </div>
                                        <div className={`max-w-[70%] p-3.5 rounded-2xl text-[13px] font-bold leading-relaxed ${
                                            m.role === "officer" ? "bg-gray-50 text-gray-800" : "bg-[#6605c7] text-white"
                                        }`}>
                                            {m.content}
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Evaluation Metrics ── */}
            <AnimatePresence>
                {latestEval && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-2 flex flex-wrap items-center gap-3"
                    >
                        {(["clarity", "confidence", "relevance", "specificity", "persuasiveness"] as const).map(key => (
                            <EvalPill key={key} label={key} value={(latestEval as any)[key]} />
                        ))}
                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                            latestEval.risk === "Low" ? "bg-green-50 border-green-100 text-green-600"
                            : latestEval.risk === "Medium" ? "bg-amber-50 border-amber-100 text-amber-600"
                            : "bg-red-50 border-red-100 text-red-600"
                        }`}>
                            <span className="material-symbols-outlined text-[14px] align-middle mr-1.5">{latestEval.risk === "Low" ? "verified" : "warning"}</span>
                            {latestEval.risk} Risk Profile
                        </div>
                        {latestEval.quickTip && (
                            <button
                                onClick={() => setShowTip(p => !p)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shadow-sm ${
                                    showTip ? "bg-[#6605c7] text-white border-[#6605c7]" : "bg-white border-[#6605c7]/20 text-[#6605c7] hover:bg-gray-50"
                                }`}
                            >
                                💡 Strategy Tip
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showTip && latestEval?.quickTip && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mx-2 px-6 py-4 rounded-2xl bg-[#6605c7] text-white text-[13px] font-bold shadow-xl shadow-[#6605c7]/20 border border-[#6605c7]/10"
                    >
                        <div className="flex gap-4">
                             <span className="material-symbols-outlined shrink-0">lightbulb</span>
                             <p className="leading-relaxed">"{latestEval.quickTip}"</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Sticky Input Bar ── */}
            <div className="fixed bottom-6 inset-x-4 md:inset-x-0 mx-auto max-w-4xl z-50">
                <div className="bg-white/90 backdrop-blur-xl border border-gray-100 rounded-[28px] shadow-2xl shadow-gray-200 overflow-hidden p-2">
                    {/* Transcription preview */}
                    <AnimatePresence>
                        {isListening && (interimTranscript || currentInput) && (
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                className="overflow-hidden border-b border-gray-50 mb-2"
                            >
                                <div className="px-6 py-3 flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                                    <p className="text-[13px] text-gray-500 italic font-medium truncate">
                                        {currentInput}
                                        {interimTranscript && <span className="text-gray-300"> {interimTranscript}</span>}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex items-center gap-3 px-2">
                        {/* Textbox */}
                        <textarea
                            value={currentInput}
                            onChange={e => setCurrentInput(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder={
                                aiSpeaking ? `${agentInfo.label} is speaking…` :
                                isListening ? "Capturing voice…" :
                                isLoading ? "Analyzing response…" : "Enter your verbal response here…"
                            }
                            disabled={isLoading || aiSpeaking}
                            rows={1}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 placeholder:text-gray-400 resize-none py-3 px-4 text-[15px] font-bold min-h-[50px] max-h-32 outline-none"
                        />

                        <div className="flex items-center gap-2 pr-1">
                            {/* Speed */}
                            <select
                                value={playbackRate}
                                onChange={e => setPlaybackRate(Number(e.target.value) as 0.85 | 1 | 1.15)}
                                className="h-10 rounded-xl bg-gray-50 border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 px-3 outline-none hover:bg-white transition-all cursor-pointer"
                                disabled={neuralBusy}
                            >
                                <option value={0.85}>0.85x</option>
                                <option value={1}>1.0x</option>
                                <option value={1.15}>1.1x</option>
                            </select>

                            {/* Record Button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={toggleListening}
                                disabled={aiSpeaking || isLoading}
                                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-lg ${
                                    isListening ? "bg-red-500 text-white shadow-red-200" : "bg-gray-50 text-gray-400 border border-gray-100 hover:text-[#6605c7] hover:bg-white"
                                }`}
                            >
                                <span className="material-symbols-outlined text-xl">{isListening ? "mic" : "mic_none"}</span>
                            </motion.button>

                            {/* End Button */}
                             {messages.length >= 4 && (
                                <button
                                    onClick={onEnd}
                                    className="h-11 px-4 rounded-xl bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all border border-gray-100"
                                >
                                    End
                                </button>
                            )}

                            {/* Send Button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSend}
                                disabled={!currentInput.trim() || isLoading || aiSpeaking}
                                className="w-11 h-11 bg-[#6605c7] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#6605c7]/20 disabled:opacity-20 disabled:grayscale transition-all"
                            >
                                <span className="material-symbols-outlined font-black">arrow_upward</span>
                            </motion.button>
                        </div>
                    </div>
                </div>

                <div className="mt-3 text-center">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] italic">
                         Press ENTER to transmit • Auto-transmit enabled for voice
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

/* ─── Eval Pill ─── */
function EvalPill({ label, value }: { label: string; value: number }) {
    const color = value >= 7 ? "#10b981" : value >= 4 ? "#f59e0b" : "#ef4444";
    const bg = value >= 7 ? "bg-green-50" : value >= 4 ? "bg-amber-50" : "bg-red-50";
    
    return (
        <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl ${bg} border border-white shadow-sm`}>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label.slice(0, 4)}</span>
            <div className="w-10 h-1 rounded-full bg-gray-200/50 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value * 10}%` }}
                    className="h-full rounded-full"
                    style={{ background: color }}
                />
            </div>
            <span className="text-[10px] font-black italic" style={{ color }}>{value}</span>
        </div>
    );
}
