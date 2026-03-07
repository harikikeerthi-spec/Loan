"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    risk: "Low" | "Medium" | "High";
    redFlags: string[];
    missingDetails: string[];
    suggestedImprovement: string[];
}

export interface InterviewSection {
    id: string;
    label: string;
    completed: boolean;
}

interface VisaVoiceInterviewProps {
    messages: InterviewMessage[];
    currentInput: string;
    setCurrentInput: (v: string) => void;
    isLoading: boolean;
    onSend: (overrideText?: string) => void;
    onEnd: () => void;
    visaType: string;
    latestEval: EvaluationResult | null;
    sections: InterviewSection[];
    currentSection: string;
    questionCount: number;
    evaluations: EvaluationResult[];
}

/* ════════════════════════════════════════════════
   Atlys-style Voice Interview Component
   ════════════════════════════════════════════════ */
export default function VisaVoiceInterview({
    messages,
    currentInput,
    setCurrentInput,
    isLoading,
    onSend,
    onEnd,
    visaType,
    latestEval,
    sections,
    currentSection,
    questionCount,
    evaluations,
}: VisaVoiceInterviewProps) {
    /* ── Media & Audio ── */
    const streamRef = useRef<MediaStream | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const rafRef = useRef<number>(0);
    const [userAudioLevel, setUserAudioLevel] = useState(0);
    const [mediaError, setMediaError] = useState<string | null>(null);

    /* ── AI Speaking ── */
    const [aiSpeaking, setAiSpeaking] = useState(false);

    /* ── Speech Recognition ── */
    const recognitionRef = useRef<any>(null);
    const [isListening, setIsListening] = useState(false);
    const isListeningRef = useRef(false);
    const aiSpeakingRef = useRef(false);
    const [interimTranscript, setInterimTranscript] = useState("");
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const accumulatedRef = useRef("");

    /* ── Timer ── */
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setElapsed(p => p + 1), 1000);
        return () => clearInterval(t);
    }, []);
    const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    /* ── Show transcript toggle ── */
    const [showTranscript, setShowTranscript] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    /* ── Latest AI question display ── */
    const lastOfficerMsg = [...messages].reverse().find(m => m.role === "officer");

    /* ═══ Init Microphone ═══ */
    useEffect(() => {
        let cancelled = false;
        const init = async () => {
            try {
                const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
                if (cancelled) { ms.getTracks().forEach(t => t.stop()); return; }
                streamRef.current = ms;

                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                if (ctx.state === "suspended") await ctx.resume();
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 256;
                ctx.createMediaStreamSource(ms).connect(analyser);
                audioCtxRef.current = ctx;
                analyserRef.current = analyser;

                const buf = new Uint8Array(analyser.frequencyBinCount);
                const tick = () => {
                    if (analyserRef.current) {
                        analyserRef.current.getByteFrequencyData(buf);
                        setUserAudioLevel(buf.reduce((a, b) => a + b, 0) / buf.length / 128);
                        rafRef.current = requestAnimationFrame(tick);
                    }
                };
                tick();
            } catch (e: any) {
                setMediaError(e.message || "Mic denied");
            }
        };
        if (typeof window !== "undefined") init();
        return () => {
            cancelled = true;
            cancelAnimationFrame(rafRef.current);
            streamRef.current?.getTracks().forEach(t => t.stop());
            audioCtxRef.current?.close().catch(() => { });
        };
    }, []);

    /* ═══ Send Handler ═══ */
    const handleSend = useCallback((overrideText?: string) => {
        const text = (typeof overrideText === "string" ? overrideText : currentInput).trim();
        if (text) {
            onSend(text);
            accumulatedRef.current = "";
            setCurrentInput("");
            setInterimTranscript("");
        }
    }, [currentInput, onSend, setCurrentInput]);

    /* ═══ Speech Recognition ═══ */
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
            let final = "";
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const t = e.results[i][0].transcript;
                if (e.results[i].isFinal) final += t;
                else interim += t;
            }
            if (final) {
                accumulatedRef.current = (accumulatedRef.current + " " + final).trim();
                setCurrentInput(accumulatedRef.current);
                setInterimTranscript("");
            } else {
                setInterimTranscript(interim);
            }

            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            if (accumulatedRef.current.trim() || interim.trim()) {
                silenceTimerRef.current = setTimeout(() => {
                    if (accumulatedRef.current.trim()) handleSend(accumulatedRef.current);
                }, 2500);
            }
        };
        rec.onend = () => { isListeningRef.current = false; setIsListening(false); };
        rec.onerror = () => { isListeningRef.current = false; setIsListening(false); };
        recognitionRef.current = rec;
    }, [setCurrentInput, handleSend]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListeningRef.current && !aiSpeakingRef.current) {
            accumulatedRef.current = "";
            setCurrentInput("");
            setInterimTranscript("");
            try {
                recognitionRef.current.start();
                isListeningRef.current = true;
                setIsListening(true);
            } catch { }
        }
    }, [setCurrentInput]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch { }
        }
        isListeningRef.current = false;
        setIsListening(false);
    }, []);

    const toggleListening = useCallback(() => {
        isListeningRef.current ? stopListening() : startListening();
    }, [startListening, stopListening]);

    /* ═══ AI TTS ═══ */
    useEffect(() => {
        const last = messages[messages.length - 1];
        if (last?.role === "officer" && typeof window !== "undefined") {
            // Stop listening while AI speaks
            stopListening();
            window.speechSynthesis.cancel();
            const utt = new SpeechSynthesisUtterance(last.content);
            utt.rate = 1.0;
            utt.pitch = 0.95;
            utt.onstart = () => {
                aiSpeakingRef.current = true;
                setAiSpeaking(true);
            };
            utt.onend = () => {
                aiSpeakingRef.current = false;
                setAiSpeaking(false);
                // Directly start recognition after TTS ends
                setTimeout(() => {
                    if (recognitionRef.current && !isListeningRef.current) {
                        accumulatedRef.current = "";
                        setCurrentInput("");
                        setInterimTranscript("");
                        try {
                            recognitionRef.current.start();
                            isListeningRef.current = true;
                            setIsListening(true);
                        } catch { }
                    }
                }, 500);
            };
            utt.onerror = () => {
                aiSpeakingRef.current = false;
                setAiSpeaking(false);
            };
            window.speechSynthesis.speak(utt);
        }
    }, [messages, stopListening, setCurrentInput]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const avgScore = evaluations.length
        ? Math.round(evaluations.reduce((a, e) => a + (e.clarity + e.confidence + e.relevance) / 3, 0) / evaluations.length * 10)
        : 0;

    const completedCount = sections.filter(s => s.completed).length;
    const progressPct = (completedCount / sections.length) * 100;

    /* ─── Waveform bars helper ─── */
    const aiWaveBars = Array.from({ length: 40 });
    const userWaveBars = Array.from({ length: 40 });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#080c14] flex flex-col overflow-hidden"
            style={{ zIndex: 100 }}
        >
            {/* ── Circuit-board grid background ── */}
            <div className="absolute inset-0 pointer-events-none">
                <svg width="100%" height="100%" className="opacity-[0.04]">
                    <defs>
                        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#4a90e2" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
                {/* Corner circuit lines */}
                <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
                    <path d="M720,450 L400,450 L400,350 L200,350" stroke="#4a90e2" strokeWidth="1" fill="none" strokeDasharray="4 8" />
                    <path d="M720,450 L1040,450 L1040,350 L1240,350" stroke="#4a90e2" strokeWidth="1" fill="none" strokeDasharray="4 8" />
                    <path d="M720,450 L720,600 L600,600" stroke="#4a90e2" strokeWidth="1" fill="none" strokeDasharray="4 8" />
                    <path d="M720,450 L720,600 L840,600" stroke="#4a90e2" strokeWidth="1" fill="none" strokeDasharray="4 8" />
                    <circle cx="400" cy="350" r="4" fill="#4a90e2" opacity="0.6" />
                    <circle cx="1040" cy="350" r="4" fill="#4a90e2" opacity="0.6" />
                    <circle cx="600" cy="600" r="4" fill="#4a90e2" opacity="0.6" />
                    <circle cx="840" cy="600" r="4" fill="#4a90e2" opacity="0.6" />
                </svg>
                {/* Ambient glows */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-900/20 blur-[120px]" />
            </div>

            {/* ── Top bar ── */}
            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-[0.2em]">LIVE • {fmt(elapsed)}</span>
                    </div>
                    <div className="h-4 w-px bg-white/10" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{visaType}</span>
                </div>
                <div className="flex items-center gap-4">
                    {avgScore > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Score</span>
                            <span className="text-sm font-black text-white">{avgScore}</span>
                            <span className="text-[9px] text-gray-600">/100</span>
                        </div>
                    )}
                    <button onClick={() => setShowTranscript(p => !p)} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:bg-white/10 transition-colors">
                        {showTranscript ? "Hide" : "Transcript"}
                    </button>
                    {messages.length >= 4 && (
                        <button onClick={onEnd} className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[9px] font-black text-red-400 uppercase tracking-widest hover:bg-red-500/20 transition-colors">
                            End
                        </button>
                    )}
                </div>
            </div>

            {/* ── Section progress bar ── */}
            <div className="relative z-10 h-0.5 bg-white/5">
                <motion.div animate={{ width: `${progressPct}%` }} transition={{ duration: 0.8 }} className="h-full bg-gradient-to-r from-blue-600 to-blue-400" />
            </div>

            {/* ── Main interview area ── */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 gap-8 overflow-hidden">

                {/* ──────── CENTER: AI officer visualizer ──────── */}
                <div className="flex flex-col items-center gap-6 w-full max-w-2xl">

                    {/* AI avatar + waveform */}
                    <div className="relative flex flex-col items-center gap-5">
                        {/* Outer glow ring */}
                        <div className="relative">
                            {/* Pulsing ring when speaking */}
                            <AnimatePresence>
                                {(aiSpeaking || isLoading) && (
                                    <motion.div
                                        key="ring"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.15, 1] }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 1.8, repeat: Infinity }}
                                        className="absolute inset-0 rounded-full border-2 border-blue-500/50 -m-6"
                                    />
                                )}
                            </AnimatePresence>

                            {/* Avatar */}
                            <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center relative overflow-hidden transition-all duration-500
                                ${aiSpeaking ? "shadow-[0_0_60px_rgba(59,130,246,0.4)]" : "shadow-[0_0_20px_rgba(59,130,246,0.1)]"}`}
                                style={{
                                    background: "radial-gradient(circle at 35% 35%, #1e3a5f, #0a1628)",
                                    border: "2px solid rgba(59,130,246,0.3)"
                                }}
                            >
                                {/* Inner glow */}
                                <div className={`absolute inset-0 rounded-full transition-opacity duration-500 ${aiSpeaking ? "opacity-100" : "opacity-30"}`}
                                    style={{ background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)" }} />
                                <span className="material-symbols-outlined text-blue-300 relative z-10" style={{ fontSize: "60px", fontVariationSettings: "'FILL' 0" }}>
                                    support_agent
                                </span>
                            </div>
                        </div>

                        {/* Officer label */}
                        <div className="text-center">
                            <div className="text-sm font-black text-white uppercase tracking-[0.2em] mb-1">Consular Officer</div>
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${aiSpeaking ? "bg-blue-500/20 border border-blue-500/30 text-blue-400" :
                                isLoading ? "bg-amber-500/20 border border-amber-500/30 text-amber-400 animate-pulse" :
                                    isListening ? "bg-green-500/20 border border-green-500/30 text-green-400" :
                                        "bg-white/5 border border-white/10 text-gray-500"
                                }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${aiSpeaking ? "bg-blue-400 animate-pulse" : isLoading ? "bg-amber-400 animate-pulse" : isListening ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
                                {aiSpeaking ? "Speaking" : isLoading ? "Analyzing…" : isListening ? "Listening to you" : "Waiting"}
                            </div>
                        </div>

                        {/* AI Waveform bars */}
                        <div className="flex items-end justify-center gap-[3px] h-10 w-64">
                            {aiWaveBars.map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        height: aiSpeaking ? `${6 + Math.abs(Math.sin((i / 5) + Date.now() / 300)) * 28}px` : "3px",
                                        backgroundColor: aiSpeaking ? "#3b82f6" : "#1e3a5f",
                                    }}
                                    transition={{ duration: 0.12, repeat: aiSpeaking ? Infinity : 0, repeatType: "mirror", delay: i * 0.02 % 0.3 }}
                                    className="w-[4px] rounded-full"
                                />
                            ))}
                        </div>
                    </div>

                    {/* ── Current AI question bubble ── */}
                    <AnimatePresence mode="wait">
                        {lastOfficerMsg && (
                            <motion.div
                                key={lastOfficerMsg.content}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.4 }}
                                className="w-full max-w-xl text-center"
                            >
                                <p className="text-white/90 text-base md:text-lg font-medium leading-relaxed">
                                    {lastOfficerMsg.content}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── Separator ── */}
                    <div className="w-32 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    {/* ── User mic visualizer ── */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex items-end justify-center gap-[3px] h-8 w-48">
                            {userWaveBars.map((_, i) => {
                                const amp = isListening ? Math.max(3, userAudioLevel * 50 * (0.3 + Math.random() * 0.7)) : 3;
                                return (
                                    <div
                                        key={i}
                                        className={`w-[4px] rounded-full transition-all duration-75 ${isListening ? "bg-green-400/70" : "bg-white/10"}`}
                                        style={{ height: `${amp}px` }}
                                    />
                                );
                            })}
                        </div>
                        <div className={`text-[9px] font-black uppercase tracking-[0.2em] transition-colors ${isListening ? "text-green-400" : "text-gray-600"}`}>
                            {isListening ? "Your microphone is live" : "Tap to speak"}
                        </div>
                    </div>
                </div>

                {/* ── Section tracker (horizontal dots) ── */}
                <div className="flex items-center gap-3">
                    {sections.map((s, i) => (
                        <div key={s.id} className="flex items-center gap-2">
                            <div className={`h-1.5 rounded-full transition-all duration-500 ${s.completed ? "w-6 bg-blue-500" :
                                s.id === currentSection ? "w-8 bg-blue-400 animate-pulse" :
                                    "w-3 bg-white/10"
                                }`} />
                            {s.id === currentSection && (
                                <span className="text-[8px] text-blue-400 font-bold uppercase tracking-widest hidden md:block">{s.label}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Transcript panel ── */}
            <AnimatePresence>
                {showTranscript && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="relative z-10 border-t border-white/5 overflow-hidden max-h-[220px] overflow-y-auto bg-black/40 backdrop-blur-xl"
                    >
                        <div className="p-4 space-y-2">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex gap-3 ${m.role === "applicant" ? "flex-row-reverse" : ""}`}>
                                    <div className={`text-[10px] font-bold px-3 py-1.5 rounded-xl max-w-[80%] leading-relaxed ${m.role === "officer" ? "bg-blue-500/10 text-blue-300 border border-blue-500/20" : "bg-white/5 text-gray-300 border border-white/10"
                                        }`}>
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Bottom controls bar ── */}
            <div className="relative z-10 border-t border-white/5 bg-[#080c14]/90 backdrop-blur-2xl px-6 py-4">
                {/* Live transcript preview */}
                {(isListening && (currentInput || interimTranscript)) && (
                    <div className="mb-3 text-sm text-gray-400 italic text-center truncate px-4">
                        {currentInput}<span className="text-gray-600"> {interimTranscript}</span>
                    </div>
                )}

                {mediaError && (
                    <div className="mb-3 text-center">
                        <span className="text-[10px] text-red-400 font-bold">⚠ Microphone blocked — </span>
                        <button onClick={() => window.location.reload()} className="text-[10px] text-white underline font-bold">Reload & grant access</button>
                    </div>
                )}

                <div className="flex items-center gap-3 max-w-2xl mx-auto">
                    {/* Mic toggle button — prominent */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleListening}
                        disabled={aiSpeaking || !!mediaError}
                        className={`relative flex items-center justify-center w-14 h-14 rounded-2xl shrink-0 transition-all duration-300 disabled:opacity-40 ${isListening
                            ? "bg-green-500/20 border-2 border-green-500/60 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                            : "bg-white/5 border border-white/10 hover:bg-white/10"
                            }`}
                    >
                        {isListening && <span className="absolute inset-0 rounded-2xl border border-green-400/30 animate-ping" />}
                        <span className="material-symbols-outlined text-2xl"
                            style={{ color: isListening ? "#4ade80" : "#9ca3af" }}>
                            {isListening ? "mic" : "mic_none"}
                        </span>
                    </motion.button>

                    {/* Text input */}
                    <div className="flex-1 relative">
                        <textarea
                            value={currentInput}
                            onChange={e => setCurrentInput(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder={isListening ? "Listening…" : aiSpeaking ? "Officer is speaking…" : "Or type your answer here…"}
                            disabled={isLoading || aiSpeaking}
                            rows={1}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-gray-600 resize-none focus:outline-none focus:border-blue-500/40 transition-colors"
                        />
                    </div>

                    {/* Send button */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleSend()}
                        disabled={!currentInput.trim() || isLoading || aiSpeaking}
                        className="w-12 h-12 bg-blue-600 hover:bg-blue-500 disabled:opacity-20 disabled:cursor-not-allowed text-white rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-lg shadow-blue-600/20"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_upward</span>
                    </motion.button>
                </div>

                {/* Live eval pills */}
                {latestEval && (
                    <div className="flex items-center justify-center gap-4 mt-3">
                        <EvalChip label="Clarity" val={latestEval.clarity} />
                        <EvalChip label="Confidence" val={latestEval.confidence} />
                        <EvalChip label="Relevance" val={latestEval.relevance} />
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function EvalChip({ label, val }: { label: string; val: number }) {
    const color = val >= 7 ? "#4ade80" : val >= 5 ? "#facc15" : "#f87171";
    return (
        <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{label}</span>
            <div className="w-12 h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${val * 10}%` }} className="h-full rounded-full" style={{ background: color }} />
            </div>
            <span className="text-[9px] font-black" style={{ color }}>{val}</span>
        </div>
    );
}
