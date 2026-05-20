"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";

const SUPPORTED_BANKS = [
    { id: "auxilo", name: "Auxilo Finserve", logo: "/banks/auxilo.png" },
    { id: "avanse", name: "Avanse Financial", logo: "/banks/avanse.png" },
    { id: "credila", name: "HDFC Credila", logo: "/banks/credila.png" },
    { id: "idfc", name: "IDFC FIRST Bank", logo: "/banks/idfc.png" },
    { id: "poonawalla", name: "Poonawalla Fincorp", logo: "/banks/poonawalla.jpg" },
];

function BankLoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    const [selectedBank, setSelectedBank] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [step, setStep] = useState<"bank_select" | "email" | "otp">("bank_select");
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

    const handleBankSelect = (bankId: string) => {
        setSelectedBank(bankId);
        // We can store it in sessionStorage so the dashboard knows which bank they selected
        sessionStorage.setItem("selectedBank", bankId);
        setStep("email");
    };

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
            const data = await authApi.verifyOtp(email.trim(), code) as any;
            if (data.refresh_token) localStorage.setItem("refreshToken", data.refresh_token);
            login(data.access_token, {
                id: data.userId,
                email: email.trim(),
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role as any
            });

            // Redirect bankers to their dashboard
            if (data.role === "bank" || data.role === "partner_bank" || data.role === "admin") {
                router.push("/bank/dashboard");
            } else {
                setError("Unauthorized role. You must be bank staff to access this portal.");
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError("");
        try {
            if (!auth) throw new Error("Google Login is not configured.");
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();
            
            const data = await authApi.firebaseLogin(idToken) as any;
            if (data.refresh_token) localStorage.setItem("refreshToken", data.refresh_token);
            
            login(data.access_token, {
                id: data.userId,
                email: result.user.email || "",
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role as any
            });

            if (data.role === "bank" || data.role === "partner_bank" || data.role === "admin") {
                router.push("/bank/dashboard");
            } else {
                setError("Unauthorized role. You must be bank staff to access this portal.");
            }
        } catch (e: any) {
            setError(e.message || "Failed to login with Google");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (step === "email") sendOtp();
        else if (step === "otp") verifyOtp();
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative bg-gray-50/50">
            <div className="relative z-10 w-full max-w-md">
                
                {/* Logo Area */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
                        <img 
                            src="/vidhyaloan_logo.png" 
                            alt="Vidhyaloan Logo" 
                            className="w-10 h-10 object-contain group-hover:scale-105 transition-transform" 
                        />
                        <span className="font-bold text-2xl font-display text-gray-900 tracking-tight">Vidhyaloan Staff</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 font-display mb-1.5 tracking-tight">
                        {step === "bank_select" ? "Select Your Bank Node" : step === "email" ? "Banker Access" : "Verify Authorization"}
                    </h1>
                    <p className="text-gray-500 text-[13px] font-normal">
                        {step === "bank_select" 
                            ? "Please choose your financial institution to proceed"
                            : step === "email"
                            ? `Authenticating for ${SUPPORTED_BANKS.find(b => b.id === selectedBank)?.name}`
                            : `Secure OTP sent to ${email}`}
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-xl shadow-black/[0.03] border border-gray-100">
                    {step === "bank_select" && (
                        <div className="space-y-3">
                            {SUPPORTED_BANKS.map((bank) => (
                                <button
                                    key={bank.id}
                                    onClick={() => handleBankSelect(bank.id)}
                                    className="w-full p-4 rounded-xl border border-gray-100 hover:border-[#6605c7] hover:bg-[#6605c7]/5 flex items-center gap-4 transition-all group text-left"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm overflow-hidden border border-gray-100 p-1">
                                        <img src={bank.logo} alt={bank.name} className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{bank.name}</p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Partner Institution</p>
                                    </div>
                                    <span className="material-symbols-outlined ml-auto text-gray-300 group-hover:text-[#6605c7]">chevron_right</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {step === "email" && (
                        <>
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full py-3 px-4 bg-white border border-gray-200 rounded-xl flex items-center justify-center gap-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all mb-6"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                Continue with Google
                            </button>

                            <div className="relative flex items-center gap-4 mb-6">
                                <div className="flex-1 h-px bg-gray-100"></div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Or corporate email</span>
                                <div className="flex-1 h-px bg-gray-100"></div>
                            </div>
                        </>
                    )}

                    {step !== "bank_select" && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {step === "email" && (
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Corporate Email Address</label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={loading}
                                            placeholder="staff@bank.com"
                                            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#6605c7] focus:ring-4 focus:ring-[#6605c7]/5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

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

                            {error && (
                                <div className="px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base">error</span>
                                    {error}
                                </div>
                            )}

                            <button
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
                                    <>Authorize Access <span className="material-symbols-outlined text-base">security</span></>
                                )}
                            </button>
                            
                            {step !== "otp" && (
                                <button type="button" onClick={() => setStep("bank_select")} className="w-full text-center text-[11px] text-gray-400 hover:text-[#6605c7] font-bold uppercase tracking-widest mt-4">
                                    ← Change Bank
                                </button>
                            )}
                        </form>
                    )}
                </div>

                <p className="text-center text-gray-400 text-[11px] mt-8 font-normal leading-relaxed">
                    By accessing this portal, you agree to strict confidentiality agreements. Unauthorized access is prohibited.
                </p>
            </div>
        </div>
    );
}

export default function BankLoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-4xl text-[#6605c7]">progress_activity</span></div>}>
            <BankLoginContent />
        </Suspense>
    );
}
