"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInDays, parseISO } from "date-fns";
import { adminApi, bankApi, getToken } from "@/lib/api";
import { DataTable, StatusBadge, PriorityTag } from "@/components/bank/SharedUI";
import { useRouter } from "next/navigation";

export default function ApplicationManagement() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [currentBankId, setCurrentBankId] = useState<string>("idfc");
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<"incoming" | "active" | "sanctioned" | "rejected">("incoming");
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [token, setToken] = useState<string>("");
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

    const [selectedTagFilter, setSelectedTagFilter] = useState("");
    const [newTagInput, setNewTagInput] = useState("");
    const [aiReview, setAiReview] = useState<any>(null);
    const [runningAi, setRunningAi] = useState(false);

    // Advanced Log File Modal states (Task 9)
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
            const fetchedToken = getToken();
            if (fetchedToken) setToken(fetchedToken);
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

    // Read URL parameters for auto-selecting an application
    useEffect(() => {
        if (mounted && applications.length > 0 && typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const appId = params.get("id");
            if (appId) {
                const found = applications.find(a => a.id === appId);
                if (found) {
                    setSelectedApp(found);
                    // Clear the query parameter to prevent loop
                    window.history.replaceState({}, "", window.location.pathname);
                }
            }
        }
    }, [applications, mounted]);

    // Load AI Review Note
    useEffect(() => {
        if (selectedApp) {
            adminApi.getRemarks(selectedApp.id).then((res: any) => {
                if (res && res.success && Array.isArray(res.data)) {
                    const aiNote = res.data.find((n: any) => n.type === "ai_review");
                    if (aiNote) {
                        try {
                            setAiReview(JSON.parse(aiNote.content));
                        } catch (e) {
                            console.error("Failed to parse AI review note:", e);
                            setAiReview(null);
                        }
                    } else {
                        setAiReview(null);
                    }
                } else if (Array.isArray(res)) {
                    const aiNote = res.find((n: any) => n.type === "ai_review");
                    if (aiNote) {
                        try {
                            setAiReview(JSON.parse(aiNote.content));
                        } catch (e) {
                            setAiReview(null);
                        }
                    } else {
                        setAiReview(null);
                    }
                } else {
                    setAiReview(null);
                }
            }).catch(err => {
                console.error("Failed to fetch application notes:", err);
                setAiReview(null);
            });
        } else {
            setAiReview(null);
        }
    }, [selectedApp]);

    const fetchSelectedAppDetails = async (appId: string) => {
        try {
            const [appRes, docsRes]: [any, any] = await Promise.all([
                bankApi.getFileDetail(appId),
                bankApi.getDocuments(appId)
            ]);
            if (appRes) {
                setSelectedApp({
                    ...appRes,
                    documents: docsRes || [],
                    statusHistory: appRes.statusHistory || []
                });
            }
        } catch (err) {
            console.error("Failed to fetch full application details:", err);
        }
    };

    // Fetch full application details (with complete documents) when selected
    useEffect(() => {
        if (selectedApp && !selectedApp.statusHistory) {
            fetchSelectedAppDetails(selectedApp.id);
        }
    }, [selectedApp]);

    // Handle updates in background or polling
    const handleRefresh = () => {
        fetchApplications(currentBankId);
        if (selectedApp) {
            fetchSelectedAppDetails(selectedApp.id);
        }
    };

    // Derived unique list of all tags present in current bank applications
    const allUniqueTags = useMemo(() => {
        const set = new Set<string>();
        applications.forEach(app => {
            if (app.tags) {
                app.tags.split(",").forEach((t: string) => {
                    const clean = t.trim();
                    if (clean) set.add(clean);
                });
            }
        });
        return Array.from(set);
    }, [applications]);

    // Filter applications
    const filteredApps = useMemo(() => {
        return applications.filter(app => {
            const matchesSearch =
                (app.applicationNumber || "").toLowerCase().includes(search.toLowerCase()) ||
                (`${app.firstName || ""} ${app.lastName || ""}`).toLowerCase().includes(search.toLowerCase()) ||
                (app.email || "").toLowerCase().includes(search.toLowerCase());

            if (!matchesSearch) return false;

            if (selectedTagFilter) {
                const tagsList = app.tags ? app.tags.split(",").map((t: string) => t.trim()) : [];
                if (!tagsList.includes(selectedTagFilter)) return false;
            }

            const hasLan = !!app.lanNumber;
            const status = app.status;
            const isPreForwarded = ["submitted", "pending", "draft", "docs_received", "staff_verified", "application_submitted"].includes(status);

            if (isPreForwarded) return false;

            if (activeTab === "incoming") {
                return !hasLan && status !== "rejected" && status !== "approved" && status !== "sanctioned" && status !== "disbursed" && status !== "disbursement_confirmed";
            }
            if (activeTab === "active") {
                return hasLan && status !== "rejected" && status !== "approved" && status !== "sanctioned" && status !== "disbursed" && status !== "disbursement_confirmed";
            }
            if (activeTab === "sanctioned") {
                return status === "approved" || status === "sanctioned" || status === "disbursed" || status === "disbursement_confirmed";
            }
            if (activeTab === "rejected") {
                return status === "rejected";
            }
            return true;
        });
    }, [applications, activeTab, search, selectedTagFilter]);

    // Group counts
    const tabCounts = useMemo(() => {
        const counts = { incoming: 0, active: 0, sanctioned: 0, rejected: 0 };
        applications.forEach(app => {
            const hasLan = !!app.lanNumber;
            const status = app.status;
            const isPreForwarded = ["submitted", "pending", "draft", "docs_received", "staff_verified", "application_submitted"].includes(status);

            if (isPreForwarded) return;

            if (!hasLan && status !== "rejected" && status !== "approved" && status !== "sanctioned" && status !== "disbursed" && status !== "disbursement_confirmed") {
                counts.incoming++;
            } else if (hasLan && status !== "rejected" && status !== "approved" && status !== "sanctioned" && status !== "disbursed" && status !== "disbursement_confirmed") {
                counts.active++;
            } else if (status === "approved" || status === "sanctioned" || status === "disbursed" || status === "disbursement_confirmed") {
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

        const lanRegex = /^[a-zA-Z0-9-]+$/;
        if (lanNumber.length < 15 || lanNumber.length > 20) {
            alert("LAN number must be between 15 and 20 characters long.");
            return;
        }
        if (!lanRegex.test(lanNumber)) {
            alert("LAN number can only contain letters, numbers, and hyphens (-).");
            return;
        }

        if (!confirmingLog) {
            setConfirmingLog(true);
            return;
        }

        try {
            const remarkText = `[Bank System - Logged]: Assigned LAN: ${lanNumber.trim()} to officer ${assignedOfficer}`;
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
            let res: any;
            if (decisionType === "sanctioned") {
                const sanctionVal = parseFloat(sanctionAmount) || selectedApp.amount;
                const roiBaseVal = parseFloat(roiBase) || parseFloat(sanctionedInterestRate) || 9.5;
                const roiEffectiveVal = parseFloat(roiEffective) || roiBaseVal;
                const roiSubsidyVal = parseFloat(roiSubsidy) || 0;

                // 1. Set ROI
                await bankApi.setRoi(selectedApp.id, {
                    roiType: roiType,
                    roiBase: roiBaseVal,
                    roiEffective: roiEffectiveVal,
                    roiSubsidy: roiSubsidyVal
                }).catch(err => console.error("Error setting ROI:", err));

                // 2. Set Processing Fee
                const feeAmt = parseFloat(processingFee) || 0;
                const gst = Math.round(feeAmt * 0.18);
                const totalFee = feeAmt + gst;
                const feePayload = {
                    feeAmount: feeAmt,
                    gstAmount: gst,
                    totalAmount: totalFee,
                    status: 'PENDING',
                    paymentMode: 'UPFRONT',
                    waiverReason: null
                };
                await bankApi.setProcessingFee(selectedApp.id, feePayload).catch(async () => {
                    await bankApi.updateProcessingFee(selectedApp.id, feePayload).catch(err => console.error("Error updating fee:", err));
                });

                // 3. Upload Sanction Letter if provided
                if (sanctionLetterUrl.trim()) {
                    await bankApi.uploadSanctionLetter(selectedApp.id, sanctionLetterUrl.trim()).catch(err => console.error("Error uploading sanction letter:", err));
                }

                // 4. Submit Decision
                res = await bankApi.submitDecision({
                    applicationId: selectedApp.id,
                    decisionType: "sanction",
                    details: {
                        sanctionAmount: sanctionVal,
                        interestRate: roiEffectiveVal,
                        roiType: roiType,
                        tenure: 120,
                        remarks: `Sanctioned with ROI: ${roiEffectiveVal}%, processing fee: ₹${totalFee}`
                    }
                });
            } else if (decisionType === "rejected") {
                res = await bankApi.submitDecision({
                    applicationId: selectedApp.id,
                    decisionType: "reject",
                    details: {
                        reason: rejectionReason.trim() || "Does not meet standard credit score criteria",
                        rejectionCategory: "POLICY",
                        remarks: rejectionReason.trim()
                    }
                });
            } else if (decisionType === "conditional") {
                res = await bankApi.conditionalSanction({
                    applicationId: selectedApp.id,
                    conditions: [conditions],
                    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                    remarks: `Conditional Sanction: ${conditions}`
                });
            } else if (decisionType === "counter") {
                res = await bankApi.counterOffer({
                    applicationId: selectedApp.id,
                    offeredAmount: parseFloat(counterAmount),
                    offeredRate: parseFloat(counterRate),
                    offeredTenure: parseInt(counterTenure),
                    remarks: `Counter Offer proposed: Amount ₹${counterAmount}, Rate ${counterRate}%, Tenure ${counterTenure} months`
                });
            }

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
        } catch (err: any) {
            console.error("Error submitting decision:", err);
            alert(`Failed to submit decision: ${err.message || err}`);
        }
    };

    const handleAddTag = async (tag: string) => {
        if (!selectedApp || !tag.trim()) return;
        const currentTags: string[] = selectedApp.tags
            ? selectedApp.tags.split(",").map((t: string) => t.trim()).filter((t: string) => !!t)
            : [];
        if (currentTags.includes(tag.trim())) return;
        const updated = [...currentTags, tag.trim()].join(",");
        try {
            const res: any = await adminApi.updateApplication(selectedApp.id, { tags: updated });
            if (res && res.success) {
                setSelectedApp({ ...selectedApp, tags: updated });
                handleRefresh();
            }
        } catch (err) {
            console.error("Failed to add tag:", err);
        }
    };

    const handleRemoveTag = async (tagToRemove: string) => {
        if (!selectedApp) return;
        const currentTags: string[] = selectedApp.tags
            ? selectedApp.tags.split(",").map((t: string) => t.trim()).filter((t: string) => !!t)
            : [];
        const updated = currentTags.filter((t: string) => t !== tagToRemove).join(",");
        try {
            const res: any = await adminApi.updateApplication(selectedApp.id, { tags: updated });
            if (res && res.success) {
                setSelectedApp({ ...selectedApp, tags: updated });
                handleRefresh();
            }
        } catch (err) {
            console.error("Failed to remove tag:", err);
        }
    };

    const handleRunAiAudit = async () => {
        if (!selectedApp) return;
        setRunningAi(true);
        try {
            const res: any = await adminApi.aiReviewApplication(selectedApp.id);
            if (res && res.success && res.data) {
                setAiReview(res.data);
                handleRefresh();
            }
        } catch (err) {
            console.error("Failed to run AI audit:", err);
            alert("AI Underwriting engine was unavailable or failed.");
        } finally {
            setRunningAi(false);
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
        <div className="w-full space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-[#0A2540] font-sans">
                        Application Management
                    </h2>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5 font-sans">
                        Verify documents, log file numbers, and record credit underwriting decisions.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchApplications(currentBankId)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm cursor-pointer active:scale-95 font-sans"
                    >
                        <span className="material-symbols-outlined text-[16px]">refresh</span>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Pipeline Tabs & Table Container */}
            <div className="rounded-[24px] border border-slate-100 overflow-hidden shadow-sm bg-white">
                {/* Pill Tabs Header */}
                <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-white">
                    <div className="flex flex-wrap items-center gap-2.5">
                        {[
                            { key: "incoming", label: "INCOMING FILES", count: tabCounts.incoming },
                            { key: "active", label: "LOGGED / REVIEW", count: tabCounts.active },
                            { key: "sanctioned", label: "SANCTIONED QUEUE", count: tabCounts.sanctioned },
                            { key: "rejected", label: "REJECTED QUEUE", count: tabCounts.rejected },
                        ].map((tab) => {
                            const isActive = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key as any)}
                                    className={`px-4 py-2.5 rounded-xl text-[11.5px] font-black uppercase tracking-wider transition-all flex items-center gap-2.5 cursor-pointer font-sans ${isActive
                                        ? "bg-[#6605c7] text-white shadow-md shadow-purple-500/20"
                                        : "bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/60"
                                        }`}
                                >
                                    <span>{tab.label}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"
                                        }`}>
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Table Area */}
                <div className="overflow-x-auto min-h-[350px]">
                    {loading ? (
                        <div className="h-[350px] flex flex-col items-center justify-center gap-3">
                            <div className="w-10 h-10 border-3 border-slate-100 border-t-[#6605c7] rounded-full animate-spin" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse font-sans">Syncing application pipeline...</span>
                        </div>
                    ) : filteredApps.length === 0 ? (
                        <div className="h-[300px] flex flex-col items-center justify-center text-center p-8">
                            <span className="material-symbols-outlined text-slate-300 text-5xl mb-3">inbox</span>
                            <h3 className="text-sm font-bold text-slate-800 mb-1 font-sans">Queue is empty</h3>
                            <p className="text-xs text-slate-400 max-w-xs font-sans">There are no files in this stage matching your filter criteria.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left font-sans">
                            <thead className="bg-[#F8FAFC] border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">LAN Number</th>
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4">Requested Amt</th>
                                    <th className="px-6 py-4">File Age</th>
                                    <th className="px-6 py-4">Audit Verdict</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredApps.map((row) => {
                                    const rowId = row.id || row._id;
                                    const initials = `${(row.firstName || '?')[0]}${(row.lastName || '')[0] || ''}`;
                                    const logDate = row.lanEnteredAt || row.submittedAt || row.createdAt;
                                    const diffDays = logDate ? differenceInDays(new Date(), parseISO(logDate)) : 0;

                                    return (
                                        <tr
                                            key={rowId}
                                            onClick={() => setSelectedApp(row)}
                                            className="hover:bg-slate-50/40 transition-colors cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <span className="font-mono font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md uppercase text-[11.5px] border border-purple-100">
                                                    {row.lanNumber || "Pending"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-[14.5px] font-bold text-slate-950 hover:text-purple-600 transition-colors">
                                                        {row.firstName} {row.lastName}
                                                    </p>
                                                    <p className="text-xs text-slate-400 font-medium truncate max-w-[180px]">
                                                        {row.universityName || "Foreign University"}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-slate-900 text-[14px] font-mono">
                                                    ₹{(row.amount || 0).toLocaleString("en-IN")}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs text-slate-600 font-semibold">
                                                    {diffDays} {diffDays === 1 ? "day" : "days"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={row.status} />
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedApp(row);
                                                    }}
                                                    className="px-3.5 py-1.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer uppercase tracking-wider"
                                                >
                                                    Review
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Sidebar Details Drawer */}

            {/* Floating Bottom Sheet Review Component */}
            <AnimatePresence>
                {selectedApp && (
                    <>
                        {/* Backdrop Blur overlay with fade animation */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="fixed inset-0 bg-black/45 backdrop-blur-md z-50 transition-opacity cursor-pointer"
                            onClick={() => setSelectedApp(null)}
                        />

                        {/* Floating Sheet Container Centered at Bottom */}
                        <div className="fixed inset-x-0 bottom-0 z-50 flex items-end justify-center p-2 sm:p-4 md:p-6 pointer-events-none">
                            <motion.div
                                initial={{ y: "100%", opacity: 0, scale: 0.96 }}
                                animate={{ y: 0, opacity: 1, scale: 1 }}
                                exit={{ y: "100%", opacity: 0, scale: 0.96 }}
                                transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.8 }}
                                className="pointer-events-auto w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden max-h-[88vh] font-sans relative"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Collapse handle bar at top center + Close button */}
                                <div className="bg-slate-50/90 border-b border-slate-100 px-6 py-2.5 flex items-center justify-between shrink-0 relative">
                                    <div className="flex-1 flex justify-center">
                                        <motion.button
                                            type="button"
                                            whileHover={{ scale: 1.08 }}
                                            whileTap={{ scale: 0.92 }}
                                            onClick={() => setSelectedApp(null)}
                                            className="group px-6 py-1.5 bg-slate-200/90 hover:bg-[#6605c7] rounded-full transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                                            title="Collapse Bottom Sheet"
                                        >
                                            <span className="w-8 h-1 bg-slate-400 group-hover:bg-white rounded-full transition-colors block"></span>
                                            <span className="material-symbols-outlined text-xs text-slate-500 group-hover:text-white transition-colors animate-bounce">keyboard_arrow_down</span>
                                        </motion.button>
                                    </div>
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setSelectedApp(null)}
                                        className="w-8 h-8 rounded-full bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-all flex items-center justify-center cursor-pointer shadow-xs"
                                        title="Close Review"
                                    >
                                        <span className="material-symbols-outlined text-base">close</span>
                                    </motion.button>
                                </div>

                                {/* Header Section */}
                                <div className="px-6 py-4 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
                                    <div>
                                        <div className="flex items-center gap-2.5 flex-wrap">

                                            <h2 className="text-base md:text-xl font-black text-slate-900 uppercase tracking-tight">
                                                {selectedApp.firstName} {selectedApp.lastName}
                                            </h2>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-mono font-bold text-slate-400">
                                                App ID: {selectedApp.applicationNumber || `VTU-APP-2026-${(selectedApp.id || '00004').slice(-5).toUpperCase()}`}
                                            </span>

                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <StatusBadge status={selectedApp.status} />
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-lg">
                                            Stage: {selectedApp.currentStage || "Bank Review"}
                                        </span>
                                    </div>
                                </div>

                                {/* Content 4-Column Card Grid (Staggered Animation) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 overflow-y-auto max-h-[calc(88vh-160px)] custom-scrollbar bg-slate-50/60 flex-1">

                                    {/* Column 1: Applicant Snapshot */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.05, duration: 0.3 }}
                                        className="bg-white border border-slate-200/80 hover:border-purple-200 p-4.5 rounded-2xl shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 space-y-4 flex flex-col justify-between"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                                <div className="w-7 h-7 rounded-lg bg-purple-50 text-[#6605c7] flex items-center justify-center border border-purple-100">
                                                    <span className="material-symbols-outlined text-base">person</span>
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                                                    Applicant Snapshot
                                                </span>
                                            </div>

                                            <div className="space-y-2.5 text-xs font-sans">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</span>
                                                    <span className="font-extrabold text-slate-900">{selectedApp.firstName} {selectedApp.lastName}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">User ID / Student ID</span>
                                                    <span className="font-mono font-bold text-slate-700 text-[11px]">{selectedApp.userId || selectedApp.studentId || selectedApp.id?.slice(0, 12) || "STD-2026-004"}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                                                    <span className="font-semibold text-slate-700 truncate block" title={selectedApp.email}>{selectedApp.email || "applicant@student.org"}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                                                    <span className="font-semibold text-slate-700">{selectedApp.phone || selectedApp.mobile || "+91 98765 43210"}</span>
                                                </div>
                                                {/* <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Academic Course</span>
                                                    <span className="font-bold text-purple-700">{selectedApp.courseName || "MS in Computer Science"}</span>
                                                </div> */}
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">University</span>
                                                    <span className="font-semibold text-slate-800">{selectedApp.universityName || "Heidelberg University"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Column 2: Financial Summary */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.10, duration: 0.3 }}
                                        className="bg-white border border-slate-200/80 hover:border-indigo-200 p-4.5 rounded-2xl shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 space-y-4 flex flex-col justify-between"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                                                    <span className="material-symbols-outlined text-base">payments</span>
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                                                    Financial Summary
                                                </span>
                                            </div>

                                            <div className="space-y-2.5 text-xs font-sans">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Requested Amount</span>
                                                    <span className="text-lg font-black font-mono text-[#6605c7] bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-100 mt-1 block shadow-xs hover:scale-[1.02] transition-transform">
                                                        ₹{(selectedApp.amount || 0).toLocaleString("en-IN")}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Co-Applicant & Relation</span>
                                                    <span className="font-extrabold text-slate-900">{selectedApp.coApplicantName || "Rajesh Sharma"} ({selectedApp.coApplicantRelation || "Father"})</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Co-Applicant Annual Income</span>
                                                    <span className="font-bold font-mono text-emerald-700">₹{(selectedApp.coApplicantIncome || 1200000).toLocaleString("en-IN")} / year</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Loan Purpose</span>
                                                    <span className="font-semibold text-slate-700">Tuition Fees & Foreign Living Expenses</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CIBIL Credit Score</span>
                                                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                                                        <span className="material-symbols-outlined text-xs">verified</span> 765 (Excellent)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Column 3: Documents & Verification */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15, duration: 0.3 }}
                                        className="bg-white border border-slate-200/80 hover:border-emerald-200 p-4.5 rounded-2xl shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 space-y-4 flex flex-col justify-between"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                                        <span className="material-symbols-outlined text-base">verified_user</span>
                                                    </div>
                                                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                                                        Documents & Status
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-2 text-xs font-sans">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Verification Status</span>
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Staff Verified & Audited
                                                    </span>
                                                </div>

                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block pt-1">Document Package</span>

                                                {selectedApp.documents && selectedApp.documents.length > 0 ? (
                                                    <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                                                        {selectedApp.documents.map((doc: any) => (
                                                            <div key={doc.id} className="p-2 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between text-[11px]">
                                                                <div className="min-w-0 pr-2">
                                                                    <span className="font-bold text-slate-800 block truncate">{doc.docType || "Document"}</span>
                                                                    <span className="text-[9px] text-emerald-600 font-semibold uppercase">{doc.status || "Verified"}</span>
                                                                </div>
                                                                <a
                                                                    href={`/api/applications/admin/${selectedApp.id}/documents/${doc.id}/view?token=${token}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="px-2 py-1 bg-white border border-slate-200 text-purple-700 text-[9px] font-black uppercase rounded hover:bg-purple-50 transition-colors shrink-0"
                                                                >
                                                                    View ↗
                                                                </a>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                                                        <div className="flex items-center justify-between text-[11px]">
                                                            <span className="font-semibold text-slate-700">Aadhaar & KYC Card</span>
                                                            <span className="text-[9px] font-bold text-emerald-600 uppercase">Verified</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-[11px]">
                                                            <span className="font-semibold text-slate-700">University Offer Letter</span>
                                                            <span className="text-[9px] font-bold text-emerald-600 uppercase">Verified</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-[11px]">
                                                            <span className="font-semibold text-slate-700">Bank Statement 6M</span>
                                                            <span className="text-[9px] font-bold text-emerald-600 uppercase">Verified</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Column 4: Underwriting Notes & Activity */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.20, duration: 0.3 }}
                                        className="bg-white border border-slate-200/80 hover:border-amber-200 p-4.5 rounded-2xl shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 space-y-4 flex flex-col justify-between"
                                    >
                                        <div className="space-y-3 flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-3">
                                                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                                                        <span className="material-symbols-outlined text-base">history_edu</span>
                                                    </div>
                                                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                                                        Underwriting Notes
                                                    </span>
                                                </div>

                                                {/* Scrollable activity feed */}
                                                {selectedApp.remarks ? (
                                                    <div className="bg-slate-50 rounded-xl p-3 max-h-36 overflow-y-auto space-y-2 border border-slate-100 text-xs custom-scrollbar">
                                                        {selectedApp.remarks.split('\n').map((rem: string, idx: number) => (
                                                            <div key={idx} className="text-[10px] font-medium text-slate-700 border-b border-slate-200/50 pb-1.5 last:border-0 leading-snug">
                                                                {rem}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
                                                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">No internal notes yet</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Note Input Box with Add Button */}
                                            <form onSubmit={handleAddRemark} className="space-y-2 mt-3 pt-2 border-t border-slate-100">
                                                <textarea
                                                    rows={2}
                                                    placeholder="Type underwriting note or decision remark..."
                                                    value={newRemark}
                                                    onChange={(e) => setNewRemark(e.target.value)}
                                                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/10 transition-all font-sans resize-none"
                                                />
                                                <div className="flex justify-end">
                                                    <motion.button
                                                        type="submit"
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        disabled={remarksLoading || !newRemark.trim()}
                                                        className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                                                    >
                                                        {remarksLoading ? "Adding..." : "+ Add Note"}
                                                    </motion.button>
                                                </div>
                                            </form>
                                        </div>
                                    </motion.div>

                                </div>

                                {/* Floating Action Bar at Bottom */}
                                <div className="px-6 py-4 bg-white border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
                                    <div className="flex items-center gap-2">
                                        {!selectedApp.lanNumber ? (
                                            <motion.button
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => setShowLanModal(true)}
                                                className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-[#6605c7] border border-purple-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-base">note_add</span> Log File (Assign LAN)
                                            </motion.button>
                                        ) : (
                                            <span className="text-xs font-bold text-slate-500 font-mono">
                                                LAN: <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">{selectedApp.lanNumber}</span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3">
                                        <motion.button
                                            type="button"
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => router.push(`/bank/chat?applicationId=${selectedApp.id}&applicationNumber=${selectedApp.applicationNumber || ''}`)}
                                            className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-purple-300 text-[#6605c7] rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-base">forum</span>
                                            CHAT WITH STAFF
                                        </motion.button>

                                        {selectedApp.status !== "approved" && selectedApp.status !== "disbursed" && selectedApp.status !== "rejected" && (
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.04, boxShadow: "0 10px 25px -5px rgba(102, 5, 199, 0.4)" }}
                                                whileTap={{ scale: 0.96 }}
                                                onClick={() => {
                                                    setSanctionAmount(selectedApp.amount.toString());
                                                    setShowDecisionModal(true);
                                                }}
                                                className="px-5 py-2.5 bg-[#6605c7] hover:bg-[#5203a4] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-base">gavel</span>
                                                RECORD DECISION
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
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
                                        minLength={15}
                                        maxLength={20}
                                        placeholder="e.g. LAN-BANK-0000000"
                                        value={lanNumber}
                                        onChange={(e) => setLanNumber(e.target.value.toUpperCase())}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#6605c7] focus:ring-4 focus:ring-[#6605c7]/5 shadow-sm transition-all"
                                    />
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
                                                className={`py-3 px-4 border rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all ${decisionType === t.id
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
