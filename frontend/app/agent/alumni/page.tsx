"use client";

import React, { useState, useEffect } from "react";
import { useAgent } from "../AgentContext";
import { agentApi } from "@/lib/api";

export default function AgentAlumniReferrals() {
    const { showToast } = useAgent();
    const [loading, setLoading] = useState(true);
    const [alumniList, setAlumniList] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);

    // Link generator state
    const [selectedAlumniId, setSelectedAlumniId] = useState("");
    const [generating, setGenerating] = useState(false);
    const [generatedLink, setGeneratedLink] = useState("");
    const [customMessage, setCustomMessage] = useState("");

    const loadData = async () => {
        setLoading(true);
        try {
            const [alumniRes, analyticsRes] = await Promise.all([
                agentApi.getAlumni(),
                agentApi.getReferralAnalytics()
            ]);

            if (alumniRes?.success && alumniRes.data) {
                setAlumniList(alumniRes.data);
                if (alumniRes.data.length > 0) {
                    setSelectedAlumniId(alumniRes.data[0].id);
                }
            }
            if (analyticsRes?.success && analyticsRes.data) {
                setAnalytics(analyticsRes.data);
            }
        } catch (e) {
            console.error("Failed to load alumni metrics", e);
            showToast("Failed to fetch live alumni metrics, using fallback", "warning");
            // Fallback mocks
            const mockAlumni = [
                { id: "al-1", name: "Sanya Malhotra", university: "Boston University", course: "MS in Computer Science", gradYear: 2024, status: "ACTIVE" },
                { id: "al-2", name: "Vikram Seth", university: "Stanford University", course: "MBA", gradYear: 2023, status: "ACTIVE" },
                { id: "al-3", name: "Rohan Mehra", university: "University of Toronto", course: "MEng in Electrical Eng", gradYear: 2025, status: "PENDING" }
            ];
            setAlumniList(mockAlumni);
            setSelectedAlumniId(mockAlumni[0].id);
            setAnalytics({
                totalReferrals: 14,
                successfulSanctions: 8,
                conversionRate: 57
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Generate link helper
    const handleGenerateLink = async () => {
        if (!selectedAlumniId) return;
        setGenerating(true);
        try {
            const res = await agentApi.getAlumniReferralLink(selectedAlumniId) as any;
            if (res?.success && res.data) {
                const link = res.data.referralLink;
                setGeneratedLink(link);
                updateMessageTemplate(selectedAlumniId, link);
                showToast("Alumni referral link generated!", "success");
            }
        } catch (e) {
            console.error("Failed to generate alumni link", e);
            const fallbackLink = `http://localhost:3000/student/signup?ref=alumni-ref-${selectedAlumniId}`;
            setGeneratedLink(fallbackLink);
            updateMessageTemplate(selectedAlumniId, fallbackLink);
            showToast("Referral link generated offline!", "success");
        } finally {
            setGenerating(false);
        }
    };

    const updateMessageTemplate = (alumniId: string, link: string) => {
        const alumni = alumniList.find(x => x.id === alumniId);
        const name = alumni ? alumni.name : "Alumnus";
        const uni = alumni ? alumni.university : "your university";
        setCustomMessage(`Hi ${name}! Hope you are doing great. VidyaLoans is running an exclusive scholarship referral program for alumni of ${uni}. If any of your juniors or friends are planning their study abroad education financing this intake, they can apply through this link to get an additional ₹10,000 processing waiver: ${link}`);
    };

    // Watch selectedAlumniId changes to update message if link exists
    useEffect(() => {
        if (selectedAlumniId && generatedLink) {
            const link = `http://localhost:3000/student/signup?ref=alumni-ref-${selectedAlumniId}`;
            setGeneratedLink(link);
            updateMessageTemplate(selectedAlumniId, link);
        }
    }, [selectedAlumniId]);

    const copyLink = () => {
        if (!generatedLink) return;
        navigator.clipboard.writeText(generatedLink);
        showToast("Referral link copied!", "success");
    };

    const copyMessage = () => {
        if (!customMessage) return;
        navigator.clipboard.writeText(customMessage);
        showToast("Outreach template copied!", "success");
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
            {/* Header banner */}
            <section className="p-8 rounded-[2.5rem] bg-white border border-[#6605c7]/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 font-display">Alumni Referral Portal</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Leverage university alumni networks to acquire qualified study abroad student leads</p>
                </div>
                <button onClick={loadData} className="px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase text-gray-500 hover:bg-gray-100 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">sync</span> Sync Directory
                </button>
            </section>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-6 bg-white border border-[#6605c7]/10 rounded-[2rem] shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Total Alumni Referrals</span>
                    <div className="text-3xl font-black text-gray-900 font-display mt-2">{analytics?.totalReferrals || 0}</div>
                </div>
                <div className="p-6 bg-white border border-[#6605c7]/10 rounded-[2rem] shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Successful Sanctions</span>
                    <div className="text-3xl font-black text-emerald-600 font-display mt-2">{analytics?.successfulSanctions || 0}</div>
                </div>
                <div className="p-6 bg-white border border-[#6605c7]/10 rounded-[2rem] shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Network Conversion Rate</span>
                    <div className="text-3xl font-black text-[#6605c7] font-display mt-2">{analytics?.conversionRate || 0}%</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Link Generator and outreach composer */}
                <div className="lg:col-span-1 bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm space-y-6 flex flex-col justify-between min-h-[460px]">
                    <div className="space-y-6">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#6605c7]/40 block mb-2">Campaign Console</span>
                            <p className="text-gray-400 text-xs">Generate outreach tags to share with prominent active alumni helpers.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Select Alumnus</label>
                                <select 
                                    value={selectedAlumniId} 
                                    onChange={(e) => { setSelectedAlumniId(e.target.value); setGeneratedLink(""); }} 
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none"
                                >
                                    {alumniList.map((al, idx) => (
                                        <option key={idx} value={al.id}>{al.name} ({al.university})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {generatedLink && (
                            <div className="space-y-4">
                                <div className="p-4 bg-indigo-50/50 border border-indigo-150 rounded-2xl space-y-2">
                                    <span className="text-[9px] font-black text-[#6605c7] uppercase tracking-wider block">Outreach Referral URL</span>
                                    <div className="flex gap-2 items-center">
                                        <input 
                                            type="text" 
                                            readOnly 
                                            value={generatedLink} 
                                            className="flex-1 px-3 py-2 bg-white border border-gray-100 rounded-lg text-[10px] text-gray-600 focus:outline-none select-all" 
                                        />
                                        <button onClick={copyLink} className="p-2 bg-[#6605c7] text-white rounded-lg hover:bg-[#6605c7]/95 transition-all">
                                            <span className="material-symbols-outlined text-sm">content_copy</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1 text-xs">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Message Outreach Template</label>
                                    <textarea 
                                        rows={5} 
                                        value={customMessage} 
                                        onChange={(e) => setCustomMessage(e.target.value)} 
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-800 focus:outline-none focus:bg-white transition-all"
                                    />
                                    <button onClick={copyMessage} className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-sm">content_copy</span> Copy Outreach Message
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {!generatedLink && (
                        <div className="pt-6 border-t border-gray-50 mt-6">
                            <button 
                                onClick={handleGenerateLink} 
                                disabled={generating || !selectedAlumniId}
                                className="w-full py-4 bg-[#6605c7] hover:bg-[#6605c7]/95 disabled:bg-gray-300 text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                {generating ? "Generating..." : "Generate Referral Link"}
                            </button>
                        </div>
                    )}
                </div>

                {/* Alumni Ledger List Table */}
                <div className="lg:col-span-2 bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#6605c7]/40 block mb-6">Alumni Network Directory</span>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs font-bold border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-400 border-b border-gray-100">
                                        <th className="p-4">Alumnus Name</th>
                                        <th className="p-4">University Name</th>
                                        <th className="p-4">Academic Course</th>
                                        <th className="p-4">Grad Year</th>
                                        <th className="p-4">Verification</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {alumniList.map((al, idx) => (
                                        <tr key={idx} className="hover:bg-[#6605c7]/5 transition-colors">
                                            <td className="p-4 text-gray-800 font-bold">{al.name}</td>
                                            <td className="p-4">{al.university}</td>
                                            <td className="p-4 text-gray-500 font-normal">{al.course}</td>
                                            <td className="p-4 font-mono">{al.gradYear}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                                    al.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {al.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-[#6605c7] text-[10px] font-bold uppercase tracking-wider text-center mt-6">
                        💡 DSA Referral Strategy: Share university specific waivers with alumni to boost co-applicant file trust signals during verification checkups.
                    </div>
                </div>
            </div>
        </div>
    );
}
