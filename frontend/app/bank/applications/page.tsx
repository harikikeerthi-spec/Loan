"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi } from "@/lib/api";
import BankFlowPipeline from "@/components/bank/BankFlowPipeline";

// --- Components ---

const DetailRow = ({ label, value, highlight, mono }: any) => (
    <div className="flex justify-between items-center py-4 border-b border-gray-50/50 last:border-0 group">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-gray-600 transition-colors">{label}</span>
        <span className={`text-[11px] font-black ${highlight ? 'text-[#6605c7] italic' : 'text-gray-900'} ${mono ? 'font-mono' : ''}`}>
            {value || '—'}
        </span>
    </div>
);

const DetailSection = ({ icon, title, children, color, delay = 0 }: any) => (
    <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="space-y-4"
    >
        <div className="flex items-center gap-3 mb-2">
            <div className={`w-9 h-9 rounded-2xl ${color} flex items-center justify-center shadow-sm`}>
                <span className="material-symbols-outlined text-xl">{icon}</span>
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900 italic">{title}</h4>
        </div>
        <div className="glass-card p-6 rounded-[2.5rem] bg-white group hover:bg-[#6605c7]/[0.02] transition-all border-[#6605c7]/5 shadow-sm">
            {children}
        </div>
    </motion.div>
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
    const [interestRate, setInterestRate] = useState("10.25");
    const [tenure, setTenure] = useState("10");
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectForm, setShowRejectForm] = useState(false);

    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview"); // For drawer tabs: overview, documents, history

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

    const handleApproveApplication = async () => {
        if (!selectedApp) return;
        
        setActionLoading(true);
        try {
            const payload = {
                status: "approved",
                interestRate: parseFloat(interestRate),
                tenure: parseInt(tenure),
                assignedTo: assignee || undefined,
                approvedBy: "bank",
                approvalDate: new Date()
            };

            const res = await adminApi.updateApplication(selectedApp.id, payload) as any;
            
            if (res.success) {
                setApplications(applications.map(app => 
                    app.id === selectedApp.id ? { ...app, ...payload } : app
                ));
                setSelectedApp(null);
                alert("Application approved successfully!");
            }
        } catch (error) {
            console.error("Failed to approve application:", error);
            alert("Failed to approve application");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectApplication = async () => {
        if (!selectedApp || !rejectReason.trim()) {
            alert("Please provide a reason for rejection");
            return;
        }
        
        setActionLoading(true);
        try {
            const payload = {
                status: "rejected",
                rejectionReason: rejectReason,
                rejectedBy: "bank",
                rejectionDate: new Date()
            };

            const res = await adminApi.updateApplication(selectedApp.id, payload) as any;
            
            if (res.success) {
                setApplications(applications.map(app => 
                    app.id === selectedApp.id ? { ...app, ...payload } : app
                ));
                setSelectedApp(null);
                alert("Application rejected successfully!");
            }
        } catch (error) {
            console.error("Failed to reject application:", error);
            alert("Failed to reject application");
        } finally {
            setActionLoading(false);
            setShowRejectForm(false);
            setRejectReason("");
        }
    };

    const statusColors: Record<string, string> = {
        pending: "bg-amber-50 text-amber-600 border-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.1)]",
        processing: "bg-blue-50 text-blue-600 border-blue-100 shadow-[0_0_10px_rgba(59,130,246,0.1)]",
        under_bank_review: "bg-[#6605c7]/10 text-[#6605c7] border-[#6605c7]/20 shadow-[0_0_10px_rgba(102,5,199,0.1)]",
        approved: "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
        rejected: "bg-rose-50 text-rose-600 border-rose-100 shadow-[0_0_10px_rgba(239,68,68,0.1)]",
        disbursed: "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-[0_0_10px_rgba(79,70,229,0.1)]",
    };

    const handleUpdateStatus = async (newStatus: string) => {
        if (!selectedApp) return;
        setActionLoading(true);
        try {
            const res = await adminApi.updateApplication(selectedApp.id, { status: newStatus }) as any;
            if (res.success) {
                setApplications(applications.map(app => 
                    app.id === selectedApp.id ? { ...app, status: newStatus } : app
                ));
                setSelectedApp({ ...selectedApp, status: newStatus });
            }
        } catch (error) {
            console.error(`Failed to update status to ${newStatus}:`, error);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="p-8 lg:p-12 space-y-12 animate-fade-in relative z-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-4">
                <div className="space-y-4">
                    <h2 className="text-5xl font-black font-display text-gray-900 tracking-tighter italic leading-none">
                        Applications <span className="text-[#6605c7]">Matrix</span>
                    </h2>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] flex items-center gap-2 pl-1">
                        <span className="material-symbols-outlined text-xs">database</span>
                        Total Nodes Analyzed: {applications.length}
                    </p>
                </div>
                
                <div className="flex items-center gap-2 p-1.5 bg-white/50 backdrop-blur-xl rounded-[1.5rem] border border-[#6605c7]/10 shadow-sm overflow-x-auto no-scrollbar max-w-full">
                    {["all", "pending", "processing", "under_bank_review", "approved", "rejected", "disbursed"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === status
                                    ? "bg-[#6605c7] text-white shadow-lg shadow-purple-500/20"
                                    : "text-gray-400 hover:text-gray-900 hover:bg-[#6605c7]/5"
                                }`}
                        >
                            {status.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Matrix Search */}
            <div className="relative group max-w-2xl">
                <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#6605c7] transition-colors">search</span>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Locate Identity or Protocol Signature..."
                    className="w-full pl-16 pr-8 py-5 bg-white/70 backdrop-blur-xl border border-[#6605c7]/10 rounded-[2rem] text-[11px] font-black focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 focus:border-[#6605c7]/20 shadow-sm uppercase tracking-[0.2em] transition-all placeholder:text-gray-300"
                />
            </div>

            {/* Main Application Table */}
            <div className="glass-card rounded-[4rem] border-[#6605c7]/10 bg-white/70 overflow-hidden shadow-2xl shadow-purple-900/[0.02] min-h-[500px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-40 gap-4">
                        <div className="w-16 h-16 border-4 border-[#6605c7]/5 border-t-[#6605c7] rounded-full animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 animate-pulse">Scanning Grid...</span>
                    </div>
                ) : applications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-40 text-center">
                        <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center mb-8">
                            <span className="material-symbols-outlined text-5xl text-gray-200">search_off</span>
                        </div>
                        <h3 className="text-2xl font-black font-display text-gray-400 uppercase italic tracking-tighter">No Signals Located</h3>
                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em] mt-4">Adjust your sync filters or search query parameters.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-[#6605c7]/[0.02] border-b border-gray-100">
                                <tr>
                                    <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]">Audit Node</th>
                                    <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]">Applicant Profile</th>
                                    <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]">Quant Amount</th>
                                    <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]">Current State</th>
                                    <th className="px-10 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-right text-[#6605c7]">Synchronization</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {applications.map((app, i) => (
                                    <tr
                                        key={app.id || i}
                                        onClick={() => setSelectedApp(app)}
                                        className="group hover:bg-[#6605c7]/[0.03] transition-all cursor-pointer"
                                    >
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-[#6605c7]/5 flex items-center justify-center font-black text-[#6605c7] text-[11px] border border-[#6605c7]/10 group-hover:bg-[#6605c7] group-hover:text-white group-hover:rotate-6 transition-all duration-500 shadow-sm">
                                                    {app.firstName?.[0]}{app.lastName?.[0]}
                                                </div>
                                                <span className="font-mono text-[10px] font-black text-gray-400 tracking-tighter uppercase">{app.applicationNumber}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <p className="text-sm font-black text-gray-900 tracking-tight uppercase italic group-hover:text-[#6605c7] transition-colors">{app.firstName} {app.lastName}</p>
                                            <p className="text-[10px] font-bold text-gray-400 tracking-widest mt-1 lowercase">{app.user?.email || app.email}</p>
                                        </td>
                                        <td className="px-10 py-8">
                                            <p className="text-sm font-black text-[#6605c7] italic tracking-tight">₹{app.amount?.toLocaleString()}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{app.bank || app.loanType}</p>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${statusColors[app.status] || 'bg-gray-50 text-gray-400'}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
                                                    {(() => {
                                                        try {
                                                            return format(new Date(app.date || app.submittedAt || new Date()), 'MMM dd, p');
                                                        } catch (e) {
                                                            return "N/A";
                                                        }
                                                    })()}
                                                </span>
                                                <span className="text-[8px] font-black text-[#6605c7] uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 flex items-center gap-2">
                                                    Audit Node <span className="material-symbols-outlined text-[10px] font-black">arrow_forward</span>
                                                </span>
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
                            className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-md"
                            onClick={() => setSelectedApp(null)}
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
                                        <span className="material-symbols-outlined text-3xl">psychology_alt</span>
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black font-display text-gray-900 tracking-tighter italic leading-none uppercase">{selectedApp.firstName} {selectedApp.lastName}</h2>
                                        <div className="flex items-center gap-3 mt-3">
                                            <span className={`px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${statusColors[selectedApp.status]}`}>
                                                {selectedApp.status}
                                            </span>
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#6605c7] animate-pulse" />
                                                ID: {selectedApp.applicationNumber}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedApp(null)}
                                    className="w-12 h-12 rounded-2xl bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-all flex items-center justify-center border border-transparent hover:border-rose-100 group"
                                >
                                    <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-500">close</span>
                                </button>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                                {/* Workflow Action Bar */}
                                <div className="px-10 py-6 bg-[#6605c7]/[0.02] border-b border-[#6605c7]/5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-[#6605c7] animate-ping" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#6605c7]">Workflow State</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-3">
                                        {selectedApp.status === 'processing' && (
                                            <button 
                                                onClick={() => handleUpdateStatus('under_bank_review')}
                                                disabled={actionLoading}
                                                className="px-6 py-2.5 rounded-xl bg-[#6605c7] text-white text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
                                            >
                                                {actionLoading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[14px]">start</span>}
                                                Begin Bank Review
                                            </button>
                                        )}
                                        {selectedApp.status === 'under_bank_review' && (
                                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 border border-purple-100">
                                                <span className="material-symbols-outlined text-purple-600 text-[14px]">verified_user</span>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-purple-600">Currently in Deep Audit</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Pipeline Visualization */}
                                <div className="px-10 py-4 bg-white border-b border-gray-100">
                                    <BankFlowPipeline currentStage={selectedApp.stage} status={selectedApp.status} />
                                </div>

                                <div className="p-10 space-y-12">
                                    {/* Tabs */}
                                    <div className="flex gap-8 border-b border-gray-100 pb-2">
                                        {['overview', 'documents', 'history'].map((tab) => (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveTab(tab)}
                                                className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
                                                    activeTab === tab ? 'text-[#6605c7]' : 'text-gray-400 hover:text-gray-600'
                                                }`}
                                            >
                                                {tab}
                                                {activeTab === tab && (
                                                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#6605c7] rounded-full" />
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    {activeTab === 'overview' && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                                            <DetailSection icon="fingerprint" title="Applicant Intel" color="bg-blue-50 text-blue-600" delay={0.1}>
                                                <DetailRow label="Quantum Email" value={selectedApp.user?.email || selectedApp.email} />
                                                <DetailRow label="Bio Node (Phone)" value={selectedApp.mobile || selectedApp.phone} />
                                                <DetailRow label="Financial Goal" value={`₹${selectedApp.amount?.toLocaleString()}`} highlight />
                                                <DetailRow label="System Node" value={selectedApp.bank || selectedApp.loanType} />
                                            </DetailSection>

                                            <DetailSection icon="school" title="Educational Nexus" color="bg-purple-50 text-purple-600" delay={0.2}>
                                                <DetailRow label="Target Destination" value={selectedApp.studyDestination || selectedApp.country} />
                                                <DetailRow label="University Protocol" value={selectedApp.targetUniversity || selectedApp.university} />
                                                <DetailRow label="Degree Schema" value={selectedApp.courseName || selectedApp.course} />
                                            </DetailSection>

                                            {/* Advanced Loan Engine */}
                                            <div className="space-y-8">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
                                                        <span className="material-symbols-outlined text-xl">engine</span>
                                                    </div>
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900 italic">Financial Decision Engine</h4>
                                                </div>
                                                
                                                <div className="glass-card rounded-[3rem] bg-white border-[#6605c7]/10 shadow-sm relative overflow-hidden">
                                                    {/* Card Body */}
                                                    <div className="p-10 space-y-10">
                                                        <div className="space-y-6">
                                                            <div className="flex justify-between items-end mb-2">
                                                                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 block">Interest Rate Protocol</label>
                                                                <span className="text-2xl font-black text-[#6605c7] font-display italic tracking-tighter">{interestRate}%</span>
                                                            </div>
                                                            <input 
                                                                type="range" 
                                                                min="8" 
                                                                max="15" 
                                                                step="0.05" 
                                                                value={interestRate}
                                                                onChange={(e) => setInterestRate(e.target.value)}
                                                                className="w-full accent-[#6605c7] h-1.5 rounded-full cursor-pointer" 
                                                            />
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-50">
                                                            <div className="space-y-4">
                                                                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 block">Amortization Period</label>
                                                                <select 
                                                                    value={tenure}
                                                                    onChange={(e) => setTenure(e.target.value)}
                                                                    className="w-full bg-gray-50/50 border border-gray-100 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 transition-all appearance-none italic"
                                                                >
                                                                    <option value="5">5 YEARS</option>
                                                                    <option value="7">7 YEARS</option>
                                                                    <option value="10">10 YEARS</option>
                                                                    <option value="15">15 YEARS</option>
                                                                    <option value="20">20 YEARS</option>
                                                                </select>
                                                            </div>
                                                            <div className="space-y-4">
                                                                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 block">Assigned Analyst</label>
                                                                <select
                                                                    value={assignee}
                                                                    onChange={(e) => setAssignee(e.target.value)}
                                                                    className="w-full bg-gray-50/50 border border-gray-100 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 transition-all appearance-none italic"
                                                                >
                                                                    <option value="">SELECT AGENT...</option>
                                                                    <option value="bank_mgr">SR. BANK MANAGER</option>
                                                                    <option value="credit_analyst">CREDIT ANALYST-4</option>
                                                                    <option value="risk_officer">RISK OFFICER</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Decision Footer (EMI display moved here to avoid overlap) */}
                                                    <div className="bg-[#6605c7]/5 p-8 border-t border-[#6605c7]/10 flex justify-between items-center">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                                                                <span className="material-symbols-outlined text-[#6605c7]">payments</span>
                                                            </div>
                                                            <div>
                                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em]">Estimated EMI Protocol</p>
                                                                <p className="text-[10px] font-bold text-[#6605c7] uppercase tracking-widest">Monthly Amortization</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-3xl font-black text-[#6605c7] italic tracking-tighter">
                                                                ₹{Math.round((selectedApp.amount * (parseFloat(interestRate)/100/12) * Math.pow(1 + parseFloat(interestRate)/100/12, parseInt(tenure)*12)) / (Math.pow(1 + parseFloat(interestRate)/100/12, parseInt(tenure)*12) - 1)).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === 'documents' && (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                            <DetailSection icon="description" title="Document Vault" color="bg-emerald-50 text-emerald-600">
                                                {selectedApp.documents?.length > 0 ? (
                                                    <div className="grid grid-cols-1 gap-4">
                                                        {selectedApp.documents.map((doc: any, idx: number) => (
                                                            <div key={idx} className="flex justify-between items-center p-6 bg-gray-50/50 rounded-3xl border border-gray-100 group hover:border-[#6605c7]/20 transition-all">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                                                                        <span className="material-symbols-outlined text-[#6605c7]">description</span>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">{doc.docType?.replace(/_/g, ' ')}</p>
                                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Verified via DigiLocker</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                                                        doc.status === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                        doc.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                                        'bg-amber-50 text-amber-600 border-amber-100'
                                                                    }`}>
                                                                        {doc.status}
                                                                    </span>
                                                                    <button className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#6605c7] hover:border-[#6605c7]/30 transition-all shadow-sm">
                                                                        <span className="material-symbols-outlined text-xl">visibility</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="py-20 text-center space-y-4">
                                                        <span className="material-symbols-outlined text-gray-200 text-6xl">folder_off</span>
                                                        <p className="text-[11px] font-black text-gray-300 uppercase tracking-[0.3em] italic">No digital assets transmitted yet.</p>
                                                    </div>
                                                )}
                                            </DetailSection>
                                        </motion.div>
                                    )}

                                    {activeTab === 'history' && (
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                                            <DetailSection icon="history" title="Audit Log" color="bg-gray-100 text-gray-600">
                                                <div className="space-y-8 pl-4 border-l-2 border-gray-50 ml-4">
                                                    <div className="relative">
                                                        <div className="absolute -left-[2.1rem] top-0 w-4 h-4 rounded-full bg-[#6605c7] border-4 border-white shadow-sm" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">Application Submitted</p>
                                                        <p className="text-[9px] font-bold text-gray-400 mt-1">{format(new Date(selectedApp.submittedAt || new Date()), 'MMM dd, yyyy - p')}</p>
                                                    </div>
                                                    <div className="relative opacity-50">
                                                        <div className="absolute -left-[2.1rem] top-0 w-4 h-4 rounded-full bg-gray-200 border-4 border-white shadow-sm" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Staff Review Completed</p>
                                                        <p className="text-[9px] font-bold text-gray-400 mt-1">Pending Sync...</p>
                                                    </div>
                                                </div>
                                            </DetailSection>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Action Matrix */}
                                {showRejectForm ? (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="glass-card p-10 rounded-[3rem] bg-rose-50/50 border border-rose-100 space-y-6 pb-12"
                                    >
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-600 italic">Rejection Detail Log</h4>
                                        <textarea
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                            placeholder="Specify non-compliance parameters..."
                                            className="w-full p-6 rounded-[2rem] border border-rose-200 bg-white text-[11px] font-black uppercase tracking-widest focus:outline-none focus:ring-8 focus:ring-rose-500/5 resize-none transition-all placeholder:text-rose-200"
                                            rows={5}
                                        />
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setShowRejectForm(false)}
                                                className="flex-1 px-8 py-5 rounded-[2rem] bg-white text-rose-600 border border-rose-200 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-50 transition-all shadow-sm"
                                            >
                                                Abort
                                            </button>
                                            <button
                                                onClick={handleRejectApplication}
                                                disabled={actionLoading || !rejectReason.trim()}
                                                className="flex-1 px-8 py-5 rounded-[2rem] bg-rose-600 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-rose-500/20"
                                            >
                                                {actionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                                Confirm Decline
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-6 pb-20">
                                        <button
                                            onClick={() => setShowRejectForm(true)}
                                            disabled={actionLoading || selectedApp?.status !== 'processing'}
                                            className="group relative overflow-hidden px-10 py-6 rounded-[2.5rem] bg-white text-rose-600 border border-rose-100 hover:bg-rose-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                        >
                                            <span className="material-symbols-outlined font-black">cancel</span>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Decline Node</span>
                                        </button>
                                        <button
                                            onClick={handleApproveApplication}
                                            disabled={actionLoading || (selectedApp?.status !== 'under_bank_review' && selectedApp?.status !== 'processing')}
                                            className="group relative overflow-hidden px-10 py-6 rounded-[2.5rem] bg-[#6605c7] text-white shadow-2xl shadow-purple-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {actionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                            <span className="material-symbols-outlined font-black">verified</span>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Validate Protocol</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
