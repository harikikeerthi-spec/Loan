"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { staffProfileApi, bankApi } from "@/lib/api";

export default function DocumentManagement() {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    
    // Core data states
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<"pending" | "verified" | "rejected">("pending");

    // Modal & action states
    const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [verifyStatus, setVerifyStatus] = useState<"verified" | "rejected">("verified");
    const [rejectionReason, setRejectionReason] = useState("");
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch all applications and their documents
    const fetchApplicationsAndDocs = async () => {
        setLoading(true);
        try {
            const incoming = await bankApi.getIncomingFiles() as any[];
            const myFiles = await bankApi.getMyFiles() as any[];
            const allFetched = [...(incoming || []), ...(myFiles || [])];
            const uniqueApps = Array.from(new Map(allFetched.map(item => [item.id, item])).values());
            
            const appsWithDocs = await Promise.all(
                uniqueApps.map(async (app) => {
                    try {
                        const docs = await bankApi.getDocuments(app.id);
                        return { ...app, documents: docs || [] };
                    } catch (err) {
                        console.error("Error fetching docs for app " + app.id, err);
                        return { ...app, documents: [] };
                    }
                })
            );
            setApplications(appsWithDocs);
        } catch (error) {
            console.error("Failed to load documents:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) {
            fetchApplicationsAndDocs();
        }
    }, [mounted]);

    // Flatten all documents with applicant/application metadata
    const allDocuments = useMemo(() => {
        return applications.flatMap(app => 
            (app.documents || []).map((doc: any) => ({
                ...doc,
                applicationId: app.id,
                applicationNumber: app.applicationNumber || `APP-${app.id.substring(0, 8).toUpperCase()}`,
                applicantName: `${app.firstName || ""} ${app.lastName || ""}`.trim() || "Unknown Applicant",
                applicantEmail: app.email,
            }))
        );
    }, [applications]);

    // Filter documents based on active tab and search query
    const filteredDocuments = useMemo(() => {
        return allDocuments.filter(doc => {
            const status = doc.status?.toLowerCase() || "uploaded";
            let inTab = false;
            if (activeTab === "pending") {
                inTab = !["verified", "rejected"].includes(status);
            } else if (activeTab === "verified") {
                inTab = status === "verified";
            } else if (activeTab === "rejected") {
                inTab = status === "rejected";
            }

            if (!inTab) return false;

            if (!searchTerm.trim()) return true;
            const term = searchTerm.toLowerCase();
            return (
                (doc.applicantName || "").toLowerCase().includes(term) ||
                (doc.applicationNumber || "").toLowerCase().includes(term) ||
                (doc.docType || "").toLowerCase().includes(term)
            );
        });
    }, [allDocuments, activeTab, searchTerm]);

    // Compute queue counts for tab indicators
    const pendingCount = useMemo(() => {
        return allDocuments.filter(doc => !["verified", "rejected"].includes(doc.status?.toLowerCase() || "uploaded")).length;
    }, [allDocuments]);

    // Make sure we include all verified documents
    const verifiedCount = useMemo(() => {
        return allDocuments.filter(doc => (doc.status?.toLowerCase() || "") === "verified").length;
    }, [allDocuments]);

    const rejectedCount = useMemo(() => {
        return allDocuments.filter(doc => (doc.status?.toLowerCase() || "") === "rejected").length;
    }, [allDocuments]);

    // Submit document audit decision
    const handleVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDoc) return;

        setVerifying(true);
        try {
            await staffProfileApi.verifyS3Document(
                selectedDoc.id,
                verifyStatus,
                verifyStatus === "rejected" ? rejectionReason : undefined
            );
            alert("Document verification updated successfully.");
            
            // Sync status locally in state
            setApplications(prevApps => 
                prevApps.map(app => {
                    if (app.id === selectedDoc.applicationId) {
                        return {
                            ...app,
                            documents: (app.documents || []).map((d: any) => 
                                d.id === selectedDoc.id 
                                    ? { ...d, status: verifyStatus, rejectionReason: verifyStatus === "rejected" ? rejectionReason : undefined }
                                    : d
                            )
                        };
                    }
                    return app;
                })
            );
            
            setShowVerifyModal(false);
            setSelectedDoc(null);
            setRejectionReason("");
        } catch (error) {
            console.error("Failed to verify document:", error);
            alert("Failed to verify document: " + (error as Error).message);
        } finally {
            setVerifying(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen p-8 lg:p-12 pl-[100px] lg:pl-[320px] transition-all duration-300">
            <div className="max-w-7xl mx-auto space-y-12">
                
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-blue-600 bg-blue-50 p-2 rounded-xl">description</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Module 03</span>
                        </div>
                        <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight">Document Verification Queue</h1>
                        <p className="text-sm text-gray-500 mt-2 font-medium">Verify, audit, and approve uploaded student KYC and financial assets.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="w-12 h-12 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-[#6605c7] flex items-center justify-center transition-all">
                            <span className="material-symbols-outlined text-gray-400">filter_list</span>
                        </button>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Search Name, ID, or Doc Type..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-6 py-3 w-72 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#6605c7] focus:ring-4 focus:ring-[#6605c7]/5 shadow-sm transition-all"
                            />
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                        </div>
                        <button 
                            onClick={fetchApplicationsAndDocs} 
                            className="w-12 h-12 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-[#6605c7] flex items-center justify-center transition-all text-[#6605c7]"
                            title="Reload Documents Queue"
                        >
                            <span className="material-symbols-outlined">refresh</span>
                        </button>
                    </div>
                </motion.div>

                {/* Queue Dashboard Matrix */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden">
                    <div className="p-8 border-b border-gray-100 flex gap-8">
                        <button 
                            onClick={() => setActiveTab("pending")} 
                            className={`text-sm font-bold pb-2 transition-all ${activeTab === "pending" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            Pending Audit ({pendingCount})
                        </button>
                        <button 
                            onClick={() => setActiveTab("verified")} 
                            className={`text-sm font-bold pb-2 transition-all ${activeTab === "verified" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            Verified Assets ({verifiedCount})
                        </button>
                        <button 
                            onClick={() => setActiveTab("rejected")} 
                            className={`text-sm font-bold pb-2 transition-all ${activeTab === "rejected" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            Flagged / Deficient ({rejectedCount})
                        </button>
                    </div>
                    
                    <div className="p-8 min-h-[400px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin mb-4" />
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Compiling document vaults...</p>
                            </div>
                        ) : filteredDocuments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <span className="material-symbols-outlined text-gray-200 text-6xl mb-4">document_scanner</span>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">No Document Assets Found</h3>
                                <p className="text-xs text-gray-400 max-w-sm">No uploaded files match this verification status or search criteria.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="pb-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Applicant Ref</th>
                                            <th className="pb-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Student Name</th>
                                            <th className="pb-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Document Asset</th>
                                            <th className="pb-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Audit Status</th>
                                            <th className="pb-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredDocuments.map((doc) => (
                                            <tr key={doc.id} className="hover:bg-gray-50/50 transition-all group">
                                                <td className="py-5 pr-4">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100">
                                                        {doc.applicationNumber}
                                                    </span>
                                                </td>
                                                <td className="py-5 pr-4">
                                                    <div className="font-bold text-gray-900">{doc.applicantName}</div>
                                                    <div className="text-[10px] text-gray-400 font-medium mt-0.5">{doc.applicantEmail}</div>
                                                </td>
                                                <td className="py-5 pr-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-gray-400 text-lg">description</span>
                                                        <div>
                                                            <div className="text-xs font-semibold text-gray-700 capitalize">
                                                                {doc.docType || "KYC Asset"}
                                                            </div>
                                                            <div className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">
                                                                ID: {doc.id.substring(0, 12)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-5 pr-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                                        doc.status?.toLowerCase() === "verified" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                        doc.status?.toLowerCase() === "rejected" ? "bg-rose-50 text-rose-600 border-rose-100" :
                                                        "bg-amber-50 text-amber-600 border-amber-100 animate-pulse"
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                            doc.status?.toLowerCase() === "verified" ? "bg-emerald-500" :
                                                            doc.status?.toLowerCase() === "rejected" ? "bg-rose-500" :
                                                            "bg-amber-500 animate-ping"
                                                        }`} />
                                                        {doc.status || "uploaded"}
                                                    </span>
                                                </td>
                                                <td className="py-5 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <a 
                                                            href={`/api/applications/admin/documents/${doc.id}/view`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="px-3 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-gray-100 transition-all flex items-center gap-1"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">visibility</span> View File
                                                        </a>
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedDoc(doc);
                                                                setVerifyStatus(doc.status === "rejected" ? "rejected" : "verified");
                                                                setRejectionReason(doc.rejectionReason || "");
                                                                setShowVerifyModal(true);
                                                            }}
                                                            className="px-3 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-blue-600 shadow-sm transition-all group-hover:scale-105 flex items-center gap-1"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">gavel</span> Audit
                                                        </button>
                                                    </div>
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
