"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [step, setStep] = useState<"email" | "otp">("email");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [resendDisabled, setResendDisabled] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setResendDisabled(false);
        }
    }, [countdown]);

    const sendOtp = async () => {
        if (!email.trim()) { setError("Please enter your email"); return; }
        setLoading(true);
        setError("");
        try {
            await authApi.sendOtp(email.trim()) as { success: boolean };
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
                userExists: boolean;
                hasUserDetails?: boolean;
                firstName?: string;
                lastName?: string;
                refresh_token?: string;
                role?: string;
            };
            if (data.refresh_token) localStorage.setItem("refreshToken", data.refresh_token);
            login(data.access_token, {
                email: email.trim(),
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role as any
            });

            // Role-based redirection
            if (data.role === "admin" || data.role === "super_admin") {
                router.push("/admin");
                return;
            }

            // if user is new or doesn't yet have profile details, send them to the details page
            if (!data.userExists || data.hasUserDetails === false) {
                router.push("/user-details");
            } else {
                const redirectTo = searchParams.get("redirect");
                router.push(redirectTo ? decodeURIComponent(redirectTo) : "/dashboard");
            }
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
        <div className="min-h-screen bg-transparent flex items-center justify-center px-4 relative">
            {/* The global background from globals.css will show through here */}



            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-[#6605c7]/20 flex items-center justify-center border border-[#6605c7]/30">
                            <span className="material-symbols-outlined text-[#6605c7] text-3xl">school</span>
                        </div>
                        <span className="font-bold text-3xl font-display text-gray-900">VidhyaLoan</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 font-display mb-2">
                        {step === "email" ? "Welcome Back" : "Check Your Email"}
                    </h1>
                    <p className="text-gray-600 text-sm">
                        {step === "email"
                            ? "Sign in with your email — no password needed"
                            : `We sent a 6-digit code to ${email}`}
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                            <div className="relative">
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={step === "otp"}
                                    placeholder="you@example.com"
                                    className="w-full px-4 py-3.5 bg-white/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6605c7] focus:ring-2 focus:ring-[#6605c7]/20 transition-all disabled:opacity-60"
                                    required
                                />
                                {step === "otp" && (
                                    <button
                                        type="button"
                                        onClick={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); setError(""); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6605c7] hover:underline"
                                    >
                                        Change
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* OTP Input */}
                        {step === "otp" && (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-4">Enter OTP</label>
                                <div className="flex gap-3 justify-center" onPaste={handleOtpPaste}>
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
                                            className="w-12 h-14 text-center text-xl font-bold bg-white/50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#6605c7] focus:ring-2 focus:ring-[#6605c7]/20 transition-all"
                                        />
                                    ))}
                                </div>
                                <div className="text-center mt-4">
                                    {resendDisabled ? (
                                        <span className="text-xs text-gray-500">Resend in {countdown}s</span>
                                    ) : (
                                        <button type="button" onClick={sendOtp} className="text-xs text-[#6605c7] hover:underline font-bold">
                                            Resend OTP
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">error</span>
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            id="submitBtn"
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-[#6605c7] text-white font-bold rounded-xl hover:bg-[#7a0de8] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-[#6605c7]/30"
                        >
                            {loading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                                    {step === "email" ? "Sending..." : "Verifying..."}
                                </>
                            ) : step === "email" ? (
                                <>Get OTP <span className="material-symbols-outlined">arrow_forward</span></>
                            ) : (
                                <>Login <span className="material-symbols-outlined">login</span></>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    {/* <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                        <p className="text-gray-500 text-sm">
                            New to VidhyaLoan?{" "}
                            <Link href="/signup" className="text-[#6605c7] font-bold hover:underline">
                                Create an account
                            </Link>
                        </p>
                    </div> */}
                </div>

                <p className="text-center text-gray-500 text-xs mt-6">
                    By continuing, you agree to our{" "}
                    <Link href="/terms-conditions" className="hover:text-gray-400 underline">Terms</Link>
                    {" "}and{" "}
                    <Link href="/privacy-policy" className="hover:text-gray-400 underline">Privacy Policy</Link>
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-4xl text-[#6605c7]">progress_activity</span></div>}>
            <LoginContent />
        </Suspense>
    );
}
