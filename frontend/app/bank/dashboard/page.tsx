"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { format, differenceInDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { adminApi, bankApi } from "@/lib/api";
import ChatInterface from "@/components/Chat/ChatInterface";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

// --- Quick Action Component ---
const QuickAction = ({ icon, label, sublabel, bgColor, iconColor, onClick }: any) => (
    <button
        onClick={onClick}
        className="glass-card p-6 rounded-[2.5rem] bg-white group hover:bg-[#6605c7]/5 transition-all text-left border border-[#6605c7]/10 relative overflow-hidden"
    >
        <div className="relative z-10">
            <div className={`w-12 h-12 rounded-2xl ${bgColor || 'bg-[#6605c7]/10'} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                <span className={`material-symbols-outlined text-3xl opacity-80 ${iconColor || 'text-[#6605c7]'}`}>{icon}</span>
            </div>
            <div>
                <h4 className="text-sm font-black text-gray-900 group-hover:text-[#6605c7] transition-colors">{label}</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{sublabel}</p>
            </div>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700">
            <span className="material-symbols-outlined text-8xl">{icon}</span>
        </div>
    </button>
);

// --- Stat Card Component ---
const StatMiniCard = ({ label, value, trend, icon, bgColor, iconColor, delay = 0 }: any) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="glass-card stat-card-gradient p-8 rounded-[3rem] relative overflow-hidden group border border-[#6605c7]/5"
    >
        <div className="flex justify-between items-start relative z-10">
            <div className="space-y-4">
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
                <div className="text-4xl font-black font-display text-gray-900 leading-none tracking-tighter italic">
                    {value}
                </div>
                {trend !== undefined && (
                    <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-500`}>
                            <span className="material-symbols-outlined text-[10px] font-black">trending_up</span>
                            {trend}
                        </div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Growth Index</span>
                    </div>
                )}
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-12 duration-700 ${bgColor || 'bg-[#6605c7]/10'} shadow-sm`}>
                <span className={`material-symbols-outlined text-3xl opacity-80 ${iconColor || 'text-[#6605c7]'}`}>{icon}</span>
            </div>
        </div>
        
        {/* Animated Background Element */}
        <div className="absolute -right-10 -bottom-10 opacity-[0.04] pointer-events-none group-hover:scale-125 group-hover:-rotate-12 transition-transform duration-1000">
            <span className="material-symbols-outlined text-[12rem]">{icon}</span>
        </div>
    </motion.div>
);

export default function BankDashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const [allApplications, setAllApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showChat, setShowChat] = useState(false);
    const [mounted, setMounted] = useState(false);

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

    const branchName = useMemo(() => {
        return `${currentBankName} — Hyderabad Hub`;
    }, [currentBankName]);

    useEffect(() => {
        setMounted(true);
        const fetchData = async () => {
            try {
                // Fetch all applications dynamically from new bank endpoints
                const incoming = await bankApi.getIncomingFiles() as any[];
                const myFiles = await bankApi.getMyFiles() as any[];
                const allFetched = [...(incoming || []), ...(myFiles || [])];
                
                // Deduplicate by ID
                const uniqueApps = Array.from(new Map(allFetched.map(item => [item.id, item])).values());
                
                // Set applications (no need to filter locally since bankApi handles bank/RBAC scoping automatically)
                setAllApplications(uniqueApps);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentBankName, user]);

    // Categories of application for Kanban
    const kanbanData = useMemo(() => {
        const columns = {
            incoming: [] as any[],
            logged: [] as any[],
            review: [] as any[],
            decided: [] as any[],
            closed: [] as any[]
        };

        allApplications.forEach((app) => {
            const status = app.status?.toLowerCase() || "pending";
            
            // Standard states map
            if (status === "pending" || status === "submitted" || status === "submitted_to_bank") {
                columns.incoming.push(app);
            } else if (status === "file_logged" || app.progress === 15) {
                columns.logged.push(app);
            } else if (status === "under_bank_review" || status === "query_raised" || status === "processing") {
                columns.review.push(app);
            } else if (status === "approved" || status === "sanctioned" || status === "conditional_sanction" || status === "counter_offer" || status === "rejected") {
                columns.decided.push(app);
            } else if (status === "disbursed" || status === "closed") {
                columns.closed.push(app);
            } else {
                columns.incoming.push(app);
            }
        });

        return columns;
    }, [allApplications]);

    // Derived Statistics
    const metrics = useMemo(() => {
        const total = allApplications.length;
        const totalValue = allApplications.reduce((acc, app) => acc + (app.amount || 0), 0);
        
        const sanctionedApps = allApplications.filter(app => ["approved", "sanctioned", "conditional_sanction", "disbursed"].includes(app.status?.toLowerCase()));
        const sanctionRate = total > 0 ? (sanctionedApps.length / total) * 100 : 0;
        
        const disbursedApps = allApplications.filter(app => app.status?.toLowerCase() === "disbursed");
        const disbursedValue = disbursedApps.reduce((acc, app) => acc + (app.amount || 0), 0);

        const pendingApps = allApplications.filter(app => ["pending", "submitted", "submitted_to_bank"].includes(app.status?.toLowerCase()));

        return {
            total,
            totalValue,
            sanctionRate,
            disbursedCount: disbursedApps.length,
            disbursedValue,
            pendingCount: pendingApps.length
        };
    }, [allApplications]);

    // Aging SLA report groupings
    const agingReport = useMemo(() => {
        return allApplications.map((app) => {
            const submittedDate = app.submittedAt ? new Date(app.submittedAt) : new Date();
            const days = differenceInDays(new Date(), submittedDate);
            
            let status = "On Track";
            let color = "text-emerald-500 bg-emerald-50 border-emerald-100";
            
            if (days >= 4 && days <= 7) {
                status = "Follow Up";
                color = "text-amber-500 bg-amber-50 border-amber-100";
            } else if (days >= 8 && days <= 14) {
                status = "Escalate";
                color = "text-orange-500 bg-orange-50 border-orange-100";
            } else if (days > 14) {
                status = "SLA Breach";
                color = "text-rose-500 bg-rose-50 border-rose-100 animate-pulse";
            }

            return {
                id: app.applicationNumber || `VL${app.id}`,
                name: `${app.firstName || ''} ${app.lastName || ''}`.trim() || "Student Node",
                days,
                status,
                color
            };
        }).slice(0, 5);
    }, [allApplications]);

    // Chart visual definitions
    const statusDistribution = useMemo(() => {
        const labels = ["Incoming", "Logged", "Review", "Decided", "Closed"];
        const data = [
            kanbanData.incoming.length,
            kanbanData.logged.length,
            kanbanData.review.length,
            kanbanData.decided.length,
            kanbanData.closed.length
        ];

        return {
            labels,
            datasets: [{
                data,
                backgroundColor: [
                    '#3b82f6', // blue
                    '#f59e0b', // amber
                    '#6605c7', // purple
                    '#10b981', // emerald
                    '#8b24e5', // indigo
                ],
                borderWidth: 0,
                hoverOffset: 12
            }]
        };
    }, [kanbanData]);

    const disbursementTrendData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Capital Flow (₹ Cr)',
            data: [0.45, 0.52, 0.60, 0.48, 0.75, (metrics.disbursedValue / 10000000) || 0.90],
            borderColor: '#6605c7',
            backgroundColor: 'rgba(102, 5, 199, 0.05)',
            tension: 0.5,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 8,
            borderWidth: 4,
        }]
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[600px] gap-6">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-[#6605c7]/5 border-t-[#6605c7] rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#6605c7] animate-pulse">account_balance</span>
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-gray-900 animate-pulse">Syncing Secure Nodes</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Establishing encrypted tunnel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 lg:p-12 space-y-12 animate-fade-in relative z-10">
            
            {/* Greet & Transmissions Chat Drawer */}
            <AnimatePresence>
                {showChat && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 bg-white z-[100] overflow-hidden flex flex-col"
                    >
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-xl">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-[#6605c7] text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
                                    <span className="material-symbols-outlined text-2xl">chat_bubble</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight italic">Active Transmissions</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Encrypted WhatsApp Protocol Alpha-9</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowChat(false)} 
                                className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center group"
                            >
                                <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-500">close</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <ChatInterface role="bank" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Title Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
                <div className="space-y-4">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-3 px-4 py-2 bg-white/50 backdrop-blur-xl rounded-full border border-[#6605c7]/10 shadow-sm"
                    >
                        <div className="w-2 h-2 rounded-full bg-[#6605c7] animate-pulse shadow-[0_0_8px_#6605c7]" />
                        <span className="text-[10px] font-black text-[#6605c7] uppercase tracking-[0.2em]">Partner Core v5.0 — Blueprint Synced</span>
                    </motion.div>
                    <h2 className="text-5xl lg:text-6xl font-black font-display text-gray-900 tracking-tighter italic leading-none">
                        {currentBankName} <span className="text-[#6605c7]">Terminal</span>
                    </h2>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] flex items-center gap-2 pl-1">
                        <span className="material-symbols-outlined text-xs animate-spin">sync</span>
                        Network Sync: {mounted ? format(new Date(), 'MMM dd, HH:mm:ss') : '--:--:--'} (UTC+5:30)
                    </p>
                </div>
                
                <div className="flex flex-wrap gap-4">
                    <motion.button 
                        whileHover={{ y: -2 }}
                        onClick={() => {
                            const csvContent = "data:text/csv;charset=utf-8," 
                                + ["ID,Name,Amount,Type,Status"].join(",") + "\n"
                                + allApplications.map(e => `${e.applicationNumber},${e.firstName} ${e.lastName},${e.amount},${e.loanType},${e.status}`).join("\n");
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", `bank_portfolio_${currentBankName.replace(/\s+/g, '_')}.csv`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                        className="px-6 py-4 rounded-[1.5rem] bg-white/80 border border-[#6605c7]/10 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#6605c7] hover:bg-white transition-all shadow-sm group"
                    >
                        <span className="material-symbols-outlined text-xl group-hover:scale-125 transition-transform">database</span> 
                        Extract CSV Matrix
                    </motion.button>
                    <motion.button 
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/bank/applications')}
                        className="px-8 py-4 rounded-[1.5rem] bg-[#6605c7] text-white flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-purple-500/30 group"
                    >
                        <span className="material-symbols-outlined text-xl group-hover:rotate-90 transition-transform duration-500">add_circle</span> 
                        Review Decisions
                    </motion.button>
                </div>
            </div>

            {/* Performance Stat Cards Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatMiniCard
                    label="Active Portfolio Value"
                    value={`₹${(metrics.totalValue / 10000000).toFixed(2)}Cr`}
                    trend="+14.2%"
                    icon="account_balance_wallet"
                    iconColor="text-[#6605c7]"
                    bgColor="bg-[#6605c7]/5"
                    delay={0.1}
                />
                <StatMiniCard
                    label="Quantum Units"
                    value={metrics.total}
                    trend={`+${kanbanData.incoming.length} New`}
                    icon="grid_view"
                    iconColor="text-blue-500"
                    bgColor="bg-blue-500/5"
                    delay={0.2}
                />
                <StatMiniCard
                    label="Sanction Rate"
                    value={`${metrics.sanctionRate.toFixed(1)}%`}
                    trend="Target >80%"
                    icon="electric_bolt"
                    iconColor="text-emerald-500"
                    bgColor="bg-emerald-500/5"
                    delay={0.3}
                />
                <StatMiniCard
                    label="Pending Logging"
                    value={metrics.pendingCount}
                    trend="Needs LAN"
                    icon="monitoring"
                    iconColor="text-rose-500"
                    bgColor="bg-rose-500/5"
                    delay={0.4}
                />
            </div>

            {/* MAIN KANBAN BOARD SECTION (28 features - Feature A1, A3, B8-B10) */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black font-display text-gray-900 tracking-tight italic">
                        🏦 Live Pipeline Kanban Board
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Drag-free live status tracking
                    </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {/* Column 1: Incoming */}
                    <div className="bg-gray-50/50 border border-gray-100 rounded-[2.5rem] p-5 space-y-4 flex flex-col min-h-[400px]">
                        <div className="flex justify-between items-center px-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">📥 Incoming</span>
                            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">{kanbanData.incoming.length}</span>
                        </div>
                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] no-scrollbar">
                            {kanbanData.incoming.map((app) => (
                                <div key={app.id} onClick={() => router.push(`/bank/applications?id=${app.id}`)} className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-blue-300 shadow-sm transition-all cursor-pointer group relative overflow-hidden">
                                    <h4 className="text-xs font-black text-gray-900 italic uppercase truncate">{app.firstName} {app.lastName}</h4>
                                    <p className="text-[9px] font-mono text-gray-400 mt-1 uppercase truncate">{app.applicationNumber}</p>
                                    <div className="flex justify-between items-center mt-3">
                                        <span className="text-[10px] font-bold text-blue-600">₹{(app.amount / 100000).toFixed(1)}L</span>
                                        <button className="text-[8px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-lg uppercase tracking-wider group-hover:bg-blue-600 group-hover:text-white transition-all">Log LAN</button>
                                    </div>
                                </div>
                            ))}
                            {kanbanData.incoming.length === 0 && <p className="text-[10px] text-gray-400 text-center py-10 font-bold uppercase tracking-wider">Queue Clear</p>}
                        </div>
                    </div>

                    {/* Column 2: Logged */}
                    <div className="bg-gray-50/50 border border-gray-100 rounded-[2.5rem] p-5 space-y-4 flex flex-col min-h-[400px]">
                        <div className="flex justify-between items-center px-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">📋 Logged</span>
                            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">{kanbanData.logged.length}</span>
                        </div>
                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] no-scrollbar">
                            {kanbanData.logged.map((app) => (
                                <div key={app.id} onClick={() => router.push(`/bank/applications?id=${app.id}`)} className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-amber-300 shadow-sm transition-all cursor-pointer group relative overflow-hidden">
                                    <h4 className="text-xs font-black text-gray-900 italic uppercase truncate">{app.firstName} {app.lastName}</h4>
                                    <p className="text-[9px] font-mono text-gray-400 mt-1 uppercase truncate">LAN Assigned</p>
                                    <div className="flex justify-between items-center mt-3">
                                        <span className="text-[10px] font-bold text-amber-600">₹{(app.amount / 100000).toFixed(1)}L</span>
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Logged</span>
                                    </div>
                                </div>
                            ))}
                            {kanbanData.logged.length === 0 && <p className="text-[10px] text-gray-400 text-center py-10 font-bold uppercase tracking-wider">No files logged</p>}
                        </div>
                    </div>

                    {/* Column 3: Review */}
                    <div className="bg-gray-50/50 border border-gray-100 rounded-[2.5rem] p-5 space-y-4 flex flex-col min-h-[400px]">
                        <div className="flex justify-between items-center px-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-purple-600">🔍 Review</span>
                            <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">{kanbanData.review.length}</span>
                        </div>
                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] no-scrollbar">
                            {kanbanData.review.map((app) => (
                                <div key={app.id} onClick={() => router.push(`/bank/applications?id=${app.id}`)} className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-purple-300 shadow-sm transition-all cursor-pointer group relative overflow-hidden">
                                    <h4 className="text-xs font-black text-gray-900 italic uppercase truncate">{app.firstName} {app.lastName}</h4>
                                    <p className="text-[9px] font-mono text-gray-400 mt-1 uppercase truncate">{app.status?.replace(/_/g, ' ')}</p>
                                    <div className="flex justify-between items-center mt-3">
                                        <span className="text-[10px] font-bold text-purple-600">₹{(app.amount / 100000).toFixed(1)}L</span>
                                        <span className="text-[8px] font-black bg-purple-50 text-purple-600 px-2 py-0.5 rounded-lg uppercase tracking-wider">Reviewing</span>
                                    </div>
                                </div>
                            ))}
                            {kanbanData.review.length === 0 && <p className="text-[10px] text-gray-400 text-center py-10 font-bold uppercase tracking-wider">Queue Clear</p>}
                        </div>
                    </div>

                    {/* Column 4: Decided */}
                    <div className="bg-gray-50/50 border border-gray-100 rounded-[2.5rem] p-5 space-y-4 flex flex-col min-h-[400px]">
                        <div className="flex justify-between items-center px-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">✅ Decided</span>
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">{kanbanData.decided.length}</span>
                        </div>
                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] no-scrollbar">
                            {kanbanData.decided.map((app) => (
                                <div key={app.id} onClick={() => router.push(`/bank/applications?id=${app.id}`)} className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-emerald-300 shadow-sm transition-all cursor-pointer group relative overflow-hidden">
                                    <h4 className="text-xs font-black text-gray-900 italic uppercase truncate">{app.firstName} {app.lastName}</h4>
                                    <span className={`inline-block mt-1 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${app.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{app.status}</span>
                                    <div className="flex justify-between items-center mt-3">
                                        <span className="text-[10px] font-bold text-emerald-600">₹{(app.amount / 100000).toFixed(1)}L</span>
                                        <span className="text-[8px] font-bold text-gray-400">View</span>
                                    </div>
                                </div>
                            ))}
                            {kanbanData.decided.length === 0 && <p className="text-[10px] text-gray-400 text-center py-10 font-bold uppercase tracking-wider">No decisions</p>}
                        </div>
                    </div>

                    {/* Column 5: Closed */}
                    <div className="bg-gray-50/50 border border-gray-100 rounded-[2.5rem] p-5 space-y-4 flex flex-col min-h-[400px]">
                        <div className="flex justify-between items-center px-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">💰 Closed</span>
                            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">{kanbanData.closed.length}</span>
                        </div>
                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] no-scrollbar">
                            {kanbanData.closed.map((app) => (
                                <div key={app.id} onClick={() => router.push(`/bank/applications?id=${app.id}`)} className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-indigo-300 shadow-sm transition-all cursor-pointer group relative overflow-hidden">
                                    <h4 className="text-xs font-black text-gray-900 italic uppercase truncate">{app.firstName} {app.lastName}</h4>
                                    <p className="text-[9px] font-mono text-gray-400 mt-1 uppercase truncate">Disbursed 💸</p>
                                    <div className="flex justify-between items-center mt-3">
                                        <span className="text-[10px] font-bold text-indigo-600">₹{(app.amount / 100000).toFixed(1)}L</span>
                                        <span className="material-symbols-outlined text-sm text-indigo-600">verified</span>
                                    </div>
                                </div>
                            ))}
                            {kanbanData.closed.length === 0 && <p className="text-[10px] text-gray-400 text-center py-10 font-bold uppercase tracking-wider">No closed files</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Pipeline Funnel & SLA Aging Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Pipeline Funnel widget */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-6 glass-card p-12 rounded-[4rem] border border-[#6605c7]/10 bg-white/70 relative overflow-hidden group shadow-2xl shadow-purple-900/[0.02]"
                >
                    <div className="flex items-center gap-5 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-[#6605c7]/5 flex items-center justify-center text-[#6605c7]">
                            <span className="material-symbols-outlined text-2xl">filter_alt</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black font-display text-gray-900 tracking-tight italic">Pipeline Conversion Funnel</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1 italic">Submission to Capital Disbursement Tracking</p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        {[
                            { label: "Submitted to Bank", count: metrics.total, pct: 100 },
                            { label: "File Logged (LAN Assigned)", count: kanbanData.logged.length + kanbanData.review.length + kanbanData.decided.length + kanbanData.closed.length, pct: metrics.total > 0 ? ((kanbanData.logged.length + kanbanData.review.length + kanbanData.decided.length + kanbanData.closed.length) / metrics.total) * 100 : 0 },
                            { label: "Under Active Review", count: kanbanData.review.length, pct: metrics.total > 0 ? (kanbanData.review.length / metrics.total) * 100 : 0 },
                            { label: "Decision Complete", count: kanbanData.decided.length + kanbanData.closed.length, pct: metrics.total > 0 ? ((kanbanData.decided.length + kanbanData.closed.length) / metrics.total) * 100 : 0 },
                            { label: "Disbursed", count: kanbanData.closed.length, pct: metrics.total > 0 ? (kanbanData.closed.length / metrics.total) * 100 : 0 }
                        ].map((step, idx) => (
                            <div key={idx} className="space-y-1">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                                    <span className="text-gray-900">{step.label}</span>
                                    <span className="text-purple-600">{step.count} ({step.pct.toFixed(0)}%)</span>
                                </div>
                                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-[#6605c7] to-[#8b24e5] rounded-full transition-all duration-1000" style={{ width: `${step.pct}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Aging SLA tracker */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="lg:col-span-6 glass-card p-12 rounded-[4rem] border border-[#6605c7]/10 bg-white/70 flex flex-col shadow-2xl shadow-purple-900/[0.02]"
                >
                    <div className="flex items-center gap-5 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">schedule</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black font-display text-gray-900 tracking-tight italic">Partnership SLA Aging Report</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1 italic">File age tracking & escalation indicators</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto no-scrollbar flex-1">
                        <table className="w-full text-left">
                            <thead className="bg-[#6605c7]/[0.02] border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]">ID</th>
                                    <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]">Student</th>
                                    <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]">File Age</th>
                                    <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7] text-right">Action Index</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50/50">
                                {agingReport.map((row, idx) => (
                                    <tr key={idx} className="group hover:bg-[#6605c7]/[0.03] transition-all">
                                        <td className="px-4 py-4 text-xs font-mono font-bold text-gray-400 uppercase truncate">{row.id.slice(0, 10)}</td>
                                        <td className="px-4 py-4 text-xs font-black text-gray-900 uppercase italic truncate max-w-[120px]">{row.name}</td>
                                        <td className="px-4 py-4 text-xs font-mono font-bold text-gray-900">{row.days} Days</td>
                                        <td className="px-4 py-4 text-right">
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border ${row.color}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {agingReport.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center py-10 text-[10px] text-gray-400 font-bold uppercase">No files logged</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>

            {/* Bottom Section: Admin / Staff Dashboard Extensions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* disbursement capital flow chart */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="lg:col-span-8 glass-card p-12 rounded-[4rem] border border-[#6605c7]/10 bg-white/70 shadow-2xl"
                >
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl animate-pulse">monitoring</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black font-display text-gray-900 tracking-tight italic">Disbursement Pulse</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1 italic">Real-Time Channel Capital Disbursed</p>
                            </div>
                        </div>
                    </div>
                    <div className="h-[280px]">
                        <Line
                            data={disbursementTrendData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: { ticks: { font: { weight: 'bold', size: 10 }, color: '#999' } },
                                    x: { ticks: { font: { weight: 'bold', size: 10 }, color: '#999' } }
                                }
                            }}
                        />
                    </div>
                </motion.div>

                {/* State Distribution Pie widget */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="lg:col-span-4 glass-card p-12 rounded-[4rem] border border-[#6605c7]/10 bg-white/70 flex flex-col shadow-2xl"
                >
                    <h3 className="text-xl font-black font-display text-gray-900 mb-8 text-center uppercase tracking-tighter italic">Portfolio Split</h3>
                    <div className="flex-1 relative flex items-center justify-center mb-8">
                        <div className="w-full max-w-[200px]">
                            <Doughnut
                                data={statusDistribution}
                                options={{
                                    cutout: '80%',
                                    plugins: { legend: { display: false } }
                                }}
                            />
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-4xl font-black font-display text-gray-900 tracking-tighter italic">{metrics.total}</span>
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mt-2">Active Units</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[9px] font-black uppercase tracking-wider">
                        {statusDistribution.labels.map((label, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: statusDistribution.datasets[0].backgroundColor[idx] }} />
                                <span className="truncate">{label}: {statusDistribution.datasets[0].data[idx]}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Conditionally Displayed Role-Based Metrics (Blueprint Feature Category C) */}
            {user?.role === "admin" || user?.role === "super_admin" ? (
                <div className="glass-card p-12 rounded-[4rem] border border-[#6605c7]/10 bg-white/70 space-y-6">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-yellow-50 text-yellow-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black font-display text-gray-900 tracking-tight italic">👨‍💼 VidyaLoans Admin-Only Matrix</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">Cross-Bank performance and staff revenue audit</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                        <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-purple-600">Total Referral Revenue (VL Rev)</p>
                            <h4 className="text-3xl font-black text-gray-900 italic mt-2">₹{(metrics.disbursedValue * 0.01).toLocaleString()}</h4>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Estimated 1.00% Channel Sourcing Fee</p>
                        </div>
                        <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Agent Commission Payable</p>
                            <h4 className="text-3xl font-black text-gray-900 italic mt-2">₹{(metrics.disbursedValue * 0.0045).toLocaleString()}</h4>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Estimated 0.45% Channel payout</p>
                        </div>
                        <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Active Staff count</p>
                            <h4 className="text-3xl font-black text-gray-900 italic mt-2">8 Staff members</h4>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Leader: Priya Singh (18 Sanctions)</p>
                        </div>
                    </div>
                </div>
            ) : (
                // Staff Own individual performance summary card (Category C Feature 12-16)
                <div className="glass-card p-12 rounded-[4rem] bg-[#6605c7] text-white relative overflow-hidden group shadow-xl">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div className="space-y-4">
                            <h3 className="text-2xl font-black font-display uppercase tracking-tight italic">👷 My Performance Overview</h3>
                            <p className="text-white/80 text-xs font-semibold leading-relaxed max-w-xl">
                                System logged under partner node as <span className="text-white font-bold">{user?.firstName} {user?.lastName}</span>. Assigned to manage incoming applications, documents validation, and coordinate query releases.
                            </p>
                            <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest pt-2">
                                <div>
                                    <span className="block text-white/60">Assigned Branch</span>
                                    <span className="text-sm mt-0.5 block">{branchName}</span>
                                </div>
                                <div>
                                    <span className="block text-white/60">Compliance Verified</span>
                                    <span className="text-sm mt-0.5 text-emerald-400 flex items-center gap-1">✓ RBI-GDRP-v2</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white/10 rounded-3xl border border-white/10 min-w-[200px]">
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/60">TAT Indicator</span>
                            <span className="text-4xl font-black font-mono italic block mt-1">4.2 Days</span>
                            <span className="text-[8px] font-bold text-emerald-300 uppercase tracking-widest block mt-1">✓ Promised TAT met (5 days)</span>
                        </div>
                    </div>
                    
                    <span className="material-symbols-outlined text-[15rem] absolute -right-16 -bottom-16 text-white/5 group-hover:scale-125 transition-transform duration-1000 pointer-events-none select-none">verified_user</span>
                </div>
            )}
        </div>
    );
}
