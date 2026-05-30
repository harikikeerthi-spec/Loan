"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInDays, parseISO } from "date-fns";
import { adminApi } from "@/lib/api";
import { DataTable, StatusBadge, PriorityTag } from "@/components/bank/SharedUI";

export default function ApplicationManagement() {
    const [mounted, setMounted] = useState(false);
    const [currentBankId, setCurrentBankId] = useState<string>("idfc");
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<"incoming" | "active" | "sanctioned" | "rejected">("incoming");
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [showLanModal, setShowLanModal] = useState(false);
    const [showDecisionModal, setShowDecisionModal] = useState(false);

    // Form states
    const [lanNumber, setLanNumber] = useState("");
    const [decisionType, setDecisionType] = useState<"sanctioned" | "conditional" | "counter" | "rejected">("sanctioned");
    const [sanctionAmount, setSanctionAmount] = useState("");
    const [sanctionedInterestRate, setSanctionedInterestRate] = useState("");
    const [roiType, setRoiType] = useState("floating");
    const [roiBase, setRoiBase] = useState("");
    const [roiSubsidy, setRoiSubsidy] = useState("0");
    const [roiEffective, setRoiEffective] = useState("");
    const [processingFee, setProcessingFee] = useState("");
    const [sanctionLetterUrl, setSanctionLetterUrl] = useState("");
    const [conditions, setConditions] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");
    
    // Counter offer terms
    const [counterAmount, setCounterAmount] = useState("");
    const [counterRate, setCounterRate] = useState("");
    const [counterTenure, setCounterTenure] = useState("");

    // Message/remarks state
    const [newRemark, setNewRemark] = useState("");
    const [remarksLoading, setRemarksLoading] = useState(false);

    // Advanced Log File Modal states (Task 9)
    const [priority, setPriority] = useState("medium");
    const [assignedOfficer, setAssignedOfficer] = useState("Sarah Jenkins (Senior Underwriter)");
    const [confirmingLog, setConfirmingLog] = useState(false);
    const [officers] = useState<string[]>([
        "Sarah Jenkins (Senior Underwriter)",
        "David Lee (Credit Analyst)",
        "Amanda Vance (Risk Assessor)",
        "Rajesh Patel (Loan Manager)"
    ]);

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
            console.error("Failed to load applications:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) {
            fetchApplications(currentBankId);
        }
    }, [currentBankId, mounted]);

    // Handle updates in background or polling
    const handleRefresh = () => {
        fetchApplications(currentBankId);
        if (selectedApp) {
            // refresh selected application detail
            adminApi.getApplication(selectedApp.id).then((res: any) => {
                if (res && res.success) setSelectedApp(res.data);
            });
        }
    };

    // Filter applications
    const filteredApps = useMemo(() => {
        return applications.filter(app => {
            const matchesSearch = 
                (app.applicationNumber || "").toLowerCase().includes(search.toLowerCase()) ||
                (`${app.firstName || ""} ${app.lastName || ""}`).toLowerCase().includes(search.toLowerCase()) ||
                (app.email || "").toLowerCase().includes(search.toLowerCase());
            
            if (!matchesSearch) return false;

            const hasLan = !!app.lanNumber;
            const status = app.status;

            if (activeTab === "incoming") {
                return !hasLan && status !== "rejected" && status !== "approved" && status !== "disbursed";
            }
            if (activeTab === "active") {
                return hasLan && status !== "rejected" && status !== "approved" && status !== "disbursed";
            }
            if (activeTab === "sanctioned") {
                return status === "approved" || status === "disbursed";
            }
            if (activeTab === "rejected") {
                return status === "rejected";
            }
            return true;
        });
    }, [applications, activeTab, search]);

    // Group counts
    const tabCounts = useMemo(() => {
        const counts = { incoming: 0, active: 0, sanctioned: 0, rejected: 0 };
        applications.forEach(app => {
            const hasLan = !!app.lanNumber;
            const status = app.status;
            if (!hasLan && status !== "rejected" && status !== "approved" && status !== "disbursed") {
                counts.incoming++;
            } else if (hasLan && status !== "rejected" && status !== "approved" && status !== "disbursed") {
                counts.active++;
            } else if (status === "approved" || status === "disbursed") {
                counts.sanctioned++;
            } else if (status === "rejected") {
                counts.rejected++;
            }
        });
        return counts;
    }, [applications]);

    const handleLogFile = async (e: React.FormEvent) => {
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
            };
            const res: any = await adminApi.updateApplication(selectedApp.id, payload);
            if (res && res.success) {
                setShowLanModal(false);
                setLanNumber("");
                setConfirmingLog(false);
                // Refresh list & drawer
                handleRefresh();
            }
        } catch (err) {
            console.error("Error logging file:", err);
            alert("Failed to log file");
        }
    };

    const handleDecision = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedApp) return;

        try {
            let payload: any = {};
            if (decisionType === "sanctioned") {
                payload = {
                    status: "approved",
                    stage: "sanction",
                    progress: 90,
                    approvedAt: new Date().toISOString(),
                    sanctionAmount: sanctionAmount ? parseFloat(sanctionAmount) : selectedApp.amount,
                    sanctionedInterestRate: sanctionedInterestRate ? parseFloat(sanctionedInterestRate) : null,
                    roiType,
                    roiBase: roiBase ? parseFloat(roiBase) : null,
                    roiSubsidy: roiSubsidy ? parseFloat(roiSubsidy) : null,
                    roiEffective: roiEffective ? parseFloat(roiEffective) : null,
                    processingFee: processingFee ? parseFloat(processingFee) : null,
                    sanctionDate: new Date().toISOString(),
                    sanctionExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months
                    sanctionLetterUrl: sanctionLetterUrl.trim() || "/docs/mock-sanction.pdf"
                };
            } else if (decisionType === "rejected") {
                payload = {
                    status: "rejected",
                    rejectedAt: new Date().toISOString(),
                    progress: 0,
                    rejectionReason: rejectionReason.trim() || "Does not meet standard credit score criteria"
                };
            } else if (decisionType === "conditional") {
                payload = {
                    status: "processing",
                    stage: "conditional_sanction",
                    remarks: `Conditional Sanction raised: ${conditions}`
                };
            } else if (decisionType === "counter") {
                payload = {
                    status: "processing",
                    stage: "counter_offer",
                    remarks: `Counter Offer proposed: Amount ₹${counterAmount}, Rate ${counterRate}%, Tenure ${counterTenure} months`
                };
            }

            const res: any = await adminApi.updateApplication(selectedApp.id, payload);
            if (res && res.success) {
                setShowDecisionModal(false);
                // Clear form fields
                setSanctionAmount("");
                setSanctionedInterestRate("");
                setRoiBase("");
                setRoiEffective("");
                setProcessingFee("");
                setSanctionLetterUrl("");
                setConditions("");
                setRejectionReason("");
                setCounterAmount("");
                setCounterRate("");
                setCounterTenure("");
                
                handleRefresh();
            }
        } catch (err) {
            console.error("Error submitting decision:", err);
            alert("Failed to submit decision");
        }
    };

    const handleAddRemark = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedApp || !newRemark.trim()) return;
        setRemarksLoading(true);

        try {
            // update remarks in database
            const mergedRemarks = selectedApp.remarks 
                ? `${selectedApp.remarks}\n[Bank Note - ${format(new Date(), 'MMM dd, HH:mm')}]: ${newRemark.trim()}`
                : `[Bank Note - ${format(new Date(), 'MMM dd, HH:mm')}]: ${newRemark.trim()}`;
            
            const res: any = await adminApi.updateApplication(selectedApp.id, { remarks: mergedRemarks });
            if (res && res.success) {
                setNewRemark("");
                // Refresh list & drawer
                handleRefresh();
            }
        } catch (err) {
            console.error("Error saving remark:", err);
        } finally {
            setRemarksLoading(false);
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
                            <span className="material-symbols-outlined text-[#6605c7] bg-purple-50 p-2 rounded-xl">assignment</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6605c7]">Module 03 • My Files (Logged)</span>
                        </div>
                        <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight">Application Management</h1>
                        <p className="text-sm text-gray-500 mt-2 font-medium">Verify documents, log file numbers, and record credit underwriting decisions.</p>
                    </div>
                    <div className="flex gap-4 w-full lg:w-auto">
                        <div className="relative flex-1 lg:flex-none">
                            <input 
                                type="text" 
                                placeholder="Search by name, ID..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-12 pr-6 py-3 w-full lg:w-72 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#6605c7] focus:ring-4 focus:ring-[#6605c7]/5 shadow-sm transition-all"
                            />
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                        </div>
                    </div>
                </div>

                {/* Pipeline Tabs */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4">
                        <button 
                            onClick={() => setActiveTab("incoming")}
                            className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                                activeTab === "incoming" 
                                    ? "bg-[#6605c7] text-white shadow-lg shadow-purple-500/25" 
                                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <span>Incoming Files</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${activeTab === "incoming" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                                {tabCounts.incoming}
                            </span>
                        </button>
                        <button 
                            onClick={() => setActiveTab("active")}
                            className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                                activeTab === "active" 
                                    ? "bg-[#6605c7] text-white shadow-lg shadow-purple-500/25" 
                                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <span>Logged / Review</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${activeTab === "active" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                                {tabCounts.active}
                            </span>
                        </button>
                        <button 
                            onClick={() => setActiveTab("sanctioned")}
                            className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                                activeTab === "sanctioned" 
                                    ? "bg-[#6605c7] text-white shadow-lg shadow-purple-500/25" 
                                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <span>Sanctioned Queue</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${activeTab === "sanctioned" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                                {tabCounts.sanctioned}
                            </span>
                        </button>
                        <button 
                            onClick={() => setActiveTab("rejected")}
                            className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                                activeTab === "rejected" 
                                    ? "bg-[#6605c7] text-white shadow-lg shadow-purple-500/25" 
                                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            <span>Rejected Queue</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${activeTab === "rejected" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                                {tabCounts.rejected}
                            </span>
                        </button>
                    </div>
                    
                    {/* List Content */}
                    <div className="p-8">
                        {loading ? (
                            <div className="h-[400px] flex flex-col items-center justify-center gap-4">
                                <div className="w-12 h-12 border-4 border-gray-100 border-t-[#6605c7] rounded-full animate-spin" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Syncing application pipeline...</span>
                            </div>
                        ) : filteredApps.length === 0 ? (
                            <div className="h-[300px] flex flex-col items-center justify-center text-center">
                                <span className="material-symbols-outlined text-gray-200 text-6xl mb-4">inbox</span>
                                <h3 className="text-sm font-bold text-gray-900 mb-1">Queue is empty</h3>
                                <p className="text-xs text-gray-400 max-w-xs">There are no files in this stage matching your filter criteria.</p>
                            </div>
                        ) : (
                            <DataTable
                                data={filteredApps}
                                columns={[
                                    {
                                        header: "LAN Number",
                                        accessorKey: "lanNumber",
                                        sortable: true,
                                        cell: (row: any) => (
                                            <span className="font-mono font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md uppercase text-[10px]">
                                                {row.lanNumber || "Pending"}
                                            </span>
                                        )
                                    },
                                    {
                                        header: "Student",
                                        accessorKey: "firstName",
                                        sortable: true,
                                        cell: (row: any) => (
                                            <div>
                                                <span className="font-black text-gray-900 uppercase tracking-tight block">
                                                    {row.firstName} {row.lastName}
                                                </span>
                                                <span className="text-[10px] text-gray-400 block truncate max-w-[150px]">
                                                    {row.universityName || "Stanford University"}
                                                </span>
                                            </div>
                                        )
                                    },
                                    {
                                        header: "Requested Amt",
                                        accessorKey: "amount",
                                        sortable: true,
                                        cell: (row: any) => (
                                            <span className="font-bold text-gray-800">
                                                ₹{row.amount?.toLocaleString() || "—"}
                                            </span>
                                        )
                                    },
                                    {
                                        header: "File Age",
                                        accessorKey: "lanEnteredAt",
                                        sortable: true,
                                        cell: (row: any) => {
                                            const logDate = row.lanEnteredAt || row.submittedAt || row.createdAt;
                                            if (!logDate) return "0 days";
                                            const diff = differenceInDays(new Date(), parseISO(logDate));
                                            return (
                                                <span className="font-bold text-gray-600">
                                                    {diff} {diff === 1 ? "day" : "days"}
                                                </span>
                                            );
                                        }
                                    },
                                    {
                                        header: "Assigned Officer",
                                        accessorKey: "remarks",
                                        sortable: false,
                                        cell: (row: any) => {
                                            const match = (row.remarks || "").match(/officer ([\w\s\(\)]+)/i);
                                            const name = match ? match[1].trim() : "Sarah Jenkins (Credit Officer)";
                                            return (
                                                <span className="text-gray-500 font-semibold text-[11px]">
                                                    {name}
                                                </span>
                                            );
                                        }
                                    },
                                    {
                                        header: "Audit Verdict",
                                        accessorKey: "status",
                                        sortable: true,
                                        cell: (row: any) => <StatusBadge status={row.status} />
                                    },
                                    {
                                        header: "Actions",
                                        accessorKey: "actions",
                                        sortable: false,
                                        cell: (row: any) => (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedApp(row);
                                                }}
                                                className="px-3.5 py-1.5 bg-gray-900 text-white hover:bg-gray-800 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm"
                                            >
                                                Review
                                            </button>
                                        )
                                    }
                                ]}
                                onRowClick={(row) => setSelectedApp(row)}
                                emptyMessage="Queue is empty. There are no files in this stage matching your filter criteria."
                                defaultSortKey="lanNumber"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Sidebar Details Drawer */}
            <AnimatePresence>
                {selectedApp && (
                    <>
                        {/* Backdrop */}
                        <div 
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" 
                            onClick={() => setSelectedApp(null)} 
                        />
                        {/* Drawer body */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-full md:w-[480px] bg-white border-l border-gray-100 shadow-2xl z-50 overflow-y-auto p-8 flex flex-col justify-between"
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
                                            {selectedApp.email} ┬╖ {selectedApp.phone || "No phone added"}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedApp(null)} 
                                        className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-lg">close</span>
                                    </button>
                                </div>

                                {/* Application Attributes */}
                                <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-100/50">
                                    <div>
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Requested Amount</span>
                                        <span className="text-sm font-bold text-gray-900">₹{(selectedApp.amount).toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Course Program</span>
                                        <span className="text-sm font-bold text-gray-900 truncate block">{selectedApp.courseName || "Masters / UG Degree"}</span>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">User ID</span>
                                        <span className="text-sm font-bold text-gray-900 font-mono" title={selectedApp.userId || selectedApp.studentId}>
                                            {(selectedApp.userId || selectedApp.studentId || "—").replace(/-/g, "").slice(0, 10).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Application ID</span>
                                        <span className="text-sm font-bold text-gray-900 font-mono" title={selectedApp.id}>
                                            APP{(selectedApp.id || "—").replace(/-/g, "").slice(-10).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Academic Institution</span>
                                        <span className="text-sm font-bold text-gray-900">{selectedApp.universityName || "University of Foreign Intake"}</span>
                                    </div>
                                    {selectedApp.coApplicantName && (
                                        <div className="col-span-2 border-t border-gray-100 pt-3">
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Co-Applicant details</span>
                                            <span className="text-sm font-bold text-gray-900 block">{selectedApp.coApplicantName} ({selectedApp.coApplicantRelation})</span>
                                            <span className="text-[10px] text-gray-400">Income: ₹{(selectedApp.coApplicantIncome || 0).toLocaleString()}/yr</span>
                                        </div>
                                    )}
                                </div>

                                {/* Documents Package */}
                                <div className="space-y-3">
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
                                                    <a 
                                                        href={`/api/applications/admin/documents/${doc.id}/view`} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="px-3 py-1.5 bg-gray-50 border border-gray-100 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-[#6605c7]/5 hover:text-[#6605c7] hover:border-[#6605c7]/10 transition-all flex items-center gap-1"
                                                    >
                                                        <span className="material-symbols-outlined text-xs">download</span> View
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 border border-dashed border-gray-100 rounded-xl text-center">
                                            <span className="text-[10px] text-gray-400 uppercase tracking-widest">No documents found.</span>
                                        </div>
                                    )}
                                </div>

                                {/* Remarks / Activity Feed */}
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

                                    {/* Add note form */}
                                    <form onSubmit={handleAddRemark} className="flex gap-2">
                                        <input 
                                            type="text"
                                            placeholder="Write internal note to staff..."
                                            value={newRemark}
                                            onChange={(e) => setNewRemark(e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6605c7] shadow-sm transition-all"
                                        />
                                        <button 
                                            type="submit"
                                            disabled={remarksLoading}
                                            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-gray-800 shadow-md transition-all flex items-center justify-center shrink-0"
                                        >
                                            {remarksLoading ? "..." : "Add"}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="border-t border-gray-100 pt-6 flex gap-4 mt-6">
                                {!selectedApp.lanNumber ? (
                                    <button 
                                        onClick={() => setShowLanModal(true)}
                                        className="flex-1 py-4 bg-[#6605c7] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-purple-500/20 hover:bg-[#5203a4] transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-lg">note_add</span> Log File (Enter LAN)
                                    </button>
                                ) : (
                                    <>
                                        {selectedApp.status !== "approved" && selectedApp.status !== "disbursed" && selectedApp.status !== "rejected" && (
                                            <button 
                                                onClick={() => {
                                                    setSanctionAmount(selectedApp.amount.toString());
                                                    setShowDecisionModal(true);
                                                }}
                                                className="flex-1 py-4 bg-[#6605c7] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-purple-500/20 hover:bg-[#5203a4] transition-all flex items-center justify-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-lg">gavel</span> Record Underwriting Decision
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* LAN Number Logging Modal */}
            <AnimatePresence>
                {showLanModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => { setShowLanModal(false); setConfirmingLog(false); }} />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl p-8 max-w-md w-full z-10 relative overflow-hidden"
                        >
                            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Log File & Assign LAN</h3>
                            <p className="text-xs text-gray-400 mb-6 font-bold uppercase tracking-wider">Acknowledge receipt and assign the bank's internal Loan Account Number.</p>
                            
                            <form onSubmit={handleLogFile} className="space-y-5">
                                {/* LAN Number */}
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Loan Account Number (LAN)</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="e.g. LAN-BANK-0000000"
                                        value={lanNumber}
                                        onChange={(e) => setLanNumber(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#6605c7] focus:ring-4 focus:ring-[#6605c7]/5 shadow-sm transition-all"
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
                                        <p>You are assigning LAN <span className="font-bold font-mono">{lanNumber}</span> to <strong>{assignedOfficer}</strong>. This file will move to active review.</p>
                                    </motion.div>
                                )}

                                <div className="flex gap-4 pt-3">
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            if (confirmingLog) setConfirmingLog(false);
                                            else setShowLanModal(false);
                                        }}
                                        className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                                    >
                                        {confirmingLog ? "Back" : "Cancel"}
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 shadow-lg shadow-gray-900/10 transition-all"
                                    >
                                        {confirmingLog ? "Confirm Log" : "Log File"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Decision Entry Modal */}
            <AnimatePresence>
                {showDecisionModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowDecisionModal(false)} />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl p-8 max-w-lg w-full z-10 relative overflow-y-auto max-h-[90vh] no-scrollbar"
                        >
                            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Underwriting Decision Panel</h3>
                            <p className="text-xs text-gray-400 mb-6 font-bold uppercase tracking-wider">Select the credit decision and enter rates/terms.</p>
                            
                            <form onSubmit={handleDecision} className="space-y-5">
                                {/* Decision Selection */}
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Decision Type</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: "sanctioned", label: "Approve (Sanction)", icon: "check_circle" },
                                            { id: "conditional", label: "Conditional", icon: "pending" },
                                            { id: "counter", label: "Counter Offer", icon: "swap_horiz" },
                                            { id: "rejected", label: "Reject File", icon: "cancel" }
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setDecisionType(t.id as any)}
                                                className={`py-3 px-4 border rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                                                    decisionType === t.id 
                                                        ? "border-[#6605c7] bg-[#6605c7]/5 text-[#6605c7]" 
                                                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-base">{t.icon}</span>
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Conditionally Render Form Blocks */}
                                {decisionType === "sanctioned" && (
                                    <div className="space-y-4 border-t border-gray-50 pt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Sanctioned Amount (₹)</label>
                                                <input 
                                                    type="number" 
                                                    required
                                                    value={sanctionAmount}
                                                    onChange={(e) => setSanctionAmount(e.target.value)}
                                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7]"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Processing Fee (₹)</label>
                                                <input 
                                                    type="number" 
                                                    placeholder="0"
                                                    value={processingFee}
                                                    onChange={(e) => setProcessingFee(e.target.value)}
                                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7]"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Rate type (ROI)</label>
                                                <select 
                                                    value={roiType}
                                                    onChange={(e) => setRoiType(e.target.value)}
                                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7]"
                                                >
                                                    <option value="floating">Floating ROI</option>
                                                    <option value="fixed">Fixed ROI</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Base rate (%)</label>
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    placeholder="e.g. 8.25"
                                                    value={roiBase}
                                                    onChange={(e) => setRoiBase(e.target.value)}
                                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7]"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Subsidy / Spread (%)</label>
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    placeholder="0.0"
                                                    value={roiSubsidy}
                                                    onChange={(e) => setRoiSubsidy(e.target.value)}
                                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7]"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Effective ROI (%)</label>
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    required
                                                    placeholder="e.g. 9.50"
                                                    value={roiEffective}
                                                    onChange={(e) => {
                                                        setRoiEffective(e.target.value);
                                                        setSanctionedInterestRate(e.target.value);
                                                    }}
                                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7]"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Sanction Letter URL / File</label>
                                            <input 
                                                type="text" 
                                                placeholder="/docs/sanction-letter-99.pdf"
                                                value={sanctionLetterUrl}
                                                onChange={(e) => setSanctionLetterUrl(e.target.value)}
                                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7]"
                                            />
                                        </div>
                                    </div>
                                )}

                                {decisionType === "rejected" && (
                                    <div className="space-y-4 border-t border-gray-50 pt-4">
                                        <div>
                                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Rejection Reason</label>
                                            <textarea 
                                                required
                                                rows={3}
                                                placeholder="Provide detailed reasons for decision analytics..."
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7]"
                                            />
                                        </div>
                                    </div>
                                )}

                                {decisionType === "conditional" && (
                                    <div className="space-y-4 border-t border-gray-50 pt-4">
                                        <div>
                                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Outstanding Conditions</label>
                                            <textarea 
                                                required
                                                rows={3}
                                                placeholder="Describe conditions student/staff must fulfill..."
                                                value={conditions}
                                                onChange={(e) => setConditions(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7]"
                                            />
                                        </div>
                                    </div>
                                )}

                                {decisionType === "counter" && (
                                    <div className="space-y-4 border-t border-gray-50 pt-4">
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Counter Amount (₹)</label>
                                                <input 
                                                    type="number" 
                                                    required
                                                    value={counterAmount}
                                                    onChange={(e) => setCounterAmount(e.target.value)}
                                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7]"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Counter ROI (%)</label>
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    required
                                                    value={counterRate}
                                                    onChange={(e) => setCounterRate(e.target.value)}
                                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7]"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Counter Tenure (mo)</label>
                                                <input 
                                                    type="number" 
                                                    required
                                                    placeholder="48"
                                                    value={counterTenure}
                                                    onChange={(e) => setCounterTenure(e.target.value)}
                                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4 pt-3 border-t border-gray-100 mt-6">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowDecisionModal(false)}
                                        className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 py-3 bg-[#6605c7] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#5203a4] shadow-lg shadow-purple-500/10 transition-all"
                                    >
                                        Submit Decision
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
