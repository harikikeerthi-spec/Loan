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
                status: "file_logged",
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
                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                        <select
                            value={selectedTagFilter}
                            onChange={(e) => setSelectedTagFilter(e.target.value)}
                            className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#6605c7] focus:ring-4 focus:ring-[#6605c7]/5 shadow-sm transition-all text-gray-700"
                        >
                            <option value="">All Tags</option>
                            {allUniqueTags.map(tag => (
                                <option key={tag} value={tag}>{tag}</option>
                            ))}
                        </select>
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
                            className="px-5 py-3 rounded-xl text-[13.5px] font-black uppercase tracking-wider transition-all flex items-center gap-2"
                            style={activeTab === "incoming"
                                ? {
                                    background: 'linear-gradient(180deg, #8b24e5 0%, #6605c7 100%)',
                                    color: '#ffffff',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    boxShadow: '0px 4px 10px rgba(102, 5, 199, 0.3), inset 0px 1px 1px rgba(255, 255, 255, 0.4)'
                                }
                                : {
                                    background: '#f8fafc',
                                    color: '#94a3b8',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
                                }
                            }
                        >
                            <span>Incoming Files</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${activeTab === "incoming" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                                {tabCounts.incoming}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab("active")}
                            className="px-5 py-3 rounded-xl text-[13.5px] font-black uppercase tracking-wider transition-all flex items-center gap-2"
                            style={activeTab === "active"
                                ? {
                                    background: 'linear-gradient(180deg, #8b24e5 0%, #6605c7 100%)',
                                    color: '#ffffff',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    boxShadow: '0px 4px 10px rgba(102, 5, 199, 0.3), inset 0px 1px 1px rgba(255, 255, 255, 0.4)'
                                }
                                : {
                                    background: '#f8fafc',
                                    color: '#94a3b8',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
                                }
                            }
                        >
                            <span>Logged / Review</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${activeTab === "active" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                                {tabCounts.active}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab("sanctioned")}
                            className="px-5 py-3 rounded-xl text-[13.5px] font-black uppercase tracking-wider transition-all flex items-center gap-2"
                            style={activeTab === "sanctioned"
                                ? {
                                    background: 'linear-gradient(180deg, #8b24e5 0%, #6605c7 100%)',
                                    color: '#ffffff',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    boxShadow: '0px 4px 10px rgba(102, 5, 199, 0.3), inset 0px 1px 1px rgba(255, 255, 255, 0.4)'
                                }
                                : {
                                    background: '#f8fafc',
                                    color: '#94a3b8',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
                                }
                            }
                        >
                            <span>Sanctioned Queue</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${activeTab === "sanctioned" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                                {tabCounts.sanctioned}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab("rejected")}
                            className="px-5 py-3 rounded-xl text-[13.5px] font-black uppercase tracking-wider transition-all flex items-center gap-2"
                            style={activeTab === "rejected"
                                ? {
                                    background: 'linear-gradient(180deg, #8b24e5 0%, #6605c7 100%)',
                                    color: '#ffffff',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    boxShadow: '0px 4px 10px rgba(102, 5, 199, 0.3), inset 0px 1px 1px rgba(255, 255, 255, 0.4)'
                                }
                                : {
                                    background: '#f8fafc',
                                    color: '#94a3b8',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
                                }
                            }
                        >
                            <span>Rejected Queue</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${activeTab === "rejected" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
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
                                            <span className="font-mono font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md uppercase text-[11.5px]">
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
                                                <span className="text-[11.5px] text-gray-400 block truncate max-w-[150px]">
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
                                                <span className="text-gray-500 font-semibold text-[12.5px]">
                                                    {name}
                                                </span>
                                            );
                                        }
                                    },
                                    // {
                                    //     header: "Tags",
                                    //     accessorKey: "tags",
                                    //     sortable: false,
                                    //     cell: (row: any) => {
                                    //         const tagsList = row.tags ? row.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [];
                                    //         return (
                                    //             <div className="flex flex-wrap gap-1 max-w-[150px]">
                                    //                 {tagsList.length > 0 ? (
                                    //                     tagsList.map((tag: string) => (
                                    //                         <span key={tag} className="text-[10.5px] bg-purple-50 text-purple-700 font-bold px-1.5 py-0.5 rounded border border-purple-200">
                                    //                             {tag}
                                    //                         </span>
                                    //                     ))
                                    //                 ) : (
                                    //                     <span className="text-gray-300 text-[10px] italic">—</span>
                                    //                 )}
                                    //             </div>
                                    //         );
                                    //     }
                                    // },
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
                                            {selectedApp.email} |{selectedApp.phone || "No phone added"}
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
                                            {selectedApp.userId || selectedApp.studentId || "—"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Application ID</span>
                                        <span className="text-sm font-bold text-gray-900 font-mono" title={selectedApp.id}>
                                            {selectedApp.applicationNumber || `APP${(selectedApp.id || "—").replace(/-/g, "").slice(-10).toUpperCase()}`}
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
                                                        href={`/api/applications/admin/${selectedApp.id}/documents/${doc.id}/view?token=${token}`}
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

                                {/* AI Underwriting Insights (F47) */}
                                <div className="space-y-3 border-t border-gray-100 pt-5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block pl-1">AI Underwriting Insights</span>
                                    {aiReview ? (
                                        <div className="bg-[#6605c7]/5 rounded-2xl p-5 border border-[#6605c7]/10 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {/* Circular gauge */}
                                                    <div className="relative w-12 h-12 flex items-center justify-center">
                                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                            <path
                                                                className="text-purple-100"
                                                                strokeWidth="3.5"
                                                                stroke="currentColor"
                                                                fill="none"
                                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                            />
                                                            <path
                                                                className="text-[#6605c7] transition-all duration-1000 ease-out"
                                                                strokeDasharray={`${aiReview.overallScore}, 100`}
                                                                strokeWidth="3.5"
                                                                strokeLinecap="round"
                                                                stroke="currentColor"
                                                                fill="none"
                                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                            />
                                                        </svg>
                                                        <span className="absolute text-xs font-black text-[#6605c7]">
                                                            {aiReview.overallScore}%
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] font-black text-purple-700 uppercase tracking-wider block">Approval Probability</span>
                                                        <span className="text-xs font-semibold text-gray-500">AI Recommendation Score</span>
                                                    </div>
                                                </div>

                                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${aiReview.recommendation === 'approve'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : aiReview.recommendation === 'reject'
                                                        ? 'bg-rose-100 text-rose-800'
                                                        : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                    {aiReview.recommendation?.replace('_', ' ')}
                                                </span>
                                            </div>

                                            {/* AI Summary */}
                                            {aiReview.aiSummary && (
                                                <p className="text-[11px] text-gray-600 leading-relaxed font-medium bg-white/50 p-3 rounded-xl border border-[#6605c7]/5">
                                                    {aiReview.aiSummary}
                                                </p>
                                            )}

                                            {/* Eligibility Flags / Risks Checklist */}
                                            {aiReview.eligibilityFlags && aiReview.eligibilityFlags.length > 0 && (
                                                <div className="space-y-2">
                                                    <span className="text-[8px] font-black text-purple-800 uppercase tracking-widest block pl-0.5">Risk & Eligibility Factors</span>
                                                    <div className="grid grid-cols-1 gap-1.5">
                                                        {aiReview.eligibilityFlags.map((flagObj: any, i: number) => (
                                                            <div key={i} className="flex items-start gap-2 bg-white/40 p-2 rounded-lg border border-[#6605c7]/5">
                                                                <span className={`material-symbols-outlined text-sm mt-0.5 ${flagObj.status === 'pass'
                                                                    ? 'text-emerald-500'
                                                                    : flagObj.status === 'fail'
                                                                        ? 'text-rose-500'
                                                                        : 'text-amber-500'
                                                                    }`}>
                                                                    {flagObj.status === 'pass' ? 'check_circle' : flagObj.status === 'fail' ? 'cancel' : 'warning'}
                                                                </span>
                                                                <div>
                                                                    <span className="text-[10px] font-black text-gray-800 uppercase tracking-tight block">
                                                                        {flagObj.flag}
                                                                    </span>
                                                                    <span className="text-[9px] text-gray-500 block font-medium">
                                                                        {flagObj.detail}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* AI Recommendations */}
                                            {aiReview.aiRecommendations && aiReview.aiRecommendations.length > 0 && (
                                                <div className="space-y-1">
                                                    <span className="text-[8px] font-black text-purple-800 uppercase tracking-widest block pl-0.5">Next Step Recommendations</span>
                                                    <ul className="list-disc list-inside space-y-1 pl-1">
                                                        {aiReview.aiRecommendations.map((rec: string, i: number) => (
                                                            <li key={i} className="text-[10px] text-gray-600 font-medium leading-tight">
                                                                {rec}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col items-center text-center gap-3">
                                            <span className="material-symbols-outlined text-gray-300 text-3xl">psychology</span>
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-900">AI Underwriting is Pending</h4>
                                                <p className="text-[10px] text-gray-400 mt-1 max-w-xs">Run a live AI Underwriting audit to analyze credit risk, document validity, and academic eligibility.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRunAiAudit}
                                                disabled={runningAi}
                                                className="px-4 py-2 bg-[#6605c7] text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#5203a4] transition-all shadow-md shadow-purple-500/10 flex items-center gap-1.5 disabled:opacity-50"
                                            >
                                                {runningAi ? (
                                                    <>
                                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Auditing File...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="material-symbols-outlined text-xs">bolt</span>
                                                        Run AI Underwriting Audit
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* File Tags & Labels (F43) */}
                                {/* <div className="space-y-3 border-t border-gray-100 pt-5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block pl-1">File Tags & Labels</span>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {selectedApp.tags ? (
                                            selectedApp.tags.split(",").map((t: string) => t.trim()).filter(Boolean).map((tag: string) => (
                                                <span
                                                    key={tag}
                                                    className="inline-flex items-center gap-1 text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full border border-purple-100"
                                                >
                                                    {tag}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveTag(tag)}
                                                        className="text-purple-400 hover:text-rose-500 font-bold ml-0.5 transition-colors focus:outline-none text-[11px]"
                                                    >
                                                        &times;
                                                    </button>
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400 italic pl-1">No tags assigned.</span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Add tag..."
                                            value={newTagInput}
                                            onChange={(e) => setNewTagInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (newTagInput.trim()) {
                                                        handleAddTag(newTagInput.trim());
                                                        setNewTagInput("");
                                                    }
                                                }
                                            }}
                                            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6605c7] shadow-sm transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (newTagInput.trim()) {
                                                    handleAddTag(newTagInput.trim());
                                                    setNewTagInput("");
                                                }
                                            }}
                                            className="px-4 py-2 bg-purple-50 text-[#6605c7] border border-purple-100 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#6605c7]/5 transition-all"
                                        >
                                            Add Tag
                                        </button>
                                    </div>
                                </div> */}

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
                            <div className="border-t border-gray-100 pt-6 flex flex-col gap-3 mt-6">
                                <div className="flex gap-4">
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
                                <button
                                    onClick={() => router.push(`/bank/chat?applicationId=${selectedApp.id}&applicationNumber=${selectedApp.applicationNumber || ''}`)}
                                    className="w-full py-3.5 bg-white hover:bg-gray-50 border border-gray-200 text-[#6605c7] rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-lg">forum</span> Chat with Staff
                                </button>
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
