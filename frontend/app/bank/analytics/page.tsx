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
    Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import { adminApi } from "@/lib/api";

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

// --- Components ---

const AnalyticsCard = ({ title, subtitle, children, fullWidth, delay = 0 }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.8 }}
        className={`${fullWidth ? 'lg:col-span-12' : 'lg:col-span-6'} glass-card p-10 rounded-[4rem] bg-white/70 border-[#6605c7]/10 relative overflow-hidden group shadow-2xl shadow-purple-900/[0.02]`}
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
        <div className="relative z-10 h-[350px]">
            {children}
        </div>
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
                <span className={`text-[10px] font-black uppercase tracking-widest ${trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {trend}
                </span>
            </div>
        </div>
    </motion.div>
);

// --- Page ---

export default function BankAnalytics() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await adminApi.getApplicationStats() as any;
                if (res.success) {
                    setStats(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch analytics data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Chart Data Generators
    const timeSeriesData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
        datasets: [{
            label: 'Volume (₹ Cr)',
            data: [0.35, 0.42, 0.58, 0.45, 0.72, 0.88, 1.1, 1.4],
            borderColor: '#6605c7',
            backgroundColor: (context: any) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, 'rgba(102, 5, 199, 0.15)');
                gradient.addColorStop(1, 'rgba(102, 5, 199, 0)');
                return gradient;
            },
            fill: true,
            tension: 0.5,
            pointRadius: 0,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: '#6605c7',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 4,
            borderWidth: 4,
        }]
    };

    const loanTypeData = {
        labels: stats?.loanTypeStats?.map((s: any) => s.type.toUpperCase()) || ['STUDENT', 'INSTITUTE', 'MDR', 'OTHER'],
        datasets: [{
            label: 'Allocation Matrix',
            data: stats?.loanTypeStats?.map((s: any) => s.count) || [45, 25, 15, 15],
            backgroundColor: [
                'rgba(102, 5, 199, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(245, 158, 11, 0.8)',
            ],
            hoverOffset: 30,
            borderWidth: 0,
        }]
    };

    const radarData = {
        labels: ['Compliance', 'Conversion', 'Velocity', 'Security', 'Scalability', 'Integrity'],
        datasets: [{
            label: 'System Health Pulse',
            data: [92, 85, 78, 96, 88, 94],
            backgroundColor: 'rgba(102, 5, 199, 0.1)',
            borderColor: '#6605c7',
            pointBackgroundColor: '#6605c7',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#6605c7',
            borderWidth: 2
        }]
    };

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

            {/* KPI Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <KPICard 
                    label="Volume Vector" 
                    value={`₹${(((Array.isArray(stats?.loanTypeStats) ? stats.loanTypeStats : []).reduce((acc: number, curr: any) => acc + (curr.totalAmount || 0), 0) || 0) / 10000000).toFixed(2)}Cr`}
                    subvalue="Capital Disbursed (YTD)"
                    trend="+18.2%"
                    icon="trending_up"
                    delay={0.1}
                />
                <KPICard 
                    label="Node Throughput" 
                    value={`${stats?.total || 0}`}
                    subvalue="Active Pulse Units"
                    trend="+4.5%"
                    icon="grid_view"
                    delay={0.2}
                />
                <KPICard 
                    label="SLA Compliance" 
                    value="98.4%"
                    subvalue="Protocol Latency Index"
                    trend="+0.2%"
                    icon="verified"
                    delay={0.3}
                />
                <KPICard 
                    label="Loss Matrix" 
                    value="0.02%"
                    subvalue="NPA Deviation Vector"
                    trend="-12.1%"
                    icon="security"
                    delay={0.4}
                />
            </div>

            {/* Advanced Visualization Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <AnalyticsCard title="Growth Timeline" subtitle="Time-series Capital Flow Analysis" delay={0.5}>
                    <Line 
                        data={timeSeriesData} 
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
                                    callbacks: { label: (c) => `₹ ${c.formattedValue} Cr` }
                                }
                            },
                            scales: {
                                y: { border: { display: false }, grid: { color: 'rgba(0,0,0,0.02)' }, ticks: { font: { weight: 'bold', size: 10 }, color: '#999' } },
                                x: { border: { display: false }, grid: { display: false }, ticks: { font: { weight: 'bold', size: 10 }, color: '#999' } }
                            }
                        }}
                    />
                </AnalyticsCard>

                <AnalyticsCard title="Health Pulse" subtitle="System Integrated Security Radar" delay={0.6}>
                    <Radar 
                        data={radarData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                r: {
                                    angleLines: { color: 'rgba(0,0,0,0.05)' },
                                    grid: { color: 'rgba(0,0,0,0.05)' },
                                    pointLabels: { font: { size: 10, weight: 'bold' }, color: '#6605c7' },
                                    ticks: { display: false },
                                    suggestedMin: 0,
                                    suggestedMax: 100
                                }
                            },
                            plugins: { legend: { display: false } }
                        }}
                    />
                </AnalyticsCard>

                <AnalyticsCard title="Asset Allocation" subtitle="Loan Type Distribution Matrix" fullWidth delay={0.7}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 h-full">
                        <div className="relative flex items-center justify-center">
                            <Doughnut 
                                data={loanTypeData}
                                options={{
                                    cutout: '82%',
                                    plugins: { legend: { display: false } },
                                    maintainAspectRatio: false,
                                    animation: { animateScale: true, animateRotate: true }
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
                                        <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: loanTypeData.datasets[0].backgroundColor[i] }} />
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
