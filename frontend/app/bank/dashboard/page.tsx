"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
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
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { adminApi } from "@/lib/api";
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

// --- Components ---

const QuickAction = ({ icon, label, sublabel, bgColor, iconColor, onClick }: any) => (
    <button 
        onClick={onClick}
        className="glass-card p-6 rounded-[2.5rem] bg-white group hover:bg-[#6605c7]/5 transition-all text-left border-[#6605c7]/10"
    >
        <div className={`w-12 h-12 rounded-2xl ${bgColor || 'bg-[#6605c7]/10'} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
            <span className={`material-symbols-outlined text-3xl opacity-80 ${iconColor || 'text-[#6605c7]'}`}>{icon}</span>
        </div>
        <div>
            <h4 className="text-sm font-black text-gray-900 group-hover:text-[#6605c7] transition-colors">{label}</h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{sublabel}</p>
        </div>
    </button>
);

const StatMiniCard = ({ label, value, trend, icon, bgColor, iconColor }: any) => (
    <div className="glass-card stat-card-gradient p-6 rounded-[2.5rem] relative overflow-hidden group">
        <div className="flex justify-between items-start relative z-10">
            <div>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-3">{label}</p>
                <div className="text-3xl font-black font-display text-gray-900 leading-tight">
                    {value}
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1.5 mt-2 ${Number(trend) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        <span className="material-symbols-outlined text-sm font-black">{Number(trend) >= 0 ? 'trending_up' : 'trending_down'}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">{trend}% vs. Last Month</span>
                    </div>
                )}
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-6 duration-700 ${bgColor || 'bg-[#6605c7]/10'}`}>
                <span className={`material-symbols-outlined text-2xl opacity-80 ${iconColor || 'text-[#6605c7]'}`}>{icon}</span>
            </div>
        </div>
        <div className="absolute -right-6 -bottom-6 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <span className="material-symbols-outlined text-9xl">{icon}</span>
        </div>
    </div>
);

interface AdminStatsResponse {
    success?: boolean;
    data?: any;
}

// --- Page ---

