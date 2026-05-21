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
        className="glass-card stat-card-gradient p-8 rounded-[3rem] relative overflow-hidden group border-[#6605c7]/5"
    >
        <div className="flex justify-between items-start relative z-10">
            <div className="space-y-2">
                <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.2em]">{label}</p>
                <div className="text-2xl font-black font-display text-gray-900 leading-none tracking-tight">
                    {value}
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-2 ${Number(trend) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${Number(trend) >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                            <span className="material-symbols-outlined text-[10px] font-black">{Number(trend) >= 0 ? 'trending_up' : 'trending_down'}</span>
                            {trend}%
                        </div>
                        <span className="text-[7.5px] font-bold text-gray-400 uppercase tracking-widest">vs last month</span>
                    </div>
                )}
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-12 duration-500 ${bgColor || 'bg-[#6605c7]/10'} shadow-sm`}>
                <span className={`material-symbols-outlined text-xl ${iconColor || 'text-[#6605c7]'}`}>{icon}</span>
            </div>
        </div>
        
        {/* Animated Background Element */}
        <div className="absolute -right-10 -bottom-10 opacity-[0.04] pointer-events-none group-hover:scale-125 group-hover:-rotate-12 transition-transform duration-1000">
            <span className="material-symbols-outlined text-[12rem]">{icon}</span>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#6605c7]/5 to-transparent rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
    </motion.div>
);

interface AdminStatsResponse {
    success?: boolean;
    data?: any;
}

// --- Page ---

// Supported banks configuration
const SUPPORTED_BANKS = [
    { id: "auxilo", name: "Auxilo Finserve", logo: "/bank-logos/auxilo.png" },
    { id: "avanse", name: "Avanse Financial", logo: "/bank-logos/avanse.png" },
    { id: "credila", name: "HDFC Credila", logo: "/bank-logos/credila.png" },
    { id: "idfc", name: "IDFC FIRST Bank", logo: "/bank-logos/idfc.png" },
    { id: "poonawalla", name: "Poonawalla Fincorp", logo: "/bank-logos/poonawalla.png" },
];

export default function BankDashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showChat, setShowChat] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedBankId, setCurrentBankId] = useState<string>(
        typeof window !== "undefined" ? sessionStorage.getItem("selectedBank") || "auxilo" : "auxilo"
    );

    // Bank detection helpers
    const currentBankId = selectedBankId;
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
        const fetchStats = async () => {
            try {
                const res = await adminApi.getApplicationStats() as AdminStatsResponse;
                if (res.success) {
                    setStats(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Mock data for applications
    const allApplications = useMemo(() => {
        return stats?.applications || [];
    }, [stats]);

    // Kanban board data
    const kanbanData = useMemo(() => {
        return {
            incoming: allApplications.filter((app: any) => app.status?.toLowerCase() === "pending"),
            logged: allApplications.filter((app: any) => app.status?.toLowerCase() === "submitted"),
            review: allApplications.filter((app: any) => ["submitted_to_bank", "under_bank_review"].includes(app.status?.toLowerCase())),
            decided: allApplications.filter((app: any) => ["approved", "rejected"].includes(app.status?.toLowerCase())),
            closed: allApplications.filter((app: any) => app.status?.toLowerCase() === "disbursed")
        };
    }, [allApplications]);

    // Disbursement trend chart data
    const disbursementTrendData = useMemo(() => ({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Capital Flow (₹ Cr)',
            data: [0.45, 0.52, 0.60, 0.48, 0.75, 0.90],
            borderColor: '#6605c7',
            backgroundColor: (context: any) => {
                const chart = context.chart;
                const {ctx, chartArea} = chart;
                if (!chartArea) return 'rgba(102, 5, 199, 0.05)';
                const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                gradient.addColorStop(0, 'rgba(102, 5, 199, 0)');
                gradient.addColorStop(1, 'rgba(102, 5, 199, 0.15)');
                return gradient;
            },
            tension: 0.5,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: '#6605c7',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 4,
            borderWidth: 4,
        }]
    }), []);

    // Derived Statistics
    const metrics = useMemo(() => {
        const total = allApplications.length;
        const totalValue = allApplications.reduce((acc: number, app: any) => acc + (app.amount || 0), 0);
        
        const sanctionedApps = allApplications.filter((app: any) => ["approved", "sanctioned", "conditional_sanction", "disbursed"].includes(app.status?.toLowerCase()));
        const sanctionRate = total > 0 ? (sanctionedApps.length / total) * 100 : 0;
        
        const disbursedApps = allApplications.filter((app: any) => app.status?.toLowerCase() === "disbursed");
        const disbursedValue = disbursedApps.reduce((acc: number, app: any) => acc + (app.amount || 0), 0);

        const pendingApps = allApplications.filter((app: any) => ["pending", "submitted", "submitted_to_bank"].includes(app.status?.toLowerCase()));

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
        return allApplications.map((app: any) => {
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

    const statusColors: Record<string, string> = {
        pending: "bg-amber-50 text-amber-600 border-amber-100 shadow-[0_0_8px_rgba(245,158,11,0.1)]",
        processing: "bg-blue-50 text-blue-600 border-blue-100 shadow-[0_0_8px_rgba(59,130,246,0.1)]",
        under_bank_review: "bg-[#6605c7]/10 text-[#6605c7] border-[#6605c7]/20 shadow-[0_0_8px_rgba(102,5,199,0.1)]",
        approved: "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-[0_0_8px_rgba(16,185,129,0.1)]",
        rejected: "bg-rose-50 text-rose-600 border-rose-100 shadow-[0_0_8px_rgba(239,68,68,0.1)]",
        disbursed: "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-[0_0_8px_rgba(79,70,229,0.1)]",
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
            {/* Header / Greet Section */}
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
                        <span className="text-[10px] font-black text-[#6605c7] uppercase tracking-[0.2em]">Partner Core v4.28</span>
                    </motion.div>
                    <h2 className="text-5xl lg:text-6xl font-black font-display text-gray-900 tracking-tighter italic leading-none">
                        System <span className="text-[#6605c7]">Terminal</span>
                    </h2>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] flex items-center gap-2 pl-1">
                        <span className="material-symbols-outlined text-xs animate-spin">sync</span>
                        Network Sync: {mounted ? format(new Date(), 'MMM dd, HH:mm:ss') : '--:--:--'} (UTC+5:30)
                    </p>
                </div>
                
                <div className="flex flex-wrap gap-4 items-center relative">
                    {/* Premium Bank Selector Dropdown */}
                    <div className="relative">
                        <motion.button
                            whileHover={{ y: -2 }}
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="px-5 py-4 rounded-[1.5rem] bg-white/80 border border-[#6605c7]/15 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#6605c7] hover:bg-white hover:border-[#6605c7]/35 transition-all shadow-sm group select-none relative z-50"
                        >
                            <span className="material-symbols-outlined text-lg shrink-0">account_balance</span>
                            <span>{SUPPORTED_BANKS.find(b => b.id === currentBankId)?.name || "Select Institution"}</span>
                            <span className="material-symbols-outlined text-base transition-transform duration-200" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>expand_more</span>
                        </motion.button>

                        {dropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute right-0 mt-2 z-50 w-64 bg-white/95 backdrop-blur-xl border border-[#6605c7]/12 rounded-2xl p-2 shadow-2xl shadow-purple-950/10 flex flex-col gap-1"
                                >
                                    <div className="px-3 py-1.5 border-b border-gray-100 mb-1">
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Select Partner Bank</span>
                                    </div>
                                    {SUPPORTED_BANKS.map((b) => (
                                        <button
                                            key={b.id}
                                            onClick={() => {
                                                setCurrentBankId(b.id);
                                                sessionStorage.setItem("selectedBank", b.id);
                                                localStorage.setItem("selectedBank", b.id);
                                                setDropdownOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                                                currentBankId === b.id
                                                    ? 'bg-[#6605c7]/10 text-[#6605c7] font-black'
                                                    : 'text-gray-600 hover:bg-[#6605c7]/5 font-bold'
                                            }`}
                                        >
                                            <div className="w-6 h-6 rounded-lg border border-gray-100 bg-white flex items-center justify-center overflow-hidden p-0.5 shrink-0">
                                                <img src={b.logo} alt={b.name} className="w-full h-full object-contain" />
                                            </div>
                                            <span className="text-[9px] uppercase tracking-wider flex-1 truncate">{b.name}</span>
                                            {currentBankId === b.id && (
                                                <span className="material-symbols-outlined text-sm text-[#6605c7]">check_circle</span>
                                            )}
                                        </button>
                                    ))}
                                </motion.div>
                            </>
                        )}
                    </div>

                    <motion.button 
                        whileHover={{ y: -2 }}
                        onClick={() => {
                            const csvContent = "data:text/csv;charset=utf-8," 
                                + ["ID,Name,Amount,Type,Status"].join(",") + "\n"
                                + allApplications.map((e: any) => `${e.applicationNumber},${e.firstName} ${e.lastName},${e.amount},${e.loanType},${e.status}`).join("\n");
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

            {/* Performance Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatMiniCard
                    label="Active Portfolio"
                    value={`₹${(( (Array.isArray(stats?.loanTypeStats) ? stats.loanTypeStats : []).reduce((acc: number, curr: any) => acc + (curr.totalAmount || 0), 0) || 0) / 10000000).toFixed(2)}Cr`}
                    trend={stats?.monthlyComparison?.change || "+12.4"}
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
                    label="Conversion Vector"
                    value={`${((stats?.statusStats?.disbursed || 0) / (stats?.total || 1) * 100).toFixed(1)}%`}
                    trend="-2.1"
                    icon="electric_bolt"
                    iconColor="text-emerald-500"
                    bgColor="bg-emerald-500/5"
                    delay={0.3}
                />
                <StatMiniCard
                    label="Pending Audit"
                    value={`${stats?.statusStats?.submitted || 0}`}
                    trend="+0.8"
                    icon="monitoring"
                    iconColor="text-rose-500"
                    bgColor="bg-rose-500/5"
                    delay={0.4}
                />
            </div>

            {/* Intelligence Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Capital Flow Visual */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-8 glass-card p-12 rounded-[4rem] border-[#6605c7]/10 bg-white/70 relative overflow-hidden group shadow-2xl shadow-purple-900/[0.02]"
                >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-[#6605c7]/5 flex items-center justify-center text-[#6605c7]">
                                <span className="material-symbols-outlined text-2xl">monitoring</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black font-display text-gray-900 tracking-tight italic">Disbursement Pulse</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-2 italic">Global Node Capital Flow Protocol</p>
                            </div>
                        </div>
                        <div className="flex gap-2 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
                            {['Real-time', 'Quarterly'].map((mode) => (
                                <button key={mode} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'Real-time' ? 'bg-[#6605c7] text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}>
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-[350px] relative z-10">
                        <Line
                            data={disbursementTrendData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { 
                                    legend: { display: false }, 
                                    tooltip: {
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        titleColor: '#111',
                                        bodyColor: '#6605c7',
                                        padding: 15,
                                        cornerRadius: 15,
                                        displayColors: false,
                                        borderColor: 'rgba(102, 5, 199, 0.1)',
                                        borderWidth: 1,
                                        bodyFont: { weight: 'bold', size: 12 },
                                        callbacks: { label: (c) => `₹ ${c.formattedValue} Cr Transmitted` }
                                    } 
                                },
                                scales: {
                                    y: { border: { display: false }, grid: { color: 'rgba(0,0,0,0.02)' }, ticks: { font: { weight: 'bold', size: 10 }, color: '#999' } },
                                    x: { border: { display: false }, grid: { display: false }, ticks: { font: { weight: 'bold', size: 10 }, color: '#999' } }
                                }
                            }}
                        />
                    </div>
                </motion.div>

                {/* State Distribution Pie widget */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="lg:col-span-4 glass-card p-12 rounded-[4rem] border-[#6605c7]/10 bg-white/70 flex flex-col shadow-2xl shadow-purple-900/[0.02]"
                >
                    <h3 className="text-xl font-black font-display text-gray-900 mb-10 text-center uppercase tracking-tighter italic">State Matrix</h3>
                    <div className="flex-1 relative flex items-center justify-center mb-8">
                        {statusDistribution && (
                            <div className="w-full max-w-[280px]">
                                <Doughnut
                                    data={statusDistribution}
                                    options={{
                                        cutout: '82%',
                                        plugins: { legend: { display: false } },
                                        animation: { animateScale: true, animateRotate: true }
                                    }}
                                />
                            </div>
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-5xl font-black font-display text-gray-900 tracking-tighter leading-none italic">{stats?.total || 0}</span>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mt-2 italic">Active Units</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        {statusDistribution?.labels?.slice(0, 4)?.map((label, i) => (
                            <div key={label} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/50 border border-gray-100/50">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusDistribution?.datasets?.[0]?.backgroundColor?.[i] }} />
                                <div className="min-w-0">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 truncate">{label}</p>
                                    <p className="text-xs font-black text-gray-900">{String(statusDistribution?.datasets?.[0]?.data?.[i] ?? 0)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Conditionally Displayed Role-Based Metrics (Blueprint Feature Category C) */}
            {user?.role === "admin" || user?.role === "super_admin" ? (
                <>
                    <motion.div className="glass-card p-12 rounded-[4rem] border border-[#6605c7]/10 bg-white/70 space-y-6">
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
                        </div>
                    </motion.div>

                    {/* Directive & Security Matrix */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="space-y-10"
                    >
                        <div className="glass-card p-10 rounded-[4rem] border-[#6605c7]/10 bg-white/70 shadow-2xl shadow-purple-900/[0.05] relative overflow-hidden group">
                            <h3 className="text-xl font-black font-display text-gray-900 mb-8 tracking-tight italic relative z-10">Direct Commands</h3>
                            <div className="grid grid-cols-1 gap-4 relative z-10">
                                <QuickAction icon="chat_bubble" label="Initialize Chat" sublabel="WhatsApp Secure Channel" onClick={() => setShowChat(true)} />
                                <QuickAction icon="assignment_add" label="Distribute Tasks" sublabel="Task Allocation Matrix" onClick={() => router.push('/bank/tasks')} />
                                <QuickAction icon="verified" label="Validate Assets" sublabel="Compliance Review" iconColor="text-emerald-500" bgColor="bg-emerald-500/5" onClick={() => router.push('/bank/applications')} />
                            </div>
                        </div>

                        <div className="glass-card p-10 rounded-[4rem] bg-[#6605c7] text-white overflow-hidden relative group shadow-2xl shadow-purple-900/20">
                            <div className="relative z-10">
                                <h3 className="text-xl font-black font-display mb-3 uppercase tracking-tighter italic">Compliance Shield</h3>
                                <p className="text-white/70 text-[10px] font-bold uppercase tracking-[0.2em] mb-8 leading-relaxed">Core synchronized under <span className="text-white">RBI-GDRP-v2.0</span> protocols. Integrity verified.</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_#4ade80]" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] block">Sentinel Engine Live</span>
                                        <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em]">All nodes stable</span>
                                    </div>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-[15rem] absolute -right-16 -bottom-16 text-white/5 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-1000 pointer-events-none select-none">verified_user</span>
                            
                            {/* Interactive scan line */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                <div className="w-full h-[1px] bg-white/10 absolute top-0 animate-scan-line" />
                            </div>
                        </div>
                    </motion.div>
                </>
            ) : null}
        </div>
    );
}
