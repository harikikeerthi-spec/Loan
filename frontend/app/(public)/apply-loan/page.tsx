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
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");
    const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
    const [profileLoaded, setProfileLoaded] = useState(false);

    // Pre-fill personal info from user profile
    useEffect(() => {
        if (user && !profileLoaded) {
            setFormData((prev) => ({
                ...prev,
                firstName: prev.firstName || user.firstName || "",
                lastName: prev.lastName || user.lastName || "",
                email: prev.email || user.email || "",
                phone: prev.phone || user.phoneNumber || "",
                dateOfBirth: prev.dateOfBirth || user.dateOfBirth || "",
            }));
            setProfileLoaded(true);
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
    };
    const back = () => setStep((s) => s - 1);

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
            <div className="min-h-screen bg-transparent">
                <div className="flex items-center justify-center min-h-screen px-6">
                    <div className="text-center max-w-lg">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-green-500 text-5xl">check_circle</span>
                        </div>
                        <h2 className="text-3xl font-bold font-display mb-4">Application Submitted!</h2>
                        <p className="text-gray-500 text-[13px] mb-3">Your loan application has been submitted successfully. You can track it from your dashboard.</p>
                        <p className="text-gray-400 text-[12px] mb-8">Our loan experts will review your application and reach out within 24-48 hours.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/dashboard" className="px-8 py-4 bg-[#6605c7] text-white text-[11px] uppercase tracking-widest font-bold rounded-xl hover:bg-[#5504a8] transition-all flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-base">dashboard</span>
                                View Dashboard
                            </Link>
                            <Link href="/" className="px-8 py-4 bg-white text-gray-900 text-[11px] uppercase tracking-widest font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">Back to Home</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent">
            <div className="pt-28 pb-16 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-bold font-display mb-3">Apply for Education Loan</h1>
                        <p className="text-gray-500 text-[13px]">Complete in 3 simple steps — takes only 5 minutes</p>
                    </div>

                    {/* Progress */}
                    <div className="flex items-center justify-center gap-2 mb-10">
                        {["Loan Details", "Personal Info", "Review"].map((s, i) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold transition-all ${step > i + 1 ? "bg-green-500 text-white" : step === i + 1 ? "bg-[#6605c7] text-white" : "bg-gray-200 text-gray-400"
                                    }`}>
                                    {step > i + 1 ? <span className="material-symbols-outlined text-lg">check</span> : i + 1}
                                </div>
                                <span className={`text-[11px] uppercase tracking-widest font-bold hidden sm:block ${step === i + 1 ? "text-[#6605c7]" : "text-gray-400"}`}>{s}</span>
                                {i < 2 && <div className="w-12 sm:w-20 h-0.5 bg-gray-200" />}
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                        {/* Step 1: Loan Details */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold">Loan Details</h2>
                                <SelectField label="Select Bank" value={formData.bank} onChange={(v) => update("bank", v)}
                                    options={banks.map((b) => ({ value: b.id, label: `${b.name} (${b.rate})` }))} error={stepErrors.bank} />
                                <SelectField label="Loan Type" value={formData.loanType} onChange={(v) => update("loanType", v)}
                                    options={loanTypes.map((t) => ({ value: t, label: t }))} error={stepErrors.loanType} />
                                <SelectField label="Course Type" value={formData.courseType} onChange={(v) => update("courseType", v)}
                                    options={courses.map((c) => ({ value: c, label: c }))} error={stepErrors.courseType} />
                                <SelectField label="Destination Country" value={formData.country} onChange={(v) => update("country", v)}
                                    options={countries.map((c) => ({ value: c, label: c }))} error={stepErrors.country} />
                                <InputField label="Target University" value={formData.university} onChange={(v) => update("university", v)} placeholder="e.g. University of Toronto" error={stepErrors.university} />
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Annual Tuition (₹)" value={formData.annualFee} onChange={(v) => update("annualFee", v)} placeholder="e.g. 2500000" type="number" error={stepErrors.annualFee} />
                                    <InputField label="Loan Amount Required (₹)" value={formData.amount} onChange={(v) => update("amount", v)} placeholder="e.g. 4000000" type="number" error={stepErrors.amount} />
                                </div>
                                <InputField label="Estimated Living Cost (₹) — Optional" value={formData.livingCost} onChange={(v) => update("livingCost", v)} placeholder="e.g. 500000" type="number" />
                            </div>
                        )}

                        {/* Step 2: Personal Info */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold">Personal Information</h2>
                                    {user?.firstName && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wider border border-green-200">
                                            <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                            Auto-filled from profile
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="First Name" value={formData.firstName} onChange={(v) => update("firstName", v)} placeholder="Rahul" error={stepErrors.firstName} required />
                                    <InputField label="Last Name" value={formData.lastName} onChange={(v) => update("lastName", v)} placeholder="Sharma" error={stepErrors.lastName} required />
                                </div>
                                <InputField label="Email" value={formData.email} onChange={(v) => update("email", v)} placeholder="rahul@example.com" type="email" error={stepErrors.email} required />
                                <InputField label="Phone" value={formData.phone} onChange={(v) => update("phone", v)} placeholder="+91 9876543210" type="tel" error={stepErrors.phone} required />
                                <InputField label="Date of Birth" value={formData.dateOfBirth} onChange={(v) => update("dateOfBirth", v)} type="date" />
                                <InputField label="Address — Optional" value={formData.address} onChange={(v) => update("address", v)} placeholder="Enter your current address" />
                                <SelectField label="Co-Applicant" value={formData.coApplicant} onChange={(v) => update("coApplicant", v)}
                                    options={[{ value: "parent", label: "Parent" }, { value: "spouse", label: "Spouse" }, { value: "sibling", label: "Sibling" }, { value: "none", label: "None" }]} error={stepErrors.coApplicant} required />
                                {formData.coApplicant && formData.coApplicant !== "none" && (
                                    <InputField label="Co-Applicant Annual Income (₹)" value={formData.income} onChange={(v) => update("income", v)} placeholder="e.g. 800000" type="number" error={stepErrors.income} required />
                                )}
                                <SelectField label="Collateral Available?" value={formData.collateral} onChange={(v) => update("collateral", v)}
                                    options={[{ value: "yes-property", label: "Yes – Property" }, { value: "yes-fdr", label: "Yes – FDR/Insurance" }, { value: "no", label: "No Collateral" }]} error={stepErrors.collateral} required />
                                <div>
                                    <label className="text-[11px] uppercase tracking-widest font-bold block mb-2">Additional Notes — Optional</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => update("notes", e.target.value)}
                                        placeholder="Any special requirements or notes..."
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-[#6605c7] text-[13px]"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 3: Review */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold">Review Application</h2>

                                {/* Loan Details Section */}
                                <div>
                                    <h3 className="text-[11px] uppercase tracking-widest font-bold text-[#6605c7] mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">account_balance</span>
                                        Loan Details
                                    </h3>
                                    <div className="bg-[#6605c7]/5 rounded-xl p-5 space-y-0">
                                        {[
                                            { label: "Bank", value: banks.find((b) => b.id === formData.bank)?.name || formData.bank },
                                            { label: "Loan Type", value: formData.loanType },
                                            { label: "Course Type", value: formData.courseType },
                                            { label: "Loan Amount", value: formData.amount ? `₹${Number(formData.amount).toLocaleString("en-IN")}` : "" },
                                            { label: "Annual Tuition", value: formData.annualFee ? `₹${Number(formData.annualFee).toLocaleString("en-IN")}` : "" },
                                            { label: "Living Cost", value: formData.livingCost ? `₹${Number(formData.livingCost).toLocaleString("en-IN")}` : "" },
                                            { label: "Country", value: formData.country },
                                            { label: "University", value: formData.university },
                                        ].filter((f) => f.value).map((f) => (
                                            <div key={f.label} className="flex justify-between items-center py-2.5 border-b border-white/50 last:border-0">
                                                <span className="text-gray-500 text-[13px]">{f.label}</span>
                                                <span className="font-bold text-[13px] text-gray-900">{f.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Personal Info Section */}
                                <div>
                                    <h3 className="text-[11px] uppercase tracking-widest font-bold text-[#6605c7] mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">person</span>
                                        Personal Information
                                    </h3>
                                    <div className="bg-[#6605c7]/5 rounded-xl p-5 space-y-0">
                                        {[
                                            { label: "Name", value: `${formData.firstName} ${formData.lastName}`.trim() },
                                            { label: "Email", value: formData.email },
                                            { label: "Phone", value: formData.phone },
                                            { label: "Date of Birth", value: formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : "" },
                                            { label: "Address", value: formData.address },
                                        ].filter((f) => f.value).map((f) => (
                                            <div key={f.label} className="flex justify-between items-center py-2.5 border-b border-white/50 last:border-0">
                                                <span className="text-gray-500 text-[13px]">{f.label}</span>
                                                <span className="font-bold text-[13px] text-gray-900">{f.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Financial Info Section */}
                                <div>
                                    <h3 className="text-[11px] uppercase tracking-widest font-bold text-[#6605c7] mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">payments</span>
                                        Financial Details
                                    </h3>
                                    <div className="bg-[#6605c7]/5 rounded-xl p-5 space-y-0">
                                        {[
                                            { label: "Co-Applicant", value: formData.coApplicant === "none" ? "None" : formData.coApplicant ? formData.coApplicant.charAt(0).toUpperCase() + formData.coApplicant.slice(1) : "" },
                                            { label: "Co-Applicant Income", value: formData.income && formData.coApplicant !== "none" ? `₹${Number(formData.income).toLocaleString("en-IN")} / year` : "" },
                                            { label: "Collateral", value: formData.collateral === "yes-property" ? "Yes – Property" : formData.collateral === "yes-fdr" ? "Yes – FDR/Insurance" : formData.collateral === "no" ? "No Collateral" : "" },
                                        ].filter((f) => f.value).map((f) => (
                                            <div key={f.label} className="flex justify-between items-center py-2.5 border-b border-white/50 last:border-0">
                                                <span className="text-gray-500 text-[13px]">{f.label}</span>
                                                <span className="font-bold text-[13px] text-gray-900">{f.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Notes */}
                                {formData.notes && (
                                    <div>
                                        <h3 className="text-[11px] uppercase tracking-widest font-bold text-[#6605c7] mb-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm">notes</span>
                                            Additional Notes
                                        </h3>
                                        <div className="bg-[#6605c7]/5 rounded-xl p-5">
                                            <p className="text-[13px] text-gray-700 leading-relaxed">{formData.notes}</p>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[13px] flex items-center gap-2">
                                        <span className="material-symbols-outlined text-base">error</span>
                                        {error}
                                    </div>
                                )}
                                {!isAuthenticated && (
                                    <div className="px-4 py-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-[13px] flex items-center gap-2">
                                        <span className="material-symbols-outlined text-base">info</span>
                                        You need to be logged in to submit an application.{" "}
                                        <Link href="/login?redirect=/apply-loan" className="underline font-bold">Login here</Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex justify-between mt-8">
                            {step > 1 ? (
                                <button onClick={back} className="px-6 py-3 bg-gray-100 text-gray-800 text-[11px] uppercase tracking-widest font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                                    Back
                                </button>
                            ) : <div />}
                            {step < 3 ? (
                                <button onClick={next} className="px-8 py-3 bg-[#6605c7] text-white text-[11px] uppercase tracking-widest font-bold rounded-xl hover:bg-[#7a0de8] transition-all flex items-center gap-2">
                                    Continue
                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>
                            ) : (
                                <button onClick={handleSubmit} disabled={submitting} className="px-8 py-3 bg-[#6605c7] text-white text-[11px] uppercase tracking-widest font-bold rounded-xl hover:bg-[#7a0de8] disabled:opacity-60 transition-all flex items-center gap-2">
                                    {submitting ? <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> : <span className="material-symbols-outlined text-base">send</span>}
                                    Submit Application
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InputField({ label, value, onChange, placeholder, type = "text", error, required }: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder?: string; type?: string; error?: string; required?: boolean;
}) {
    return (
        <div>
            <label className="text-[11px] uppercase tracking-widest font-bold block mb-2">
                {label}
                {required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full px-4 py-3 border rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-[#6605c7] transition-all text-[13px] ${error ? "border-red-300 ring-1 ring-red-200" : "border-gray-200"}`}
            />
            {error && <p className="text-red-500 text-[11px] mt-1 font-medium">{error}</p>}
        </div>
    );
}

function SelectField({ label, value, onChange, options, error, required }: {
    label: string; value: string; onChange: (v: string) => void;
    options: { value: string; label: string }[]; error?: string; required?: boolean;
}) {
    return (
        <div>
            <label className="text-[11px] uppercase tracking-widest font-bold block mb-2">
                {label}
                {required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#6605c7] transition-all text-[13px] ${error ? "border-red-300 ring-1 ring-red-200" : "border-gray-200"}`}
            >
                <option value="">Select an option</option>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {error && <p className="text-red-500 text-[11px] mt-1 font-medium">{error}</p>}
        </div>
    );
}
