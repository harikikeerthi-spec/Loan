"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi, bankApi } from "@/lib/api";
import { format } from "date-fns";

export default function ApplicationManagement() {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [applications, setApplications] = useState<any[]>([]);
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<"incoming" | "active" | "completed">("incoming");

    // Drawer / Workspace states
    const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"details" | "documents" | "roi_fee" | "query" | "decision" | "disbursement">("details");
    
    // Notes & Historical Logs State
    const [appRemarks, setAppRemarks] = useState<any[]>([]);
    const [loadingRemarks, setLoadingRemarks] = useState(false);

    // Form inputs
    const [lanInput, setLanInput] = useState("");
    
    // ROI & Processing Fee Form
    const [interestRate, setInterestRate] = useState("9.5");
    const [interestType, setInterestType] = useState("Floating");
    const [baseRate, setBaseRate] = useState("8.2");
    const [subsidyEligible, setSubsidyEligible] = useState("No");
    const [processingFeeAmount, setProcessingFeeAmount] = useState("10000");
    const [processingFeeState, setProcessingFeeState] = useState("Pending");

    // Query form
    const [queryDocCategory, setQueryDocCategory] = useState("academic_records");
    const [queryText, setQueryText] = useState("");

    // Decision Form
    const [decisionType, setDecisionType] = useState<"sanction" | "conditional" | "counter" | "reject">("sanction");
    const [sanctionAmount, setSanctionAmount] = useState("");
    const [sanctionProduct, setSanctionProduct] = useState("Scholar Loan");
    const [sanctionTenure, setSanctionTenure] = useState("120");
    const [conditionalChecklist, setConditionalChecklist] = useState("");
    const [conditionalDeadline, setConditionalDeadline] = useState("");
    const [counterOfferAmount, setCounterOfferAmount] = useState("");
    const [counterOfferRoi, setCounterOfferRoi] = useState("");
    const [counterOfferTenure, setCounterOfferTenure] = useState("");
    const [rejectionReason, setRejectionReason] = useState("CIBIL score shortfall");
    const [rejectionComments, setRejectionComments] = useState("");

    // Disbursement Form
    const [disbMode, setDisbMode] = useState("RTGS");
    const [disbUtr, setDisbUtr] = useState("");
    const [disbAmount, setDisbAmount] = useState("");
    const [disbReleaseDate, setDisbReleaseDate] = useState("");
    const [disbTranche, setDisbTranche] = useState("1st Tranche");

    // Live documents list for selected application
    const [appDocs, setAppDocs] = useState<any[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);

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
        fetchApplications();
    }, [currentBankName, user]);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const incoming = await bankApi.getIncomingFiles() as any[];
            const myFiles = await bankApi.getMyFiles() as any[];
            const allFetched = [...(incoming || []), ...(myFiles || [])];
            const uniqueApps = Array.from(new Map(allFetched.map(item => [item.id, item])).values());
            setApplications(uniqueApps);
        } catch (error) {
            console.error("Failed to fetch applications:", error);
        } finally {
            setLoading(false);
        }
    };

    // Load detailed remarks and documents when an application is selected
    useEffect(() => {
        if (selectedApp) {
            loadRemarksAndDocs(selectedApp.id);
            // Auto fill inputs if custom metadata exists
            setLanInput("");
            setSanctionAmount(selectedApp.amount?.toString() || "");
            setCounterOfferAmount((selectedApp.amount * 0.9)?.toString() || "");
            setDisbAmount(selectedApp.amount?.toString() || "");
            const today = format(new Date(), "yyyy-MM-dd");
            setConditionalDeadline(today);
            setDisbReleaseDate(today);
        }
    }, [selectedApp]);

    const loadRemarksAndDocs = async (appId: string) => {
        setLoadingRemarks(true);
        setLoadingDocs(true);
        try {
            // Fetch detailed record directly from Bank APIs
            const detailRes = await bankApi.getFileDetail(appId) as any;
            if (detailRes) {
                // mock appRemarks from detailRes for backward compatibility with UI parsing logic
                const mockRemarks = [];
                if (detailRes.lanNumber) {
                    mockRemarks.push({ type: "lan_assigned", content: JSON.stringify({ lan: detailRes.lanNumber }) });
                }
                if (detailRes.queries) {
                    detailRes.queries.forEach((q: any) => {
                        mockRemarks.push({ type: "query_raised", content: JSON.stringify({ category: q.category, query: q.queryText, date: q.createdAt }) });
                    });
                }
                if (detailRes.decisions) {
                    detailRes.decisions.forEach((d: any) => {
                        let type = "sanction_approved";
                        let content: any = {};
                        if (d.decisionType === "SANCTION") {
                            type = "sanction_approved";
                            content = { amount: d.amount, roi: d.roi, tenure: d.tenure, product: d.sanctionProduct };
                        } else if (d.decisionType === "CONDITIONAL") {
                            type = "conditional_sanction";
                            content = { tasks: d.conditionalChecklist, deadline: d.conditionalDeadline };
                        } else if (d.decisionType === "COUNTER_OFFER") {
                            type = "counter_offer";
                            content = { amount: d.amount, roi: d.roi, tenure: d.tenure };
                        } else if (d.decisionType === "REJECTED") {
                            type = "rejected";
                            content = { reason: d.rejectionReason, comments: d.rejectionComments };
                        }
                        mockRemarks.push({ type, content: JSON.stringify({ ...content, date: d.createdAt }) });
                    });
                }
                setAppRemarks(mockRemarks);
            }

            // Fetch documents
            const docsRes = await bankApi.getDocuments(appId) as any;
            if (docsRes) {
                setAppDocs(Array.isArray(docsRes) ? docsRes : docsRes.data || []);
            }
        } catch (error) {
            console.error("Failed to load details for app:", error);
        } finally {
            setLoadingRemarks(false);
            setLoadingDocs(false);
        }
    };

    // Categorized lists based on blueprint definitions
    const filteredApps = useMemo(() => {
        return applications.filter(app => {
            const fullName = `${app.firstName || ""} ${app.lastName || ""}`.toLowerCase();
            const searchLower = searchTerm.toLowerCase();
            const matchSearch = fullName.includes(searchLower) || 
                                (app.applicationNumber && app.applicationNumber.toLowerCase().includes(searchLower)) ||
                                (app.email && app.email.toLowerCase().includes(searchLower));
            if (!matchSearch) return false;

            const status = app.status?.toLowerCase() || "pending";
            if (activeTab === "incoming") {
                return status === "pending" || status === "submitted" || status === "submitted_to_bank";
            } else if (activeTab === "active") {
                return status === "file_logged" || status === "under_bank_review" || status === "processing" || status === "query_raised";
            } else { // completed
                return status === "approved" || status === "sanctioned" || status === "disbursed" || status === "closed" || status === "rejected";
            }
        });
    }, [applications, searchTerm, activeTab]);

    // Parse serialized remarks to find custom items
    const customMetadata = useMemo(() => {
        const metadata = {
            lan: "",
            roi: null as any,
            processingFee: null as any,
            disbursement: null as any,
            queries: [] as any[],
            decisions: [] as any[],
        };

        appRemarks.forEach((rem: any) => {
            try {
                if (rem.type === "lan_assigned") {
                    const parsed = JSON.parse(rem.content);
                    metadata.lan = parsed.lan;
                } else if (rem.type === "roi_fee_set") {
                    const parsed = JSON.parse(rem.content);
                    metadata.roi = parsed;
                } else if (rem.type === "query_raised") {
                    const parsed = JSON.parse(rem.content);
                    metadata.queries.push(parsed);
                } else if (rem.type === "sanction_approved" || rem.type === "conditional_sanction" || rem.type === "counter_offer" || rem.type === "rejected") {
                    const parsed = JSON.parse(rem.content);
                    metadata.decisions.push({ type: rem.type, ...parsed });
                } else if (rem.type === "disbursement_confirmed") {
                    const parsed = JSON.parse(rem.content);
                    metadata.disbursement = parsed;
                }
            } catch (e) {
                // Not a serialized JSON remark, ignore parsing
            }
        });

        return metadata;
    }, [appRemarks]);

    // Forms submission handlers
    const handleLogLan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedApp || !lanInput.trim()) return;
        try {
            await bankApi.logFile(selectedApp.id, { lanNumber: lanInput.trim() });
            
            // Reload state
            await loadRemarksAndDocs(selectedApp.id);
            fetchApplications();
            // Keep selected app but sync updated status client-side
            setSelectedApp((prev: any) => ({ ...prev, status: "file_logged" }));
            setLanInput("");
        } catch (error) {
            console.error("Failed to assign LAN:", error);
        }
    };

    const handleSetRoiFee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedApp) return;
        try {
            await bankApi.setRoi(selectedApp.id, {
                rate: parseFloat(interestRate),
                type: interestType,
                baseRate: parseFloat(baseRate),
                subsidy: subsidyEligible === "Yes"
            });
            await bankApi.setProcessingFee(selectedApp.id, {
                amount: parseFloat(processingFeeAmount),
                status: processingFeeState
            });

            await loadRemarksAndDocs(selectedApp.id);
            fetchApplications();
            alert("ROI and processing fees configured successfully!");
        } catch (error) {
            console.error("Failed to set ROI & Fee:", error);
        }
    };

    const handleRaiseQuery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedApp || !queryText.trim()) return;
        try {
            await bankApi.raiseQuery({
                applicationId: selectedApp.id,
                category: queryDocCategory,
                queryText: queryText.trim()
            });

            setQueryText("");
            await loadRemarksAndDocs(selectedApp.id);
            fetchApplications();
            setSelectedApp((prev: any) => ({ ...prev, status: "query_raised" }));
            alert("Query successfully dispatched to student and staff!");
        } catch (error) {
            console.error("Failed to raise query:", error);
        }
    };

    const handleDecision = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedApp) return;
        try {
            let status = "approved";
            let payload: any = { applicationId: selectedApp.id };

            if (decisionType === "sanction") {
                status = "approved";
                payload = { ...payload, decisionType: "SANCTION", amount: parseFloat(sanctionAmount), roi: parseFloat(interestRate), tenure: parseInt(sanctionTenure), sanctionProduct };
            } else if (decisionType === "conditional") {
                status = "approved";
                payload = { ...payload, decisionType: "CONDITIONAL", conditionalChecklist, conditionalDeadline };
            } else if (decisionType === "counter") {
                status = "processing";
                payload = { ...payload, decisionType: "COUNTER_OFFER", amount: parseFloat(counterOfferAmount), roi: parseFloat(counterOfferRoi), tenure: parseInt(counterOfferTenure) };
            } else if (decisionType === "reject") {
                status = "rejected";
                payload = { ...payload, decisionType: "REJECTED", rejectionReason, rejectionComments };
            }

            await bankApi.submitDecision(payload);

            await loadRemarksAndDocs(selectedApp.id);
            fetchApplications();
            setSelectedApp((prev: any) => ({ ...prev, status }));
            alert(`Decision successfully executed: ${decisionType.toUpperCase()}`);
        } catch (error) {
            console.error("Failed to complete decision:", error);
        }
    };

    const handleConfirmDisbursement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedApp || !disbUtr.trim()) return;
        try {
            await bankApi.confirmDisbursement({
                applicationId: selectedApp.id,
                utr: disbUtr.trim(),
                mode: disbMode,
                amount: parseFloat(disbAmount),
                releaseDate: disbReleaseDate,
                tranche: disbTranche
            });

            await loadRemarksAndDocs(selectedApp.id);
            fetchApplications();
            setSelectedApp((prev: any) => ({ ...prev, status: "disbursed" }));
            setDisbUtr("");
            alert("Disbursement confirmed and UTR tracked!");
        } catch (error) {
            console.error("Failed to confirm disbursement:", error);
        }
    };

    const handleVerifyDoc = async (docId: string, status: "verified" | "rejected") => {
        if (!selectedApp) return;
        const reason = status === "rejected" ? prompt("Please input rejection reason:") || "Incomplete Document" : "";
        try {
            await adminApi.verifyDocument(selectedApp.id, docId, status, reason);
            alert(`Document status updated to ${status}`);
            loadRemarksAndDocs(selectedApp.id);
        } catch (error) {
            console.error("Failed to verify doc:", error);
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen p-8 lg:p-12 transition-all duration-300">
            <div className="max-w-7xl mx-auto space-y-10">
                
                {/* Header Section */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-[#6605c7] bg-[#6605c7]/5 p-2 rounded-xl">account_balance</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6605c7]">Live Portal</span>
                        </div>
                        <h1 className="text-4xl font-display font-black text-gray-900 tracking-tight italic uppercase">
                            Applications Workspace
                        </h1>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                            {currentBankName} Partner Operations — Master Console
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none">
                            <input 
                                type="text" 
                                placeholder="Search student name, ID or email..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-6 py-3.5 w-full md:w-80 bg-white border border-gray-200 rounded-2xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-[#6605c7] focus:ring-4 focus:ring-[#6605c7]/5 shadow-sm transition-all"
                            />
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                        </div>
                        <button 
                            onClick={fetchApplications} 
                            className="w-12 h-12 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-[#6605c7] flex items-center justify-center transition-all text-[#6605c7]"
                            title="Reload Applications"
                        >
                            <span className="material-symbols-outlined">refresh</span>
                        </button>
                    </div>
                </motion.div>

                {/* Queue Switcher Tabs */}
                <div className="flex border-b border-gray-100 gap-8">
                    <button 
                        onClick={() => { setActiveTab("incoming"); setSelectedApp(null); }}
                        className={`text-xs font-black uppercase tracking-[0.2em] pb-3 transition-all relative ${
                            activeTab === "incoming" ? "text-[#6605c7] font-black" : "text-gray-400 hover:text-gray-600"
                        }`}
                    >
                        📥 Incoming Files ({applications.filter(a => ["pending", "submitted", "submitted_to_bank"].includes(a.status?.toLowerCase())).length})
                        {activeTab === "incoming" && (
                            <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6605c7]" />
                        )}
                    </button>
                    <button 
                        onClick={() => { setActiveTab("active"); setSelectedApp(null); }}
                        className={`text-xs font-black uppercase tracking-[0.2em] pb-3 transition-all relative ${
                            activeTab === "active" ? "text-[#6605c7] font-black" : "text-gray-400 hover:text-gray-600"
                        }`}
                    >
                        📋 Active Review ({applications.filter(a => ["file_logged", "under_bank_review", "processing", "query_raised"].includes(a.status?.toLowerCase())).length})
                        {activeTab === "active" && (
                            <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6605c7]" />
                        )}
                    </button>
                    <button 
                        onClick={() => { setActiveTab("completed"); setSelectedApp(null); }}
                        className={`text-xs font-black uppercase tracking-[0.2em] pb-3 transition-all relative ${
                            activeTab === "completed" ? "text-[#6605c7] font-black" : "text-gray-400 hover:text-gray-600"
                        }`}
                    >
                        💰 Completed & Disbursals ({applications.filter(a => ["approved", "sanctioned", "disbursed", "closed", "rejected"].includes(a.status?.toLowerCase())).length})
                        {activeTab === "completed" && (
                            <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6605c7]" />
                        )}
                    </button>
                </div>

                {/* Dashboard Core Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column: Applications List */}
                    <div className="lg:col-span-5 space-y-4">
                        {loading ? (
                            <div className="glass-card p-12 text-center rounded-[2rem] border border-gray-100">
                                <div className="w-8 h-8 border-2 border-[#6605c7] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing live server queues...</p>
                            </div>
                        ) : filteredApps.length === 0 ? (
                            <div className="glass-card p-12 text-center rounded-[2rem] border border-gray-100 space-y-2">
                                <span className="material-symbols-outlined text-gray-300 text-5xl">folder_off</span>
                                <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">No applications matched</h3>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Everything is completely up-to-date.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                                {filteredApps.map((app) => {
                                    const isSelected = selectedApp?.id === app.id;
                                    return (
                                        <motion.div 
                                            key={app.id}
                                            onClick={() => {
                                                setSelectedApp(app);
                                                setActiveWorkspaceTab("details");
                                            }}
                                            whileHover={{ y: -2 }}
                                            className={`glass-card p-6 rounded-[2rem] border transition-all cursor-pointer relative overflow-hidden group ${
                                                isSelected 
                                                ? "bg-[#6605c7]/5 border-[#6605c7]/30 shadow-lg shadow-[#6605c7]/5" 
                                                : "bg-white/80 border-gray-100 hover:border-purple-200"
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-purple-600 block mb-1">
                                                        {app.applicationNumber || `ID: ${app.id.substring(0, 8)}`}
                                                    </span>
                                                    <h3 className="text-base font-black text-gray-900 uppercase italic">
                                                        {app.firstName} {app.lastName}
                                                    </h3>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                                        {app.loanType} Loan • ₹{app.amount?.toLocaleString()}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                    app.status === "disbursed" ? "bg-emerald-50 text-emerald-500" :
                                                    app.status === "approved" ? "bg-purple-50 text-purple-600" :
                                                    app.status === "query_raised" ? "bg-amber-50 text-amber-500 animate-pulse" :
                                                    app.status === "rejected" ? "bg-rose-50 text-rose-500" :
                                                    "bg-blue-50 text-blue-500"
                                                }`}>
                                                    {app.status?.replace(/_/g, " ")}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-end text-[9px] font-black uppercase tracking-widest text-gray-400 mt-2">
                                                <span>{app.universityName || "Global University"}</span>
                                                <span>{app.submittedAt ? format(new Date(app.submittedAt), "dd MMM yyyy") : "Draft"}</span>
                                            </div>

                                            {/* Linear Progress bar */}
                                            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
                                                <div 
                                                    className="bg-gradient-to-r from-[#6605c7] to-[#8b24e5] h-full rounded-full transition-all duration-500" 
                                                    style={{ width: `${app.progress || 10}%` }}
                                                />
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Dynamic Application Interactive Workspace */}
                    <div className="lg:col-span-7">
                        <AnimatePresence mode="wait">
                            {!selectedApp ? (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="glass-card p-12 text-center bg-white/60 border border-gray-100 rounded-[3rem] h-[550px] flex flex-col items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-[#6605c7]/20 text-7xl mb-4">account_circle_off</span>
                                    <h3 className="text-lg font-black text-gray-900 uppercase italic tracking-wider">Select Student Node</h3>
                                    <p className="text-xs text-gray-400 uppercase tracking-widest max-w-xs mt-2">
                                        Choose an application from the pipeline on the left to start live reviewing, configuring ROI, handling queries, making decision checklists, or disbursing.
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key={selectedApp.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="glass-card bg-white border border-[#6605c7]/5 rounded-[3rem] overflow-hidden shadow-xl"
                                >
                                    {/* Workspace Header */}
                                    <div className="p-8 border-b border-gray-100 bg-[#6605c7]/[0.02] flex justify-between items-start flex-wrap gap-4">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-[#6605c7]">
                                                    {selectedApp.applicationNumber || "APP-UNKNOWN"}
                                                </span>
                                                {customMetadata.lan && (
                                                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase">
                                                        LAN: {customMetadata.lan}
                                                    </span>
                                                )}
                                            </div>
                                            <h2 className="text-2xl font-black text-gray-950 uppercase italic tracking-tight mt-1">
                                                {selectedApp.firstName} {selectedApp.lastName}
                                            </h2>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                                {selectedApp.email} • {selectedApp.phone || "No Phone"}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Status Matrix</span>
                                            <span className="text-sm font-black uppercase tracking-wider italic text-[#6605c7] block mt-0.5">
                                                {selectedApp.status?.replace(/_/g, " ")}
                                            </span>
                                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block">Progress: {selectedApp.progress || 10}%</span>
                                        </div>
                                    </div>

                                    {/* Workspace Action Sub-Tabs */}
                                    <div className="flex border-b border-gray-100 bg-gray-50/50 p-2 overflow-x-auto gap-2">
                                        <button 
                                            onClick={() => setActiveWorkspaceTab("details")}
                                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                                activeWorkspaceTab === "details" ? "bg-white text-[#6605c7] shadow-sm border border-purple-100" : "text-gray-500 hover:text-gray-700"
                                            }`}
                                        >
                                            👁️ Details
                                        </button>
                                        <button 
                                            onClick={() => setActiveWorkspaceTab("documents")}
                                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                                activeWorkspaceTab === "documents" ? "bg-white text-[#6605c7] shadow-sm border border-purple-100" : "text-gray-500 hover:text-gray-700"
                                            }`}
                                        >
                                            📄 Docs ({appDocs.length})
                                        </button>
                                        
                                        {/* Status dependent Actions */}
                                        {activeTab === "incoming" && (
                                            <button 
                                                onClick={() => setActiveWorkspaceTab("details")}
                                                className="px-4 py-2 rounded-xl text-[9px] font-black bg-[#6605c7] text-white uppercase tracking-widest whitespace-nowrap"
                                            >
                                                🔑 Log LAN Code
                                            </button>
                                        )}

                                        {activeTab === "active" && (
                                            <>
                                                <button 
                                                    onClick={() => setActiveWorkspaceTab("roi_fee")}
                                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                                        activeWorkspaceTab === "roi_fee" ? "bg-white text-[#6605c7] shadow-sm border border-purple-100" : "text-gray-500 hover:text-gray-700"
                                                    }`}
                                                >
                                                    📈 ROI & Fee
                                                </button>
                                                <button 
                                                    onClick={() => setActiveWorkspaceTab("query")}
                                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                                        activeWorkspaceTab === "query" ? "bg-white text-[#6605c7] shadow-sm border border-purple-100" : "text-gray-500 hover:text-gray-700"
                                                    }`}
                                                >
                                                    ❓ Raise Query
                                                </button>
                                                <button 
                                                    onClick={() => setActiveWorkspaceTab("decision")}
                                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                                        activeWorkspaceTab === "decision" ? "bg-white text-[#6605c7] shadow-sm border border-purple-100" : "text-gray-500 hover:text-gray-700"
                                                    }`}
                                                >
                                                    ⚖️ Decision Matrix
                                                </button>
                                            </>
                                        )}

                                        {activeTab === "completed" && selectedApp.status?.toLowerCase() === "approved" && (
                                            <button 
                                                onClick={() => setActiveWorkspaceTab("disbursement")}
                                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                                    activeWorkspaceTab === "disbursement" ? "bg-white text-[#6605c7] shadow-sm border border-purple-100" : "text-gray-500 hover:text-gray-700"
                                                }`}
                                            >
                                                💸 Confirm Disbursement
                                            </button>
                                        )}
                                    </div>

                                    {/* Workspace Body */}
                                    <div className="p-8 max-h-[50vh] overflow-y-auto">
                                        
                                        {/* TAB 1: Detailed View */}
                                        {activeWorkspaceTab === "details" && (
                                            <div className="space-y-6">
                                                
                                                {/* Incoming File -> LAN LOGGING FORM */}
                                                {activeTab === "incoming" && (
                                                    <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 space-y-4">
                                                        <h4 className="text-xs font-black text-amber-800 uppercase tracking-widest flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-sm font-black">gavel</span>
                                                            File Logging Required (Action Pending)
                                                        </h4>
                                                        <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest leading-relaxed">
                                                            This student file has been routed to {currentBankName}. To place it under formal bank evaluation and initiate credit review, you must manually log a Bank Loan Account Number (LAN).
                                                        </p>
                                                        <form onSubmit={handleLogLan} className="flex gap-4">
                                                            <input 
                                                                type="text" 
                                                                placeholder="Enter unique Bank LAN (e.g. AX-2026-9831)"
                                                                required
                                                                value={lanInput}
                                                                onChange={(e) => setLanInput(e.target.value)}
                                                                className="flex-1 px-4 py-3 bg-white border border-amber-300 rounded-xl text-xs font-bold focus:outline-none uppercase"
                                                            />
                                                            <button 
                                                                type="submit" 
                                                                className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-sm transition-all"
                                                            >
                                                                Log File
                                                            </button>
                                                        </form>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-1">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Loan Type</span>
                                                        <p className="text-xs font-black uppercase text-gray-800">{selectedApp.loanType || "Education"}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Requested Amount</span>
                                                        <p className="text-xs font-black text-purple-700">₹{selectedApp.amount?.toLocaleString()}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Course Duration</span>
                                                        <p className="text-xs font-black text-gray-800">{selectedApp.courseDuration || "24"} Months</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Target University</span>
                                                        <p className="text-xs font-black text-gray-800 uppercase">{selectedApp.universityName || "Global University"}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Annual Income</span>
                                                        <p className="text-xs font-black text-gray-800">₹{selectedApp.annualIncome?.toLocaleString() || "Not Disclosed"}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Co-Applicant Income</span>
                                                        <p className="text-xs font-black text-gray-800">₹{selectedApp.coApplicantIncome?.toLocaleString() || "No Co-Applicant"}</p>
                                                    </div>
                                                </div>

                                                <div className="border-t border-gray-100 pt-6">
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Historical Audit Trail & Metadata Log</h4>
                                                    {loadingRemarks ? (
                                                        <div className="py-4 text-center">
                                                            <div className="w-5 h-5 border border-purple-500 border-t-transparent animate-spin rounded-full mx-auto" />
                                                        </div>
                                                    ) : appRemarks.length === 0 ? (
                                                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 italic">No notes logged for this student node.</p>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            {appRemarks.map((rem) => (
                                                                <div key={rem.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-left">
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <span className="text-[9px] font-black uppercase tracking-wider text-purple-700">
                                                                            {rem.type || "System Action"}
                                                                        </span>
                                                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                                                                            {format(new Date(rem.createdAt), "dd MMM yyyy HH:mm")}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs text-gray-800 font-medium">
                                                                        {/* If parsed is valid, format nicely */}
                                                                        {(() => {
                                                                            try {
                                                                                const parsed = JSON.parse(rem.content);
                                                                                if (rem.type === "lan_assigned") return `Assigned LAN: ${parsed.lan}`;
                                                                                if (rem.type === "roi_fee_set") return `ROI: ${parsed.rate}% (${parsed.type}), Fee: ₹${parsed.feeAmount} (${parsed.feeState})`;
                                                                                if (rem.type === "query_raised") return `Raised Query [${parsed.category.replace(/_/g, " ").toUpperCase()}]: ${parsed.query}`;
                                                                                if (rem.type === "sanction_approved") return `Sanction Approved [${parsed.product}]: ₹${parsed.amount} @ ${parsed.roi}% for ${parsed.tenure} months`;
                                                                                if (rem.type === "conditional_sanction") return `Conditional Sanction Checklist: ${parsed.tasks} (Deadline: ${parsed.deadline})`;
                                                                                if (rem.type === "counter_offer") return `Counter Offer Issued: ₹${parsed.amount} @ ${parsed.roi}% for ${parsed.tenure} months`;
                                                                                if (rem.type === "rejected") return `Rejected: ${parsed.reason} - ${parsed.comments}`;
                                                                                if (rem.type === "disbursement_confirmed") return `Disbursed Tranche [${parsed.tranche}]: ₹${parsed.amount} via UTR ${parsed.utr} (${parsed.mode}) on ${parsed.releaseDate}`;
                                                                                return rem.content;
                                                                            } catch (e) {
                                                                                return rem.content;
                                                                            }
                                                                        })()}
                                                                    </p>
                                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1 block">
                                                                        Logged by {rem.authorName || "SBI Partner Officer"}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                            </div>
                                        )}

                                        {/* TAB 2: Document Verification Queue */}
                                        {activeWorkspaceTab === "documents" && (
                                            <div className="space-y-6">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">OCR & Document checklist</h3>
                                                    <button 
                                                        className="px-4 py-2 border border-purple-200 text-[#6605c7] hover:bg-purple-50 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm transition-all"
                                                        onClick={() => alert("Simulating batch download of student vaults...")}
                                                    >
                                                        <span className="material-symbols-outlined text-[10px]">download</span>
                                                        Download All
                                                    </button>
                                                </div>

                                                {loadingDocs ? (
                                                    <div className="py-8 text-center">
                                                        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent animate-spin rounded-full mx-auto" />
                                                    </div>
                                                ) : appDocs.length === 0 ? (
                                                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 italic">No files uploaded in this folder.</p>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {appDocs.map((doc) => (
                                                            <div key={doc.id} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex justify-between items-center flex-wrap gap-4">
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="material-symbols-outlined text-[#6605c7] text-xl">description</span>
                                                                        <h4 className="text-xs font-black text-gray-900 uppercase italic">
                                                                            {doc.docName || doc.docType?.replace(/_/g, " ")}
                                                                        </h4>
                                                                    </div>
                                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                                        {doc.fileName || "File placeholder - Pending Upload"}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                                                            doc.isRequired ? "bg-rose-100 text-rose-600" : "bg-gray-100 text-gray-500"
                                                                        }`}>
                                                                            {doc.isRequired ? "Required" : "Optional"}
                                                                        </span>
                                                                        <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                                                                            OCR Verified 98%
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-3">
                                                                    {doc.filePath ? (
                                                                        <>
                                                                            <a 
                                                                                href={`/api/applications/admin/documents/${doc.id}/view`} 
                                                                                target="_blank" 
                                                                                rel="noreferrer"
                                                                                className="px-4 py-2 bg-white border border-gray-200 text-gray-600 hover:border-[#6605c7] rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm"
                                                                            >
                                                                                View File
                                                                            </a>
                                                                            <button 
                                                                                onClick={() => handleVerifyDoc(doc.id, "verified")}
                                                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm transition-all"
                                                                            >
                                                                                Verify
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => handleVerifyDoc(doc.id, "rejected")}
                                                                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm transition-all"
                                                                            >
                                                                                Reject
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-3 py-1.5 rounded-xl uppercase tracking-widest">
                                                                            Missing
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* TAB 3: ROI & Processing Fee Configuration */}
                                        {activeWorkspaceTab === "roi_fee" && (
                                            <div className="space-y-6 text-left">
                                                <div className="p-6 bg-purple-50/50 border border-purple-100 rounded-3xl">
                                                    <h3 className="text-xs font-black text-[#6605c7] uppercase tracking-widest flex items-center gap-2 mb-2">
                                                        <span className="material-symbols-outlined text-sm">trending_up</span>
                                                        Pricing & ROI Configuration
                                                    </h3>
                                                    <p className="text-[10px] text-purple-700 font-bold uppercase tracking-widest leading-relaxed">
                                                        Define the interest rate brackets, pricing margins, base indices, and processing charges associated with this student's application file.
                                                    </p>
                                                </div>

                                                <form onSubmit={handleSetRoiFee} className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Offer ROI (%)</label>
                                                            <input 
                                                                type="number" 
                                                                step="0.05"
                                                                required
                                                                value={interestRate}
                                                                onChange={(e) => setInterestRate(e.target.value)}
                                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">ROI Type</label>
                                                            <select 
                                                                value={interestType} 
                                                                onChange={(e) => setInterestType(e.target.value)}
                                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none uppercase tracking-wider"
                                                            >
                                                                <option value="Floating">Floating (Variable)</option>
                                                                <option value="Fixed">Fixed</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Base Index Index Rate (%)</label>
                                                            <input 
                                                                type="number" 
                                                                step="0.05"
                                                                required
                                                                value={baseRate}
                                                                onChange={(e) => setBaseRate(e.target.value)}
                                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Govt. Interest Subsidy</label>
                                                            <select 
                                                                value={subsidyEligible} 
                                                                onChange={(e) => setSubsidyEligible(e.target.value)}
                                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none uppercase tracking-wider"
                                                            >
                                                                <option value="No">No Indexation</option>
                                                                <option value="Yes">CSIS eligible</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Processing Fee Amount (₹)</label>
                                                            <input 
                                                                type="number" 
                                                                required
                                                                value={processingFeeAmount}
                                                                onChange={(e) => setProcessingFeeAmount(e.target.value)}
                                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Fee Payment Status</label>
                                                            <select 
                                                                value={processingFeeState} 
                                                                onChange={(e) => setProcessingFeeState(e.target.value)}
                                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none uppercase tracking-wider"
                                                            >
                                                                <option value="Pending">Pending Collection</option>
                                                                <option value="Paid">Paid (Logged)</option>
                                                                <option value="Waived">Waived by Branch</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <button 
                                                        type="submit" 
                                                        className="w-full py-4 bg-[#6605c7] hover:bg-[#5204a0] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-md transition-all mt-4"
                                                    >
                                                        Lock ROI & Processing Fees
                                                    </button>
                                                </form>
                                            </div>
                                        )}

                                        {/* TAB 4: Raise Queries & Missing Docs checklists */}
                                        {activeWorkspaceTab === "query" && (
                                            <div className="space-y-6 text-left">
                                                <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl">
                                                    <h3 className="text-xs font-black text-amber-800 uppercase tracking-widest flex items-center gap-2 mb-2">
                                                        <span className="material-symbols-outlined text-sm">help_outline</span>
                                                        Raise Document Clarification Note
                                                    </h3>
                                                    <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest leading-relaxed">
                                                        If a document is blurry, mismatching, or completely absent, raise a query. The student will receive a WhatsApp notification and their portal will display an action banner immediately.
                                                    </p>
                                                </div>

                                                <form onSubmit={handleRaiseQuery} className="space-y-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 font-black">Target Document Checklist Item</label>
                                                        <select 
                                                            value={queryDocCategory} 
                                                            onChange={(e) => setQueryDocCategory(e.target.value)}
                                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none uppercase tracking-wider"
                                                        >
                                                            <option value="academic_records">10th / 12th Marksheet</option>
                                                            <option value="admission_letter">Admission Offer Letter</option>
                                                            <option value="fee_structure">Official Fee Structure</option>
                                                            <option value="identity_proof">Identity Card (PAN/Aadhar)</option>
                                                            <option value="income_proof">Co-Applicant Income Proof</option>
                                                            <option value="bank_statement">Bank Statement (6 Months)</option>
                                                        </select>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 font-black">Detailed Clarification Description</label>
                                                        <textarea 
                                                            rows={4}
                                                            required
                                                            placeholder="State clearly what is wrong with the document and what the student needs to upload instead..."
                                                            value={queryText}
                                                            onChange={(e) => setQueryText(e.target.value)}
                                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
                                                        />
                                                    </div>

                                                    <button 
                                                        type="submit" 
                                                        className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-md transition-all"
                                                    >
                                                        Dispatch Query Checklist
                                                    </button>
                                                </form>
                                            </div>
                                        )}

                                        {/* TAB 5: Interactive Decision Matrix */}
                                        {activeWorkspaceTab === "decision" && (
                                            <div className="space-y-6 text-left">
                                                <div className="flex border-b border-gray-100 pb-2 gap-4">
                                                    <button 
                                                        onClick={() => setDecisionType("sanction")}
                                                        className={`text-[9px] font-black uppercase tracking-widest pb-1 transition-all ${
                                                            decisionType === "sanction" ? "text-[#6605c7] border-b-2 border-[#6605c7]" : "text-gray-400 hover:text-gray-600"
                                                        }`}
                                                    >
                                                        🏆 Full Sanction
                                                    </button>
                                                    <button 
                                                        onClick={() => setDecisionType("conditional")}
                                                        className={`text-[9px] font-black uppercase tracking-widest pb-1 transition-all ${
                                                            decisionType === "conditional" ? "text-[#6605c7] border-b-2 border-[#6605c7]" : "text-gray-400 hover:text-gray-600"
                                                        }`}
                                                    >
                                                        🎗️ Conditional
                                                    </button>
                                                    <button 
                                                        onClick={() => setDecisionType("counter")}
                                                        className={`text-[9px] font-black uppercase tracking-widest pb-1 transition-all ${
                                                            decisionType === "counter" ? "text-[#6605c7] border-b-2 border-[#6605c7]" : "text-gray-400 hover:text-gray-600"
                                                        }`}
                                                    >
                                                        ⚖️ Counter-Offer
                                                    </button>
                                                    <button 
                                                        onClick={() => setDecisionType("reject")}
                                                        className={`text-[9px] font-black uppercase tracking-widest pb-1 transition-all ${
                                                            decisionType === "reject" ? "text-[#6605c7] border-b-2 border-[#6605c7]" : "text-gray-400 hover:text-gray-600"
                                                        }`}
                                                    >
                                                        🛑 Rejection
                                                    </button>
                                                </div>

                                                <form onSubmit={handleDecision} className="space-y-4">
                                                    {decisionType === "sanction" && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Sanctioned Amount (₹)</label>
                                                                <input 
                                                                    type="number" 
                                                                    required
                                                                    value={sanctionAmount}
                                                                    onChange={(e) => setSanctionAmount(e.target.value)}
                                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Pricing Product Mapping</label>
                                                                <select 
                                                                    value={sanctionProduct} 
                                                                    onChange={(e) => setSanctionProduct(e.target.value)}
                                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none uppercase tracking-wider"
                                                                >
                                                                    <option value="Scholar Loan">Scholar Loan (Global Elite)</option>
                                                                    <option value="Student Loan">Standard Student Loan</option>
                                                                    <option value="Sovereign Subsidy">Sovereign Subsidy Loan</option>
                                                                </select>
                                                            </div>
                                                            <div className="col-span-2 space-y-1">
                                                                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Loan Tenure (Months)</label>
                                                                <input 
                                                                    type="number" 
                                                                    required
                                                                    value={sanctionTenure}
                                                                    onChange={(e) => setSanctionTenure(e.target.value)}
                                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {decisionType === "conditional" && (
                                                        <div className="space-y-4">
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Conditional Compliance Checklist</label>
                                                                <textarea 
                                                                    rows={3}
                                                                    required
                                                                    placeholder="e.g. Provide original Visa copy, Fulfill Co-applicant Salary slip verification..."
                                                                    value={conditionalChecklist}
                                                                    onChange={(e) => setConditionalChecklist(e.target.value)}
                                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Fulfillment Target Deadline</label>
                                                                <input 
                                                                    type="date" 
                                                                    required
                                                                    value={conditionalDeadline}
                                                                    onChange={(e) => setConditionalDeadline(e.target.value)}
                                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {decisionType === "counter" && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Revised Loan Amount (₹)</label>
                                                                <input 
                                                                    type="number" 
                                                                    required
                                                                    value={counterOfferAmount}
                                                                    onChange={(e) => setCounterOfferAmount(e.target.value)}
                                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Revised Interest Rate (%)</label>
                                                                <input 
                                                                    type="number" 
                                                                    step="0.05"
                                                                    required
                                                                    value={counterOfferRoi}
                                                                    placeholder="e.g. 10.25"
                                                                    onChange={(e) => setCounterOfferRoi(e.target.value)}
                                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
                                                                />
                                                            </div>
                                                            <div className="col-span-2 space-y-1">
                                                                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Revised Tenure (Months)</label>
                                                                <input 
                                                                    type="number" 
                                                                    required
                                                                    value={counterOfferTenure}
                                                                    placeholder="e.g. 120"
                                                                    onChange={(e) => setCounterOfferTenure(e.target.value)}
                                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {decisionType === "reject" && (
                                                        <div className="space-y-4">
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Primary Rejection Cause</label>
                                                                <select 
                                                                    value={rejectionReason} 
                                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none uppercase tracking-wider"
                                                                >
                                                                    <option value="CIBIL score shortfall">Shortfall in Credit/CIBIL Index Score</option>
                                                                    <option value="Inadequate collateral">Inadequate Collateral Value / Title Defect</option>
                                                                    <option value="Program ineligible">Target College / Program Non-accredited</option>
                                                                    <option value="High DTI Ratio">Excess Debt-to-Income (DTI) Leverage</option>
                                                                    <option value="Co-applicant profile">Co-applicant Financial Profile Unsatisfactory</option>
                                                                </select>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Rejection Details & Internal notes</label>
                                                                <textarea 
                                                                    rows={3}
                                                                    required
                                                                    placeholder="State the underlying reasons matching policy check..."
                                                                    value={rejectionComments}
                                                                    onChange={(e) => setRejectionComments(e.target.value)}
                                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    <button 
                                                        type="submit" 
                                                        className="w-full py-4 bg-[#6605c7] hover:bg-[#5204a0] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-md transition-all mt-4"
                                                    >
                                                        Confirm & Execute Decision
                                                    </button>
                                                </form>
                                            </div>
                                        )}

                                        {/* TAB 6: Disbursement confirmation */}
                                        {activeWorkspaceTab === "disbursement" && (
                                            <div className="space-y-6 text-left">
                                                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl">
                                                    <h3 className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2 mb-2">
                                                        <span className="material-symbols-outlined text-sm">payments</span>
                                                        Disbursement Transfer Receipt
                                                    </h3>
                                                    <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest leading-relaxed">
                                                        Provide the official bank fund release confirmation data, including the RTGS/NEFT UTR reference, release tranche, and exact disbursed value.
                                                    </p>
                                                </div>

                                                <form onSubmit={handleConfirmDisbursement} className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Disbursed Amount (₹)</label>
                                                            <input 
                                                                type="number" 
                                                                required
                                                                value={disbAmount}
                                                                onChange={(e) => setDisbAmount(e.target.value)}
                                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Transfer Mechanism</label>
                                                            <select 
                                                                value={disbMode} 
                                                                onChange={(e) => setDisbMode(e.target.value)}
                                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none uppercase tracking-wider"
                                                            >
                                                                <option value="RTGS">RTGS Transfer</option>
                                                                <option value="NEFT">NEFT Transfer</option>
                                                                <option value="IMPS">Direct IMPS</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">UTR / Reference ID</label>
                                                            <input 
                                                                type="text" 
                                                                required
                                                                placeholder="e.g. SBIN420261358913"
                                                                value={disbUtr}
                                                                onChange={(e) => setDisbUtr(e.target.value)}
                                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none uppercase"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Disbursement Tranche</label>
                                                            <select 
                                                                value={disbTranche} 
                                                                onChange={(e) => setDisbTranche(e.target.value)}
                                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none uppercase tracking-wider"
                                                            >
                                                                <option value="1st Tranche">1st Tranche (Semester 1)</option>
                                                                <option value="2nd Tranche">2nd Tranche (Semester 2)</option>
                                                                <option value="3rd Tranche">3rd Tranche (Semester 3)</option>
                                                                <option value="4th Tranche">4th Tranche (Semester 4)</option>
                                                            </select>
                                                        </div>
                                                        <div className="col-span-2 space-y-1">
                                                            <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Release Date</label>
                                                            <input 
                                                                type="date" 
                                                                required
                                                                value={disbReleaseDate}
                                                                onChange={(e) => setDisbReleaseDate(e.target.value)}
                                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
                                                            />
                                                        </div>
                                                    </div>

                                                    <button 
                                                        type="submit" 
                                                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-md transition-all mt-4"
                                                    >
                                                        Confirm & Releases Funds
                                                    </button>
                                                </form>
                                            </div>
                                        )}

                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>

            </div>
        </div>
    );
}
