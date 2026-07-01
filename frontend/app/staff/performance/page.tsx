"use client";

import { useState, useEffect, useCallback } from "react";
import { staffProfileApi } from "@/lib/api";

const StatCard = ({ label, value, icon, color, loading, hint }: any) => (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                <span className={`material-symbols-outlined text-[20px] ${color}`}>{icon}</span>
            </div>
            {hint && <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{hint}</span>}
        </div>
        <h4 className="text-[32px] font-bold text-slate-900 leading-none mb-1">
            {loading ? <span className="block w-12 h-8 bg-slate-100 animate-pulse rounded" /> : value}
        </h4>
        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
);

export default function PerformanceAnalyticsPage() {
    const [dashboardSummary, setDashboardSummary] = useState<any>(null);
    const [rejectionAnalytics, setRejectionAnalytics] = useState<any[]>([]);
    const [slaTracker, setSlaTracker] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const loadPerformanceData = useCallback(async () => {
        setLoading(true);
        try {
            const [summary, rejections, sla]: [any, any, any] = await Promise.all([
                staffProfileApi.getDashboardSummary().catch(() => null),
                staffProfileApi.getRejectionAnalytics('30').catch(() => null),
                staffProfileApi.getSlaTracker().catch(() => null)
            ]);

            if (summary && summary.success) {
                setDashboardSummary(summary.data);
            } else if (summary) {
                setDashboardSummary(summary);
            }

            if (rejections && rejections.success) {
                setRejectionAnalytics(rejections.data || []);
            } else if (rejections) {
                setRejectionAnalytics(Array.isArray(rejections) ? rejections : rejections.data || []);
            }

            if (sla && sla.success) {
                setSlaTracker(sla.data);
            } else if (sla) {
                setSlaTracker(sla);
            }
        } catch (err) {
            console.error("Error loading performance analytics data:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPerformanceData();
    }, [loadPerformanceData]);

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in pb-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-[28px] tracking-tight flex items-center gap-3 font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">
                        Analytical Insights
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-[11px] font-semibold text-violet-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                            PERFORMANCE
                        </span>
                    </h2>
                    <p className="text-slate-500 text-[13px] mt-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live monitoring active
                    </p>
                </div>
                <span className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700 flex items-center gap-1.5 shadow-sm">
                    <span className="material-symbols-outlined text-[16px]">military_tech</span>
                    TOP 5% CONTRIBUTOR
                </span>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Pipeline Value"
                    value={dashboardSummary ? `₹${(dashboardSummary.pipelineValue || 0).toLocaleString('en-IN')}` : '₹0'}
                    icon="payments"
                    color="text-indigo-600"
                    loading={loading}
                    hint={`${dashboardSummary?.counts?.total ?? 0} Applications`}
                />
                <StatCard
                    label="Avg. Turnaround Time"
                    value={dashboardSummary ? `${dashboardSummary.avgTatDays || 0} Days` : '0 Days'}
                    icon="timer"
                    color="text-amber-600"
                    loading={loading}
                    hint="Submission to Decision"
                />
                <StatCard
                    label="SLA Compliance Rate"
                    value={slaTracker ? `${slaTracker.complianceRate || 0}%` : '0%'}
                    icon="gavel"
                    color="text-emerald-600"
                    loading={loading}
                    hint={`Avg. TAT: ${slaTracker?.averageTat || 0} Days`}
                />
                <StatCard
                    label="Conversion Rate"
                    value={dashboardSummary ? `${dashboardSummary.conversionRate || 0}%` : '0%'}
                    icon="trending_up"
                    color="text-blue-600"
                    loading={loading}
                    hint={`${dashboardSummary?.counts?.sanctioned ?? 0} Sanctions`}
                />
            </div>

            {/* Detailed performance views */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* SLA Stage Tracker Table */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-[18px]">query_stats</span>
                        SLA Stage Tracking & Benchmarks
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="pb-3">Processing Stage</th>
                                    <th className="pb-3">Average Duration</th>
                                    <th className="pb-3">SLA Compliance</th>
                                    <th className="pb-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                                {slaTracker?.stages?.map((stage: any, index: number) => (
                                    <tr key={index} className="hover:bg-slate-50/50">
                                        <td className="py-3 font-semibold text-slate-800">{stage.name}</td>
                                        <td className="py-3 font-mono">{stage.tatDays || stage.duration || 0} Days</td>
                                        <td className="py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${stage.compliance >= 95 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${stage.compliance}%` }} />
                                                </div>
                                                <span className="font-bold">{stage.compliance}%</span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-right">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${stage.compliance >= 95 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                                {stage.compliance >= 95 ? 'MET' : 'WARNING'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {(!slaTracker?.stages || slaTracker.stages.length === 0) && (
                                    <tr>
                                        <td colSpan={4} className="py-4 text-center text-slate-400">No SLA benchmarks available</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Rejection Analytics Widget */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-rose-500 text-[18px]">cancel</span>
                        Rejection Analytics
                    </h3>
                    <div className="space-y-4">
                        {rejectionAnalytics.slice(0, 5).map((rej: any, index: number) => (
                            <div key={index} className="space-y-1">
                                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                                    <span className="truncate max-w-[200px]" title={rej.reason}>{rej.reason}</span>
                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{rej.count} ({rej.percentage}%)</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${rej.percentage}%` }} />
                                </div>
                            </div>
                        ))}
                        {(!rejectionAnalytics || rejectionAnalytics.length === 0) && (
                            <div className="text-center py-8 text-slate-400 text-xs">
                                <span className="material-symbols-outlined text-3xl mb-2 text-slate-200 block">mood_fast</span>
                                No rejections logged in the past 30 days
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
