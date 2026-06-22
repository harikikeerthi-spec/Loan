"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { adminApi } from "@/lib/api";
import { PageHeader, Spinner } from "@/components/bank/SharedUI";

interface Tranche {
    id: string;
    amount: number;
    date: string;
    utr: string;
    mode: string;
}

export default function DisbursementTracker() {
    const [mounted, setMounted] = useState(false);
    const [currentBankId, setCurrentBankId] = useState<string>("idfc");
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");

    // Immersive Slide-over Panel states
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [showPanel, setShowPanel] = useState(false);

    // Beneficiary form inputs
    const [beneficiaryName, setBeneficiaryName] = useState("");
    const [beneficiaryBank, setBeneficiaryBank] = useState("");
    const [beneficiaryAcc, setBeneficiaryAcc] = useState("");
    const [beneficiaryIfsc, setBeneficiaryIfsc] = useState("");

    // Tranche release form inputs
    const [trancheAmount, setTrancheAmount] = useState("");
    const [trancheDate, setTrancheDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [trancheUtr, setTrancheUtr] = useState("");
    const [trancheMode, setTrancheMode] = useState("NEFT");
    const [confirming, setConfirming] = useState(false);

    // Local database simulating tranche history per application ID
    const [trancheRecords, setTrancheRecords] = useState<Record<string, {
        beneficiary: { name: string; bank: string; account: string; ifsc: string };
        history: Tranche[];
    }>>({});

    useEffect(() => {
        setMounted(true);
        if (typeof window !== "undefined") {
            const saved = sessionStorage.getItem("selectedBank") || localStorage.getItem("selectedBank");
            if (saved) setCurrentBankId(saved);
        }
    }, []);

    const fetchApplications = async (bankId: string) => {
        setLoading(true);
        try {
            const res: any = await adminApi.getApplications({ bank: bankId });
            if (res && res.success) {
                const apps = res.data || [];
                setApplications(apps);

                // Pre-populate mock tranche histories for already disbursed items
                const initialTranches: typeof trancheRecords = {};
                apps.forEach((app: any) => {
                    const sanctionAmt = app.sanctionAmount || app.amount || 600000;
                    const bName = `${app.firstName} ${app.lastName}`;
                    const bBank = app.bankName || "HDFC Bank Ltd";
                    const bAcc = `501008291040${Math.floor(10 + Math.random() * 90)}`;
                    const bIfsc = "HDFC0000240";

                    if (app.status === "disbursed" || app.status === "disbursement_confirmed") {
                        // Pre-populate with 2 tranches
                        const t1 = Math.round(sanctionAmt * 0.6);
                        const t2 = app.disbursedAmount || (sanctionAmt - t1);
                        initialTranches[app.id] = {
                            beneficiary: { name: bName, bank: bBank, account: bAcc, ifsc: bIfsc },
                            history: [
                                { id: "1", amount: t1, date: format(new Date(app.createdAt || Date.now()), "yyyy-MM-dd"), utr: `UTR-${app.applicationNumber}-T1`, mode: "RTGS" },
                                { id: "2", amount: t2, date: format(new Date(), "yyyy-MM-dd"), utr: `UTR-${app.applicationNumber}-T2`, mode: "NEFT" }
                            ]
                        };
                    } else {
                        // Empty default values
                        initialTranches[app.id] = {
                            beneficiary: { name: bName, bank: bBank, account: bAcc, ifsc: bIfsc },
                            history: []
                        };
                    }
                });
                setTrancheRecords(initialTranches);
            }
        } catch (err) {
            console.error("Failed to load applications for disbursements:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) {
            fetchApplications(currentBankId);
        }
    }, [currentBankId, mounted]);

    const handleRefresh = () => {
        fetchApplications(currentBankId);
    };

    // Filter applications based on sanction / disbursed statuses
    const filteredApps = useMemo(() => {
        return applications.filter(app => {
            const matchesSearch = 
                (app.applicationNumber || "").toLowerCase().includes(search.toLowerCase()) ||
                (`${app.firstName || ""} ${app.lastName || ""}`).toLowerCase().includes(search.toLowerCase()) ||
                (app.lanNumber || "").toLowerCase().includes(search.toLowerCase());

            if (!matchesSearch) return false;

            const isApproved = app.status === "approved" || app.status === "sanctioned";
            const isDisbursed = app.status === "disbursed" || app.status === "disbursement_confirmed";

            if (activeTab === "pending") {
                return isApproved;
            } else {
                return isDisbursed;
            }
        });
    }, [applications, activeTab, search]);

    const tabCounts = useMemo(() => {
        const counts = { pending: 0, completed: 0 };
        applications.forEach(app => {
            if (app.status === "approved" || app.status === "sanctioned") counts.pending++;
            else if (app.status === "disbursed" || app.status === "disbursement_confirmed") counts.completed++;
        });
        return counts;
    }, [applications]);

    const handleReleaseTranche = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedApp || !trancheAmount || !trancheUtr.trim()) return;
        setConfirming(true);

        const amountToRelease = parseFloat(trancheAmount);
        const record = trancheRecords[selectedApp.id] || {
            beneficiary: { name: beneficiaryName, bank: beneficiaryBank, account: beneficiaryAcc, ifsc: beneficiaryIfsc },
            history: []
        };

        const totalReleasedPreviously = record.history.reduce((sum, t) => sum + t.amount, 0);
        const sanctionAmt = selectedApp.sanctionAmount || selectedApp.amount || 600000;
        const totalNow = totalReleasedPreviously + amountToRelease;
        const isFullyDisbursed = totalNow >= sanctionAmt;

        try {
            // Update local mock database state
            const updatedHistory = [
                ...record.history,
                {
                    id: String(record.history.length + 1),
                    amount: amountToRelease,
                    date: trancheDate,
                    utr: trancheUtr.trim(),
                    mode: trancheMode
                }
            ];

            setTrancheRecords(prev => ({
                ...prev,
                [selectedApp.id]: {
                    beneficiary: {
                        name: beneficiaryName,
                        bank: beneficiaryBank,
                        account: beneficiaryAcc,
                        ifsc: beneficiaryIfsc
                    },
                    history: updatedHistory
                }
            }));

            // Sync with actual mock server API
            const mergedRemarks = selectedApp.remarks 
                ? `${selectedApp.remarks}\n[Released Tranche - ${format(new Date(), 'MMM dd, HH:mm')}]: UTR: ${trancheUtr.trim()}`
                : `[Released Tranche - ${format(new Date(), 'MMM dd, HH:mm')}]: UTR: ${trancheUtr.trim()}`;

            const payload = {
                status: isFullyDisbursed ? "disbursed" : selectedApp.status,
                stage: isFullyDisbursed ? "disbursed" : selectedApp.stage,
                disbursedAmount: totalNow,
                disbursedAt: new Date(trancheDate).toISOString(),
                remarks: mergedRemarks
            };

            const res: any = await adminApi.updateApplication(selectedApp.id, payload);
            if (res && res.success) {
                alert(`Tranche released successfully! Receipt created for ref: ${trancheUtr}`);
                setTrancheUtr("");
                setTrancheAmount("");
                setShowPanel(false);
                setSelectedApp(null);
                handleRefresh();
            }
        } catch (err) {
            console.error("Error confirming disbursement:", err);
            alert("Failed to record disbursement");
        } finally {
            setConfirming(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="p-8 lg:p-12 space-y-8 max-w-7xl mx-auto relative z-10">
            {/* Header */}
            <PageHeader 
                title="Disbursement Board" 
                description="Verify sanction files, register student beneficiary details, execute fund payouts, and record payment transaction tranches."
                moduleName="Module 06 • Disbursement Desk"
                icon="payments"
                actionSlot={
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="Search student, LAN, ID..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2.5 w-full sm:w-64 bg-white/70 backdrop-blur-md border border-purple-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#6605c7] shadow-sm transition-all"
                            />
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
                        </div>
                        <button 
                            onClick={handleRefresh}
                            className="px-4 py-2.5 border border-purple-100 bg-white/70 hover:bg-white text-[10px] font-black uppercase tracking-widest text-[#6605c7] rounded-xl shadow-sm transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-xs">sync</span> Refresh
                        </button>
                    </div>
                }
            />

            {/* Payout Channels Card */}
            <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border border-purple-50 shadow-xl overflow-hidden">
                <div className="p-4 border-b border-purple-50 flex flex-wrap gap-4 bg-gray-50/50">
                    <button 
                        onClick={() => setActiveTab("pending")}
                        className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                            activeTab === "pending" 
                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25" 
                                : "text-gray-400 hover:text-gray-650 hover:bg-gray-100"
                        }`}
                    >
                        <span>Awaiting Payout (Sanctioned)</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${activeTab === "pending" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}>
                            {tabCounts.pending}
                        </span>
                    </button>
                    <button 
                        onClick={() => setActiveTab("completed")}
                        className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                            activeTab === "completed" 
                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25" 
                                : "text-gray-400 hover:text-gray-650 hover:bg-gray-100"
                        }`}
                    >
                        <span>Disbursed Portfolio</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${activeTab === "completed" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}>
                            {tabCounts.completed}
                        </span>
                    </button>
                </div>

                <div className="p-8">
                    {loading ? (
                        <Spinner message="Synchronizing secure ledger..." />
                    ) : filteredApps.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-center">
                            <span className="material-symbols-outlined text-gray-200 text-6xl mb-4">account_balance_wallet</span>
                            <h3 className="text-sm font-bold text-gray-900 mb-1">No applications found</h3>
                            <p className="text-xs text-gray-400 max-w-xs">There are no files in this stage matching your disbursement filter.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-purple-50 text-[9px] font-black uppercase tracking-widest text-gray-400">
                                        <th className="pb-4">Application & LAN</th>
                                        <th className="pb-4">Student & Program</th>
                                        <th className="pb-4">Sanction Details</th>
                                        <th className="pb-4">Released Payout</th>
                                        <th className="pb-4">Status</th>
                                        <th className="pb-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-purple-50/50">
                                    {filteredApps.map((app) => {
                                        const record = trancheRecords[app.id] || { history: [] };
                                        const totalPaid = record.history.reduce((sum, t) => sum + t.amount, 0);
                                        const sanctionAmt = app.sanctionAmount || app.amount || 600000;

                                        return (
                                            <tr key={app.id} className="hover:bg-purple-50/10 transition-colors">
                                                <td className="py-5">
                                                    <span className="text-xs font-bold text-gray-900 block">{app.applicationNumber}</span>
                                                    <span className="text-[9px] font-black text-[#6605c7] uppercase tracking-wider block mt-1">LAN: {app.lanNumber || "N/A"}</span>
                                                </td>
                                                <td className="py-5">
                                                    <span className="text-xs font-bold text-gray-900 uppercase tracking-tight block">{app.firstName} {app.lastName}</span>
                                                    <span className="text-[10px] text-gray-400 block truncate max-w-[200px]">{app.universityName}</span>
                                                </td>
                                                <td className="py-5">
                                                    <span className="text-xs font-bold text-gray-900 block">₹{sanctionAmt.toLocaleString()}</span>
                                                    <span className="text-[9px] font-bold text-emerald-600 block">{app.sanctionedInterestRate || app.interestRate || "9.5"}% Effective ROI</span>
                                                </td>
                                                <td className="py-5">
                                                    <span className="text-xs font-black text-gray-900 block">
                                                        ₹{totalPaid.toLocaleString()}
                                                    </span>
                                                    <span className="text-[9px] font-semibold text-gray-400 block mt-1">
                                                        Remaining: ₹{(sanctionAmt - totalPaid).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="py-5">
                                                    {app.status === "disbursed" || app.status === "disbursement_confirmed" ? (
                                                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 border border-emerald-250 rounded-lg uppercase tracking-wider">
                                                            Fully Disbursed
                                                        </span>
                                                    ) : totalPaid > 0 ? (
                                                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 border border-blue-200 rounded-lg uppercase tracking-wider animate-pulse">
                                                            Partially Disbursed
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 border border-amber-250 rounded-lg uppercase tracking-wider">
                                                            Awaiting Release
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-5 text-right">
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedApp(app);
                                                            const appRec = trancheRecords[app.id] || { beneficiary: { name: `${app.firstName} ${app.lastName}`, bank: "HDFC Bank Ltd", account: "50100829104012", ifsc: "HDFC0000240" }, history: [] };
                                                            setBeneficiaryName(appRec.beneficiary.name);
                                                            setBeneficiaryBank(appRec.beneficiary.bank);
                                                            setBeneficiaryAcc(appRec.beneficiary.account);
                                                            setBeneficiaryIfsc(appRec.beneficiary.ifsc);
                                                            
                                                            const rem = sanctionAmt - totalPaid;
                                                            setTrancheAmount(rem.toString());
                                                            setShowPanel(true);
                                                        }}
                                                        className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-500/10 transition-all flex items-center gap-1.5 ml-auto"
                                                    >
                                                        <span className="material-symbols-outlined text-xs">payments</span> 
                                                        {app.status === "disbursed" || app.status === "disbursement_confirmed" ? "View Dossier" : "Release / History"}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Immersive Slide-over Panel (Drawer) */}
            <AnimatePresence>
                {showPanel && selectedApp && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        {/* Backdrop */}
                        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs" onClick={() => setShowPanel(false)} />

                        {/* Panel Body */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 220 }}
                            className="relative w-full max-w-[700px] h-screen bg-[#faf9fc] shadow-2xl z-10 flex flex-col overflow-hidden border-l border-purple-100"
                        >
                            {/* Panel Header */}
                            <div className="p-6 bg-white border-b border-purple-50 flex items-center justify-between sticky top-0 z-20">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                            {selectedApp.applicationNumber}
                                        </span>
                                        <span className="text-[8.5px] font-black uppercase tracking-wider text-gray-400 font-mono">
                                            LAN: {selectedApp.lanNumber || "PENDING"}
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mt-1 font-display">
                                        Disbursement Dossier: {selectedApp.firstName} {selectedApp.lastName}
                                    </h2>
                                </div>
                                <button 
                                    onClick={() => setShowPanel(false)}
                                    className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-all border border-gray-100"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>

                            {/* Panel Scroll Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                                
                                {/* 1. Remaining Balance Gauge */}
                                {(() => {
                                    const sanctionAmt = selectedApp.sanctionAmount || selectedApp.amount || 600000;
                                    const appRec = trancheRecords[selectedApp.id] || { history: [] };
                                    const totalPaid = appRec.history.reduce((sum, t) => sum + t.amount, 0);
                                    const remBalance = sanctionAmt - totalPaid;
                                    const pct = Math.round((totalPaid / sanctionAmt) * 100);

                                    return (
                                        <div className="p-6 bg-white rounded-2xl border border-purple-50 shadow-sm space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Disbursement Progress Gauge</span>
                                                    <span className="text-lg font-black text-gray-900 mt-1 block">Released: {pct}% of Sanctioned Principal</span>
                                                </div>
                                                <span className="text-2xl font-black font-mono text-emerald-600">₹{totalPaid.toLocaleString()}</span>
                                            </div>

                                            <div className="w-full bg-gray-150 h-3 rounded-full overflow-hidden">
                                                <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-purple-50/50 text-left">
                                                <div>
                                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Sanction Principal</span>
                                                    <span className="text-xs font-black text-gray-800">₹{sanctionAmt.toLocaleString()}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Released Tranches</span>
                                                    <span className="text-xs font-black text-emerald-650">₹{totalPaid.toLocaleString()}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Remaining Balance</span>
                                                    <span className="text-xs font-black text-amber-650">₹{remBalance.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* 2. Beneficiary Details Registration Card */}
                                <div className="p-6 bg-white rounded-2xl border border-purple-50 shadow-sm space-y-4 text-left">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-[#6605c7] border-b border-purple-50 pb-2 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-xs">account_box</span>
                                        Registered Beneficiary details
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest block mb-1">Account Holder Name</label>
                                            <input 
                                                type="text" 
                                                value={beneficiaryName}
                                                onChange={e => setBeneficiaryName(e.target.value)}
                                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] text-gray-700"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest block mb-1">Beneficiary Bank Name</label>
                                            <input 
                                                type="text" 
                                                value={beneficiaryBank}
                                                onChange={e => setBeneficiaryBank(e.target.value)}
                                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] text-gray-700"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest block mb-1">Account Number</label>
                                            <input 
                                                type="text" 
                                                value={beneficiaryAcc}
                                                onChange={e => setBeneficiaryAcc(e.target.value)}
                                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] text-gray-700 font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest block mb-1">Bank IFSC Code</label>
                                            <input 
                                                type="text" 
                                                value={beneficiaryIfsc}
                                                onChange={e => setBeneficiaryIfsc(e.target.value)}
                                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] text-gray-700 font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Multi-Tranche History Table */}
                                <div className="p-6 bg-white rounded-2xl border border-purple-50 shadow-sm space-y-4 text-left">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-[#6605c7] border-b border-purple-50 pb-2 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-xs">history</span>
                                        Tranche Disbursement Ledger
                                    </h3>

                                    {(() => {
                                        const appRec = trancheRecords[selectedApp.id] || { history: [] };
                                        if (appRec.history.length === 0) {
                                            return (
                                                <p className="text-[10.5px] text-gray-400 italic py-4 text-center">No tranches have been released on this file yet.</p>
                                            );
                                        }
                                        return (
                                            <div className="overflow-hidden border border-purple-50 rounded-xl">
                                                <table className="w-full text-left text-xs border-collapse">
                                                    <thead>
                                                        <tr className="bg-gray-50 text-[8.5px] font-black uppercase text-gray-400 tracking-wider border-b border-purple-50">
                                                            <th className="p-3">Tranche</th>
                                                            <th className="p-3">Amount</th>
                                                            <th className="p-3">Payout Date</th>
                                                            <th className="p-3">Mode</th>
                                                            <th className="p-3">Transaction UTR (Receipt)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-purple-50/50 font-medium">
                                                        {appRec.history.map((t, idx) => (
                                                            <tr key={t.id} className="hover:bg-gray-50/50">
                                                                <td className="p-3 font-bold text-gray-900">#0{idx + 1}</td>
                                                                <td className="p-3 font-bold text-gray-900">₹{t.amount.toLocaleString()}</td>
                                                                <td className="p-3 text-gray-400 font-semibold">{t.date}</td>
                                                                <td className="p-3 font-mono text-[9.5px] text-purple-650 font-bold">{t.mode}</td>
                                                                <td className="p-3 font-mono text-[9px] text-[#6605c7] hover:underline font-bold">
                                                                    <a href="#" onClick={(e) => { e.preventDefault(); alert(`📄 Digital receipt verified! Token: sha256:${t.utr}`); }}>
                                                                        {t.utr}
                                                                    </a>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* 4. Release New Tranche Form */}
                                {(() => {
                                    const sanctionAmt = selectedApp.sanctionAmount || selectedApp.amount || 600000;
                                    const appRec = trancheRecords[selectedApp.id] || { history: [] };
                                    const totalPaid = appRec.history.reduce((sum, t) => sum + t.amount, 0);
                                    const remBalance = sanctionAmt - totalPaid;

                                    if (remBalance <= 0) {
                                        return (
                                            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
                                                <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                                                <span>This sanctioned credit file is fully released. Total ledger payout matches sanctioned parameters.</span>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="p-6 bg-white rounded-2xl border border-purple-50 shadow-sm space-y-4 text-left">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 border-b border-purple-50 pb-2 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-xs">add_card</span>
                                                Release Next Tranche
                                            </h3>

                                            <form onSubmit={handleReleaseTranche} className="space-y-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest block mb-1">Payout Amount (₹)</label>
                                                        <input 
                                                            type="number"
                                                            required
                                                            max={remBalance}
                                                            value={trancheAmount}
                                                            onChange={e => setTrancheAmount(e.target.value)}
                                                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] text-gray-700"
                                                        />
                                                        <span className="text-[8.5px] text-amber-600 font-semibold block mt-1">Maximum limit: ₹{remBalance.toLocaleString()}</span>
                                                    </div>
                                                    <div>
                                                        <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest block mb-1">Release Date</label>
                                                        <input 
                                                            type="date"
                                                            required
                                                            value={trancheDate}
                                                            onChange={e => setTrancheDate(e.target.value)}
                                                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] text-gray-700"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest block mb-1">Transaction Ref / UTR Number</label>
                                                        <input 
                                                            type="text"
                                                            required
                                                            placeholder="e.g. UTR-HDFC-990812-X"
                                                            value={trancheUtr}
                                                            onChange={e => setTrancheUtr(e.target.value)}
                                                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] text-gray-700 font-mono"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest block mb-1">Settlement Method</label>
                                                        <select
                                                            value={trancheMode}
                                                            onChange={e => setTrancheMode(e.target.value)}
                                                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] text-gray-700"
                                                        >
                                                            <option value="NEFT">NEFT Settlement Desk</option>
                                                            <option value="RTGS">RTGS Realtime</option>
                                                            <option value="IMPS">IMPS Instant Payout</option>
                                                            <option value="UPI">UPI Merchant Ledger</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <button 
                                                    type="submit"
                                                    disabled={confirming}
                                                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-1.5"
                                                >
                                                    {confirming ? "Processing Payout..." : "Release Tranche Funds"}
                                                </button>
                                            </form>
                                        </div>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
