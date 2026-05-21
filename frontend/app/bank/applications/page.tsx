"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi, bankApi } from "@/lib/api";
import BankFlowPipeline from "@/components/bank/BankFlowPipeline";

// --- Sub Components ---

const DetailRow = ({ label, value, highlight, mono }: any) => (
    <div className="flex justify-between items-center py-4 border-b border-gray-50/50 last:border-0 group">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-gray-600 transition-colors">{label}</span>
        <span className={`text-[11px] font-black ${highlight ? 'text-[#6605c7] italic' : 'text-gray-900'} ${mono ? 'font-mono' : ''}`}>
            {value || '—'}
        </span>
    </div>
);

const DetailSection = ({ icon, title, children, color, delay = 0 }: any) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="space-y-4"
    >
        <div className="flex items-center gap-3 mb-2">
            <div className={`w-9 h-9 rounded-2xl ${color} flex items-center justify-center shadow-sm`}>
                <span className="material-symbols-outlined text-xl">{icon}</span>
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900 italic">{title}</h4>
        </div>
        <div className="glass-card p-6 rounded-[2.5rem] bg-white group hover:bg-[#6605c7]/[0.02] transition-all border-[#6605c7]/5 shadow-sm">
            {children}
        </div>
    </motion.div>
);

const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div className="space-y-2">
        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block">{label}</label>
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    onClick={() => onChange(star)}
                    className={`text-2xl transition-all ${star <= value ? 'text-amber-400' : 'text-gray-200'} hover:text-amber-300`}
                >
                    ★
                </button>
            ))}
        </div>
    </div>
);

// --- Page ---

