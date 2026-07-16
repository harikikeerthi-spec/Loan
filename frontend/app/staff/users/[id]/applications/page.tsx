"use client";

import { useUserDossier } from "../DossierContext";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate, parseUTCDate } from "@/lib/utils";
import { useState, useEffect } from "react";
import { applicationApi } from "@/lib/api";

const banksList = [
    { id: "idfc", name: "IDFC First Bank", rate: "10.5 - 12.5%" },
    { id: "hdfc", name: "HDFC Credila", rate: "10.75 - 12.5%" },
    { id: "auxilo", name: "Auxilo Finserve", rate: "11.25 - 13.5%" },
    { id: "avanse", name: "Avanse Financial", rate: "10.99 - 13.0%" },
    { id: "poonawalla", name: "Poonawalla Fincorp", rate: "11.5 - 14.5%" },
];

const loanTypes = ["Undergraduate Abroad", "Postgraduate Abroad", "Doctoral/PhD Abroad", "Professional Course"];
const courseTypes = ["B.Tech/B.E.", "MBA/PGDM", "MS/M.Tech", "MBBS/Medicine", "Law", "Architecture", "Arts & Humanities", "Other"];
const countries = ["USA", "UK", "Canada", "Australia", "Germany", "Ireland", "New Zealand", "Other"];
const relations = ["Father", "Mother", "Aunt", "Spouse", "Uncle", "Brother", "Other", "None"];

