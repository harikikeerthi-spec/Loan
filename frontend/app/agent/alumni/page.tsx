"use client";

import React, { useState } from "react";
import { useAgent } from "../AgentContext";

interface Alumnus {
    id: string;
    name: string;
    disbursed: string;
    bank: string;
    amount: string;
    referrals: number;
    referralsText: string;
    siblings: string;
    slug: string;
}

export default function AgentAlumniReferrals() {
    const { showToast } = useAgent();

    // 17.1 Alumni List (Past Disbursed Students)
    const initialAlumni: Alumnus[] = [
        {
            id: "AL-001",
            name: "Priya Sharma",
            disbursed: "Jan 2025",
            bank: "SBI",
            amount: "₹12L",
            referrals: 2,
            referralsText: "2 leads ✅",
            siblings: "1 sibling",
            slug: "PRIYA"
        },
        {
            id: "AL-002",
            name: "Venu Gopal",
            disbursed: "Mar 2025",
            bank: "HDFC",
            amount: "₹12L",
            referrals: 0,
            referralsText: "0 leads",
            siblings: "—",
            slug: "VENU"
        },
        {
            id: "AL-003",
            name: "Kiran Rao",
            disbursed: "Nov 2024",
            bank: "Avanse",
            amount: "₹8.5L",
            referrals: 1,
            referralsText: "1 lead ✅",
            siblings: "—",
            slug: "KIRAN"
        },
        {
            id: "AL-004",
            name: "Anjali Raju",
            disbursed: "Jun 2025",
            bank: "SBI",
            amount: "₹14L",
            referrals: 0,
            referralsText: "0 leads",
            siblings: "⚠️ Sister graduating",
            slug: "ANJALI"
        }
    ];

    const [alumni] = useState<Alumnus[]>(initialAlumni);
    const [selectedAlumni, setSelectedAlumni] = useState<Alumnus>(initialAlumni[0]);
    const [gradFilter, setGradFilter] = useState<string>("All");
    const [campaignRunning, setCampaignRunning] = useState(false);

    // 17.2 Referral Link Generator (Per Alumni)
    const referralBaseUrl = "https://apply.vidyaloans.com/?ref=VL-AGT-007";
    const getReferralUrl = (slug: string) => `${referralBaseUrl}&alumni=${slug}`;

    const getMessageTemplate = (name: string, slug: string) => {
        return `Hi ${name}! If any of your friends or siblings need an education loan, please share this with them: ${getReferralUrl(slug)} They'll get expert guidance — and you'll get ₹2,000 if they disburse!`;
    };

    const handleCopyLink = (slug: string) => {
        navigator.clipboard.writeText(getReferralUrl(slug));
        showToast("Referral link copied to clipboard!", "success");
    };

    const handleCopyMessage = (name: string, slug: string) => {
        navigator.clipboard.writeText(getMessageTemplate(name, slug));
        showToast("Message outreach template copied!", "success");
    };

    const handleSendWhatsApp = (name: string, slug: string) => {
        const text = encodeURIComponent(getMessageTemplate(name, slug));
        window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
        showToast("Opening WhatsApp Web...", "success");
    };

    // 17.4 Recommended Actions Trigger Simulation
    const triggerAction = (actionTitle: string) => {
        showToast(`Simulation: Action "${actionTitle}" triggered!`, "success");
    };

    const runCampaign = () => {
        setCampaignRunning(true);
        showToast("Preparing referral campaign broadcast...", "info");
        setTimeout(() => {
            setCampaignRunning(false);
            showToast("Referral campaign successfully broadcasted to all 62 alumni!", "success");
        }, 1500);
    };

    // Filtering logic
    const filteredAlumni = alumni.filter(al => {
        if (gradFilter === "All") return true;
        if (gradFilter === "2025") return al.disbursed.includes("2025");
        if (gradFilter === "2024") return al.disbursed.includes("2024");
        return true;
    });

    return (
        <div className="animate-fade-in-up space-y-8 relative z-10 text-left pb-12">
            
            {/* Header Banner */}
            <section className="p-8 rounded-[2.5rem] bg-white border border-[#6605c7]/10 shadow-2xl shadow-[#6605c7]/2 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 font-display tracking-tight">Alumni Referral & Flywheel</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5">Module 17 • Leverage university alumni networks to acquire qualified study abroad student leads</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={runCampaign} 
                        disabled={campaignRunning}
                        className="px-5 py-3 bg-[#6605c7] hover:bg-[#6605c7]/95 disabled:bg-gray-300 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-[#6605c7]/20"
                    >
                        <span className="material-symbols-outlined text-sm">{campaignRunning ? "sync" : "campaign"}</span> 
                        {campaignRunning ? "Sending..." : "Send Referral Campaign to All Alumni"}
                    </button>
                </div>
            </section>

            {/* Grid 1: Analytics & Season Intelligence */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 17.3 Referral Analytics */}
                <div className="lg:col-span-2 p-8 bg-white border border-[#6605c7]/10 rounded-[2.5rem] shadow-2xl shadow-[#6605c7]/2 flex flex-col justify-between space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6605c7]">Performance Suite</span>
                                <h3 className="text-xl font-black font-display tracking-tight mt-0.5 text-gray-900">Referral Analytics</h3>
                            </div>
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider">
                                50% Conversion — Excellent!
                            </span>
                        </div>

                        {/* Analytics Main Counters */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                            <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-center">
                                <span className="text-[9px] font-black text-gray-400 tracking-wider block">Leads Received</span>
                                <div className="text-2xl font-black text-gray-900 mt-1">14</div>
                            </div>
                            <div className="p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl text-center">
                                <span className="text-[9px] font-black text-emerald-600 tracking-wider block">Converted</span>
                                <div className="text-2xl font-black text-emerald-700 mt-1">7</div>
                            </div>
                            <div className="p-4 bg-amber-50/50 border border-amber-100/50 rounded-2xl text-center">
                                <span className="text-[9px] font-black text-amber-600 tracking-wider block">Pending</span>
                                <div className="text-2xl font-black text-amber-700 mt-1">4</div>
                            </div>
                            <div className="p-4 bg-red-50/50 border border-red-100/50 rounded-2xl text-center">
                                <span className="text-[9px] font-black text-red-500 tracking-wider block">Dropped</span>
                                <div className="text-2xl font-black text-red-600 mt-1">3</div>
                            </div>
                        </div>

                        {/* Top Referrer & Commissions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#6605c7]/5 flex items-center justify-center text-[#6605c7]">
                                    <span className="material-symbols-outlined text-lg">star</span>
                                </div>
                                <div>
                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">Top Referrer</span>
                                    <span className="text-xs font-black text-gray-800">Priya Sharma (2 referrals, both sanctioned)</span>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#6605c7]/5 flex items-center justify-center text-[#6605c7]">
                                    <span className="material-symbols-outlined text-lg">payments</span>
                                </div>
                                <div>
                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">Referral Commissions</span>
                                    <span className="text-xs font-black text-gray-800">₹28,000 <span className="text-[10px] font-normal text-gray-400">(included in total commission)</span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 17.4 Admission Season Alerts & Outreach Calendar */}
                <div className="p-8 bg-white border border-[#6605c7]/10 rounded-[2.5rem] shadow-2xl shadow-[#6605c7]/2 space-y-6">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6605c7]">Outreach Intelligence</span>
                        <h3 className="text-xl font-black font-display tracking-tight mt-0.5 text-gray-900 font-display">Admission Season</h3>
                    </div>

                    {/* Upcoming Events */}
                    <div className="space-y-4">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">📅 Territory Calendar Events</span>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <span className="px-2 py-1 rounded bg-[#6605c7]/5 border border-[#6605c7]/10 text-[9px] font-mono font-bold text-[#6605c7] mt-0.5">28-Jun</span>
                                <div className="text-xs">
                                    <p className="font-black text-gray-800 leading-tight">JEE Advanced Results</p>
                                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">Expected surge: +40% leads</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="px-2 py-1 rounded bg-[#6605c7]/5 border border-[#6605c7]/10 text-[9px] font-mono font-bold text-[#6605c7] mt-0.5">05-Jul</span>
                                <div className="text-xs">
                                    <p className="font-black text-gray-800 leading-tight">NEET Results</p>
                                    <p className="text-[10px] text-[#6605c7] font-bold uppercase tracking-wider mt-0.5">Medical loan demand peak</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="px-2 py-1 rounded bg-[#6605c7]/5 border border-[#6605c7]/10 text-[9px] font-mono font-bold text-[#6605c7] mt-0.5">10-Jul</span>
                                <div className="text-xs">
                                    <p className="font-black text-gray-800 leading-tight">BITSAT Results</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="px-2 py-1 rounded bg-[#6605c7]/5 border border-[#6605c7]/10 text-[9px] font-mono font-bold text-[#6605c7] mt-0.5">15-Jul</span>
                                <div className="text-xs">
                                    <p className="font-black text-gray-800 leading-tight">IIT Counselling begins</p>
                                    <p className="text-[10px] text-[#6605c7] font-bold uppercase tracking-wider mt-0.5">High-value abroad leads</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recommended Actions */}
                    <div className="space-y-2 pt-2 border-t border-gray-50">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block mb-2">⚡ Recommended Actions</span>
                        <div className="space-y-2 text-xs">
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                <span className="font-bold text-gray-700">1. Share loan calculator on WhatsApp</span>
                                <button onClick={() => triggerAction("Share Calculator")} className="px-3 py-1 bg-[#6605c7] text-white text-[9px] font-black uppercase rounded-lg hover:scale-102 transition-transform">Share</button>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                <span className="font-bold text-gray-700">2. Print & place QR codes</span>
                                <button onClick={() => triggerAction("Get QR PDF")} className="px-3 py-1 bg-[#6605c7] text-white text-[9px] font-black uppercase rounded-lg hover:scale-102 transition-transform">Get PDF</button>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                <span className="font-bold text-gray-700">3. Contact alumni for JEE/NEET siblings</span>
                                <button onClick={() => triggerAction("Alumni List")} className="px-3 py-1 bg-[#6605c7] text-white text-[9px] font-black uppercase rounded-lg hover:scale-102 transition-transform">Outreach</button>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                <span className="font-bold text-gray-700">4. Request 5 extra document upload slots</span>
                                <button onClick={() => triggerAction("Request Slots")} className="px-3 py-1 bg-[#6605c7] text-white text-[9px] font-black uppercase rounded-lg hover:scale-102 transition-transform">Request</button>
                            </div>
                        </div>
                    </div>

                    {/* Last Year Stats Alert */}
                    <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-[#6605c7] text-[10px] font-bold uppercase tracking-wider text-center">
                        📊 Last Year (June 2025): Your leads jumped 65% in the week after JEE results
                    </div>
                </div>
            </div>

            {/* Grid 2: Alumni Directory & Referral link generator */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 17.1 Alumni List (Past Disbursed Students) */}
                <div className="lg:col-span-2 p-8 bg-white border border-[#6605c7]/10 rounded-[2.5rem] shadow-2xl shadow-[#6605c7]/2 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6605c7]">Past Disbursed Directory</span>
                            <h3 className="text-xl font-black font-display tracking-tight mt-0.5 text-gray-900">My Alumni <span className="text-xs font-normal text-gray-400">(62 total)</span></h3>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black text-gray-400 uppercase">Filter Disbursed:</span>
                            <select 
                                value={gradFilter} 
                                onChange={(e) => setGradFilter(e.target.value)} 
                                className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold text-gray-600 focus:outline-none"
                            >
                                <option value="All">All Years</option>
                                <option value="2025">2025</option>
                                <option value="2024">2024</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-400 border-b border-gray-100 font-black uppercase tracking-wider text-[9px]">
                                    <th className="p-4">Student</th>
                                    <th className="p-4">Disbursed Date</th>
                                    <th className="p-4">Bank</th>
                                    <th className="p-4">Amount</th>
                                    <th className="p-4">Referrals</th>
                                    <th className="p-4">Siblings Status</th>
                                    <th className="p-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
                                {filteredAlumni.map((al, idx) => {
                                    const isSelected = selectedAlumni.id === al.id;
                                    return (
                                        <tr 
                                            key={idx} 
                                            onClick={() => setSelectedAlumni(al)}
                                            className={`cursor-pointer transition-colors duration-200 ${isSelected ? 'bg-[#6605c7]/5 hover:bg-[#6605c7]/8' : 'hover:bg-gray-50'}`}
                                        >
                                            <td className="p-4 text-gray-900 font-black">{al.name}</td>
                                            <td className="p-4 text-gray-500 font-normal">{al.disbursed}</td>
                                            <td className="p-4">{al.bank}</td>
                                            <td className="p-4 font-mono">{al.amount}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black flex items-center gap-1 w-fit ${
                                                    al.referrals > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-gray-50 text-gray-500 border border-gray-100'
                                                }`}>
                                                    {al.referralsText}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-[10px] ${
                                                    al.siblings.includes("⚠️") ? "text-amber-605 font-black bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100" : "font-semibold text-gray-500"
                                                }`}>
                                                    {al.siblings}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setSelectedAlumni(al); }}
                                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                                        isSelected ? 'bg-[#6605c7] text-white' : 'bg-gray-50 border border-gray-100 text-gray-500 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    Select
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 17.2 Share Referral Link Generator (Per Alumni) */}
                <div className="p-8 bg-white border border-[#6605c7]/10 rounded-[2.5rem] shadow-2xl shadow-[#6605c7]/2 space-y-6 flex flex-col justify-between min-h-[460px]">
                    <div className="space-y-6">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6605c7] block">Referral Engine</span>
                            <h3 className="text-xl font-black font-display tracking-tight mt-0.5 text-gray-900 leading-tight">
                                Share Referral Link
                                <span className="block text-xs font-normal text-gray-400 mt-1">For: <strong className="font-black text-[#6605c7]">{selectedAlumni.name}</strong></span>
                            </h3>
                        </div>

                        {/* Referral Link and Incentives details */}
                        <div className="space-y-4">
                            <div className="p-4 bg-indigo-50/50 border border-indigo-150 rounded-2xl space-y-3">
                                <span className="text-[9px] font-black text-[#6605c7] uppercase tracking-wider block">Generated Referral URL</span>
                                <div className="flex gap-2 items-center">
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={getReferralUrl(selectedAlumni.slug)} 
                                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-[10px] text-gray-650 focus:outline-none select-all font-mono" 
                                    />
                                    <button onClick={() => handleCopyLink(selectedAlumni.slug)} className="p-2 bg-[#6605c7] text-white rounded-lg hover:scale-105 transition-transform" title="Copy Link">
                                        <span className="material-symbols-outlined text-sm">content_copy</span>
                                    </button>
                                </div>
                            </div>

                            {/* Incentive Information */}
                            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-1.5 text-xs text-emerald-800">
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider block">Outreach Incentives</span>
                                <p className="font-bold">If referred friend gets disbursed:</p>
                                <ul className="list-disc pl-4 space-y-0.5 text-[11px] font-medium">
                                    <li>{selectedAlumni.name.split(" ")[0]} gets <strong className="font-bold">₹2,000 cashback</strong></li>
                                    <li>Agent (you) gets <strong className="font-bold">full commission</strong> on new lead</li>
                                </ul>
                            </div>

                            {/* Template outreach messages */}
                            <div className="space-y-2">
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">WhatsApp Message Template</label>
                                <textarea 
                                    rows={5} 
                                    readOnly
                                    value={getMessageTemplate(selectedAlumni.name, selectedAlumni.slug)} 
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-600 focus:outline-none select-all font-medium leading-relaxed"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
                        <button 
                            onClick={() => handleCopyMessage(selectedAlumni.name, selectedAlumni.slug)}
                            className="py-3 bg-gray-50 hover:bg-gray-100 border border-gray-100 text-gray-650 font-black uppercase text-[9px] tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
                        >
                            <span className="material-symbols-outlined text-sm">content_copy</span> Copy Template
                        </button>
                        <button 
                            onClick={() => handleSendWhatsApp(selectedAlumni.name, selectedAlumni.slug)}
                            className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[9px] tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
                        >
                            <span className="material-symbols-outlined text-sm">chat</span> Send WhatsApp
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
