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
    success?: boolean;
    message?: string;
    access_token: string;
    userId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    refresh_token?: string;
    userExists?: boolean;
    hasUserDetails?: boolean;
    phoneNumber?: string;
    dateOfBirth?: string;
}

const QUOTES = [
    { text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.", author: "Malcolm X" },
    { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
    { text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle" },
    { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
    { text: "Education is not preparation for life; education is life itself.", author: "John Dewey" }
];

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
    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
    const [isEmailFocused, setIsEmailFocused] = useState(false);

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

    // Quote rotation effect
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentQuoteIndex((prev) => (prev + 1) % QUOTES.length);
        }, 7000);
        return () => clearInterval(interval);
    }, []);

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

            if (!data.access_token) {
                throw new Error("Invalid OTP. Please enter the right one to login.");
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
            refresh_token: data.refresh_token,
            phoneNumber: data.phoneNumber,
            dateOfBirth: data.dateOfBirth,
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
        <div className="min-h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-white/5">
            {/* Left Column: Academic Arch & Rotating Quotes */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 bg-gradient-to-br from-[#0c1424] via-[#050b14] to-[#02050a] text-white relative overflow-hidden border-r border-[#d4af37]/10">
                {/* Decorative background grid and classical arches */}
                <div className="absolute inset-0 z-0 opacity-25 pointer-events-none">
                    <svg className="w-full h-full stroke-[#d4af37]/35 fill-none" viewBox="0 0 800 800">
                        <defs>
                            <linearGradient id="gridGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#d4af37" stopOpacity="0.4" />
                                <stop offset="50%" stopColor="#6605c7" stopOpacity="0.1" />
                                <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        {/* Classical Architectural Arches */}
                        <path d="M 100 800 C 100 350, 220 150, 400 150 C 580 150, 700 350, 700 800" strokeWidth="2.5" stroke="url(#gridGrad)" />
                        <path d="M 180 800 C 180 430, 270 240, 400 240 C 530 240, 620 430, 620 800" strokeWidth="1.5" stroke="url(#gridGrad)" />
                        <path d="M 260 800 C 260 500, 320 330, 400 330 C 480 330, 540 500, 540 800" strokeWidth="1" stroke="url(#gridGrad)" />

                        {/* Floor Perspective Lines representing Banking Growth and structural geometry */}
                        <line x1="400" y1="150" x2="400" y2="800" strokeWidth="1" stroke="url(#gridGrad)" />
                        <line x1="400" y1="150" x2="50" y2="800" strokeWidth="0.5" stroke="url(#gridGrad)" />
                        <line x1="400" y1="150" x2="150" y2="800" strokeWidth="0.5" stroke="url(#gridGrad)" />
                        <line x1="400" y1="150" x2="280" y2="800" strokeWidth="0.5" stroke="url(#gridGrad)" />
                        <line x1="400" y1="150" x2="520" y2="800" strokeWidth="0.5" stroke="url(#gridGrad)" />
                        <line x1="400" y1="150" x2="650" y2="800" strokeWidth="0.5" stroke="url(#gridGrad)" />
                        <line x1="400" y1="150" x2="750" y2="800" strokeWidth="0.5" stroke="url(#gridGrad)" />

                        {/* Horizon steps */}
                        <line x1="0" y1="450" x2="800" y2="450" strokeWidth="0.5" stroke="url(#gridGrad)" />
                        <line x1="0" y1="560" x2="800" y2="560" strokeWidth="0.5" stroke="url(#gridGrad)" />
                        <line x1="0" y1="680" x2="800" y2="680" strokeWidth="0.5" stroke="url(#gridGrad)" />
                    </svg>
                </div>

                {/* Floating academic and banking icons in background */}
                <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
                    <span className="material-symbols-outlined text-[10rem] absolute -top-8 -left-8 text-amber-500/20 rotate-12">school</span>
                    <span className="material-symbols-outlined text-[8rem] absolute top-1/4 -right-8 text-purple-500/20 -rotate-12">globe</span>
                    <span className="material-symbols-outlined text-8xl absolute bottom-1/4 left-10 text-emerald-500/20 rotate-45">finance</span>
                </div>

                {/* Top brand signature */}
                <div className="z-10 flex items-center gap-3 select-none">
                    <img src="/images/vidyaloans-logo-transparent.png" alt="Vidyaloan Logo" className="w-20 h-20 object-contain filter drop-shadow-[0_2px_8px_rgba(212,175,55,0.2)]" />
                    <span className="text-xl font-black font-display tracking-widest uppercase bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">VidyaLoans</span>
                </div>

                {/* Inspirational Quote Container (Center-aligned) */}
                <div className="z-10 max-w-lg my-auto space-y-8 pr-6">
                    <div className="w-16 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full" />
                    <div className="min-h-[180px] flex flex-col justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentQuoteIndex}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.65, ease: "easeInOut" }}
                                className="space-y-6"
                            >
                                <p className="text-3xl font-serif italic font-light leading-relaxed text-gray-200">
                                    &ldquo;{QUOTES[currentQuoteIndex].text}&rdquo;
                                </p>
                                <p className="text-xs font-bold tracking-widest uppercase text-amber-400/80 font-mono flex items-center gap-2">
                                    <span className="w-4 h-px bg-amber-400/60 inline-block" />
                                    {QUOTES[currentQuoteIndex].author}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Left Column footer status */}
                <div className="z-10 flex items-center justify-between text-[10px] text-gray-500 font-mono tracking-widest uppercase">
                    <span>Gateways to Global Learning</span>
                    <span>EST. 2024</span>
                </div>
            </div>

            {/* Right Column: Passport to the Future Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 lg:p-12 min-h-screen relative z-10">
                <div className="w-full max-w-md relative z-10 flex flex-col justify-center">
                    {/* Referral Badge */}
                    {referralCode && step !== "success" && step !== "verifying" && (
                        <div className="mb-6 w-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl px-5 py-3.5 flex items-center gap-3.5 animate-fade-in backdrop-blur-md">
                            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-orange-500/10">
                                <span className="material-symbols-outlined text-sm font-bold">redeem</span>
                            </div>
                            <div>
                                <p className="text-xs font-black text-amber-100 uppercase tracking-wider">You&apos;ve Been Referred!</p>
                                <p className="text-[10px] text-gray-400 font-medium">Complete registration to activate your referral reward</p>
                            </div>
                        </div>
                    )}

                    {/* Passport Container */}
                    <div
                        className="w-full bg-[#0d1627] rounded-[2.5rem] p-1 border border-[#d4af37]/30 shadow-[0_25px_6px_rgba(5,11,20,0.5)] overflow-hidden relative"
                        style={{
                            backgroundImage: `
                                radial-gradient(circle at 50% 50%, rgba(27, 45, 79, 0.95), rgba(13, 22, 39, 0.99)),
                                repeating-linear-gradient(45deg, rgba(0, 0, 0, 0.04) 0px, rgba(0, 0, 0, 0.04) 1px, transparent 1px, transparent 4px),
                                repeating-linear-gradient(-45deg, rgba(0, 0, 0, 0.04) 0px, rgba(0, 0, 0, 0.04) 1px, transparent 1px, transparent 4px)
                            `,
                        }}
                    >
                        {/* Inner Gold Foil Border */}
                        <div className="border border-[#d4af37]/20 rounded-[2.2rem] p-6 lg:p-10 flex flex-col justify-center min-h-[420px] relative overflow-hidden">

                            {/* Visa/Passport Stamps Overlay (Decorative background) */}
                            <div className="absolute inset-0 pointer-events-none opacity-[0.05] z-0 flex items-center justify-center select-none">
                                <span className="text-8xl font-black font-mono border-8 border-rose-500 text-rose-500 rounded-3xl p-4 rotate-12 uppercase tracking-widest">
                                    APPROVED
                                </span>
                            </div>
                            <div className="absolute top-6 right-6 pointer-events-none opacity-25 z-0 select-none">
                                <div className="border-2 border-red-500/60 text-red-500/60 rounded px-2.5 py-0.5 font-mono text-[9px] tracking-widest uppercase rotate-[15deg]">
                                    VISA ISSUED
                                </div>
                            </div>

                            {/* Passport Emblem & Header */}
                            <div className="text-center mb-6 z-10 flex flex-col items-center">
                                <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[#d4af37]/80 font-serif">
                                    PASSPORT TO THE FUTURE
                                </span>

                                {/* Embossed Crest SVG */}
                                <div className="my-4 w-12 h-12 flex items-center justify-center text-[#d4af37] opacity-80 filter drop-shadow-[0_2px_4px_rgba(212,175,55,0.25)] select-none">
                                    <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
                                        <path d="M12 2L1 7l11 5 9-4.09V17h2V7L12 2z" />
                                        <path d="M4.11 11.24v3.52c0 2.21 3.53 4 7.89 4s7.89-1.79 7.89-4v-3.52l-7.89 3.59-7.89-3.59z" />
                                        <circle cx="12" cy="12" r="2" />
                                    </svg>
                                </div>

                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#d4af37]/50 font-mono">
                                    VIDYALOANS INTERNATIONAL
                                </span>
                            </div>

                            {/* Title Segment */}
                            <div className="text-center mb-6 z-10">
                                <h2 className="text-xl font-bold font-serif text-white tracking-wide uppercase">
                                    {step === "email" ? "DOCUMENT RETRIEVAL" : step === "otp" ? "CODE VALIDATION" : step === "verifying" ? "AUTHENTICATING" : "ACCESS GRANTED"}
                                </h2>
                                <p className="text-[11px] font-medium text-gray-400 mt-1 max-w-[270px] mx-auto">
                                    {step === "email"
                                        ? "Provide your registered email to request biometric verification OTP"
                                        : step === "otp"
                                            ? `Enter the 6-digit access code dispatched to ${email}`
                                            : step === "verifying"
                                                ? "Synchronizing security vaults..."
                                                : "Routing applicant to portal dashboard..."}
                                </p>
                            </div>

                            {/* Stage Animations & Forms */}
                            <div className="relative z-10 flex flex-col justify-center">
                                <AnimatePresence mode="wait">
                                    {step === "email" && (
                                        <motion.div
                                            key="email-stage"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                            className="w-full relative"
                                        >
                                            {/* Google Biometric Login */}
                                            <button
                                                type="button"
                                                onClick={handleGoogleLogin}
                                                disabled={loading}
                                                className="w-full py-3.5 px-4 bg-white/5 hover:bg-white/10 border border-[#d4af37]/30 rounded-xl flex items-center justify-center gap-3 text-xs font-black text-amber-100 hover:text-white tracking-widest uppercase transition-all mb-6 cursor-pointer shadow-md shadow-black/20"
                                            >
                                                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                                    <path
                                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                        fill="#BF953F"
                                                    />
                                                    <path
                                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                        fill="#FCF6BA"
                                                    />
                                                    <path
                                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                                        fill="#B38728"
                                                    />
                                                    <path
                                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                        fill="#AA771C"
                                                    />
                                                </svg>
                                                Biometric Google Sign-In
                                            </button>

                                            <div className="relative flex items-center gap-4 mb-6 select-none">
                                                <div className="flex-1 h-px bg-[#d4af37]/20"></div>
                                                <span className="text-[8px] font-black text-[#d4af37]/50 uppercase tracking-[0.25em]">Or Request Entry OTP</span>
                                                <div className="flex-1 h-px bg-[#d4af37]/20"></div>
                                            </div>

                                            {/* Interactive background SVG drawing */}
                                            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center opacity-30">
                                                <svg className="w-3/4 h-3/4 stroke-amber-400/25 fill-none" viewBox="0 0 200 200">
                                                    <defs>
                                                        <linearGradient id="goldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#BF953F" />
                                                            <stop offset="25%" stopColor="#FCF6BA" />
                                                            <stop offset="50%" stopColor="#B38728" />
                                                            <stop offset="75%" stopColor="#FBF5B7" />
                                                            <stop offset="100%" stopColor="#AA771C" />
                                                        </linearGradient>
                                                    </defs>
                                                    {/* Animated Graduation Cap & Financial Line Path */}
                                                    <motion.path
                                                        d="M 20 160 L 50 140 L 80 150 L 120 100 L 150 110 L 180 50 M 180 50 L 140 30 L 100 50 L 140 70 Z M 140 70 L 140 95 C 140 105, 100 105, 100 95 L 100 50 M 100 50 L 100 75 L 85 90"
                                                        initial={{ pathLength: 0.05, opacity: 0.2 }}
                                                        animate={{
                                                            pathLength: isEmailFocused ? 1 : 0.05,
                                                            opacity: isEmailFocused ? 1 : 0.2
                                                        }}
                                                        transition={{ duration: 1.8, ease: "easeInOut" }}
                                                        stroke="url(#goldStroke)"
                                                        strokeWidth="2.5"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </div>

                                            <form onSubmit={handleSubmitEmail} className="space-y-6 relative z-10">
                                                <div>
                                                    <label className="block text-[9px] font-black text-[#d4af37]/70 uppercase tracking-widest mb-2 ml-1">Applicant Email address</label>
                                                    <input
                                                        id="email"
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        onFocus={() => setIsEmailFocused(true)}
                                                        onBlur={() => setIsEmailFocused(false)}
                                                        disabled={loading}
                                                        placeholder="enter.your@email.com"
                                                        className="w-full px-4 py-3.5 bg-black/40 border border-[#d4af37]/35 rounded-xl text-white text-sm placeholder-gray-650 focus:outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/15 transition-all text-center tracking-wide font-medium"
                                                        required
                                                    />
                                                </div>

                                                {error && (
                                                    <div className="px-4 py-2.5 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs font-semibold flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-base text-red-400">error</span>
                                                        {error}
                                                    </div>
                                                )}

                                                <button
                                                    id="submitBtn"
                                                    type="submit"
                                                    disabled={loading}
                                                    className="w-full py-4 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#AA771C] text-[#050b14] font-black rounded-xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-[#d4af37]/10 text-xs tracking-[0.2em] uppercase cursor-pointer border-t border-white/20"
                                                >
                                                    {loading ? (
                                                        <>
                                                            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                                            Requesting Visa...
                                                        </>
                                                    ) : (
                                                        <>Request Access OTP <span className="material-symbols-outlined text-sm">arrow_forward</span></>
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
                                            className="w-full relative z-10"
                                        >
                                            <form onSubmit={handleSubmitOtp} className="space-y-6">
                                                <div>
                                                    <label className="block text-[9px] font-black text-[#d4af37]/70 uppercase tracking-widest mb-2 ml-1">Applicant Destination</label>
                                                    <div className="relative">
                                                        <input
                                                            id="email-readonly"
                                                            type="email"
                                                            value={email}
                                                            disabled
                                                            className="w-full px-4 py-3 bg-black/40 border border-[#d4af37]/20 rounded-xl text-gray-400 text-xs text-center font-medium focus:outline-none"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); setError(""); }}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[#d4af37] font-black hover:underline tracking-wider uppercase cursor-pointer"
                                                        >
                                                            Change
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[9px] font-black text-[#d4af37]/70 uppercase tracking-widest mb-4 ml-1 text-center">Biometric validation code</label>
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
                                                                        className="w-11 h-12 text-center text-lg font-black bg-black/30 border border-[#d4af37]/30 rounded-xl text-white focus:outline-none focus:border-[#d4af37] focus:ring-4 focus:ring-[#d4af37]/10 transition-all"
                                                                    />
                                                                    {/* Glowing indicator line at the bottom */}
                                                                    <motion.div
                                                                        initial={{ scaleX: 0 }}
                                                                        animate={{ scaleX: isActive ? 1 : 0 }}
                                                                        transition={{ duration: 0.2 }}
                                                                        className="absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full bg-gradient-to-r from-[#d4af37] to-[#FCF6BA] shadow-[0_1px_6px_rgba(212,175,55,0.4)] origin-center"
                                                                    />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <div className="text-center mt-5">
                                                        {resendDisabled ? (
                                                            <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase font-mono">Resend permit in {countdown}s</span>
                                                        ) : (
                                                            <button type="button" onClick={sendOtp} className="text-[10px] text-[#d4af37] hover:underline font-black uppercase tracking-widest cursor-pointer">
                                                                Resend OTP Code
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {error && (
                                                    <div className="px-4 py-2.5 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs font-semibold flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-base text-red-400">error</span>
                                                        {error}
                                                    </div>
                                                )}

                                                <button
                                                    id="submitBtnOtp"
                                                    type="submit"
                                                    disabled={loading || otp.join("").length !== 6}
                                                    className="w-full py-4 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#AA771C] text-[#050b14] font-black rounded-xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-[#d4af37]/10 text-xs tracking-[0.2em] uppercase cursor-pointer"
                                                >
                                                    Validate Credentials
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
                                            className="flex flex-col items-center justify-center gap-4 py-8 w-full z-10"
                                        >
                                            <div className="relative flex items-center justify-center w-24 h-24">
                                                {/* Animated Spinner Ring */}
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                                    className="absolute inset-0 rounded-full border-4 border-t-[#d4af37] border-r-transparent border-b-[#fcfbf7] border-l-transparent"
                                                />
                                                {/* Morphing Verification Lock */}
                                                <motion.div
                                                    animate={{
                                                        scale: [0.9, 1.1, 0.9],
                                                        borderRadius: ["42% 58% 70% 30% / 45% 45% 55% 55%", "70% 30% 52% 48% / 60% 40% 60% 40%", "42% 58% 70% 30% / 45% 45% 55% 55%"]
                                                    }}
                                                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                                    className="w-16 h-16 bg-gradient-to-tr from-[#d4af37] to-[#BF953F] opacity-90 shadow-lg shadow-[#d4af37]/20 flex items-center justify-center"
                                                >
                                                    <span className="material-symbols-outlined text-[#050b14] text-2xl animate-pulse font-bold">lock</span>
                                                </motion.div>
                                            </div>
                                            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider animate-pulse mt-4">
                                                Verifying Visa Code...
                                            </span>
                                        </motion.div>
                                    )}

                                    {step === "success" && (
                                        <motion.div
                                            key="success-stage"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                            className="flex flex-col items-center justify-center gap-4 py-8 w-full z-10"
                                        >
                                            <motion.div
                                                initial={{ scale: 0.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: 0.15, type: "spring" }}
                                                className="flex items-center justify-center w-20 h-20 rounded-full bg-[#d4af37]/10 border-2 border-[#d4af37] shadow-[0_0_25px_rgba(212,175,55,0.25)] mb-2 relative overflow-hidden"
                                            >
                                                <svg
                                                    width="36"
                                                    height="36"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="#d4af37"
                                                    strokeWidth="3.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            </motion.div>
                                            <h2 className="text-xl font-bold font-serif text-white tracking-wide uppercase mt-2">
                                                Visa Validated
                                            </h2>
                                            <span className="text-[#d4af37] text-xs font-bold uppercase tracking-widest animate-pulse">
                                                Proceeding to Boarding...
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                        </div>
                    </div>

                    {/* Footer Policy Links */}
                    {step !== "success" && step !== "verifying" && (
                        <p className="text-center text-gray-500 text-[10px] mt-8 font-bold leading-relaxed uppercase tracking-wider select-none">
                            By entering, you accept our <Link href="/terms-conditions" className="text-gray-400 hover:text-[#d4af37] underline transition-colors">Terms</Link> and <Link href="/privacy-policy" className="text-gray-400 hover:text-[#d4af37] underline transition-colors">Privacy Policy</Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#050b14]"><span className="material-symbols-outlined animate-spin text-4xl text-[#d4af37]">progress_activity</span></div>}>
            <LoginContent />
        </Suspense>
    );
}
