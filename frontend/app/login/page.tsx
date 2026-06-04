"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";

interface LoginResponse {
    access_token: string;
    userId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    refresh_token?: string;
    userExists?: boolean;
    hasUserDetails?: boolean;
}

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [step, setStep] = useState<"email" | "otp" | "verifying" | "success">("email");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [resendDisabled, setResendDisabled] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [referralCode, setReferralCode] = useState<string | null>(null);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Capture referral code from URL on mount
    useEffect(() => {
        const ref = searchParams.get("ref");
        if (ref) {
            setReferralCode(ref);
            localStorage.setItem("referralCode", ref);
        } else {
            // Check if there's a stored referral code
            const stored = localStorage.getItem("referralCode");
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

    const verifyOtp = async (forcedCode?: string) => {
        const code = forcedCode || otp.join("");
        if (code.length !== 6) { setError("Please enter the 6-digit OTP"); return; }
        setLoading(true);
        setStep("verifying");
        setError("");
        try {
            const currentRef = referralCode || localStorage.getItem("referralCode");
            
            const data = await authApi.verifyOtp(email.trim(), code, currentRef || undefined) as LoginResponse;

            if (data.success === false || !data.access_token) {
                throw new Error(data.message || "Invalid OTP. Please enter the right one to login.");
            }

            if (data.role && ["staff", "admin", "super_admin", "bank", "partner_bank", "agent", "partner_agent"].includes(data.role)) {
                let portalName = "";
                if (data.role === "staff") portalName = "Staff Portal (/staff/login)";
                else if (data.role === "admin" || data.role === "super_admin") portalName = "Admin Portal (/admin/login)";
                else if (data.role === "bank" || data.role === "partner_bank") portalName = "Bank Portal (/bank/login)";
                else if (data.role === "agent" || data.role === "partner_agent") portalName = "Agent Portal (/agent/login)";
                
                throw new Error(`Access Denied: Please use the ${portalName} to login.`);
            }

            triggerSuccessAndRedirect(data, email.trim());
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Invalid OTP");
            setStep("otp");
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

        // Auto-verify as soon as the last digit is successfully typed
        if (newOtp.join("").length === 6) {
            verifyOtp(newOtp.join(""));
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

        if (newOtp.join("").length === 6) {
            verifyOtp(newOtp.join(""));
        }
    };

    const triggerSuccessAndRedirect = (data: LoginResponse, emailVal: string) => {
        // Switch to the success view stage to play the animation
        setStep("success");
        setError("");

        if (data.refresh_token) localStorage.setItem("refreshToken", data.refresh_token);
        
        login(data.access_token, {
            id: data.userId,
            email: emailVal,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role,
            refresh_token: data.refresh_token
        });

        // Clear stored referral code after login/signup
        localStorage.removeItem("referralCode");
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem("referralCode");
        }

        // Delayed redirect to let the gorgeous morphing animations play fully
        setTimeout(() => {
            if (data.role === "admin" || data.role === "super_admin") {
                router.push("/admin");
                return;
            }
            
            if (data.role === "bank" || data.role === "partner_bank") {
                router.push("/bank/dashboard");
                return;
            }

            if (data.role === "agent" || data.role === "partner_agent") {
                router.push("/agent/dashboard");
                return;
            }

            if (data.role === "staff") {
                router.push("/staff/dashboard");
                return;
            }

            if (!data.userExists || data.hasUserDetails === false) {
                router.push("/user-details");
            } else {
                const redirectTo = searchParams.get("redirect");
                router.push(redirectTo ? decodeURIComponent(redirectTo) : "/dashboard");
            }
        }, 1800);
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError("");
        try {
            if (!auth) {
                throw new Error("Google Login is not configured. Please add your Firebase API keys to .env.local");
            }
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();
            
            const data = await authApi.firebaseLogin(idToken) as LoginResponse;
            
            if (data.role && ["staff", "admin", "super_admin", "bank", "partner_bank", "agent", "partner_agent"].includes(data.role)) {
                let portalName = "";
                if (data.role === "staff") portalName = "Staff Portal (/staff/login)";
                else if (data.role === "admin" || data.role === "super_admin") portalName = "Admin Portal (/admin/login)";
                else if (data.role === "bank" || data.role === "partner_bank") portalName = "Bank Portal (/bank/login)";
                else if (data.role === "agent" || data.role === "partner_agent") portalName = "Agent Portal (/agent/login)";
                
                throw new Error(`Access Denied: Please use the ${portalName} to login.`);
            }
            
            triggerSuccessAndRedirect(data, result.user.email || "");
        } catch (e: unknown) {
            console.error("Google Login Error:", e);
            setError(e instanceof Error ? e.message : "Failed to login with Google");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitEmail = (e: React.FormEvent) => {
        e.preventDefault();
        sendOtp();
    };

    const handleSubmitOtp = (e: React.FormEvent) => {
        e.preventDefault();
        verifyOtp();
    };

    return (
        <div className="min-h-screen bg-transparent flex items-center justify-center px-4 relative">
            <div className="relative z-10 w-full max-w-md">
                {/* Referral Badge */}
                {referralCode && step !== "success" && step !== "verifying" && (
                    <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-xl px-4 py-3 flex items-center gap-3 animate-fade-in">
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center text-white shrink-0">
                            <span className="material-symbols-outlined text-sm">redeem</span>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">You&apos;ve been referred!</p>
                            <p className="text-xs text-gray-500">Sign up to activate your referral bonus</p>
                        </div>
                    </div>
                )}

                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
                        <img 
                            src="/vidyaloan_logo.png" 
                            alt="Vidyaloan Logo" 
                            className="w-10 h-10 object-contain group-hover:scale-105 transition-transform" 
                        />
                        <span className="font-bold text-2xl font-display text-gray-900 tracking-tight">Vidyaloan</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 font-display mb-1.5 tracking-tight">
                        {step === "email" ? "Welcome Back" : step === "otp" ? "Check Your Email" : step === "verifying" ? "Verifying OTP" : "Verified Successfully"}
                    </h1>
                    <p className="text-gray-500 text-[13px] font-normal">
                        {step === "email"
                            ? "Sign in with your email — no password needed"
                            : step === "otp"
                            ? `We sent a 6-digit code to ${email}`
                            : step === "verifying"
                            ? "Confirming validation details..."
                            : "Logging you into your dashboard..."}
                    </p>
                </div>

                {/* Card with Animations */}
                <div className="bg-white rounded-2xl p-8 shadow-xl shadow-black/[0.03] border border-gray-100 overflow-hidden min-h-[300px] flex flex-col justify-center transition-all duration-300">
                    <AnimatePresence mode="wait">
                        {step === "email" && (
                            <motion.div
                                key="email-stage"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="w-full"
                            >
                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                    className="w-full py-3 px-4 bg-white border border-gray-200 rounded-xl flex items-center justify-center gap-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all mb-6 cursor-pointer"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            fill="#EA4335"
                                        />
                                    </svg>
                                    Continue with Google
                                </button>

                                <div className="relative flex items-center gap-4 mb-6">
                                    <div className="flex-1 h-px bg-gray-100"></div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Or email</span>
                                    <div className="flex-1 h-px bg-gray-100"></div>
                                </div>

                                <form onSubmit={handleSubmitEmail} className="space-y-6">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={loading}
                                            placeholder="you@example.com"
                                            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#6605c7] focus:ring-4 focus:ring-[#6605c7]/5 transition-all"
                                            required
                                        />
                                    </div>

                                    {error && (
                                        <div className="px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium flex items-center gap-2">
                                            <span className="material-symbols-outlined text-base">error</span>
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        id="submitBtn"
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3.5 bg-[#6605c7] text-white font-bold rounded-xl hover:bg-[#5a04b1] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-[#6605c7]/20 text-[14px] cursor-pointer"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                                                Sending...
                                            </>
                                        ) : (
                                            <>Get OTP <span className="material-symbols-outlined text-base">arrow_forward</span></>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {step === "otp" && (
                            <motion.div
                                key="otp-stage"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.75 }}
                                transition={{ duration: 0.3 }}
                                className="w-full"
                            >
                                <form onSubmit={handleSubmitOtp} className="space-y-6">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                                        <div className="relative">
                                            <input
                                                id="email-readonly"
                                                type="email"
                                                value={email}
                                                disabled
                                                className="w-full px-4 py-3 bg-gray-100 border border-gray-100 rounded-xl text-gray-500 text-sm focus:outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); setError(""); }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#6605c7] font-bold hover:underline cursor-pointer"
                                            >
                                                Change
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">Enter OTP</label>
                                        <div className="flex gap-2.5 justify-center" onPaste={handleOtpPaste}>
                                            {otp.map((digit, i) => {
                                                const isActive = focusedIndex === i || digit !== "";
                                                return (
                                                    <div key={i} className="relative flex flex-col items-center">
                                                        <input
                                                            ref={(el) => { otpRefs.current[i] = el; }}
                                                            type="text"
                                                            inputMode="numeric"
                                                            maxLength={1}
                                                            value={digit}
                                                            onChange={(e) => handleOtpChange(i, e.target.value)}
                                                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                                            onFocus={() => setFocusedIndex(i)}
                                                            onBlur={() => setFocusedIndex(null)}
                                                            className="w-11 h-12 text-center text-lg font-bold bg-gray-50/50 border border-gray-100 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 transition-all"
                                                        />
                                                        {/* Glowing indicator line at the bottom */}
                                                        <motion.div
                                                            initial={{ scaleX: 0 }}
                                                            animate={{ scaleX: isActive ? 1 : 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full bg-gradient-to-r from-[#6605c7] to-[#10b981] shadow-[0_1px_6px_rgba(102,5,199,0.3)] origin-center"
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="text-center mt-4">
                                            {resendDisabled ? (
                                                <span className="text-[11px] text-gray-400 font-medium tracking-tight">Resend code in {countdown}s</span>
                                            ) : (
                                                <button type="button" onClick={sendOtp} className="text-[11px] text-[#6605c7] hover:underline font-bold uppercase tracking-wider cursor-pointer">
                                                    Resend OTP
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium flex items-center gap-2">
                                            <span className="material-symbols-outlined text-base">error</span>
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        id="submitBtnOtp"
                                        type="submit"
                                        disabled={loading || otp.join("").length !== 6}
                                        className="w-full py-3.5 bg-[#6605c7] text-white font-bold rounded-xl hover:bg-[#5a04b1] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-[#6605c7]/20 text-[14px] cursor-pointer"
                                    >
                                        Verify Code
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {step === "verifying" && (
                            <motion.div
                                key="verifying-stage"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                className="flex flex-col items-center justify-center gap-4 py-8 w-full"
                            >
                                <div className="relative flex items-center justify-center w-24 h-24">
                                    {/* Animated Spinner Ring */}
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                        className="absolute inset-0 rounded-full border-4 border-t-[#6605c7] border-r-transparent border-b-[#10b981] border-l-transparent"
                                    />
                                    {/* Combining Morphing Blob representing numbers merging */}
                                    <motion.div
                                        animate={{ 
                                            scale: [0.9, 1.1, 0.9],
                                            borderRadius: ["42% 58% 70% 30% / 45% 45% 55% 55%", "70% 30% 52% 48% / 60% 40% 60% 40%", "42% 58% 70% 30% / 45% 45% 55% 55%"]
                                        }}
                                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                        className="w-16 h-16 bg-gradient-to-tr from-[#6605c7] to-[#10b981] opacity-90 shadow-lg shadow-[#10b981]/20 flex items-center justify-center"
                                    >
                                        <span className="material-symbols-outlined text-white text-2xl animate-pulse">lock</span>
                                    </motion.div>
                                </div>
                                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider animate-pulse mt-4">
                                    Verifying code...
                                </span>
                            </motion.div>
                        )}

                        {step === "success" && (
                            <motion.div
                                key="success-stage"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className="flex flex-col items-center justify-center gap-4 py-8 w-full"
                            >
                                <motion.div 
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.15, type: "spring" }}
                                    className="flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.25)] mb-2 relative overflow-hidden"
                                >
                                    <svg 
                                        width="36" 
                                        height="36" 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        stroke="#10b981" 
                                        strokeWidth="3.5" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round"
                                    >
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </motion.div>
                                <h2 className="text-xl font-bold text-gray-900 font-display tracking-tight mt-2">
                                    Verified Successfully
                                </h2>
                                <span className="text-emerald-500 text-xs font-semibold uppercase tracking-wider animate-pulse">
                                    Welcome back
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {step !== "success" && step !== "verifying" && (
                    <p className="text-center text-gray-400 text-[11px] mt-8 font-normal leading-relaxed">
                        By continuing, you agree to our <Link href="/terms-conditions" className="text-gray-500 hover:text-[#6605c7] font-medium underline">Terms</Link> and <Link href="/privacy-policy" className="text-gray-500 hover:text-[#6605c7] font-medium underline">Privacy Policy</Link>
                    </p>
                )}
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
