"use client";

import React from "react";
import { useAgent } from "../AgentContext";

export default function AgentSubAgents() {
    const {
        subAgents,
        inviteSubAgentForm, setInviteSubAgentForm,
        handleInviteSubAgent
    } = useAgent();

    return (
        <div className="animate-fade-in-up space-y-12 relative z-10">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sub-agent Network Table */}
                <div className="lg:col-span-2 bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                    <h3 className="font-display font-black text-xl text-gray-900 mb-6 uppercase tracking-tight">Active Sub-Agent Network</h3>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-bold border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-400 border-b border-gray-100">
                                    <th className="p-4">Sub-Agent Name</th>
                                    <th className="p-4">Territory</th>
                                    <th className="p-4">Leads Month</th>
                                    <th className="p-4">Sanctions</th>
                                    <th className="p-4">Their 60% Split</th>
                                    <th className="p-4">Your 40% Cut</th>
                                    <th className="p-4">LMS Progress</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {subAgents.map((sa, i) => (
                                    <tr key={i}>
                                        <td className="p-4 font-bold text-gray-800">{sa.name}</td>
                                        <td className="p-4">{sa.territory}</td>
                                        <td className="p-4 text-center">{sa.leadsThisMonth}</td>
                                        <td className="p-4 text-center">{sa.sanctionsThisMonth}</td>
                                        <td className="p-4 font-mono text-gray-600">₹{sa.theirCut.toLocaleString()}</td>
                                        <td className="p-4 font-mono font-black text-indigo-600">₹{sa.myCut.toLocaleString()}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${(sa.trainingCompleted / sa.totalTraining) * 100}%` }} />
                                                </div>
                                                <span className="text-[10px] text-gray-400">{sa.trainingCompleted}/{sa.totalTraining}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-[#6605c7] text-xs font-bold uppercase tracking-wider text-center mt-6">
                        Your Override Override Commission from Sub-Agents: ₹14,000 (included in June Net Payable Payout)
                    </div>
                </div>

                {/* Invite Sub-agent Form */}
                <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                    <h3 className="font-display font-black text-xl text-gray-900 mb-6 uppercase tracking-tight">Invite Sub-Agent</h3>
                    
                    <form onSubmit={handleInviteSubAgent} className="space-y-4">
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase">Sub-Agent Name</label>
                            <input type="text" required value={inviteSubAgentForm.name} onChange={(e) => setInviteSubAgentForm({ ...inviteSubAgentForm, name: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase">Mobile Number</label>
                            <input type="tel" required value={inviteSubAgentForm.mobile} onChange={(e) => setInviteSubAgentForm({ ...inviteSubAgentForm, mobile: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase">Email Address</label>
                            <input type="email" required value={inviteSubAgentForm.email} onChange={(e) => setInviteSubAgentForm({ ...inviteSubAgentForm, email: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase">Territory Scope</label>
                            <input type="text" value={inviteSubAgentForm.territory} onChange={(e) => setInviteSubAgentForm({ ...inviteSubAgentForm, territory: e.target.value })} placeholder="e.g. Nizamabad" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-850 focus:outline-none" />
                        </div>
                        <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] text-gray-400 font-bold uppercase tracking-wider text-center">
                            Commission Split: 60% (Sub-Agent) / 40% (You) — Fixed by Vidyaloans
                        </div>

                        <button type="submit" className="w-full py-4 bg-[#6605c7] hover:bg-[#6605c7]/95 text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-sm">Send Invitation Link</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
