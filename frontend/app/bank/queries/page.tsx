"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { bankApi } from "@/lib/api";

// --- Sub Components ---

const DetailRow = ({ label, value, highlight, mono }: any) => (
    <div className="flex justify-between items-center py-4 border-b border-gray-50/50 last:border-0 group">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-gray-600 transition-colors">{label}</span>
        <span className={`text-[11px] font-black ${highlight ? 'text-[#6605c7] italic' : 'text-gray-900'} ${mono ? 'font-mono' : ''}`}>
            {value || '—'}
        </span>
    </div>
);

const QueryTimelineItem = ({ response }: any) => {
    const isBankUser = response.respondedBy?.toLowerCase().includes("bank") || response.respondedBy?.toLowerCase().includes("auditor");
    
    return (
        <div className={`flex flex-col gap-2 p-5 rounded-[2rem] border relative ${
            isBankUser 
            ? "bg-[#6605c7]/5 border-[#6605c7]/10 ml-10" 
            : "bg-white border-gray-100 mr-10"
        }`}>
            <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400">
                    {response.respondedBy || "Agent"}
                </span>
                <span className="text-[8px] font-bold text-gray-400 tracking-wider font-mono">
                    {response.respondedAt ? format(new Date(response.respondedAt), "yyyy-MM-dd HH:mm") : "Just now"}
                </span>
            </div>
            <p className="text-[11px] font-black text-gray-800 leading-relaxed whitespace-pre-line uppercase tracking-wide">
                {response.message}
            </p>
            {response.attachments && (
                <div className="mt-2 pt-2 border-t border-gray-50 flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs text-[#6605c7]">attachment</span>
                    <span className="text-[9px] font-black text-[#6605c7] uppercase tracking-wider italic">
                        Attachment Attached
                    </span>
                </div>
            )}
        </div>
    );
};

