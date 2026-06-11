"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
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



const SECURITY_TIPS = [
    "Security Tip: Ensure the URL bar shows https://vidyaloans.com before submitting.",
    "Security Tip: VidyaLoans support agents will never ask for your email OTP code.",
    "Security Tip: Biometric logins use secure client-side hardware enclaves.",
    "Security Tip: Avoid logging in from public, unencrypted Wi-Fi hotspots.",
    "Security Tip: Always check that your browser connection is secure (look for the lock icon)."
];

const PaperPlane = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
    </svg>
);

// HTML5 Canvas Particle Web Component
function ParticleCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
        let height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
            height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
        };

        window.addEventListener("resize", handleResize);

        const particles: Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            radius: number;
        }> = [];

        const numParticles = 75;
        for (let i = 0; i < numParticles; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.35,
                radius: Math.random() * 2 + 1,
            });
        }

        const mouse = { x: -1000, y: -1000 };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };

        const handleMouseLeave = () => {
            mouse.x = -1000;
            mouse.y = -1000;
        };

        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseleave", handleMouseLeave);

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Draw and update particles
            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;

                // Edge collision handling
                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                // Interactive repel/attraction
                if (mouse.x > 0 && mouse.y > 0) {
                    const dx = p.x - mouse.x;
                    const dy = p.y - mouse.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist < 130) {
                        const force = (130 - dist) / 130;
                        p.x += (dx / dist) * force * 1.6;
                        p.y += (dy / dist) * force * 1.6;
                    }
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(139, 92, 246, 0.4)"; // Soft electric purple
                ctx.fill();
            });

            // Draw line connections between particles
            ctx.lineWidth = 0.5;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const pi = particles[i];
                    const pj = particles[j];
                    const dist = Math.hypot(pi.x - pj.x, pi.y - pj.y);
                    if (dist < 110) {
                        const alpha = ((110 - dist) / 110) * 0.15;
                        ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
                        ctx.beginPath();
                        ctx.moveTo(pi.x, pi.y);
                        ctx.lineTo(pj.x, pj.y);
                        ctx.stroke();
                    }
                }

                // Draw connection to user mouse
                if (mouse.x > 0 && mouse.y > 0) {
                    const pi = particles[i];
                    const dist = Math.hypot(pi.x - mouse.x, pi.y - mouse.y);
                    if (dist < 150) {
                        const alpha = ((150 - dist) / 150) * 0.22;
                        ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
                        ctx.beginPath();
                        ctx.moveTo(pi.x, pi.y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", handleResize);
            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("mouseleave", handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-auto"
            style={{ mixBlendMode: "screen" }}
        />
    );
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
    const [isEmailFocused, setIsEmailFocused] = useState(false);

    // Interactive custom state additions
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [isValidEmail, setIsValidEmail] = useState<boolean | null>(null);
    const [activeTip, setActiveTip] = useState("");
    const [showPasskeySim, setShowPasskeySim] = useState(false);
    const [passkeyStage, setPasskeyStage] = useState<"idle" | "scanning" | "info">("idle");

    // Animation States
    const [otpAnimationStage, setOtpAnimationStage] = useState<"idle" | "takeoff" | "flight" | "stamp" | "completed">("idle");
    const [flightProgress, setFlightProgress] = useState(0);
    const [isShaking, setIsShaking] = useState(false);
    const apiResultRef = useRef<{ success: boolean; error?: string } | null>(null);

    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);



    // Rotating security tip
    useEffect(() => {
        let count = 0;
        setActiveTip(SECURITY_TIPS[0]);
        const interval = setInterval(() => {
            count = (count + 1) % SECURITY_TIPS.length;
            setActiveTip(SECURITY_TIPS[count]);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    // Capture referral code from URL on mount
    useEffect(() => {
        const ref = searchParams.get("ref");
        if (ref) {
            setReferralCode(ref);
            localStorage.setItem("referralCode", ref);
        } else {
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



    // Email input validation handler
    const handleEmailChange = (val: string) => {
        setEmail(val);
        if (val === "") {
            setIsValidEmail(null);
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            setIsValidEmail(emailRegex.test(val));
        }
    };

    const triggerStampPhase = () => {
        setOtpAnimationStage("stamp");
        setIsShaking(true);

        setTimeout(() => {
            setIsShaking(false);
        }, 400);

        setTimeout(() => {
            setOtpAnimationStage("completed");
            setStep("otp");
            setResendDisabled(true);
            setCountdown(60);
            setLoading(false);
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
            setOtpAnimationStage("idle");
        }, 800);
    };

    const sendOtp = async () => {
        if (!email.trim() || !isValidEmail) {
            setError("Please enter a valid email address");
            return;
        }

        setOtpAnimationStage("takeoff");
        setFlightProgress(0);
        setIsShaking(false);
        setLoading(true);
        setError("");
        apiResultRef.current = null;

        // Start background API call
        authApi.sendOtp(email.trim())
            .then((res) => {
                apiResultRef.current = { success: true };
                return res;
            })
            .catch((err) => {
                const errMsg = err instanceof Error ? err.message : "Failed to send OTP";
                apiResultRef.current = { success: false, error: errMsg };
            });

        // Phase 1: Takeoff Animation (600ms)
        setTimeout(() => {
            if (apiResultRef.current && !apiResultRef.current.success) {
                setError(apiResultRef.current.error || "Failed to send OTP");
                setOtpAnimationStage("idle");
                setLoading(false);
                return;
            }

            setOtpAnimationStage("flight");

            // Phase 2: Progress bar increment
            let currentProgress = 0;
            const interval = setInterval(() => {
                if (apiResultRef.current && !apiResultRef.current.success) {
                    clearInterval(interval);
                    setError(apiResultRef.current.error || "Failed to send OTP");
                    setOtpAnimationStage("idle");
                    setLoading(false);
                    return;
                }

                if (currentProgress < 90) {
                    currentProgress += 6;
                    setFlightProgress(Math.min(currentProgress, 90));
                } else {
                    if (apiResultRef.current && apiResultRef.current.success) {
                        clearInterval(interval);

                        let finalProgress = 90;
                        const finalInterval = setInterval(() => {
                            finalProgress += 5;
                            setFlightProgress(finalProgress);
                            if (finalProgress >= 100) {
                                clearInterval(finalInterval);
                                triggerStampPhase();
                            }
                        }, 50);
                    }
                }
            }, 100);
        }, 600);
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

        localStorage.removeItem("referralCode");
        if (typeof window !== "undefined") {
            sessionStorage.removeItem("referralCode");
        }

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

    // Simulated Passkey Trigger
    const triggerPasskeyScan = () => {
        setShowPasskeySim(true);
        setPasskeyStage("scanning");

        // Simulate fingerprint scan
        setTimeout(() => {
            setPasskeyStage("info");
        }, 2200);
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
        <div 
            className="min-h-screen w-full flex items-center justify-center p-6 text-white relative overflow-hidden"
            style={{ background: "radial-gradient(circle at center, #0B0E14 0%, #080A0F 100%)" }}
        >

            {/* HTML5 Canvas Ambient Particle Web */}
            <div className="absolute inset-0 z-0 opacity-40">
                <ParticleCanvas />
            </div>

            {/* Classic grid line overlay structure */}
            <div className="absolute inset-0 z-0 opacity-15 pointer-events-none select-none">
                <svg className="w-full h-full stroke-[#8B5CF6]/15 fill-none" viewBox="0 0 800 800">
                    <path d="M 50 800 C 50 300, 200 100, 400 100 C 600 100, 750 300, 750 800" strokeWidth="1.5" />
                    <path d="M 150 800 C 150 400, 250 200, 400 200 C 550 200, 650 400, 650 800" strokeWidth="1" />
                    <line x1="400" y1="100" x2="400" y2="800" strokeWidth="1" />
                    <line x1="400" y1="100" x2="0" y2="800" strokeWidth="0.5" />
                    <line x1="400" y1="100" x2="800" y2="800" strokeWidth="0.5" />
                    <line x1="0" y1="500" x2="800" y2="500" strokeWidth="0.5" />
                    <line x1="0" y1="650" x2="800" y2="650" strokeWidth="0.5" />
                </svg>
            </div>

            {/* Visual Color Bleed: Ambient backdrop neon lights */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#8B5CF6]/10 rounded-full blur-[140px] pointer-events-none z-0" />
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[160px] pointer-events-none z-0" />

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

                {/* Frosted Glassmorphism Login Container */}
                <motion.div
                    animate={isShaking ? {
                        x: [0, -6, 6, -4, 4, -2, 2, 0],
                        y: [0, 4, -4, 3, -3, 2, -2, 0]
                    } : {}}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="login-card backdrop-blur-[8px] overflow-hidden relative !p-1"
                >
                    {/* Glowing progress line for OTP sending flow */}
                    {otpAnimationStage !== "idle" && (
                        <div className="absolute top-0 left-0 right-0 h-1.5 pointer-events-none z-50 overflow-hidden rounded-t-[24px]">
                            <div
                                className="absolute inset-0 opacity-20"
                                style={{
                                    backgroundImage: "radial-gradient(circle, #8B5CF6 1.5px, transparent 1.5px)",
                                    backgroundSize: "8px 100%",
                                    backgroundRepeat: "repeat-x"
                                }}
                            />
                            <div
                                className="absolute inset-y-0 left-0 h-full transition-all duration-100 ease-out"
                                style={{
                                    width: `${flightProgress}%`,
                                    backgroundImage: "radial-gradient(circle, #8B5CF6 2.5px, transparent 2.5px)",
                                    backgroundSize: "8px 100%",
                                    backgroundRepeat: "repeat-x",
                                    filter: "drop-shadow(0 0 4px #8B5CF6) drop-shadow(0 0 8px #8B5CF6)"
                                }}
                            />
                            {otpAnimationStage === "flight" && (
                                <div
                                    style={{ left: `${flightProgress}%` }}
                                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-[#8B5CF6] drop-shadow-[0_0_6px_#8B5CF6] flex items-center justify-center transition-all duration-100 ease-out"
                                >
                                    <PaperPlane className="w-3.5 h-3.5" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Inner Border layout */}
                    <div className="border border-white/5 rounded-[22px] p-6 lg:p-8 flex flex-col justify-center min-h-[420px] relative overflow-hidden">

                        {/* Visa Stamps Background Climax */}
                        <AnimatePresence>
                            {otpAnimationStage === "stamp" && (
                                <motion.div
                                    initial={{ scale: 2.5, opacity: 0, filter: "blur(12px)", rotate: 25 }}
                                    animate={{ scale: 1, opacity: 0.15, filter: "blur(0px)", rotate: 12 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.22, ease: "easeOut" }}
                                    className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center select-none"
                                >
                                    <div className="text-7xl font-black font-mono border-[10px] border-amber-500 text-amber-500 rounded-3xl p-6 uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                                        APPROVED
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Brand Header: Logo, Name, Subtitle */}
                        <div className="flex flex-col items-center mb-6 select-none text-center">
                            <Image
                                src="/images/vidyaloans-logo-transparent.png"
                                alt="VidyaLoans Logo"
                                width={64}
                                height={64}
                                className="object-contain filter drop-shadow-[0_2px_8px_rgba(139,92,246,0.3)] mb-3"
                                priority
                            />
                            <span className="text-2xl font-black tracking-[0.2em] uppercase text-white leading-none">VIDYALOANS</span>
                            <span className="text-[9px] font-mono tracking-widest text-[#F59E0B] uppercase mt-1.5">Education Financial Portal</span>

                            <div className="w-12 h-0.5 bg-gradient-to-r from-[#8B5CF6] to-[#F59E0B] rounded-full my-4" />

                            <h3 className="text-sm font-semibold text-white tracking-widest uppercase">
                                {step === "email" ? "Student Login" : step === "otp" ? "Code Validation" : step === "verifying" ? "Authenticating" : "Access Granted"}
                            </h3>
                            <p className="text-[11px] font-medium text-gray-400 mt-1 max-w-[270px] mx-auto">
                                {step === "email"
                                    ? "Gain borderless financing access using secure biometric or email verification."
                                    : step === "otp"
                                        ? `Enter the 6-digit access code dispatched to ${email}`
                                        : step === "verifying"
                                            ? "Synchronizing security vaults..."
                                            : "Routing applicant to portal dashboard..."}
                            </p>
                        </div>

                        {/* Forms & Auth flow container */}
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
                                        {/* MODERN PASSWORDLESS & BIOMETRIC BUTTONS - FRONT & CENTER */}
                                        <div className="space-y-3 mb-5">
                                            <button
                                                type="button"
                                                onClick={handleGoogleLogin}
                                                disabled={loading}
                                                className="w-full py-3 px-4 bg-[#181d2a] hover:bg-[#1f2637] border border-white/10 hover:border-[#8B5CF6]/50 hover:shadow-[0_0_15px_rgba(139,92,246,0.35)] rounded-xl flex items-center justify-center gap-3 text-xs font-semibold text-gray-200 hover:text-white tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-md shadow-black/20"
                                            >
                                                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                                                Google Biometric Login
                                            </button>
                                        </div>

                                        {/* Divider */}
                                        <div className="divider">OR SIGN IN WITH EMAIL</div>

                                        {/* ACCORDION TRIGGER */}
                                        {!showEmailForm && (
                                            <button
                                                type="button"
                                                onClick={() => setShowEmailForm(true)}
                                                className="w-full py-2.5 bg-white/5 hover:bg-[#181d2a] border border-white/5 hover:border-[#8B5CF6]/30 hover:text-white rounded-xl text-center text-xs font-bold text-gray-300 transition-all cursor-pointer select-none"
                                            >
                                                Continue with Email OTP
                                            </button>
                                        )}

                                        {/* ACCORDION CONTENT */}
                                        <motion.div
                                            initial={false}
                                            animate={{ height: showEmailForm ? "auto" : 0, opacity: showEmailForm ? 1 : 0 }}
                                            transition={{ duration: 0.35, ease: "easeInOut" }}
                                            className="overflow-hidden"
                                        >
                                            <form onSubmit={handleSubmitEmail} className="space-y-5 pt-2">

                                                {/* SMART FLOATING LABEL INPUT WITH INLINE VALIDATION & TOOLTIP */}
                                                <div className="relative">

                                                    {/* Input Area */}
                                                    <div className="relative mt-2">
                                                        <input
                                                            id="email"
                                                            type="email"
                                                            value={email}
                                                            onChange={(e) => handleEmailChange(e.target.value)}
                                                            onFocus={() => setIsEmailFocused(true)}
                                                            onBlur={() => setIsEmailFocused(false)}
                                                            disabled={loading}
                                                            placeholder=" " // required for     floating label hack
                                                            className="peer w-full px-8 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/15 transition-all text-center tracking-wide font-medium"
                                                            required
                                                        />

                                                        {/* Floating Label */}
                                                        <label
                                                            htmlFor="email"
                                                            className="absolute left-1/2 -translate-x-1/2 top-3.5 peer-placeholder-shown:top-3.5 peer-focus:top-1 peer-focus:-translate-y-4 -translate-y-4 text-xs peer-placeholder-shown:text-sm text-gray-400 peer-focus:text-[#8B5CF6] bg-[#131722] px-2 rounded font-black uppercase tracking-widest transition-all duration-200 pointer-events-none scale-95 peer-focus:scale-75 origin-center"
                                                        >
                                                            Applicant Email Address
                                                        </label>

                                                        {/* Realtime Inline Validation Indicator */}
                                                        {email !== "" && (
                                                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none select-none">
                                                                {isValidEmail ? (
                                                                    <span className="material-symbols-outlined text-emerald-400 text-lg drop-shadow-[0_0_4px_rgba(52,211,153,0.3)]">check_circle</span>
                                                                ) : (
                                                                    <span className="material-symbols-outlined text-amber-500 text-lg animate-pulse">warning</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Interactive Security Tip Box */}
                                                    <AnimatePresence>
                                                        {isEmailFocused && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="absolute -top-12 left-0 right-0 z-20 bg-amber-500/95 text-slate-950 text-[10px] font-black rounded-lg py-1.5 px-3 shadow-lg flex items-center gap-1.5 border border-amber-400 pointer-events-none select-none text-left leading-normal"
                                                            >
                                                                <span className="material-symbols-outlined text-sm shrink-0">shield</span>
                                                                <span>{activeTip}</span>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
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
                                                    disabled={loading || !isValidEmail}
                                                    className="w-full py-3.5 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white font-bold rounded-xl transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] disabled:opacity-50 flex items-center justify-center gap-2 text-xs tracking-wider uppercase cursor-pointer border-t border-white/10 relative overflow-hidden"
                                                >
                                                    {loading && otpAnimationStage === "idle" ? (
                                                        <span className="flex items-center justify-center gap-2">
                                                            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                                            Requesting Permit...
                                                        </span>
                                                    ) : (
                                                        <>
                                                            {otpAnimationStage === "idle" && (
                                                                <span className="flex items-center justify-center gap-2">
                                                                    Request Entry OTP
                                                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                                                </span>
                                                            )}

                                                            {otpAnimationStage === "takeoff" && (
                                                                <div className="relative w-full h-full flex items-center justify-center">
                                                                    <motion.span
                                                                        initial={{ opacity: 1, x: 0 }}
                                                                        animate={{ opacity: 0, x: -20 }}
                                                                        transition={{ duration: 0.3 }}
                                                                        className="absolute"
                                                                    >
                                                                        Request Entry OTP
                                                                    </motion.span>
                                                                    <motion.div
                                                                        initial={{ x: "-20%", opacity: 0, scale: 0.8 }}
                                                                        animate={{
                                                                            x: ["-20%", "0%", "250%"],
                                                                            opacity: [0, 1, 1, 0],
                                                                            scale: [0.8, 1.2, 1.4, 0.8]
                                                                        }}
                                                                        transition={{
                                                                            duration: 0.6,
                                                                            times: [0, 0.3, 1],
                                                                            ease: "easeIn"
                                                                        }}
                                                                        className="absolute text-white flex items-center justify-center"
                                                                    >
                                                                        <PaperPlane className="w-5 h-5" />
                                                                    </motion.div>
                                                                </div>
                                                            )}

                                                            {["flight", "stamp", "completed"].includes(otpAnimationStage) && (
                                                                <motion.div
                                                                    initial={{ opacity: 0 }}
                                                                    animate={{ opacity: 1 }}
                                                                    className="flex items-center justify-center gap-2"
                                                                >
                                                                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                                                    Dispatching OTP...
                                                                </motion.div>
                                                            )}
                                                        </>
                                                    )}
                                                </button>
                                            </form>
                                        </motion.div>
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
                                                <label className="block text-[9px] font-black text-[#F59E0B]/75 uppercase tracking-widest mb-2 ml-1 select-none">Applicant Destination</label>
                                                <div className="relative">
                                                    <input
                                                        id="email-readonly"
                                                        type="email"
                                                        value={email}
                                                        disabled
                                                        className="w-full px-4 py-3 bg-black/40 border border-[#8B5CF6]/20 rounded-xl text-gray-400 text-xs text-center font-medium focus:outline-none select-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); setError(""); }}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[#8B5CF6] font-black hover:underline tracking-wider uppercase cursor-pointer"
                                                    >
                                                        Change
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[9px] font-black text-[#F59E0B]/75 uppercase tracking-widest mb-4 ml-1 text-center select-none">Biometric Validation Code</label>

                                                {/* OTP fields wrapper */}
                                                <div className="relative">
                                                    <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
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
                                                                        className="w-11 h-12 text-center text-lg font-black bg-black/30 border border-white/10 focus:border-[#8B5CF6] focus:ring-4 focus:ring-[#8B5CF6]/10 rounded-xl text-white transition-all font-mono"
                                                                    />

                                                                    {/* Bottom sliding glowing bar */}
                                                                    <motion.div
                                                                        initial={{ scaleX: 0 }}
                                                                        animate={{ scaleX: isActive ? 1 : 0 }}
                                                                        transition={{ duration: 0.2 }}
                                                                        className="absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] shadow-[0_1px_6px_rgba(139,92,246,0.4)] origin-center"
                                                                    />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* OTP Security tip popup */}
                                                    <AnimatePresence>
                                                        {focusedIndex !== null && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="absolute -top-12 left-0 right-0 z-20 bg-amber-500/95 text-slate-950 text-[10px] font-black rounded-lg py-1.5 px-3 shadow-lg flex items-center gap-1.5 border border-amber-400 pointer-events-none select-none text-left leading-normal"
                                                            >
                                                                <span className="material-symbols-outlined text-sm shrink-0">info</span>
                                                                <span>Security Tip: VidyaLoans support will never call or message to ask for this code.</span>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                                <div className="text-center mt-5 select-none">
                                                    {resendDisabled ? (
                                                        <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase font-mono">Resend permit in {countdown}s</span>
                                                    ) : (
                                                        <button type="button" onClick={sendOtp} className="text-[10px] text-[#8B5CF6] hover:underline font-black uppercase tracking-widest cursor-pointer">
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
                                                className="w-full py-4 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white font-bold rounded-xl transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] disabled:opacity-60 flex items-center justify-center gap-2 text-xs tracking-wider uppercase cursor-pointer border-t border-white/10"
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
                                        className="flex flex-col items-center justify-center gap-4 py-8 w-full z-10 select-none"
                                    >
                                        <div className="relative flex items-center justify-center w-24 h-24">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                                className="absolute inset-0 rounded-full border-4 border-t-[#8B5CF6] border-r-transparent border-b-[#fcfbf7] border-l-transparent"
                                            />
                                            <motion.div
                                                animate={{
                                                    scale: [0.9, 1.1, 0.9],
                                                    borderRadius: ["42% 58% 70% 30% / 45% 45% 55% 55%", "70% 30% 52% 48% / 60% 40% 60% 40%", "42% 58% 70% 30% / 45% 45% 55% 55%"]
                                                }}
                                                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                                className="w-16 h-16 bg-gradient-to-tr from-[#8B5CF6] to-[#7C3AED] opacity-90 shadow-lg shadow-[#8B5CF6]/20 flex items-center justify-center"
                                            >
                                                <span className="material-symbols-outlined text-white text-2xl animate-pulse font-bold">lock</span>
                                            </motion.div>
                                        </div>
                                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider animate-pulse mt-4">
                                            Verifying Permit Code...
                                        </span>
                                    </motion.div>
                                )}

                                {step === "success" && (
                                    <motion.div
                                        key="success-stage"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                        className="flex flex-col items-center justify-center gap-4 py-8 w-full z-10 select-none"
                                    >
                                        <motion.div
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: 0.15, type: "spring" }}
                                            className="flex items-center justify-center w-20 h-20 rounded-full bg-[#8B5CF6]/10 border-2 border-[#8B5CF6] shadow-[0_0_25px_rgba(139,92,246,0.25)] mb-2 relative overflow-hidden"
                                        >
                                            <svg
                                                width="36"
                                                height="36"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="#8B5CF6"
                                                strokeWidth="3.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </motion.div>
                                        <h2 className="text-xl font-bold text-white tracking-wide uppercase mt-2">
                                            Permit Validated
                                        </h2>
                                        <span className="text-[#8B5CF6] text-xs font-bold uppercase tracking-widest animate-pulse">
                                            Proceeding to Boarding...
                                        </span>
                                    </motion.div>
                                )}
                             </AnimatePresence>
                         </div>

                     </div>
                 </motion.div>

                 {/* Footer Policy Links */}
                 {step !== "success" && step !== "verifying" && (
                     <p className="text-center text-[#9CA3AF] text-[10px] mt-8 font-bold leading-relaxed uppercase tracking-wider select-none">
                         By entering, you accept our <Link href="/terms-conditions" className="text-gray-200 hover:underline hover:text-white transition-all font-semibold">TERMS</Link> and <Link href="/privacy-policy" className="text-gray-200 hover:underline hover:text-white transition-all font-semibold">PRIVACY POLICY</Link>
                     </p>
                 )}
             </div>

             {/* SIMULATED PASSKEY SCANNED OVERLAY MODAL */}
             <AnimatePresence>
                 {showPasskeySim && (
                     <motion.div
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
                     >
                         <motion.div
                             initial={{ scale: 0.9, y: 15 }}
                             animate={{ scale: 1, y: 0 }}
                             exit={{ scale: 0.9, y: 15 }}
                             className="bg-[#131722] border border-[#8B5CF6]/35 rounded-[2rem] p-8 max-w-sm w-full text-center relative overflow-hidden shadow-2xl"
                         >
                             {/* Scanning concentric rings */}
                             {passkeyStage === "scanning" && (
                                 <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
                                     <div className="w-56 h-56 border border-[#8B5CF6] rounded-full animate-ping" />
                                     <div className="w-40 h-40 border border-[#8B5CF6] rounded-full animate-ping [animation-delay:0.5s]" />
                                 </div>
                             )}

                             <div className="flex flex-col items-center">
                                 {/* Glowing Biometric Icon Container */}
                                 <div className="w-20 h-20 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6] border border-[#8B5CF6]/35 shadow-[0_0_20px_rgba(139,92,246,0.15)] mb-6 relative overflow-hidden">

                                     <span className={`material-symbols-outlined text-4xl ${passkeyStage === "scanning" ? "animate-pulse" : ""}`}>
                                         fingerprint
                                     </span>

                                     {/* Scanning bar effect */}
                                     {passkeyStage === "scanning" && (
                                         <motion.div
                                             animate={{ y: ["-100%", "100%", "-100%"] }}
                                             transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                                             className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent shadow-[0_0_8px_#8B5CF6]"
                                         />
                                     )}
                                 </div>

                                 <h3 className="text-lg font-bold text-white tracking-wide uppercase font-sans">
                                     {passkeyStage === "scanning" ? "Scanning Hardware Keys" : "No Passkey Discovered"}
                                 </h3>

                                 <p className="text-xs text-gray-400 mt-2 leading-relaxed max-w-xs">
                                     {passkeyStage === "scanning"
                                         ? "Simulating local biometric handshake with secure hardware enclave..."
                                         : "No registered hardware passkey detected for VidyaLoans on this device."}
                                 </p>

                                 {passkeyStage === "info" && (
                                     <div className="mt-5 p-3.5 bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-xl text-left">
                                         <p className="text-[10px] font-bold text-amber-200 uppercase tracking-wider mb-1 flex items-center gap-1">
                                             <span className="material-symbols-outlined text-xs">info</span>
                                             Device Registration Required
                                         </p>
                                         <p className="text-[10px] text-gray-400 leading-normal">
                                             To bind a hardware passkey, please log in with your email once first, then register your device under **Profile Settings &gt; Security** on the applicant dashboard.
                                         </p>
                                     </div>
                                 )}

                                 <div className="mt-6 flex flex-col gap-2 w-full">
                                     {passkeyStage === "info" ? (
                                         <>
                                             <button
                                                 type="button"
                                                 onClick={() => {
                                                     setShowPasskeySim(false);
                                                     setShowEmailForm(true);
                                                     setTimeout(() => {
                                                         const el = document.getElementById("email");
                                                         if (el) el.focus();
                                                     }, 300);
                                                 }}
                                                 className="w-full py-2.5 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:brightness-110 transition-all cursor-pointer"
                                             >
                                                 Use Email OTP Flow
                                             </button>
                                             <button
                                                 type="button"
                                                 onClick={() => setShowPasskeySim(false)}
                                                 className="w-full py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                                             >
                                                 Close Biometrics
                                             </button>
                                         </>
                                     ) : (
                                         <button
                                             type="button"
                                             onClick={() => setShowPasskeySim(false)}
                                             className="w-full py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                                         >
                                             Cancel Scanning
                                         </button>
                                     )}
                                 </div>
                             </div>
                         </motion.div>
                     </motion.div>
                 )}
             </AnimatePresence>
         </div>
     );
 }

 export default function LoginPage() {
     return (
         <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0B0E14]"><span className="material-symbols-outlined animate-spin text-4xl text-[#8B5CF6]">progress_activity</span></div>}>
             <LoginContent />
         </Suspense>
     );
 }
