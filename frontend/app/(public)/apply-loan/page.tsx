"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { applicationApi, authApi } from "@/lib/api";
import { useRouter } from "next/navigation";

const banks = [
    { id: "idfc", name: "IDFC First Bank", rate: "10.5 - 12.5%" },
    { id: "hdfc", name: "HDFC Credila", rate: "10.75 - 12.5%" },
    { id: "auxilo", name: "Auxilo Finserve", rate: "11.25 - 13.5%" },
    { id: "avanse", name: "Avanse Financial", rate: "10.99 - 13.0%" },
    { id: "poonawalla", name: "Poonawalla Fincorp", rate: "11.5 - 14.5%" },
];

const loanTypes = ["Undergraduate Abroad", "Postgraduate Abroad", "Doctoral/PhD Abroad", "Professional Course"];
const courses = ["B.Tech/B.E.", "MBA/PGDM", "MS/M.Tech", "MBBS/Medicine", "Law", "Architecture", "Arts & Humanities", "Other"];
const countries = ["USA", "UK", "Canada", "Australia", "Germany", "Ireland", "New Zealand", "Other"];

export default function ApplyLoanPage() {
    const { isAuthenticated, user, refreshUser } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        bank: "",
        loanType: "",
        amount: "",
        courseType: "",
        country: "",
        university: "",
        annualFee: "",
        livingCost: "",
        coApplicant: "",
        income: "",
        collateral: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        address: "",
        notes: "",
        admissionStatus: "waiting", // confirmed, conditional, waiting
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");
    const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
    const [profileLoaded, setProfileLoaded] = useState(false);

    // Pre-fill personal info from user profile and URL params
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const uni = params.get("university");
            const country = params.get("country");

            if (uni || country || (user && !profileLoaded)) {
                setFormData((prev) => ({
                    ...prev,
                    university: prev.university || uni || "",
                    country: prev.country || country || "",
                    firstName: prev.firstName || user?.firstName || "",
                    lastName: prev.lastName || user?.lastName || "",
                    email: prev.email || user?.email || "",
                    phone: prev.phone || user?.phoneNumber || "",
                    dateOfBirth: prev.dateOfBirth || user?.dateOfBirth || "",
                }));
                if (user) setProfileLoaded(true);
            }
        }
    }, [user, profileLoaded]);

    const update = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error for that field when user types
        if (stepErrors[field]) {
            setStepErrors((prev) => {
                const copy = { ...prev };
                delete copy[field];
                return copy;
            });
        }
    };

    const validateStep1 = (): boolean => {
        const errors: Record<string, string> = {};
        if (!formData.bank) errors.bank = "Please select a bank";
        if (!formData.loanType) errors.loanType = "Please select a loan type";
        if (!formData.courseType) errors.courseType = "Please select a course type";
        if (!formData.country) errors.country = "Please select a country";
        if (!formData.university.trim()) errors.university = "Please enter your university";
        if (!formData.amount || Number(formData.amount) <= 0) errors.amount = "Please enter a valid loan amount";
        if (!formData.annualFee || Number(formData.annualFee) <= 0) errors.annualFee = "Please enter annual tuition fee";
        setStepErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateStep2 = (): boolean => {
        const errors: Record<string, string> = {};
        if (!formData.firstName.trim()) errors.firstName = "First name is required";
        if (!formData.lastName.trim()) errors.lastName = "Last name is required";
        if (!formData.email.trim()) errors.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Please enter a valid email";
        if (!formData.phone.trim()) errors.phone = "Phone number is required";
        else if (!/^[\d+\-\s()]{7,15}$/.test(formData.phone.trim())) errors.phone = "Please enter a valid phone number";
        if (!formData.coApplicant) errors.coApplicant = "Please select co-applicant type";
        if (formData.coApplicant && formData.coApplicant !== "none" && (!formData.income || Number(formData.income) <= 0)) {
            errors.income = "Please enter co-applicant annual income";
        }
        if (!formData.collateral) errors.collateral = "Please select collateral availability";
        setStepErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const next = () => {
        if (step === 1 && !validateStep1()) return;
        if (step === 2 && !validateStep2()) return;
        setStep((s) => s + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const back = () => {
        setStep((s) => s - 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSubmit = async () => {
        if (!isAuthenticated || !user?.id) {
            router.push(`/login?redirect=/apply-loan`);
            return;
        }
        setSubmitting(true);
        setError("");
        try {
            const userId = user.id;
            const bankName = banks.find(b => b.id === formData.bank)?.name || formData.bank;
            await applicationApi.create({
                ...formData,
                userId,
                bank: bankName,
                amount: parseFloat(formData.amount),
                annualFee: parseFloat(formData.annualFee) || undefined,
                livingCost: parseFloat(formData.livingCost) || undefined,
                income: parseFloat(formData.income) || undefined,
            });

            // Sync personal details to main user profile if authenticated
            if (user?.email) {
                try {
                    // Convert YYYY-MM-DD from date input to DD-MM-YYYY for backend profile update
                    let profileDob = formData.dateOfBirth;
                    if (profileDob && profileDob.includes('-') && profileDob.split('-')[0].length === 4) {
                        const [y, m, d] = profileDob.split('-');
                        profileDob = `${d}-${m}-${y}`;
                    }

                    await authApi.updateDetails(user.email, {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        phoneNumber: formData.phone,
                        dateOfBirth: profileDob,
                    });
                    await refreshUser();
                } catch (err) {
                    console.error("Failed to sync profile details:", err);
                }
            }
            // Notify other parts of the frontend that dashboard data changed
            try {
                const key = `dashboardDataUpdated_${userId}`;
                localStorage.setItem(key, String(Date.now()));
                // Dispatch an in-page event so same-tab listeners react immediately
                window.dispatchEvent(new Event('dashboard-data-changed'));
            } catch (err) {
                // ignore
            }

            setSubmitted(true);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to submit");
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#fcfaff] flex items-center justify-center p-6 relative overflow-hidden">
                {/* Bright Success Decorations matching Homepage aesthetic */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-white/20 z-0" />
                <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-[#6605c7]/10 blur-[150px] rounded-full z-0" />
                <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-[#a855f7]/5 blur-[150px] rounded-full z-0" />
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #6605c7 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                
                <div className="relative z-10 max-w-xl w-full text-center animate-fade-in-up">
                    <div className="mb-10 relative inline-block">
                        <div className="w-28 h-28 bg-emerald-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/40 relative z-10 animate-bounce-slow border border-emerald-400">
                            <span className="material-symbols-outlined text-white text-6xl">verified</span>
                        </div>
                        <div className="absolute inset-0 bg-emerald-400 rounded-[2rem] blur-2xl opacity-30 animate-pulse" />
                    </div>
                    
                    <h2 className="text-4xl font-black text-gray-900 mb-6 tracking-tight" style={{ fontFamily: "'Noto Serif', 'Playfair Display', serif" }}>Application Transmitted!</h2>
                    <p className="text-gray-600 font-medium text-lg mb-4 leading-relaxed">
                        Your financing request for <span className="text-[#6605c7] font-black">{formData.university}</span> has been successfully logged.
                    </p>
                    <p className="text-gray-500 text-sm font-medium mb-12">
                        Our credit specialists are currently reviewing your eligibility. Expect a status update within <span className="text-gray-900 font-bold">24-48 hours</span>.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 group">
                        <Link href="/dashboard" className="px-8 py-5 bg-[#6605c7] text-white text-[11px] uppercase tracking-[0.2em] font-black rounded-2xl hover:bg-[#7a0de8] hover:shadow-2xl hover:shadow-[#6605c7]/30 transition-all flex items-center justify-center gap-3">
                            <span className="material-symbols-outlined text-lg">dashboard_customize</span>
                            Control Center
                        </Link>
                        <Link href="/" className="px-8 py-5 bg-white text-gray-900 text-[11px] uppercase tracking-[0.2em] font-black rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3">
                            <span className="material-symbols-outlined text-lg">home</span>
                            Return Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-gray-900 overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #ede0ff 0%, #f3eaff 25%, #fdf6ff 55%, #fef3e8 80%, #fde8c8 100%)' }}>
            {/* Bright Aesthetic Background Decorations mimicking the Homepage */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-50 z-0" style={{ background: 'radial-gradient(circle, #d8b4fe, transparent)' }} />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-40 z-0" style={{ background: 'radial-gradient(circle, #fed7aa, transparent)' }} />
                <div className="absolute top-1/3 right-1/3 w-64 h-64 rounded-full blur-[80px] opacity-20 z-0" style={{ background: 'radial-gradient(circle, #c4b5fd, transparent)' }} />
                <div className="absolute inset-0 opacity-[0.04] z-0" style={{ backgroundImage: 'radial-gradient(circle, #6605c7 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            </div>

            <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full border border-purple-200/40 pointer-events-none z-0" />
            <div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full border border-purple-100/30 pointer-events-none z-0" />

            <div className="relative z-10 pt-32 pb-24 px-6 md:px-12">
                <div className="max-w-4xl mx-auto">
                    {/* Header Section */}
                    <div className="text-center mb-12 animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#6605c7]/20 text-gray-900 shadow-sm text-[10px] font-black uppercase tracking-widest mb-4">
                            <span className="material-symbols-outlined text-[14px] text-[#6605c7]">bolt</span>
                            Fast-Track Financing
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight" style={{ fontFamily: "'Noto Serif', 'Playfair Display', serif" }}>
                            {formData.university ? (
                                <span>Apply for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6605c7] to-[#a855f7]">{formData.university}</span></span>
                            ) : "Apply for Education Loan"}
                        </h1>
                        <p className="text-gray-600 font-medium text-base max-w-xl mx-auto leading-relaxed">
                            Fuel your global education dreams with competitive rates, zero collateral options, and 100% digital processing.
                        </p>
                    </div>

                    {formData.university && (
                        <div className="mb-12 bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white shadow-[0_8px_32px_rgba(102,5,199,0.05)] flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group hover:shadow-[0_12px_40px_rgba(102,5,199,0.1)] transition-all duration-500">
                            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#6605c7]/10 blur-3xl rounded-full opacity-50 group-hover:bg-[#a855f7]/20 transition-colors duration-700" />
                            <div className="w-24 h-24 bg-gradient-to-br from-[#f3eaff] to-[#e0c389]/20 rounded-3xl flex items-center justify-center text-[#6605c7] shrink-0 border border-[#6605c7]/20 transform group-hover:rotate-6 transition-transform shadow-sm">
                                <span className="material-symbols-outlined text-4xl">domain</span>
                            </div>
                            <div className="flex-1 text-center md:text-left relative z-10">
                                <div className="text-[11px] font-black text-[#6605c7] uppercase tracking-[0.2em] mb-2">Selected Academic Target</div>
                                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight mb-3 tracking-tight" style={{ fontFamily: "'Noto Serif', 'Playfair Display', serif" }}>{formData.university}</h2>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-bold text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100 text-[#6605c7]">
                                            <span className="material-symbols-outlined text-[16px]">public</span>
                                        </div>
                                        {formData.country}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center shadow-sm border border-emerald-100 text-emerald-600">
                                            <span className="material-symbols-outlined text-[16px]">verified</span>
                                        </div>
                                        Matched Partner Found
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/80 backdrop-blur-xl py-4 px-8 rounded-3xl border border-gray-100 text-center shadow-sm flex flex-col items-center">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Max Cover</div>
                                <div className="text-2xl font-black text-[#6605c7]">100%</div>
                                <div className="text-[9px] font-bold text-gray-400 mt-1 uppercase">of Total Cost</div>
                            </div>
                        </div>
                    )}

                    {/* Enhanced Progress Tracker */}
                    <div className="relative mb-16 max-w-2xl mx-auto">
                        <div className="absolute top-5 left-0 w-full h-[2px] bg-purple-100 transition-all">
                            <div
                                className="h-full bg-gradient-to-r from-[#6605c7] to-[#8b5cf6] transition-all duration-700 ease-out shadow-[0_0_10px_#6605c7]"
                                style={{ width: `${(step / 3) * 100}%` }}
                            />
                        </div>
                        <div className="relative flex justify-between">
                            {["Program Info", "Personal ID", "Final Review"].map((s, i) => {
                                const isCompleted = step > i + 1;
                                const isActive = step === i + 1;
                                return (
                                    <div key={s} className="flex flex-col items-center gap-4">
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-[13px] font-black transition-all duration-500 shadow-sm ${isCompleted ? "bg-emerald-50 text-emerald-600 rotate-[360deg] border border-emerald-200" : isActive ? "bg-[#6605c7] text-white shadow-purple-500/40 scale-110 border border-[#8b5cf6]" : "bg-white text-gray-400 border border-gray-200"
                                            }`}>
                                            {isCompleted ? <span className="material-symbols-outlined text-lg">check</span> : i + 1}
                                        </div>
                                        <div className={`text-[10px] uppercase tracking-[0.15em] font-black transition-colors ${isActive ? "text-[#6605c7]" : isCompleted ? "text-emerald-600" : "text-gray-400"}`}>{s}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] p-8 md:p-14 shadow-xl border border-white relative overflow-hidden">
                        <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#6605c7]/10 rounded-full blur-3xl opacity-50" />

                        {/* Step 1: Loan Details */}
                        {step === 1 && (
                            <div className="space-y-10 animate-fade-in-up relative z-10">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-12 h-12 bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-center text-[#6605c7]">
                                        <span className="material-symbols-outlined text-2xl">account_balance</span>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Noto Serif', 'Playfair Display', serif" }}>Financing Details</h2>
                                        <p className="text-gray-500 text-sm font-medium">Specify your academic target and preferred lender</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <SelectField label="Prefered Banking Partner" icon="account_balance" value={formData.bank} onChange={(v) => update("bank", v)}
                                        options={banks.map((b) => ({ value: b.id, label: `${b.name} (${b.rate})` }))} error={stepErrors.bank} />
                                    <SelectField label="Loan Category" icon="category" value={formData.loanType} onChange={(v) => update("loanType", v)}
                                        options={loanTypes.map((t) => ({ value: t, label: t }))} error={stepErrors.loanType} />
                                    <SelectField label="Academic Level" icon="school" value={formData.courseType} onChange={(v) => update("courseType", v)}
                                        options={courses.map((c) => ({ value: c, label: c }))} error={stepErrors.courseType} />
                                    <SelectField label="Destination Country" icon="public" value={formData.country} onChange={(v) => update("country", v)}
                                        options={countries.map((c) => ({ value: c, label: c }))} error={stepErrors.country} />
                                </div>

                                <div className="space-y-8">
                                    <InputField label="Full University Name" icon="domain" value={formData.university} onChange={(v) => update("university", v)} placeholder="e.g. University of Toronto" error={stepErrors.university} />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <InputField label="Annual Tuition Fee (₹)" icon="payments" value={formData.annualFee} onChange={(v) => update("annualFee", v)} placeholder="e.g. 25,00,000" type="number" error={stepErrors.annualFee} />
                                        <InputField label="Loan Principal Amount (₹)" icon="savings" value={formData.amount} onChange={(v) => update("amount", v)} placeholder="e.g. 40,00,000" type="number" error={stepErrors.amount} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <InputField label="Monthly Living Budget (₹)" icon="home_work" value={formData.livingCost} onChange={(v) => update("livingCost", v)} placeholder="e.g. 5,00,000" type="number" />
                                        <SelectField label="Admission Status" icon="verified" value={formData.admissionStatus} onChange={(v) => update("admissionStatus", v)}
                                            options={[
                                                { value: "confirmed", label: "Confirmed Admission" },
                                                { value: "conditional", label: "Conditional Offer" },
                                                { value: "waiting", label: "Awaiting Result" },
                                                { value: "planning", label: "Planning Stage" }
                                            ]} error={stepErrors.admissionStatus} required />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Personal Info */}
                        {step === 2 && (
                            <div className="space-y-10 animate-fade-in-up relative z-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-center text-[#6605c7]">
                                            <span className="material-symbols-outlined text-2xl">person_pin</span>
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Noto Serif', 'Playfair Display', serif" }}>Personal Identity</h2>
                                            <p className="text-gray-500 text-sm font-medium">Help us verify your profile for instant approval</p>
                                        </div>
                                    </div>
                                    {user?.firstName && (
                                        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
                                            <span className="material-symbols-outlined text-[14px]">verified_user</span>
                                            Verified Profile
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <InputField label="Given Name" icon="person" value={formData.firstName} onChange={(v) => update("firstName", v)} placeholder="Rahul" error={stepErrors.firstName} required />
                                    <InputField label="Surname" icon="person" value={formData.lastName} onChange={(v) => update("lastName", v)} placeholder="Sharma" error={stepErrors.lastName} required />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <InputField label="Electronic Mail" icon="mail" value={formData.email} onChange={(v) => update("email", v)} placeholder="rahul@example.com" type="email" error={stepErrors.email} required />
                                    <InputField label="Mobile Connection" icon="phone_android" value={formData.phone} onChange={(v) => update("phone", v)} placeholder="+91 9876543210" type="tel" error={stepErrors.phone} required />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <InputField label="Date of Birth" icon="calendar_today" value={formData.dateOfBirth} onChange={(v) => update("dateOfBirth", v)} type="date" />
                                    <InputField label="Residential Address" icon="location_on" value={formData.address} onChange={(v) => update("address", v)} placeholder="City, State" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <SelectField label="Co-Applicant Identity" icon="family_history" value={formData.coApplicant} onChange={(v) => update("coApplicant", v)}
                                        options={[{ value: "parent", label: "Parent" }, { value: "spouse", label: "Spouse" }, { value: "sibling", label: "Sibling" }, { value: "none", label: "None" }]} error={stepErrors.coApplicant} required />
                                    {formData.coApplicant && formData.coApplicant !== "none" && (
                                        <InputField label="Co-Applicant Annual Income (₹)" icon="database" value={formData.income} onChange={(v) => update("income", v)} placeholder="e.g. 10,00,000" type="number" error={stepErrors.income} required />
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-8">
                                    <SelectField label="Collateral Assets" icon="home" value={formData.collateral} onChange={(v) => update("collateral", v)}
                                        options={[{ value: "yes-property", label: "Secured: Property" }, { value: "yes-fdr", label: "Secured: FDR/Insurance" }, { value: "no", label: "Unsecured: No Collateral" }]} error={stepErrors.collateral} required />
                                </div>

                                <div className="pt-4">
                                    <label className="text-[11px] uppercase tracking-[0.2em] font-black text-gray-500 block mb-4">Proposals or Requirements</label>
                                    <div className="relative group">
                                        <div className="absolute top-4 left-4 text-gray-400 group-focus-within:text-[#6605c7] transition-colors">
                                            <span className="material-symbols-outlined text-xl">sticky_note_2</span>
                                        </div>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => update("notes", e.target.value)}
                                            placeholder="Ex: I need help with disbursement stages or insurance coverage..."
                                            rows={4}
                                            className="w-full pl-12 pr-6 py-4 bg-white/70 border border-gray-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#6605c7]/50 transition-all text-sm font-medium leading-relaxed text-gray-900 placeholder:text-gray-400 shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Review */}
                        {step === 3 && (
                            <div className="space-y-12 animate-fade-in-up relative z-10">
                                <div className="text-center mb-4">
                                    <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto mb-6 shadow-sm">
                                        <span className="material-symbols-outlined text-4xl">rate_review</span>
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "'Noto Serif', 'Playfair Display', serif" }}>Validate Your File</h2>
                                    <p className="text-gray-500 text-sm font-medium">Verify all details before electronic submission</p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    {/* Loan Details Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-[11px] uppercase tracking-[0.2em] font-black text-[#6605c7] mb-6 flex items-center gap-3">
                                            <div className="w-8 h-8 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-center">
                                                <span className="material-symbols-outlined text-sm">account_balance</span>
                                            </div>
                                            Program Blueprint
                                        </h3>
                                        <div className="bg-white/70 rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-4">
                                            {[
                                                { label: "Partner Bank", value: banks.find((b) => b.id === formData.bank)?.name || formData.bank },
                                                { label: "Loan Structure", value: formData.loanType },
                                                { label: "Academic Goal", value: formData.courseType },
                                                { label: "Principal", value: formData.amount ? `₹${Number(formData.amount).toLocaleString("en-IN")}` : "" },
                                                { label: "Annual Tuition", value: formData.annualFee ? `₹${Number(formData.annualFee).toLocaleString("en-IN")}` : "" },
                                                { label: "Destination", value: formData.country },
                                                { label: "University", value: formData.university },
                                            ].filter((f) => f.value).map((f) => (
                                                <div key={f.label} className="flex justify-between items-center py-3 border-b border-gray-100/50 last:border-0">
                                                    <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">{f.label}</span>
                                                    <span className="font-black text-[13px] text-gray-900">{f.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Personal Info Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-[11px] uppercase tracking-[0.2em] font-black text-indigo-600 mb-6 flex items-center gap-3">
                                            <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center">
                                                <span className="material-symbols-outlined text-sm">person_filled</span>
                                            </div>
                                            Applicant Identity
                                        </h3>
                                        <div className="bg-white/70 rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-4">
                                            {[
                                                { label: "Legal Name", value: `${formData.firstName} ${formData.lastName}`.trim() },
                                                { label: "Electronic ID", value: formData.email },
                                                { label: "Mobile Line", value: formData.phone },
                                                { label: "Birth Record", value: formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : "" },
                                                { label: "Co-Applicant", value: formData.coApplicant === "none" ? "None" : formData.coApplicant ? formData.coApplicant.charAt(0).toUpperCase() + formData.coApplicant.slice(1) : "" },
                                                { label: "Secondary Income", value: formData.income && formData.coApplicant !== "none" ? `₹${Number(formData.income).toLocaleString("en-IN")}` : "" },
                                                { label: "Collateral", value: formData.collateral.split(':')[0] },
                                            ].filter((f) => f.value).map((f) => (
                                                <div key={f.label} className="flex justify-between items-center py-3 border-b border-gray-100/50 last:border-0">
                                                    <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">{f.label}</span>
                                                    <span className="font-black text-[13px] text-gray-900">{f.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {formData.notes && (
                                    <div className="mt-4">
                                        <div className="bg-white/70 rounded-3xl p-8 border border-gray-100 shadow-sm">
                                            <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 mb-4 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-sm">notes</span>
                                                Internal Observations
                                            </h3>
                                            <p className="text-[13px] text-gray-700 font-medium leading-loose italic">"{formData.notes}"</p>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="px-6 py-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-[13px] font-bold flex items-center gap-3 animate-bounce">
                                        <span className="material-symbols-outlined text-xl">error</span>
                                        {error}
                                    </div>
                                )}
                                {!isAuthenticated && (
                                    <div className="px-6 py-6 bg-amber-50 border border-amber-200 rounded-3xl text-amber-700 text-sm font-medium flex items-center gap-4 shadow-sm">
                                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shadow-sm border border-amber-200">
                                            <span className="material-symbols-outlined">priority_high</span>
                                        </div>
                                        <div>
                                            Authentication required to finalize submission.
                                            <Link href="/login?redirect=/apply-loan" className="ml-2 underline font-black text-[#6605c7]">Login Now</Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Navigation Actions */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mt-16 pt-10 border-t border-gray-100/50 relative z-10">
                            {step > 1 ? (
                                <button onClick={back} className="w-full sm:w-auto px-10 py-4 bg-white text-gray-600 border border-gray-200 text-[11px] uppercase tracking-[0.2em] font-black rounded-2xl hover:bg-gray-50 hover:text-gray-900 shadow-sm transition-all flex items-center justify-center gap-3 group">
                                    <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
                                    Previous Stage
                                </button>
                            ) : <div className="hidden sm:block" />}

                            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                {step < 3 ? (
                                    <button onClick={next} className="w-full sm:w-auto px-12 py-4 bg-[#6605c7] text-white text-[11px] uppercase tracking-[0.2em] font-black rounded-2xl hover:bg-[#7a0de8] hover:shadow-[0_0_20px_rgba(102,5,199,0.4)] transition-all flex items-center justify-center gap-3 group border border-[#8b24e5]">
                                        Advance Profile
                                        <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="w-full sm:w-auto px-16 py-4 bg-gradient-to-r from-[#6605c7] to-[#a855f7] text-white text-[11px] uppercase tracking-[0.2em] font-black rounded-2xl hover:brightness-110 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] disabled:opacity-50 transition-all flex items-center justify-center gap-4 group relative overflow-hidden"
                                    >
                                        {submitting ? (
                                            <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-lg group-hover:scale-125 transition-transform">rocket_launch</span>
                                                Submit Final Application
                                            </>
                                        )}
                                        <div className="absolute top-0 -left-full w-full h-full bg-white/20 skew-x-[-25deg] group-hover:left-[200%] transition-all duration-[1.5s]" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-8 text-[10px] font-black text-gray-500 uppercase tracking-widest relative z-10">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-emerald-500">lock</span>
                            256-bit AES Encrypted
                        </div>
                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full hidden md:block" />
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-[#6605c7]">shield_check</span>
                            RBI Licensed Lenders
                        </div>
                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full hidden md:block" />
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-blue-500">verified</span>
                            VidhyaLoan Assurance
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InputField({ label, icon, value, onChange, placeholder, type = "text", error, required }: {
    label: string; icon?: string; value: string; onChange: (v: string) => void;
    placeholder?: string; type?: string; error?: string; required?: boolean;
}) {
    return (
        <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 flex items-center justify-between">
                <span>{label} {required && <span className="text-red-500 ml-1">*</span>}</span>
            </label>
            <div className="relative group">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#6605c7] transition-all">
                        <span className="material-symbols-outlined text-xl">{icon}</span>
                    </div>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full ${icon ? 'pl-12' : 'px-6'} pr-6 py-4 bg-white/70 border rounded-2xl shadow-sm transition-all outline-none text-sm font-bold text-gray-900 focus:bg-white placeholder:text-gray-400 ${error ? "border-red-300 ring-2 ring-red-100" : "border-gray-200 focus:border-[#6605c7]/50 focus:ring-4 focus:ring-purple-100 hover:border-gray-300"}`}
                />
            </div>
            {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-wider pl-1">{error}</p>}
        </div>
    );
}

function SelectField({ label, icon, value, onChange, options, error, required }: {
    label: string; icon?: string; value: string; onChange: (v: string) => void;
    options: { value: string; label: string }[]; error?: string; required?: boolean;
}) {
    return (
        <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500">
                {label} {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative group">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#6605c7] pointer-events-none transition-all">
                        <span className="material-symbols-outlined text-xl">{icon}</span>
                    </div>
                )}
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full ${icon ? 'pl-12' : 'px-6'} pr-10 py-4 bg-white/70 border rounded-2xl shadow-sm appearance-none outline-none text-sm font-bold text-gray-900 focus:bg-white transition-all cursor-pointer ${error ? "border-red-300 ring-2 ring-red-100" : "border-gray-200 focus:border-[#6605c7]/50 focus:ring-4 focus:ring-purple-100 hover:border-gray-300"}`}
                >
                    <option value="" disabled className="text-gray-400">Choose Option...</option>
                    {options.map((o) => <option key={o.value} value={o.value} className="bg-white text-gray-900">{o.label}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <span className="material-symbols-outlined text-lg">expand_more</span>
                </div>
            </div>
            {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-wider pl-1">{error}</p>}
        </div>
    );
}
