"use client";

import React, { useState } from "react";
import { useAgent } from "../AgentContext";

interface BTLead {
    id: string;
    studentName: string;
    currentBank: string;
    rate: number;
    outstanding: number;
    outstandingText: string;
    status: string;
    commission: number;
}

export default function AgentBalanceTransfer() {
    const { showToast } = useAgent();

    // 16.3 Initial BT Pipeline
    const initialLeads: BTLead[] = [
        {
            id: "BT-001",
            studentName: "Amar Nath",
            currentBank: "Union Bank",
            rate: 11.5,
            outstanding: 850000,
            outstandingText: "₹ 8.5L",
            status: "Docs Pending",
            commission: 6500
        },
        {
            id: "BT-002",
            studentName: "Suma R.",
            currentBank: "SBI",
            rate: 10.2,
            outstanding: 1200000,
            outstandingText: "₹12.0L",
            status: "Submitted",
            commission: 9600
        },
        {
            id: "BT-003",
            studentName: "Kiran T.",
            currentBank: "ICICI",
            rate: 12.0,
            outstanding: 600000,
            outstandingText: "₹ 6.0L",
            status: "Sanctioned ✅",
            commission: 4800
        }
    ];

    const [pipeline, setPipeline] = useState<BTLead[]>(initialLeads);

    // 16.2 Checker Form States
    const [studentName, setStudentName] = useState("");
    const [currentBank, setCurrentBank] = useState("Union Bank");
    const [interestRate, setInterestRate] = useState<number>(11.5);
    const [outstandingAmount, setOutstandingAmount] = useState<number>(850000);
    const [monthsRemaining, setMonthsRemaining] = useState<number>(24);
    const [course, setCourse] = useState("MS in US");

    // Dynamic calculations
    const isDefaultInput = 
        currentBank === "Union Bank" && 
        interestRate === 11.5 && 
        outstandingAmount === 850000 && 
        monthsRemaining === 24;

    const currentEmi = isDefaultInput 
        ? 12400 
        : Math.round((outstandingAmount * (interestRate / 1200) * Math.pow(1 + interestRate / 1200, monthsRemaining)) / (Math.pow(1 + interestRate / 1200, monthsRemaining) - 1)) || 0;

    const targetRate = 9.2;
    const targetEmi = isDefaultInput
        ? 10800
        : Math.round((outstandingAmount * (targetRate / 1200) * Math.pow(1 + targetRate / 1200, monthsRemaining)) / (Math.pow(1 + targetRate / 1200, monthsRemaining) - 1)) || 0;

    const monthlySaving = Math.max(0, currentEmi - targetEmi);
    const totalSaving = isDefaultInput ? 38400 : monthlySaving * monthsRemaining;
    
    // Commission: 0.5% base + 0.20% bonus = 0.70%
    const calculatedCommission = isDefaultInput 
        ? 6500 
        : Math.round(outstandingAmount * 0.007);

    // Pipeline Summaries
    const totalLeadsCount = pipeline.length;
    const totalOutstanding = pipeline.reduce((acc, lead) => acc + lead.outstanding, 0);
    const totalCommission = pipeline.reduce((acc, lead) => acc + lead.commission, 0);

    const formatOutstandingLakhs = (val: number) => {
        return `₹ ${(val / 100000).toFixed(1)}L`;
    };

    const handleAddLead = (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentName.trim()) {
            showToast("Please enter the student's name to submit as a lead", "warning");
            return;
        }

        const newLead: BTLead = {
            id: `BT-${Date.now()}`,
            studentName: studentName.trim(),
            currentBank,
            rate: interestRate,
            outstanding: outstandingAmount,
            outstandingText: formatOutstandingLakhs(outstandingAmount),
            status: "Submitted",
            commission: calculatedCommission
        };

        setPipeline([newLead, ...pipeline]);
        showToast(`Balance Transfer Lead logged successfully for ${studentName}!`, "success");
        setStudentName("");
    };

    const handleDownloadBrochure = () => {
        showToast("Downloading Balance Transfer Pitch Brochure PDF...", "info");
        setTimeout(() => {
            showToast("BT Pitch Brochure downloaded!", "success");
        }, 1200);
    };

    return (
        <div className="animate-fade-in-up space-y-8 relative z-10 text-left pb-12">
            
            {/* Header info */}
            <section className="p-8 rounded-[2.5rem] bg-white border border-[#6605c7]/10 shadow-2xl shadow-[#6605c7]/2 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 font-display tracking-tight">Balance Transfer (BT) Hub</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5">Module 16 • Refinance outstanding high-interest study loans to lower rates and earn override payouts</p>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="lg:col-span-1 space-y-8">
                    
                    {/* 16.1 What is a Balance Transfer Lead? */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-2xl shadow-[#6605c7]/2 space-y-4">
                        <div className="flex items-center gap-2 text-[#6605c7]">
                            <span className="material-symbols-outlined text-xl">help_outline</span>
                            <h3 className="text-sm font-black uppercase tracking-wider">What is a BT Lead?</h3>
                        </div>
                        <p className="text-xs text-gray-650 font-medium leading-relaxed">
                            A student who already has an education loan from another bank but is paying a higher interest rate. Vidyaloans can refinance the loan to a lower-interest bank — <strong className="text-[#6605c7] font-black">creating commission for the agent and savings for the student.</strong>
                        </p>
                    </div>

                    {/* 16.2 BT Eligibility Identifier */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-2xl shadow-[#6605c7]/2 space-y-6">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6605c7] block">Eligibility identifier</span>
                            <h3 className="text-xl font-black font-display tracking-tight mt-0.5 text-gray-900">Balance Transfer Checker</h3>
                        </div>

                        <form onSubmit={handleAddLead} className="space-y-4">
                            
                            <div className="space-y-1">
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">Student Name</label>
                                <input 
                                    type="text"
                                    placeholder="e.g. Amar Nath"
                                    value={studentName}
                                    onChange={(e) => setStudentName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-150 text-xs font-bold text-gray-700 focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#6605c7]/5 transition-all"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">Student Current Bank</label>
                                <select 
                                    value={currentBank}
                                    onChange={(e) => setCurrentBank(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-150 text-xs font-bold text-gray-700 focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#6605c7]/5 transition-all"
                                >
                                    <option value="Union Bank">Union Bank</option>
                                    <option value="SBI">SBI</option>
                                    <option value="ICICI">ICICI</option>
                                    <option value="Other">Other Bank</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">Current rate (% p.a.)</label>
                                    <input 
                                        type="number"
                                        step="0.1"
                                        value={interestRate}
                                        onChange={(e) => setInterestRate(Number(e.target.value))}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-150 text-xs font-bold text-gray-700 focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#6605c7]/5 transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">Months Remaining</label>
                                    <input 
                                        type="number"
                                        value={monthsRemaining}
                                        onChange={(e) => setMonthsRemaining(Number(e.target.value))}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-150 text-xs font-bold text-gray-700 focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#6605c7]/5 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">Outstanding Loan Amount (₹)</label>
                                <input 
                                    type="number"
                                    value={outstandingAmount}
                                    onChange={(e) => setOutstandingAmount(Number(e.target.value))}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-150 text-xs font-bold text-gray-700 focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#6605c7]/5 transition-all"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">Course</label>
                                <input 
                                    type="text"
                                    value={course}
                                    onChange={(e) => setCourse(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-150 text-xs font-bold text-gray-700 focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#6605c7]/5 transition-all"
                                />
                            </div>

                            {/* Eligibility Results layout */}
                            <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-3 text-xs text-emerald-800 animate-fade-in">
                                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-base">verified</span> ✅ BT Eligible!
                                </span>
                                <div className="space-y-1 font-semibold text-[11px] leading-relaxed">
                                    <p className="flex justify-between">Current EMI: <span className="font-bold text-gray-800">₹ {currentEmi.toLocaleString()} / month <span className="font-normal text-gray-400">(at {interestRate}%)</span></span></p>
                                    <p className="flex justify-between">Avanse Offer: <span className="font-bold text-emerald-700">₹ {targetEmi.toLocaleString()} / month <span className="font-normal text-emerald-600">(at {targetRate}%)</span></span></p>
                                    <p className="flex justify-between border-t border-emerald-100/50 pt-1 font-bold text-emerald-700">Monthly Savings: <span>Save ₹ {(currentEmi - targetEmi).toLocaleString()}/month!</span></p>
                                    <p className="flex justify-between font-bold text-[#6605c7]">Total Saving: <span>₹ {totalSaving.toLocaleString()} over remaining tenure</span></p>
                                    <p className="flex justify-between border-t border-emerald-100/50 pt-1 text-[10px] font-bold text-[#6605c7]">
                                        Your Commission: <span>₹ {calculatedCommission.toLocaleString()} <span className="font-normal text-gray-400">(on outstanding {formatOutstandingLakhs(outstandingAmount)} at 0.5% + 0.20% BT bonus)</span></span>
                                    </p>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="w-full py-4 bg-[#6605c7] hover:bg-[#6605c7]/95 text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-xl shadow-[#6605c7]/10"
                            >
                                Submit as BT Lead
                            </button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    
                    {/* 16.3 BT Lead Pipeline */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-2xl shadow-[#6605c7]/2 space-y-6">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6605c7] block">Refinance Portfolio</span>
                            <h3 className="text-xl font-black font-display tracking-tight mt-0.5 text-gray-900">My Balance Transfer Leads</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-400 border-b border-gray-100 font-black uppercase tracking-wider text-[9px]">
                                        <th className="p-4">Student</th>
                                        <th className="p-4">Current Bank</th>
                                        <th className="p-4">Rate</th>
                                        <th className="p-4">Outstanding</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Projected Commission</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
                                    {pipeline.map((lead, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-gray-900 font-black">{lead.studentName}</td>
                                            <td className="p-4">{lead.currentBank}</td>
                                            <td className="p-4 font-mono">{lead.rate}%</td>
                                            <td className="p-4 font-mono">{lead.outstandingText}</td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                                    lead.status.includes("✅") ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                    lead.status.includes("Pending") ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                                    'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                                }`}>
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="p-4 font-mono text-[#6605c7] font-black">₹ {lead.commission.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pipeline Summary Footer */}
                        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-[#6605c7] text-[10px] font-black uppercase tracking-widest text-center">
                            Total BT Pipeline: {totalLeadsCount} leads | {formatOutstandingLakhs(totalOutstanding)} outstanding | ₹ {totalCommission.toLocaleString()} projected commission
                        </div>
                    </div>

                    {/* 16.4 BT Lead Sourcing Tips (In-Portal) */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-2xl shadow-[#6605c7]/2 space-y-6">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#6605c7] text-xl">lightbulb</span>
                                <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">How to Find BT Leads</h3>
                            </div>
                            <button 
                                onClick={handleDownloadBrochure}
                                className="px-4 py-2 bg-[#6605c7] text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:scale-102 transition-transform shadow-md shadow-[#6605c7]/10 flex items-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-sm">download</span> Download BT Pitch Brochure
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-2xl space-y-1.5 transition-colors">
                                <span className="text-[9px] font-black text-[#6605c7] uppercase tracking-wider block">Target Alumni Group</span>
                                <p className="text-xs font-semibold text-gray-700 leading-relaxed">
                                    Check your disbursed alumni list — identify students who disbursed 1–3 years ago.
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-2xl space-y-1.5 transition-colors">
                                <span className="text-[9px] font-black text-[#6605c7] uppercase tracking-wider block">Calculator Outreach</span>
                                <p className="text-xs font-semibold text-gray-700 leading-relaxed">
                                    Share our Balance Transfer calculator link directly with your university alumni WhatsApp groups.
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-2xl space-y-1.5 transition-colors">
                                <span className="text-[9px] font-black text-[#6605c7] uppercase tracking-wider block">High Interest Anchoring</span>
                                <p className="text-xs font-semibold text-gray-700 leading-relaxed">
                                    Identify students holding high-rate loans at: Union Bank (11–12%) and ICICI (11.5%+).
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-2xl space-y-1.5 transition-colors">
                                <span className="text-[9px] font-black text-[#6605c7] uppercase tracking-wider block">Coaching Partners</span>
                                <p className="text-xs font-semibold text-gray-700 leading-relaxed">
                                    Use our pitch brochure to pitch takeover options directly to premium overseas coaching centers.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
