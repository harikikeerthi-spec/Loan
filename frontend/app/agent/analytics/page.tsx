"use client";

import React from "react";

export default function AgentAnalytics() {
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
                                <div className="flex-1 h-8 bg-indigo-100 border border-indigo-200 rounded-lg overflow-hidden flex items-center justify-end pr-4 text-xs font-black text-indigo-700">48 Leads (100%)</div>
                            </div>
                            <div className="flex items-center">
                                <span className="w-32 text-xs font-bold text-gray-500 uppercase">Docs Received</span>
                                <div className="flex-1 h-8 bg-[#6605c7]/10 border border-[#6605c7]/20 rounded-lg overflow-hidden flex items-center justify-end pr-4 text-xs font-black text-[#6605c7]" style={{ maxWidth: "80%" }}>38 Leads (79%)</div>
                            </div>
                            <div className="flex items-center">
                                <span className="w-32 text-xs font-bold text-gray-500 uppercase">AI Verified</span>
                                <div className="flex-1 h-8 bg-[#8b24e5]/10 border border-[#8b24e5]/20 rounded-lg overflow-hidden flex items-center justify-end pr-4 text-xs font-black text-[#8b24e5]" style={{ maxWidth: "67%" }}>32 Leads (67%)</div>
                            </div>
                            <div className="flex items-center">
                                <span className="w-32 text-xs font-bold text-gray-500 uppercase">Sent to Bank</span>
                                <div className="flex-1 h-8 bg-amber-100 border border-amber-200 rounded-lg overflow-hidden flex items-center justify-end pr-4 text-xs font-black text-amber-700" style={{ maxWidth: "48%" }}>23 Leads (48%)</div>
                            </div>
                            <div className="flex items-center">
                                <span className="w-32 text-xs font-bold text-gray-500 uppercase">Sanctioned</span>
                                <div className="flex-1 h-8 bg-emerald-100 border border-emerald-200 rounded-lg overflow-hidden flex items-center justify-end pr-4 text-xs font-black text-emerald-700" style={{ maxWidth: "25%" }}>12 Leads (25%)</div>
                            </div>
                        </div>

                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800 text-xs font-medium mt-6">
                            💡 Your conversion rate (25%) is above the industry average (18%) — Great job! Largest drop occurs from "Sent to Bank" to "Sanctioned", typically due to missing physical stamped Income certificates.
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
                                    <tr>
                                        <td className="p-4">SBI</td>
                                        <td className="p-4">10</td>
                                        <td className="p-4">7</td>
                                        <td className="p-4 text-amber-600">12 Days</td>
                                        <td className="p-4 font-black">70%</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4">HDFC Credila</td>
                                        <td className="p-4">7</td>
                                        <td className="p-4">4</td>
                                        <td className="p-4 text-gray-600">9 Days</td>
                                        <td className="p-4 font-black">57%</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4">Avanse</td>
                                        <td className="p-4">4</td>
                                        <td className="p-4">3</td>
                                        <td className="p-4 text-emerald-600 font-bold">6 Days 🏆</td>
                                        <td className="p-4 font-black text-emerald-600">75%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-8 flex flex-col">
                    {/* Leaderboard */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                        <h3 className="font-display font-black text-lg text-gray-900 mb-6 uppercase tracking-tight">🥇 Territory Leaderboard (June 2026)</h3>
                        
                        <div className="space-y-4">
                            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex justify-between items-center text-xs">
                                <div className="flex gap-3 items-center">
                                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">1</span>
                                    <span className="font-black text-indigo-700">Krishna Agency (You)</span>
                                </div>
                                <span className="font-bold text-indigo-700">12 sanctions</span>
                            </div>
                            <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-center text-xs">
                                <div className="flex gap-3 items-center">
                                    <span className="w-6 h-6 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center font-bold">2</span>
                                    <span className="font-bold text-gray-800">Sai Associates</span>
                                </div>
                                <span className="font-bold text-gray-600">7 sanctions</span>
                            </div>
                            <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-center text-xs">
                                <div className="flex gap-3 items-center">
                                    <span className="w-6 h-6 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center font-bold">3</span>
                                    <span className="font-bold text-gray-800">Edu Advisors HYD</span>
                                </div>
                                <span className="font-bold text-gray-600">3 sanctions</span>
                            </div>
                        </div>
                    </div>

                    {/* Rejections Reasons */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm flex-1">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#6605c7]/40 mb-6">REJECTION ANALYSIS</h3>
                        
                        <div className="space-y-4 text-xs">
                            <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                <div className="flex justify-between font-bold text-gray-800">
                                    <span>Incomplete Documents</span>
                                    <span>44% (4 counts)</span>
                                </div>
                                <p className="text-rose-500 text-[10px] font-medium mt-1">Fix: Use checklists before upload</p>
                            </div>
                            <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                <div className="flex justify-between font-bold text-gray-800">
                                    <span>Low Co-Applicant Income</span>
                                    <span>22% (2 counts)</span>
                                </div>
                                <p className="text-indigo-600 text-[10px] font-medium mt-1">Fix: Evaluate checker tool prior to lead submit</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
