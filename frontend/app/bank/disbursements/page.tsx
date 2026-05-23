"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { adminApi } from "@/lib/api";

export default function DisbursementTracker() {
    const [mounted, setMounted] = useState(false);
    const [currentBankId, setCurrentBankId] = useState<string>("idfc");
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");
    
    // Payout modal states
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [disbursedAmount, setDisbursedAmount] = useState("");
    const [disbursedAt, setDisbursedAt] = useState(format(new Date(), "yyyy-MM-dd"));
    const [utrNumber, setUtrNumber] = useState("");
    const [confirming, setConfirming] = useState(false);

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
                setApplications(res.data || []);
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

            const isApproved = app.status === "approved";
            const isDisbursed = app.status === "disbursed";

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
            if (app.status === "approved") counts.pending++;
            else if (app.status === "disbursed") counts.completed++;
        });
        return counts;
    }, [applications]);

    const handleConfirmDisbursement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedApp || !disbursedAmount || !utrNumber.trim()) return;
        setConfirming(true);

        try {
            const mergedRemarks = selectedApp.remarks 
                ? `${selectedApp.remarks}\n[Disbursed - ${format(new Date(), 'MMM dd, HH:mm')}]: UTR: ${utrNumber.trim()}`
                : `[Disbursed - ${format(new Date(), 'MMM dd, HH:mm')}]: UTR: ${utrNumber.trim()}`;

            const payload = {
                status: "disbursed",
                stage: "disbursed",
                progress: 100,
                disbursedAmount: parseFloat(disbursedAmount),
                disbursedAt: new Date(disbursedAt).toISOString(),
                remarks: mergedRemarks
            };

            const res: any = await adminApi.updateApplication(selectedApp.id, payload);
            if (res && res.success) {
                setShowConfirmModal(false);
                setSelectedApp(null);
                setUtrNumber("");
                setDisbursedAmount("");
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
        <div className="min-h-screen p-8 lg:p-12 transition-all duration-300">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-emerald-600 bg-emerald-50 p-2 rounded-xl">payments</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Module 04 ΓÇó Funds Release</span>
                        </div>
                        <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight">Disbursement Tracker</h1>
                        <p className="text-sm text-gray-500 mt-2 font-medium">Verify sanction files, execute fund payouts, and record payment transaction tokens.</p>
                    </div>
                    <div className="flex gap-4 w-full lg:w-auto">
                        <div className="relative flex-1 lg:flex-none">
                            <input 
                                type="text" 
                                placeholder="Search LAN, student, number..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-12 pr-6 py-3 w-full lg:w-72 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#6605c7] focus:ring-4 focus:ring-[#6605c7]/5 shadow-sm transition-all"
                            />
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                        </div>
                    </div>
                </div>

                {/* Payout Channels Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4">
                        <button 
                            onClick={() => setActiveTab("pending")}
                            className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                                activeTab === "pending" 
                                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25" 
                                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <span>Awaiting Payout (Sanctioned)</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${activeTab === "pending" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                                {tabCounts.pending}
                            </span>
                        </button>
                        <button 
                            onClick={() => setActiveTab("completed")}
                            className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                                activeTab === "completed" 
                                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25" 
                                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <span>Disbursed Portfolio</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${activeTab === "completed" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                                {tabCounts.completed}
                            </span>
                        </button>
                    </div>

                    <div className="p-8">
                        {loading ? (
                            <div className="h-[400px] flex flex-col items-center justify-center gap-4">
                                <div className="w-12 h-12 border-4 border-gray-100 border-t-emerald-600 rounded-full animate-spin" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Syncing disbursement records...</span>
                            </div>
                        ) : filteredApps.length === 0 ? (
                            <div className="h-[300px] flex flex-col items-center justify-center text-center">
                                <span className="material-symbols-outlined text-gray-200 text-6xl mb-4">account_balance_wallet</span>
                                <h3 className="text-sm font-bold text-gray-900 mb-1">No applications found</h3>
                                <p className="text-xs text-gray-400 max-w-xs">There are no files in this stage matching your disbursement filter.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Application & LAN</th>
                                            <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Student & Program</th>
                                            <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Sanction Details</th>
                                            <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Disbursed Amount</th>
                                            <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                            <th className="pb-4 text-[9px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredApps.map((app) => (
                                            <tr key={app.id} className="border-b border-gray-50/50 hover:bg-gray-50/20 transition-all">
                                                <td className="py-5">
                                                    <span className="text-xs font-bold text-gray-900 block">{app.applicationNumber}</span>
                                                    <span className="text-[9px] font-black text-[#6605c7] uppercase tracking-wider block mt-1">LAN: {app.lanNumber || "N/A"}</span>
                                                </td>
                                                <td className="py-5">
                                                    <span className="text-xs font-bold text-gray-900 uppercase tracking-tight block">{app.firstName} {app.lastName}</span>
                                                    <span className="text-[10px] text-gray-400 block truncate max-w-[200px]">{app.universityName}</span>
                                                </td>
                                                <td className="py-5">
                                                    <span className="text-xs font-bold text-gray-900 block">Γé╣{(app.sanctionAmount || app.amount).toLocaleString()}</span>
                                                    <span className="text-[9px] font-bold text-emerald-600 block">{app.sanctionedInterestRate || app.interestRate || "N/A"}% Effective ROI</span>
                                                </td>
                                                <td className="py-5">
                                                    <span className="text-xs font-black text-gray-900 block">
                                                        {app.disbursedAmount ? `Γé╣${(app.disbursedAmount).toLocaleString()}` : "ΓÇö"}
                                                    </span>
                                                    {app.disbursedAt && (
                                                        <span className="text-[9px] font-semibold text-gray-400 block mt-1">
                                                            {format(new Date(app.disbursedAt), "dd MMM yyyy")}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-5">
                                                    {app.status === "disbursed" ? (
                                                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider">
                                                            Paid Out
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase tracking-wider animate-pulse">
                                                            Awaiting release
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-5 text-right">
                                                    {app.status === "approved" ? (
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedApp(app);
                                                                setDisbursedAmount((app.sanctionAmount || app.amount).toString());
                                                                setShowConfirmModal(true);
                                                            }}
                                                            className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-500/10 transition-all flex items-center gap-1.5 ml-auto"
                                                        >
                                                            <span className="material-symbols-outlined text-xs">payments</span> Release Funds
                                                        </button>
                                                    ) : (
                                                        <a 
                                                            href={app.sanctionLetterUrl || "#"}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="px-4 py-2 border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all inline-flex items-center gap-1.5"
                                                        >
                                                            <span className="material-symbols-outlined text-xs">print</span> Sanction doc
                                                        </a>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirm Payout Modal */}
            <AnimatePresence>
                {showConfirmModal && selectedApp && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl p-8 max-w-md w-full z-10 relative overflow-hidden"
                        >
                            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Confirm Disbursement</h3>
                            <p className="text-xs text-gray-400 mb-6 font-bold uppercase tracking-wider">Acknowledge release of sanctioned amount and input transaction details.</p>

                            <form onSubmit={handleConfirmDisbursement} className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Disbursed Amount (Γé╣)</label>
                                    <input 
                                        type="number"
                                        required
                                        value={disbursedAmount}
                                        onChange={(e) => setDisbursedAmount(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#6605c7]"
                                    />
                                </div>
                                
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Disbursement Date</label>
                                    <input 
                                        type="date"
                                        required
                                        value={disbursedAt}
                                        onChange={(e) => setDisbursedAt(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#6605c7]"
                                    />
                                </div>

                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Transaction Ref / UTR Number</label>
                                    <input 
                                        type="text"
                                        required
                                        placeholder="e.g. UTR-HDFC-990812-X"
                                        value={utrNumber}
                                        onChange={(e) => setUtrNumber(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#6605c7]"
                                    />
                                </div>

                                <div className="flex gap-4 pt-3 mt-6">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowConfirmModal(false)}
                                        className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={confirming}
                                        className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center"
                                    >
                                        {confirming ? "Processing..." : "Confirm Release"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
