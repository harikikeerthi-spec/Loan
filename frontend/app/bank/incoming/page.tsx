"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isWithinInterval, parseISO } from "date-fns";
import { adminApi } from "@/lib/api";
import { PageHeader, DataTable, StatusBadge, PriorityTag, EmptyState, Spinner } from "@/components/bank/SharedUI";

export default function IncomingQueuePage() {
    const [mounted, setMounted] = useState(false);
    const [currentBankId, setCurrentBankId] = useState("idfc");
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [officers, setOfficers] = useState<string[]>([
        "Sarah Jenkins (Senior Underwriter)",
        "David Lee (Credit Analyst)",
        "Amanda Vance (Risk Assessor)",
        "Rajesh Patel (Loan Manager)"
    ]);

    // Filters
    const [search, setSearch] = useState("");
    const [instType, setInstType] = useState("all");
    const [courseType, setCourseType] = useState("all");
    const [minAmount, setMinAmount] = useState("");
    const [maxAmount, setMaxAmount] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Modal state for Log File (F3)
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [showLogModal, setShowLogModal] = useState(false);
    const [lanNumber, setLanNumber] = useState("");
    const [priority, setPriority] = useState("medium");
    const [assignedOfficer, setAssignedOfficer] = useState("");
    const [confirmingLog, setConfirmingLog] = useState(false);
    const [savingLog, setSavingLog] = useState(false);

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
                // Filter out already logged files (i.e. those with a LAN number) or rejected/approved
                const rawApps = res.data || [];
                setApplications(rawApps);
            }
        } catch (err) {
            console.error("Failed to load incoming applications:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) {
            fetchApplications(currentBankId);
        }
    }, [currentBankId, mounted]);

    // Apply Filter Bar inputs (Task 6)
    const filteredApps = useMemo(() => {
        return applications.filter((app) => {
            // Must not have a LAN to be in "Incoming Queue"
            if (app.lanNumber) return false;
            if (app.status === "rejected" || app.status === "approved" || app.status === "disbursed") return false;

            const matchesSearch = 
                (app.applicationNumber || "").toLowerCase().includes(search.toLowerCase()) ||
                (`${app.firstName || ""} ${app.lastName || ""}`).toLowerCase().includes(search.toLowerCase()) ||
                (app.email || "").toLowerCase().includes(search.toLowerCase());

            if (!matchesSearch) return false;

            // Institution type filter (mocked mapping if not present on application schema)
            if (instType !== "all") {
                const uniName = (app.universityName || "").toLowerCase();
                const isInt = uniName.includes("university") || uniName.includes("college") || uniName.includes("institute");
                if (instType === "international" && !isInt) return false;
                if (instType === "private" && isInt) return false; // simple demo split
            }

            // Course type filter
            if (courseType !== "all") {
                const courseName = (app.courseName || "").toLowerCase();
                if (courseType === "stem" && !courseName.includes("science") && !courseName.includes("computer") && !courseName.includes("engineering") && !courseName.includes("technology")) return false;
                if (courseType === "mba" && !courseName.includes("mba") && !courseName.includes("business") && !courseName.includes("management")) return false;
                if (courseType === "ug" && courseName.includes("master")) return false;
                if (courseType === "pg" && !courseName.includes("master") && !courseName.includes("postgrad")) return false;
            }

            // Amount Range
            const amount = app.amount || 0;
            if (minAmount && amount < parseFloat(minAmount)) return false;
            if (maxAmount && amount > parseFloat(maxAmount)) return false;

            // Date Range
            if (startDate || endDate) {
                const appDate = app.submittedAt ? parseISO(app.submittedAt) : new Date();
                const start = startDate ? parseISO(startDate) : parseISO("2000-01-01");
                const end = endDate ? parseISO(endDate) : parseISO("2100-01-01");
                if (!isWithinInterval(appDate, { start, end })) return false;
            }

            return true;
        });
    }, [applications, search, instType, courseType, minAmount, maxAmount, startDate, endDate]);

    const handleOpenLogModal = (app: any) => {
        setSelectedApp(app);
        setLanNumber(`LAN-${currentBankId.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`);
        setPriority("medium");
        setAssignedOfficer(officers[0]);
        setConfirmingLog(false);
        setShowLogModal(true);
    };

    const handleSaveLogFile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedApp || !lanNumber.trim()) return;

        if (!confirmingLog) {
            setConfirmingLog(true);
            return;
        }

        setSavingLog(true);
        try {
            const remarkText = `[Bank System - Logged]: Assigned LAN: ${lanNumber.trim()} (Priority: ${priority.toUpperCase()}) to officer ${assignedOfficer}`;
            const mergedRemarks = selectedApp.remarks 
                ? `${selectedApp.remarks}\n${remarkText}`
                : remarkText;

            const payload = {
                lanNumber: lanNumber.trim(),
                lanEnteredAt: new Date().toISOString(),
                stage: "under_review",
                status: "processing",
                remarks: mergedRemarks
                // If priority/officer columns exist on backend we can pass them, else they persist in remarks
            };
            const res: any = await adminApi.updateApplication(selectedApp.id, payload);
            if (res && res.success) {
                setShowLogModal(false);
                setSelectedApp(null);
                fetchApplications(currentBankId);
            }
        } catch (err) {
            console.error("Error logging application file:", err);
            alert("Failed to log file. Try again.");
        } finally {
            setSavingLog(false);
            setConfirmingLog(false);
        }
    };

    const columns = [
        {
            header: "Application ID",
            accessorKey: "applicationNumber",
            sortable: true,
            cell: (row: any) => (
                <div className="font-mono text-gray-500 font-bold uppercase tracking-wider">
                    {row.applicationNumber}
                </div>
            )
        },
        {
            header: "Student Name",
            accessorKey: "firstName",
            sortable: true,
            cell: (row: any) => (
                <div>
                    <p className="font-black text-gray-900 uppercase tracking-tight">
                        {row.firstName} {row.lastName}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium lowercase">
                        {row.email}
                    </p>
                </div>
            )
        },
        {
            header: "Institution",
            accessorKey: "universityName",
            sortable: true,
            cell: (row: any) => (
                <div>
                    <p className="font-bold text-gray-800 text-[11px] truncate max-w-[180px]">
                        {row.universityName || "Foreign University"}
                    </p>
                    <p className="text-[9px] text-purple-600 font-semibold uppercase tracking-wider">
                        {row.courseName || "Master's Degree"}
                    </p>
                </div>
            )
        },
        {
            header: "Requested Amt",
            accessorKey: "amount",
            sortable: true,
            cell: (row: any) => (
                <span className="font-black text-[#6605c7] font-display">
                    ₹{(row.amount || 0).toLocaleString()}
                </span>
            )
        },
        {
            header: "Submitted Date",
            accessorKey: "submittedAt",
            sortable: true,
            cell: (row: any) => (
                <div>
                    <p className="font-bold text-gray-700">
                        {row.submittedAt ? format(parseISO(row.submittedAt), "dd MMM yyyy") : "N/A"}
                    </p>
                    <p className="text-[9px] text-gray-400 font-mono">
                        {row.submittedAt ? format(parseISO(row.submittedAt), "HH:mm:ss") : ""}
                    </p>
                </div>
            )
        },
        {
            header: "Audit Verdict",
            accessorKey: "status",
            sortable: false,
            cell: (row: any) => <StatusBadge status={row.status || "pending"} />
        },
        {
            header: "Actions",
            accessorKey: "actions",
            sortable: false,
            cell: (row: any) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleOpenLogModal(row);
                    }}
                    className="px-4 py-2 bg-[#6605c7] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#5203a4] transition-all shadow-md shadow-purple-500/10 flex items-center gap-1.5"
                >
                    <span className="material-symbols-outlined text-[14px]">note_add</span>
                    Log File
                </button>
            )
        }
    ];

    if (!mounted) return null;

    return (
        <div className="min-h-screen p-6 lg:p-10 transition-all duration-300">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Page Header */}
                <PageHeader 
                    title="Incoming Loan Files"
                    description="Incoming loan portfolios from VidyaLoans system awaiting validation and assignation of LAN."
                    moduleName="Module 02 • Incoming Queue"
                    icon="download"
                />

                {/* Filter Bar (Task 6) */}
                <div className="glass-card bg-white/70 p-6 rounded-3xl border border-[#6605c7]/10 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-[#6605c7]">filter_alt</span>
                            Search Filters
                        </h3>
                        <button 
                            onClick={() => {
                                setSearch(""); setInstType("all"); setCourseType("all");
                                setMinAmount(""); setMaxAmount(""); setStartDate(""); setEndDate("");
                            }}
                            className="text-[10px] font-black text-purple-600 uppercase tracking-wider hover:underline"
                        >
                            Reset Filters
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {/* Keyword Search */}
                        <div className="relative">
                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Search student / ID</label>
                            <input 
                                type="text"
                                placeholder="Name, Email or Application Number..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-2.5 w-full bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] shadow-sm transition-all"
                            />
                            <span className="material-symbols-outlined absolute left-3 top-[25px] text-gray-400 text-base">search</span>
                        </div>

                        {/* Institution Type */}
                        <div>
                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Institution Group</label>
                            <select
                                value={instType}
                                onChange={(e) => setInstType(e.target.value)}
                                className="px-3 py-2.5 w-full bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] shadow-sm transition-all"
                            >
                                <option value="all">All Institutions</option>
                                <option value="international">International / Universities</option>
                                <option value="private">Private Colleges</option>
                            </select>
                        </div>

                        {/* Course Type */}
                        <div>
                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Course Sector</label>
                            <select
                                value={courseType}
                                onChange={(e) => setCourseType(e.target.value)}
                                className="px-3 py-2.5 w-full bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] shadow-sm transition-all"
                            >
                                <option value="all">All Degrees</option>
                                <option value="stem">STEM Fields</option>
                                <option value="mba">MBA & Business</option>
                                <option value="ug">Undergraduate (UG)</option>
                                <option value="pg">Postgraduate (PG)</option>
                            </select>
                        </div>

                        {/* Date Range Start */}
                        <div>
                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">From Date</label>
                            <input 
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-3 py-2 w-full bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] shadow-sm transition-all"
                            />
                        </div>

                        {/* Date Range End */}
                        <div>
                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">To Date</label>
                            <input 
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-3 py-2 w-full bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] shadow-sm transition-all"
                            />
                        </div>

                        {/* Min Amount */}
                        <div>
                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Min Amount (₹)</label>
                            <input 
                                type="number"
                                placeholder="e.g. 500000"
                                value={minAmount}
                                onChange={(e) => setMinAmount(e.target.value)}
                                className="px-3 py-2.5 w-full bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] shadow-sm transition-all"
                            />
                        </div>

                        {/* Max Amount */}
                        <div>
                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Max Amount (₹)</label>
                            <input 
                                type="number"
                                placeholder="e.g. 2500000"
                                value={maxAmount}
                                onChange={(e) => setMaxAmount(e.target.value)}
                                className="px-3 py-2.5 w-full bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] shadow-sm transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Queue Data Table */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 p-6">
                    {loading ? (
                        <Spinner message="Retrieving incoming application pool..." />
                    ) : (
                        <DataTable 
                            data={filteredApps}
                            columns={columns}
                            emptyMessage="All clear! No incoming files in the queue needing LAN assignation."
                            defaultSortKey="submittedAt"
                        />
                    )}
                </div>
            </div>

            {/* Log File Modal (Task 9) */}
            <AnimatePresence>
                {showLogModal && selectedApp && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowLogModal(false)} />
                        
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl p-8 max-w-md w-full z-10 relative overflow-hidden"
                        >
                            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Log File / Assign LAN</h3>
                            <p className="text-xs text-gray-400 mb-6 font-bold uppercase tracking-wider">Acknowledge file receipt and assign credit underwriting parameters.</p>

                            <form onSubmit={handleSaveLogFile} className="space-y-5">
                                {/* LAN Number */}
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Loan Account Number (LAN)</label>
                                    <input 
                                        type="text"
                                        required
                                        value={lanNumber}
                                        onChange={(e) => setLanNumber(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#6605c7]"
                                    />
                                </div>

                                {/* Priority Level */}
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Priority Level</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {["low", "medium", "high"].map((p) => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setPriority(p)}
                                                className={`py-2 px-3 border rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                                    priority === p 
                                                        ? p === "high" 
                                                            ? "border-rose-500 bg-rose-50 text-rose-600"
                                                            : p === "medium"
                                                                ? "border-amber-500 bg-amber-50 text-amber-600"
                                                                : "border-emerald-500 bg-emerald-50 text-emerald-600"
                                                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Officer Assignment */}
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Assign Credit Officer</label>
                                    <select
                                        value={assignedOfficer}
                                        onChange={(e) => setAssignedOfficer(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#6605c7]"
                                    >
                                        {officers.map((off) => (
                                            <option key={off} value={off}>
                                                {off}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Confirmation Step */}
                                {confirmingLog && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        className="p-4 bg-purple-50 border border-purple-100 rounded-2xl text-[11px] text-purple-700 font-medium leading-relaxed"
                                    >
                                        <p className="font-black uppercase tracking-wider text-[9px] mb-1">Confirm Configuration</p>
                                        <p>You are assigning LAN <span className="font-bold font-mono">{lanNumber}</span> to <strong>{assignedOfficer}</strong>. This file will move to active audit queues.</p>
                                    </motion.div>
                                )}

                                <div className="flex gap-4 pt-3">
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            if (confirmingLog) setConfirmingLog(false);
                                            else setShowLogModal(false);
                                        }}
                                        className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                                    >
                                        {confirmingLog ? "Back" : "Cancel"}
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={savingLog}
                                        className="flex-1 py-3 bg-[#6605c7] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#5203a4] shadow-lg shadow-purple-500/10 transition-all flex items-center justify-center"
                                    >
                                        {savingLog ? "Saving..." : confirmingLog ? "Confirm Log" : "Log File"}
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
