"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";

function ITLoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login, isAuthenticated, isLoading } = useAuth();

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [step, setStep] = useState<"email" | "otp">("email");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [resendDisabled, setResendDisabled] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [devOtp, setDevOtp] = useState<string | null>(null);

    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (isLoading || !isAuthenticated) return;
        const redirectTo = searchParams.get("redirect");
        router.replace(redirectTo ? decodeURIComponent(redirectTo) : "/it");
    }, [isAuthenticated, isLoading, router, searchParams]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setResendDisabled(false);
        }
    }, [countdown]);

    const sendOtp = async () => {
        if (!email.trim()) { setError("Please enter your IT email"); return; }
        setLoading(true);
        setError("");
        try {
            const res = await authApi.sendOtp(email.trim()) as { success: boolean; otp?: string; userExists: boolean };
            if (res.otp) {
                setDevOtp(res.otp);
            } else {
                setDevOtp(null);
            }
            setStep("otp");
            setResendDisabled(true);
            setCountdown(60);
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        const digit = value.replace(/\D/g, "").slice(-1);
        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);
        if (digit && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        const newOtp = [...otp];
        pasted.split("").forEach((c, i) => { newOtp[i] = c; });
        setOtp(newOtp);
        otpRefs.current[Math.min(pasted.length, 5)]?.focus();
    };

    const verifyOtp = async () => {
        const code = otp.join("");
        if (code.length !== 6) { setError("Please enter the 6-digit OTP"); return; }
        setLoading(true);
        setError("");
        try {
            const data = await authApi.verifyOtp(email.trim(), code) as {
                success: boolean;
                access_token: string;
                role: string;
                userId?: string;
                firstName?: string;
                lastName?: string;
                refresh_token?: string;
            };

            if (data.success === false || !data.access_token) {
                throw new Error((data as any).message || "Invalid OTP. Please try again.");
            }

            login(data.access_token, {
                id: data.userId,
                email: email.trim(),
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role as any,
                refresh_token: data.refresh_token,
            });

            const redirectTo = searchParams.get("redirect");
            router.push(redirectTo ? decodeURIComponent(redirectTo) : "/it");
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (step === "email") sendOtp();
        else verifyOtp();
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative bg-slate-900">
            <div className="relative z-10 w-full max-w-md">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                            <span className="material-symbols-outlined text-indigo-400 text-3xl">developer_board</span>
                        </div>
                        <span className="font-bold text-3xl tracking-wide text-white">VidyaLoans<span className="text-indigo-400"> IT</span></span>
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {step === "email" ? "IT Operations Login" : "Verify OTP"}
                    </h1>
                    <p className="text-slate-400 text-sm">
                        {step === "email"
                            ? "Enter your IT email address to receive a access code"
                            : `A 6-digit access code has been sent to ${email}`}
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-slate-800/90 backdrop-blur-2xl border border-slate-700 rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-500/10 border-t-4 border-t-indigo-500">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 ml-1">IT Work Email</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">mail</span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={step === "otp" || loading}
                                    placeholder="it@vidyaloans.com"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-medium text-sm disabled:opacity-60"
                                    required
                                />
                                {step === "otp" && (
                                    <button
                                        type="button"
                                        onClick={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); setError(""); setDevOtp(null); }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-400 hover:underline"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                        </div>

                        {step === "otp" && (
                            <div className="animate-fade-in">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 ml-1">6-Digit Security OTP</label>
                                <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
                                    {otp.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={(el) => { otpRefs.current[i] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(i, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                            className="w-12 h-16 text-center text-2xl font-bold bg-slate-900 border border-slate-700 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                        />
                                    ))}
                                </div>
                                <div className="flex justify-between items-center mt-6 px-1">
                                    <span className="text-xs text-slate-400">Didn't receive code?</span>
                                    {resendDisabled ? (
                                        <span className="text-xs font-bold text-slate-400">Resend in {countdown}s</span>
                                    ) : (
                                        <button type="button" onClick={sendOtp} className="text-xs text-indigo-400 hover:underline font-bold uppercase tracking-wider">
                                            Resend Now
                                        </button>
                                    )}
                                </div>
                                {devOtp && (
                                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-300 text-xs text-center font-medium animate-fade-in flex flex-col items-center gap-1">
                                        <span className="font-bold uppercase tracking-wider text-[10px] text-amber-400">Development Bypass OTP</span>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                setOtp(devOtp.split(""));
                                                setTimeout(() => otpRefs.current[5]?.focus(), 100);
                                            }} 
                                            className="mt-1 font-mono font-bold bg-amber-500/20 border border-amber-400/30 px-3 py-1 rounded-lg text-amber-200 hover:bg-amber-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">edit_square</span>
                                            {devOtp} (Autofill)
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-medium flex items-start gap-3">
                                <span className="material-symbols-outlined text-lg">gpp_maybe</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-indigo-600 text-white font-bold uppercase tracking-widest text-xs rounded-2xl hover:bg-indigo-500 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/25 cursor-pointer"
                        >
                            {loading ? (
                                <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                            ) : step === "email" ? (
                                <>Verify Email <span className="material-symbols-outlined text-lg">arrow_forward</span></>
                            ) : (
                                <>Access IT Dashboard <span className="material-symbols-outlined text-lg">lock_open</span></>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function ITLoginPage() {
    return (
        <Suspense fallback={null}>
            <ITLoginContent />
        </Suspense>
    );
}
