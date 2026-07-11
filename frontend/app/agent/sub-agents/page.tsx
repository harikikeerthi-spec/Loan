"use client";

import React, { useState } from "react";
import { useAgent } from "../AgentContext";

const MOCK_SUB_AGENTS = [
    {
        name: "Ramesh DSA",
        territory: "Karimnagar",
        leadsThisMonth: 8,
        sanctionsThisMonth: 3,
        theirCut: 12600,
        myCut: 8400,
        trainingCompleted: 4,
        totalTraining: 6,
        portalAccess: true,
        lastLogin: "2 hours ago",
        conversionRate: 38,
        pendingModules: "Module 5 & 6 pending",
        certified: false,
        email: "ramesh@dsa.in",
        mobile: "+91 9876543210",
    },
    {
        name: "Lata Associates",
        territory: "Nizamabad",
        leadsThisMonth: 6,
        sanctionsThisMonth: 2,
        theirCut: 8400,
        myCut: 5600,
        trainingCompleted: 6,
        totalTraining: 6,
        portalAccess: true,
        lastLogin: "Yesterday",
        conversionRate: 33,
        pendingModules: null,
        certified: true,
        email: "lata@associates.in",
        mobile: "+91 9876543211",
    },
];

export default function AgentSubAgents() {
    const {
        subAgents,
        inviteSubAgentForm, setInviteSubAgentForm,
        handleInviteSubAgent,
        showToast,
    } = useAgent();

    const [selectedSubAgent, setSelectedSubAgent] = useState<any | null>(null);

    const displaySubAgents = (subAgents && subAgents.length > 0) ? subAgents : MOCK_SUB_AGENTS;

    return (
        <div className="animate-fade-in-up space-y-8 relative z-10 text-left">

            {/* Header Summary */}
            <section className="p-8 rounded-[2.5rem] bg-white border border-[#6605c7]/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 font-display tracking-tight">MY SUB-AGENTS</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{displaySubAgents.length} Active Sub-Agents</p>
                </div>
            </section>

            {/* Overview Table + Invite Form side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Overview Table */}
                <section className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm space-y-6">
                    <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">Overview Table</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-400 border-b border-gray-100 font-black uppercase tracking-wider text-[9px]">
                                    <th className="p-4">Sub-Agent</th>
                                    <th className="p-4">Territory</th>
                                    <th className="p-4 text-center">Leads</th>
                                    <th className="p-4 text-center">Sanctions</th>
                                    <th className="p-4 text-right">Their Cut</th>
                                    <th className="p-4 text-right">My Cut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
                                {displaySubAgents.map((sa: any, i: number) => (
                                    <tr
                                        key={i}
                                        onClick={() => setSelectedSubAgent(sa)}
                                        className="hover:bg-[#6605c7]/3 transition-colors cursor-pointer group"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6605c7] to-[#8b24e5] text-white text-xs font-black flex items-center justify-center flex-shrink-0">
                                                    {sa.name[0]}
                                                </div>
                                                <span className="font-black text-gray-900 text-xs">{sa.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600">{sa.territory}</td>
                                        <td className="p-4 text-center">
                                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-black text-xs">{sa.leadsThisMonth}</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 font-black text-xs">{sa.sanctionsThisMonth}</span>
                                        </td>
                                        <td className="p-4 text-right font-mono text-gray-500">₹{sa.theirCut.toLocaleString()}</td>
                                        <td className="p-4 text-right font-mono font-black text-[#6605c7]">₹{sa.myCut.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                        <span className="text-[10px] font-black text-[#6605c7] uppercase tracking-widest">Your Override Commission</span>
                        <span className="text-sm font-black text-[#6605c7]">₹{displaySubAgents.reduce((acc: number, sa: any) => acc + sa.myCut, 0).toLocaleString()}</span>
                    </div>
                </section>

                {/* Invite Sub-Agent Form */}
                <section className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm space-y-6">
                    <div>
                        <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">INVITE SUB-AGENT</h3>
                        <p className="text-xs text-gray-400 font-bold mt-1">Send a registration link to onboard a new sub-agent under your network</p>
                    </div>

                    <form onSubmit={handleInviteSubAgent} className="space-y-4">
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</label>
                            <input
                                type="text"
                                required
                                value={inviteSubAgentForm.name}
                                onChange={(e) => setInviteSubAgentForm({ ...inviteSubAgentForm, name: e.target.value })}
                                placeholder="e.g. Ramesh DSA"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/15 focus:bg-white transition-all"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobile Number</label>
                            <input
                                type="tel"
                                required
                                value={inviteSubAgentForm.mobile}
                                onChange={(e) => setInviteSubAgentForm({ ...inviteSubAgentForm, mobile: e.target.value })}
                                placeholder="+91 XXXXXXXXXX"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/15 focus:bg-white transition-all"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                            <input
                                type="email"
                                required
                                value={inviteSubAgentForm.email}
                                onChange={(e) => setInviteSubAgentForm({ ...inviteSubAgentForm, email: e.target.value })}
                                placeholder="e.g. ramesh@dsa.in"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/15 focus:bg-white transition-all"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Territory</label>
                            <input
                                type="text"
                                value={inviteSubAgentForm.territory}
                                onChange={(e) => setInviteSubAgentForm({ ...inviteSubAgentForm, territory: e.target.value })}
                                placeholder="e.g. Karimnagar, Nizamabad"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/15 focus:bg-white transition-all"
                            />
                        </div>

                        <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-[10px] font-black text-amber-700 uppercase tracking-wider text-center">
                            Commission Split: 60% (Sub-Agent) / 40% (You) — Fixed by Vidyaloans
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 bg-[#6605c7] hover:bg-[#6605c7]/90 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg shadow-[#6605c7]/20"
                        >
                            Send Invitation Link
                        </button>
                    </form>

                    <div className="border-t border-gray-50 pt-4 space-y-3">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">What happens next</p>
                        {[
                            "Sub-agent gets WhatsApp/email with portal registration link",
                            "Admin receives notification to complete KYC verification",
                            "Once approved, sub-agent can submit leads independently",
                        ].map((step, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-[#6605c7]/10 text-[#6605c7] text-[9px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                                    {i + 1}
                                </div>
                                <p className="text-xs text-gray-500 font-bold">{step}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Sub-Agent Training & Access */}
            <section className="space-y-6">
                <div>
                    <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">Sub-Agent Management</h3>
                    <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">Training progress, portal access & performance</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {displaySubAgents.map((sa: any, idx: number) => (
                        <div key={idx} className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#6605c7]/20 to-transparent" />

                            <div className="flex flex-col md:flex-row md:items-start gap-6">
                                <div className="flex items-center gap-4 flex-shrink-0">
                                    <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-[#6605c7] to-[#8b24e5] text-white text-xl font-black flex items-center justify-center shadow-lg shadow-[#6605c7]/30">
                                        {sa.name[0]}
                                    </div>
                                    <div>
                                        <h4 className="text-base font-black text-gray-900">{sa.name}:</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{sa.territory}</p>
                                    </div>
                                </div>

                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Portal Access</p>
                                        <p className="text-xs font-black text-emerald-600">✅ Active</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Training Completed</p>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${sa.certified ? "bg-emerald-500" : "bg-[#6605c7]"}`}
                                                        style={{ width: `${(sa.trainingCompleted / sa.totalTraining) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black text-gray-700">
                                                    {sa.trainingCompleted}/{sa.totalTraining}
                                                    {sa.certified && " ✅ Certified"}
                                                </span>
                                            </div>
                                            {sa.pendingModules && (
                                                <p className="text-[9px] text-amber-600 font-bold">{sa.pendingModules}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Last Login</p>
                                        <p className="text-xs font-black text-gray-700">{sa.lastLogin}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Performance (MTH)</p>
                                        <p className="text-xs font-bold text-gray-700">
                                            {sa.leadsThisMonth} leads, {sa.sanctionsThisMonth} sanctions,{" "}
                                            <span className="font-black text-emerald-600">{sa.conversionRate}% conversion</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-5 border-t border-gray-50 flex flex-wrap gap-3">
                                <button
                                    onClick={() => showToast(`Opening chat with ${sa.name}...`, "success")}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-[#6605c7]/5 border border-[#6605c7]/10 text-[#6605c7] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#6605c7] hover:text-white transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">chat</span>
                                    Message {sa.name.split(" ")[0]}
                                </button>
                                <button
                                    onClick={() => showToast(`Loading ${sa.name}'s students...`, "success")}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">groups</span>
                                    View Their Students
                                </button>
                                <button
                                    onClick={() => showToast(`Deactivation request sent for ${sa.name}`, "warning")}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">block</span>
                                    Deactivate
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Performance Drill-down Modal */}
            {selectedSubAgent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-2xl max-w-lg w-full space-y-6 relative animate-scale-up text-left">
                        <button
                            onClick={() => setSelectedSubAgent(null)}
                            className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gray-50 border border-gray-100 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>

                        <div>
                            <span className="text-[9px] font-black text-[#6605c7] uppercase tracking-widest block">Sub-Agent Profile & Drill-down</span>
                            <h3 className="text-xl font-black text-gray-900 font-display mt-1">{selectedSubAgent.name}</h3>
                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{selectedSubAgent.territory} Territory Scope</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-2 border-y border-gray-50">
                            <div className="space-y-0.5">
                                <span className="text-gray-400 font-bold uppercase text-[9px]">Leads Logged</span>
                                <div className="text-lg font-black text-gray-800">{selectedSubAgent.leadsThisMonth} Leads</div>
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-gray-400 font-bold uppercase text-[9px]">Sanctions</span>
                                <div className="text-lg font-black text-emerald-600">{selectedSubAgent.sanctionsThisMonth} Sanctions</div>
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-gray-400 font-bold uppercase text-[9px]">Their Cut</span>
                                <div className="text-sm font-black text-gray-700">₹{selectedSubAgent.theirCut.toLocaleString()}</div>
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-gray-400 font-bold uppercase text-[9px]">Your Cut</span>
                                <div className="text-sm font-black text-[#6605c7]">₹{selectedSubAgent.myCut.toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Active Referrals Pipeline</h4>
                            <div className="space-y-2 max-h-[160px] overflow-y-auto no-scrollbar">
                                {[
                                    { name: "Suresh Pillai", scheme: "SBI Scholar", amount: "₹25,00,000", status: "VERIFICATION" },
                                    { name: "Kavya Reddy", scheme: "Auxilo Abroad", amount: "₹45,00,000", status: "SANCTIONED" }
                                ].map((ref, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700">
                                        <div>
                                            <p className="text-gray-900">{ref.name}</p>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">{ref.scheme} | {ref.amount}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-wider uppercase ${
                                            ref.status === 'SANCTIONED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                        }`}>
                                            {ref.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={() => setSelectedSubAgent(null)}
                                className="w-full py-3.5 bg-gray-50 border border-gray-100 text-gray-500 hover:bg-gray-100 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                            >
                                Close Details View
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
