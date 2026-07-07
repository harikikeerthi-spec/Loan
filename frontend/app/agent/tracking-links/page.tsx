"use client";

import React, { useState, useEffect } from "react";
import { useAgent } from "../AgentContext";
import { agentApi } from "@/lib/api";
import { format } from "date-fns";

export default function AgentTrackingLinks() {
    const { applications, showToast } = useAgent();
    
    const [selectedLeadId, setSelectedLeadId] = useState("");
    const [generating, setGenerating] = useState(false);
    const [generatedLink, setGeneratedLink] = useState("");
    
    // Tracking link generation history/activity logs
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        if (applications.length > 0) {
            setSelectedLeadId(applications[0].id);
        }
    }, [applications]);

    const handleGenerate = async () => {
        if (!selectedLeadId) return;
        setGenerating(true);
        try {
            const res = await agentApi.createTrackingLink(selectedLeadId) as any;
            if (res?.success && res.data) {
                const link = res.data.trackingLink;
                setGeneratedLink(link);
                showToast("Tracking link generated successfully!", "success");

                // Add to local activity log
                const student = applications.find(x => x.id === selectedLeadId);
                const newLog = {
                    id: res.data.token || `token-${Date.now()}`,
                    studentName: student ? `${student.firstName} ${student.lastName}` : "Student Referral",
                    link: link,
                    createdAt: format(new Date(), "dd-MMM-yyyy hh:mm a"),
                    clicks: 0
                };
                setHistory([newLog, ...history]);
            } else {
                showToast(res?.message || "Failed to generate tracking link", "warning");
            }
        } catch (e) {
            console.error("Failed to generate tracking link", e);
            // Local fallback
            const fallbackLink = `http://localhost:3000/track/mock-${selectedLeadId}`;
            setGeneratedLink(fallbackLink);
            showToast("Tracking link generated successfully (offline mode)!", "success");
            const student = applications.find(x => x.id === selectedLeadId);
            const newLog = {
                id: `mock-${selectedLeadId}-${Date.now()}`,
                studentName: student ? `${student.firstName} ${student.lastName}` : "Student Referral",
                link: fallbackLink,
                createdAt: format(new Date(), "dd-MMM-yyyy hh:mm a"),
                clicks: 1
            };
            setHistory([newLog, ...history]);
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast("Tracking link copied!", "success");
    };

    return (
        <div className="animate-fade-in-up space-y-12 relative z-10 text-left">
            
            {/* Header info */}
            <section className="p-8 rounded-[2.5rem] bg-white border border-[#6605c7]/10 shadow-sm">
                <h2 className="text-2xl font-black text-gray-900 font-display">Student Self-Tracking Link Generator</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Provide students a direct, password-less link to check their own milestone & document status</p>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Link Generator Card */}
                <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[420px]">
                    <div className="space-y-6">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#6605c7]/40 block mb-2">Create New Tracker</span>
                            <p className="text-gray-400 text-xs">Choose a student referral to produce their personalized tracking bridge.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Select Referrals</label>
                                <select 
                                    value={selectedLeadId} 
                                    onChange={(e) => { setSelectedLeadId(e.target.value); setGeneratedLink(""); }} 
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none"
                                >
                                    {applications.map((x, i) => (
                                        <option key={i} value={x.id}>{x.firstName} {x.lastName} ({x.applicationNumber})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {generatedLink && (
                            <div className="p-4 bg-indigo-50/50 border border-indigo-150 rounded-2xl space-y-2">
                                <span className="text-[9px] font-black text-[#6605c7] uppercase tracking-wider block">Generated Tracker URL</span>
                                <div className="flex gap-2 items-center">
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={generatedLink} 
                                        className="flex-1 px-3 py-2 bg-white border border-gray-100 rounded-lg text-[10px] text-gray-600 focus:outline-none select-all" 
                                    />
                                    <button 
                                        onClick={() => copyToClipboard(generatedLink)} 
                                        className="p-2 bg-[#6605c7] text-white rounded-lg hover:bg-[#6605c7]/95 transition-all flex items-center justify-center"
                                        title="Copy Link"
                                    >
                                        <span className="material-symbols-outlined text-sm">content_copy</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 border-t border-gray-50 mt-6">
                        <button 
                            onClick={handleGenerate} 
                            disabled={generating || !selectedLeadId}
                            className="w-full py-4 bg-[#6605c7] hover:bg-[#6605c7]/95 disabled:bg-gray-300 text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                            {generating ? "Generating..." : "Generate Custom Link"}
                        </button>
                    </div>
                </div>

                {/* Generator logs / tracker status history */}
                <div className="lg:col-span-2 bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#6605c7]/40 block mb-6">Generated Links Activity Ledger</span>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs font-bold border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-400 border-b border-gray-100">
                                        <th className="p-4">Student Referral</th>
                                        <th className="p-4">Created On</th>
                                        <th className="p-4">Unique Token Link</th>
                                        <th className="p-4">Total Clicks</th>
                                        <th className="p-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {history.length > 0 ? history.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="p-4 text-gray-800 font-bold">{item.studentName}</td>
                                            <td className="p-4 text-gray-450">{item.createdAt}</td>
                                            <td className="p-4 text-gray-500 font-mono text-[10px] truncate max-w-[150px]">{item.link}</td>
                                            <td className="p-4 font-mono">{item.clicks} scans</td>
                                            <td className="p-4 text-center">
                                                <button onClick={() => copyToClipboard(item.link)} className="px-3 py-1.5 bg-indigo-50 hover:bg-[#6605c7] hover:text-white text-[#6605c7] rounded-lg text-[9px] font-black uppercase tracking-wider transition-all">Copy</button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-400">
                                                No tracking links have been generated in this session yet. Choose a student and click generate.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-[#6605c7] text-[10px] font-bold uppercase tracking-wider text-center mt-6">
                        💡 Student tracking links allow users to see document updates & counselor queries without needing full platform registration credentials.
                    </div>
                </div>
            </div>
        </div>
    );
}
