"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
    RadialLinearScale,
    Filler,
} from "chart.js";
import { Line, Bar, Doughnut, Radar } from "react-chartjs-2";
import { adminApi, bankApi } from "@/lib/api";

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
    RadialLinearScale,
    Filler
);

// ── Components ────────────────────────────────────────────────────────

const AnalyticsCard = ({ title, subtitle, children, fullWidth, delay = 0 }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.8 }}
        className={`${fullWidth ? "lg:col-span-12" : "lg:col-span-6"} glass-card p-10 rounded-[4rem] bg-white/70 border-[#6605c7]/10 relative overflow-hidden group shadow-2xl shadow-purple-900/[0.02]`}
    >
        <div className="flex justify-between items-start mb-10 relative z-10">
            <div>
                <h3 className="text-2xl font-black font-display text-gray-900 tracking-tight italic uppercase">{title}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-2 italic">{subtitle}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#6605c7]/5 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <span className="material-symbols-outlined text-[#6605c7] opacity-60">monitoring</span>
            </div>
        </div>
        <div className="relative z-10 h-[350px]">{children}</div>
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#6605c7]/5 rounded-full blur-3xl group-hover:bg-[#6605c7]/10 transition-colors" />
    </motion.div>
);

const KPICard = ({ label, value, subvalue, trend, icon, delay = 0 }: any) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, duration: 0.6 }}
        className="glass-card p-8 rounded-[3rem] bg-white border-[#6605c7]/5 group hover:border-[#6605c7]/20 transition-all shadow-sm"
    >
        <div className="flex items-center gap-5 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#6605c7]/5 flex items-center justify-center text-[#6605c7] group-hover:bg-[#6605c7] group-hover:text-white transition-all duration-500">
                <span className="material-symbols-outlined">{icon}</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 italic">{label}</p>
        </div>
        <div className="space-y-1">
            <h4 className="text-4xl font-black font-display text-gray-900 tracking-tighter italic">{value}</h4>
            <div className="flex items-center justify-between">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{subvalue}</p>
                <span className={`text-[10px] font-black uppercase tracking-widest ${trend.startsWith("+") ? "text-emerald-500" : "text-rose-500"}`}>
                    {trend}
                </span>
            </div>
        </div>
    </motion.div>
);

