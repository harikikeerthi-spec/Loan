"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { applicationApi } from "@/lib/api";
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
    const { isAuthenticated } = useAuth();
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
        notes: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const update = (field: string, value: string) =>
        setFormData((prev) => ({ ...prev, [field]: value }));

    const next = () => setStep((s) => s + 1);
    const back = () => setStep((s) => s - 1);

    const handleSubmit = async () => {
        if (!isAuthenticated) {
            router.push(`/login?redirect=/apply-loan`);
            return;
        }
        setSubmitting(true);
        setError("");
        try {
            await applicationApi.create({
                ...formData,
                amount: parseFloat(formData.amount),
            });
            // Notify other parts of the frontend that dashboard data changed
            try {
                const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
                if (userId) {
                    const key = `dashboardDataUpdated_${userId}`;
                    localStorage.setItem(key, String(Date.now()));
                }
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
                        <p className="text-gray-500 mb-8">Our loan experts will review your application and reach out within 24-48 hours.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/dashboard" className="px-8 py-4 bg-[#6605c7] text-white font-bold rounded-xl">View Dashboard</Link>
                            <Link href="/" className="px-8 py-4 bg-white text-gray-900 font-bold rounded-xl border border-gray-200">Back to Home</Link>
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
                        <p className="text-gray-500">Complete in 3 simple steps — takes only 5 minutes</p>
                    </div>

                    {/* Progress */}
                    <div className="flex items-center justify-center gap-2 mb-10">
                        {["Loan Details", "Personal Info", "Review"].map((s, i) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step > i + 1 ? "bg-green-500 text-white" : step === i + 1 ? "bg-[#6605c7] text-white" : "bg-gray-200 text-gray-400"
                                    }`}>
                                    {step > i + 1 ? <span className="material-symbols-outlined text-lg">check</span> : i + 1}
                                </div>
                                <span className={`text-sm font-medium hidden sm:block ${step === i + 1 ? "text-[#6605c7]" : "text-gray-400"}`}>{s}</span>
                                {i < 2 && <div className="w-12 sm:w-20 h-0.5 bg-gray-200" />}
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        {/* Step 1: Loan Details */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold">Loan Details</h2>
                                <SelectField label="Select Bank" value={formData.bank} onChange={(v) => update("bank", v)}
                                    options={banks.map((b) => ({ value: b.id, label: `${b.name} (${b.rate})` }))} />
                                <SelectField label="Loan Type" value={formData.loanType} onChange={(v) => update("loanType", v)}
                                    options={loanTypes.map((t) => ({ value: t, label: t }))} />
                                <SelectField label="Course Type" value={formData.courseType} onChange={(v) => update("courseType", v)}
                                    options={courses.map((c) => ({ value: c, label: c }))} />
                                <SelectField label="Destination Country" value={formData.country} onChange={(v) => update("country", v)}
                                    options={countries.map((c) => ({ value: c, label: c }))} />
                                <InputField label="Target University" value={formData.university} onChange={(v) => update("university", v)} placeholder="e.g. University of Toronto" />
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Annual Tuition (₹)" value={formData.annualFee} onChange={(v) => update("annualFee", v)} placeholder="e.g. 2500000" type="number" />
                                    <InputField label="Loan Amount Required (₹)" value={formData.amount} onChange={(v) => update("amount", v)} placeholder="e.g. 4000000" type="number" />
                                </div>
                            </div>
                        )}

                        {/* Step 2: Personal Info */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold">Personal Information</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="First Name" value={formData.firstName} onChange={(v) => update("firstName", v)} placeholder="Rahul" />
                                    <InputField label="Last Name" value={formData.lastName} onChange={(v) => update("lastName", v)} placeholder="Sharma" />
                                </div>
                                <InputField label="Email" value={formData.email} onChange={(v) => update("email", v)} placeholder="rahul@example.com" type="email" />
                                <InputField label="Phone" value={formData.phone} onChange={(v) => update("phone", v)} placeholder="+91 9876543210" type="tel" />
                                <SelectField label="Co-Applicant" value={formData.coApplicant} onChange={(v) => update("coApplicant", v)}
                                    options={[{ value: "parent", label: "Parent" }, { value: "spouse", label: "Spouse" }, { value: "sibling", label: "Sibling" }, { value: "none", label: "None" }]} />
                                <InputField label="Co-Applicant Annual Income (₹)" value={formData.income} onChange={(v) => update("income", v)} placeholder="e.g. 800000" type="number" />
                                <SelectField label="Collateral Available?" value={formData.collateral} onChange={(v) => update("collateral", v)}
                                    options={[{ value: "yes-property", label: "Yes – Property" }, { value: "yes-fdr", label: "Yes – FDR/Insurance" }, { value: "no", label: "No Collateral" }]} />
                                <div>
                                    <label className="text-sm font-bold block mb-2">Additional Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => update("notes", e.target.value)}
                                        placeholder="Any special requirements or notes..."
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-[#6605c7]"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 3: Review */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold">Review Application</h2>
                                <div className="bg-[#6605c7]/5 rounded-2xl p-6 space-y-3">
                                    {[
                                        { label: "Bank", value: banks.find((b) => b.id === formData.bank)?.name || formData.bank },
                                        { label: "Loan Type", value: formData.loanType },
                                        { label: "Loan Amount", value: `₹${Number(formData.amount).toLocaleString("en-IN")}` },
                                        { label: "Country", value: formData.country },
                                        { label: "University", value: formData.university },
                                        { label: "Name", value: `${formData.firstName} ${formData.lastName}` },
                                        { label: "Email", value: formData.email },
                                        { label: "Phone", value: formData.phone },
                                    ].filter((f) => f.value).map((f) => (
                                        <div key={f.label} className="flex justify-between items-center py-2 border-b border-white/10">
                                            <span className="text-gray-500 text-sm">{f.label}</span>
                                            <span className="font-bold text-sm">{f.value}</span>
                                        </div>
                                    ))}
                                </div>
                                {error && (
                                    <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
                                )}
                                {!isAuthenticated && (
                                    <div className="px-4 py-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                                        <span className="material-symbols-outlined text-sm mr-1">info</span>
                                        You need to be logged in to submit an application.{" "}
                                        <Link href="/login?redirect=/apply-loan" className="underline font-bold">Login here</Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex justify-between mt-8">
                            {step > 1 ? (
                                <button onClick={back} className="px-6 py-3 bg-gray-100 text-gray-800 font-bold rounded-xl hover:bg-gray-200 transition-all">
                                    ← Back
                                </button>
                            ) : <div />}
                            {step < 3 ? (
                                <button onClick={next} className="px-8 py-3 bg-[#6605c7] text-white font-bold rounded-xl hover:bg-[#7a0de8] transition-all">
                                    Continue →
                                </button>
                            ) : (
                                <button onClick={handleSubmit} disabled={submitting} className="px-8 py-3 bg-[#6605c7] text-white font-bold rounded-xl hover:bg-[#7a0de8] disabled:opacity-60 transition-all flex items-center gap-2">
                                    {submitting ? <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> : null}
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

function InputField({ label, value, onChange, placeholder, type = "text" }: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder?: string; type?: string;
}) {
    return (
        <div>
            <label className="text-sm font-bold block mb-2">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-[#6605c7] transition-all"
            />
        </div>
    );
}

function SelectField({ label, value, onChange, options }: {
    label: string; value: string; onChange: (v: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <div>
            <label className="text-sm font-bold block mb-2">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#6605c7] transition-all"
            >
                <option value="">Select an option</option>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );
}
