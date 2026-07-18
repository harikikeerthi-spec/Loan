"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isWithinInterval, parseISO } from "date-fns";
import { adminApi, bankApi, getToken } from "@/lib/api";
import { PageHeader, DataTable, StatusBadge, PriorityTag, EmptyState, Spinner } from "@/components/bank/SharedUI";
import { useRouter } from "next/navigation";

export default function IncomingQueuePage() {
    const router = useRouter();
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
    const [activeFilterChip, setActiveFilterChip] = useState<"all" | "high_value" | "sla_close">("all");

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

    // Drawer state for View Application
    const [showViewAppDrawer, setShowViewAppDrawer] = useState(false);
    const [token, setToken] = useState<string>("");
    const [loadingDetails, setLoadingDetails] = useState(false);

    const fetchSelectedAppDetails = async (appId: string) => {
        setLoadingDetails(true);
        try {
            const [appRes, docsRes]: [any, any] = await Promise.all([
                bankApi.getFileDetail(appId),
                bankApi.getDocuments(appId)
            ]);
            if (appRes) {
                setSelectedApp((prev: any) => ({
                    ...prev,
                    ...appRes,
                    documents: docsRes || [],
                    statusHistory: appRes.statusHistory || []
                }));
            }
        } catch (err) {
            console.error("Failed to fetch full application details:", err);
        } finally {
            setLoadingDetails(false);
        }
    };

    useEffect(() => {
        if (showViewAppDrawer && selectedApp && !selectedApp.documents) {
            fetchSelectedAppDetails(selectedApp.id);
        }
    }, [showViewAppDrawer, selectedApp]);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== "undefined") {
            const saved = sessionStorage.getItem("selectedBank") || localStorage.getItem("selectedBank");
            if (saved) setCurrentBankId(saved);
            const fetchedToken = getToken();
            if (fetchedToken) setToken(fetchedToken);
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
            if (["rejected", "approved", "sanctioned", "disbursed", "disbursement_confirmed", "submitted", "pending", "draft", "docs_received", "staff_verified", "application_submitted"].includes(app.status)) return false;
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
            if (["rejected", "approved", "sanctioned", "disbursed", "disbursement_confirmed", "submitted", "pending", "draft", "docs_received", "staff_verified", "application_submitted"].includes(app.status)) return false;

            const matchesSearch =
                (app.applicationNumber || "").toLowerCase().includes(search.toLowerCase()) ||
                (`${app.firstName || ""} ${app.lastName || ""}`).toLowerCase().includes(search.toLowerCase()) ||
                (app.email || "").toLowerCase().includes(search.toLowerCase());

            if (!matchesSearch) return false;

            // Filter Chips constraints
            if (activeFilterChip === "high_value") {
                if ((app.amount || 0) <= 2500000) return false;
            } else if (activeFilterChip === "sla_close") {
                if (!app.submittedAt) return false;
                const now = new Date();
                const submittedDate = parseISO(app.submittedAt);
                const hoursDiff = (now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60);
                if (hoursDiff <= 24) return false;
            }

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
    }, [applications, search, activeFilterChip, instType, courseType, minAmount, maxAmount, startDate, endDate]);

    const handleOpenLogModal = (app: any) => {
        setSelectedApp(app);
        const bankCode = currentBankId.toUpperCase();
        const targetLen = 17;
        const prefixLen = 5 + bankCode.length;
        const digitsNeeded = Math.max(4, targetLen - prefixLen);
        const minRand = Math.pow(10, digitsNeeded - 1);
        const maxRand = Math.pow(10, digitsNeeded) - 1;
        const randNum = Math.floor(minRand + Math.random() * (maxRand - minRand));
        setLanNumber(`LAN-${bankCode}-${randNum}`);
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

        const lan = lanNumber.trim();
        if (lan.length < 15 || lan.length > 20) {
            alert("LAN number must be between 15 and 20 characters long.");
            return;
        }
        if (!/[a-zA-Z]/.test(lan) || !/\d/.test(lan) || !/-/.test(lan)) {
            alert("LAN number must contain a mix of letters, numbers, and the '-' character.");
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
            const appId = selectedApp.id || selectedApp._id;
            const res: any = await adminApi.updateApplication(appId, payload);
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
                <div className="font-mono text-gray-500 font-medium text-[13px] uppercase tracking-wider">
                    {row.applicationNumber}
                </div>
            )
        },
        {
            header: "Student Name",
            accessorKey: "firstName",
            sortable: true,
            cell: (row: any) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-[14px] text-[#111827] leading-tight font-sans">
                        {row.firstName} {row.lastName}
                    </span>
                    <span className="text-[12px] text-[#6B7280] font-normal lowercase mt-0.5 font-sans">
                        {row.email}
                    </span>
                </div>
            )
        },
        {
            header: "Institution",
            accessorKey: "universityName",
            sortable: true,
            cell: (row: any) => (
                <div>
                    <p className="font-semibold text-gray-800 text-[13px] truncate max-w-[180px] font-sans">
                        {row.universityName || "Foreign University"}
                    </p>
                    <p className="text-[10px] text-[#4F46E5] font-semibold uppercase tracking-wider mt-0.5 font-sans">
                        {row.courseName || "Master's Degree"}
                    </p>
                </div>
            )
        },
        {
            header: "Requested Amt",
            accessorKey: "amount",
            sortable: true,
            align: "right" as const,
            cell: (row: any) => (
                <span className="font-semibold text-[14px] text-[#111827] font-mono pr-4 block text-right">
                    ₹{(row.amount || 0).toLocaleString("en-IN")}
                </span>
            )
        },
        {
            header: "Submitted Date",
            accessorKey: "submittedAt",
            sortable: true,
            cell: (row: any) => (
                <div>
                    <p className="font-semibold text-gray-700 text-[13px] font-sans">
                        {row.submittedAt ? format(parseISO(row.submittedAt), "dd MMM yyyy") : "N/A"}
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">
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
                                setSelectedApp(row);
                                setShowViewAppDrawer(true);
                            }}
                            className="px-3.5 py-1.5 border border-[#D1D5DB] text-[#374151] hover:bg-[#F8F9FA] hover:text-gray-900 hover:border-gray-400 text-[10.5px] font-bold uppercase tracking-wider rounded-md transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[13px] text-gray-500">visibility</span>
                            View Application
                        </button>

                        {/* Three-dot context menu */}
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuAppId(isMenuOpen ? null : row.id);
                                }}
                                className={`p-1.5 rounded-md border text-gray-500 hover:text-[#4F46E5] hover:bg-indigo-50/50 transition-all ${isMenuOpen ? "border-indigo-200 bg-indigo-50/30" : "border-gray-200"
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
                                            className="absolute right-0 mt-1 w-44 bg-white border border-gray-150 shadow-xl rounded-md z-50 py-1.5 overflow-hidden font-sans"
                                        >
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenuAppId(null);
                                                    router.push(`/bank/documents?id=${row.id}`);
                                                }}
                                                className="w-full text-left px-3.5 py-2 hover:bg-indigo-50/30 text-[10.5px] font-bold text-gray-700 hover:text-[#4F46E5] transition-colors flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-sm text-gray-450 font-normal">folder_open</span>
                                                View Documents
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
                    moduleName="Incoming Queue"
                    icon="download"
                />                {/* KPI Cards Grid */}
                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* KPI Card 1: Total Pending Reviews */}
                    <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] flex items-center justify-between hover:shadow-[0_10px_20px_-5px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 transition-all duration-300">
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-sans">Total Pending Reviews</p>
                            <h3 className={`text-[28px] font-bold leading-none font-sans ${kpiTotalPending === 0 ? "text-[#64748B]" : "text-[#0F172A]"}`}>{kpiTotalPending}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]">
                            <span className="material-symbols-outlined text-xl">pending_actions</span>
                        </div>
                    </div>

                    {/* KPI Card 2: High Value Loans */}
                    <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] flex items-center justify-between hover:shadow-[0_10px_20px_-5px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 transition-all duration-300">
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-sans">High Value Loans (&gt; ₹25L)</p>
                            <h3 className={`text-[28px] font-bold leading-none font-sans ${kpiHighValue === 0 ? "text-[#64748B]" : "text-[#0F172A]"}`}>{kpiHighValue}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]">
                            <span className="material-symbols-outlined text-xl">payments</span>
                        </div>
                    </div>

                    {/* KPI Card 3: SLA Breached Soon */}
                    <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] flex items-center justify-between hover:shadow-[0_10px_20px_-5px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 transition-all duration-300">
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-sans">SLA Breached Soon (&gt; 24h)</p>
                            <h3 className={`text-[28px] font-bold leading-none font-sans ${kpiSlaBreached === 0 ? "text-[#64748B]" : "text-[#0F172A]"}`}>{kpiSlaBreached}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[#EAB308]/10 flex items-center justify-center text-[#EAB308]">
                            <span className="material-symbols-outlined text-xl">hourglass_bottom</span>
                        </div>
                    </div>
                </div>

                {/* Main Table Card containing Search, Chips and Table */}
                <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] p-6 space-y-6">
                    {/* Header with Title and Pill Search Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-base font-bold text-[#0F172A] font-sans">Incoming Queue</h2>
                            <p className="text-xs text-gray-500 mt-0.5 font-sans">Manage and assign LAN numbers to new loan applications</p>
                        </div>

                        {/* Pill-shaped search bar */}
                        <div className="relative w-full sm:w-72">
                            <input
                                type="text"
                                placeholder="Search student name, ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0]/50 border-0 rounded-full text-xs font-semibold focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/15 focus:border-[#3B82F6] transition-all font-sans text-slate-800 placeholder-slate-400"
                            />
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex border-b border-slate-100 pb-4">
                        <div className="bg-[#F1F5F9] p-1 rounded-xl flex items-center gap-1">
                            <button
                                onClick={() => setActiveFilterChip("all")}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-2 cursor-pointer ${activeFilterChip === "all"
                                    ? "bg-white text-[#2563EB] shadow-sm font-bold"
                                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200/40"
                                    }`}
                            >
                                {activeFilterChip === "all" && <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />}
                                All Portfolios
                            </button>
                            <button
                                onClick={() => setActiveFilterChip("high_value")}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-2 cursor-pointer ${activeFilterChip === "high_value"
                                    ? "bg-white text-[#2563EB] shadow-sm font-bold"
                                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200/40"
                                    }`}
                            >
                                {activeFilterChip === "high_value" && <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />}
                                High Value (&gt; ₹25L)
                            </button>
                            <button
                                onClick={() => setActiveFilterChip("sla_close")}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-2 cursor-pointer ${activeFilterChip === "sla_close"
                                    ? "bg-white text-[#2563EB] shadow-sm font-bold"
                                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200/40"
                                    }`}
                            >
                                {activeFilterChip === "sla_close" && <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />}
                                SLA Breached
                            </button>
                        </div>
                    </div>

                    {/* Queue Data Table */}
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
                                        onChange={(e) => setLanNumber(e.target.value.toUpperCase())}
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

            {/* View Application Drawer */}
            <AnimatePresence>
                {showViewAppDrawer && selectedApp && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/35 backdrop-blur-sm z-40"
                            onClick={() => {
                                setShowViewAppDrawer(false);
                                setSelectedApp(null);
                            }}
                        />
                        {/* Drawer body */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-full md:w-[480px] bg-white border-l border-gray-100 shadow-2xl z-50 overflow-y-auto p-8 flex flex-col justify-between font-sans"
                        >
                            <div className="space-y-6">
                                {/* Header */}
                                <div className="flex justify-between items-start border-b border-gray-100 pb-5">
                                    <div>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-[#6605c7] bg-purple-50 px-2 py-1 rounded-md">
                                            {selectedApp.applicationNumber}
                                        </span>
                                        <h2 className="text-2xl font-black text-gray-900 mt-2 uppercase tracking-tight">
                                            {selectedApp.firstName} {selectedApp.lastName}
                                        </h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                            {selectedApp.email} | {selectedApp.phone || "No phone added"}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowViewAppDrawer(false);
                                            setSelectedApp(null);
                                        }}
                                        className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-lg">close</span>
                                    </button>
                                </div>

                                {loadingDetails ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                                        <div className="w-8 h-8 border-3 border-gray-100 border-t-[#6605c7] rounded-full animate-spin" />
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Fetching details...</span>
                                    </div>
                                ) : (
                                    <>
                                        {/* SECTION 1: LOAN & EDUCATION PROGRAM */}
                                        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 space-y-3 text-left">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[#6605c7] block">Loan & Academic Program</span>
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Requested Amount</span>
                                                    <span className="font-semibold text-gray-900">₹{(selectedApp.amount || 0).toLocaleString("en-IN")}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Admission Status</span>
                                                    <span className="font-semibold text-gray-900 uppercase">{selectedApp.admissionStatus || "—"}</span>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">University Name</span>
                                                    <span className="font-semibold text-gray-900">{selectedApp.universityName || "University of Foreign Intake"}</span>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Course & Degree</span>
                                                    <span className="font-semibold text-gray-900">{selectedApp.courseName || "—"}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Duration</span>
                                                    <span className="font-semibold text-gray-900">{selectedApp.courseDuration ? `${selectedApp.courseDuration} months` : "—"}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Start Date</span>
                                                    <span className="font-semibold text-gray-900">{selectedApp.courseStartDate ? format(parseISO(selectedApp.courseStartDate), "dd MMM yyyy") : "—"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SECTION 2: STUDENT PROFILE & CONTACT */}
                                        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 space-y-3 text-left">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[#6605c7] block">Student Profile & Contact</span>
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Full Name</span>
                                                    <span className="font-semibold text-gray-900">{selectedApp.firstName} {selectedApp.lastName}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Gender</span>
                                                    <span className="font-semibold text-gray-900 capitalize">{selectedApp.gender || "—"}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Date of Birth</span>
                                                    <span className="font-semibold text-gray-900">{selectedApp.dateOfBirth ? format(parseISO(selectedApp.dateOfBirth), "dd MMM yyyy") : "—"}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Nationality</span>
                                                    <span className="font-semibold text-gray-900">{selectedApp.nationality || "—"}</span>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Email Address</span>
                                                    <span className="font-semibold text-gray-900">{selectedApp.email || "—"}</span>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Phone Number</span>
                                                    <span className="font-semibold text-gray-900">{selectedApp.phone || "—"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SECTION 3: RESIDENTIAL ADDRESS */}
                                        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 space-y-3 text-left">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[#6605c7] block">Residential Address</span>
                                            <div className="text-xs space-y-2">
                                                <div>
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Full Address</span>
                                                    <span className="font-semibold text-gray-900 block leading-normal">
                                                        {selectedApp.address || "—"}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">City</span>
                                                        <span className="font-semibold text-gray-900">{selectedApp.city || "—"}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">State</span>
                                                        <span className="font-semibold text-gray-900">{selectedApp.state || "—"}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Pincode</span>
                                                        <span className="font-semibold text-gray-900">{selectedApp.pincode || "—"}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Country</span>
                                                        <span className="font-semibold text-gray-900">{selectedApp.country || "—"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SECTION 4: STUDENT EMPLOYMENT DETAILS */}
                                        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 space-y-3 text-left">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[#6605c7] block">Employment & Income</span>
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Employment Type</span>
                                                    <span className="font-semibold text-gray-900 capitalize">{selectedApp.employmentType || "—"}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Work Experience</span>
                                                    <span className="font-semibold text-gray-900">{selectedApp.workExperience ? `${selectedApp.workExperience} months` : "—"}</span>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Employer Name</span>
                                                    <span className="font-semibold text-gray-900">{selectedApp.employerName || "—"}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Job Title</span>
                                                    <span className="font-semibold text-gray-900">{selectedApp.jobTitle || "—"}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Annual Income</span>
                                                    <span className="font-semibold text-gray-900">
                                                        {selectedApp.annualIncome ? `₹${selectedApp.annualIncome.toLocaleString("en-IN")}` : "—"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SECTION 5: CO-APPLICANT DETAILS */}
                                        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 space-y-3 text-left">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[#6605c7] block">Co-Applicant details</span>
                                            {selectedApp.hasCoApplicant || selectedApp.coApplicantName ? (
                                                <div className="grid grid-cols-2 gap-3 text-xs">
                                                    <div>
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Name</span>
                                                        <span className="font-semibold text-gray-900">{selectedApp.coApplicantName || "—"}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Relationship</span>
                                                        <span className="font-semibold text-gray-900 capitalize">{selectedApp.coApplicantRelation || "—"}</span>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Email Address</span>
                                                        <span className="font-semibold text-gray-900">{selectedApp.coApplicantEmail || "—"}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Phone Number</span>
                                                        <span className="font-semibold text-gray-900">{selectedApp.coApplicantPhone || "—"}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Annual Income</span>
                                                        <span className="font-semibold text-gray-900">
                                                            {selectedApp.coApplicantIncome ? `₹${selectedApp.coApplicantIncome.toLocaleString("en-IN")}` : "—"}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic block">No co-applicant added to this profile.</span>
                                            )}
                                        </div>

                                        {/* SECTION 6: PARENT DETAILS */}
                                        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 space-y-3 text-left">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[#6605c7] block">Parent Details</span>
                                            <div className="grid grid-cols-1 gap-3 text-xs">
                                                <div>
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Father's Name</span>
                                                    <span className="font-semibold text-gray-900 block">{selectedApp.fatherName || "—"}</span>
                                                    {(selectedApp.fatherPhone || selectedApp.fatherEmail) && (
                                                        <span className="text-[10px] text-gray-500 block mt-0.5">
                                                            {[selectedApp.fatherPhone, selectedApp.fatherEmail].filter(Boolean).join(" | ")}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="border-t border-gray-100 pt-2">
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Mother's Name</span>
                                                    <span className="font-semibold text-gray-900 block">{selectedApp.motherName || "—"}</span>
                                                    {(selectedApp.motherPhone || selectedApp.motherEmail) && (
                                                        <span className="text-[10px] text-gray-500 block mt-0.5">
                                                            {[selectedApp.motherPhone, selectedApp.motherEmail].filter(Boolean).join(" | ")}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* SECTION 7: COLLATERAL INFO */}
                                        {(selectedApp.hasCollateral || selectedApp.collateralType) && (
                                            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 space-y-3 text-left">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-[#6605c7] block">Collateral Information</span>
                                                <div className="grid grid-cols-2 gap-3 text-xs">
                                                    <div>
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Collateral Type</span>
                                                        <span className="font-semibold text-gray-900 capitalize">{selectedApp.collateralType || "—"}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Collateral Value</span>
                                                        <span className="font-semibold text-gray-900">
                                                            {selectedApp.collateralValue ? `₹${selectedApp.collateralValue.toLocaleString("en-IN")}` : "—"}
                                                        </span>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Collateral Details</span>
                                                        <span className="font-semibold text-gray-900 leading-normal block">{selectedApp.collateralDetails || "—"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Documents Package */}
                                        {/* <div className="space-y-3">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block pl-1">Document Package</span>
                                            {selectedApp.documents && selectedApp.documents.length > 0 ? (
                                                <div className="space-y-2">
                                                    {selectedApp.documents.map((doc: any) => (
                                                        <div
                                                            key={doc.id}
                                                            className="flex justify-between items-center p-3 rounded-xl border border-gray-100 bg-white shadow-sm hover:border-[#6605c7]/10 transition-all"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className="material-symbols-outlined text-gray-400 text-lg">description</span>
                                                                <div>
                                                                    <span className="text-[10px] font-black text-gray-700 block uppercase tracking-wider truncate max-w-[220px]">
                                                                        {doc.docType || "Uploaded Document"}
                                                                    </span>
                                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                                                                        Status: {doc.status || "uploaded"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {doc.status !== 'not_uploaded' && (
                                                                <a
                                                                    href={`/api/applications/admin/${selectedApp.id}/documents/${doc.id}/view?token=${token}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="px-3 py-1.5 bg-gray-50 border border-gray-100 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-[#6605c7]/5 hover:text-[#6605c7] hover:border-[#6605c7]/10 transition-all flex items-center gap-1"
                                                                >
                                                                    <span className="material-symbols-outlined text-xs">download</span> View
                                                                </a>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-4 border border-dashed border-gray-100 rounded-xl text-center">
                                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest">No documents found.</span>
                                                </div>
                                            )}
                                        </div> */}

                                        {/* Activity Notes/Remarks */}
                                        <div className="space-y-3 border-t border-gray-100 pt-5">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block pl-1">Underwriting Activity Notes</span>
                                            {selectedApp.remarks ? (
                                                <div className="bg-gray-50 rounded-2xl p-4 max-h-40 overflow-y-auto space-y-3 border border-gray-100">
                                                    {selectedApp.remarks.split('\n').map((rem: string, idx: number) => (
                                                        <div key={idx} className="text-[10px] font-medium text-gray-600 border-b border-gray-100/50 pb-2 last:border-0 leading-relaxed">
                                                            {rem}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-gray-50 rounded-xl text-center">
                                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest">No internal notes.</span>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {/* {!loadingDetails && (
                                <div className="border-t border-gray-100 pt-6 flex flex-col gap-3 mt-6">
                                    {!selectedApp.lanNumber && (
                                        <button
                                            onClick={() => {
                                                setShowViewAppDrawer(false);
                                                handleOpenLogModal(selectedApp);
                                            }}
                                            className="w-full py-4 bg-[#6605c7] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-purple-500/20 hover:bg-[#5203a4] transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-lg">note_add</span> Log File (Enter LAN)
                                        </button>
                                    )}
                                </div>
                            )} */}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