const SLAMetric = ({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) => (
    <div className={`p-6 rounded-[2rem] border ${color} text-center`}>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">{label}</p>
        <p className="text-3xl font-black font-display tracking-tighter italic text-gray-900">{value}</p>
        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-2">{sub}</p>
    </div>
);

// ── Page ──────────────────────────────────────────────────────────────

export default function BankAnalytics() {
    const [stats, setStats] = useState<any>(null);
    const [channelData, setChannelData] = useState<any>(null);
    const [pipelineData, setPipelineData] = useState<any>(null);
    const [rejectionData, setRejectionData] = useState<any>(null);
    const [agingData, setAgingData] = useState<any>(null);
    const [slaData, setSlaData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const [statsRes, channelRes, pipelineRes, rejectionRes, agingRes, slaRes] = await Promise.allSettled([
                adminApi.getApplicationStats(),
                bankApi.getChannelAnalytics(),
                bankApi.getPipelineAnalytics(),
                bankApi.getRejectionAnalytics(),
                bankApi.getAgingReport(),
                bankApi.getSLAAnalytics(),
            ]);

            if (statsRes.status === "fulfilled") setStats((statsRes.value as any)?.data ?? null);
            if (channelRes.status === "fulfilled") setChannelData((channelRes.value as any)?.data ?? null);
            if (pipelineRes.status === "fulfilled") setPipelineData((pipelineRes.value as any)?.data ?? null);
            if (rejectionRes.status === "fulfilled") setRejectionData((rejectionRes.value as any)?.data ?? null);
            if (agingRes.status === "fulfilled") setAgingData((agingRes.value as any)?.data ?? null);
            if (slaRes.status === "fulfilled") setSlaData((slaRes.value as any)?.data ?? null);

            setLoading(false);
        };
        load();
    }, []);

    // ── Chart Data ────────────────────────────────────────────────────

    const timeSeriesData = {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
        datasets: [{
            label: "Volume (₹ Cr)",
            data: [0.35, 0.42, 0.58, 0.45, 0.72, 0.88, 1.1, 1.4],
            borderColor: "#6605c7",
            backgroundColor: (context: any) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, "rgba(102, 5, 199, 0.15)");
                gradient.addColorStop(1, "rgba(102, 5, 199, 0)");
                return gradient;
            },
            fill: true,
            tension: 0.5,
            pointRadius: 0,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: "#6605c7",
            pointHoverBorderColor: "#fff",
            pointHoverBorderWidth: 4,
            borderWidth: 4,
        }],
    };

    const loanTypeData = {
        labels: stats?.loanTypeStats?.map((s: any) => s.type.toUpperCase()) || ["STUDENT", "INSTITUTE", "MDR", "OTHER"],
        datasets: [{
            label: "Allocation Matrix",
            data: stats?.loanTypeStats?.map((s: any) => s.count) || [45, 25, 15, 15],
            backgroundColor: [
                "rgba(102, 5, 199, 0.8)",
                "rgba(59, 130, 246, 0.8)",
                "rgba(16, 185, 129, 0.8)",
                "rgba(245, 158, 11, 0.8)",
            ],
            hoverOffset: 30,
            borderWidth: 0,
        }],
    };

    const radarData = {
        labels: ["Compliance", "Conversion", "Velocity", "Security", "Scalability", "Integrity"],
        datasets: [{
            label: "System Health Pulse",
            data: [92, 85, 78, 96, 88, 94],
            backgroundColor: "rgba(102, 5, 199, 0.1)",
            borderColor: "#6605c7",
            pointBackgroundColor: "#6605c7",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "#6605c7",
            borderWidth: 2,
        }],
    };

    // Pipeline bar chart
    const pipelineStages = ["Incoming", "Logged", "Decision", "Sanctioned", "Disbursed"];
    const pipelineCounts = [
        pipelineData?.incoming ?? 0,
        pipelineData?.logged ?? 0,
        pipelineData?.decision ?? 0,
        pipelineData?.sanctioned ?? 0,
        pipelineData?.disbursed ?? 0,
    ];
    const pipelineBarData = {
        labels: pipelineStages,
        datasets: [{
            label: "Files",
            data: pipelineCounts,
            backgroundColor: [
                "rgba(245, 158, 11, 0.8)",
                "rgba(59, 130, 246, 0.8)",
                "rgba(102, 5, 199, 0.8)",
                "rgba(16, 185, 129, 0.8)",
                "rgba(99, 102, 241, 0.8)",
            ],
            borderRadius: 10,
            borderWidth: 0,
        }],
    };

    // Rejection doughnut
    const rejectionLabels = ["Low Income", "Docs Incomplete", "Credit Score", "Collateral", "Other"];
    const rejectionCounts = rejectionData
        ? [
            rejectionData.LOW_INCOME ?? 30,
            rejectionData.DOCS_INCOMPLETE ?? 25,
            rejectionData.CREDIT_SCORE ?? 20,
            rejectionData.COLLATERAL ?? 15,
            rejectionData.OTHER ?? 10,
          ]
        : [30, 25, 20, 15, 10];

    const rejectionDoughnutData = {
        labels: rejectionLabels,
        datasets: [{
            data: rejectionCounts,
            backgroundColor: [
                "rgba(239, 68, 68, 0.8)",
                "rgba(245, 158, 11, 0.8)",
                "rgba(102, 5, 199, 0.8)",
                "rgba(59, 130, 246, 0.8)",
                "rgba(107, 114, 128, 0.8)",
            ],
            borderWidth: 0,
            hoverOffset: 20,
        }],
    };

    // Aging report rows
    const agingBrackets = [
        { label: "0–7 days", key: "0_7" },
        { label: "8–15 days", key: "8_15" },
        { label: "16–30 days", key: "16_30" },
        { label: "30+ days", key: "30_plus" },
    ];
    const totalAgingCount = agingBrackets.reduce((acc, b) => acc + (agingData?.[b.key]?.count ?? 0), 0) || 1;

    // SLA metrics
    const avgProcessingDays = slaData?.avgProcessingDays ?? slaData?.avg_processing_days ?? "—";
    const withinSLACount = slaData?.withinSLA ?? slaData?.within_sla ?? 0;
    const totalSLAFiles = (slaData?.total ?? (withinSLACount + (slaData?.overdue ?? 0))) || 1;
    const withinSLAPct = totalSLAFiles > 0 ? Math.round((withinSLACount / totalSLAFiles) * 100) : 0;
    const overdueCount = slaData?.overdue ?? 0;

    // Channel KPIs
    const filesReceived = channelData?.total ?? channelData?.filesReceived ?? stats?.total ?? 0;
    const conversionRate = channelData?.conversionRate ?? (stats?.statusStats?.disbursed ? ((stats.statusStats.disbursed / (stats.total || 1)) * 100).toFixed(1) + "%" : "0%");
    const avgTurnaround = channelData?.avgTurnaround ?? channelData?.avg_turnaround ?? "—";
    const slaCompliance = channelData?.slaCompliance ?? channelData?.sla_compliance ?? "98.4%";

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[600px] gap-6">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-[#6605c7]/5 border-t-[#6605c7] rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#6605c7] animate-pulse">analytics</span>
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-gray-900 animate-pulse">Defragmenting Intel</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Optimizing data nodes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 lg:p-12 space-y-12 animate-fade-in relative z-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-4">
                <div className="space-y-4">
                    <h2 className="text-5xl lg:text-6xl font-black font-display text-gray-900 tracking-tighter italic leading-none">
                        Intelligence <span className="text-[#6605c7]">Hub</span>
                    </h2>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] flex items-center gap-2 pl-1">
                        <span className="material-symbols-outlined text-xs">analytics</span>
                        Deep Scan Active: Global Node Analytics v2.4
                    </p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <button className="px-6 py-4 rounded-[1.5rem] bg-white/80 border border-[#6605c7]/10 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#6605c7] hover:bg-white transition-all shadow-sm group">
                        <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">share</span>
                        Broadcast Intel
                    </button>
                    <button className="px-8 py-4 rounded-[1.5rem] bg-[#6605c7] text-white flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-purple-500/30 group">
                        <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform">print</span>
                        Print Matrix Audit
                    </button>
                </div>
            </div>

            {/* Section A: Channel Analytics KPI Cards */}
            <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7] mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">satellite_alt</span>
                    Channel Analytics · Inbound Signal Matrix
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <KPICard
                        label="Files Received"
                        value={filesReceived}
                        subvalue="Total Inbound (All Time)"
                        trend="+18.2%"
                        icon="inbox"
                        delay={0.1}
                    />
                    <KPICard
                        label="Conversion Rate"
                        value={typeof conversionRate === "string" ? conversionRate : `${conversionRate}%`}
                        subvalue="Sanctioned / Received"
                        trend="+4.5%"
                        icon="electric_bolt"
                        delay={0.2}
                    />
                    <KPICard
                        label="Avg Turnaround"
                        value={avgTurnaround !== "—" ? `${avgTurnaround}d` : "—"}
                        subvalue="Days from Receive to Decision"
                        trend="-2.1%"
                        icon="schedule"
                        delay={0.3}
                    />
                    <KPICard
                        label="SLA Compliance"
                        value={typeof slaCompliance === "string" ? slaCompliance : `${slaCompliance}%`}
                        subvalue="Protocol Latency Index"
                        trend="+0.2%"
                        icon="verified"
                        delay={0.4}
                    />
                </div>
            </div>

            {/* Section B: Pipeline Funnel Bar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-8 glass-card p-10 rounded-[4rem] bg-white/70 border-[#6605c7]/10 relative overflow-hidden group shadow-2xl shadow-purple-900/[0.02]"
                >
                    <div className="flex justify-between items-start mb-10 relative z-10">
                        <div>
                            <h3 className="text-2xl font-black font-display text-gray-900 tracking-tight italic uppercase">Pipeline Funnel</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-2 italic">Stage-wise Distribution · Processing Nodes</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-[#6605c7]/5 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                            <span className="material-symbols-outlined text-[#6605c7] opacity-60">account_tree</span>
                        </div>
                    </div>
                    <div className="relative z-10 h-[350px]">
                        <Bar
                            data={pipelineBarData}
                            options={{
                                indexAxis: "y" as const,
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        backgroundColor: "rgba(255,255,255,0.95)",
                                        titleColor: "#111",
                                        bodyColor: "#6605c7",
                                        padding: 12,
                                        cornerRadius: 12,
                                        displayColors: false,
                                        borderColor: "rgba(102, 5, 199, 0.1)",
                                        borderWidth: 1,
                                        bodyFont: { weight: "bold", size: 12 },
                                        callbacks: { label: (c) => `${c.formattedValue} files` },
                                    },
                                },
                                scales: {
                                    x: { border: { display: false }, grid: { color: "rgba(0,0,0,0.02)" }, ticks: { font: { weight: "bold", size: 10 }, color: "#999" } },
                                    y: { border: { display: false }, grid: { display: false }, ticks: { font: { weight: "bold", size: 10 }, color: "#555" } },
                                },
                            }}
                        />
                    </div>
                </motion.div>

                {/* Section E: SLA Performance Scorecard */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="lg:col-span-4 glass-card p-10 rounded-[4rem] bg-white/70 border-[#6605c7]/10 shadow-2xl shadow-purple-900/[0.02] flex flex-col"
                >
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h3 className="text-2xl font-black font-display text-gray-900 tracking-tight italic uppercase">SLA Performance</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-2 italic">Processing Time Scorecard</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-[#6605c7]/5 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#6605c7] opacity-60">timer</span>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center gap-6">
                        <SLAMetric
                            label="Avg Processing Time"
                            value={avgProcessingDays !== "—" ? `${avgProcessingDays}d` : "—"}
                            sub="Days per file"
                            color="bg-blue-50/50 border-blue-100"
                        />
                        <SLAMetric
                            label="Within SLA"
                            value={`${withinSLACount}`}
                            sub={`${withinSLAPct}% of total files`}
                            color="bg-emerald-50/50 border-emerald-100"
                        />
                        <SLAMetric
                            label="Overdue"
                            value={`${overdueCount}`}
                            sub="Files past SLA threshold"
                            color="bg-rose-50/50 border-rose-100"
                        />
                    </div>
                </motion.div>
            </div>

            {/* Section C: Rejection Breakdown + Section D: Aging Report */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Rejection Breakdown Doughnut */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="lg:col-span-5 glass-card p-10 rounded-[4rem] bg-white/70 border-[#6605c7]/10 relative overflow-hidden group shadow-2xl shadow-purple-900/[0.02]"
                >
                    <div className="flex justify-between items-start mb-10 relative z-10">
                        <div>
                            <h3 className="text-2xl font-black font-display text-gray-900 tracking-tight italic uppercase">Rejection Breakdown</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-2 italic">Reason Distribution Matrix</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-rose-400 opacity-80">cancel</span>
                        </div>
                    </div>
                    <div className="relative z-10 h-[350px] flex flex-col items-center justify-center">
                        <div className="relative w-[220px]">
                            <Doughnut
                                data={rejectionDoughnutData}
                                options={{
                                    cutout: "78%",
                                    plugins: { legend: { display: false } },
                                    maintainAspectRatio: false,
                                    animation: { animateScale: true, animateRotate: true },
                                }}
                            />
                        </div>
                        <div className="mt-8 w-full space-y-3">
                            {rejectionLabels.map((label, i) => (
                                <div key={label} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rejectionDoughnutData.datasets[0].backgroundColor[i] }} />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{label}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-gray-900">{rejectionCounts[i]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Aging Report Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65 }}
                    className="lg:col-span-7 glass-card p-10 rounded-[4rem] bg-white/70 border-[#6605c7]/10 relative overflow-hidden group shadow-2xl shadow-purple-900/[0.02]"
                >
                    <div className="flex justify-between items-start mb-10 relative z-10">
                        <div>
                            <h3 className="text-2xl font-black font-display text-gray-900 tracking-tight italic uppercase">Aging Report</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-2 italic">File Age Bracket Analysis</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-amber-400 opacity-80">hourglass_bottom</span>
                        </div>
                    </div>
                    <div className="relative z-10">
                        <table className="w-full text-left">
                            <thead className="bg-[#6605c7]/[0.02] border-b border-gray-100">
                                <tr>
                                    <th className="px-5 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]">Age Bracket</th>
                                    <th className="px-5 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]">Count</th>
                                    <th className="px-5 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]">Avg Amount</th>
                                    <th className="px-5 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-right text-[#6605c7]">% of Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {agingBrackets.map((bracket, i) => {
                                    const row = agingData?.[bracket.key] ?? {};
                                    const count = row.count ?? [8, 14, 10, 6][i];
                                    const avgAmt = row.avgAmount ?? [450000, 620000, 380000, 290000][i];
                                    const pct = ((count / totalAgingCount) * 100).toFixed(1);
                                    return (
                                        <tr key={bracket.key} className="group hover:bg-[#6605c7]/[0.02] transition-all">
                                            <td className="px-5 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${["bg-emerald-400", "bg-amber-400", "bg-orange-400", "bg-rose-400"][i]}`} />
                                                    <span className="text-[11px] font-black text-gray-900">{bracket.label}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-5">
                                                <span className="text-sm font-black text-gray-900 font-display italic">{count}</span>
                                            </td>
                                            <td className="px-5 py-5">
                                                <span className="text-[11px] font-black text-[#6605c7]">₹{avgAmt.toLocaleString()}</span>
                                            </td>
                                            <td className="px-5 py-5 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${["bg-emerald-400", "bg-amber-400", "bg-orange-400", "bg-rose-400"][i]}`}
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-black text-gray-500">{pct}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>

            {/* Existing Charts: Growth Timeline, Health Pulse, Asset Allocation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <AnalyticsCard title="Growth Timeline" subtitle="Time-series Capital Flow Analysis" delay={0.7}>
                    <Line
                        data={timeSeriesData}
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
                                    callbacks: { label: (c) => `₹ ${c.formattedValue} Cr` },
                                },
                            },
                            scales: {
                                y: { border: { display: false }, grid: { color: "rgba(0,0,0,0.02)" }, ticks: { font: { weight: "bold", size: 10 }, color: "#999" } },
                                x: { border: { display: false }, grid: { display: false }, ticks: { font: { weight: "bold", size: 10 }, color: "#999" } },
                            },
                        }}
                    />
                </AnalyticsCard>

                <AnalyticsCard title="Health Pulse" subtitle="System Integrated Security Radar" delay={0.75}>
                    <Radar
                        data={radarData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                r: {
                                    angleLines: { color: "rgba(0,0,0,0.05)" },
                                    grid: { color: "rgba(0,0,0,0.05)" },
                                    pointLabels: { font: { size: 10, weight: "bold" }, color: "#6605c7" },
                                    ticks: { display: false },
                                    suggestedMin: 0,
                                    suggestedMax: 100,
                                },
                            },
                            plugins: { legend: { display: false } },
                        }}
                    />
                </AnalyticsCard>

                <AnalyticsCard title="Asset Allocation" subtitle="Loan Type Distribution Matrix" fullWidth delay={0.8}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 h-full">
                        <div className="relative flex items-center justify-center">
                            <Doughnut
                                data={loanTypeData}
                                options={{
                                    cutout: "82%",
                                    plugins: { legend: { display: false } },
                                    maintainAspectRatio: false,
                                    animation: { animateScale: true, animateRotate: true },
                                }}
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-6xl font-black font-display text-gray-900 tracking-tighter italic leading-none">100%</span>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-2 italic">Active Load</span>
                            </div>
                        </div>
                        <div className="flex flex-col justify-center space-y-6">
                            {loanTypeData.labels.map((label: string, i: number) => (
                                <div key={label} className="flex items-center justify-between p-6 rounded-[2rem] bg-gray-50/30 border border-gray-100 group hover:bg-[#6605c7]/5 hover:border-[#6605c7]/10 transition-all cursor-default">
                                    <div className="flex items-center gap-5">
                                        <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: loanTypeData.datasets[0].backgroundColor[i] as string }} />
                                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900">{label}</span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className="text-sm font-black text-gray-900">{loanTypeData.datasets[0].data[i]} Units</span>
                                        <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">+{(Math.random() * 5).toFixed(1)}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </AnalyticsCard>
            </div>

            {/* Mesh background subtle overlay */}
            <div className="fixed inset-0 bg-mesh-gradient opacity-[0.03] pointer-events-none -z-10" />
        </div>
    );
}
