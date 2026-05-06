"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi } from "@/lib/api";

// --- Components ---

const DetailRow = ({ label, value, highlight, mono }: any) => (
    <div className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0 group">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-600 transition-colors">{label}</span>
        <span className={`text-[11px] font-bold ${highlight ? 'text-[#6605c7]' : 'text-gray-900'} ${mono ? 'font-mono' : ''}`}>
            {value || '—'}
        </span>
    </div>
);

const DetailSection = ({ icon, title, children, color }: any) => (
    <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
            <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center`}>
                <span className="material-symbols-outlined text-lg">{icon}</span>
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">{title}</h4>
        </div>
        <div className="glass-card p-5 rounded-[2rem] bg-white group hover:bg-gray-50 transition-all border-[#6605c7]/5">
            {children}
        </div>
    </div>
);

interface AdminApplicationsResponse {
    success?: boolean;
    data?: any[];
}

// --- Page ---

export default function BankApplications() {
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedApp, setSelectedApp] = useState<any>(null);
    const [assignee, setAssignee] = useState<string>("");

    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApplications = async () => {
            setLoading(true);
            try {
                const params: any = {};
                if (filterStatus !== "all") params.status = filterStatus;
                if (searchQuery) params.search = searchQuery;

                const res = await adminApi.getApplications(params) as AdminApplicationsResponse;
                if (res.success) {
                    setApplications(res.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch applications:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, [filterStatus, searchQuery]);

    const statusColors: Record<string, string> = {
        pending: "bg-amber-100 text-amber-700 border-amber-200",
        processing: "bg-blue-100 text-blue-700 border-blue-200",
        approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
        rejected: "bg-rose-100 text-rose-600 border-rose-200",
        disbursed: "bg-purple-100 text-purple-700 border-purple-200",
    };

    return (
        <div className="p-8 space-y-8 animate-fade-in relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-4">
                <div>
                    <h2 className="text-4xl font-black font-display mb-2 text-gray-900 tracking-tight italic">Applications Matrix</h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs">database</span>
                        Total Nodes Analyzed: {applications.length}
                    </p>
                </div>
            </div>

            {/* Matrix Filters */}
            <div className="glass-card p-6 rounded-[2.5rem] bg-white/60 border-[#6605c7]/10 flex flex-wrap items-center gap-6">
                <div className="relative flex-1 min-w-[300px]">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Identity or Protocol..."
                        className="w-full pl-12 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl text-[11px] font-bold focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 shadow-sm uppercase tracking-widest transition-all"
                    />
                </div>

                <div className="flex items-center gap-2">
                    {["all", "pending", "processing", "approved", "rejected", "disbursed"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === status
                                    ? "bg-[#6605c7] text-white shadow-lg shadow-purple-500/20"
                                    : "bg-white text-gray-400 hover:text-gray-900 border border-gray-50 hover:border-[#6605c7]/10"
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Application Table */}
            <div className="glass-card rounded-[3rem] border-[#6605c7]/10 bg-white/60 overflow-hidden shadow-2xl shadow-purple-900/5 min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center p-20">
                        <div className="w-12 h-12 border-4 border-[#6605c7]/20 border-t-[#6605c7] rounded-full animate-spin" />
                    </div>
                ) : applications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-center">
                        <span className="material-symbols-outlined text-6xl text-gray-200 mb-4">search_off</span>
                        <h3 className="text-xl font-black font-display text-gray-400 uppercase italic">No Signals Located</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Try adjusting your filters or search query.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left">
                            <thead className="admin-table border-b border-gray-100 bg-[#6605c7]/[0.02]">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Audit Identity</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Applicant Profile</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Financial Node</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Quantum Amount</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Current State</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Synchronization</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {applications.map((app, i) => (
                                    <tr
                                        key={i}
                                        onClick={() => setSelectedApp(app)}
                                        className="group hover:bg-[#6605c7]/5 transition-all cursor-pointer"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-[#6605c7]/5 flex items-center justify-center font-black text-[#6605c7] text-[10px] border border-[#6605c7]/10 group-hover:bg-[#6605c7] group-hover:text-white transition-all duration-500">
                                                    {app.firstName?.[0]}{app.lastName?.[0]}
                                                </div>
                                                <span className="font-mono text-[9px] font-black text-gray-400 tracking-tighter uppercase">{app.applicationNumber}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-xs font-black text-gray-900 tracking-tight uppercase italic">{app.firstName} {app.lastName}</p>
                                            <p className="text-[10px] font-bold text-gray-400 tracking-widest mt-0.5">{app.user?.email || app.email}</p>
                                        </td>
                                        <td className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.15em]">{app.bank || app.loanType}</td>
                                        <td className="px-8 py-6 text-xs font-black text-[#6605c7] italic">₹{app.amount?.toLocaleString()}</td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColors[app.status] || 'bg-gray-100 text-gray-600'}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    {format(new Date(app.date || app.submittedAt || new Date()), 'MMM d, p')}
                                                </span>
                                                <button className="text-[9px] font-black text-[#6605c7] uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                                                    Audit Node <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
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

            {/* Applicant Intelligence Drawer */}
            <AnimatePresence>
                {selectedApp && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
                            onClick={() => setSelectedApp(null)}
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
                            className="fixed right-0 top-0 h-full w-full max-w-2xl z-[70] bg-[#f7f5f8] shadow-2xl overflow-hidden flex flex-col"
                        >
                            {/* Drawer Header */}
                            <div className="p-8 bg-white/70 backdrop-blur-xl border-b border-[#6605c7]/5 flex items-center justify-between sticky top-0 z-10">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-[#6605c7] to-[#8b24e5] flex items-center justify-center text-white shadow-xl shadow-purple-500/20">
                                        <span className="material-symbols-outlined text-3xl">psychology_alt</span>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black font-display text-gray-900 tracking-tight leading-none italic uppercase">{selectedApp.firstName} {selectedApp.lastName}</h2>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#6605c7]" />
                                            Identity: {selectedApp.applicationNumber}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedApp(null)}
                                    className="w-10 h-10 rounded-2xl bg-gray-100 hover:bg-[#6605c7]/5 text-gray-500 hover:text-[#6605c7] transition-all flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 p-8 space-y-10 overflow-y-auto no-scrollbar scroll-smooth">
                                {/* Core Identity */}
                                <DetailSection icon="fingerprint" title="Applicant Intelligence" color="bg-blue-50 text-blue-600">
                                    <DetailRow label="Primary Email" value={selectedApp.user?.email || selectedApp.email} />
                                    <DetailRow label="Bio Node (Phone)" value={selectedApp.mobile || selectedApp.phone} />
                                    <DetailRow label="Financial Goal" value={`₹${selectedApp.amount?.toLocaleString()}`} highlight />
                                    <DetailRow label="System Node" value={selectedApp.bank || selectedApp.loanType} />
                                </DetailSection>

                                {/* Educational Node */}
                                <DetailSection icon="school" title="Educational Node" color="bg-purple-50 text-purple-600">
                                    <DetailRow label="Target Destination" value={selectedApp.studyDestination || selectedApp.country} />
                                    <DetailRow label="Protocol (University)" value={selectedApp.targetUniversity || selectedApp.university} />
                                    <DetailRow label="Degree Schema" value={selectedApp.courseName || selectedApp.course} />
                                </DetailSection>

                                {/* Documents Node */}
                                <DetailSection icon="description" title="Transmission Assets" color="bg-emerald-50 text-emerald-600">
                                    {selectedApp.documents?.length > 0 ? (
                                        selectedApp.documents.map((doc: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{doc.docType || 'Document'}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${doc.status === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        doc.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                            'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}>
                                                    {doc.status}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-[10px] font-bold text-gray-400 uppercase italic">No assets detected in this node.</p>
                                    )}
                                </DetailSection>

                                {/* Loan Processing Matrix */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-lg">tune</span>
                                        </div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">Loan Multipliers</h4>
                                    </div>
                                    <div className="glass-card p-8 rounded-[2.5rem] bg-white border-[#6605c7]/10 space-y-8">
                                        <div className="grid grid-cols-2 gap-8">
                                            <div>
                                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-4">Set Interest Pulse (%)</label>
                                                <div className="flex items-center gap-4">
                                                    <input type="range" min="8" max="15" step="0.25" className="flex-1 accent-[#6605c7]" />
                                                    <span className="text-sm font-black text-[#6605c7] font-mono">10.25%</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-4">Repayment Cycle (Years)</label>
                                                <select className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5">
                                                    <option>5 Years</option>
                                                    <option>10 Years</option>
                                                    <option>15 Years</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Task Attribution */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                                        </div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">Task Attribution</h4>
                                    </div>
                                    <div className="glass-card p-6 rounded-[2.5rem] bg-white border-[#6605c7]/10 flex items-center gap-4">
                                        <select
                                            value={assignee}
                                            onChange={(e) => setAssignee(e.target.value)}
                                            className="flex-1 bg-gray-50 border border-gray-100 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5"
                                        >
                                            <option value="">Select Staff Node...</option>
                                            <option value="node_1">Agent Smith (Credit)</option>
                                            <option value="node_2">Agent Neo (Verification)</option>
                                            <option value="node_3">Agent Trinity (Legal)</option>
                                        </select>
                                        <button className="px-6 py-4 rounded-2xl bg-[#6605c7] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/10">Authorize</button>
                                    </div>
                                </div>

                                {/* Action Matrix */}
                                <div className="grid grid-cols-2 gap-4 pb-12">
                                    <button className="group relative overflow-hidden px-8 py-5 rounded-[2rem] bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-all flex items-center justify-center gap-3">
                                        <span className="material-symbols-outlined font-black">cancel</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Decline Protocol</span>
                                    </button>
                                    <button className="group relative overflow-hidden px-8 py-5 rounded-[2rem] bg-[#6605c7] text-white shadow-xl shadow-purple-500/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                                        <span className="material-symbols-outlined font-black">verified</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Validate Node</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