export default function BankApplications() {
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedApp, setSelectedApp] = useState<any>(null);
    const [interestRate, setInterestRate] = useState("10.25");
    const [tenure, setTenure] = useState("10");
    const [actionLoading, setActionLoading] = useState(false);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    // LAN Entry State
    const [lanNumber, setLanNumber] = useState("");
    const [assignedOfficer, setAssignedOfficer] = useState("");
    const [lanLoading, setLanLoading] = useState(false);
    const [lanSuccess, setLanSuccess] = useState(false);

    // Decision State
    const [decisionType, setDecisionType] = useState("SANCTIONED");
    const [sanctionAmount, setSanctionAmount] = useState("");
    const [roiType, setRoiType] = useState("FIXED");
    const [rejectionReason, setRejectReason] = useState("");
    const [decisionRemarks, setDecisionRemarks] = useState("");
    const [decisionLoading, setDecisionLoading] = useState(false);
    const [decisionSuccess, setDecisionSuccess] = useState(false);

    // Disbursement State
    const [disburseAmount, setDisburseAmount] = useState("");
    const [disburseMode, setDisburseMode] = useState("NEFT");
    const [utrNumber, setUtrNumber] = useState("");
    const [beneficiary, setBeneficiary] = useState("");
    const [disbursedAt, setDisbursedAt] = useState("");
    const [disburseLoading, setDisburseLoading] = useState(false);
    const [disburseSuccess, setDisburseSuccess] = useState(false);

    // Quality Rating State
    const [qualityRating, setQualityRating] = useState({ completeness: 0, accuracy: 0, clarity: 0, overall: 0, comments: "" });
    const [qualityLoading, setQualityLoading] = useState(false);
    const [qualitySuccess, setQualitySuccess] = useState(false);

    // Processing Fee State
    const [feeAmount, setFeeAmount] = useState("");
    const [gstAmount, setGstAmount] = useState("");
    const [paymentMode, setPaymentMode] = useState("ONLINE");
    const [feeLoading, setFeeLoading] = useState(false);
    const [feeSuccess, setFeeSuccess] = useState(false);

    // Query State
    const [queries, setQueries] = useState<any[]>([]);
    const [queriesLoading, setQueriesLoading] = useState(false);
    const [queryType, setQueryType] = useState("DOCUMENT");
    const [queryDesc, setQueryDesc] = useState("");
    const [querySubmitLoading, setQuerySubmitLoading] = useState(false);
    const [querySuccess, setQuerySuccess] = useState(false);

    useEffect(() => {
        fetchApplications();
    }, [filterStatus, searchQuery]);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (filterStatus !== "all") params.status = filterStatus;
            if (searchQuery) params.search = searchQuery;
            const res = await adminApi.getApplications(params) as any;
            if (res.success) setApplications(res.data || []);
        } catch (error) {
            console.error("Failed to fetch applications:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchQueries = async (appId: string) => {
        setQueriesLoading(true);
        try {
            const res = await bankApi.getQueries() as any;
            const appQueries = (res.data || []).filter((q: any) => q.applicationId === appId);
            setQueries(appQueries);
        } catch { setQueries([]); } finally { setQueriesLoading(false); }
    };

    const handleSelectApp = (app: any) => {
        setSelectedApp(app);
        setActiveTab("overview");
        setLanSuccess(false); setDecisionSuccess(false); setDisburseSuccess(false);
        setQualitySuccess(false); setFeeSuccess(false); setQuerySuccess(false);
        setLanNumber(app.lanNumber || ""); setAssignedOfficer(app.assignedOfficer || "");
        setDisburseAmount(String(app.sanctionAmount || app.amount || ""));
        setBeneficiary(app.firstName + " " + app.lastName);
        setDisbursedAt(format(new Date(), "yyyy-MM-dd"));
        fetchQueries(app.id);
    };

    const handleLogFile = async () => {
        if (!selectedApp || !lanNumber.trim()) return;
        setLanLoading(true);
        try {
            await bankApi.logFile(selectedApp.id, { lanNumber: lanNumber.trim(), assignedOfficer: assignedOfficer.trim() || undefined });
            setLanSuccess(true);
            setSelectedApp({ ...selectedApp, lanNumber: lanNumber.trim(), assignedOfficer: assignedOfficer.trim() });
        } catch (e) { console.error(e); } finally { setLanLoading(false); }
    };

    const handleCreateDecision = async () => {
        if (!selectedApp) return;
        setDecisionLoading(true);
        try {
            const payload: any = {
                decision: decisionType,
                interestRate: parseFloat(interestRate),
                tenure: parseInt(tenure),
                roiType,
                remarks: decisionRemarks,
            };
            if (decisionType === "SANCTIONED" && sanctionAmount) payload.sanctionAmount = parseFloat(sanctionAmount);
            if (decisionType === "REJECTED") payload.rejectionReason = rejectionReason;
            await bankApi.createDecision(selectedApp.id, payload);
            setDecisionSuccess(true);
            const newStatus = decisionType === "SANCTIONED" ? "approved" : decisionType === "REJECTED" ? "rejected" : "under_bank_review";
            setApplications(applications.map(a => a.id === selectedApp.id ? { ...a, status: newStatus } : a));
            setSelectedApp({ ...selectedApp, status: newStatus });
        } catch (e) { console.error(e); } finally { setDecisionLoading(false); }
    };

    const handleConfirmDisbursement = async () => {
        if (!selectedApp || !disburseAmount || !beneficiary || !disbursedAt) return;
        setDisburseLoading(true);
        try {
            await bankApi.confirmDisbursement(selectedApp.id, {
                trancheNumber: 1, amount: parseFloat(disburseAmount), mode: disburseMode,
                utrNumber: utrNumber || undefined, beneficiary, disbursedAt: new Date(disbursedAt).toISOString(),
            });
            setDisburseSuccess(true);
            setApplications(applications.map(a => a.id === selectedApp.id ? { ...a, status: "disbursed" } : a));
            setSelectedApp({ ...selectedApp, status: "disbursed" });
        } catch (e) { console.error(e); } finally { setDisburseLoading(false); }
    };

    const handleRateQuality = async () => {
        if (!selectedApp) return;
        setQualityLoading(true);
        try {
            await bankApi.rateFileQuality(selectedApp.id, qualityRating);
            setQualitySuccess(true);
        } catch (e) { console.error(e); } finally { setQualityLoading(false); }
    };

    const handleSetFee = async () => {
        if (!selectedApp || !feeAmount) return;
        setFeeLoading(true);
        try {
            const fee = parseFloat(feeAmount);
            const gst = parseFloat(gstAmount || "0");
            await bankApi.setProcessingFee(selectedApp.id, { feeAmount: fee, gstAmount: gst, totalAmount: fee + gst, paymentMode });
            setFeeSuccess(true);
        } catch (e) { console.error(e); } finally { setFeeLoading(false); }
    };

    const handleRaiseQuery = async () => {
        if (!selectedApp || !queryDesc.trim()) return;
        setQuerySubmitLoading(true);
        try {
            await bankApi.raiseQuery(selectedApp.id, { queryType, description: queryDesc.trim() });
            setQuerySuccess(true);
            setQueryDesc("");
            fetchQueries(selectedApp.id);
        } catch (e) { console.error(e); } finally { setQuerySubmitLoading(false); }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        if (!selectedApp) return;
        setActionLoading(true);
        try {
            const res = await adminApi.updateApplication(selectedApp.id, { status: newStatus }) as any;
            if (res.success) {
                setApplications(applications.map(app => app.id === selectedApp.id ? { ...app, status: newStatus } : app));
                setSelectedApp({ ...selectedApp, status: newStatus });
            }
        } catch (error) { console.error(error); } finally { setActionLoading(false); }
    };

    const statusColors: Record<string, string> = {
        pending: "bg-amber-50 text-amber-600 border-amber-100",
        processing: "bg-blue-50 text-blue-600 border-blue-100",
        under_bank_review: "bg-[#6605c7]/10 text-[#6605c7] border-[#6605c7]/20",
        approved: "bg-emerald-50 text-emerald-600 border-emerald-100",
        rejected: "bg-rose-50 text-rose-600 border-rose-100",
        disbursed: "bg-indigo-50 text-indigo-600 border-indigo-100",
    };

    const DRAWER_TABS = ['overview', 'lan', 'decision', 'fee', 'disburse', 'queries', 'quality', 'documents', 'history'];

    return (
        <div className="p-8 lg:p-12 space-y-12 animate-fade-in relative z-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-4">
                <div className="space-y-4">
                    <h2 className="text-5xl font-black font-display text-gray-900 tracking-tighter italic leading-none">
                        Applications <span className="text-[#6605c7]">Matrix</span>
                    </h2>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] flex items-center gap-2 pl-1">
                        <span className="material-symbols-outlined text-xs">database</span>
                        Total Nodes Analyzed: {applications.length}
                    </p>
                </div>

                <div className="flex items-center gap-2 p-1.5 bg-white/50 backdrop-blur-xl rounded-[1.5rem] border border-[#6605c7]/10 shadow-sm overflow-x-auto no-scrollbar max-w-full">
                    {["all", "pending", "processing", "under_bank_review", "approved", "rejected", "disbursed"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === status
                                ? "bg-[#6605c7] text-white shadow-lg shadow-purple-500/20"
                                : "text-gray-400 hover:text-gray-900 hover:bg-[#6605c7]/5"
                            }`}
                        >
                            {status.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative group max-w-2xl">
                <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#6605c7] transition-colors">search</span>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Locate Identity or Protocol Signature..."
                    className="w-full pl-16 pr-8 py-5 bg-white/70 backdrop-blur-xl border border-[#6605c7]/10 rounded-[2rem] text-[11px] font-black focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 focus:border-[#6605c7]/20 shadow-sm uppercase tracking-[0.2em] transition-all placeholder:text-gray-300"
                />
            </div>

            <div className="glass-card rounded-[4rem] border-[#6605c7]/10 bg-white/70 overflow-hidden shadow-2xl shadow-purple-900/[0.02] min-h-[500px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-40 gap-4">
                        <div className="w-16 h-16 border-4 border-[#6605c7]/5 border-t-[#6605c7] rounded-full animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 animate-pulse">Scanning Grid...</span>
                    </div>
                ) : applications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-40 text-center">
                        <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center mb-8">
                            <span className="material-symbols-outlined text-5xl text-gray-200">search_off</span>
                        </div>
                        <h3 className="text-2xl font-black font-display text-gray-400 uppercase italic tracking-tighter">No Signals Located</h3>
                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em] mt-4">Adjust your sync filters or search query parameters.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-[#6605c7]/[0.02] border-b border-gray-100">
                                <tr>
                                    <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]">Audit Node</th>
                                    <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]">Applicant</th>
                                    <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]">Amount</th>
                                    <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]">LAN</th>
                                    <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]">Status</th>
                                    <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-right text-[#6605c7]">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {applications.map((app, i) => (
                                    <tr
                                        key={app.id || i}
                                        onClick={() => handleSelectApp(app)}
                                        className="group hover:bg-[#6605c7]/[0.03] transition-all cursor-pointer"
                                    >
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-[#6605c7]/5 flex items-center justify-center font-black text-[#6605c7] text-[11px] border border-[#6605c7]/10 group-hover:bg-[#6605c7] group-hover:text-white group-hover:rotate-6 transition-all duration-500 shadow-sm">
                                                    {app.firstName?.[0]}{app.lastName?.[0]}
                                                </div>
                                                <span className="font-mono text-[10px] font-black text-gray-400 tracking-tighter uppercase">{app.applicationNumber}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <p className="text-sm font-black text-gray-900 tracking-tight uppercase italic group-hover:text-[#6605c7] transition-colors">{app.firstName} {app.lastName}</p>
                                            <p className="text-[10px] font-bold text-gray-400 tracking-widest mt-1 lowercase">{app.user?.email || app.email}</p>
                                        </td>
                                        <td className="px-10 py-8">
                                            <p className="text-sm font-black text-[#6605c7] italic tracking-tight">₹{app.amount?.toLocaleString()}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{app.bank || app.loanType}</p>
                                        </td>
                                        <td className="px-10 py-8">
                                            {app.lanNumber ? (
                                                <span className="px-3 py-1 rounded-full text-[9px] font-black font-mono bg-emerald-50 text-emerald-600 border border-emerald-100">{app.lanNumber}</span>
                                            ) : (
                                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Unlogged</span>
                                            )}
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${statusColors[app.status] || 'bg-gray-50 text-gray-400'}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
                                                    {(() => { try { return format(new Date(app.date || app.submittedAt || new Date()), 'MMM dd, p'); } catch (e) { return "N/A"; } })()}
                                                </span>
                                                <span className="text-[8px] font-black text-[#6605c7] uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2">
                                                    Open <span className="material-symbols-outlined text-[10px] font-black">arrow_forward</span>
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Applicant Intelligence Drawer */}
            <AnimatePresence>
                {selectedApp && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-md"
                            onClick={() => setSelectedApp(null)}
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 35, stiffness: 300, mass: 1 }}
                            className="fixed right-0 top-0 h-full w-full max-w-2xl z-[120] bg-[#fbfaff] shadow-[0_0_100px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col border-l border-[#6605c7]/10"
                        >
                            {/* Drawer Header */}
                            <div className="p-10 bg-white/80 backdrop-blur-2xl border-b border-[#6605c7]/5 flex items-center justify-between sticky top-0 z-10">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-[#6605c7] to-[#8b24e5] flex items-center justify-center text-white shadow-2xl shadow-purple-500/30">
                                        <span className="material-symbols-outlined text-3xl">psychology_alt</span>
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black font-display text-gray-900 tracking-tighter italic leading-none uppercase">{selectedApp.firstName} {selectedApp.lastName}</h2>
                                        <div className="flex items-center gap-3 mt-3">
                                            <span className={`px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${statusColors[selectedApp.status]}`}>
                                                {selectedApp.status}
                                            </span>
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#6605c7] animate-pulse" />
                                                {selectedApp.applicationNumber}
                                            </span>
                                            {selectedApp.lanNumber && (
                                                <span className="text-[9px] font-black font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                    LAN: {selectedApp.lanNumber}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedApp(null)}
                                    className="w-12 h-12 rounded-2xl bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-all flex items-center justify-center border border-transparent hover:border-rose-100 group"
                                >
                                    <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-500">close</span>
                                </button>
                            </div>

                            {/* Tab Navigation */}
                            <div className="px-10 py-4 bg-white/60 border-b border-gray-100 flex gap-1 overflow-x-auto no-scrollbar">
                                {DRAWER_TABS.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all relative ${activeTab === tab
                                            ? 'bg-[#6605c7] text-white shadow-lg shadow-purple-500/20'
                                            : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Pipeline */}
                            <div className="px-10 py-4 bg-white border-b border-gray-100">
                                <BankFlowPipeline currentStage={selectedApp.stage} status={selectedApp.status} />
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth p-10 space-y-10">

                                {/* ── OVERVIEW TAB ── */}
                                {activeTab === 'overview' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                        <DetailSection icon="fingerprint" title="Applicant Intel" color="bg-blue-50 text-blue-600" delay={0.1}>
                                            <DetailRow label="Email" value={selectedApp.user?.email || selectedApp.email} />
                                            <DetailRow label="Phone" value={selectedApp.mobile || selectedApp.phone} />
                                            <DetailRow label="Loan Amount" value={`₹${selectedApp.amount?.toLocaleString()}`} highlight />
                                            <DetailRow label="Bank / Loan Type" value={selectedApp.bank || selectedApp.loanType} />
                                        </DetailSection>

                                        <DetailSection icon="school" title="Educational Info" color="bg-purple-50 text-purple-600" delay={0.2}>
                                            <DetailRow label="Destination" value={selectedApp.studyDestination || selectedApp.country} />
                                            <DetailRow label="University" value={selectedApp.targetUniversity || selectedApp.university} />
                                            <DetailRow label="Course" value={selectedApp.courseName || selectedApp.course} />
                                        </DetailSection>

                                        {/* EMI Calculator */}
                                        <div className="glass-card rounded-[3rem] bg-white border-[#6605c7]/10 shadow-sm overflow-hidden">
                                            <div className="p-10 space-y-8">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">EMI Calculator</h4>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-end">
                                                        <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Interest Rate</label>
                                                        <span className="text-2xl font-black text-[#6605c7] font-display italic">{interestRate}%</span>
                                                    </div>
                                                    <input type="range" min="8" max="15" step="0.05" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="w-full accent-[#6605c7] h-1.5 rounded-full cursor-pointer" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-3">
                                                        <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 block">Tenure</label>
                                                        <select value={tenure} onChange={(e) => setTenure(e.target.value)} className="w-full bg-gray-50/50 border border-gray-100 p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none appearance-none">
                                                            {['5','7','10','15','20'].map(y => <option key={y} value={y}>{y} Years</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="flex flex-col justify-end">
                                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em]">Estimated EMI</p>
                                                        <p className="text-2xl font-black text-[#6605c7] italic tracking-tighter">
                                                            ₹{Math.round((selectedApp.amount * (parseFloat(interestRate) / 100 / 12) * Math.pow(1 + parseFloat(interestRate) / 100 / 12, parseInt(tenure) * 12)) / (Math.pow(1 + parseFloat(interestRate) / 100 / 12, parseInt(tenure) * 12) - 1)).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ── LAN ENTRY TAB ── */}
                                {activeTab === 'lan' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                                                <span className="material-symbols-outlined text-xl">bookmark_add</span>
                                            </div>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900 italic">File Logging — LAN Entry</h4>
                                        </div>
                                        <div className="glass-card p-8 rounded-[3rem] bg-white border-[#6605c7]/5 shadow-sm space-y-6">
                                            {lanSuccess && (
                                                <div className="px-5 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                                    <span className="material-symbols-outlined text-base">check_circle</span>
                                                    File logged successfully!
                                                </div>
                                            )}
                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block">LAN Number <span className="text-rose-500">*</span></label>
                                                <input
                                                    type="text"
                                                    value={lanNumber}
                                                    onChange={(e) => setLanNumber(e.target.value)}
                                                    placeholder="e.g. SBI/2026/00123"
                                                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-[11px] font-black font-mono tracking-widest focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 uppercase"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block">Assigned Officer</label>
                                                <input
                                                    type="text"
                                                    value={assignedOfficer}
                                                    onChange={(e) => setAssignedOfficer(e.target.value)}
                                                    placeholder="Officer name or ID"
                                                    className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-[11px] font-black tracking-widest focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5"
                                                />
                                            </div>
                                            <button
                                                onClick={handleLogFile}
                                                disabled={lanLoading || !lanNumber.trim()}
                                                className="w-full py-4 rounded-[2rem] bg-[#6605c7] text-white text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-purple-500/20"
                                            >
                                                {lanLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                                <span className="material-symbols-outlined text-base">save</span>
                                                Log File to System
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ── DECISION TAB ── */}
                                {activeTab === 'decision' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-9 h-9 rounded-2xl bg-[#6605c7]/10 text-[#6605c7] flex items-center justify-center shadow-sm">
                                                <span className="material-symbols-outlined text-xl">gavel</span>
                                            </div>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900 italic">Credit Decision</h4>
                                        </div>
                                        <div className="glass-card p-8 rounded-[3rem] bg-white border-[#6605c7]/5 shadow-sm space-y-6">
                                            {decisionSuccess && (
                                                <div className="px-5 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                                    <span className="material-symbols-outlined text-base">check_circle</span>
                                                    Decision recorded successfully!
                                                </div>
                                            )}
                                            {/* Decision Type */}
                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block">Decision Type</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {['SANCTIONED', 'CONDITIONAL', 'COUNTER_OFFER', 'REJECTED'].map(d => (
                                                        <button
                                                            key={d}
                                                            onClick={() => setDecisionType(d)}
                                                            className={`py-3 px-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${decisionType === d
                                                                ? d === 'REJECTED' ? 'bg-rose-600 text-white border-rose-600 shadow-lg' : 'bg-[#6605c7] text-white border-[#6605c7] shadow-lg'
                                                                : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-gray-200'
                                                            }`}
                                                        >
                                                            {d.replace(/_/g, ' ')}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {decisionType === 'SANCTIONED' && (
                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block">Sanction Amount (₹)</label>
                                                    <input
                                                        type="number"
                                                        value={sanctionAmount}
                                                        onChange={(e) => setSanctionAmount(e.target.value)}
                                                        placeholder={String(selectedApp.amount)}
                                                        className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-[11px] font-black tracking-widest focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5"
                                                    />
                                                </div>
                                            )}

                                            {decisionType !== 'REJECTED' && (
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-3">
                                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block">ROI Type</label>
                                                        <select value={roiType} onChange={(e) => setRoiType(e.target.value)} className="w-full bg-gray-50/50 border border-gray-100 p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none appearance-none">
                                                            <option value="FIXED">Fixed</option>
                                                            <option value="FLOATING">Floating</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block">Interest Rate %</label>
                                                        <input type="number" step="0.05" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="w-full px-5 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-[11px] font-black tracking-widest focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5" />
                                                    </div>
                                                </div>
                                            )}

                                            {decisionType === 'REJECTED' && (
                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block">Rejection Reason</label>
                                                    <select value={rejectionReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full bg-gray-50/50 border border-gray-100 p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none appearance-none">
                                                        <option value="">Select reason...</option>
                                                        <option value="LOW_INCOME">Low Income</option>
                                                        <option value="DOCS_INCOMPLETE">Docs Incomplete</option>
                                                        <option value="CREDIT_SCORE">Low Credit Score</option>
                                                        <option value="COLLATERAL">Insufficient Collateral</option>
                                                        <option value="POLICY">Policy Restriction</option>
                                                        <option value="OTHER">Other</option>
                                                    </select>
                                                </div>
                                            )}

                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block">Remarks</label>
                                                <textarea value={decisionRemarks} onChange={(e) => setDecisionRemarks(e.target.value)} rows={3} placeholder="Additional notes for this decision..." className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-[11px] font-black focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 resize-none" />
                                            </div>

                                            <button
                                                onClick={handleCreateDecision}
                                                disabled={decisionLoading || (decisionType === 'REJECTED' && !rejectionReason)}
                                                className={`w-full py-4 rounded-[2rem] text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl ${decisionType === 'REJECTED' ? 'bg-rose-600 shadow-rose-500/20' : 'bg-[#6605c7] shadow-purple-500/20 hover:scale-[1.02] active:scale-95'}`}
                                            >
                                                {decisionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                                <span className="material-symbols-outlined text-base">gavel</span>
                                                Submit {decisionType.replace(/_/g, ' ')} Decision
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ── PROCESSING FEE TAB ── */}
                                {activeTab === 'fee' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
                                                <span className="material-symbols-outlined text-xl">receipt</span>
                                            </div>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900 italic">Processing Fee</h4>
                                        </div>
                                        <div className="glass-card p-8 rounded-[3rem] bg-white border-[#6605c7]/5 shadow-sm space-y-6">
                                            {feeSuccess && (
                                                <div className="px-5 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                                    <span className="material-symbols-outlined text-base">check_circle</span>
                                                    Processing fee set!
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block">Fee Amount (₹)</label>
                                                    <input type="number" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} placeholder="e.g. 5000" className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-[11px] font-black focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5" />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block">GST Amount (₹)</label>
                                                    <input type="number" value={gstAmount} onChange={(e) => setGstAmount(e.target.value)} placeholder="e.g. 900" className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-[11px] font-black focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5" />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block">Payment Mode</label>
                                                <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="w-full bg-gray-50/50 border border-gray-100 p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none appearance-none">
                                                    <option value="ONLINE">Online</option>
                                                    <option value="CHEQUE">Cheque</option>
                                                    <option value="DD">Demand Draft</option>
                                                    <option value="DEDUCTED_FROM_LOAN">Deducted from Loan</option>
                                                </select>
                                            </div>
                                            {feeAmount && (
                                                <div className="p-5 bg-[#6605c7]/5 rounded-2xl border border-[#6605c7]/10 flex justify-between items-center">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Total Amount</span>
                                                    <span className="text-xl font-black text-[#6605c7] italic">₹{(parseFloat(feeAmount || '0') + parseFloat(gstAmount || '0')).toLocaleString()}</span>
                                                </div>
                                            )}
                                            <button onClick={handleSetFee} disabled={feeLoading || !feeAmount} className="w-full py-4 rounded-[2rem] bg-amber-500 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-amber-500/20">
                                                {feeLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                                <span className="material-symbols-outlined text-base">save</span>
                                                Set Processing Fee
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ── DISBURSEMENT TAB ── */}
                                {activeTab === 'disburse' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                                                <span className="material-symbols-outlined text-xl">payments</span>
                                            </div>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900 italic">Confirm Disbursement</h4>
                                        </div>
                                        <div className="glass-card p-8 rounded-[3rem] bg-white border-[#6605c7]/5 shadow-sm space-y-6">
                                            {disburseSuccess && (
                                                <div className="px-5 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                                    <span className="material-symbols-outlined text-base">check_circle</span>
                                                    Disbursement confirmed!
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block">Amount (₹) <span className="text-rose-500">*</span></label>
                                                    <input type="number" value={disburseAmount} onChange={(e) => setDisburseAmount(e.target.value)} className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-[11px] font-black focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5" />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block">Mode</label>
                                                    <select value={disburseMode} onChange={(e) => setDisburseMode(e.target.value)} className="w-full bg-gray-50/50 border border-gray-100 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none appearance-none">
                                                        <option value="NEFT">NEFT</option>
                                                        <option value="RTGS">RTGS</option>
                                                        <option value="DD">Demand Draft</option>
                                                        <option value="IMPS">IMPS</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block">UTR / Reference</label>
                                                    <input type="text" value={utrNumber} onChange={(e) => setUtrNumber(e.target.value)} placeholder="UTR number" className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-[11px] font-black font-mono tracking-widest focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 uppercase" />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block">Disbursement Date</label>
                                                    <input type="date" value={disbursedAt} onChange={(e) => setDisbursedAt(e.target.value)} className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-[11px] font-black focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5" />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block">Beneficiary Name <span className="text-rose-500">*</span></label>
                                                <input type="text" value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-[11px] font-black tracking-widest focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 uppercase" />
                                            </div>
                                            <button
                                                onClick={handleConfirmDisbursement}
                                                disabled={disburseLoading || !disburseAmount || !beneficiary || !disbursedAt}
                                                className="w-full py-4 rounded-[2rem] bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20"
                                            >
                                                {disburseLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                                <span className="material-symbols-outlined text-base">payments</span>
                                                Confirm Disbursement
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ── QUERIES TAB ── */}
                                {activeTab === 'queries' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                                                    <span className="material-symbols-outlined text-xl">help</span>
                                                </div>
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900 italic">Queries</h4>
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{queries.length} total</span>
                                        </div>

                                        {/* Raise Query Form */}
                                        <div className="glass-card p-8 rounded-[3rem] bg-white border-blue-50 shadow-sm space-y-5">
                                            <h5 className="text-[9px] font-black uppercase tracking-widest text-blue-500">Raise New Query</h5>
                                            {querySuccess && (
                                                <div className="px-5 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-base">check_circle</span>
                                                    Query raised!
                                                </div>
                                            )}
                                            <select value={queryType} onChange={(e) => setQueryType(e.target.value)} className="w-full bg-gray-50/50 border border-gray-100 p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none appearance-none">
                                                <option value="DOCUMENT">Document</option>
                                                <option value="INFORMATION">Information</option>
                                                <option value="CLARIFICATION">Clarification</option>
                                            </select>
                                            <textarea value={queryDesc} onChange={(e) => setQueryDesc(e.target.value)} rows={3} placeholder="Describe the query or information needed..." className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-[11px] font-black focus:outline-none focus:ring-4 focus:ring-blue-100 resize-none" />
                                            <button onClick={handleRaiseQuery} disabled={querySubmitLoading || !queryDesc.trim()} className="w-full py-3 rounded-[2rem] bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                                                {querySubmitLoading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                                Raise Query
                                            </button>
                                        </div>

                                        {/* Query List */}
                                        {queriesLoading ? (
                                            <div className="py-10 text-center text-[10px] font-black uppercase tracking-widest text-gray-400 animate-pulse">Loading queries...</div>
                                        ) : queries.length === 0 ? (
                                            <div className="py-16 text-center space-y-4">
                                                <span className="material-symbols-outlined text-5xl text-gray-200">forum</span>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">No queries for this file</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {queries.map((q: any, i: number) => (
                                                    <div key={q.id || i} className="p-6 bg-white rounded-[2rem] border border-gray-100 space-y-3 hover:border-blue-100 transition-all">
                                                        <div className="flex items-center justify-between">
                                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${q.status === 'OPEN' ? 'bg-amber-50 text-amber-600 border-amber-100' : q.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                                {q.status}
                                                            </span>
                                                            <span className="text-[9px] font-black text-gray-400">{q.queryType}</span>
                                                        </div>
                                                        <p className="text-[11px] font-black text-gray-700">{q.description}</p>
                                                        <p className="text-[8px] font-bold text-gray-400">{q.raisedAt ? format(new Date(q.raisedAt), 'MMM dd, yyyy') : 'N/A'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* ── QUALITY RATING TAB ── */}
                                {activeTab === 'quality' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-sm">
                                                <span className="material-symbols-outlined text-xl">star</span>
                                            </div>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900 italic">File Quality Rating</h4>
                                        </div>
                                        <div className="glass-card p-8 rounded-[3rem] bg-white border-[#6605c7]/5 shadow-sm space-y-8">
                                            {qualitySuccess && (
                                                <div className="px-5 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                                    <span className="material-symbols-outlined text-base">check_circle</span>
                                                    Quality rating submitted!
                                                </div>
                                            )}
                                            <StarRating value={qualityRating.completeness} onChange={(v) => setQualityRating({ ...qualityRating, completeness: v })} label="Completeness" />
                                            <StarRating value={qualityRating.accuracy} onChange={(v) => setQualityRating({ ...qualityRating, accuracy: v })} label="Accuracy" />
                                            <StarRating value={qualityRating.clarity} onChange={(v) => setQualityRating({ ...qualityRating, clarity: v })} label="Clarity" />
                                            <StarRating value={qualityRating.overall} onChange={(v) => setQualityRating({ ...qualityRating, overall: v })} label="Overall" />
                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block">Comments (optional)</label>
                                                <textarea value={qualityRating.comments} onChange={(e) => setQualityRating({ ...qualityRating, comments: e.target.value })} rows={3} placeholder="Additional feedback on file quality..." className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-[11px] font-black focus:outline-none focus:ring-4 focus:ring-amber-100 resize-none" />
                                            </div>
                                            <button onClick={handleRateQuality} disabled={qualityLoading || !qualityRating.overall} className="w-full py-4 rounded-[2rem] bg-amber-500 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-amber-500/20">
                                                {qualityLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                                <span className="material-symbols-outlined text-base">star</span>
                                                Submit Rating
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ── DOCUMENTS TAB ── */}
                                {activeTab === 'documents' && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                        <DetailSection icon="description" title="Document Vault" color="bg-emerald-50 text-emerald-600">
                                            {selectedApp.documents?.length > 0 ? (
                                                <div className="grid grid-cols-1 gap-4">
                                                    {selectedApp.documents.map((doc: any, idx: number) => (
                                                        <div key={idx} className="flex justify-between items-center p-6 bg-gray-50/50 rounded-3xl border border-gray-100 group hover:border-[#6605c7]/20 transition-all">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                                                                    <span className="material-symbols-outlined text-[#6605c7]">description</span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">{doc.docType?.replace(/_/g, ' ')}</p>
                                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{doc.docName || 'Document'}</p>
                                                                </div>
                                                            </div>
                                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${doc.status === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : doc.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                                {doc.status || 'pending'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-20 text-center space-y-4">
                                                    <span className="material-symbols-outlined text-gray-200 text-6xl">folder_off</span>
                                                    <p className="text-[11px] font-black text-gray-300 uppercase tracking-[0.3em] italic">No digital assets yet.</p>
                                                </div>
                                            )}
                                        </DetailSection>
                                    </motion.div>
                                )}

                                {/* ── HISTORY TAB ── */}
                                {activeTab === 'history' && (
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                                        <DetailSection icon="history" title="Audit Log" color="bg-gray-100 text-gray-600">
                                            <div className="space-y-8 pl-4 border-l-2 border-gray-50 ml-4">
                                                <div className="relative">
                                                    <div className="absolute -left-[2.1rem] top-0 w-4 h-4 rounded-full bg-[#6605c7] border-4 border-white shadow-sm" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">Application Submitted</p>
                                                    <p className="text-[9px] font-bold text-gray-400 mt-1">{selectedApp.submittedAt ? format(new Date(selectedApp.submittedAt), 'MMM dd, yyyy - p') : 'N/A'}</p>
                                                </div>
                                                {selectedApp.lanNumber && (
                                                    <div className="relative">
                                                        <div className="absolute -left-[2.1rem] top-0 w-4 h-4 rounded-full bg-emerald-400 border-4 border-white shadow-sm" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">File Logged — LAN: {selectedApp.lanNumber}</p>
                                                        <p className="text-[9px] font-bold text-gray-400 mt-1">{selectedApp.lanEnteredAt ? format(new Date(selectedApp.lanEnteredAt), 'MMM dd, yyyy') : 'N/A'}</p>
                                                    </div>
                                                )}
                                                <div className="relative opacity-40">
                                                    <div className="absolute -left-[2.1rem] top-0 w-4 h-4 rounded-full bg-gray-200 border-4 border-white shadow-sm" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Decision Pending...</p>
                                                </div>
                                            </div>
                                        </DetailSection>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
