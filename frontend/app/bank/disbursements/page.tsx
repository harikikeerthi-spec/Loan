"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi } from "@/lib/api";
import { format } from "date-fns";

export default function DisbursementTracker() {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Confirm Disbursement Form Inputs
    const [selectedAppId, setSelectedAppId] = useState("");
    const [disbMode, setDisbMode] = useState("RTGS");
    const [disbUtr, setDisbUtr] = useState("");
    const [disbAmount, setDisbAmount] = useState("");
    const [disbReleaseDate, setDisbReleaseDate] = useState("");
    const [disbTranche, setDisbTranche] = useState("1st Tranche");

    // Bank detection helpers
    const currentBankId = typeof window !== "undefined" ? sessionStorage.getItem("selectedBank") : null;
    const currentBankName = useMemo(() => {
        if (!currentBankId) return user?.firstName || "SBI";
        const map: Record<string, string> = {
            auxilo: "Auxilo Finserve",
            avanse: "Avanse Financial",
            credila: "HDFC Credila",
            idfc: "IDFC FIRST Bank",
            poonawalla: "Poonawalla Fincorp",
        };
        return map[currentBankId] || currentBankId.toUpperCase();
    }, [currentBankId, user]);

    useEffect(() => {
        setMounted(true);
        fetchDisbursements();
    }, [currentBankName, user]);

    const fetchDisbursements = async () => {
        setLoading(true);
        try {
            const res = await adminApi.getApplications({ limit: "200" }) as any;
            if (res.success && Array.isArray(res.data)) {
                const filtered = res.data.filter((app: any) => {
                    if (user?.role === "admin" || user?.role === "super_admin") return true;
                    if (!app.bank) return false;
                    const appBankLower = app.bank.toLowerCase();
                    const activeBankLower = currentBankName.toLowerCase();
                    return appBankLower.includes(activeBankLower) || activeBankLower.includes(appBankLower);
                });

                // Fetch remarks for each application to resolve disbursed tranches
                const appsWithRemarks = await Promise.all(
                    filtered.map(async (app: any) => {
                        try {
                            const remarksRes = await adminApi.getRemarks(app.id) as any;
                            const remarksList = remarksRes.success && remarksRes.data ? remarksRes.data : [];
                            
                            // Find disbursement notes
                            const disbNotes = remarksList
                                .filter((r: any) => r.type === "disbursement_confirmed")
                                .map((r: any) => {
                                    try { return JSON.parse(r.content); } catch (e) { return null; }
                                })
                                .filter(Boolean);

                            return {
                                ...app,
                                disbursementRecords: disbNotes,
                            };
                        } catch (e) {
                            return { ...app, disbursementRecords: [] };
                        }
                    })
                );
                setApplications(appsWithRemarks);
            }
        } catch (error) {
            console.error("Failed to load disbursements:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter disbursements based on search term
    const filteredDisbursals = useMemo(() => {
        return applications.filter((app) => {
            const fullName = `${app.firstName || ""} ${app.lastName || ""}`.toLowerCase();
            const matchSearch = fullName.includes(searchTerm.toLowerCase()) || 
                                (app.applicationNumber && app.applicationNumber.toLowerCase().includes(searchTerm.toLowerCase()));
            
            // Show if status is disbursed or if approved (so they can trigger disbursement) or if they already have disbursement records logged
            const hasStatus = app.status === "disbursed" || app.status === "approved" || app.status === "sanctioned";
            const hasRecords = app.disbursementRecords && app.disbursementRecords.length > 0;
            return matchSearch && (hasStatus || hasRecords);
        });
    }, [applications, searchTerm]);

    const stats = useMemo(() => {
        let totalSanctioned = 0;
        let totalDisbursed = 0;
        let pendingDisbursement = 0;
        let activeDisbursementsCount = 0;

        applications.forEach((app) => {
            if (app.status === "approved" || app.status === "sanctioned" || app.status === "disbursed") {
                totalSanctioned += app.amount || 0;
            }
            if (app.disbursementRecords && app.disbursementRecords.length > 0) {
                activeDisbursementsCount++;
                app.disbursementRecords.forEach((rec: any) => {
                    totalDisbursed += parseFloat(rec.amount) || 0;
                });
            }
        });

        pendingDisbursement = Math.max(0, totalSanctioned - totalDisbursed);

        return { totalSanctioned, totalDisbursed, pendingDisbursement, activeCount: activeDisbursementsCount };
    }, [applications]);

    const handleConfirmDisbursement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAppId || !disbUtr.trim() || !disbAmount.trim()) return;
        
        const selectedApp = applications.find(a => a.id === selectedAppId);
        if (!selectedApp) return;

        try {
            await adminApi.updateApplicationStatus(selectedAppId, {
                status: "disbursed",
                stage: "disbursement",
                progress: 100,
                remarks: `Disbursement confirmed: ₹${disbAmount} released via UTR ${disbUtr.trim()} (${disbMode}).`
            });
            await adminApi.addRemark(selectedAppId, {
                type: "disbursement_confirmed",
                content: JSON.stringify({
                    utr: disbUtr.trim(),
                    mode: disbMode,
                    amount: disbAmount,
                    releaseDate: disbReleaseDate || format(new Date(), "yyyy-MM-dd"),
                    tranche: disbTranche,
                    date: new Date().toISOString()
                })
            });

            setSelectedAppId("");
            setDisbUtr("");
            setDisbAmount("");
            alert("Disbursement logged successfully!");
            fetchDisbursements();
        } catch (error) {
            console.error("Failed to log disbursement:", error);
        }
    };

    // Auto-fill selected app amount
    useEffect(() => {
        if (selectedAppId) {
            const app = applications.find(a => a.id === selectedAppId);
            if (app) {
                setDisbAmount(app.amount?.toString() || "");
                setDisbReleaseDate(format(new Date(), "yyyy-MM-dd"));
            }
        }
    }, [selectedAppId, applications]);

    if (!mounted) return null;

    return (
        <div className="min-h-screen p-8 lg:p-12 transition-all duration-300">
            <div className="max-w-7xl mx-auto space-y-10">
                
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-emerald-600 bg-emerald-50 p-2 rounded-xl">payments</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Module 04</span>
                        </div>
                        <h1 className="text-4xl font-display font-black text-gray-900 tracking-tight italic uppercase">Disbursement Workspace</h1>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                            Funds release, tranche distribution, and UTR tracking for {currentBankName}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none">
                            <input 
                                type="text" 
                                placeholder="Search student disbursals..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-6 py-3.5 w-full md:w-80 bg-white border border-gray-200 rounded-2xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-[#6605c7] focus:ring-4 focus:ring-[#6605c7]/5 shadow-sm transition-all"
                            />
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                        </div>
                    </div>
                </motion.div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: "Sanctioned Assets", value: `₹${stats.totalSanctioned.toLocaleString()}`, icon: "verified_user", color: "text-[#6605c7]", bg: "from-purple-50/50 to-white" },
                        { label: "Disbursed Capital", value: `₹${stats.totalDisbursed.toLocaleString()}`, icon: "payments", color: "text-emerald-500", bg: "from-emerald-50/30 to-white" },
                        { label: "Remaining Tranches", value: `₹${stats.pendingDisbursement.toLocaleString()}`, icon: "hourglass_empty", color: "text-amber-500 animate-pulse", bg: "from-amber-50/30 to-white" },
                        { label: "Active Student Payees", value: `${stats.activeCount} Payees`, icon: "group", color: "text-blue-500", bg: "from-blue-50/30 to-white" }
                    ].map((card, idx) => (
                        <div key={idx} className={`p-8 rounded-[2rem] border border-gray-100 bg-gradient-to-br ${card.bg} flex justify-between items-start shadow-sm`}>
                            <div className="space-y-3">
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">{card.label}</span>
                                <div className="text-2xl font-black italic text-gray-900 tracking-tight leading-none">
                                    {card.value}
                                </div>
                            </div>
                            <span className={`material-symbols-outlined text-3xl opacity-80 ${card.color}`}>{card.icon}</span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Panel: Disbursements List */}
                    <div className="lg:col-span-8 space-y-4">
                        <div className="glass-card bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-xl shadow-gray-100/20">
                            <div className="p-8 border-b border-gray-100">
                                <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">Active Tranche Schedules</h3>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Status of scheduled and completed fund releases</p>
                            </div>

                            {loading ? (
                                <div className="p-20 text-center">
                                    <div className="w-8 h-8 border-2 border-[#6605c7] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading schedules...</p>
                                </div>
                            ) : filteredDisbursals.length === 0 ? (
                                <div className="p-20 text-center space-y-4">
                                    <span className="material-symbols-outlined text-gray-200 text-5xl">payments</span>
                                    <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">No active disbursals</h3>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Approved applications pending disbursement will appear here.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {filteredDisbursals.map((app) => (
                                        <div key={app.id} className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-gray-50/50 transition-all">
                                            <div className="space-y-1">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-[#6605c7] block">
                                                    {app.applicationNumber || "APP-CODE"}
                                                </span>
                                                <h4 className="text-base font-black text-gray-950 uppercase italic tracking-tight">
                                                    {app.firstName} {app.lastName}
                                                </h4>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                    {app.universityName} • Total Sanctioned: ₹{app.amount?.toLocaleString()}
                                                </p>
                                            </div>

                                            {/* Tranche statuses */}
                                            <div className="flex flex-wrap gap-4 items-center">
                                                {app.disbursementRecords && app.disbursementRecords.length > 0 ? (
                                                    <div className="space-y-2">
                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Disbursed Releases</span>
                                                        <div className="flex gap-2">
                                                            {app.disbursementRecords.map((rec: any, idx: number) => (
                                                                <div key={idx} className="bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl text-left">
                                                                    <div className="text-[8px] font-black text-emerald-800 uppercase tracking-wider">{rec.tranche}</div>
                                                                    <div className="text-[10px] font-black text-emerald-700">₹{parseFloat(rec.amount).toLocaleString()}</div>
                                                                    <div className="text-[7px] font-bold text-gray-400 uppercase mt-0.5">UTR: {rec.utr}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl text-[9px] font-black uppercase tracking-widest animate-pulse border border-amber-100">
                                                        Awaiting Disbursement
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Confirm Disbursement Form */}
                    <div className="lg:col-span-4">
                        <div className="glass-card bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-xl shadow-gray-100/30">
                            <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-2">Execute Fund Release</h3>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed mb-6">
                                Disburse approved student loan assets and log NEFT/RTGS receipts to notify the admin and student dashboards.
                            </p>

                            <form onSubmit={handleConfirmDisbursement} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Select Approved Student</label>
                                    <select 
                                        required
                                        value={selectedAppId}
                                        onChange={(e) => setSelectedAppId(e.target.value)}
                                        className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none uppercase tracking-wider"
                                    >
                                        <option value="">-- Choose student payee --</option>
                                        {applications
                                            .filter(a => ["approved", "sanctioned", "disbursed"].includes(a.status?.toLowerCase()))
                                            .map(a => (
                                                <option key={a.id} value={a.id}>
                                                    {a.firstName} {a.lastName} ({a.applicationNumber || a.id.substring(0, 8)})
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Release Amount (₹)</label>
                                    <input 
                                        type="number"
                                        required
                                        value={disbAmount}
                                        onChange={(e) => setDisbAmount(e.target.value)}
                                        className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Tranche Number</label>
                                    <select 
                                        value={disbTranche}
                                        onChange={(e) => setDisbTranche(e.target.value)}
                                        className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none uppercase tracking-wider"
                                    >
                                        <option value="1st Tranche">1st Tranche (Semester 1)</option>
                                        <option value="2nd Tranche">2nd Tranche (Semester 2)</option>
                                        <option value="3rd Tranche">3rd Tranche (Semester 3)</option>
                                        <option value="4th Tranche">4th Tranche (Semester 4)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Mechanism Mode</label>
                                    <select 
                                        value={disbMode}
                                        onChange={(e) => setDisbMode(e.target.value)}
                                        className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none uppercase tracking-wider"
                                    >
                                        <option value="RTGS">RTGS Transfer</option>
                                        <option value="NEFT">NEFT Transfer</option>
                                        <option value="IMPS">Direct IMPS</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">UTR Receipt Number</label>
                                    <input 
                                        type="text"
                                        required
                                        placeholder="e.g. SBIN420261358913"
                                        value={disbUtr}
                                        onChange={(e) => setDisbUtr(e.target.value)}
                                        className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none uppercase tracking-widest"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Release date</label>
                                    <input 
                                        type="date"
                                        required
                                        value={disbReleaseDate}
                                        onChange={(e) => setDisbReleaseDate(e.target.value)}
                                        className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={!selectedAppId || !disbUtr.trim() || !disbAmount.trim()}
                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-md transition-all mt-4"
                                >
                                    Log Fund Release
                                </button>
                            </form>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