export default function BankQueries() {
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [queries, setQueries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Selection and Drawer States
    const [selectedQuery, setSelectedQuery] = useState<any>(null);
    const [threadResponses, setThreadResponses] = useState<any[]>([]);
    const [threadLoading, setThreadLoading] = useState(false);
    const [resolveLoading, setResolveLoading] = useState(false);
    
    // Raise Query Modal State
    const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
    const [newQueryAppId, setNewQueryAppId] = useState("");
    const [newQueryType, setNewQueryType] = useState("DOCUMENT");
    const [newQueryDesc, setNewQueryDesc] = useState("");
    const [newQueryReqDocs, setNewQueryReqDocs] = useState("");
    const [raiseLoading, setRaiseLoading] = useState(false);
    const [raiseSuccess, setRaiseSuccess] = useState(false);

    useEffect(() => {
        fetchQueries();
    }, [filterStatus]);

    const fetchQueries = async () => {
        setLoading(true);
        try {
            const statusParam = filterStatus === "ALL" ? undefined : filterStatus;
            const res = await bankApi.getQueries(statusParam) as any;
            if (res.success) {
                setQueries(res.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch queries:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectQuery = async (query: any) => {
        setSelectedQuery(query);
        setThreadLoading(true);
        try {
            const res = await bankApi.getQueryThread(query.id) as any;
            if (res.success && res.data) {
                setThreadResponses(res.data.QueryResponses || res.data.responses || []);
            } else {
                setThreadResponses([]);
            }
        } catch (error) {
            console.error("Failed to fetch query thread:", error);
            setThreadResponses([]);
        } finally {
            setThreadLoading(false);
        }
    };

    const handleResolveQuery = async (queryId: string) => {
        setResolveLoading(true);
        try {
            const res = await bankApi.resolveQuery(queryId) as any;
            if (res.success) {
                // Update local state
                setQueries(queries.map(q => q.id === queryId ? { ...q, status: "RESOLVED", resolvedAt: new Date().toISOString() } : q));
                setSelectedQuery({ ...selectedQuery, status: "RESOLVED", resolvedAt: new Date().toISOString() });
            }
        } catch (error) {
            console.error("Failed to resolve query:", error);
        } finally {
            setResolveLoading(false);
        }
    };

    const handleRaiseQuery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newQueryAppId.trim() || !newQueryDesc.trim()) return;
        setRaiseLoading(true);
        try {
            const payload: any = {
                queryType: newQueryType,
                description: newQueryDesc.trim()
            };
            if (newQueryReqDocs.trim()) {
                payload.requiredDocs = JSON.stringify(newQueryReqDocs.split("\n").filter(d => d.trim() !== ""));
            }
            
            const res = await bankApi.raiseQuery(newQueryAppId.trim(), payload) as any;
            if (res.success) {
                setRaiseSuccess(true);
                setTimeout(() => {
                    setIsRaiseModalOpen(false);
                    setNewQueryAppId("");
                    setNewQueryDesc("");
                    setNewQueryReqDocs("");
                    setRaiseSuccess(false);
                    fetchQueries();
                }, 1500);
            }
        } catch (error) {
            console.error("Failed to raise query:", error);
        } finally {
            setRaiseLoading(false);
        }
    };

    const statusColors: Record<string, string> = {
        OPEN: "bg-amber-50 text-amber-600 border-amber-100",
        RESP_PENDING: "bg-amber-50 text-amber-600 border-amber-100",
        RESPONDED: "bg-blue-50 text-blue-600 border-blue-100",
        RESOLVED: "bg-emerald-50 text-emerald-600 border-emerald-100",
    };

    const typeColors: Record<string, string> = {
        DOCUMENT: "bg-purple-50 text-purple-600 border-purple-100",
        INFORMATION: "bg-blue-50 text-blue-600 border-blue-100",
        CLARIFICATION: "bg-orange-50 text-orange-600 border-orange-100",
    };

    const typeIcons: Record<string, string> = {
        DOCUMENT: "description",
        INFORMATION: "info",
        CLARIFICATION: "help_center",
    };

    const parsedRequiredDocs = (docStr: string) => {
        if (!docStr) return [];
        try {
            return JSON.parse(docStr);
        } catch {
            return [docStr];
        }
    };

    return (
        <div className="p-8 lg:p-12 space-y-12 animate-fade-in relative z-10">
            {/* Header Block */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-4">
                <div className="space-y-4">
                    <h2 className="text-5xl font-black font-display text-gray-900 tracking-tighter italic leading-none">
                        Queries <span className="text-[#6605c7]">Matrix</span>
                    </h2>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] flex items-center gap-2 pl-1">
                        <span className="material-symbols-outlined text-xs">forum</span>
                        Active Query Channels: {queries.length}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                    {/* Filters */}
                    <div className="flex items-center gap-2 p-1.5 bg-white/50 backdrop-blur-xl rounded-[1.5rem] border border-[#6605c7]/10 shadow-sm overflow-x-auto no-scrollbar">
                        {["ALL", "OPEN", "RESPONDED", "RESOLVED"].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === status
                                    ? "bg-[#6605c7] text-white shadow-lg shadow-purple-500/20"
                                    : "text-gray-400 hover:text-gray-900 hover:bg-[#6605c7]/5"
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={() => setIsRaiseModalOpen(true)}
                        className="px-6 py-4 bg-[#6605c7] text-white hover:bg-[#5504a7] rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] italic shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <span className="material-symbols-outlined text-sm font-bold">add_comment</span>
                        Raise Query
                    </button>
                </div>
            </div>

            {/* Queries Grid/Table */}
            <div className="glass-card rounded-[4rem] border-[#6605c7]/10 bg-white/70 overflow-hidden shadow-2xl shadow-purple-900/[0.02] min-h-[500px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-40 gap-4">
                        <div className="w-16 h-16 border-4 border-[#6605c7]/5 border-t-[#6605c7] rounded-full animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 animate-pulse">Querying Database...</span>
                    </div>
                ) : queries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-40 text-center">
                        <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center mb-8">
                            <span className="material-symbols-outlined text-5xl text-gray-200">forum</span>
                        </div>
                        <h3 className="text-2xl font-black font-display text-gray-400 uppercase italic tracking-tighter">No Active Channels</h3>
                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em] mt-4">All query vectors are fully resolved or currently empty.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-[#6605c7]/[0.02] border-b border-gray-100">
                                <tr>
                                    <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]">Query Node</th>
                                    <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]">Application ID</th>
                                    <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]">Type</th>
                                    <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]">Description</th>
                                    <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]">Status</th>
                                    <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-right text-[#6605c7]">Raised At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {queries.map((query, i) => (
                                    <tr
                                        key={query.id || i}
                                        onClick={() => handleSelectQuery(query)}
                                        className="group hover:bg-[#6605c7]/[0.03] transition-all cursor-pointer"
                                    >
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-[#6605c7]/5 flex items-center justify-center font-black text-[#6605c7] text-[11px] border border-[#6605c7]/10 group-hover:bg-[#6605c7] group-hover:text-white group-hover:rotate-6 transition-all duration-500 shadow-sm">
                                                    <span className="material-symbols-outlined text-lg">
                                                        {typeIcons[query.queryType] || "forum"}
                                                    </span>
                                                </div>
                                                <span className="font-mono text-[10px] font-black text-gray-400 tracking-tighter uppercase">
                                                    {query.id?.substring(0, 8) || `NODE-${i}`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className="font-mono text-sm font-black text-gray-900 tracking-tighter uppercase">
                                                {query.applicationId?.substring(0, 8) || "—"}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${typeColors[query.queryType] || "bg-gray-50 text-gray-400 border-gray-100"}`}>
                                                {query.queryType}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 max-w-xs">
                                            <p className="text-[11px] font-black text-gray-900 uppercase tracking-wide truncate">
                                                {query.description}
                                            </p>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${statusColors[query.status] || 'bg-gray-50 text-gray-400'}`}>
                                                {query.status}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-right font-mono text-[10px] font-bold text-gray-400 tracking-widest">
                                            {query.raisedAt ? format(new Date(query.raisedAt), "yyyy-MM-dd HH:mm") : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Query Thread Drawer */}
            <AnimatePresence>
                {selectedQuery && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-md"
                            onClick={() => setSelectedQuery(null)}
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 35, stiffness: 300, mass: 1 }}
                            className="fixed right-0 top-0 h-full w-full max-w-2xl z-[120] bg-[#fbfaff] shadow-[0_0_100px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col border-l border-[#6605c7]/10"
                        >
                            {/* Drawer Header */}
                            <div className="p-10 bg-white/80 backdrop-blur-2xl border-b border-[#6605c7]/5 flex items-center justify-between sticky top-0 z-10">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-[#6605c7] to-[#8b24e5] flex items-center justify-center text-white shadow-2xl shadow-purple-500/30">
                                        <span className="material-symbols-outlined text-3xl">forum</span>
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black font-display text-gray-900 tracking-tighter italic leading-none uppercase">Query Thread</h2>
                                        <div className="flex items-center gap-3 mt-3">
                                            <span className={`px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${typeColors[selectedQuery.queryType]}`}>
                                                {selectedQuery.queryType}
                                            </span>
                                            <span className={`px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${statusColors[selectedQuery.status]}`}>
                                                {selectedQuery.status}
                                            </span>
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#6605c7] animate-pulse" />
                                                Node: {selectedQuery.id?.substring(0, 8)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedQuery(null)}
                                    className="w-12 h-12 rounded-2xl bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-all flex items-center justify-center border border-transparent hover:border-rose-100 group"
                                >
                                    <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-500">close</span>
                                </button>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
                                {/* Core Details */}
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic">Parameters</h4>
                                    <div className="glass-card p-6 rounded-[2.5rem] bg-white border-[#6605c7]/5 shadow-sm space-y-2">
                                        <DetailRow label="Application Link" value={selectedQuery.applicationId} mono />
                                        <DetailRow label="Raised By" value={selectedQuery.raisedBy || "Partner Bank Officer"} />
                                        <DetailRow label="Raised Date" value={selectedQuery.raisedAt ? format(new Date(selectedQuery.raisedAt), "yyyy-MM-dd HH:mm") : "—"} />
                                        {selectedQuery.status === "RESOLVED" && (
                                            <DetailRow label="Resolved Date" value={selectedQuery.resolvedAt ? format(new Date(selectedQuery.resolvedAt), "yyyy-MM-dd HH:mm") : "—"} highlight />
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic">Core Query</h4>
                                    <div className="glass-card p-8 rounded-[2.5rem] bg-white border-[#6605c7]/5 shadow-sm">
                                        <p className="text-[12px] font-black text-gray-800 leading-relaxed uppercase tracking-wider">
                                            {selectedQuery.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Required Docs */}
                                {selectedQuery.requiredDocs && (
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic">Required Documentation</h4>
                                        <div className="glass-card p-6 rounded-[2.5rem] bg-white border-purple-500/10 shadow-sm flex flex-col gap-3">
                                            {parsedRequiredDocs(selectedQuery.requiredDocs).map((doc: string, idx: number) => (
                                                <div key={idx} className="flex items-center gap-4 bg-[#6605c7]/5 p-4 rounded-2xl">
                                                    <span className="material-symbols-outlined text-[#6605c7] text-lg">description</span>
                                                    <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest italic">{doc}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Responses Timeline */}
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic">Transmission Feed</h4>
                                    
                                    {threadLoading ? (
                                        <div className="flex flex-col items-center justify-center p-12 gap-3">
                                            <div className="w-8 h-8 border-2 border-[#6605c7]/5 border-t-[#6605c7] rounded-full animate-spin" />
                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 animate-pulse">Syncing feed...</span>
                                        </div>
                                    ) : threadResponses.length === 0 ? (
                                        <div className="text-center p-10 bg-gray-50/50 rounded-[2.5rem] border border-gray-100">
                                            <span className="material-symbols-outlined text-3xl text-gray-300 mb-2">chat_bubble_outline</span>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">No Response Signals Transmitted Yet</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-6 relative pl-4 border-l border-gray-100 py-2">
                                            {threadResponses.map((resp: any, i: number) => (
                                                <QueryTimelineItem key={resp.id || i} response={resp} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Drawer Actions Footer */}
                            {selectedQuery.status !== "RESOLVED" && (
                                <div className="p-10 bg-white border-t border-[#6605c7]/5 sticky bottom-0 z-10 flex items-center justify-end">
                                    <button
                                        onClick={() => handleResolveQuery(selectedQuery.id)}
                                        disabled={resolveLoading}
                                        className="px-8 py-5 bg-[#6605c7] text-white hover:bg-[#5504a7] disabled:bg-gray-100 disabled:text-gray-400 rounded-[1.75rem] flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] italic shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:scale-100"
                                    >
                                        {resolveLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-sm font-bold">verified</span>
                                                Resolve Protocol
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Raise Query Modal */}
            <AnimatePresence>
                {isRaiseModalOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => setIsRaiseModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[3.5rem] w-full max-w-lg overflow-hidden border border-[#6605c7]/10 shadow-[0_0_80px_rgba(102,5,199,0.15)] relative z-[160]"
                        >
                            <form onSubmit={handleRaiseQuery} className="p-10 space-y-8">
                                <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-[#6605c7]/5 flex items-center justify-center text-[#6605c7]">
                                            <span className="material-symbols-outlined text-2xl">add_comment</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black font-display text-gray-900 tracking-tighter uppercase italic leading-none">Raise Query</h3>
                                            <span className="text-[8px] font-bold text-gray-400 tracking-widest uppercase mt-1 block">New Audit Protocol</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsRaiseModalOpen(false)}
                                        className="w-10 h-10 rounded-2xl bg-gray-50 text-gray-400 hover:text-gray-900 transition-all flex items-center justify-center"
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>

                                {raiseSuccess ? (
                                    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                                        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 animate-bounce">
                                            <span className="material-symbols-outlined text-3xl">check</span>
                                        </div>
                                        <h4 className="text-lg font-black font-display text-emerald-600 uppercase italic">Query Dispatched Successfully</h4>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-2">Protocol signal has been saved and broadcasted.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-6">
                                            {/* Application ID */}
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-[0.20em] text-gray-400 block pl-1">Application Reference Node</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={newQueryAppId}
                                                    onChange={(e) => setNewQueryAppId(e.target.value)}
                                                    placeholder="Enter exact Application UUID..."
                                                    className="w-full px-6 py-4 border border-[#6605c7]/10 focus:border-[#6605c7]/30 bg-gray-50/50 rounded-2xl text-[11px] font-black uppercase tracking-wider focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 font-mono"
                                                />
                                            </div>

                                            {/* Query Type */}
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-[0.20em] text-gray-400 block pl-1">Query Vector Type</label>
                                                <select
                                                    value={newQueryType}
                                                    onChange={(e) => setNewQueryType(e.target.value)}
                                                    className="w-full px-6 py-4 border border-[#6605c7]/10 focus:border-[#6605c7]/30 bg-gray-50/50 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5"
                                                >
                                                    <option value="DOCUMENT">DOCUMENT QUERY</option>
                                                    <option value="INFORMATION">INFORMATION QUERY</option>
                                                    <option value="CLARIFICATION">CLARIFICATION QUERY</option>
                                                </select>
                                            </div>

                                            {/* Description */}
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-[0.20em] text-gray-400 block pl-1">Protocol Description</label>
                                                <textarea
                                                    required
                                                    rows={3}
                                                    value={newQueryDesc}
                                                    onChange={(e) => setNewQueryDesc(e.target.value)}
                                                    placeholder="Specify exact query or clarification requirements..."
                                                    className="w-full px-6 py-4 border border-[#6605c7]/10 focus:border-[#6605c7]/30 bg-gray-50/50 rounded-2xl text-[11px] font-black uppercase tracking-wider focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 resize-none leading-relaxed"
                                                />
                                            </div>

                                            {/* Required Docs (Optional) */}
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-[0.20em] text-gray-400 block pl-1">Required Documents (One per line - optional)</label>
                                                <textarea
                                                    rows={3}
                                                    value={newQueryReqDocs}
                                                    onChange={(e) => setNewQueryReqDocs(e.target.value)}
                                                    placeholder="e.g. Co-applicant PAN Card&#10;Latest 3-month salary slip"
                                                    className="w-full px-6 py-4 border border-[#6605c7]/10 focus:border-[#6605c7]/30 bg-gray-50/50 rounded-2xl text-[11px] font-black uppercase tracking-wider focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 resize-none leading-relaxed"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-4 border-t border-gray-100 justify-end">
                                            <button
                                                type="button"
                                                onClick={() => setIsRaiseModalOpen(false)}
                                                className="px-6 py-4 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-900 text-[10px] font-black uppercase tracking-widest transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={raiseLoading}
                                                className="px-6 py-4 bg-[#6605c7] hover:bg-[#5504a7] disabled:bg-gray-100 text-white disabled:text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                                            >
                                                {raiseLoading ? (
                                                    <>
                                                        <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                        Transmitting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="material-symbols-outlined text-sm font-bold">send</span>
                                                        Transmit Protocol
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
