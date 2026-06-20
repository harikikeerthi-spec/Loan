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

    // Staged/Temporary Filter States for explicit Apply Filters action
    const [tempSearch, setTempSearch] = useState("");
    const [tempInstType, setTempInstType] = useState("all");
    const [tempCourseType, setTempCourseType] = useState("all");
    const [tempMinAmount, setTempMinAmount] = useState("");
    const [tempMaxAmount, setTempMaxAmount] = useState("");
    const [tempStartDate, setTempStartDate] = useState("");
    const [tempEndDate, setTempEndDate] = useState("");

    // Collapsible states
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);

    // Context menu tracking state
    const [activeMenuAppId, setActiveMenuAppId] = useState<string | null>(null);

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

    // SLA & KPI stats calculations
    const incomingApps = useMemo(() => {
        return applications.filter((app) => {
            if (app.lanNumber) return false;
            if (["rejected", "approved", "disbursed", "submitted", "pending", "draft", "docs_received", "staff_verified", "application_submitted"].includes(app.status)) return false;
            return true;
        });
    }, [applications]);

    const kpiTotalPending = useMemo(() => incomingApps.length, [incomingApps]);

    const kpiHighValue = useMemo(() => {
        return incomingApps.filter(app => (app.amount || 0) > 2500000).length;
    }, [incomingApps]);

    const kpiSlaBreached = useMemo(() => {
        const now = new Date();
        return incomingApps.filter(app => {
            if (!app.submittedAt) return false;
            const submittedDate = parseISO(app.submittedAt);
            const hoursDiff = (now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60);
            return hoursDiff > 24;
        }).length;
    }, [incomingApps]);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (search) count++;
        if (instType !== "all") count++;
        if (courseType !== "all") count++;
        if (minAmount) count++;
        if (maxAmount) count++;
        if (startDate) count++;
        if (endDate) count++;
        return count;
    }, [search, instType, courseType, minAmount, maxAmount, startDate, endDate]);

    // Apply staged inputs
    const handleApplyFilters = () => {
        setSearch(tempSearch);
        setInstType(tempInstType);
        setCourseType(tempCourseType);
        setMinAmount(tempMinAmount);
        setMaxAmount(tempMaxAmount);
        setStartDate(tempStartDate);
        setEndDate(tempEndDate);
    };

    // Reset staged inputs
    const handleResetFilters = () => {
        setTempSearch("");
        setTempInstType("all");
        setTempCourseType("all");
        setTempMinAmount("");
        setTempMaxAmount("");
        setTempStartDate("");
        setTempEndDate("");

        setSearch("");
        setInstType("all");
        setCourseType("all");
        setMinAmount("");
        setMaxAmount("");
        setStartDate("");
        setEndDate("");
    };

    // Apply Filter Bar inputs (Task 6)
    const filteredApps = useMemo(() => {
        return applications.filter((app) => {
            // Must not have a LAN to be in "Incoming Queue"
            if (app.lanNumber) return false;
            if (["rejected", "approved", "disbursed", "submitted", "pending", "draft", "docs_received", "staff_verified", "application_submitted"].includes(app.status)) return false;

            const matchesSearch =
                (app.applicationNumber || "").toLowerCase().includes(search.toLowerCase()) ||
                (`${app.firstName || ""} ${app.lastName || ""}`).toLowerCase().includes(search.toLowerCase()) ||
                (app.email || "").toLowerCase().includes(search.toLowerCase());

            if (!matchesSearch) return false;

            // Institution type filter
            if (instType !== "all") {
                const uniName = (app.universityName || "").toLowerCase();
                const isInt = uniName.includes("university") || uniName.includes("college") || uniName.includes("institute");
                if (instType === "international" && !isInt) return false;
                if (instType === "private" && isInt) return false;
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

        if (selectedApp.lanNumber) {
            alert("LAN number has already been assigned and cannot be changed.");
            return;
        }

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
                status: "file_logged",
                remarks: mergedRemarks
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
                    <p className="text-[9px] text-gray-400/80 font-medium lowercase block mt-0.5">
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
                    <p className="text-[9px] text-purple-650 font-semibold uppercase tracking-wider">
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
                <span className="font-extrabold text-sm text-gray-900 font-mono">
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
            cell: (row: any) => {
                const isMenuOpen = activeMenuAppId === row.id;
                return (
                    <div className="flex items-center gap-2 relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenLogModal(row);
                            }}
                            className="px-3.5 py-1.5 bg-[#111111] hover:bg-black text-white border border-white/10 text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-md hover:shadow-black/10 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                        >
                            <span className="material-symbols-outlined text-[13px]">note_add</span>
                            Log File
                        </button>

                        {/* Three-dot context menu */}
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuAppId(isMenuOpen ? null : row.id);
                                }}
                                className={`p-1.5 rounded-xl border text-gray-500 hover:text-[#6605c7] hover:bg-purple-50 transition-all ${
                                    isMenuOpen ? "border-purple-200 bg-purple-50/50" : "border-gray-200"
                                }`}
                            >
                                <span className="material-symbols-outlined text-base block">more_vert</span>
                            </button>

                            <AnimatePresence>
                                {isMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-45" onClick={() => setActiveMenuAppId(null)} />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                            className="absolute right-0 mt-1 w-44 bg-white border border-purple-50 shadow-xl rounded-xl z-50 py-1.5 overflow-hidden"
                                        >
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenuAppId(null);
                                                    alert(`Viewing documents for: ${row.firstName} ${row.lastName} (${row.applicationNumber})`);
                                                }}
                                                className="w-full text-left px-3.5 py-2 hover:bg-purple-50/55 text-[10.5px] font-bold text-gray-700 hover:text-[#6605c7] transition-colors flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-sm">folder_open</span>
                                                View Documents
                                            </button>

                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    setActiveMenuAppId(null);
                                                    try {
                                                        const remarkText = `[Bank System - Quick Action]: Assigned to self`;
                                                        const payload = {
                                                            remarks: row.remarks ? `${row.remarks}\n${remarkText}` : remarkText
                                                        };
                                                        const res: any = await adminApi.updateApplication(row.id, payload);
                                                        if (res && res.success) {
                                                            alert(`Application ${row.applicationNumber} assigned to self.`);
                                                            fetchApplications(currentBankId);
                                                        }
                                                    } catch (err) {
                                                        console.error("Failed to assign application to self:", err);
                                                    }
                                                }}
                                                className="w-full text-left px-3.5 py-2 hover:bg-purple-50/55 text-[10.5px] font-bold text-gray-700 hover:text-[#6605c7] transition-colors flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-sm">person_add</span>
                                                Assign to Self
                                            </button>

                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    setActiveMenuAppId(null);
                                                    try {
                                                        const remarkText = `[Bank System - Flagged]: Marked as flagged by bank auditor`;
                                                        const payload = {
                                                            remarks: row.remarks ? `${row.remarks}\n${remarkText}` : remarkText
                                                        };
                                                        const res: any = await adminApi.updateApplication(row.id, payload);
                                                        if (res && res.success) {
                                                            alert(`Application ${row.applicationNumber} flagged successfully.`);
                                                            fetchApplications(currentBankId);
                                                        }
                                                    } catch (err) {
                                                        console.error("Failed to flag application:", err);
                                                    }
                                                }}
                                                className="w-full text-left px-3.5 py-2 hover:bg-rose-50/55 text-[10.5px] font-bold text-rose-650 hover:text-rose-700 transition-colors flex items-center gap-2 border-t border-gray-100"
                                            >
                                                <span className="material-symbols-outlined text-sm text-rose-500">flag</span>
                                                Flag Application
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                );
            }
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

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* KPI Card 1: Total Pending Reviews */}
                    <div className="glass-card bg-white/70 p-6 rounded-3xl border border-purple-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-purple-650 uppercase tracking-widest">Total Pending Reviews</p>
                            <h3 className="text-3xl font-display font-black text-gray-900">{kpiTotalPending}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-[#6605c7]">
                            <span className="material-symbols-outlined text-2xl">pending_actions</span>
                        </div>
                    </div>

                    {/* KPI Card 2: High Value Loans */}
                    <div className="glass-card bg-white/70 p-6 rounded-3xl border border-purple-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-purple-650 uppercase tracking-widest">High Value Loans (&gt; ₹25L)</p>
                            <h3 className="text-3xl font-display font-black text-gray-900">{kpiHighValue}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                            <span className="material-symbols-outlined text-2xl">payments</span>
                        </div>
                    </div>

                    {/* KPI Card 3: SLA Breached Soon */}
                    <div className="glass-card bg-white/70 p-6 rounded-3xl border border-purple-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-purple-650 uppercase tracking-widest">SLA Breached Soon (&gt; 24h)</p>
                            <h3 className="text-3xl font-display font-black text-gray-900">{kpiSlaBreached}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
                            <span className="material-symbols-outlined text-2xl">hourglass_bottom</span>
                        </div>
                    </div>
                </div>

                {/* Filter Bar (Task 6) */}
                <div className="glass-card bg-white/70 rounded-3xl border border-[#6605c7]/10 shadow-sm overflow-hidden">
                    {/* Header row */}
                    <div 
                        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                        className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-[#6605c7]">filter_alt</span>
                            <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">
                                Search Filters
                            </h3>
                            {activeFiltersCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[8.5px] font-extrabold bg-[#6605c7] text-white">
                                    {activeFiltersCount} Active
                                </span>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleResetFilters();
                                }}
                                className="text-[10px] font-black text-purple-650 uppercase tracking-wider hover:underline"
                            >
                                Reset Filters
                            </button>
                            <span className="material-symbols-outlined text-gray-400 text-lg transition-transform duration-300" style={{ transform: isFiltersOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                                expand_more
                            </span>
                        </div>
                    </div>

                    {/* Collapsible Content */}
                    <AnimatePresence>
                        {isFiltersOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                            >
                                <div className="p-5 pt-0 border-t border-gray-100/60 space-y-4">
                                    {/* Primary Row */}
                                    <div className="flex flex-col md:flex-row items-end gap-3.5">
                                        {/* Keyword Search */}
                                        <div className="relative flex-1 min-w-0">
                                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Search student / ID</label>
                                            <input
                                                type="text"
                                                placeholder="Name, Email or Application Number..."
                                                value={tempSearch}
                                                onChange={(e) => setTempSearch(e.target.value)}
                                                className="pl-9 pr-4 py-2 w-full bg-white border border-gray-205 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] shadow-sm transition-all"
                                            />
                                            <span className="material-symbols-outlined absolute left-3 top-[23px] text-gray-400 text-base">search</span>
                                        </div>

                                        {/* Institution Group */}
                                        <div className="w-full md:w-52">
                                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Institution Group</label>
                                            <select
                                                value={tempInstType}
                                                onChange={(e) => setTempInstType(e.target.value)}
                                                className="px-3 py-2 w-full bg-white border border-gray-205 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] shadow-sm transition-all"
                                            >
                                                <option value="all">All Institutions</option>
                                                <option value="international">International / Universities</option>
                                                <option value="private">Private Colleges</option>
                                            </select>
                                        </div>

                                        {/* Course Sector */}
                                        <div className="w-full md:w-52">
                                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Course Sector</label>
                                            <select
                                                value={tempCourseType}
                                                onChange={(e) => setTempCourseType(e.target.value)}
                                                className="px-3 py-2 w-full bg-white border border-gray-205 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] shadow-sm transition-all"
                                            >
                                                <option value="all">All Degrees</option>
                                                <option value="stem">STEM Fields</option>
                                                <option value="mba">MBA & Business</option>
                                                <option value="ug">Undergraduate (UG)</option>
                                                <option value="pg">Postgraduate (PG)</option>
                                            </select>
                                        </div>

                                        {/* Action buttons inside the inline row */}
                                        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                                            <button
                                                onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
                                                className="px-3 py-2 border border-purple-100 text-purple-650 hover:bg-purple-50/50 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1 transition-all"
                                            >
                                                <span className="material-symbols-outlined text-sm">tune</span>
                                                {isAdvancedFiltersOpen ? "Hide Advanced" : "Advanced"}
                                            </button>
                                            <button
                                                onClick={handleApplyFilters}
                                                className="px-4 py-2 bg-[#111111] hover:bg-black text-white border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1 transition-all shadow-sm"
                                            >
                                                <span className="material-symbols-outlined text-sm">done</span>
                                                Apply Filters
                                            </button>
                                        </div>
                                    </div>

                                    {/* Advanced/Secondary Filters Row */}
                                    <AnimatePresence>
                                        {isAdvancedFiltersOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                                className="pt-3 border-t border-dashed border-gray-100 flex flex-wrap gap-4"
                                            >
                                                {/* Date Range Start */}
                                                <div className="flex-1 min-w-[150px]">
                                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">From Date</label>
                                                    <input
                                                        type="date"
                                                        value={tempStartDate}
                                                        onChange={(e) => setTempStartDate(e.target.value)}
                                                        className="px-3 py-1.5 w-full bg-white border border-gray-205 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] shadow-sm transition-all"
                                                    />
                                                </div>

                                                {/* Date Range End */}
                                                <div className="flex-1 min-w-[150px]">
                                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">To Date</label>
                                                    <input
                                                        type="date"
                                                        value={tempEndDate}
                                                        onChange={(e) => setTempEndDate(e.target.value)}
                                                        className="px-3 py-1.5 w-full bg-white border border-gray-205 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] shadow-sm transition-all"
                                                    />
                                                </div>

                                                {/* Min Amount */}
                                                <div className="flex-1 min-w-[150px]">
                                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Min Amount (₹)</label>
                                                    <input
                                                        type="number"
                                                        placeholder="e.g. 500000"
                                                        value={tempMinAmount}
                                                        onChange={(e) => setTempMinAmount(e.target.value)}
                                                        className="px-3 py-1.5 w-full bg-white border border-gray-205 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] shadow-sm transition-all"
                                                    />
                                                </div>

                                                {/* Max Amount */}
                                                <div className="flex-1 min-w-[150px]">
                                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Max Amount (₹)</label>
                                                    <input
                                                        type="number"
                                                        placeholder="e.g. 2500000"
                                                        value={tempMaxAmount}
                                                        onChange={(e) => setTempMaxAmount(e.target.value)}
                                                        className="px-3 py-1.5 w-full bg-white border border-gray-205 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] shadow-sm transition-all"
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
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
                                                className={`py-2 px-3 border rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${priority === p
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
                                {/* <div>
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
                                </div> */}

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
