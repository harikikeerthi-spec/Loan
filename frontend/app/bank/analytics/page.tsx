"use client";

import { useState } from "react";
import { format } from "date-fns";
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
    Filler,
    RadialLinearScale
} from 'chart.js';
import { Line, Doughnut, Bar, Radar } from 'react-chartjs-2';

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
    Filler,
    RadialLinearScale
);

// --- Components ---

const InsightCard = ({ title, value, icon, color, subValue }: any) => (
    <div className="glass-card p-10 rounded-[3rem] bg-white/60 border border-[#6605c7]/10 relative overflow-hidden group hover:scale-[1.02] transition-all">
        <div className="flex justify-between items-start mb-10">
            <div className={`w-14 h-14 rounded-2xl ${color} bg-opacity-10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700`}>
                <span className={`material-symbols-outlined text-3xl ${color}`}>{icon}</span>
            </div>
            {subValue && (
                <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">{subValue}</span>
                </div>
            )}
        </div>
        <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{title}</p>
            <h3 className="text-4xl font-black font-display text-gray-900 tracking-tight italic">{value}</h3>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
            <span className="material-symbols-outlined text-9xl">{icon}</span>
        </div>
    </div>
);

// --- Page ---

export default function BankAnalytics() {
    // Detailed Disbursement Graph
    const disbursementData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
        datasets: [
            {
                label: '2025 Actual (₹ Cr)',
                data: [0.8, 1.2, 0.95, 1.5, 2.1, 1.8, 2.4, 3.2],
                borderColor: '#6605c7',
                backgroundColor: 'rgba(102, 5, 199, 0.05)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
            },
            {
                label: '2024 Historical (₹ Cr)',
                data: [0.5, 0.7, 0.8, 0.9, 1.2, 1.1, 1.3, 1.5],
                borderColor: '#c084fc',
                backgroundColor: 'transparent',
                borderDash: [5, 5],
                tension: 0.4,
                fill: false,
                pointRadius: 0,
            }
        ]
    };

    const funnelData = {
        labels: ['Submitted', 'Verification', 'Drafting', 'Approved', 'Disbursed'],
        datasets: [{
            label: 'Conversion Node Count',
            data: [420, 280, 210, 150, 120],
            backgroundColor: [
                'rgba(102, 5, 199, 0.1)',
                'rgba(102, 5, 199, 0.2)',
                'rgba(102, 5, 199, 0.4)',
                'rgba(102, 5, 199, 0.7)',
                'rgba(102, 5, 199, 1)',
            ],
            borderRadius: 15,
        }]
    };

    const riskRadarData = {
        labels: ['Liquidity', 'Compliance', 'Market Pulse', 'Operational', 'Technological'],
        datasets: [{
            label: 'System Risk Pulse',
            data: [85, 92, 78, 90, 95],
            backgroundColor: 'rgba(102, 5, 199, 0.2)',
            borderColor: '#6605c7',
            borderWidth: 2,
            pointBackgroundColor: '#6605c7',
        }]
    };

    return (
        <div className="p-8 space-y-12 animate-fade-in relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-4">
                <div>
                    <h2 className="text-4xl font-black font-display mb-2 text-gray-900 tracking-tight italic">Intelligence Hub</h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs">monitoring</span>
                        Synaptic Performance Pulse
                    </p>
                </div>
            </div>

            {/* Performance Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <InsightCard title="Total Asset Under Management" value="₹12.4 Cr" icon="account_balance_wallet" color="text-[#6605c7]" subValue="+18.2%" />
                <InsightCard title="Average Processing Latency" value="1.4 Days" icon="schedule" color="text-amber-500" subValue="-0.2 Days" />
                <InsightCard title="Network Trust Index" value="98.4%" icon="verified" color="text-emerald-500" subValue="Stable" />
            </div>

            {/* Core Visualization Grids */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Disbursement Graph */}
                <div className="lg:col-span-8 glass-card p-12 rounded-[4rem] border-[#6605c7]/10 bg-white/60">
                    <div className="flex justify-between items-center mb-12">
                        <div>
                            <h3 className="text-2xl font-black font-display text-gray-900 italic">Capital Flow Analytics</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2 italic">Luminous Node Flow - YOY Performance</p>
                        </div>
                    </div>
                    <div className="h-[400px]">
                        <Line 
                            data={disbursementData} 
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { position: 'top', labels: { boxWidth: 10, font: { weight: 'bold', size: 10 } } } },
                                scales: {
                                    y: { border: { display: false }, grid: { color: 'rgba(0,0,0,0.03)' } },
                                    x: { border: { display: false }, grid: { display: false } }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Conversion Funnel */}
                <div className="lg:col-span-4 glass-card p-12 rounded-[4rem] border-[#6605c7]/10 bg-white/60">
                    <h3 className="text-xl font-black font-display text-gray-900 mb-10 text-center uppercase tracking-tighter italic">Conversion Pulse</h3>
                    <div className="h-[400px]">
                        <Bar 
                            data={funnelData} 
                            options={{
                                indexAxis: 'y' as const,
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: { grid: { display: false }, border: { display: false } },
                                    x: { border: { display: false }, grid: { color: 'rgba(0,0,0,0.03)' } }
                                }
                            }} 
                        />
                    </div>
                </div>
            </div>

            {/* Secondary Intel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card p-12 rounded-[4rem] border-[#6605c7]/10 bg-white/60 flex flex-col items-center">
                    <h3 className="text-xl font-black font-display text-gray-900 mb-10 uppercase tracking-tighter italic">Risk Vector Scan</h3>
                    <div className="h-[350px] w-full max-w-[400px]">
                        <Radar 
                            data={riskRadarData} 
                            options={{
                                plugins: { legend: { display: false } },
                                scales: {
                                    r: {
                                        angleLines: { display: true, color: 'rgba(0,0,0,0.05)' },
                                        grid: { color: 'rgba(0,0,0,0.05)' },
                                        suggestedMin: 50,
                                        suggestedMax: 100,
                                        ticks: { display: false }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="glass-card p-12 rounded-[4rem] border-[#6605c7]/10 bg-white/60">
                    <h3 className="text-xl font-black font-display text-gray-900 mb-8 uppercase tracking-tighter italic">Top Node Connections</h3>
                    <div className="space-y-6">
                        {[
                            { name: "Stanford University", count: 48, percentage: 85, color: "bg-[#6605c7]" },
                            { name: "IIT Bombay", count: 32, percentage: 72, color: "bg-[#8b24e5]" },
                            { name: "INSEAD", count: 25, percentage: 60, color: "bg-[#a855f7]" },
                            { name: "University of Toronto", count: 20, percentage: 45, color: "bg-[#c084fc]" },
                        ].map((node, i) => (
                            <div key={i} className="group cursor-pointer">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[11px] font-black uppercase tracking-widest text-gray-900 group-hover:text-[#6605c7] transition-colors">{node.name}</span>
                                    <span className="text-[10px] font-black font-mono text-gray-400">{node.count} Nodes</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${node.percentage}%` }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className={`h-full ${node.color} shadow-[0_0_8px_currentColor]`} 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
