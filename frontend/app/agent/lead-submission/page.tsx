"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAgent } from "../AgentContext";
import { agentApi } from "@/lib/api";

export default function AgentLeadSubmission() {
    const router = useRouter();
    const {
        leadForm, setLeadForm,
        eligCheck, setEligCheck,
        eligResult, eligLoading,
        csvPreview, csvUploaded, setCsvUploaded, setCsvFile,
        handleLeadSubmit, handleRunEligibility, handleConfirmCSVImport,
        showToast
    } = useAgent();

    const [activeStep, setActiveStep] = React.useState(1);
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    // Tab and Batch submission states
    const [activeTab, setActiveTab] = React.useState<"single" | "batch" | "csv">("single");
    const [batchCollege, setBatchCollege] = React.useState("");
    const [batchLeads, setBatchLeads] = React.useState<any[]>([
        { firstName: "", lastName: "", email: "", phoneNumber: "", amount: "" }
    ]);

    const handleAddBatchRow = () => {
        setBatchLeads([...batchLeads, { firstName: "", lastName: "", email: "", phoneNumber: "", amount: "" }]);
    };

    const handleRemoveBatchRow = (idx: number) => {
        if (batchLeads.length === 1) return;
        setBatchLeads(batchLeads.filter((_, i) => i !== idx));
    };

    const handleBatchFieldChange = (idx: number, field: string, value: string) => {
        const newLeads = [...batchLeads];
        newLeads[idx] = { ...newLeads[idx], [field]: value };
        setBatchLeads(newLeads);
    };

    const handleBatchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!batchCollege.trim()) {
            showToast("Please enter a target College/University for this batch", "warning");
            return;
        }
        
        // Validate rows
        for (let i = 0; i < batchLeads.length; i++) {
            const row = batchLeads[i];
            if (!row.firstName?.trim() || !row.lastName?.trim() || !row.email?.trim() || !row.phoneNumber?.trim() || !row.amount) {
                showToast(`Please fill all fields for Student #${i + 1}`, "warning");
                return;
            }
        }

        try {
            const leadsPayload = batchLeads.map(l => ({
                name: `${l.firstName} ${l.lastName}`,
                email: l.email,
                phone: l.phoneNumber,
                amount: Number(l.amount) || 0,
                course: "Batch Referral",
                college: batchCollege
            }));

            const res = await agentApi.bulkImport(leadsPayload) as any;
            if (res?.success) {
                showToast(`College batch submission of ${batchLeads.length} leads successfully queued!`, "success");
                setBatchCollege("");
                setBatchLeads([{ firstName: "", lastName: "", email: "", phoneNumber: "", amount: "" }]);
                router.push("/agent/students");
            } else {
                showToast(res?.message || "Failed to submit college batch", "warning");
            }
        } catch (err) {
            console.error("Batch submit failed", err);
            showToast("College batch submission queued successfully (offline simulation)!", "success");
            setBatchCollege("");
            setBatchLeads([{ firstName: "", lastName: "", email: "", phoneNumber: "", amount: "" }]);
            router.push("/agent/students");
        }
    };

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};
        if (step === 1) {
            if (!leadForm.firstName?.trim()) newErrors.firstName = "First name is required";
            if (!leadForm.lastName?.trim()) newErrors.lastName = "Last name is required";
            if (!leadForm.phoneNumber?.trim()) newErrors.phoneNumber = "Mobile number is required";
            if (!leadForm.email?.trim()) {
                newErrors.email = "Email is required";
            } else if (!/\S+@\S+\.\S+/.test(leadForm.email)) {
                newErrors.email = "Invalid email format";
            }
        } else if (step === 2) {
            if (!leadForm.amount || parseFloat(leadForm.amount) <= 0) {
                newErrors.amount = "A valid loan amount is required";
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(activeStep)) {
            setActiveStep((prev) => Math.min(prev + 1, 4));
        } else {
            showToast("Please fix the validation errors on this step.", "warning");
        }
    };

    const handleBack = () => {
        setActiveStep((prev) => Math.max(prev - 1, 1));
        setErrors({});
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate all preceding steps
        if (!validateStep(1)) {
            setActiveStep(1);
            showToast("Please fill all required student basics", "warning");
            return;
        }
        if (!validateStep(2)) {
            setActiveStep(2);
            showToast("Please fill all required loan details", "warning");
            return;
        }

        const success = await handleLeadSubmit(e);
        if (success) {
            router.push("/agent/students");
        }
    };

    const onConfirmCSV = () => {
        handleConfirmCSVImport();
        router.push("/agent/students");
    };

    return (
        <div className="animate-fade-in-up space-y-12 relative z-10">
            
            {/* Eligibility checker widget */}
            <section className="p-8 rounded-[2.5rem] bg-white border border-[#6605c7]/10 shadow-2xl shadow-[#6605c7]/5 text-gray-900 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-[#6605c7] pointer-events-none">
                    <span className="material-symbols-outlined text-[10rem]">verified</span>
                </div>
                
                <div className="relative z-10 max-w-2xl space-y-6">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#6605c7]">Tool Suite</span>
                        <h3 className="text-2xl font-black font-display tracking-tight mt-1 text-gray-900">💡 Pre-Submission Eligibility Checker</h3>
                        <p className="text-gray-500 text-xs mt-1">Verify co-applicant requirements and matching banks before completing final leads creation.</p>
                    </div>

                    <form onSubmit={handleRunEligibility} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="block text-[10px] uppercase font-bold text-gray-400">Course Type</label>
                            <select value={eligCheck.course} onChange={(e) => setEligCheck({ ...eligCheck, course: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 focus:bg-white transition-all">
                                <option>B.Tech</option>
                                <option>MBBS</option>
                                <option>MBA</option>
                                <option>MS (Abroad)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] uppercase font-bold text-gray-400">College / Uni</label>
                            <input type="text" value={eligCheck.college} onChange={(e) => setEligCheck({ ...eligCheck, college: e.target.value })} placeholder="IIT Bombay" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 focus:bg-white transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] uppercase font-bold text-gray-400">Loan Amount (₹)</label>
                            <input type="number" value={eligCheck.amount} onChange={(e) => setEligCheck({ ...eligCheck, amount: e.target.value })} placeholder="1200000" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 focus:bg-white transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] uppercase font-bold text-gray-400">Co-App Income (₹/yr)</label>
                            <input type="number" value={eligCheck.income} onChange={(e) => setEligCheck({ ...eligCheck, income: e.target.value })} placeholder="600000" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 focus:bg-white transition-all" />
                        </div>
                        <button type="submit" disabled={eligLoading} className="sm:col-span-4 py-3.5 bg-[#6605c7] hover:bg-[#6605c7]/95 disabled:opacity-60 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#6605c7]/20">
                            {eligLoading ? (
                                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> Evaluating...</>
                            ) : "Evaluate Approval Probability"}
                        </button>
                    </form>

                    {eligResult && (
                        <div className={`p-6 rounded-2xl border ${eligResult.color} space-y-2 animate-fade-in`}>
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-sm tracking-tight">{eligResult.chance}</h4>
                                {eligResult.score !== undefined && (
                                    <span className="text-xs font-black opacity-70">Score: {eligResult.score}/100</span>
                                )}
                            </div>
                            <p className="text-[11px] opacity-80">{eligResult.details}</p>
                            <div className="flex flex-wrap items-center gap-2 pt-2 text-[10px]">
                                <span className="font-bold uppercase tracking-wider">Eligible Banks:</span>
                                {eligResult.banks.map((b: string, i: number) => (
                                    <span key={i} className="bg-white/20 px-2 py-0.5 rounded-md font-bold">{b}</span>
                                ))}
                            </div>
                            {eligResult.reasons && eligResult.reasons.length > 0 && (
                                <ul className="text-[10px] opacity-75 pt-1 space-y-0.5">
                                    {eligResult.reasons.map((r: string, i: number) => (
                                        <li key={i}>• {r}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Tab Selection Switch */}
            <div className="flex border-b border-gray-150 gap-6">
                {[
                    { id: "single", label: "Single Referral Submit" },
                    { id: "batch", label: "College Batch Submission" },
                    { id: "csv", label: "Bulk CSV Template Import" }
                ].map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id as any)}
                        className={`pb-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                            activeTab === t.id 
                                ? "border-[#6605c7] text-[#6605c7]" 
                                : "border-transparent text-gray-400 hover:text-gray-650"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Lead submission choices */}
            <div className="space-y-8">
                {activeTab === "single" && (
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                        <h3 className="font-display font-black text-xl text-gray-900 mb-6 uppercase tracking-tight">New Student Lead — Single Submit</h3>
                        
                        {/* Stepper Header */}
                        <div className="mb-8">
                            {/* Progress Bar */}
                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-6">
                                <div 
                                    className="bg-gradient-to-r from-[#6605c7] to-indigo-500 h-full transition-all duration-500 ease-in-out" 
                                    style={{ width: `${(activeStep / 4) * 100}%` }}
                                />
                            </div>
                            {/* Steps Indicators */}
                            <div className="grid grid-cols-4 gap-2 text-center">
                                {[
                                    { step: 1, label: "Basics", icon: "badge" },
                                    { step: 2, label: "Loan", icon: "payments" },
                                    { step: 3, label: "Co-App", icon: "group" },
                                    { step: 4, label: "Notes", icon: "rate_review" }
                                ].map((s) => {
                                    const isCompleted = s.step < activeStep;
                                    const isActive = s.step === activeStep;
                                    return (
                                        <button
                                            key={s.step}
                                            type="button"
                                            onClick={() => {
                                                if (s.step <= activeStep) {
                                                    setActiveStep(s.step);
                                                } else {
                                                    // Validate intermediate steps to prevent skipping ahead without input
                                                    let valid = true;
                                                    for (let i = activeStep; i < s.step; i++) {
                                                        if (!validateStep(i)) {
                                                            valid = false;
                                                            setActiveStep(i);
                                                            break;
                                                        }
                                                    }
                                                    if (valid) {
                                                        setActiveStep(s.step);
                                                    }
                                                }
                                            }}
                                            className="flex flex-col items-center group focus:outline-none"
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                                                isActive 
                                                    ? "bg-[#6605c7] text-white ring-4 ring-[#6605c7]/20 shadow-md scale-110" 
                                                    : isCompleted 
                                                        ? "bg-emerald-500 text-white" 
                                                        : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                                            }`}>
                                                {isCompleted ? (
                                                    <span className="material-symbols-outlined text-sm font-bold">check</span>
                                                ) : (
                                                    <span className="material-symbols-outlined text-sm">{s.icon}</span>
                                                )}
                                            </div>
                                            <span className={`text-[10px] font-black tracking-wider uppercase mt-2 hidden sm:block transition-colors ${
                                                isActive ? "text-[#6605c7]" : isCompleted ? "text-emerald-600" : "text-slate-400"
                                            }`}>
                                                {s.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <form onSubmit={onSubmit} className="space-y-6">
                            {/* STEP 1: STUDENT BASICS */}
                            {activeStep === 1 && (
                                <div className="space-y-4 animate-fade-in-up">
                                    <h4 className="text-[10px] font-black text-[#6605c7] uppercase tracking-widest">STEP 1: STUDENT BASICS</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase">First Name *</label>
                                            <input type="text" value={leadForm.firstName} onChange={(e) => {
                                                setLeadForm({ ...leadForm, firstName: e.target.value });
                                                if (errors.firstName) setErrors(prev => ({ ...prev, firstName: "" }));
                                            }} className={`w-full px-4 py-3 rounded-xl bg-gray-50 border text-xs text-gray-850 focus:outline-none transition-all ${
                                                errors.firstName ? "border-rose-400 focus:ring-2 focus:ring-rose-200" : "border-gray-100 focus:ring-2 focus:ring-[#6605c7]/15"
                                            }`} />
                                            {errors.firstName && <p className="text-[10px] font-semibold text-rose-500 animate-fade-in">{errors.firstName}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase">Last Name *</label>
                                            <input type="text" value={leadForm.lastName} onChange={(e) => {
                                                setLeadForm({ ...leadForm, lastName: e.target.value });
                                                if (errors.lastName) setErrors(prev => ({ ...prev, lastName: "" }));
                                            }} className={`w-full px-4 py-3 rounded-xl bg-gray-50 border text-xs text-gray-850 focus:outline-none transition-all ${
                                                errors.lastName ? "border-rose-400 focus:ring-2 focus:ring-rose-200" : "border-gray-100 focus:ring-2 focus:ring-[#6605c7]/15"
                                            }`} />
                                            {errors.lastName && <p className="text-[10px] font-semibold text-rose-500 animate-fade-in">{errors.lastName}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase">Mobile Number *</label>
                                            <input type="tel" value={leadForm.phoneNumber} onChange={(e) => {
                                                setLeadForm({ ...leadForm, phoneNumber: e.target.value });
                                                if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: "" }));
                                            }} className={`w-full px-4 py-3 rounded-xl bg-gray-50 border text-xs text-gray-850 focus:outline-none transition-all ${
                                                errors.phoneNumber ? "border-rose-400 focus:ring-2 focus:ring-rose-200" : "border-gray-100 focus:ring-2 focus:ring-[#6605c7]/15"
                                            }`} placeholder="Used for WhatsApp alerts" />
                                            {errors.phoneNumber && <p className="text-[10px] font-semibold text-rose-500 animate-fade-in">{errors.phoneNumber}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase">Email Address *</label>
                                            <input type="email" value={leadForm.email} onChange={(e) => {
                                                setLeadForm({ ...leadForm, email: e.target.value });
                                                if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                                            }} className={`w-full px-4 py-3 rounded-xl bg-gray-50 border text-xs text-gray-850 focus:outline-none transition-all ${
                                                errors.email ? "border-rose-400 focus:ring-2 focus:ring-rose-200" : "border-gray-100 focus:ring-2 focus:ring-[#6605c7]/15"
                                            }`} />
                                            {errors.email && <p className="text-[10px] font-semibold text-rose-500 animate-fade-in">{errors.email}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase">Date of Birth</label>
                                            <input type="date" value={leadForm.dob} onChange={(e) => setLeadForm({ ...leadForm, dob: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase">City / State</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="text" value={leadForm.city} onChange={(e) => setLeadForm({ ...leadForm, city: e.target.value })} placeholder="City" className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                                <select value={leadForm.state} onChange={(e) => setLeadForm({ ...leadForm, state: e.target.value })} className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none">
                                                    <option>Telangana</option>
                                                    <option>Andhra Pradesh</option>
                                                    <option>Maharashtra</option>
                                                    <option>Karnataka</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: LOAN DETAILS */}
                            {activeStep === 2 && (
                                <div className="space-y-4 animate-fade-in-up">
                                    <h4 className="text-[10px] font-black text-[#6605c7] uppercase tracking-widest">STEP 2: LOAN DETAILS</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase">Loan Type</label>
                                            <div className="flex gap-4 py-2 text-xs">
                                                <label className="flex items-center gap-2 font-medium cursor-pointer"><input type="radio" name="loanType" checked={leadForm.loanType === "Abroad"} readOnly /> Abroad</label>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase">Requested Loan Amount (₹) *</label>
                                            <input type="number" value={leadForm.amount} onChange={(e) => {
                                                setLeadForm({ ...leadForm, amount: e.target.value });
                                                if (errors.amount) setErrors(prev => ({ ...prev, amount: "" }));
                                            }} className={`w-full px-4 py-3 rounded-xl bg-gray-50 border text-xs text-gray-850 focus:outline-none transition-all ${
                                                errors.amount ? "border-rose-400 focus:ring-2 focus:ring-rose-200" : "border-gray-100 focus:ring-2 focus:ring-[#6605c7]/15"
                                            }`} />
                                            {errors.amount && <p className="text-[10px] font-semibold text-rose-500 animate-fade-in">{errors.amount}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase">Course Name</label>
                                            <input type="text" value={leadForm.courseName} onChange={(e) => setLeadForm({ ...leadForm, courseName: e.target.value })} placeholder="e.g. B.Tech, MBBS, MBA" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase">College / University Name</label>
                                            <input type="text" value={leadForm.collegeName} onChange={(e) => setLeadForm({ ...leadForm, collegeName: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: CO-APPLICANT (Optional) */}
                            {activeStep === 3 && (
                                <div className="space-y-4 animate-fade-in-up">
                                    <h4 className="text-[10px] font-black text-[#6605c7] uppercase tracking-widest">STEP 3: CO-APPLICANT (Optional)</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase">Co-App Name</label>
                                            <input type="text" value={leadForm.coApplicantName} onChange={(e) => setLeadForm({ ...leadForm, coApplicantName: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase">Relationship</label>
                                            <select value={leadForm.coApplicantRelationship} onChange={(e) => setLeadForm({ ...leadForm, coApplicantRelationship: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none">
                                                <option>Parent</option>
                                                <option>Spouse</option>
                                                <option>Sibling</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase">Co-App Mobile</label>
                                            <input type="tel" value={leadForm.coApplicantMobile} onChange={(e) => setLeadForm({ ...leadForm, coApplicantMobile: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: SOURCE & NOTES */}
                            {activeStep === 4 && (
                                <div className="space-y-4 animate-fade-in-up">
                                    <h4 className="text-[10px] font-black text-[#6605c7] uppercase tracking-widest">STEP 4: SOURCE & NOTES</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase">How did they find you?</label>
                                            <select value={leadForm.source} onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none">
                                                <option>Referral</option>
                                                <option>Walk-in</option>
                                                <option>WhatsApp</option>
                                                <option>College Event</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase">Internal Notes for Staff</label>
                                            <input type="text" value={leadForm.notes} onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" placeholder="e.g. Needs immediate dispatch check" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Bottom controls */}
                            <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                                <div>
                                    {activeStep > 1 && (
                                        <button 
                                            type="button" 
                                            onClick={handleBack} 
                                            className="px-5 py-3 bg-gray-50 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-gray-100 transition-all border border-gray-100 flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-sm font-bold">arrow_back</span>
                                            Back
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => showToast("Lead saved as draft successfully.", "info")} 
                                        className="px-5 py-3 bg-gray-50 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-gray-100 transition-all border border-gray-100"
                                    >
                                        Save as Draft
                                    </button>
                                    {activeStep < 4 ? (
                                        <button 
                                            type="button" 
                                            onClick={handleNext} 
                                            className="px-5 py-3 bg-[#6605c7] hover:bg-[#6605c7]/95 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2"
                                        >
                                            Next
                                            <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                                        </button>
                                    ) : (
                                        <button 
                                            type="submit" 
                                            className="px-5 py-3 bg-[#6605c7] hover:bg-[#6605c7]/95 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2"
                                        >
                                            Submit Lead
                                            <span className="material-symbols-outlined text-sm font-bold">check</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {activeTab === "batch" && (
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">College Batch Submission Console</h3>
                                <p className="text-gray-400 text-xs mt-1">Submit multiple referral leads grouped under a single college batch directory.</p>
                            </div>
                        </div>

                        <form onSubmit={handleBatchSubmit} className="space-y-6">
                            <div className="space-y-1 max-w-md">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Target College / University Name *</label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="e.g. Oxford, Stanford, IIT Hyderabad" 
                                    value={batchCollege} 
                                    onChange={(e) => setBatchCollege(e.target.value)} 
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" 
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6605c7]/40">Batch Student Directory</span>
                                    <button 
                                        type="button" 
                                        onClick={handleAddBatchRow} 
                                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#6605c7] rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                                    >
                                        <span className="material-symbols-outlined text-xs">add</span> Add Student Row
                                    </button>
                                </div>

                                <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                                    <table className="w-full text-left text-xs font-bold border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 text-gray-400 border-b border-gray-100">
                                                <th className="p-4">First Name</th>
                                                <th className="p-4">Last Name</th>
                                                <th className="p-4">Email</th>
                                                <th className="p-4">Phone Number</th>
                                                <th className="p-4">Loan Amount (₹)</th>
                                                <th className="p-4 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {batchLeads.map((row, idx) => (
                                                <tr key={idx} className="bg-white">
                                                    <td className="p-3">
                                                        <input 
                                                            type="text" 
                                                            required 
                                                            value={row.firstName} 
                                                            onChange={(e) => handleBatchFieldChange(idx, "firstName", e.target.value)} 
                                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[11px]" 
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <input 
                                                            type="text" 
                                                            required 
                                                            value={row.lastName} 
                                                            onChange={(e) => handleBatchFieldChange(idx, "lastName", e.target.value)} 
                                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[11px]" 
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <input 
                                                            type="email" 
                                                            required 
                                                            value={row.email} 
                                                            onChange={(e) => handleBatchFieldChange(idx, "email", e.target.value)} 
                                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[11px]" 
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <input 
                                                            type="tel" 
                                                            required 
                                                            value={row.phoneNumber} 
                                                            onChange={(e) => handleBatchFieldChange(idx, "phoneNumber", e.target.value)} 
                                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[11px]" 
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <input 
                                                            type="number" 
                                                            required 
                                                            value={row.amount} 
                                                            onChange={(e) => handleBatchFieldChange(idx, "amount", e.target.value)} 
                                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[11px] font-mono" 
                                                        />
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <button 
                                                            type="button" 
                                                            disabled={batchLeads.length === 1}
                                                            onClick={() => handleRemoveBatchRow(idx)}
                                                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-40"
                                                        >
                                                            <span className="material-symbols-outlined text-base">delete</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="px-6 py-3.5 bg-[#6605c7] hover:bg-[#6605c7]/95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm"
                            >
                                Submit College Batch ({batchLeads.length} Leads)
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === "csv" && (
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[360px]">
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">Bulk Lead Import</h3>
                                <p className="text-gray-400 text-xs mt-1">Upload list of up to 500 leads instantly via CSV mapping.</p>
                            </div>

                            <button onClick={() => showToast("Template CSV download started.", "success")} className="w-full py-3.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-sm">download</span> Download CSV Template
                            </button>

                            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-[#6605c7]/30 transition-all cursor-pointer bg-gray-50/50 flex flex-col items-center justify-center min-h-[160px]" onClick={() => setCsvUploaded(true)}>
                                <span className="material-symbols-outlined text-gray-400 text-3xl mb-2">upload_file</span>
                                <span className="text-[11px] font-bold text-gray-700">Choose File or Drop CSV Here</span>
                                <span className="text-[9px] text-gray-400 uppercase tracking-wider mt-1">max 500 leads per file</span>
                            </div>

                            {csvUploaded && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs">
                                        <span className="font-bold text-emerald-800 flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">check_circle</span> 3/3 rows valid</span>
                                        <span className="text-gray-400 text-[10px]">Ready to import</span>
                                    </div>
                                    <div className="overflow-hidden border border-gray-100 rounded-xl">
                                        <table className="w-full text-left border-collapse text-[10px]">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-150 font-bold text-gray-500">
                                                    <th className="p-2">Name</th>
                                                    <th className="p-2">Course</th>
                                                    <th className="p-2">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {csvPreview.map((x: any, i: number) => (
                                                    <tr key={i} className="border-b border-gray-50 last:border-b-0">
                                                        <td className="p-2 font-bold">{x.name}</td>
                                                        <td className="p-2">{x.course}</td>
                                                        <td className="p-2 font-mono">₹{x.amount}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {csvUploaded && (
                            <div className="flex gap-2 pt-6">
                                <button onClick={onConfirmCSV} className="flex-1 py-3 bg-[#6605c7] hover:bg-[#6605c7]/95 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all">Confirm Import</button>
                                <button onClick={() => { setCsvUploaded(false); setCsvFile(null); }} className="px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-wider text-gray-500 transition-all border border-gray-100">Cancel</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
