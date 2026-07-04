"use client";

import React, { useState, useEffect } from "react";
import { useAgent } from "../AgentContext";
import { agentApi } from "@/lib/api";

export default function AgentQrCode() {
    const { showToast } = useAgent();
    const [loading, setLoading] = useState(true);
    const [qrData, setQrData] = useState<any>(null);
    const [analytics, setAnalytics] = useState<any>(null);

    const loadQrDetails = async () => {
        setLoading(true);
        try {
            const [qrRes, analyticsRes] = await Promise.all([
                agentApi.getQrCode(),
                agentApi.getQrScanAnalytics()
            ]);

            if (qrRes?.success && qrRes.data) {
                setQrData(qrRes.data);
            }
            if (analyticsRes?.success && analyticsRes.data) {
                setAnalytics(analyticsRes.data);
            }
        } catch (e) {
            console.error("Failed to load QR code analytics", e);
            showToast("Failed to fetch live QR metrics, using fallback", "warning");
            // Fallback mock
            setQrData({
                qrImageUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=http://localhost:3000/student/signup?ref=agent-test",
                referralLink: "http://localhost:3000/student/signup?ref=agent-test",
                totalScans: 28
            });
            setAnalytics({
                totalScans: 28,
                recentScans: [
                    { date: "2026-06-28", count: 2 },
                    { date: "2026-06-29", count: 4 },
                    { date: "2026-06-30", count: 5 },
                    { date: "2026-07-01", count: 3 },
                    { date: "2026-07-02", count: 6 },
                    { date: "2026-07-03", count: 8 }
                ],
                conversionCount: 4
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQrDetails();
    }, []);

    const copyLink = () => {
        if (!qrData?.referralLink) return;
        navigator.clipboard.writeText(qrData.referralLink);
        showToast("Referral signup link copied to clipboard!", "success");
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse p-8">
                <div className="h-40 bg-gray-150 rounded-[2.5rem]" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="h-96 bg-gray-150 rounded-[2.5rem]" />
                    <div className="h-96 bg-gray-150 rounded-[2.5rem]" />
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up space-y-12 relative z-10 text-left">
            
            {/* Header info */}
            <section className="p-8 rounded-[2.5rem] bg-white border border-[#6605c7]/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 font-display">QR Code Lead Capture</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Instant referrals via scanner placement at campuses & office fronts</p>
                </div>
                <button onClick={loadQrDetails} className="px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase text-gray-500 hover:bg-gray-100 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">sync</span> Sync Stats
                </button>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* QR Display Card */}
                <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm flex flex-col items-center justify-between text-center min-h-[460px]">
                    <div className="space-y-4 w-full">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#6605c7]/40 block">Your Scan Badge</span>
                        <div className="w-56 h-56 mx-auto p-4 border border-gray-100 rounded-[2rem] bg-white shadow-sm flex items-center justify-center relative overflow-hidden group">
                            {qrData?.qrImageUrl && (
                                <img src={qrData.qrImageUrl} alt="QR Code" className="w-full h-full object-contain" />
                            )}
                        </div>
                        <p className="text-xs text-gray-500 max-w-xs mx-auto">Students scan to sign up directly as referrals under your DSA account.</p>
                    </div>

                    <div className="w-full space-y-3 pt-6 border-t border-gray-50">
                        <button onClick={copyLink} className="w-full py-3.5 bg-indigo-50 hover:bg-indigo-100 text-[#6605c7] text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-sm">content_copy</span> Copy Signup Link
                        </button>
                        <a href={qrData?.qrImageUrl} download="Vidyaloans_Referral_QR.png" target="_blank" rel="noreferrer" className="w-full py-3.5 bg-[#6605c7] hover:bg-[#6605c7]/95 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm">
                            <span className="material-symbols-outlined text-sm">download</span> Download QR Badge
                        </a>
                    </div>
                </div>

                {/* Scan Analytics / Logs */}
                <div className="lg:col-span-2 bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#6605c7]/40 block mb-6">Scan Performance Insights</span>
                        
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl text-left space-y-1">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Total Scans</span>
                                <div className="text-2xl font-black text-gray-900 font-display">{analytics?.totalScans || 0}</div>
                            </div>
                            <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl text-left space-y-1">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Conversions</span>
                                <div className="text-2xl font-black text-emerald-600 font-display">{analytics?.conversionCount || 0}</div>
                            </div>
                            <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl text-left space-y-1">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Conversion Rate</span>
                                <div className="text-2xl font-black text-[#6605c7] font-display">
                                    {analytics?.totalScans ? Math.round((analytics.conversionCount / analytics.totalScans) * 100) : 0}%
                                </div>
                            </div>
                        </div>

                        {/* Recent Scan Logs Chart list */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-gray-900 uppercase tracking-wide">Daily Scan Traffic</h4>
                            <div className="space-y-2">
                                {analytics?.recentScans?.map((scan: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-xs py-2 border-b border-gray-50">
                                        <span className="text-gray-500 font-bold">{scan.date}</span>
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden flex justify-end">
                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (scan.count / 10) * 100)}%` }} />
                                            </div>
                                            <span className="font-mono font-black text-gray-700 w-6 text-right">{scan.count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-[#6605c7] text-[10px] font-bold uppercase tracking-wider text-center mt-6">
                        💡 Tip: Place physical printouts of this QR code at co-working spaces, study-abroad counseling desks, and test-prep centers.
                    </div>
                </div>
            </div>
        </div>
    );
}
