"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, bankApi } from "@/lib/api";

export default function ApplicationManagement() {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    
    // Core data states
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");

    // Sidebar & notes states
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [remarksLoading, setRemarksLoading] = useState(false);
    const [newRemark, setNewRemark] = useState("");

    // Modal states
    const [showLanModal, setShowLanModal] = useState(false);
    const [lanNumber, setLanNumber] = useState("");
    const [showDecisionModal, setShowDecisionModal] = useState(false);
    const [decisionType, setDecisionType] = useState<"sanctioned" | "conditional" | "counter" | "rejected">("sanctioned");

    // Underwriting decision form fields
    const [sanctionAmount, setSanctionAmount] = useState("");
    const [processingFee, setProcessingFee] = useState("");
    const [roiType, setRoiType] = useState("floating");
    const [roiBase, setRoiBase] = useState("");
    const [roiSubsidy, setRoiSubsidy] = useState("");
    const [roiEffective, setRoiEffective] = useState("");
    const [sanctionedInterestRate, setSanctionedInterestRate] = useState("");
    const [sanctionLetterUrl, setSanctionLetterUrl] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");
    const [conditions, setConditions] = useState("");
    const [counterAmount, setCounterAmount] = useState("");
    const [counterRate, setCounterRate] = useState("");
    const [counterTenure, setCounterTenure] = useState("");

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch applications from the backend
    const fetchApplications = async () => {
        setLoading(true);
        try {
            const incoming = await bankApi.getIncomingFiles() as any[];
            const myFiles = await bankApi.getMyFiles() as any[];
            const allFetched = [...(incoming || []), ...(myFiles || [])];
            const uniqueApps = Array.from(new Map(allFetched.map(item => [item.id, item])).values());
            setApplications(uniqueApps);
        } catch (error) {
            console.error("Failed to load bank applications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) {
            fetchApplications();
        }
    }, [mounted]);

    // Handle selecting an application and fetching details
    const handleSelectApp = async (app: any) => {
        setSelectedApp(app);
        // Reset states for current app
        setLanNumber(app.lanNumber || "");
        setSanctionAmount(app.amount ? app.amount.toString() : "");
        setProcessingFee("");
        setRoiType("floating");
        setRoiBase("");
        setRoiSubsidy("");
        setRoiEffective("");
        setSanctionedInterestRate("");
        setSanctionLetterUrl("");
        setRejectionReason("");
        setConditions("");
        setCounterAmount("");
        setCounterRate("");
        setCounterTenure("");

        try {
            // Fetch documents and remarks/notes in parallel
            const [docs, notes] = await Promise.all([
                bankApi.getDocuments(app.id),
                adminApi.getRemarks(app.id)
            ]);

            const formattedRemarks = Array.isArray(notes)
                ? notes.map((n: any) => `${n.author || "Staff"} (${new Date(n.createdAt).toLocaleDateString()}): ${n.content}`).join("\n")
                : app.remarks || "";

            setSelectedApp((prev: any) => {
                if (!prev || prev.id !== app.id) return prev;
                return {
                    ...prev,
                    documents: docs || [],
                    remarks: formattedRemarks
                };
            });
        } catch (error) {
            console.error("Error loading application details:", error);
        }
    };

    // Add note/remark form submit
    const handleAddRemark = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRemark.trim() || !selectedApp) return;

        setRemarksLoading(true);
        try {
            await adminApi.addRemark(selectedApp.id, {
                type: "remark",
                content: newRemark,
            });
            
            const timestamp = new Date().toLocaleDateString();
            const authorName = user?.firstName || "Bank Staff";
            const newNoteFormatted = `${authorName} (${timestamp}): ${newRemark}`;
            
            setSelectedApp((prev: any) => {
                if (!prev) return null;
                return {
                    ...prev,
                    remarks: prev.remarks ? `${prev.remarks}\n${newNoteFormatted}` : newNoteFormatted
                };
            });
            
            // Also update in parent list
            setApplications(prev => prev.map(a => a.id === selectedApp.id ? {
                ...a,
                remarks: a.remarks ? `${a.remarks}\n${newNoteFormatted}` : newNoteFormatted
            } : a));

            setNewRemark("");
        } catch (error) {
            console.error("Failed to add remark:", error);
            alert("Failed to add note: " + (error as Error).message);
        } finally {
            setRemarksLoading(false);
        }
    };

    // Log file and save LAN Number
    const handleLogFile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lanNumber.trim() || !selectedApp) return;

        try {
            await bankApi.logFile(selectedApp.id, { lanNumber });
            alert("LAN Number saved and file logged successfully.");
            
            const updated = {
                ...selectedApp,
                lanNumber,
                status: "under_bank_review"
            };
            setSelectedApp(updated);
            setApplications(prev => prev.map(a => a.id === selectedApp.id ? updated : a));
            setShowLanModal(false);
        } catch (error) {
            console.error("Failed to log file:", error);
            alert("Failed to log file: " + (error as Error).message);
        }
    };

    // Submit underwriting decision
    const handleDecision = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedApp) return;

        try {
            let res;
            const basePayload = {
                applicationId: selectedApp.id,
                decision: decisionType,
            };

            if (decisionType === "sanctioned") {
                const sanctionPayload = {
                    ...basePayload,
                    sanctionAmount: Number(sanctionAmount),
                    processingFee: Number(processingFee || 0),
                    roiType,
                    roiBase: Number(roiBase || 0),
                    roiSubsidy: Number(roiSubsidy || 0),
                    roiEffective: Number(roiEffective),
                    sanctionedInterestRate: Number(roiEffective),
                    sanctionLetterUrl: sanctionLetterUrl || "/docs/sanction-letter.pdf"
                };
                res = await bankApi.submitDecision(sanctionPayload);
                if (sanctionLetterUrl) {
                    await bankApi.uploadSanctionLetter(selectedApp.id, sanctionLetterUrl);
                }
            } else if (decisionType === "rejected") {
                res = await bankApi.submitDecision({
                    ...basePayload,
                    rejectionReason
                });
            } else if (decisionType === "conditional") {
                res = await bankApi.conditionalSanction({
                    applicationId: selectedApp.id,
                    conditions
                });
            } else if (decisionType === "counter") {
                res = await bankApi.counterOffer({
                    applicationId: selectedApp.id,
                    amount: Number(counterAmount),
                    rate: Number(counterRate),
                    tenure: Number(counterTenure)
                });
            }

            alert("Decision submitted successfully.");
            
            const nextStatus = decisionType === "sanctioned" ? "approved" : decisionType === "rejected" ? "rejected" : "processing";
            const updated = {
                ...selectedApp,
                status: nextStatus
            };
            
            setSelectedApp(null);
            setApplications(prev => prev.map(a => a.id === selectedApp.id ? updated : a));
            setShowDecisionModal(false);
        } catch (error) {
            console.error("Failed to submit decision:", error);
            alert("Failed to submit decision: " + (error as Error).message);
        }
    };

    // Filter and compute application metrics for visual queues
    const filteredApplications = useMemo(() => {
        return applications.filter(app => {
            const status = app.status?.toLowerCase() || "pending";
            let inTab = false;
            if (activeTab === "pending") {
                inTab = !["approved", "sanctioned", "rejected", "disbursed"].includes(status);
            } else if (activeTab === "approved") {
                inTab = ["approved", "sanctioned", "disbursed"].includes(status);
            } else if (activeTab === "rejected") {
                inTab = status === "rejected";
            }
            
            if (!inTab) return false;

            if (!searchTerm.trim()) return true;
            const term = searchTerm.toLowerCase();
            const appNum = (app.applicationNumber || "").toLowerCase();
            const fullName = `${app.firstName || ""} ${app.lastName || ""}`.toLowerCase();
            return appNum.includes(term) || fullName.includes(term);
        });
    }, [applications, activeTab, searchTerm]);

    const pendingCount = useMemo(() => {
        return applications.filter(app => !["approved", "sanctioned", "rejected", "disbursed"].includes(app.status?.toLowerCase() || "pending")).length;
    }, [applications]);

    const approvedCount = useMemo(() => {
        return applications.filter(app => ["approved", "sanctioned", "disbursed"].includes(app.status?.toLowerCase() || "")).length;
    }, [applications]);

    const rejectedCount = useMemo(() => {
        return applications.filter(app => (app.status?.toLowerCase() || "") === "rejected").length;
    }, [applications]);

    if (!mounted) return null;

    return (
        <div className="min-h-screen p-8 lg:p-12 pl-[100px] lg:pl-[320px] transition-all duration-300">
            <div className="max-w-7xl mx-auto space-y-12">
                
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-rose-600 bg-rose-50 p-2 rounded-xl">gavel</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-600">Module 02</span>
                        </div>
                        <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight">Application Management</h1>
                        <p className="text-sm text-gray-500 mt-2 font-medium">Processing pipeline for Reject / Sanction decisions.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="w-12 h-12 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-[#6605c7] flex items-center justify-center transition-all">
                            <span className="material-symbols-outlined text-gray-400">filter_list</span>
                        </button>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Search by ID or Name..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-6 py-3 w-64 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#6605c7] focus:ring-4 focus:ring-[#6605c7]/5 shadow-sm transition-all"
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

                {/* Pipeline Matrix Shell */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden">
                    <div className="p-8 border-b border-gray-100 flex gap-8">
                        <button 
                            onClick={() => setActiveTab("pending")} 
                            className={`text-sm font-bold pb-2 transition-all ${activeTab === "pending" ? "text-[#6605c7] border-b-2 border-[#6605c7]" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            Pending Review ({pendingCount})
                        </button>
                        <button 
                            onClick={() => setActiveTab("approved")} 
                            className={`text-sm font-bold pb-2 transition-all ${activeTab === "approved" ? "text-[#6605c7] border-b-2 border-[#6605c7]" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            Approved Queue ({approvedCount})
                        </button>
                        <button 
                            onClick={() => setActiveTab("rejected")} 
                            className={`text-sm font-bold pb-2 transition-all ${activeTab === "rejected" ? "text-[#6605c7] border-b-2 border-[#6605c7]" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            Rejected ({rejectedCount})
                        </button>
                    </div>
                    
                    <div className="p-8 min-h-[400px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="w-12 h-12 border-4 border-[#6605c7]/10 border-t-[#6605c7] rounded-full animate-spin mb-4" />
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading applications matrix...</p>
                            </div>
                        ) : filteredApplications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <span className="material-symbols-outlined text-gray-200 text-6xl mb-4">folder_open</span>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">No Applications Found</h3>
                                <p className="text-xs text-gray-400 max-w-sm">No student applications found matching this queue or search filter.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="pb-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Application Ref</th>
                                            <th className="pb-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Applicant</th>
                                            <th className="pb-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Requested Amount</th>
                                            <th className="pb-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Institution & Course</th>
                                            <th className="pb-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                            <th className="pb-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredApplications.map((app) => (
                                            <tr key={app.id} className="hover:bg-gray-50/50 transition-all group">
                                                <td className="py-5 pr-4">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#6605c7] bg-purple-50 px-2.5 py-1.5 rounded-lg border border-purple-100">
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
                                                    <div className="text-xs font-semibold text-gray-700 max-w-[200px] truncate" title={app.universityName}>{app.universityName || "University of Foreign Intake"}</div>
                                                    <div className="text-[10px] text-gray-400 font-medium mt-0.5 max-w-[200px] truncate" title={app.courseName}>{app.courseName || "Masters / UG Degree"}</div>
                                                </td>
                                                <td className="py-5 pr-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                                        app.status?.toLowerCase() === "approved" || app.status?.toLowerCase() === "sanctioned" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                        app.status?.toLowerCase() === "rejected" ? "bg-rose-50 text-rose-600 border-rose-100" :
                                                        app.status?.toLowerCase() === "disbursed" ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                                                        "bg-amber-50 text-amber-600 border-amber-100 animate-pulse"
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                            app.status?.toLowerCase() === "approved" || app.status?.toLowerCase() === "sanctioned" ? "bg-emerald-500" :
                                                            app.status?.toLowerCase() === "rejected" ? "bg-rose-500" :
                                                            app.status?.toLowerCase() === "disbursed" ? "bg-indigo-500" :
                                                            "bg-amber-500 animate-ping"
                                                        }`} />
                                                        {app.status || "Pending Review"}
                                                    </span>
                                                </td>
                                                <td className="py-5 text-right">
                                                    <button 
                                                        onClick={() => handleSelectApp(app)}
                                                        className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#6605c7] shadow-sm transition-all group-hover:scale-105"
                                                    >
                                                        Review & Decide
                                                    </button>
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
                                            {selectedApp.applicationNumber || "Pending LAN"}
                                        </span>
                                        <h2 className="text-2xl font-black text-gray-900 mt-2 uppercase tracking-tight">
                                            {selectedApp.firstName} {selectedApp.lastName}
                                        </h2>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                            {selectedApp.email} · {selectedApp.phone || "No phone added"}
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
                                        <span className="text-sm font-bold text-gray-900">₹{(selectedApp.amount || 0).toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Course Program</span>
                                        <span className="text-sm font-bold text-gray-900 truncate block">{selectedApp.courseName || "Masters / UG Degree"}</span>
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
                                                    setSanctionAmount((selectedApp.amount || 0).toString());
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
                        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowLanModal(false)} />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl p-8 max-w-md w-full z-10 relative overflow-hidden"
                        >
                            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Log File & Enter LAN</h3>
                            <p className="text-xs text-gray-400 mb-6 font-bold uppercase tracking-wider">Acknowledge receipt and assign the bank's internal Loan Account Number.</p>
                            
                            <form onSubmit={handleLogFile} className="space-y-5">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Loan Account Number (LAN)</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="e.g. LAN-IDFC-99281-22"
                                        value={lanNumber}
                                        onChange={(e) => setLanNumber(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#6605c7] focus:ring-4 focus:ring-[#6605c7]/5 shadow-sm transition-all"
                                    />
                                </div>
                                <div className="flex gap-4 pt-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowLanModal(false)}
                                        className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 shadow-lg shadow-gray-900/10 transition-all"
                                    >
                                        Save & Log File
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
