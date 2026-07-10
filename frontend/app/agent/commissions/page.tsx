"use client";

import React from "react";
import { useAgent } from "../AgentContext";

export default function AgentCommissions() {
    const { applications, downloadCSV, downloadPDF } = useAgent();

    return (
        <div className="animate-fade-in-up space-y-12 relative z-10">
            
            {/* Earnings Overview Table */}
            <section className="p-8 rounded-[2.5rem] bg-white border border-[#6605c7]/10 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">My Earnings Summary</h3>
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full uppercase tracking-wider">Next Payout: 01-Jul-2026</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-bold border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-400 border-b border-gray-100">
                                <th className="p-4">Period</th>
                                <th className="p-4">Gross Commission</th>
                                <th className="p-4">TDS Deducted (10%)</th>
                                <th className="p-4">Net Payable</th>
                                <th className="p-4">Payout Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            <tr>
                                <td className="p-4">June 2026</td>
                                <td className="p-4 font-mono">₹72,000</td>
                                <td className="p-4 text-rose-500 font-mono">(₹7,200)</td>
                                <td className="p-4 font-black text-emerald-600 font-mono">₹64,800</td>
                                <td className="p-4"><span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[9px] uppercase tracking-wider font-black">⏳ Pending Approval</span></td>
                            </tr>
                            <tr>
                                <td className="p-4">May 2026</td>
                                <td className="p-4 font-mono">₹60,000</td>
                                <td className="p-4 text-rose-500 font-mono">(₹6,000)</td>
                                <td className="p-4 font-black text-gray-700 font-mono">₹54,000</td>
                                <td className="p-4"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] uppercase tracking-wider font-black">✅ Paid (01-Jun)</span></td>
                            </tr>
                            <tr>
                                <td className="p-4">YTD (Jan–Jun)</td>
                                <td className="p-4 font-mono">₹3,84,000</td>
                                <td className="p-4 text-rose-500 font-mono">(₹38,400)</td>
                                <td className="p-4 font-black text-gray-700 font-mono">₹3,45,600</td>
                                <td className="p-4"><span className="text-gray-400 font-bold uppercase text-[9px]">Combined Ledger</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Commission breakdown ledger */}
            <section className="p-8 rounded-[2.5rem] bg-white border border-[#6605c7]/10 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">Commission Student Ledger — June 2026</h3>
                    <div className="flex gap-2">
                        <button onClick={() => downloadCSV()} className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-black uppercase text-gray-500 hover:bg-gray-150">Export Excel</button>
                        <button onClick={() => downloadPDF()} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-100">Download Statement</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-bold border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-400 border-b border-gray-100">
                                <th className="p-4">Student Name</th>
                                <th className="p-4">Bank</th>
                                <th className="p-4">Disbursed Amount</th>
                                <th className="p-4">Commission Rate</th>
                                <th className="p-4">Total Commission</th>
                                <th className="p-4">Payout Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {applications.slice(0, 5).map((app, i) => (
                                <tr key={i}>
                                    <td className="p-4 font-bold text-gray-800">{app.firstName} {app.lastName}</td>
                                    <td className="p-4">{app.bank}</td>
                                    <td className="p-4 font-mono">₹{app.amount.toLocaleString()}</td>
                                    <td className="p-4 font-mono">{app.commissionRate}%</td>
                                    <td className="p-4 font-black text-[#6605c7] font-mono">₹{app.projectedCommission.toLocaleString()}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${app.status === 'disbursed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                            {app.status === 'disbursed' ? 'Paid' : 'Pending Sanction'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Commissions splits / rate cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Payout History logs */}
                <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                    <h3 className="font-display font-black text-lg text-gray-900 mb-6 uppercase tracking-tight">Payout History (Last 5 Months)</h3>
                    
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-center text-xs">
                            <div>
                                <p className="font-bold text-gray-800">May 2026 Payout</p>
                                <p className="text-[10px] text-gray-400">Paid 01-Jun-2026 | UTR12345</p>
                            </div>
                            <span className="font-mono font-black text-gray-900">₹54,000</span>
                        </div>
                        <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-center text-xs">
                            <div>
                                <p className="font-bold text-gray-800">Apr 2026 Payout</p>
                                <p className="text-[10px] text-gray-400">Paid 01-May-2026 | UTR12298</p>
                            </div>
                            <span className="font-mono font-black text-gray-900">₹43,200</span>
                        </div>
                        <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-center text-xs">
                            <div>
                                <p className="font-bold text-gray-800">Mar 2026 Payout</p>
                                <p className="text-[10px] text-gray-400">Paid 01-Apr-2026 | UTR11990</p>
                            </div>
                            <span className="font-mono font-black text-gray-900">₹64,800</span>
                        </div>
                    </div>
                </div>


            </div>
        </div>
    );
}
