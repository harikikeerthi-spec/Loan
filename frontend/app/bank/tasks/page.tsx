"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { adminApi, bankApi } from "@/lib/api";
import { PageHeader, PriorityTag, Spinner } from "@/components/bank/SharedUI";

// Kanban Columns mapping
const COLUMNS = [
    { id: "pre_screening", label: "Pre-Screening", icon: "assignment_ind", color: "border-t-blue-500" },
    { id: "verification", label: "Verification", icon: "verified_user", color: "border-t-purple-500" },
    { id: "risk_evaluation", label: "Risk Evaluation", icon: "analytics", color: "border-t-amber-500" },
    { id: "final_review", label: "Final Review", icon: "rate_review", color: "border-t-indigo-500" },
    { id: "disbursement", label: "Disbursement", icon: "payments", color: "border-t-emerald-500" }
];

export default function TaskMatrix() {
    const [mounted, setMounted] = useState(false);
    const [currentBankId, setCurrentBankId] = useState<string>("idfc");
    const [applications, setApplications] = useState<any[]>([]);
    const [officers, setOfficers] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modal state for task re-allocation
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [showReallocateModal, setShowReallocateModal] = useState(false);
    const [assignedOfficer, setAssignedOfficer] = useState("");
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== "undefined") {
            const saved = sessionStorage.getItem("selectedBank") || localStorage.getItem("selectedBank");
            if (saved) setCurrentBankId(saved);
        }
    }, []);

    const fetchData = async (bankId: string) => {
        setLoading(true);
        try {
            // Get files
            const appRes: any = await adminApi.getApplications({ bank: bankId });
            let apps = [];
            if (appRes && appRes.success) {
                apps = appRes.data || [];
            }
            setApplications(apps);

            // Get officers
            try {
                const offRes: any = await bankApi.getOfficers();
                if (offRes && Array.isArray(offRes.data)) {
                    setOfficers(offRes.data.map((o: any) => o.name || o));
                } else {
                    setOfficers(["Aditya Varma", "Sneha Nair", "Vikram Rathore", "Karthik Raja", "Priya Sharma"]);
                }
            } catch (err) {
                // Fallback officers list
                setOfficers(["Aditya Varma", "Sneha Nair", "Vikram Rathore", "Karthik Raja", "Priya Sharma"]);
            }

        } catch (err) {
            console.error("Failed to load task matrix data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) {
            fetchData(currentBankId);
        }
    }, [currentBankId, mounted]);

    // Map application properties to column stages
    const mappedApplications = useMemo(() => {
        return applications.map(app => {
            // Determine column stage based on application state
            let stage = "pre_screening";
            if (app.status === "disbursed") {
                stage = "disbursement";
            } else if (app.status === "approved") {
                stage = "final_review";
            } else if (app.status === "processing") {
                if (app.remarks && app.remarks.toLowerCase().includes("risk")) {
                    stage = "risk_evaluation";
                } else if (app.remarks && app.remarks.toLowerCase().includes("verify")) {
                    stage = "verification";
                } else {
                    stage = "verification";
                }
            } else if (app.lanNumber) {
                stage = "verification";
            }

            // Extract officer name from remarks (e.g., "[Officer: Sneha Nair]")
            let officer = "Unassigned";
            if (app.remarks) {
                const match = app.remarks.match(/\[Officer:\s*([^\]]+)\]/);
                if (match && match[1]) {
                    officer = match[1];
                }
            }

            return {
                ...app,
                stage,
                officer
            };
        });
    }, [applications]);

    // Filtered application cards per column
    const filteredBoardData = useMemo(() => {
        const board: Record<string, any[]> = {
            pre_screening: [],
            verification: [],
            risk_evaluation: [],
            final_review: [],
            disbursement: []
        };

        mappedApplications.forEach(app => {
            const matchesSearch = 
                (app.applicationNumber || "").toLowerCase().includes(search.toLowerCase()) ||
                (`${app.firstName || ""} ${app.lastName || ""}`).toLowerCase().includes(search.toLowerCase()) ||
                (app.lanNumber || "").toLowerCase().includes(search.toLowerCase()) ||
                (app.officer || "").toLowerCase().includes(search.toLowerCase());

            if (matchesSearch) {
                if (board[app.stage]) {
                    board[app.stage].push(app);
                } else {
                    board.pre_screening.push(app);
                }
            }
        });

        return board;
    }, [mappedApplications, search]);

    const handleReallocateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedApp || !assignedOfficer) return;
        setUpdating(true);

        try {
            // Strip any existing [Officer: ...] tag from remarks first
            let cleanRemarks = (selectedApp.remarks || "").replace(/\[Officer:\s*[^\]]+\]\s*/g, "");
            
            const updatedRemarks = `[Officer: ${assignedOfficer}] ${cleanRemarks}\n[Task Matrix - ${format(new Date(), "MMM dd, HH:mm")}]: Task allocated to ${assignedOfficer}`;

            const res: any = await adminApi.updateApplication(selectedApp.id, {
                remarks: updatedRemarks
            });

            if (res && res.success) {
                setShowReallocateModal(false);
                setSelectedApp(null);
                fetchData(currentBankId);
            }
        } catch (err) {
            console.error("Failed to reallocate task:", err);
            alert("Error reallocating task.");
        } finally {
            setUpdating(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="p-8 lg:p-12 space-y-8 max-w-7xl mx-auto relative z-10">
            {/* Header */}
            <PageHeader 
                title="Task Allocation Matrix" 
                description="Monitor verification pipelines, reallocate caseloads, and track credit officer SLA performance in real-time."
                moduleName="Module 08 • Task Matrix"
                icon="assignment_add"
                actionSlot={
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="Filter by student, LAN, officer..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2.5 w-full sm:w-64 bg-white/70 backdrop-blur-md border border-purple-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#6605c7] shadow-sm transition-all"
                            />
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
                        </div>
                        <button 
                            onClick={() => fetchData(currentBankId)}
                            className="px-4 py-2.5 border border-purple-100 bg-white/70 hover:bg-white text-[10px] font-black uppercase tracking-widest text-[#6605c7] rounded-xl shadow-sm transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-xs">sync</span> Refresh Matrix
                        </button>
                    </div>
                }
            />

            {loading ? (
                <Spinner message="Synchronizing board channels..." />
            ) : (
                /* Board Grid */
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 overflow-x-auto pb-4 no-scrollbar">
                    {COLUMNS.map((col) => {
                        const cards = filteredBoardData[col.id] || [];
                        return (
                            <div key={col.id} className="flex flex-col min-w-[240px] bg-white/40 border border-purple-100/40 rounded-3xl p-4 min-h-[500px]">
                                {/* Column Header */}
                                <div className="flex justify-between items-center mb-4 px-2">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-purple-600 text-sm">{col.icon}</span>
                                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">{col.label}</span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black bg-purple-50 text-[#6605c7]">
                                        {cards.length}
                                    </span>
                                </div>

                                {/* Cards Stack */}
                                <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] no-scrollbar">
                                    {cards.length === 0 ? (
                                        <div className="h-28 border border-dashed border-purple-100 rounded-2xl flex flex-col items-center justify-center p-3 text-center">
                                            <span className="material-symbols-outlined text-gray-300 text-xl">folder_off</span>
                                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mt-1">Empty Column</span>
                                        </div>
                                    ) : (
                                        cards.map((app) => {
                                            const isUrgent = app.officer === "Unassigned";
                                            return (
                                                <motion.div
                                                    key={app.id}
                                                    layoutId={`card-${app.id}`}
                                                    whileHover={{ y: -3, scale: 1.01 }}
                                                    className={`glass-card p-4 rounded-2xl border-l-4 bg-white/90 border border-purple-50 hover:border-purple-100/80 transition-all select-none ${col.color} cursor-pointer shadow-sm shadow-purple-950/[0.01]`}
                                                    onClick={() => {
                                                        setSelectedApp(app);
                                                        setAssignedOfficer(app.officer === "Unassigned" ? "" : app.officer);
                                                        setShowReallocateModal(true);
                                                    }}
                                                >
                                                    <div className="flex justify-between items-start gap-2 mb-2">
                                                        <span className="text-[9.5px] font-black text-gray-900 font-mono tracking-tight">{app.applicationNumber}</span>
                                                        <PriorityTag priority={isUrgent ? "high" : "medium"} />
                                                    </div>

                                                    <h4 className="text-xs font-black text-gray-800 uppercase tracking-tight truncate">
                                                        {app.firstName} {app.lastName}
                                                    </h4>
                                                    <p className="text-[9px] text-gray-400 font-semibold truncate mt-0.5">{app.universityName}</p>

                                                    <div className="border-t border-purple-50/50 mt-3 pt-3 flex justify-between items-center">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <div className="w-5 h-5 rounded-full bg-[#6605c7]/10 flex items-center justify-center text-[#6605c7] text-[8px] font-black">
                                                                {app.officer[0]}
                                                            </div>
                                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider truncate">
                                                                {app.officer}
                                                            </span>
                                                        </div>
                                                        <span className="text-[8px] font-black text-[#6605c7] shrink-0">
                                                            ₹{app.amount ? Math.round(app.amount / 100000) : 0}L
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Reallocate Task Modal */}
            <AnimatePresence>
                {showReallocateModal && selectedApp && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowReallocateModal(false)} />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl p-8 max-w-sm w-full z-10 relative overflow-hidden"
                        >
                            <h3 className="text-xl font-black text-gray-900 mb-1 uppercase tracking-tight">Allocate Operation</h3>
                            <p className="text-[9.5px] font-black text-[#6605c7] uppercase tracking-widest mb-6">
                                APP: {selectedApp.applicationNumber} • Amount: ₹{selectedApp.amount?.toLocaleString()}
                            </p>

                            <form onSubmit={handleReallocateSubmit} className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Assign Credit Officer</label>
                                    <select
                                        required
                                        value={assignedOfficer}
                                        onChange={(e) => setAssignedOfficer(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] text-gray-700"
                                    >
                                        <option value="">Select Officer...</option>
                                        {officers.map((off) => (
                                            <option key={off} value={off}>{off}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100/50 text-[10px] text-gray-500 font-semibold leading-relaxed">
                                    Allocating tasks updates logs and triggers push notifications to the credit officer's workspace.
                                </div>

                                <div className="flex gap-4 pt-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowReallocateModal(false)}
                                        className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={updating}
                                        className="flex-1 py-3 bg-[#6605c7] hover:bg-[#8b24e5] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/10 transition-all flex items-center justify-center"
                                    >
                                        {updating ? "Allocating..." : "Assign Task"}
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
