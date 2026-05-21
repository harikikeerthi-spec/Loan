"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { adminApi, bankApi } from "@/lib/api";
import ChatInterface from "@/components/Chat/ChatInterface";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

// ── Components ────────────────────────────────────────────────────────

const StatMiniCard = ({ label, value, trend, icon, bgColor, iconColor, delay = 0 }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="glass-card stat-card-gradient p-8 rounded-[3rem] relative overflow-hidden group border-[#6605c7]/5"
    >
        <div className="flex justify-between items-start relative z-10">
            <div className="space-y-4">
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
                <div className="text-4xl font-black font-display text-gray-900 leading-none tracking-tighter italic">
                    {value}
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-2 ${Number(trend) >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${Number(trend) >= 0 ? "bg-emerald-50" : "bg-rose-50"}`}>
                            <span className="material-symbols-outlined text-[10px] font-black">{Number(trend) >= 0 ? "trending_up" : "trending_down"}</span>
                            {trend}%
                        </div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Growth Index</span>
                    </div>
                )}
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-12 duration-700 ${bgColor || "bg-[#6605c7]/10"} shadow-sm`}>
                <span className={`material-symbols-outlined text-3xl opacity-80 ${iconColor || "text-[#6605c7]"}`}>{icon}</span>
            </div>
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-[0.04] pointer-events-none group-hover:scale-125 group-hover:-rotate-12 transition-transform duration-1000">
            <span className="material-symbols-outlined text-[12rem]">{icon}</span>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#6605c7]/5 to-transparent rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
    </motion.div>
);

