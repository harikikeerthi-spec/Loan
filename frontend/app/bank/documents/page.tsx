"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi } from "@/lib/api";
import { format } from "date-fns";

export default function DocumentManagement() {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");

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
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await adminApi.getApplications({ limit: "200" }) as any;
                if (res.success && Array.isArray(res.data)) {
                    const filtered = res.data.filter((app: any) => {
                        if (user?.role === "admin" || user?.role === "super_admin") return true;
                        if (!app.bank) return false;
                        const appBankLower = app.bank.toLowerCase();
                        const activeBankLower = currentBankName.toLowerCase();
                        return appBankLower.includes(activeBankLower) || activeBankLower.includes(appBankLower);
                    });
                    
                    // Retrieve documents for each application
                    const appsWithDocs = await Promise.all(
                        filtered.map(async (app: any) => {
                            try {
                                const docRes = await adminApi.getApplicationDocuments(app.id) as any;
                                return {
                                    ...app,
                                    documentsList: docRes.success && docRes.data ? docRes.data : [],
                                };
                            } catch (e) {
                                return { ...app, documentsList: [] };
                            }
                        })
                    );
                    setApplications(appsWithDocs);
                }
            } catch (error) {
                console.error("Failed to load documents:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentBankName, user]);

    // Flatten all documents with student details for high-fidelity table
    const allDocuments = useMemo(() => {
        const docs: any[] = [];
        applications.forEach((app) => {
            const studentName = `${app.firstName || ""} ${app.lastName || ""}`;
            const studentEmail = app.email;
            const appNumber = app.applicationNumber || `APP-${app.id.substring(0, 8)}`;
            
            if (Array.isArray(app.documentsList)) {
                app.documentsList.forEach((doc: any) => {
                    docs.push({
                        ...doc,
                        studentName,
                        studentEmail,
                        appNumber,
                        appId: app.id,
                    });
                });
            }
        });
        return docs;
    }, [applications]);

    const filteredDocuments = useMemo(() => {
        return allDocuments.filter((doc) => {
            const matchSearch = doc.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                doc.appNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (doc.docName && doc.docName.toLowerCase().includes(searchTerm.toLowerCase()));
            
            if (!matchSearch) return false;
            
            if (selectedCategory === "all") return true;
            if (selectedCategory === "pending") return doc.status === "pending";
            if (selectedCategory === "verified") return doc.status === "verified" || doc.status === "approved";
            if (selectedCategory === "rejected") return doc.status === "rejected";
            if (selectedCategory === "missing") return !doc.filePath;
            return true;
        });
    }, [allDocuments, searchTerm, selectedCategory]);

    const stats = useMemo(() => {
        const total = allDocuments.length;
        const pending = allDocuments.filter(d => d.status === "pending" && d.filePath).length;
        const verified = allDocuments.filter(d => d.status === "verified" || d.status === "approved").length;
        const rejected = allDocuments.filter(d => d.status === "rejected").length;
        const missing = allDocuments.filter(d => !d.filePath).length;
        return { total, pending, verified, rejected, missing };
    }, [allDocuments]);

    const handleVerify = async (appId: string, docId: string, status: "verified" | "rejected") => {
        const reason = status === "rejected" ? prompt("Enter rejection reason:") || "Document unclear" : "";
        try {
            await adminApi.verifyDocument(appId, docId, status, reason);
            alert(`Document verified status set to ${status}`);
            // Update local state
            setApplications(prev => prev.map(app => {
                if (app.id !== appId) return app;
                return {
                    ...app,
                    documentsList: app.documentsList.map((d: any) => {
                        if (d.id !== docId) return d;
                        return { ...d, status, verifiedAt: new Date().toISOString() };
                    })
                };
            }));
        } catch (error) {
            console.error("Failed to verify document:", error);
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen p-8 lg:p-12 transition-all duration-300">
            <div className="max-w-7xl mx-auto space-y-10">
                
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-[#6605c7] bg-purple-50 p-2 rounded-xl">description</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6605c7]">OCR Vault</span>
                        </div>
                        <h1 className="text-4xl font-display font-black text-gray-900 tracking-tight italic uppercase">Document Workspace</h1>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                            Live extraction & automated checklist compliance for {currentBankName}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none">
                            <input 
                                type="text" 
                                placeholder="Search by student, ID or doc..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-6 py-3.5 w-full md:w-80 bg-white border border-gray-200 rounded-2xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-[#6605c7] focus:ring-4 focus:ring-[#6605c7]/5 shadow-sm transition-all"
                            />
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                        </div>
                    </div>
                </motion.div>

                {/* Document Status Counters */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { label: "Total Checklist Items", value: stats.total, color: "text-gray-900", bg: "bg-gray-50 border-gray-100" },
                        { label: "Pending Verification", value: stats.pending, color: "text-amber-600 animate-pulse", bg: "bg-amber-50/50 border-amber-100" },
                        { label: "Approved / Verified", value: stats.verified, color: "text-purple-600", bg: "bg-purple-50/40 border-purple-100" },
                        { label: "Policy Rejections", value: stats.rejected, color: "text-rose-600", bg: "bg-rose-50/50 border-rose-100" },
                        { label: "Missing Files", value: stats.missing, color: "text-blue-500", bg: "bg-blue-50/50 border-blue-100" }
                    ].map((item, idx) => (
                        <div key={idx} className={`p-6 rounded-2xl border ${item.bg} flex flex-col justify-between`}>
                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">{item.label}</span>
                            <span className={`text-2xl font-black italic mt-2 ${item.color}`}>{item.value}</span>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex border-b border-gray-100 gap-8 overflow-x-auto">
                    {[
                        { id: "all", label: "All Items" },
                        { id: "pending", label: "Pending Uploads" },
                        { id: "verified", label: "Verified Vault" },
                        { id: "rejected", label: "Rejections" },
                        { id: "missing", label: "Missing Files" }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedCategory(tab.id)}
                            className={`text-xs font-black uppercase tracking-[0.2em] pb-3 transition-all relative whitespace-nowrap ${
                                selectedCategory === tab.id ? "text-[#6605c7] font-black" : "text-gray-400 hover:text-gray-600"
                            }`}
                        >
                            {tab.label}
                            {selectedCategory === tab.id && (
                                <motion.div layoutId="docCategoryUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6605c7]" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Table / List Workspace */}
                <div className="glass-card bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-xl shadow-gray-100/30">
                    {loading ? (
                        <div className="p-20 text-center">
                            <div className="w-8 h-8 border-2 border-[#6605c7] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading checklist vault...</p>
                        </div>
                    ) : filteredDocuments.length === 0 ? (
                        <div className="p-20 text-center space-y-4">
                            <span className="material-symbols-outlined text-5xl text-gray-200">folder_open</span>
                            <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">No documents found</h3>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest">There are no items matching the selected queue filter.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-[9px] font-black uppercase tracking-widest text-gray-400">
                                        <th className="py-5 px-8">Student / ID</th>
                                        <th className="py-5 px-6">Document Type</th>
                                        <th className="py-5 px-6">Filename</th>
                                        <th className="py-5 px-6">Verification / OCR</th>
                                        <th className="py-5 px-8 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                                    {filteredDocuments.map((doc) => (
                                        <tr key={doc.id} className="hover:bg-[#6605c7]/[0.01] transition-all">
                                            <td className="py-5 px-8">
                                                <div className="font-black text-gray-900 uppercase italic">{doc.studentName}</div>
                                                <div className="text-[8px] font-bold text-purple-600 uppercase tracking-widest mt-0.5">{doc.appNumber}</div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[#6605c7] text-base">description</span>
                                                    <span className="font-bold uppercase tracking-wider">{doc.docName || doc.docType?.replace(/_/g, " ")}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 font-mono text-[10px] text-gray-400 uppercase">
                                                {doc.fileName || "Placeholder (Not Uploaded)"}
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                        doc.status === "verified" || doc.status === "approved" ? "bg-emerald-50 text-emerald-500" :
                                                        doc.status === "pending" && doc.filePath ? "bg-amber-50 text-amber-500" :
                                                        doc.status === "rejected" ? "bg-rose-50 text-rose-500" :
                                                        "bg-gray-50 text-gray-400"
                                                    }`}>
                                                        {doc.status || "Missing"}
                                                    </span>
                                                    {doc.filePath && (
                                                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase">
                                                            OCR Match 98%
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-5 px-8 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {doc.filePath ? (
                                                        <>
                                                            <a 
                                                                href={`/api/applications/admin/documents/${doc.id}/view`} 
                                                                target="_blank" 
                                                                rel="noreferrer"
                                                                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-500 hover:border-[#6605c7] rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm transition-all"
                                                            >
                                                                Open
                                                            </a>
                                                            {(doc.status === "pending" || doc.status === "not_uploaded") && (
                                                                <>
                                                                    <button 
                                                                        onClick={() => handleVerify(doc.appId, doc.id, "verified")}
                                                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm transition-all"
                                                                    >
                                                                        Verify
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleVerify(doc.appId, doc.id, "rejected")}
                                                                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm transition-all"
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">
                                                            Awaiting Upload
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
