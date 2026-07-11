"use client";

import React from "react";
import { useAgent } from "../AgentContext";

const LEDGER_ROWS = [
    { name: "Priya Sharma",   bank: "SBI",    amount: 1200000, rate: "0.70%", commission: 8400,  status: "pending_sanction" },
    { name: "Venu Gopal",     bank: "HDFC",   amount: 1200000, rate: "0.70%", commission: 8400,  status: "payout_pending" },
    { name: "Kiran Rao",      bank: "SBI",    amount: 850000,  rate: "0.60%", commission: 5100,  status: "payout_pending" },
    { name: "Anjali Raju",    bank: "Avanse", amount: 1400000, rate: "0.70%", commission: 9800,  status: "paid_may" },
    { name: "Raju Mehta",     bank: "Axis",   amount: 1500000, rate: "0.70%", commission: 10500, status: "paid_may" },
];

const PAYOUT_HISTORY = [
    { month: "May 2026",  gross: 60000, tds: 6000, net: 54000, date: "01-Jun-2026", utr: "UTR12345" },
    { month: "Apr 2026",  gross: 48000, tds: 4800, net: 43200, date: "01-May-2026", utr: "UTR12298" },
    { month: "Mar 2026",  gross: 72000, tds: 7200, net: 64800, date: "01-Apr-2026", utr: "UTR11990" },
    { month: "Feb 2026",  gross: 36000, tds: 3600, net: 32400, date: "01-Mar-2026", utr: "UTR11712" },
    { month: "Jan 2026",  gross: 54000, tds: 5400, net: 48600, date: "01-Feb-2026", utr: "UTR11421" },
];

const SUB_AGENT_PAYOUTS = [
    { name: "Ramesh DSA",      sanctions: 3, gross: 21000, theirCut: 12600, myCut: 8400 },
    { name: "Lata Associates", sanctions: 2, gross: 14000, theirCut: 8400,  myCut: 5600 },
];

const STATUS_STYLES: Record<string, string> = {
    pending_sanction: "bg-amber-50 text-amber-700",
    payout_pending:   "bg-blue-50 text-blue-700",
    paid_may:         "bg-emerald-50 text-emerald-700",
};

const STATUS_LABELS: Record<string, string> = {
    pending_sanction: "⏳ Pending Sanction",
    payout_pending:   "🕐 Payout Pending",
    paid_may:         "✅ Paid (May)",
};

