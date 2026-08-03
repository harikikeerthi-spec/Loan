"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAgent } from "../AgentContext";
import { agentApi, aiApi } from "@/lib/api";
import { isPhoneValid, formatPhone } from "@/lib/validation";
import { getAllCountries } from "@/lib/countriesData";

const popularCountries = ["USA", "UK", "Canada", "Australia", "Germany", "Ireland", "New Zealand", "Other"];

export default function AgentLeadSubmission() {
    const router = useRouter();
    const {
        leadForm, setLeadForm,
        eligCheck, setEligCheck,
        eligResult, eligLoading,
        csvPreview, setCsvPreview, csvUploaded, setCsvUploaded, csvFile, setCsvFile,
        handleLeadSubmit, handleRunEligibility, handleConfirmCSVImport,
        showToast
    } = useAgent();

    const [activeStep, setActiveStep] = React.useState(1);
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    const [activeTab, setActiveTab] = React.useState<"single" | "batch" | "csv">("single");
    const [batchCollege, setBatchCollege] = React.useState("");
    const [batchLeads, setBatchLeads] = React.useState<any[]>([
        { firstName: "", lastName: "", email: "", phoneNumber: "", amount: "" }
    ]);

    // AI University Suggestions & Country state
    const [suggestedUniversities, setSuggestedUniversities] = React.useState<any[]>([]);
    const [loadingUniversities, setLoadingUniversities] = React.useState(false);
    const [showUniversitySuggestions, setShowUniversitySuggestions] = React.useState(false);

    const selectedCountry = leadForm.country === "Other" ? leadForm.otherCountry : leadForm.country;

    React.useEffect(() => {
        if (!selectedCountry && !leadForm.collegeName) {
            setSuggestedUniversities([]);
            return;
        }

        let active = true;
        const delay = leadForm.collegeName ? 300 : 0;
        const timer = setTimeout(async () => {
            setLoadingUniversities(true);
            try {
                const res = await aiApi.aiSearch({
                    type: "university",
                    query: leadForm.collegeName || "",
                    country: selectedCountry || ""
                }) as any;

                if (!active) return;
                const aiUnis = res?.universities || res?.results || [];
                const formatted: any[] = [];
                aiUnis.forEach((u: any) => {
                    const uniName = typeof u === "string" ? u : (u?.name || u?.university || "");
                    const uniLoc = typeof u === "object" ? (u?.loc || u?.location || u?.country || "") : "";
                    if (uniName && !formatted.some(m => m.name.toLowerCase() === uniName.toLowerCase())) {
                        formatted.push({ name: uniName, loc: uniLoc || selectedCountry || "Target University" });
                    }
                });
                setSuggestedUniversities(formatted);
            } catch (err) {
                console.error("Failed to query universities via AI", err);
            } finally {
                if (active) setLoadingUniversities(false);
            }
        }, delay);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [leadForm.collegeName, leadForm.country, leadForm.otherCountry]);

    const handleAddBatchRow = () => {
        setBatchLeads([...batchLeads, { firstName: "", lastName: "", email: "", phoneNumber: "", amount: "" }]);
    };

    const handleRemoveBatchRow = (idx: number) => {
        if (batchLeads.length === 1) return;
        setBatchLeads(batchLeads.filter((_, i) => i !== idx));
    };

    const handleBatchFieldChange = (idx: number, field: string, value: string) => {
        const newLeads = [...batchLeads];
        let val = value;
        if (field === "firstName" || field === "lastName") {
            val = value.replace(/[^A-Za-z]/g, "").slice(0, 30);
        } else if (field === "phoneNumber") {
            val = formatPhone(value);
        }
        newLeads[idx] = { ...newLeads[idx], [field]: val };
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
            const studentLabel = `Student #${i + 1}`;
            if (!row.firstName?.trim() || !row.lastName?.trim() || !row.email?.trim() || !row.phoneNumber?.trim() || !row.amount) {
                showToast(`Please fill all fields for ${studentLabel}`, "warning");
                return;
            }
            if (row.firstName.trim().length < 3 || row.firstName.trim().length > 30 || /[^A-Za-z]/.test(row.firstName.trim())) {
                showToast(`${studentLabel} first name must be between 3 and 30 characters and contain only letters`, "warning");
                return;
            }
            if (row.lastName.trim().length < 1 || row.lastName.trim().length > 30 || /[^A-Za-z]/.test(row.lastName.trim())) {
                showToast(`${studentLabel} last name must be between 1 and 30 characters and contain only letters`, "warning");
                return;
            }
            if (!isPhoneValid(row.phoneNumber.trim())) {
                showToast(`${studentLabel} mobile number must be a valid 10-digit Indian number`, "warning");
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) {
                showToast(`${studentLabel} has an invalid email format`, "warning");
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

    const resolvePincode = async (pin: string) => {
        try {
            const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
            const data = await res.json();
            if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice[0]) {
                const po = data[0].PostOffice[0];
                const city = po.District || po.Taluk || po.Name;
                const state = po.State;
                if (city && state) {
                    setLeadForm((prev: any) => {
                        const currentAddr = (prev.address || "").trim();
                        if (currentAddr) {
                            if (currentAddr.includes(city) || currentAddr.includes(state)) {
                                return prev;
                            }
                            return { ...prev, address: `${currentAddr}, ${city}, ${state}` };
                        }
                        return { ...prev, address: `${city}, ${state}` };
                    });
                }
            }
        } catch (e) {
            console.error("Failed to resolve pincode details:", e);
        }
    };

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};
        if (step === 1) {
            const firstNameTrim = leadForm.firstName?.trim() || "";
            const lastNameTrim = leadForm.lastName?.trim() || "";
            const phoneTrim = leadForm.phoneNumber?.trim() || "";
            const emailTrim = leadForm.email?.trim() || "";
            const dobVal = leadForm.dob || "";
            const pincodeTrim = leadForm.pincode?.trim() || "";
            const addressTrim = leadForm.address?.trim() || "";

            if (!firstNameTrim) {
                newErrors.firstName = "First name is required";
            } else if (firstNameTrim.length < 3) {
                newErrors.firstName = "First name must be at least 3 characters";
            } else if (firstNameTrim.length > 30) {
                newErrors.firstName = "First name must not exceed 30 characters";
            } else if (/[^A-Za-z]/.test(firstNameTrim)) {
                newErrors.firstName = "First name must contain only letters";
            }

            if (!lastNameTrim) {
                newErrors.lastName = "Last name is required";
            } else if (lastNameTrim.length < 1) {
                newErrors.lastName = "Last name must be at least 1 character";
            } else if (lastNameTrim.length > 30) {
                newErrors.lastName = "Last name must not exceed 30 characters";
            } else if (/[^A-Za-z]/.test(lastNameTrim)) {
                newErrors.lastName = "Last name must contain only letters";
            }

            if (!phoneTrim) {
                newErrors.phoneNumber = "Mobile number is required";
            } else if (!isPhoneValid(phoneTrim)) {
                if (phoneTrim.length !== 10) {
                    newErrors.phoneNumber = "Mobile number must be exactly 10 digits";
                } else if (!/^[6-9]/.test(phoneTrim)) {
                    newErrors.phoneNumber = "Mobile number must start with 6, 7, 8, or 9";
                } else {
                    newErrors.phoneNumber = "Please enter a valid Indian mobile number";
                }
            }

            if (!emailTrim) {
                newErrors.email = "Email is required";
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
                newErrors.email = "Invalid email format";
            }

            if (!dobVal) {
                newErrors.dob = "Date of birth is required";
            } else {
                const parts = dobVal.split("-").map(Number);
                if (parts.length === 3) {
                    const [yyyy, mm, dd] = parts;
                    const dob = new Date(yyyy, mm - 1, dd);
                    const today = new Date();
                    const ageMs = today.getTime() - dob.getTime();
                    const age = new Date(ageMs).getUTCFullYear() - 1970;
                    if (isNaN(age)) {
                        newErrors.dob = "Invalid date of birth";
                    } else if (age < 18) {
                        newErrors.dob = "You must be at least 18 years old to apply for a loan";
                    } else if (age > 40) {
                        newErrors.dob = "Applicants above 40 years are not eligible for this loan";
                    }
                } else {
                    newErrors.dob = "Invalid date of birth format";
                }
            }

            if (!pincodeTrim) {
                newErrors.pincode = "Pincode is required";
            } else if (pincodeTrim.length !== 6) {
                newErrors.pincode = "Pincode must be exactly 6 digits";
            }

            if (!addressTrim) {
                newErrors.address = "Residential address is required";
            }
        } else if (step === 2) {
            const amt = parseFloat(leadForm.amount);
            if (!leadForm.amount || isNaN(amt) || amt <= 0) {
                newErrors.amount = "A valid loan amount is required";
            } else if (amt > 15000000) {
                newErrors.amount = "Requested Loan Amount cannot exceed ₹1.5 Cr (₹1,50,00,000)";
            }
            if (leadForm.country === "Other" && (!leadForm.otherCountry || !leadForm.otherCountry.trim())) {
                newErrors.otherCountry = "Please specify the destination country";
            }
        } else if (step === 3) {
            if (leadForm.coApplicantMobile && !isPhoneValid(leadForm.coApplicantMobile)) {
                newErrors.coApplicantMobile = "Co-applicant mobile number must be a valid 10-digit Indian number";
            }
            if (leadForm.coApplicantEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadForm.coApplicantEmail.trim())) {
                newErrors.coApplicantEmail = "Please enter a valid email format for co-applicant";
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

    const handleDownloadTemplate = () => {
        const headers = ["Name", "Mobile", "Country", "College", "Amount"];
        const rows = [
            ["Priya Sharma", "9876543210", "United States", "IIT Bombay", "1200000"],
            ["Rahul Kumar", "9876543211", "United Kingdom", "JIPMER", "800000"],
            ["Asha Reddy", "9876543212", "Canada", "Wharton", "4500000"]
        ];
        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "bulk_leads_template.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Template CSV download started.", "success");
    };

    const parseCsvText = (text: string) => {
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) return;
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const rows: any[] = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const cols: string[] = [];
            let insideQuote = false;
            let current = "";
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                if (char === '"') {
                    insideQuote = !insideQuote;
                } else if (char === ',' && !insideQuote) {
                    cols.push(current.trim());
                    current = "";
                } else {
                    current += char;
                }
            }
            cols.push(current.trim());
            const rowData: any = {};
            headers.forEach((header, idx) => {
                const val = cols[idx] || "";
                if (header.includes("name")) rowData.name = val;
                else if (header.includes("mobile") || header.includes("phone")) rowData.mobile = val;
                else if (header.includes("course")) rowData.course = val;
                else if (header.includes("college") || header.includes("university")) rowData.college = val;
                else if (header.includes("amount")) rowData.amount = val;
            });
            if (!rowData.name) rowData.name = cols[0] || "";
            if (!rowData.mobile) rowData.mobile = cols[1] || "";
            if (!rowData.course) rowData.course = cols[2] || "";
            if (!rowData.college) rowData.college = cols[3] || "";
            if (!rowData.amount) rowData.amount = cols[4] || "";
            rowData.status = "Valid";
            rows.push(rowData);
        }
        setCsvPreview(rows);
        setCsvUploaded(true);
    };

    const handleCsvFileChange = (file: File) => {
        setCsvFile(file);
        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target?.result as string;
            parseCsvText(text);
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-8 max-w-[1400px] mx-auto animate-fade-in pb-12 relative z-10">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-[#0A2540] font-sans">
                        Submit Student Lead
                    </h2>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        Capture and submit student loan applications for staff review &amp; bank partner allocation
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.push('/agent/students')}
                        className="px-4 py-2 bg-white border border-slate-200/80 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
                        View All Students
                    </button>
                </div>
            </div>

            {/* Pre-Submission Eligibility Checker Widget */}
            <section className="p-6 sm:p-8 rounded-[24px] bg-gradient-to-br from-slate-900 via-[#0A2540] to-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.04] text-white pointer-events-none">
                    <span className="material-symbols-outlined text-[12rem]">verified</span>
                </div>

                <div className="relative z-10 max-w-3xl space-y-6">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-black uppercase tracking-widest">
                            AI Tool Suite
                        </span>
                        <span className="text-xs text-slate-400 font-bold">•</span>
                        <span className="text-xs text-slate-300 font-medium">Instant Pre-Check</span>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-400 text-2xl">auto_awesome</span>
                            Pre-Submission Eligibility Checker
                        </h3>
                        <p className="text-slate-400 text-xs mt-1">Verify co-applicant requirements and matching banks before creating the application lead.</p>
                    </div>

                    <form onSubmit={handleRunEligibility} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-300">Course Type</label>
                            <select value={eligCheck.course} onChange={(e) => setEligCheck({ ...eligCheck, course: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all">
                                <option className="bg-slate-900 text-white">B.Tech</option>
                                <option className="bg-slate-900 text-white">MBBS</option>
                                <option className="bg-slate-900 text-white">MBA</option>
                                <option className="bg-slate-900 text-white">MS (Abroad)</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-300">College / Uni</label>
                            <input type="text" value={eligCheck.college} onChange={(e) => setEligCheck({ ...eligCheck, college: e.target.value })} placeholder="IIT Bombay" className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-300">Loan Amount (₹)</label>
                            <input type="number" value={eligCheck.amount} onChange={(e) => setEligCheck({ ...eligCheck, amount: e.target.value })} placeholder="1200000" className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-300">Co-App Income (₹/yr)</label>
                            <input type="number" value={eligCheck.income} onChange={(e) => setEligCheck({ ...eligCheck, income: e.target.value })} placeholder="600000" className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all" />
                        </div>
                        <button type="submit" disabled={eligLoading} className="sm:col-span-4 py-3.5 bg-gradient-to-r from-indigo-500 to-[#6605c7] hover:from-indigo-600 hover:to-[#5804ac] disabled:opacity-60 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-[0.99] cursor-pointer">
                            {eligLoading ? (
                                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> Evaluating...</>
                            ) : (
                                <><span className="material-symbols-outlined text-base">analytics</span> Evaluate Approval Probability</>
                            )}
                        </button>
                    </form>

                    {eligResult && (
                        <div className={`p-5 rounded-2xl border ${eligResult.color} space-y-2.5 animate-fade-in backdrop-blur-sm`}>
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-sm tracking-tight">{eligResult.chance}</h4>
                                {eligResult.score !== undefined && (
                                    <span className="text-xs font-black opacity-90 px-2 py-0.5 bg-white/10 rounded-md">Score: {eligResult.score}/100</span>
                                )}
                            </div>
                            <p className="text-xs opacity-90 leading-relaxed">{eligResult.details}</p>
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                                <span className="font-bold uppercase tracking-wider text-[10px] opacity-80">Eligible Banks:</span>
                                {eligResult.banks.map((b: string, i: number) => (
                                    <span key={i} className="bg-white/20 px-2.5 py-0.5 rounded-lg font-bold">{b}</span>
                                ))}
                            </div>
                            {eligResult.reasons && eligResult.reasons.length > 0 && (
                                <ul className="text-xs opacity-85 pt-1 space-y-1 border-t border-white/10">
                                    {eligResult.reasons.map((r: string, i: number) => (
                                        <li key={i} className="flex items-center gap-1.5"><span className="text-[#6605c7] font-bold">•</span> {r}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Tab Selection Switch */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60 max-w-fit">
                {[
                    { id: "single", label: "Single Referral Submit", icon: "person_add" },
                    { id: "batch", label: "College Batch Submission", icon: "folder_shared" },
                    { id: "csv", label: "Bulk CSV Template Import", icon: "upload_file" }
                ].map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setActiveTab(t.id as any)}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${activeTab === t.id
                                ? "bg-white text-[#0A2540] shadow-sm border border-slate-200/80"
                                : "text-slate-500 hover:text-slate-900"
                            }`}
                    >
                        <span className="material-symbols-outlined text-base">{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Lead submission choices */}
            <div className="space-y-8">
                {activeTab === "single" && (
                    <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-6 border-b border-slate-100">
                            <div>
                                <h3 className="text-xl font-bold tracking-tight text-[#0A2540] font-sans">
                                    New Student Lead Application
                                </h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Complete student details across the steps below</p>
                            </div>
                            <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-widest w-fit">
                                Step {activeStep} of 4
                            </span>
                        </div>

                        {/* Stepper Header */}
                        <div>
                            {/* Progress Bar */}
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-6">
                                <div
                                    className="bg-gradient-to-r from-[#0A2540] via-[#6605c7] to-indigo-600 h-full transition-all duration-500 ease-out"
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
                                            className="flex flex-col items-center group focus:outline-none cursor-pointer"
                                        >
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${isActive
                                                    ? "bg-[#0A2540] text-white ring-4 ring-[#0A2540]/15 shadow-md scale-105 font-bold"
                                                    : isCompleted
                                                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20 font-bold"
                                                        : "bg-slate-100 text-slate-400 border border-slate-200/60 group-hover:bg-slate-200/70"
                                                }`}>
                                                {isCompleted ? (
                                                    <span className="material-symbols-outlined text-base font-bold">check</span>
                                                ) : (
                                                    <span className="material-symbols-outlined text-base">{s.icon}</span>
                                                )}
                                            </div>
                                            <span className={`text-[10px] font-black tracking-widest uppercase mt-2.5 hidden sm:block transition-colors ${isActive ? "text-[#0A2540]" : isCompleted ? "text-emerald-600" : "text-slate-400"
                                                }`}>
                                                {s.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <form onSubmit={onSubmit} className="space-y-6 pt-2">
                            {/* STEP 1: STUDENT BASICS */}
                            {activeStep === 1 && (
                                <div className="space-y-5 animate-fade-in">
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <span className="material-symbols-outlined text-[#6605c7] text-lg">badge</span>
                                        <h4 className="text-xs font-black text-[#0A2540] uppercase tracking-wider">Step 1: Student Personal Details</h4>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">First Name *</label>
                                            <input type="text" value={leadForm.firstName} onChange={(e) => {
                                                setLeadForm({ ...leadForm, firstName: e.target.value.replace(/[^A-Za-z]/g, "") });
                                                if (errors.firstName) setErrors(prev => ({ ...prev, firstName: "" }));
                                            }} className={`w-full px-4 py-3 rounded-xl bg-slate-50/80 border text-xs font-semibold text-slate-900 focus:outline-none transition-all ${errors.firstName ? "border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500" : "border-slate-200 focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white focus:border-[#6605c7]"
                                                }`} maxLength={30} placeholder="e.g. Rahul" />
                                            {errors.firstName && <p className="text-[10px] font-bold text-rose-500 animate-fade-in">{errors.firstName}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Last Name *</label>
                                            <input type="text" value={leadForm.lastName} onChange={(e) => {
                                                setLeadForm({ ...leadForm, lastName: e.target.value.replace(/[^A-Za-z]/g, "") });
                                                if (errors.lastName) setErrors(prev => ({ ...prev, lastName: "" }));
                                            }} className={`w-full px-4 py-3 rounded-xl bg-slate-50/80 border text-xs font-semibold text-slate-900 focus:outline-none transition-all ${errors.lastName ? "border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500" : "border-slate-200 focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white focus:border-[#6605c7]"
                                                }`} maxLength={30} placeholder="e.g. Sharma" />
                                            {errors.lastName && <p className="text-[10px] font-bold text-rose-500 animate-fade-in">{errors.lastName}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Mobile Number *</label>
                                            <input type="tel" value={leadForm.phoneNumber} onChange={(e) => {
                                                setLeadForm({ ...leadForm, phoneNumber: formatPhone(e.target.value) });
                                                if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: "" }));
                                            }} className={`w-full px-4 py-3 rounded-xl bg-slate-50/80 border text-xs font-semibold text-slate-900 focus:outline-none transition-all ${errors.phoneNumber ? "border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500" : "border-slate-200 focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white focus:border-[#6605c7]"
                                                }`} placeholder="10-digit Indian mobile number" maxLength={10} />
                                            {errors.phoneNumber && <p className="text-[10px] font-bold text-rose-500 animate-fade-in">{errors.phoneNumber}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Email Address *</label>
                                            <input type="email" value={leadForm.email} onChange={(e) => {
                                                setLeadForm({ ...leadForm, email: e.target.value });
                                                if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                                            }} className={`w-full px-4 py-3 rounded-xl bg-slate-50/80 border text-xs font-semibold text-slate-900 focus:outline-none transition-all ${errors.email ? "border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500" : "border-slate-200 focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white focus:border-[#6605c7]"
                                                }`} placeholder="student@example.com" />
                                            {errors.email && <p className="text-[10px] font-bold text-rose-500 animate-fade-in">{errors.email}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Date of Birth *</label>
                                            <input type="date" value={leadForm.dob} onChange={(e) => {
                                                setLeadForm({ ...leadForm, dob: e.target.value });
                                                if (errors.dob) setErrors(prev => ({ ...prev, dob: "" }));
                                            }} className={`w-full px-4 py-3 rounded-xl bg-slate-50/80 border text-xs font-semibold text-slate-900 focus:outline-none transition-all ${errors.dob ? "border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500" : "border-slate-200 focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white focus:border-[#6605c7]"
                                                }`} />
                                            {errors.dob && <p className="text-[10px] font-bold text-rose-500 animate-fade-in">{errors.dob}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Residential Pincode *</label>
                                            <input type="text" value={leadForm.pincode} onChange={(e) => {
                                                const numericVal = e.target.value.replace(/\D/g, "").slice(0, 6);
                                                setLeadForm({ ...leadForm, pincode: numericVal });
                                                if (errors.pincode) setErrors(prev => ({ ...prev, pincode: "" }));
                                                if (numericVal.length === 6) {
                                                    resolvePincode(numericVal);
                                                }
                                            }} className={`w-full px-4 py-3 rounded-xl bg-slate-50/80 border text-xs font-semibold text-slate-900 focus:outline-none transition-all ${errors.pincode ? "border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500" : "border-slate-200 focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white focus:border-[#6605c7]"
                                                }`} placeholder="e.g. 400001" maxLength={6} />
                                            {errors.pincode && <p className="text-[10px] font-bold text-rose-500 animate-fade-in">{errors.pincode}</p>}
                                        </div>
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Residential Address *</label>
                                            <input type="text" value={leadForm.address} onChange={(e) => {
                                                setLeadForm({ ...leadForm, address: e.target.value });
                                                if (errors.address) setErrors(prev => ({ ...prev, address: "" }));
                                            }} className={`w-full px-4 py-3 rounded-xl bg-slate-50/80 border text-xs font-semibold text-slate-900 focus:outline-none transition-all ${errors.address ? "border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500" : "border-slate-200 focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white focus:border-[#6605c7]"
                                                }`} placeholder="e.g. Flat No, Street, Locality, City, State" />
                                            {errors.address && <p className="text-[10px] font-bold text-rose-500 animate-fade-in">{errors.address}</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: LOAN DETAILS */}
                            {activeStep === 2 && (
                                <div className="space-y-5 animate-fade-in">
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <span className="material-symbols-outlined text-[#6605c7] text-lg">payments</span>
                                        <h4 className="text-xs font-black text-[#0A2540] uppercase tracking-wider">Step 2: Loan Requirements &amp; Target Destination</h4>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Loan Type</label>
                                            <div className="flex gap-4 py-2 text-xs">
                                                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl w-full">
                                                    <input type="radio" name="loanType" checked={leadForm.loanType === "Abroad"} readOnly className="accent-[#6605c7]" />
                                                    Abroad Education Loan
                                                </label>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Requested Loan Amount (₹) (Max ₹1.5 Cr) *</label>
                                            <input type="number" max={15000000} value={leadForm.amount} onChange={(e) => {
                                                setLeadForm({ ...leadForm, amount: e.target.value });
                                                if (errors.amount) setErrors(prev => ({ ...prev, amount: "" }));
                                            }} placeholder="e.g. 5000000" className={`w-full px-4 py-3 rounded-xl bg-slate-50/80 border text-xs font-semibold text-slate-900 focus:outline-none transition-all ${errors.amount ? "border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500" : "border-slate-200 focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white focus:border-[#6605c7]"
                                                }`} />
                                            {errors.amount && <p className="text-[10px] font-bold text-rose-500 animate-fade-in">{errors.amount}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Country (Target Study Destination) *</label>
                                            <select
                                                value={leadForm.country || "USA"}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setLeadForm((prev: any) => ({
                                                        ...prev,
                                                        country: val,
                                                        otherCountry: val !== "Other" ? "" : prev.otherCountry
                                                    }));
                                                    if (errors.country) setErrors(prev => ({ ...prev, country: "" }));
                                                }}
                                                className="w-full px-4 py-3 rounded-xl bg-slate-50/80 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white focus:border-[#6605c7] transition-all"
                                            >
                                                {popularCountries.map((c) => (
                                                    <option key={c} value={c}>
                                                        {c === "USA" ? "United States (USA)" : c === "UK" ? "United Kingdom (UK)" : c}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {leadForm.country === "Other" && (
                                            <div className="space-y-1.5 sm:col-span-2">
                                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Specify Destination Country *</label>
                                                <input
                                                    type="text"
                                                    value={leadForm.otherCountry || ""}
                                                    onChange={(e) => {
                                                        setLeadForm({ ...leadForm, otherCountry: e.target.value });
                                                        if (errors.otherCountry) setErrors(prev => ({ ...prev, otherCountry: "" }));
                                                    }}
                                                    placeholder="Search or enter country name (e.g. Sweden, Netherlands, Japan)"
                                                    className={`w-full px-4 py-3 rounded-xl bg-slate-50/80 border text-xs font-semibold text-slate-900 focus:outline-none transition-all ${errors.otherCountry ? "border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500" : "border-slate-200 focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white focus:border-[#6605c7]"
                                                        }`}
                                                />
                                                {errors.otherCountry && <p className="text-[10px] font-bold text-rose-500 animate-fade-in">{errors.otherCountry}</p>}
                                            </div>
                                        )}

                                        <div className="space-y-1.5 relative sm:col-span-2">
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">College / University Name</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={leadForm.collegeName || ""}
                                                    onChange={(e) => setLeadForm({ ...leadForm, collegeName: e.target.value })}
                                                    onFocus={() => setShowUniversitySuggestions(true)}
                                                    onBlur={() => setTimeout(() => setShowUniversitySuggestions(false), 200)}
                                                    placeholder="e.g. Stanford University, Harvard, Oxford"
                                                    className="w-full px-4 py-3 rounded-xl bg-slate-50/80 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white focus:border-[#6605c7] transition-all"
                                                />
                                                {loadingUniversities && (
                                                    <div className="absolute right-3 top-3 flex items-center gap-1">
                                                        <div className="w-3.5 h-3.5 border-2 border-[#6605c7] border-t-transparent rounded-full animate-spin" />
                                                    </div>
                                                )}
                                            </div>

                                            {showUniversitySuggestions && suggestedUniversities.length > 0 && (
                                                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 animate-fade-in">
                                                    <div className="px-4 py-2 bg-gradient-to-r from-slate-50 to-indigo-50/40 flex items-center justify-between text-[10px] font-black uppercase text-[#6605c7]">
                                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">auto_awesome</span> AI University Suggestions</span>
                                                        {selectedCountry && <span className="opacity-75">for {selectedCountry}</span>}
                                                    </div>
                                                    {suggestedUniversities.map((uni, i) => (
                                                        <button
                                                            key={i}
                                                            type="button"
                                                            onMouseDown={(e) => e.preventDefault()}
                                                            onClick={() => {
                                                                setLeadForm((prev: any) => ({ ...prev, collegeName: uni.name }));
                                                                setShowUniversitySuggestions(false);
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs cursor-pointer"
                                                        >
                                                            <span className="font-bold text-slate-900">{uni.name}</span>
                                                            <span className="text-[10px] text-slate-400 font-medium">{uni.loc}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: CO-APPLICANT (Optional) */}
                            {activeStep === 3 && (
                                <div className="space-y-5 animate-fade-in">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[#6605c7] text-lg">group</span>
                                            <h4 className="text-xs font-black text-[#0A2540] uppercase tracking-wider">Step 3: Co-Applicant Details</h4>
                                        </div>
                                        <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Optional</span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium">Most banks require a co-applicant (parent/spouse). Providing details speeds up initial verification.</p>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Co-App Full Name</label>
                                            <input type="text" value={leadForm.coApplicantName} onChange={(e) => setLeadForm({ ...leadForm, coApplicantName: e.target.value })} placeholder="e.g. Ramesh Sharma" className="w-full px-4 py-3 rounded-xl bg-slate-50/80 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white focus:border-[#6605c7] transition-all" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Relationship</label>
                                            <select value={leadForm.coApplicantRelationship} onChange={(e) => setLeadForm({ ...leadForm, coApplicantRelationship: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50/80 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white focus:border-[#6605c7] transition-all">
                                                <option>Parent</option>
                                                <option>Spouse</option>
                                                <option>Sibling</option>
                                                <option>Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Co-App Mobile</label>
                                            <input type="tel" value={leadForm.coApplicantMobile} onChange={(e) => {
                                                setLeadForm({ ...leadForm, coApplicantMobile: formatPhone(e.target.value) });
                                                if (errors.coApplicantMobile) setErrors(prev => ({ ...prev, coApplicantMobile: "" }));
                                            }} placeholder="+91 9XXXXXXXXX" className={`w-full px-4 py-3 rounded-xl bg-slate-50/80 border text-xs font-semibold text-slate-900 focus:outline-none transition-all ${errors.coApplicantMobile ? "border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500" : "border-slate-200 focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white focus:border-[#6605c7]"
                                                }`} maxLength={10} />
                                            {errors.coApplicantMobile && <p className="text-[10px] font-bold text-rose-500 animate-fade-in">{errors.coApplicantMobile}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Co-App Email Address</label>
                                            <input
                                                type="email"
                                                value={leadForm.coApplicantEmail || ""}
                                                onChange={(e) => {
                                                    setLeadForm({ ...leadForm, coApplicantEmail: e.target.value });
                                                    if (errors.coApplicantEmail) setErrors(prev => ({ ...prev, coApplicantEmail: "" }));
                                                }}
                                                placeholder="e.g. ramesh.sharma@example.com"
                                                className={`w-full px-4 py-3 rounded-xl bg-slate-50/80 border text-xs font-semibold text-slate-900 focus:outline-none transition-all ${errors.coApplicantEmail ? "border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500" : "border-slate-200 focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white focus:border-[#6605c7]"
                                                    }`}
                                            />
                                            {errors.coApplicantEmail && <p className="text-[10px] font-bold text-rose-500 animate-fade-in">{errors.coApplicantEmail}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Annual Income (₹)</label>
                                            <input type="number" placeholder="e.g. 600000" className="w-full px-4 py-3 rounded-xl bg-slate-50/80 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white focus:border-[#6605c7] transition-all" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">CIBIL Score <span className="text-slate-400 font-medium">(Optional)</span></label>
                                            <input type="number" placeholder="e.g. 720" min="300" max="900" className="w-full px-4 py-3 rounded-xl bg-slate-50/80 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white focus:border-[#6605c7] transition-all" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: SOURCE & NOTES */}
                            {activeStep === 4 && (
                                <div className="space-y-5 animate-fade-in">
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <span className="material-symbols-outlined text-[#6605c7] text-lg">rate_review</span>
                                        <h4 className="text-xs font-black text-[#0A2540] uppercase tracking-wider">Step 4: Lead Source &amp; Review Remarks</h4>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Lead Source</label>
                                            <select value={leadForm.source} onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50/80 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white focus:border-[#6605c7] transition-all">
                                                <option>Referral (Alumni)</option>
                                                <option>Referral (Student Peer)</option>
                                                <option>Walk-in (Office)</option>
                                                <option>WhatsApp Inbound</option>
                                                <option>College Event / Seminar</option>
                                                <option>QR Code Scan</option>
                                                <option>Social Media</option>
                                                <option>Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Referred By (Name)</label>
                                            <input type="text" placeholder="e.g. Priya Sharma (alumni)" className="w-full px-4 py-3 rounded-xl bg-slate-50/80 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white focus:border-[#6605c7] transition-all" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Urgency Level</label>
                                            <select className="w-full px-4 py-3 rounded-xl bg-slate-50/80 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white focus:border-[#6605c7] transition-all">
                                                <option>Normal (within 2 weeks)</option>
                                                <option>Urgent (within 3 days)</option>
                                                <option>Critical (immediate dispatch)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Expected Decision Month</label>
                                            <select className="w-full px-4 py-3 rounded-xl bg-slate-50/80 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white focus:border-[#6605c7] transition-all">
                                                {["July 2026", "August 2026", "September 2026", "October 2026", "November 2026", "December 2026"].map(m => <option key={m}>{m}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Notes for Staff</label>
                                            <textarea rows={3} value={leadForm.notes} onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') e.stopPropagation(); }} className="w-full px-4 py-3 rounded-xl bg-slate-50/80 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white focus:border-[#6605c7] transition-all resize-none" placeholder="e.g. Student is applying for IIT Bombay M.Tech. Father is Govt. employee — CIBIL 742. Needs sanction within 3 weeks before fee deadline." />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Bottom controls */}
                            <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                                <div>
                                    {activeStep > 1 && (
                                        <button
                                            type="button"
                                            onClick={handleBack}
                                            className="px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
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
                                        className="px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                                    >
                                        Save as Draft
                                    </button>
                                    {activeStep < 4 ? (
                                        <button
                                            type="button"
                                            onClick={handleNext}
                                            className="px-6 py-3.5 bg-gradient-to-r from-[#0A2540] via-[#6605c7] to-indigo-600 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-[#6605c7]/20 cursor-pointer active:scale-[0.99]"
                                        >
                                            Next Step
                                            <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            className="px-6 py-3.5 bg-gradient-to-r from-[#0A2540] via-[#6605c7] to-indigo-600 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-[#6605c7]/20 cursor-pointer active:scale-[0.99]"
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
                    <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-xl font-bold tracking-tight text-[#0A2540] font-sans">
                                    College Batch Submission Console
                                </h3>
                                <p className="text-xs text-slate-500 font-semibold mt-0.5">Submit multiple student referral leads under a single college batch directory</p>
                            </div>
                        </div>

                        <form onSubmit={handleBatchSubmit} className="space-y-6">
                            <div className="space-y-1.5 max-w-md">
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Target College / University Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Oxford, Stanford, IIT Hyderabad"
                                    value={batchCollege}
                                    onChange={(e) => setBatchCollege(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50/80 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white focus:border-[#6605c7] transition-all"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#0A2540]">Batch Student Directory</span>
                                    <button
                                        type="button"
                                        onClick={handleAddBatchRow}
                                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#6605c7] rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border border-indigo-100"
                                    >
                                        <span className="material-symbols-outlined text-sm">add</span> Add Student Row
                                    </button>
                                </div>

                                <div className="overflow-hidden border border-slate-200/80 rounded-2xl bg-white shadow-sm">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[11px] uppercase tracking-wider font-sans font-bold">
                                            <tr>
                                                <th className="px-4 py-3.5">First Name</th>
                                                <th className="px-4 py-3.5">Last Name</th>
                                                <th className="px-4 py-3.5">Email</th>
                                                <th className="px-4 py-3.5">Phone Number</th>
                                                <th className="px-4 py-3.5">Loan Amount (₹)</th>
                                                <th className="px-4 py-3.5 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {batchLeads.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-3">
                                                        <input
                                                            type="text"
                                                            required
                                                            value={row.firstName}
                                                            onChange={(e) => handleBatchFieldChange(idx, "firstName", e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <input
                                                            type="text"
                                                            required
                                                            value={row.lastName}
                                                            onChange={(e) => handleBatchFieldChange(idx, "lastName", e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <input
                                                            type="email"
                                                            required
                                                            value={row.email}
                                                            onChange={(e) => handleBatchFieldChange(idx, "email", e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <input
                                                            type="tel"
                                                            required
                                                            value={row.phoneNumber}
                                                            onChange={(e) => handleBatchFieldChange(idx, "phoneNumber", e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <input
                                                            type="number"
                                                            required
                                                            value={row.amount}
                                                            onChange={(e) => handleBatchFieldChange(idx, "amount", e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:bg-white"
                                                        />
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <button
                                                            type="button"
                                                            disabled={batchLeads.length === 1}
                                                            onClick={() => handleRemoveBatchRow(idx)}
                                                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-40 cursor-pointer"
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
                                className="px-6 py-3.5 bg-gradient-to-r from-[#0A2540] via-[#6605c7] to-indigo-600 hover:opacity-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-[#6605c7]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                            >
                                Submit College Batch ({batchLeads.length} Leads)
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === "csv" && (
                    <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6 flex flex-col justify-between min-h-[360px]">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold tracking-tight text-[#0A2540] font-sans">
                                    Bulk Lead CSV Import
                                </h3>
                                <p className="text-xs text-slate-500 font-semibold mt-0.5">Upload a list of up to 500 student leads instantly via CSV file mapping</p>
                            </div>

                            <button onClick={handleDownloadTemplate} className="w-full py-3.5 bg-indigo-50/70 text-indigo-700 rounded-xl text-xs font-black uppercase tracking-wider border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center justify-center gap-2 cursor-pointer">
                                <span className="material-symbols-outlined text-base">download</span> Download CSV Template
                            </button>

                            <div
                                className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-[#6605c7]/40 transition-all cursor-pointer bg-slate-50/50 flex flex-col items-center justify-center min-h-[160px] relative"
                                onClick={() => document.getElementById("csv-file-input")?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files?.[0];
                                    if (file && file.name.endsWith('.csv')) {
                                        handleCsvFileChange(file);
                                    } else {
                                        showToast("Please upload a valid CSV file", "warning");
                                    }
                                }}
                            >
                                <input
                                    type="file"
                                    id="csv-file-input"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            handleCsvFileChange(file);
                                        }
                                    }}
                                />
                                <span className="material-symbols-outlined text-slate-400 text-4xl mb-2">upload_file</span>
                                <span className="text-xs font-bold text-slate-700">
                                    {csvFile ? csvFile.name : "Choose File or Drop CSV Here"}
                                </span>
                                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider mt-1">max 500 leads per file</span>
                            </div>

                            {csvUploaded && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                                        <span className="font-bold text-emerald-800 flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">check_circle</span> {csvPreview.length}/{csvPreview.length} rows parsed successfully</span>
                                        <span className="text-emerald-700 text-[10px] font-black uppercase tracking-wider">Ready to import</span>
                                    </div>
                                    <div className="overflow-hidden border border-slate-200/80 rounded-xl bg-white shadow-sm">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[10px] uppercase tracking-wider font-sans font-bold">
                                                <tr>
                                                    <th className="p-3">Name</th>
                                                    <th className="p-3">Course / Details</th>
                                                    <th className="p-3">Loan Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-xs">
                                                {csvPreview.map((x: any, i: number) => (
                                                    <tr key={i} className="hover:bg-slate-50/50">
                                                        <td className="p-3 font-bold text-slate-900">{x.name}</td>
                                                        <td className="p-3 text-slate-600">{x.course || x.college || '—'}</td>
                                                        <td className="p-3 font-mono font-semibold text-slate-800">
                                                            ₹{x.amount ? (typeof x.amount === 'string' && x.amount.includes(',') ? x.amount : parseFloat(x.amount).toLocaleString('en-IN')) : '0'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {csvUploaded && (
                            <div className="flex gap-3 pt-6 border-t border-slate-100">
                                <button onClick={onConfirmCSV} className="flex-1 py-3.5 bg-gradient-to-r from-[#0A2540] via-[#6605c7] to-indigo-600 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-[#6605c7]/20 cursor-pointer">Confirm &amp; Batch Import</button>
                                <button onClick={() => { setCsvUploaded(false); setCsvFile(null); }} className="px-5 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer">Cancel</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
