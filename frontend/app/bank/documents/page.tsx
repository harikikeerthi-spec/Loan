"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi, bankApi } from "@/lib/api";

export default function DocumentReviewCenter() {
    const [mounted, setMounted] = useState(false);
    const [currentBankId, setCurrentBankId] = useState<string>("idfc");
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
    const [appDocs, setAppDocs] = useState<Record<string, any[]>>({});
    const [docsLoading, setDocsLoading] = useState<Record<string, boolean>>({});

    // Verify modal state
    const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [verifyStatus, setVerifyStatus] = useState<"verified" | "rejected">("verified");
    const [rejectionReason, setRejectionReason] = useState("");
    const [verifying, setVerifying] = useState(false);

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
            console.error("Failed to load applications for documents:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) {
            fetchApplications(currentBankId);
        }
    }, [currentBankId, mounted]);

    const fetchAppDocuments = async (appId: string) => {
        if (appDocs[appId]) return; // already loaded
        setDocsLoading(prev => ({ ...prev, [appId]: true }));
        try {
            const res: any = await adminApi.getApplicationDocuments(appId);
            if (res && res.success) {
                setAppDocs(prev => ({ ...prev, [appId]: res.data || [] }));
            }
        } catch (err) {
            console.error("Failed to fetch documents for application:", appId, err);
        } finally {
            setDocsLoading(prev => ({ ...prev, [appId]: false }));
        }
    };

    const toggleExpand = (appId: string) => {
        if (expandedAppId === appId) {
            setExpandedAppId(null);
        } else {
            setExpandedAppId(appId);
            fetchAppDocuments(appId);
        }
    };

    const filteredApps = useMemo(() => {
        return applications.filter(app => {
            const matchesSearch = 
                (app.applicationNumber || "").toLowerCase().includes(search.toLowerCase()) ||
                (`${app.firstName || ""} ${app.lastName || ""}`).toLowerCase().includes(search.toLowerCase()) ||
                (app.lanNumber || "").toLowerCase().includes(search.toLowerCase());
            return matchesSearch;
        });
    }, [applications, search]);

    const handleVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDoc || !expandedAppId) return;
        setVerifying(true);

        try {
            const res: any = await adminApi.verifyDocument(
                expandedAppId, 
                selectedDoc.id.startsWith('vault_') ? selectedDoc.id : `vault_${selectedDoc.id}`, 
                verifyStatus, 
                verifyStatus === "rejected" ? rejectionReason : undefined
            );
            if (res && res.success) {
                setShowVerifyModal(false);
                setSelectedDoc(null);
                setRejectionReason("");
                
                // Force reload documents for this application
                setDocsLoading(prev => ({ ...prev, [expandedAppId]: true }));
                const docsRes: any = await adminApi.getApplicationDocuments(expandedAppId);
                if (docsRes && docsRes.success) {
                    setAppDocs(prev => ({ ...prev, [expandedAppId]: docsRes.data || [] }));
                }
            }
        } catch (err) {
            console.error("Failed to verify document:", err);
            alert("Failed to submit verification status");
        } finally {
            setVerifying(false);
            setDocsLoading(prev => ({ ...prev, [expandedAppId]: false }));
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
                            <span className="material-symbols-outlined text-purple-600 bg-purple-50 p-2 rounded-xl">folder_shared</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-600">Module 03 ΓÇó Documents</span>
                        </div>
                        <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight">Document Vault</h1>
                        <p className="text-sm text-gray-500 mt-2 font-medium">Verify identity proofs, academic degrees, and financial assets uploaded by students.</p>
                    </div>
                    <div className="flex gap-4 w-full lg:w-auto">
                        <div className="relative flex-1 lg:flex-none">
                            <input 
                                type="text" 
                                placeholder="Search by student name..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-12 pr-6 py-3 w-full lg:w-72 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#6605c7] focus:ring-4 focus:ring-[#6605c7]/5 shadow-sm transition-all"
                            />
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                        </div>
                    </div>
                </div>

                {/* Applications Document Grid */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 p-8">
                    {loading ? (
                        <div className="h-[400px] flex flex-col items-center justify-center gap-4">
                            <div className="w-12 h-12 border-4 border-gray-100 border-t-purple-600 rounded-full animate-spin" />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Syncing document directories...</span>
                        </div>
                    ) : filteredApps.length === 0 ? (
                        <div className="h-[300px] flex flex-col items-center justify-center text-center">
                            <span className="material-symbols-outlined text-gray-200 text-6xl mb-4">folder_off</span>
                            <h3 className="text-sm font-bold text-gray-900 mb-1">No applications found</h3>
                            <p className="text-xs text-gray-400 max-w-xs">There are no files matching your document query.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredApps.map((app) => {
                                const isExpanded = expandedAppId === app.id;
                                const isDocLoading = docsLoading[app.id];
                                const docs = appDocs[app.id] || [];

                                return (
                                    <div 
                                        key={app.id}
                                        className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white transition-all hover:border-purple-200"
                                    >
                                        {/* Row Header */}
                                        <div 
                                            onClick={() => toggleExpand(app.id)}
                                            className="p-6 flex items-center justify-between cursor-pointer hover:bg-purple-50/10 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                                                    <span className="material-symbols-outlined text-xl">account_box</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                                                        {app.firstName} {app.lastName}
                                                    </h3>
                                                    <span className="text-[9px] font-semibold text-gray-400 block mt-0.5">
                                                        App: {app.applicationNumber} ΓÇó LAN: {app.lanNumber || "Pending"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="text-right hidden md:block">
                                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Institution</span>
                                                    <span className="text-xs font-bold text-gray-700">{app.universityName || "Stanford University"}</span>
                                                </div>
                                                <span className="material-symbols-outlined text-gray-400 transition-transform duration-300" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                                                    keyboard_arrow_down
                                                </span>
                                            </div>
                                        </div>

                                        {/* Expanded Document Grid */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: "auto" }}
                                                    exit={{ height: 0 }}
                                                    className="border-t border-gray-100 bg-gray-50/30 overflow-hidden"
                                                >
                                                    <div className="p-6 space-y-4">
                                                        {isDocLoading ? (
                                                            <div className="py-8 flex justify-center items-center gap-3">
                                                                <div className="w-5 h-5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Scanning student documents...</span>
                                                            </div>
                                                        ) : docs.length === 0 ? (
                                                            <div className="py-6 text-center">
                                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">No files uploaded for this application.</span>
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {docs.map((doc: any) => {
                                                                    const docStatusColors: Record<string, string> = {
                                                                        verified: "text-emerald-600 bg-emerald-50 border-emerald-100",
                                                                        rejected: "text-rose-600 bg-rose-50 border-rose-100",
                                                                        uploaded: "text-blue-600 bg-blue-50 border-blue-100",
                                                                        pending: "text-amber-600 bg-amber-50 border-amber-100"
                                                                    };

                                                                    return (
                                                                        <div 
                                                                            key={doc.id}
                                                                            className="p-4 bg-white border border-gray-100 rounded-xl flex items-center justify-between gap-3 shadow-sm min-w-0"
                                                                        >
                                                                            <div className="flex items-center gap-3 min-w-0">
                                                                                <span className="material-symbols-outlined text-gray-400 flex-shrink-0">description</span>
                                                                                <div className="min-w-0">
                                                                                    <span className="text-xs font-bold text-gray-800 uppercase tracking-tight block truncate" title={doc.docType}>
                                                                                        {doc.docType}
                                                                                    </span>
                                                                                    <div className="flex items-center gap-2 mt-1">
                                                                                        <span className={`px-2 py-0.5 border rounded text-[7px] font-black uppercase tracking-wider ${docStatusColors[doc.status || "pending"]}`}>
                                                                                            {doc.status || "Pending"}
                                                                                        </span>
                                                                                        {doc.rejectionReason && (
                                                                                            <span className="text-[8px] font-semibold text-rose-500 max-w-[120px] truncate block" title={doc.rejectionReason}>
                                                                                                Reason: {doc.rejectionReason}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                                <a 
                                                                                    href={`/api/applications/admin/${expandedAppId}/documents/${doc.id}/view?token=${typeof window !== "undefined" ? (localStorage.getItem("bankAccessToken") || localStorage.getItem("adminAccessToken") || "") : ""}`} 
                                                                                    target="_blank" 
                                                                                    rel="noreferrer"
                                                                                    className="p-2 bg-gray-50 border border-gray-100 text-gray-400 hover:text-[#6605c7] hover:border-[#6605c7]/10 hover:bg-[#6605c7]/5 rounded-lg transition-all"
                                                                                    title="View file"
                                                                                >
                                                                                    <span className="material-symbols-outlined text-base">visibility</span>
                                                                                </a>
                                                                                {doc.status !== "verified" && (
                                                                                    <button 
                                                                                        onClick={() => {
                                                                                            setSelectedDoc(doc);
                                                                                            setVerifyStatus("verified");
                                                                                            setShowVerifyModal(true);
                                                                                        }}
                                                                                        className="px-3 py-1.5 bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-gray-800 transition-all flex items-center gap-1 shadow-sm"
                                                                                    >
                                                                                        Verify
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Document Verify Modal */}
            <AnimatePresence>
                {showVerifyModal && selectedDoc && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowVerifyModal(false)} />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl p-8 max-w-md w-full z-10 relative overflow-hidden"
                        >
                            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Verify Document Asset</h3>
                            <p className="text-xs text-gray-400 mb-6 font-bold uppercase tracking-wider">Acknowledge suitability or specify defects for resubmission.</p>

                            <form onSubmit={handleVerifySubmit} className="space-y-5">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Audit Verdict</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setVerifyStatus("verified")}
                                            className={`py-3 px-4 border rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                                                verifyStatus === "verified" 
                                                    ? "border-emerald-600 bg-emerald-50 text-emerald-600" 
                                                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-base">check_circle</span>
                                            Accept Asset
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setVerifyStatus("rejected")}
                                            className={`py-3 px-4 border rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                                                verifyStatus === "rejected" 
                                                    ? "border-rose-600 bg-rose-50 text-rose-600" 
                                                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-base">cancel</span>
                                            Reject Asset
                                        </button>
                                    </div>
                                </div>

                                {verifyStatus === "rejected" && (
                                    <div>
                                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Defect description</label>
                                        <textarea
                                            required
                                            rows={3}
                                            placeholder="Provide reasoning for reject verdict (e.g. Blurry photo, expired date)..."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7]"
                                        />
                                    </div>
                                )}

                                <div className="flex gap-4 pt-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowVerifyModal(false)}
                                        className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={verifying}
                                        className="flex-1 py-3 bg-[#6605c7] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#5203a4] shadow-lg shadow-purple-500/10 transition-all flex items-center justify-center"
                                    >
                                        {verifying ? "..." : "Save Audit"}
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