function getFileAge(dateString: string | Date | undefined): string {
    if (!dateString) return "—";
    try {
        const now = new Date();
        const created = parseUTCDate(dateString);
        const diffMs = now.getTime() - created.getTime();
        if (diffMs < 0) return "Just now";

        const diffMins = Math.floor(diffMs / (1000 * 60));
        if (diffMins < 60) return `${diffMins}m ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;

        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    } catch {
        return "—";
    }
}

export default function ApplicationsTab() {
    const { userId, userData, userApplications, refreshData, setRoutingApp, setIsShareModalOpen } = useUserDossier();
    const [isAddAppOpen, setIsAddAppOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const [formData, setFormData] = useState({
        bank: "Any Bank",
        loanType: "Postgraduate Abroad",
        amount: "4000000",
        courseType: "MS/M.Tech",
        country: "USA",
        otherCountry: "",
        university: "",
        annualFee: "",
        livingCost: "",
        coApplicant: "none",
        otherRelation: "",
        income: "",
        collateral: "no",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        address: "",
        pincode: "",
        notes: "",
        admissionStatus: "waiting",
        intakeSeason: "",
    });

    useEffect(() => {
        if (userData && isAddAppOpen) {
            setFormData(prev => ({
                ...prev,
                firstName: userData.firstName || "",
                lastName: userData.lastName || "",
                email: userData.email || "",
                phone: userData.phoneNumber || userData.mobile || userData.phone || "",
                dateOfBirth: userData.dateOfBirth ? (() => { const d = new Date(userData.dateOfBirth); return isNaN(d.getTime()) ? "" : d.toISOString().split('T')[0]; })() : "",
                address: userData.permanentAddress || "",
                pincode: userData.pincode || "",
            }));
        }
    }, [userData, isAddAppOpen]);

    const isBankAlreadyApplied = (bankId: string) => {
        return userApplications.some(app => {
            const appBank = String(app.bank || '').toLowerCase().trim();
            if (bankId === 'hdfc' && (appBank.includes('hdfc') || appBank.includes('credila'))) return true;
            if (bankId === 'idfc' && appBank.includes('idfc')) return true;
            if (bankId === 'auxilo' && appBank.includes('auxilo')) return true;
            if (bankId === 'avanse' && appBank.includes('avanse')) return true;
            if (bankId === 'poonawalla' && appBank.includes('poonawalla')) return true;
            return false;
        });
    };

    const handleAddApplication = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError("");

        if (formData.bank !== "Any Bank" && isBankAlreadyApplied(formData.bank)) {
            const selectedBankName = banksList.find(b => b.id === formData.bank)?.name || formData.bank;
            setSubmitError(`This student already has an active application with ${selectedBankName}. Direct duplicates are not allowed.`);
            return;
        }

        setSubmitting(true);

        try {
            const bankName = banksList.find(b => b.id === formData.bank)?.name || formData.bank;
            const rel = formData.coApplicant === "other" ? formData.otherRelation : formData.coApplicant;
            const capitalizedRelation = rel ? rel.charAt(0).toUpperCase() + rel.slice(1) : "";

            const payload = {
                ...formData,
                hasCoApplicant: !!formData.coApplicant && formData.coApplicant !== "none",
                coApplicantName: capitalizedRelation || null,
                coApplicantRelation: rel || null,
                coApplicantIncome: formData.income ? parseFloat(formData.income) : undefined,
                coApplicant: rel || null,
                country: formData.country === "Other" ? formData.otherCountry : formData.country,
                userId,
                bank: bankName,
                amount: parseFloat(formData.amount) || 0,
                annualFee: formData.annualFee ? parseFloat(formData.annualFee) : undefined,
                livingCost: formData.livingCost ? parseFloat(formData.livingCost) : undefined,
                income: formData.income ? parseFloat(formData.income) : undefined,
                status: "pending",
            };

            await applicationApi.create(payload);
            await refreshData();
            setIsAddAppOpen(false);

            // Reset state
            setFormData({
                bank: "Any Bank",
                loanType: "Postgraduate Abroad",
                amount: "4000000",
                courseType: "MS/M.Tech",
                country: "USA",
                otherCountry: "",
                university: "",
                annualFee: "",
                livingCost: "",
                coApplicant: "none",
                otherRelation: "",
                income: "",
                collateral: "no",
                firstName: userData?.firstName || "",
                lastName: userData?.lastName || "",
                email: userData?.email || "",
                phone: userData?.phoneNumber || userData?.mobile || userData?.phone || "",
                dateOfBirth: userData?.dateOfBirth ? (() => { const d = new Date(userData.dateOfBirth); return isNaN(d.getTime()) ? "" : d.toISOString().split('T')[0]; })() : "",
                address: userData?.permanentAddress || "",
                pincode: userData?.pincode || "",
                notes: "",
                admissionStatus: "waiting",
                intakeSeason: "",
            });
            alert("Loan application added successfully!");
        } catch (err: any) {
            console.error("Failed to add application:", err);
            setSubmitError(err.message || "Failed to create application");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
        >
            {/* Header / Actions Card */}
            <div className="flex justify-between items-center bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/60">
                <div>
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400">Bank Applications</h3>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{userApplications.length} active loan channels</p>
                </div>
                <button
                    onClick={() => setIsAddAppOpen(true)}
                    className="px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-[#FFFFFF] text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:shadow-[#0F766E]/20 flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    Add Loan Application
                </button>
            </div>

            {/* Applications Table Card */}
            <div className="bg-white/60 border border-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
                {userApplications.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-white/20">
                                    {["Application ID", "LAN Number", "Bank Node", "Loan Program", "Status", "File Age", "Timestamp"].map((header, idx) => (
                                        <th key={idx} className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400">{header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {userApplications.map((app, idx) => {
                                    const statusStyle = app.status === "approved"
                                        ? "bg-emerald-500/8 text-emerald-600 border-emerald-500/20"
                                        : app.status === "rejected"
                                            ? "bg-rose-500/8 text-rose-600 border-rose-500/20"
                                            : app.status === "processing"
                                                ? "bg-indigo-500/8 text-indigo-600 border-indigo-500/20"
                                                : "bg-amber-500/8 text-amber-600 border-amber-500/20";

                                    return (
                                        <tr key={idx} className="hover:bg-white/30 transition-colors duration-200">
                                            <td className="px-6 py-4 text-xs font-mono font-bold text-[#6605c7]" title={app.id}>
                                                {(app.applicationNumber && (app.applicationNumber.startsWith('VTU-APP-') || app.applicationNumber.startsWith('VTU-BNK-') || app.applicationNumber.startsWith('VL-APP-'))) ? (
                                                    app.applicationNumber
                                                ) : (
                                                    ""
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-mono font-semibold text-slate-800">
                                                {app.lanNumber ? (
                                                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                                                        {app.lanNumber}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 font-semibold italic">PENDING</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-semibold text-gray-700">
                                                {(!app.bank || app.bank === "Any Bank" || app.bank === "—" || app.bank === "Pending Partner") ? (
                                                    <button
                                                        onClick={() => {
                                                            setRoutingApp(app);
                                                            setIsShareModalOpen(true);
                                                        }}
                                                        className="px-3 py-1.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-[#FFFFFF] text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md hover:shadow-[#0F766E]/20 active:scale-95 cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">account_balance</span>
                                                        Apply to Bank
                                                    </button>
                                                ) : (
                                                    <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                                                        <span className="material-symbols-outlined text-[16px] text-emerald-500">check_circle</span>
                                                        {app.bank}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-semibold text-gray-700">{app.loanType || "—"}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${statusStyle}`}>
                                                    <span className={`w-1 h-1 rounded-full ${app.status === "approved" ? "bg-emerald-500 animate-pulse" : app.status === "rejected" ? "bg-rose-500" : app.status === "processing" ? "bg-indigo-500 animate-pulse" : "bg-amber-500 animate-pulse"}`} />
                                                    {app.status || "Pending"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                                                {getFileAge(app.submittedAt || app.date)}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                                                {app.submittedToBankAt ? formatDate(app.submittedToBankAt, "MMM d, yyyy, h:mm a") : "—"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-3">description</span>
                        <p className="text-sm font-semibold text-gray-500">No applications initiated yet</p>
                    </div>
                )}
            </div>

            {/* Add Application Form Modal */}
            <AnimatePresence>
                {isAddAppOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden border border-slate-100 flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-855 text-lg">Add New Loan Application</h3>
                                    <p className="text-xs text-slate-400">Initiate a new education loan channel for this student</p>
                                </div>
                                <button
                                    onClick={() => setIsAddAppOpen(false)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            {/* Modal Body / Scrollable Form */}
                            <form onSubmit={handleAddApplication} className="flex-1 overflow-y-auto p-6 space-y-6">
                                {submitError && (
                                    <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[16px]">error</span>
                                        {submitError}
                                    </div>
                                )}

                                {/* SECTION 1: LOAN & TARGET BANK */}
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#6605c7] mb-3">1. Loan & Target Bank</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Loan Category *</label>
                                            <select
                                                required
                                                value={formData.loanType}
                                                onChange={e => setFormData(prev => ({ ...prev, loanType: e.target.value }))}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 font-semibold"
                                            >
                                                {loanTypes.map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Requested Amount (INR) *</label>
                                            <input
                                                required
                                                type="number"
                                                placeholder="e.g. 4000000"
                                                value={formData.amount}
                                                onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 2: ACADEMIC DETAILS */}
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#6605c7] mb-3">2. Academic Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Destination Country *</label>
                                            <select
                                                required
                                                value={formData.country}
                                                onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 font-semibold"
                                            >
                                                {countries.map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {formData.country === "Other" && (
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Specify Country Name *</label>
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="Country"
                                                    value={formData.otherCountry}
                                                    onChange={e => setFormData(prev => ({ ...prev, otherCountry: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 font-semibold"
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">University Name *</label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="e.g. Stanford University"
                                                value={formData.university}
                                                onChange={e => setFormData(prev => ({ ...prev, university: e.target.value }))}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 font-semibold"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Admission Status *</label>
                                            <select
                                                required
                                                value={formData.admissionStatus}
                                                onChange={e => setFormData(prev => ({ ...prev, admissionStatus: e.target.value }))}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 font-semibold"
                                            >
                                                <option value="waiting">Awaiting Admit Card</option>
                                                <option value="conditional">Conditional Offer</option>
                                                <option value="confirmed">Confirmed Admission / Letter Received</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 3: FINANCIAL & CO-APPLICANT DETAILS */}
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#6605c7] mb-3">3. Co-Applicant & Finance details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Co-Applicant Relation *</label>
                                            <select
                                                required
                                                value={formData.coApplicant}
                                                onChange={e => setFormData(prev => ({ ...prev, coApplicant: e.target.value }))}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 font-semibold"
                                            >
                                                {relations.map(r => (
                                                    <option key={r} value={r.toLowerCase()}>{r}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {formData.coApplicant === "other" && (
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Specify Relationship *</label>
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="e.g. Aunt"
                                                    value={formData.otherRelation}
                                                    onChange={e => setFormData(prev => ({ ...prev, otherRelation: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 font-semibold"
                                                />
                                            </div>
                                        )}

                                        {formData.coApplicant !== "none" && (
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Co-Applicant Monthly Income (INR)</label>
                                                <input
                                                    type="number"
                                                    placeholder="e.g. 150000"
                                                    value={formData.income}
                                                    onChange={e => setFormData(prev => ({ ...prev, income: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 font-semibold"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>



                            </form>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
                                <button
                                    type="button"
                                    onClick={() => setIsAddAppOpen(false)}
                                    className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddApplication}
                                    disabled={submitting}
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:scale-100 cursor-pointer"
                                >
                                    {submitting ? (
                                        <>
                                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[15px]">send</span>
                                            Create Application
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
