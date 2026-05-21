"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { bankApi } from "@/lib/api";

export default function DisbursementTracker() {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    
    // Core data states
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<"pending" | "released">("pending");

    // Modal & confirmation states
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [disbursedAmount, setDisbursedAmount] = useState("");
    const [disbursedAt, setDisbursedAt] = useState("");
    const [utrNumber, setUtrNumber] = useState("");
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch all applications ready for fund release or already disbursed
    const fetchApplications = async () => {
        setLoading(true);
        try {
            const incoming = await bankApi.getIncomingFiles() as any[];
            const myFiles = await bankApi.getMyFiles() as any[];
            const allFetched = [...(incoming || []), ...(myFiles || [])];
            const uniqueApps = Array.from(new Map(allFetched.map(item => [item.id, item])).values());
            setApplications(uniqueApps);
        } catch (error) {
            console.error("Failed to load applications for disbursements:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) {
            fetchApplications();
        }
    }, [mounted]);

    // Filter applications based on active queue status and search query
    const filteredApplications = useMemo(() => {
        return applications.filter(app => {
            const status = app.status?.toLowerCase() || "";
            let inTab = false;
            if (activeTab === "pending") {
                inTab = ["approved", "sanctioned"].includes(status);
            } else if (activeTab === "released") {
                inTab = status === "disbursed";
            }

            if (!inTab) return false;

            if (!searchTerm.trim()) return true;
            const term = searchTerm.toLowerCase();
            const fullName = `${app.firstName || ""} ${app.lastName || ""}`.toLowerCase();
            const appNum = (app.applicationNumber || "").toLowerCase();
            return fullName.includes(term) || appNum.includes(term);
        });
    }, [applications, activeTab, searchTerm]);

    // Compute queue counts for tab indicators
    const pendingCount = useMemo(() => {
        return applications.filter(app => ["approved", "sanctioned"].includes(app.status?.toLowerCase() || "")).length;
    }, [applications]);

    const releasedCount = useMemo(() => {
        return applications.filter(app => (app.status?.toLowerCase() || "") === "disbursed").length;
    }, [applications]);

    // Submit disbursement confirmation details
    const handleConfirmDisbursement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedApp) return;

        setConfirming(true);
        try {
            await bankApi.confirmDisbursement({
                applicationId: selectedApp.id,
                disbursedAmount: Number(disbursedAmount),
                disbursedAt,
                utrNumber
            });
            alert("Disbursement confirmed successfully.");
            
            // Sync status locally in state
            setApplications(prev => 
                prev.map(app => 
                    app.id === selectedApp.id 
                        ? { ...app, status: "disbursed", disbursedAmount: Number(disbursedAmount), disbursedAt, utrNumber }
                        : app
                )
            );
            
            setShowConfirmModal(false);
            setSelectedApp(null);
            setDisbursedAmount("");
            setDisbursedAt("");
            setUtrNumber("");
        } catch (error) {
            console.error("Failed to confirm disbursement:", error);
            alert("Failed to confirm disbursement: " + (error as Error).message);
        } finally {
            setConfirming(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen p-8 lg:p-12 pl-[100px] lg:pl-[320px] transition-all duration-300">
            <div className="max-w-7xl mx-auto space-y-12">
                
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-emerald-600 bg-emerald-50 p-2 rounded-xl">payments</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Module 04 • Funds Release</span>
                        </div>
                        <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight">Disbursement Tracker</h1>
                        <p className="text-sm text-gray-500 mt-2 font-medium">Monitoring and tracking the release of sanctioned funds to students.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="w-12 h-12 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-[#6605c7] flex items-center justify-center transition-all">
                            <span className="material-symbols-outlined text-gray-400">filter_list</span>
                        </button>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Search by Applicant ID or Name..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-6 py-3 w-72 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#6605c7] focus:ring-4 focus:ring-[#6605c7]/5 shadow-sm transition-all"
                            />
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                        </div>
                        <button 
                            onClick={fetchApplications} 
                            className="w-12 h-12 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-[#6605c7] flex items-center justify-center transition-all text-[#6605c7]"
                            title="Reload Disbursements Tracker"
                        >
                            <span className="material-symbols-outlined">refresh</span>
                        </button>
                    </div>
                </motion.div>

                {/* Queue Dashboard Matrix */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden">
                    <div className="p-8 border-b border-gray-100 flex gap-8">
                        <button 
                            onClick={() => setActiveTab("pending")} 
                            className={`text-sm font-bold pb-2 transition-all ${activeTab === "pending" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            Pending Release ({pendingCount})
                        </button>
                        <button 
                            onClick={() => setActiveTab("released")} 
                            className={`text-sm font-bold pb-2 transition-all ${activeTab === "released" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            Released Funds ({releasedCount})
                        </button>
                    </div>
                    
                    <div className="p-8 min-h-[400px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="w-12 h-12 border-4 border-emerald-600/10 border-t-emerald-600 rounded-full animate-spin mb-4" />
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Opening capital pipelines...</p>
                            </div>
                        ) : filteredApplications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <span className="material-symbols-outlined text-gray-200 text-6xl mb-4">account_balance_wallet</span>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">No Applications Found</h3>
                                <p className="text-xs text-gray-400 max-w-sm">No student files match this capital status or search filters.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="pb-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Application Ref</th>
                                            <th className="pb-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Applicant</th>
                                            <th className="pb-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Sanctioned Capital</th>
                                            <th className="pb-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Branch & Institution</th>
                                            <th className="pb-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Disbursement details</th>
                                            <th className="pb-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredApplications.map((app) => (
                                            <tr key={app.id} className="hover:bg-gray-50/50 transition-all group">
                                                <td className="py-5 pr-4">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                                                        {app.applicationNumber || `APP-${app.id.substring(0, 8).toUpperCase()}`}
                                                    </span>
                                                </td>
                                                <td className="py-5 pr-4">
                                                    <div className="font-bold text-gray-900">{app.firstName} {app.lastName}</div>
                                                    <div className="text-[10px] text-gray-400 font-medium mt-0.5">{app.email}</div>
                                                </td>
                                                <td className="py-5 pr-4 text-sm font-bold text-gray-900">
                                                    ₹{app.amount ? app.amount.toLocaleString() : "0"}
                                                </td>
                                                <td className="py-5 pr-4">
                                                    <div className="text-xs font-semibold text-gray-700 max-w-[180px] truncate">{app.universityName || "Foreign Institution"}</div>
                                                    <div className="text-[10px] text-gray-400 font-medium mt-0.5 max-w-[180px] truncate">{app.courseName || "Program Degree"}</div>
                                                </td>
                                                <td className="py-5 pr-4">
                                                    {app.status?.toLowerCase() === "disbursed" ? (
                                                        <div>
                                                            <div className="text-xs font-bold text-emerald-600">UTR: {app.utrNumber || "N/A"}</div>
                                                            <div className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mt-0.5">Amt: ₹{app.disbursedAmount?.toLocaleString() || "0"} · Date: {app.disbursedAt || "N/A"}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border bg-amber-50 text-amber-600 border-amber-100 animate-pulse">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                                            Awaiting Release
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-5 text-right">
                                                    {app.status?.toLowerCase() !== "disbursed" ? (
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedApp(app);
                                                                setDisbursedAmount(app.amount ? app.amount.toString() : "");
                                                                setDisbursedAt(new Date().toISOString().split("T")[0]);
                                                                setShowConfirmModal(true);
                                                            }}
                                                            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-600 shadow-sm transition-all group-hover:scale-105"
                                                        >
                                                            Confirm Payout
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-end gap-1.5">
                                                            <span className="material-symbols-outlined text-emerald-500 text-base">check_circle</span> Disbursed
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </motion.div>

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
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Disbursed Amount (₹)</label>
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