const QuickAction = ({ icon, label, sublabel, bgColor, iconColor, onClick }: any) => (
    <button
        onClick={onClick}
        className="glass-card p-6 rounded-[2.5rem] bg-white group hover:bg-[#6605c7]/5 transition-all text-left border-[#6605c7]/10 relative overflow-hidden"
    >
        <div className="relative z-10">
            <div className={`w-12 h-12 rounded-2xl ${bgColor || "bg-[#6605c7]/10"} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                <span className={`material-symbols-outlined text-2xl opacity-80 ${iconColor || "text-[#6605c7]"}`}>{icon}</span>
            </div>
            <div>
                <h4 className="text-sm font-black text-gray-900 group-hover:text-[#6605c7] transition-colors">{label}</h4>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{sublabel}</p>
            </div>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700">
            <span className="material-symbols-outlined text-8xl">{icon}</span>
        </div>
    </button>
);

// Pipeline stage colors
const STAGE_COLORS = [
    { dot: "bg-amber-400", text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
    { dot: "bg-blue-400", text: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { dot: "bg-[#6605c7]", text: "text-[#6605c7]", bg: "bg-[#6605c7]/10", border: "border-[#6605c7]/20" },
    { dot: "bg-emerald-400", text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { dot: "bg-indigo-400", text: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
];

const STAGES = ["Incoming", "Logged", "Decision", "Sanctioned", "Disbursed"];

const statusColors: Record<string, string> = {
    pending: "bg-amber-50 text-amber-600 border-amber-100",
    processing: "bg-blue-50 text-blue-600 border-blue-100",
    under_bank_review: "bg-[#6605c7]/10 text-[#6605c7] border-[#6605c7]/20",
    approved: "bg-emerald-50 text-emerald-600 border-emerald-100",
    rejected: "bg-rose-50 text-rose-600 border-rose-100",
    disbursed: "bg-indigo-50 text-indigo-600 border-indigo-100",
    INCOMING: "bg-amber-50 text-amber-600 border-amber-100",
    LOGGED: "bg-blue-50 text-blue-600 border-blue-100",
    DECISION_MADE: "bg-[#6605c7]/10 text-[#6605c7] border-[#6605c7]/20",
    SANCTIONED: "bg-emerald-50 text-emerald-600 border-emerald-100",
    DISBURSED: "bg-indigo-50 text-indigo-600 border-indigo-100",
};

const queryTypeBadge: Record<string, string> = {
    DOCUMENT: "bg-purple-50 text-purple-600 border-purple-100",
    INFORMATION: "bg-blue-50 text-blue-600 border-blue-100",
    CLARIFICATION: "bg-orange-50 text-orange-600 border-orange-100",
};

// ── Page ──────────────────────────────────────────────────────────────

export default function BankDashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [showChat, setShowChat] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Data state
    const [incomingFiles, setIncomingFiles] = useState<any>(null);
    const [myFiles, setMyFiles] = useState<any>(null);
    const [openQueries, setOpenQueries] = useState<any[]>([]);
    const [pipelineData, setPipelineData] = useState<any>(null);
    const [appStats, setAppStats] = useState<any>(null);

    useEffect(() => {
        setMounted(true);
        const load = async () => {
            const [incomingRes, myFilesRes, queriesRes, pipelineRes, statsRes] = await Promise.allSettled([
                bankApi.getIncomingFiles({ limit: 5 }),
                bankApi.getMyFiles({ limit: 1 }),
                bankApi.getQueries("OPEN"),
                bankApi.getPipelineAnalytics(),
                adminApi.getApplicationStats(),
            ]);

            if (incomingRes.status === "fulfilled") setIncomingFiles((incomingRes.value as any)?.data ?? (incomingRes.value as any));
            if (myFilesRes.status === "fulfilled") setMyFiles((myFilesRes.value as any)?.data ?? (myFilesRes.value as any));
            if (queriesRes.status === "fulfilled") {
                const qData = (queriesRes.value as any)?.data ?? (queriesRes.value as any);
                setOpenQueries(Array.isArray(qData) ? qData.slice(0, 5) : []);
            }
            if (pipelineRes.status === "fulfilled") setPipelineData((pipelineRes.value as any)?.data ?? (pipelineRes.value as any));
            if (statsRes.status === "fulfilled") setAppStats((statsRes.value as any)?.data ?? null);

            setLoading(false);
        };
        load();
    }, []);

    // KPI derivations
    const incomingCount = incomingFiles?.total ?? incomingFiles?.count ?? (Array.isArray(incomingFiles) ? incomingFiles.length : 0);
    const myFilesCount = myFiles?.total ?? myFiles?.count ?? (Array.isArray(myFiles) ? myFiles.length : 0);
    const queriesCount = openQueries.length;
    const decisionsPending = pipelineData?.incoming ?? incomingCount;

    // Pipeline stage counts
    const stageCounts = [
        pipelineData?.incoming ?? incomingCount,
        pipelineData?.logged ?? 0,
        pipelineData?.decision ?? 0,
        pipelineData?.sanctioned ?? 0,
        pipelineData?.disbursed ?? 0,
    ];

    // Incoming files list
    const filesList: any[] = Array.isArray(incomingFiles)
        ? incomingFiles
        : Array.isArray(incomingFiles?.files)
        ? incomingFiles.files
        : Array.isArray(incomingFiles?.data)
        ? incomingFiles.data
        : [];

    const disbursementData = {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [{
            label: "Capital Flow (₹ Cr)",
            data: [0.45, 0.52, 0.60, 0.48, 0.75, 0.90],
            borderColor: "#6605c7",
            backgroundColor: (context: any) => {
                const chart = context.chart;
                const { ctx, chartArea } = chart;
                if (!chartArea) return "rgba(102, 5, 199, 0.05)";
                const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                gradient.addColorStop(0, "rgba(102, 5, 199, 0)");
                gradient.addColorStop(1, "rgba(102, 5, 199, 0.15)");
                return gradient;
            },
            tension: 0.5,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: "#6605c7",
            pointHoverBorderColor: "#fff",
            pointHoverBorderWidth: 4,
            borderWidth: 4,
        }],
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
            {/* Chat Overlay */}
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

            {/* Header */}
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
                        <span className="material-symbols-outlined text-xs">sync</span>
                        Network Sync: {mounted ? format(new Date(), "MMM dd, HH:mm:ss") : "--:--:--"} (UTC+5:30)
                    </p>
                </div>

                <div className="flex flex-wrap gap-4">
                    <motion.button
                        whileHover={{ y: -2 }}
                        onClick={() => bankApi.exportApplications()}
                        className="px-6 py-4 rounded-[1.5rem] bg-white/80 border border-[#6605c7]/10 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#6605c7] hover:bg-white transition-all shadow-sm group"
                    >
                        <span className="material-symbols-outlined text-xl group-hover:scale-125 transition-transform">database</span>
                        Extract Matrix
                    </motion.button>
                    <motion.button
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push("/bank/applications")}
                        className="px-8 py-4 rounded-[1.5rem] bg-[#6605c7] text-white flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-purple-500/30 group"
                    >
                        <span className="material-symbols-outlined text-xl group-hover:rotate-90 transition-transform duration-500">add_circle</span>
                        Initialize Pulse
                    </motion.button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatMiniCard
                    label="Incoming Queue"
                    value={incomingCount}
                    trend="+3.2"
                    icon="inbox"
                    iconColor="text-amber-500"
                    bgColor="bg-amber-500/5"
                    delay={0.1}
                />
                <StatMiniCard
                    label="Files Logged"
                    value={myFilesCount}
                    trend="+1.8"
                    icon="task_alt"
                    iconColor="text-blue-500"
                    bgColor="bg-blue-500/5"
                    delay={0.2}
                />
                <StatMiniCard
                    label="Decisions Pending"
                    value={decisionsPending}
                    trend="+0.5"
                    icon="gavel"
                    iconColor="text-[#6605c7]"
                    bgColor="bg-[#6605c7]/5"
                    delay={0.3}
                />
                <StatMiniCard
                    label="Open Queries"
                    value={queriesCount}
                    trend="+2.1"
                    icon="help"
                    iconColor="text-rose-500"
                    bgColor="bg-rose-500/5"
                    delay={0.4}
                />
            </div>

            {/* Pipeline Funnel */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-card p-10 rounded-[4rem] border-[#6605c7]/10 bg-white/70 shadow-2xl shadow-purple-900/[0.02]"
            >
                <div className="flex items-center gap-5 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-[#6605c7]/5 flex items-center justify-center text-[#6605c7]">
                        <span className="material-symbols-outlined text-2xl">account_tree</span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black font-display text-gray-900 tracking-tight italic">Pipeline Funnel</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">Live Stage Distribution · Bank Processing Nodes</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {STAGES.map((stage, i) => (
                        <div key={stage} className="flex items-center gap-3 flex-1 min-w-[120px]">
                            <div className={`flex-1 p-6 rounded-[2rem] border ${STAGE_COLORS[i].bg} ${STAGE_COLORS[i].border} group hover:shadow-md transition-all`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className={`w-2.5 h-2.5 rounded-full ${STAGE_COLORS[i].dot} animate-pulse`} />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{stage}</span>
                                </div>
                                <p className={`text-3xl font-black font-display tracking-tighter italic ${STAGE_COLORS[i].text}`}>
                                    {stageCounts[i] ?? 0}
                                </p>
                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-2">files</p>
                            </div>
                            {i < STAGES.length - 1 && (
                                <span className="material-symbols-outlined text-gray-300 text-2xl shrink-0">chevron_right</span>
                            )}
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Intelligence Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Disbursement Pulse */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
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
                            {["Real-time", "Quarterly"].map((mode) => (
                                <button key={mode} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mode === "Real-time" ? "bg-[#6605c7] text-white shadow-lg" : "text-gray-400 hover:text-gray-900"}`}>
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-[300px] relative z-10">
                        <Line
                            data={disbursementData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                                        titleColor: "#111",
                                        bodyColor: "#6605c7",
                                        padding: 15,
                                        cornerRadius: 15,
                                        displayColors: false,
                                        borderColor: "rgba(102, 5, 199, 0.1)",
                                        borderWidth: 1,
                                        bodyFont: { weight: "bold", size: 12 },
                                        callbacks: { label: (c) => `₹ ${c.formattedValue} Cr Transmitted` },
                                    },
                                },
                                scales: {
                                    y: { border: { display: false }, grid: { color: "rgba(0,0,0,0.02)" }, ticks: { font: { weight: "bold", size: 10 }, color: "#999" } },
                                    x: { border: { display: false }, grid: { display: false }, ticks: { font: { weight: "bold", size: 10 }, color: "#999" } },
                                },
                            }}
                        />
                    </div>
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-1000">
                        <span className="material-symbols-outlined text-[15rem]">show_chart</span>
                    </div>
                </motion.div>

                {/* Open Queries Panel */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="lg:col-span-4 glass-card p-10 rounded-[4rem] border-[#6605c7]/10 bg-white/70 flex flex-col shadow-2xl shadow-purple-900/[0.02]"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
                                <span className="material-symbols-outlined text-xl animate-pulse">help</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-black font-display text-gray-900 tracking-tight italic">Open Queries</h3>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Pending Resolution</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push("/bank/queries")}
                            className="text-[9px] font-black uppercase tracking-[0.2em] text-[#6605c7] hover:underline"
                        >
                            View All
                        </button>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
                        {openQueries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-center">
                                <span className="material-symbols-outlined text-4xl text-gray-200 mb-3">check_circle</span>
                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">No open queries</p>
                            </div>
                        ) : (
                            openQueries.map((q: any, i: number) => (
                                <div key={q.id || i} className="p-5 rounded-[1.5rem] bg-gray-50/50 border border-gray-100 group hover:border-rose-100 hover:bg-rose-50/30 transition-all">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${queryTypeBadge[q.queryType] || "bg-gray-50 text-gray-400 border-gray-100"}`}>
                                            {q.queryType || "QUERY"}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-600 leading-relaxed line-clamp-2">
                                        {q.description?.slice(0, 60)}{q.description?.length > 60 ? "…" : ""}
                                    </p>
                                    <button
                                        onClick={() => router.push("/bank/queries")}
                                        className="mt-3 text-[9px] font-black uppercase tracking-widest text-[#6605c7] hover:underline"
                                    >
                                        Resolve →
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Bottom Row: Incoming Files Table + Quick Actions + Compliance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Incoming Files Table */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="lg:col-span-2 glass-card rounded-[4rem] border-[#6605c7]/10 bg-white/70 overflow-hidden shadow-2xl shadow-purple-900/[0.05]"
                >
                    <div className="p-12 pb-6 flex justify-between items-end">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl animate-pulse">inbox</span>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black font-display text-gray-900 tracking-tight italic">Incoming Files</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] italic">Latest Received from Staff Hub</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push("/bank/applications")}
                            className="px-6 py-3 rounded-2xl bg-[#6605c7]/5 text-[10px] font-black uppercase tracking-[0.2em] text-[#6605c7] hover:bg-[#6605c7] hover:text-white transition-all shadow-sm"
                        >
                            View All
                        </button>
                    </div>

                    <div className="p-8 pt-0">
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-[#6605c7]/[0.02] border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]">Applicant</th>
                                        <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]">Amount</th>
                                        <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]">Loan Type</th>
                                        <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]">Status</th>
                                        <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-right text-[#6605c7]">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50/50">
                                    {filesList.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <span className="material-symbols-outlined text-4xl text-gray-200">inbox</span>
                                                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">No incoming files</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filesList.slice(0, 5).map((file: any, i: number) => (
                                            <tr key={file.id || i} className="group hover:bg-[#6605c7]/[0.03] transition-all duration-300">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6605c7]/10 to-transparent flex items-center justify-center font-black text-[#6605c7] text-[10px] border border-[#6605c7]/5 group-hover:scale-110 transition-transform">
                                                            {(file.applicantName || file.firstName || "?")[0]}
                                                        </div>
                                                        <p className="text-xs font-black text-gray-900 tracking-tight italic uppercase">
                                                            {file.applicantName || `${file.firstName || ""} ${file.lastName || ""}`.trim() || "—"}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-xs font-black text-[#6605c7] italic">
                                                        ₹{(file.loanAmount || file.amount || 0).toLocaleString()}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                        {file.loanType || file.productName || "—"}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border ${statusColors[file.status] || "bg-gray-50 text-gray-400 border-gray-100"}`}>
                                                        {(file.status || "INCOMING").replace(/_/g, " ")}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <p className="text-[9px] font-black text-gray-500 font-mono">
                                                        {(() => {
                                                            try { return format(new Date(file.receivedAt || file.createdAt || new Date()), "MMM dd, yyyy"); } catch { return "—"; }
                                                        })()}
                                                    </p>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>

                {/* Right column: Quick Actions + Compliance */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="space-y-10"
                >
                    {/* Quick Actions */}
                    <div className="glass-card p-10 rounded-[4rem] border-[#6605c7]/10 bg-white/70 shadow-2xl shadow-purple-900/[0.05] relative overflow-hidden group">
                        <h3 className="text-xl font-black font-display text-gray-900 mb-8 tracking-tight italic relative z-10">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <QuickAction
                                icon="bookmark_add"
                                label="Log File"
                                sublabel="Assign LAN"
                                onClick={() => router.push("/bank/applications")}
                            />
                            <QuickAction
                                icon="help"
                                label="Raise Query"
                                sublabel="Open Thread"
                                iconColor="text-rose-500"
                                bgColor="bg-rose-500/5"
                                onClick={() => router.push("/bank/queries")}
                            />
                            <QuickAction
                                icon="payments"
                                label="Confirm Disburse"
                                sublabel="Final Step"
                                iconColor="text-emerald-500"
                                bgColor="bg-emerald-500/5"
                                onClick={() => router.push("/bank/applications")}
                            />
                            <QuickAction
                                icon="star"
                                label="Rate Quality"
                                sublabel="Score File"
                                iconColor="text-amber-500"
                                bgColor="bg-amber-500/5"
                                onClick={() => router.push("/bank/applications")}
                            />
                        </div>
                        <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#6605c7]/5 rounded-full blur-2xl group-hover:bg-[#6605c7]/10 transition-colors" />
                    </div>

                    {/* Compliance Shield */}
                    <div className="glass-card p-10 rounded-[4rem] bg-[#6605c7] text-white overflow-hidden relative group shadow-2xl shadow-purple-900/20">
                        <div className="relative z-10">
                            <h3 className="text-xl font-black font-display mb-3 uppercase tracking-tighter italic">Compliance Shield</h3>
                            <p className="text-white/70 text-[10px] font-bold uppercase tracking-[0.2em] mb-8 leading-relaxed">
                                Core synchronized under <span className="text-white">RBI-GDRP-v2.0</span> protocols. Integrity verified.
                            </p>
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
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <div className="w-full h-[1px] bg-white/10 absolute top-0 animate-scan-line" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Mesh background subtle overlay */}
            <div className="fixed inset-0 bg-mesh-gradient opacity-[0.03] pointer-events-none -z-10" />
        </div>
    );
}