export default function BankDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showChat, setShowChat] = useState(false);

    useEffect(() => {
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

    // Derived Charts Data
    const statusDistribution = useMemo(() => {
        if (!stats?.statusStats) return null;
        
        const labels = Object.keys(stats.statusStats).map(s => s.charAt(0).toUpperCase() + s.slice(1));
        const data = Object.values(stats.statusStats);
        
        return {
            labels,
            datasets: [{
                data,
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#6605c7', '#3b82f6'],
                borderWidth: 0,
                hoverOffset: 15
            }]
        };
    }, [stats]);

    const disbursementData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Loan Disbursement (Lakhs)',
            data: [45, 52, 60, 48, 75, 90],
            borderColor: '#6605c7',
            backgroundColor: 'rgba(102, 5, 199, 0.05)',
            tension: 0.4,
            fill: true,
            pointRadius: 6,
            pointBackgroundColor: '#6605c7',
            pointBorderWidth: 3,
            pointBorderColor: '#fff',
        }]
    };

    const statusColors: Record<string, string> = {
        pending: "bg-amber-100 text-amber-700 border-amber-200",
        processing: "bg-blue-100 text-blue-700 border-blue-200",
        approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
        rejected: "bg-rose-100 text-rose-600 border-rose-200",
        disbursed: "bg-purple-100 text-purple-700 border-purple-200",
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-[#6605c7]/20 border-t-[#6605c7] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-fade-in relative z-10">
            {/* Upper Greet Section */}
            {showChat ? (
                <div className="absolute inset-0 bg-white z-50 overflow-auto p-8 animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Active Transmissions (Chat)</h2>
                        <button onClick={() => setShowChat(false)} className="px-4 py-2 bg-gray-100 font-bold uppercase tracking-widest text-[10px] text-gray-600 rounded-lg hover:bg-gray-200">Return to Matrix</button>
                    </div>
                    <ChatInterface role="bank" />
                </div>
            ) : null}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-4">
                <div>
                    <h2 className="text-4xl font-black font-display mb-2 text-gray-900 tracking-tight italic">System Terminal</h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs">calendar_today</span>
                        Node Synchronized: {format(new Date(), 'EEEE, MMMM do, yyyy')}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-3 rounded-2xl bg-white/70 border border-[#6605c7]/10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#6605c7] hover:bg-white transition-all shadow-sm">
                        <span className="material-symbols-outlined text-lg">download</span> Export Matrix
                    </button>
                    <button className="admin-btn-primary text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 shadow-xl shadow-purple-500/20">
                        <span className="material-symbols-outlined text-lg">add_circle</span> Process Pulse
                    </button>
                </div>
            </div>

            {/* Matrix Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatMiniCard 
                    label="Active Portfolio" 
                    value={`₹${(stats?.loanTypeStats?.reduce((acc: number, curr: any) => acc + (curr.totalAmount || 0), 0) / 10000000).toFixed(2)}Cr`} 
                    trend={stats?.monthlyComparison?.change} 
                    icon="account_balance_wallet" 
                    iconColor="text-[#6605c7]"
                    bgColor="bg-[#6605c7]/10"
                />
                <StatMiniCard 
                    label="Current Transmission" 
                    value={`${stats?.total || 0} Units`} 
                    trend="+4%" 
                    icon="receipt_long" 
                    iconColor="text-amber-500" 
                    bgColor="bg-amber-500/10"
                />
                <StatMiniCard 
                    label="Pulse Conversion" 
                    value={`${((stats?.statusStats?.disbursed || 0) / (stats?.total || 1) * 100).toFixed(1)}%`} 
                    trend="-2.1%" 
                    icon="electric_bolt" 
                    iconColor="text-emerald-500" 
                    bgColor="bg-emerald-500/10"
                />
                <StatMiniCard 
                    label="Pending Audit" 
                    value={`${stats?.statusStats?.submitted || 0} Nodes`} 
                    trend="+0.01%" 
                    icon="monitoring" 
                    iconColor="text-rose-500" 
                    bgColor="bg-rose-500/10"
                />
            </div>

            {/* Main Visual Intelligence */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Disbursement Graph */}
                <div className="lg:col-span-8 glass-card p-10 rounded-[2.5rem] border-[#6605c7]/10 bg-white/60">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-xl font-black font-display text-gray-900 tracking-tight italic">Capital Disbursement</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Global Node Disbursement Timeline</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 rounded-lg bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 border border-gray-100 hover:text-[#6605c7] hover:bg-white transition-all">Monthly</button>
                            <button className="px-3 py-1 rounded-lg bg-[#6605c7]/5 text-[10px] font-black uppercase tracking-widest text-[#6605c7] border border-[#6605c7]/10">Quarterly</button>
                        </div>
                    </div>
                    <div className="h-[300px]">
                        <Line 
                            data={disbursementData} 
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: { border: { display: false }, grid: { color: 'rgba(0,0,0,0.03)' } },
                                    x: { border: { display: false }, grid: { display: false } }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Insight Donuts */}
                <div className="lg:col-span-4 glass-card p-10 rounded-[2.5rem] border-[#6605c7]/10 bg-white/60">
                    <h3 className="text-xl font-black font-display text-gray-900 mb-8 text-center uppercase tracking-tighter italic">Status Matrix</h3>
                    <div className="h-[250px] relative">
                        {statusDistribution && (
                            <Doughnut 
                                data={statusDistribution} 
                                options={{
                                    cutout: '75%',
                                    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 20, font: { weight: 'bold', size: 10 } } } }
                                }} 
                            />
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-6">
                            <span className="text-2xl font-black font-display text-gray-900">{stats?.total || 0}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Total Units</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Transmission Activity */}
                <div className="lg:col-span-2 glass-card rounded-[3rem] border-[#6605c7]/10 bg-white/60 overflow-hidden shadow-2xl shadow-purple-900/5">
                    <div className="p-10 pb-0 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-black font-display text-gray-900 tracking-tight italic">Recent Signal Sync</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Protocol: Bank-Application-Interface</p>
                        </div>
                        <button className="text-[10px] font-black uppercase tracking-widest text-[#6605c7] hover:underline underline-offset-4">View All Nodes</button>
                    </div>
                    <div className="p-6">
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left">
                                <thead className="admin-table">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest rounded-tl-2xl">Identity</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Financial Load</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">System Node</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Current State</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest rounded-tr-2xl text-right">Synchronization</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {stats?.recentApplications?.map((app: any, i: number) => (
                                        <tr key={i} className="group hover:bg-[#6605c7]/5 transition-all duration-300">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6605c7]/10 to-transparent flex items-center justify-center font-black text-[#6605c7] text-[10px] border border-[#6605c7]/5">
                                                        {app.firstName?.[0]}{app.lastName?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-gray-900 tracking-tight italic uppercase">{app.firstName} {app.lastName}</p>
                                                        <p className="text-[9px] font-bold text-gray-400 font-mono tracking-tighter uppercase">{app.applicationNumber}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-xs font-black text-[#6605c7] italic">₹{app.amount?.toLocaleString()}</td>
                                            <td className="px-6 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest tracking-tight">{app.loanType}</td>
                                            <td className="px-6 py-5">
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${statusColors[app.status] || 'bg-gray-100 text-gray-600'}`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right text-[9px] font-bold text-gray-400 font-mono tracking-tighter uppercase">
                                                {format(new Date(app.date || app.submittedAt || new Date()), "HH:mm · MMM d")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Directives Section */}
                <div className="space-y-8">
                    <div className="glass-card p-10 rounded-[3rem] border-[#6605c7]/10 bg-white/60">
                        <h3 className="text-xl font-black font-display text-gray-900 mb-8 tracking-tight italic">Direct Commands</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <QuickAction icon="chat_bubble" label="Initialize Chat" sublabel="Student WhatsApp" onClick={() => setShowChat(true)} />
                            <QuickAction icon="assignment_add" label="Allocate Nodes" sublabel="Task Delegation" onClick={() => {}} />
                            <QuickAction icon="rate_review" label="Set Multipliers" sublabel="Interest Rate Config" iconColor="text-amber-500" bgColor="bg-amber-500/10" onClick={() => {}} />
                            <QuickAction icon="verified" label="Finalize Audit" sublabel="Protocol Validation" iconColor="text-emerald-500" bgColor="bg-emerald-500/10" onClick={() => {}} />
                        </div>
                    </div>

                    <div className="glass-card p-10 rounded-[3rem] bg-[#6605c7] text-white overflow-hidden relative group">
                        <div className="relative z-10">
                            <h3 className="text-xl font-black font-display mb-2 uppercase tracking-tighter italic">Compliance Shield</h3>
                            <p className="text-white/70 text-[10px] font-bold uppercase tracking-[0.2em] mb-8 leading-relaxed">System core is fully operational under RBI-GDRP protocols.</p>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_#4ade80]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Guardian Engine Live</span>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-[12rem] absolute -right-12 -bottom-12 text-white/5 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-1000 pointer-events-none select-none">verified_user</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