export default function AgentCommissions() {
    const { applications, downloadCSV, downloadPDF, showToast } = useAgent();

    return (
        <div className="animate-fade-in-up space-y-8 relative z-10">

            {/* ─── Earnings Overview ─── */}
            <section className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">MY EARNINGS — June 2026</h3>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-black text-amber-700 bg-amber-50 border border-amber-100 px-4 py-1.5 rounded-full uppercase tracking-wider">
                            ⏳ Pending Approval
                        </span>
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-4 py-1.5 rounded-full uppercase tracking-wider">
                            Expected Payout: 01-Jul-2026
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-400 border-b border-gray-100 font-black uppercase tracking-wider text-[9px]">
                                <th className="p-4"></th>
                                <th className="p-4 text-right">This Month</th>
                                <th className="p-4 text-right">Last Month</th>
                                <th className="p-4 text-right">YTD (Jan–Jun)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 font-bold">
                            <tr className="hover:bg-gray-50/60 transition-colors">
                                <td className="p-4 text-gray-500 font-black uppercase text-[10px] tracking-widest">Gross Commission</td>
                                <td className="p-4 text-right font-mono font-black text-gray-900">₹ 72,000</td>
                                <td className="p-4 text-right font-mono text-gray-600">₹ 60,000</td>
                                <td className="p-4 text-right font-mono text-gray-600">₹ 3,84,000</td>
                            </tr>
                            <tr className="hover:bg-gray-50/60 transition-colors">
                                <td className="p-4 text-gray-500 font-black uppercase text-[10px] tracking-widest">TDS Deducted</td>
                                <td className="p-4 text-right font-mono font-black text-rose-500">(₹ 7,200)</td>
                                <td className="p-4 text-right font-mono text-rose-400">(₹ 6,000)</td>
                                <td className="p-4 text-right font-mono text-rose-400">(₹ 38,400)</td>
                            </tr>
                            <tr className="bg-[#6605c7]/3 hover:bg-[#6605c7]/5 transition-colors">
                                <td className="p-4 text-[#6605c7] font-black uppercase text-[10px] tracking-widest">Net Payable</td>
                                <td className="p-4 text-right font-mono font-black text-[#6605c7] text-sm">₹ 64,800</td>
                                <td className="p-4 text-right font-mono font-black text-gray-700">₹ 54,000</td>
                                <td className="p-4 text-right font-mono font-black text-gray-700">₹ 3,45,600</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ─── Commission Ledger ─── */}
            <section className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">COMMISSION LEDGER — June 2026</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => showToast("Downloading PDF statement...", "success")}
                            className="flex items-center gap-2 px-4 py-2.5 bg-[#6605c7]/5 border border-[#6605c7]/10 text-[#6605c7] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#6605c7] hover:text-white transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                            Download Statement PDF
                        </button>
                        <button
                            onClick={() => downloadCSV?.()}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-100 text-gray-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">table_view</span>
                            View All
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-400 border-b border-gray-100 font-black uppercase tracking-wider text-[9px]">
                                <th className="p-4">Student Name</th>
                                <th className="p-4">Bank</th>
                                <th className="p-4 text-right">Disbursed Amt</th>
                                <th className="p-4 text-center">Rate</th>
                                <th className="p-4 text-right">Commission</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
                            {LEDGER_ROWS.map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                                    <td className="p-4 font-black text-gray-900">{row.name}</td>
                                    <td className="p-4 text-gray-500">{row.bank}</td>
                                    <td className="p-4 text-right font-mono">₹ {row.amount.toLocaleString("en-IN")}</td>
                                    <td className="p-4 text-center font-mono text-gray-500">{row.rate}</td>
                                    <td className="p-4 text-right font-mono font-black text-[#6605c7]">₹ {row.commission.toLocaleString("en-IN")}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-wider ${STATUS_STYLES[row.status]}`}>
                                            {STATUS_LABELS[row.status]}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-gray-50/60">
                                <td colSpan={3} className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">… 12 more records</td>
                                <td colSpan={3} className="p-4 text-right">
                                    <span className="text-xs font-black text-[#6605c7]">Total Payout (Jun): ₹ 64,800</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ─── Payout History + Sub-Agent Splits side by side ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Payout History */}
                <section className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm space-y-5">
                    <div className="flex justify-between items-start gap-4">
                        <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">PAYOUT HISTORY</h3>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Last 12 Months</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-400 border-b border-gray-100 font-black uppercase tracking-wider text-[9px]">
                                    <th className="p-3">Month</th>
                                    <th className="p-3 text-right">Gross</th>
                                    <th className="p-3 text-right">TDS</th>
                                    <th className="p-3 text-right">Net Paid</th>
                                    <th className="p-3">UTR</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
                                {PAYOUT_HISTORY.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="p-3">
                                            <p className="font-black text-gray-900 text-[10px]">{row.month}</p>
                                            <p className="text-[9px] text-gray-400 mt-0.5">{row.date}</p>
                                        </td>
                                        <td className="p-3 text-right font-mono text-gray-500 text-[10px]">₹ {row.gross.toLocaleString("en-IN")}</td>
                                        <td className="p-3 text-right font-mono text-rose-400 text-[10px]">(₹ {row.tds.toLocaleString("en-IN")})</td>
                                        <td className="p-3 text-right font-mono font-black text-gray-900 text-[10px]">₹ {row.net.toLocaleString("en-IN")}</td>
                                        <td className="p-3 text-[9px] font-bold text-gray-400">{row.utr}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pt-3 border-t border-gray-50 flex flex-wrap gap-3">
                        <button
                            onClick={() => showToast("Downloading Form 16A...", "success")}
                            className="flex items-center gap-2 px-4 py-2.5 bg-[#6605c7]/5 border border-[#6605c7]/10 text-[#6605c7] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#6605c7] hover:text-white transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">download</span>
                            Form 16A (Annual TDS Certificate)
                        </button>
                        <button
                            onClick={() => downloadCSV?.()}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-100 text-gray-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">table_view</span>
                            Export All to Excel
                        </button>
                    </div>
                </section>

                {/* Sub-Agent Commission Splits */}
                <section className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm space-y-5">
                    <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">SUB-AGENT PAYOUTS — June 2026</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-400 border-b border-gray-100 font-black uppercase tracking-wider text-[9px]">
                                    <th className="p-3">Sub-Agent</th>
                                    <th className="p-3 text-center">Sanctions</th>
                                    <th className="p-3 text-right">Their Gross</th>
                                    <th className="p-3 text-right">Their 60%</th>
                                    <th className="p-3 text-right">Your 40%</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
                                {SUB_AGENT_PAYOUTS.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6605c7] to-[#8b24e5] text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">
                                                    {row.name[0]}
                                                </div>
                                                <span className="font-black text-gray-900 text-[10px]">{row.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 font-black text-[10px]">{row.sanctions}</span>
                                        </td>
                                        <td className="p-3 text-right font-mono text-gray-500 text-[10px]">₹ {row.gross.toLocaleString("en-IN")}</td>
                                        <td className="p-3 text-right font-mono text-gray-600 text-[10px]">₹ {row.theirCut.toLocaleString("en-IN")}</td>
                                        <td className="p-3 text-right font-mono font-black text-[#6605c7] text-[10px]">₹ {row.myCut.toLocaleString("en-IN")}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                        <span className="text-[10px] font-black text-[#6605c7] uppercase tracking-widest">Your Override Commission</span>
                        <span className="text-sm font-black text-[#6605c7]">
                            ₹ {SUB_AGENT_PAYOUTS.reduce((a, r) => a + r.myCut, 0).toLocaleString("en-IN")}
                            <span className="text-[9px] font-bold text-indigo-400 ml-1">(included in June total)</span>
                        </span>
                    </div>
                </section>
            </div>
        </div>
    );
}
