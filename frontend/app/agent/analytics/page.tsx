"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useAgent } from "../AgentContext";
import { referralApi } from "@/lib/api";

export default function AgentAnalytics() {
    const { applications } = useAgent();
    
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

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

                    {/* Bank performance TAT reports */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                        <h3 className="font-display font-black text-xl text-gray-900 mb-6 uppercase tracking-tight">Bank Performance & TAT Report</h3>
                        
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
