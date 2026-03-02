"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authApi, referralApi } from "@/lib/api";

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
    const [referralCode, setReferralCode] = useState<string | null>(null);

    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Capture referral code from URL on mount
    useEffect(() => {
        const ref = searchParams.get("ref");
        if (ref) {
            setReferralCode(ref);
            // Store in sessionStorage in case user refreshes
            sessionStorage.setItem("referralCode", ref);
        } else {
            // Check if there's a stored referral code
            const stored = sessionStorage.getItem("referralCode");
            if (stored) setReferralCode(stored);
        }
    }, [searchParams]);

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
                userId?: string;
            };
            if (data.refresh_token) localStorage.setItem("refreshToken", data.refresh_token);
            login(data.access_token, {
                email: email.trim(),
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role as any
            });

            // Record referral for new users
            if (!data.userExists && referralCode) {
                try {
                    // Try to record the referral - backend will validate the code
                    await referralApi.recordReferral({
                        referralCode,
                        referredUserId: data.userId || email.trim() // Use email as fallback identifier
                    });
                    // Clear stored referral code after successful recording
                    sessionStorage.removeItem("referralCode");
                } catch (refError) {
                    // Don't block login if referral recording fails
                    console.error("Failed to record referral:", refError);
                }
            }

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
                router.push(redirectTo ? decodeURIComponent(redirectTo) : "/");
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
                {/* Referral Badge */}
                {referralCode && (
                    <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-xl px-4 py-3 flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center text-white shrink-0">
                            <span className="material-symbols-outlined text-sm">redeem</span>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">You&apos;ve been referred!</p>
                            <p className="text-xs text-gray-500">Sign up to activate your referral bonus</p>
                        </div>
                    </div>
                )}

                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
                        <div className="w-10 h-10 rounded-xl bg-[#6605c7] flex items-center justify-center text-white shadow-lg shadow-[#6605c7]/20 group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-xl">school</span>
                        </div>
                        <span className="font-bold text-2xl font-display text-gray-900 tracking-tight">Vidhyaloan</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 font-display mb-1.5 tracking-tight">
                        {step === "email" ? "Welcome Back" : "Check Your Email"}
                    </h1>
                    <p className="text-gray-500 text-[13px] font-normal">
                        {step === "email"
                            ? "Sign in with your email — no password needed"
                            : `We sent a 6-digit code to ${email}`}
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl p-8 shadow-xl shadow-black/[0.03] border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                            <div className="relative">
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={step === "otp"}
                                    placeholder="you@example.com"
                                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#6605c7] focus:ring-4 focus:ring-[#6605c7]/5 transition-all disabled:opacity-60"
                                    required
                                />
                                {step === "otp" && (
                                    <button
                                        type="button"
                                        onClick={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); setError(""); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#6605c7] font-bold hover:underline"
                                    >
                                        Change
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* OTP Input */}
                        {step === "otp" && (
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">Enter OTP</label>
                                <div className="flex gap-2.5 justify-center" onPaste={handleOtpPaste}>
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
                                            className="w-11 h-12 text-center text-lg font-bold bg-gray-50/50 border border-gray-100 rounded-xl text-gray-900 focus:outline-none focus:border-[#6605c7] focus:ring-4 focus:ring-[#6605c7]/5 transition-all"
                                        />
                                    ))}
                                </div>
                                <div className="text-center mt-4">
                                    {resendDisabled ? (
                                        <span className="text-[11px] text-gray-400 font-medium tracking-tight">Resend code in {countdown}s</span>
                                    ) : (
                                        <button type="button" onClick={sendOtp} className="text-[11px] text-[#6605c7] hover:underline font-bold uppercase tracking-wider">
                                            Resend OTP
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium flex items-center gap-2">
                                <span className="material-symbols-outlined text-base">error</span>
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            id="submitBtn"
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-[#6605c7] text-white font-bold rounded-xl hover:bg-[#5a04b1] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-[#6605c7]/20 text-[14px]"
                        >
                            {loading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                                    {step === "email" ? "Sending..." : "Verifying..."}
                                </>
                            ) : step === "email" ? (
                                <>Get OTP <span className="material-symbols-outlined text-base">arrow_forward</span></>
                            ) : (
                                <>Login <span className="material-symbols-outlined text-base">login</span></>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-gray-400 text-[11px] mt-8 font-normal leading-relaxed">
                    By continuing, you agree to our <Link href="/terms-conditions" className="text-gray-500 hover:text-[#6605c7] font-medium underline">Terms</Link> and <Link href="/privacy-policy" className="text-gray-500 hover:text-[#6605c7] font-medium underline">Privacy Policy</Link>
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
