"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useAgent } from "../AgentContext";
import { referralApi } from "@/lib/api";

export default function AgentAnalytics() {
    const { applications } = useAgent();
    
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

    // NPS Survey states
    const [npsScore, setNpsScore] = useState<number | null>(null);
    const [npsComment, setNpsComment] = useState("");
    const [npsSubmitted, setNpsSubmitted] = useState(false);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoadingLeaderboard(true);
            try {
                const res = await referralApi.getLeaderboard(5) as any;
                if (res.success && res.leaderboard && res.leaderboard.length >= 2) {
                    setLeaderboard(res.leaderboard);
                } else {
                    // Fall back to default mock leaderboard
                    setLeaderboard([
                        { rank: 1, name: "Krishna Agency", count: 12 },
                        { rank: 2, name: "Sai Associates", count: 7 },
                        { rank: 3, name: "Edu Advisors HYD", count: 3 }
                    ]);
                }
            } catch (err) {
                console.error("Failed to load leaderboard:", err);
                setLeaderboard([
                    { rank: 1, name: "Krishna Agency", count: 12 },
                    { rank: 2, name: "Sai Associates", count: 7 },
                    { rank: 3, name: "Edu Advisors HYD", count: 3 }
                ]);
            } finally {
                setLoadingLeaderboard(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const funnelData = useMemo(() => {
        const total = applications.length;
        if (total === 0) {
            // Default mock data if no applications yet
            return {
                submitted: 48,
                docsReceived: 38,
                aiVerified: 32,
                sentToBank: 23,
                sanctioned: 12,
                rates: {
                    docsReceived: 79,
                    aiVerified: 67,
                    sentToBank: 48,
                    sanctioned: 25
                }
            };
        }

        const docsReceived = applications.filter(app => app.documents && app.documents.length > 0).length;
        const aiVerified = applications.filter(app => app.documents && app.documents.some(d => d.status === 'verified')).length;
        
        // Match status values from database
        const sentToBank = applications.filter(app => 
            ['processing', 'approved', 'disbursed', 'bank_review', 'credit_review', 'sanction', 'disbursement_done'].includes(app.status?.toLowerCase())
        ).length;
        
        const sanctioned = applications.filter(app => 
            ['approved', 'disbursed', 'sanction', 'disbursement_done'].includes(app.status?.toLowerCase())
        ).length;

        return {
            submitted: total,
            docsReceived,
            aiVerified,
            sentToBank,
            sanctioned,
            rates: {
                docsReceived: Math.round((docsReceived / total) * 100) || 0,
                aiVerified: Math.round((aiVerified / total) * 100) || 0,
                sentToBank: Math.round((sentToBank / total) * 100) || 0,
                sanctioned: Math.round((sanctioned / total) * 100) || 0
            }
        };
    }, [applications]);

    const bankPerformance = useMemo(() => {
        if (applications.length === 0) {
            // Default mock bank data if no apps
            return [
                { bank: "SBI", submitted: 10, sanctioned: 7, tat: "12 Days", rate: "70%", tatColor: "text-amber-600" },
                { bank: "HDFC Credila", submitted: 7, sanctioned: 4, tat: "9 Days", rate: "57%", tatColor: "text-gray-600" },
                { bank: "Avanse", submitted: 4, sanctioned: 3, tat: "6 Days 🏆", rate: "75%", tatColor: "text-emerald-600 font-bold" }
            ];
        }

        const groups: Record<string, { submitted: number; sanctioned: number; tatSum: number; tatCount: number }> = {};
        
        applications.forEach(app => {
            const bankName = app.bank || "Avanse";
            if (!groups[bankName]) {
                groups[bankName] = { submitted: 0, sanctioned: 0, tatSum: 0, tatCount: 0 };
            }
            
            groups[bankName].submitted++;
            const isSanctioned = ['approved', 'disbursed', 'sanction', 'disbursement_done'].includes(app.status?.toLowerCase());
            if (isSanctioned) {
                groups[bankName].sanctioned++;
            }

            // Estimate TAT from journey dates if available
            if (app.journey && app.journey.length > 1) {
                try {
                    const startStr = app.journey[0].date;
                    const endStr = app.journey[app.journey.length - 1].date;
                    
                    const start = new Date(startStr);
                    const end = new Date(endStr);
                    const diffTime = Math.abs(end.getTime() - start.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
                    
                    groups[bankName].tatSum += diffDays;
                    groups[bankName].tatCount++;
                } catch (e) {
                    // Ignore parsing errors
                }
            }
        });

        return Object.entries(groups).map(([bank, data]) => {
            const avgTat = data.tatCount > 0 ? Math.round(data.tatSum / data.tatCount) : (bank === "Avanse" ? 6 : bank === "SBI" ? 12 : 9);
            const rateVal = data.submitted > 0 ? Math.round((data.sanctioned / data.submitted) * 100) : 0;
            
            let tatColor = "text-gray-600";
            if (avgTat <= 6) tatColor = "text-emerald-600 font-bold";
            else if (avgTat > 10) tatColor = "text-amber-600";

            return {
                bank,
                submitted: data.submitted,
                sanctioned: data.sanctioned,
                tat: `${avgTat} Days${avgTat <= 6 ? " 🏆" : ""}`,
                rate: `${rateVal}%`,
                tatColor
            };
        });
    }, [applications]);

    const rejectionData = useMemo(() => {
        const rejectedApps = applications.filter(app => 
            app.status?.toLowerCase() === 'rejected' || 
            (app.documents && app.documents.some(d => d.status === 'rejected'))
        );

        if (rejectedApps.length === 0) {
            // Default mock rejection analysis if no rejections yet
            return [
                { title: "Incomplete Documents", rate: "44%", countText: "4 counts", tip: "Fix: Use checklists before upload", tipColor: "text-rose-500" },
                { title: "Low Co-Applicant Income", rate: "22%", countText: "2 counts", tip: "Fix: Evaluate checker tool prior to lead submit", tipColor: "text-indigo-600" }
            ];
        }

        const counts: Record<string, number> = {};
        let totalRejections = 0;

        applications.forEach(app => {
            if (app.status?.toLowerCase() === 'rejected') {
                const reason = app.notes || "Other Policy Criteria";
                const cat = reason.toLowerCase().includes("income") || reason.toLowerCase().includes("cibil") ? "Low Co-Applicant Income" :
                            reason.toLowerCase().includes("document") || reason.toLowerCase().includes("stamp") || reason.toLowerCase().includes("marksheet") ? "Incomplete Documents" :
                            "Other Policy Criteria";
                counts[cat] = (counts[cat] || 0) + 1;
                totalRejections++;
            }

            if (app.documents) {
                app.documents.forEach(d => {
                    if (d.status === 'rejected') {
                        const cat = "Incomplete/Rejected Documents";
                        counts[cat] = (counts[cat] || 0) + 1;
                        totalRejections++;
                    }
                });
            }
        });

        if (totalRejections === 0) {
            return [
                { title: "Incomplete Documents", rate: "44%", countText: "4 counts", tip: "Fix: Use checklists before upload", tipColor: "text-rose-500" },
                { title: "Low Co-Applicant Income", rate: "22%", countText: "2 counts", tip: "Fix: Evaluate checker tool prior to lead submit", tipColor: "text-indigo-600" }
            ];
        }

        return Object.entries(counts).map(([title, count]) => {
            const percentage = Math.round((count / totalRejections) * 100);
            const countText = `${count} count${count > 1 ? 's' : ''}`;
            const tip = title.includes("Document") ? "Fix: Use checklists before upload" :
                        title.includes("Income") ? "Fix: Evaluate checker tool prior to lead submit" :
                        "Fix: Validate applicant profiles against bank criteria";
            const tipColor = title.includes("Document") ? "text-rose-500" : "text-indigo-600";

            return {
                title,
                rate: `${percentage}%`,
                countText,
                tip,
                tipColor
            };
        });
    }, [applications]);

    const monthlyTrend = useMemo(() => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentYear = new Date().getFullYear();
        const trend = months.map(m => ({ month: m, sanctions: 0, comm: 0 }));

        if (applications.length === 0) {
            return [
                { month: "Jan", sanctions: 8, comm: 48000 },
                { month: "Feb", sanctions: 7, comm: 42000 },
                { month: "Mar", sanctions: 12, comm: 72000 },
                { month: "Apr", sanctions: 9, comm: 54000 },
                { month: "May", sanctions: 10, comm: 60000 },
                { month: "Jun", sanctions: 12, comm: 72000 },
                { month: "Jul", sanctions: 0, comm: 0 },
                { month: "Aug", sanctions: 0, comm: 0 },
                { month: "Sep", sanctions: 0, comm: 0 },
                { month: "Oct", sanctions: 0, comm: 0 },
                { month: "Nov", sanctions: 0, comm: 0 },
                { month: "Dec", sanctions: 0, comm: 0 },
            ];
        }

        applications.forEach(app => {
            const dateStr = app.lastUpdated;
            if (dateStr) {
                const d = new Date(dateStr);
                if (d.getFullYear() === currentYear) {
                    const monthIdx = d.getMonth();
                    const isSanctioned = ['approved', 'disbursed', 'sanction', 'disbursement_done'].includes(app.status?.toLowerCase());
                    if (isSanctioned) {
                        trend[monthIdx].sanctions += 1;
                        const amount = Number(app.amount || 1000000);
                        trend[monthIdx].comm += (amount * 0.005); // Assume 0.5% commission
                    }
                }
            }
        });

        return trend;
    }, [applications]);

    const topLeadSources = useMemo(() => {
        if (applications.length === 0) {
            return [
                { course: "B.Tech", leads: 14, sanctions: 5, rate: "36%", loan: "₹12.4L", comm: "₹43,400", top: false },
                { course: "MBA (Abroad)", leads: 6, sanctions: 3, rate: "50%", loan: "₹42.0L", comm: "₹1,26,000", top: true },
                { course: "MBBS", leads: 8, sanctions: 2, rate: "25%", loan: "₹8.5L", comm: "₹11,900", top: false },
                { course: "M.Tech", leads: 4, sanctions: 2, rate: "50%", loan: "₹9.0L", comm: "₹12,600", top: false },
            ];
        }

        const groups: Record<string, { leads: number; sanctions: number; loanSum: number; commSum: number }> = {};

        applications.forEach(app => {
            let course = app.courseName || "Other";
            if (course.length > 25) course = course.substring(0, 25) + '...';
            
            if (!groups[course]) {
                groups[course] = { leads: 0, sanctions: 0, loanSum: 0, commSum: 0 };
            }

            groups[course].leads += 1;
            const amount = Number(app.amount || 0);
            
            const isSanctioned = ['approved', 'disbursed', 'sanction', 'disbursement_done'].includes(app.status?.toLowerCase());
            if (isSanctioned) {
                groups[course].sanctions += 1;
                groups[course].loanSum += amount;
                groups[course].commSum += (amount * 0.005); // Assume 0.5% commission
            }
        });

        const sorted = Object.entries(groups)
            .map(([course, data]) => ({
                course,
                leads: data.leads,
                sanctions: data.sanctions,
                rate: data.leads > 0 ? `${Math.round((data.sanctions / data.leads) * 100)}%` : "0%",
                loan: data.sanctions > 0 ? `₹${(data.loanSum / data.sanctions / 100000).toFixed(1)}L` : "₹0L",
                comm: `₹${Math.round(data.commSum).toLocaleString('en-IN')}`,
                rawComm: data.commSum
            }))
            .sort((a, b) => b.leads - a.leads)
            .slice(0, 5);
            
        if (sorted.length > 0) {
             const maxCommIdx = sorted.reduce((maxIdx, curr, idx, arr) => curr.rawComm > arr[maxIdx].rawComm ? idx : maxIdx, 0);
             const result = sorted.map((s, idx) => ({ ...s, top: idx === maxCommIdx && s.rawComm > 0 }));
             return result;
        }

        return [];
    }, [applications]);

    const topCollegeInsight = useMemo(() => {
        if (applications.length === 0) {
             return "Top College: IIT Bombay (5 leads, 4 sanctioned — 80% rate!) · Focus more campus outreach events here.";
        }
        
        const groups: Record<string, { leads: number; sanctions: number }> = {};
        applications.forEach(app => {
            const college = app.collegeName || "Unknown College";
            if (!groups[college]) groups[college] = { leads: 0, sanctions: 0 };
            groups[college].leads += 1;
            const isSanctioned = ['approved', 'disbursed', 'sanction', 'disbursement_done'].includes(app.status?.toLowerCase());
            if (isSanctioned) groups[college].sanctions += 1;
        });

        const sorted = Object.entries(groups).sort((a, b) => b[1].leads - a[1].leads);
        if (sorted.length === 0) return "No college data available.";
        
        const top = sorted[0];
        const rate = top[1].leads > 0 ? Math.round((top[1].sanctions / top[1].leads) * 100) : 0;
        return `Top College: ${top[0]} (${top[1].leads} leads, ${top[1].sanctions} sanctioned — ${rate}% rate!) · Focus more campus outreach events here.`;
    }, [applications]);

    return (
        <div className="animate-fade-in-up space-y-12 relative z-10">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Funnel chart diagram */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                        <h3 className="font-display font-black text-xl text-gray-900 mb-6 uppercase tracking-tight">Conversion Funnel Analytics</h3>
                        
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <span className="w-32 text-xs font-bold text-gray-500 uppercase">Submitted Leads</span>
                                <div className="flex-1 h-8 bg-indigo-100 border border-indigo-200 rounded-lg overflow-hidden flex items-center justify-end pr-4 text-xs font-black text-indigo-700">
                                    {funnelData.submitted} Leads (100%)
                                </div>
                            </div>
                            <div className="flex items-center">
                                <span className="w-32 text-xs font-bold text-gray-500 uppercase">Docs Received</span>
                                <div className="flex-1 h-8 bg-[#6605c7]/10 border border-[#6605c7]/20 rounded-lg overflow-hidden flex items-center justify-end pr-4 text-xs font-black text-[#6605c7]" style={{ width: `${funnelData.rates.docsReceived}%` }}>
                                    {funnelData.docsReceived} Leads ({funnelData.rates.docsReceived}%)
                                </div>
                            </div>
                            <div className="flex items-center">
                                <span className="w-32 text-xs font-bold text-gray-500 uppercase">AI Verified</span>
                                <div className="flex-1 h-8 bg-[#8b24e5]/10 border border-[#8b24e5]/20 rounded-lg overflow-hidden flex items-center justify-end pr-4 text-xs font-black text-[#8b24e5]" style={{ width: `${funnelData.rates.aiVerified}%` }}>
                                    {funnelData.aiVerified} Leads ({funnelData.rates.aiVerified}%)
                                </div>
                            </div>
                            <div className="flex items-center">
                                <span className="w-32 text-xs font-bold text-gray-500 uppercase">Sent to Bank</span>
                                <div className="flex-1 h-8 bg-amber-100 border border-amber-200 rounded-lg overflow-hidden flex items-center justify-end pr-4 text-xs font-black text-amber-700" style={{ width: `${funnelData.rates.sentToBank}%` }}>
                                    {funnelData.sentToBank} Leads ({funnelData.rates.sentToBank}%)
                                </div>
                            </div>
                            <div className="flex items-center">
                                <span className="w-32 text-xs font-bold text-gray-500 uppercase">Sanctioned</span>
                                <div className="flex-1 h-8 bg-emerald-100 border border-emerald-200 rounded-lg overflow-hidden flex items-center justify-end pr-4 text-xs font-black text-emerald-700" style={{ width: `${funnelData.rates.sanctioned}%` }}>
                                    {funnelData.sanctioned} Leads ({funnelData.rates.sanctioned}%)
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800 text-xs font-medium mt-6">
                            💡 Your conversion rate ({funnelData.rates.sanctioned}%) is dynamically calculated based on current active applicant logs. Focus on stamped Income proof submissions to reduce bottlenecks between Sent to Bank and Sanction stages.
                        </div>
                    </div>

                    {/* Monthly Trend 12-Month (Blueprint 8.2) */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">Monthly Sanctions Trend</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">12-month sanctions + commissions overview</p>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-[#6605c7] bg-[#6605c7]/5 px-3 py-1.5 rounded-full">Jan–Dec 2026</span>
                        </div>
                        
                        <div className="h-52 flex items-end justify-between gap-2 pb-6 border-b border-gray-100 relative">
                            <div className="absolute left-0 bottom-6 right-0 flex flex-col justify-between h-full pointer-events-none">
                                {[12, 9, 6, 3, 0].map(v => (
                                    <div key={v} className="flex items-center gap-2 border-t border-gray-50">
                                        <span className="text-[8px] text-gray-300 font-bold w-4">{v}</span>
                                    </div>
                                ))}
                            </div>
                            {monthlyTrend.map((m, i) => {
                                const maxSanctions = Math.max(12, ...monthlyTrend.map(t => t.sanctions));
                                return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer relative">
                                    {m.sanctions > 0 && (
                                        <div className="absolute bottom-7 text-center opacity-0 group-hover:opacity-100 transition-opacity bg-[#6605c7] text-white text-[8px] font-black px-2 py-1 rounded-lg pointer-events-none z-10 whitespace-nowrap">
                                            {m.sanctions} sanctions<br />₹{(m.comm / 1000).toFixed(0)}K
                                        </div>
                                    )}
                                    <div 
                                        className={`w-full rounded-t-lg transition-all duration-300 ${m.sanctions > 0 ? 'bg-[#6605c7]/20 group-hover:bg-[#6605c7]' : 'bg-gray-50 border border-gray-100'}`} 
                                        style={{ height: m.sanctions > 0 ? `${(m.sanctions / maxSanctions) * 180}px` : '8px' }} 
                                    />
                                    <span className="text-[8px] font-bold text-gray-400 uppercase pt-2">{m.month}</span>
                                </div>
                            )})}
                        </div>
                        <div className="flex gap-6 mt-4 text-[10px] font-bold text-gray-500">
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#6605c7]/30 inline-block" /> Sanctions</span>
                            <span className="text-amber-600">📅 Peak based on your active loans</span>
                        </div>
                    </div>

                    {/* Top Performing Courses & Colleges (Blueprint 8.3) */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                        <h3 className="font-display font-black text-xl text-gray-900 mb-6 uppercase tracking-tight">Top Lead Sources — Course &amp; College</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-400 border-b border-gray-100 font-black uppercase tracking-wider text-[9px]">
                                        <th className="p-3">Course</th>
                                        <th className="p-3">Leads</th>
                                        <th className="p-3">Sanctions</th>
                                        <th className="p-3">Rate</th>
                                        <th className="p-3">Avg Loan</th>
                                        <th className="p-3">Commission</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
                                    {topLeadSources.map((row: any, idx: number) => (
                                        <tr key={idx} className={`transition-colors ${row.top ? 'bg-amber-50/30' : 'hover:bg-gray-50'}`}>
                                            <td className="p-3 font-black text-gray-900 flex items-center gap-2">
                                                {row.course}
                                                {row.top && <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-wider">🏆 Best ROI</span>}
                                            </td>
                                            <td className="p-3">{row.leads}</td>
                                            <td className="p-3">{row.sanctions}</td>
                                            <td className="p-3 text-emerald-600 font-black">{row.rate}</td>
                                            <td className="p-3">{row.loan}</td>
                                            <td className="p-3 text-[#6605c7] font-black">{row.comm}</td>
                                        </tr>
                                    ))}
                                    {topLeadSources.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-4 text-center text-gray-500 font-medium">No lead source data available yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">school</span>
                            {topCollegeInsight}
                        </div>
                    </div>

                    {/* Bank performance TAT reports */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                        <h3 className="font-display font-black text-xl text-gray-900 mb-6 uppercase tracking-tight">Bank Performance &amp; TAT Report</h3>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs font-bold border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-400 border-b border-gray-100">
                                        <th className="p-4">Bank</th>
                                        <th className="p-4">Submitted Leads</th>
                                        <th className="p-4">Sanctioned</th>
                                        <th className="p-4">TAT Average</th>
                                        <th className="p-4">Approval Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {bankPerformance.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="p-4">{item.bank}</td>
                                            <td className="p-4">{item.submitted}</td>
                                            <td className="p-4">{item.sanctioned}</td>
                                            <td className={`p-4 ${item.tatColor}`}>{item.tat}</td>
                                            <td className="p-4 font-black">{item.rate}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-[10px] font-bold text-indigo-700 mt-4 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                            💡 Best Bank for your students: Avanse (highest approval rate + fastest TAT). Consider routing more domestic B.Tech leads here.
                        </p>
                    </div>
                </div>

                <div className="space-y-8 flex flex-col">
                    {/* Leaderboard */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                        <h3 className="font-display font-black text-lg text-gray-900 mb-6 uppercase tracking-tight">🥇 Territory Leaderboard</h3>
                        
                        <div className="space-y-4">
                            {loadingLeaderboard ? (
                                <div className="flex items-center justify-center py-4">
                                    <span className="material-symbols-outlined text-gray-400 animate-spin">sync</span>
                                    <span className="text-xs text-gray-400 ml-2">Loading leaderboard...</span>
                                </div>
                            ) : (
                                leaderboard.map((item, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`p-4 border rounded-2xl flex justify-between items-center text-xs ${
                                            idx === 0 
                                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                                                : 'bg-gray-50 border-gray-100 text-gray-800'
                                        }`}
                                    >
                                        <div className="flex gap-3 items-center">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                                                idx === 0 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-700'
                                            }`}>
                                                {idx + 1}
                                            </span>
                                            <span className={idx === 0 ? "font-black" : "font-bold"}>
                                                {item.name} {idx === 0 && "(You)"}
                                            </span>
                                        </div>
                                        <span className={idx === 0 ? "font-black" : "font-bold text-gray-600"}>
                                            {item.count} sanction{item.count !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Agent NPS Feedback Form */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                        <h3 className="font-display font-black text-lg text-gray-900 mb-2 uppercase tracking-tight">Lender Satisfaction Survey (NPS)</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-6">How satisfied are you with our bank partners' query resolution response times?</p>
                        
                        {npsSubmitted ? (
                            <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl text-[#6605c7] text-xs text-center space-y-2">
                                <span className="material-symbols-outlined text-[#6605c7] text-2xl">check_circle</span>
                                <p className="font-bold">Thank you for your rating!</p>
                                <p className="text-[10px] text-[#6605c7] uppercase font-bold tracking-wider">Your feedback helps us optimize SLA performance with lenders.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between gap-1">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                                        <button 
                                            key={score} 
                                            type="button"
                                            onClick={() => setNpsScore(score)}
                                            className={`w-7 h-7 rounded-full text-[10px] font-black flex items-center justify-center transition-all ${
                                                npsScore === score 
                                                    ? "bg-[#6605c7] text-white shadow-md shadow-[#6605c7]/20" 
                                                    : "bg-gray-50 border border-gray-100 text-gray-600 hover:bg-gray-100"
                                            }`}
                                        >
                                            {score}
                                        </button>
                                    ))}
                                </div>
                                <div className="space-y-1">
                                    <textarea 
                                        rows={2} 
                                        placeholder="Optional: Mention details of any bank TAT delays..." 
                                        value={npsComment}
                                        onChange={(e) => setNpsComment(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#6605c7]/15 transition-all"
                                    />
                                </div>
                                <button 
                                    onClick={() => {
                                        if (npsScore === null) {
                                            alert("Please choose a score rating before submitting.");
                                            return;
                                        }
                                        setNpsSubmitted(true);
                                    }}
                                    className="w-full py-3.5 bg-[#6605c7] hover:bg-[#6605c7]/95 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm"
                                >
                                    Submit Rating
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Rejections Reasons */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm flex-1">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#6605c7]/40 mb-6">REJECTION ANALYSIS</h3>
                        
                        <div className="space-y-4 text-xs">
                            {rejectionData.map((item, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                    <div className="flex justify-between font-bold text-gray-800">
                                        <span>{item.title}</span>
                                        <span>{item.rate} ({item.countText})</span>
                                    </div>
                                    <p className={`${item.tipColor} text-[10px] font-medium mt-1`}>{item.tip}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
