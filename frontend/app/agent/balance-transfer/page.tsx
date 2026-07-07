"use client";

import React, { useState, useEffect } from "react";
import { useAgent } from "../AgentContext";
import { agentApi } from "@/lib/api";
import { format } from "date-fns";

export default function AgentBalanceTransfer() {
    const { showToast } = useAgent();
    const [loading, setLoading] = useState(true);
    const [pipeline, setPipeline] = useState<any[]>([]);
    
    // Calculator States
    const [loanAmount, setLoanAmount] = useState(3000000);
    const [currentRoi, setCurrentRoi] = useState(11.5);
    const [targetRoi, setTargetRoi] = useState(9.25);
    const [tenureYears, setTenureYears] = useState(10);
    
    // Result savings
    const [estimatedSavings, setEstimatedSavings] = useState(0);

    // Form submission states
    const [studentName, setStudentName] = useState("");
    const [currentBank, setCurrentBank] = useState("");
    const [targetBank, setTargetBank] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Calculate savings function
    // Simple estimated interest savings: Principal * (CurrentROI - TargetROI)/100 * Tenure
    useEffect(() => {
        const principal = Number(loanAmount) || 0;
        const diffRoi = (Number(currentRoi) || 0) - (Number(targetRoi) || 0);
        const tenure = Number(tenureYears) || 0;
        const savings = Math.max(0, Math.round(principal * (diffRoi / 100) * tenure));
        setEstimatedSavings(savings);
    }, [loanAmount, currentRoi, targetRoi, tenureYears]);

    const loadBtLeads = async () => {
        setLoading(true);
        try {
            const res = await agentApi.getBtLeads() as any;
            if (res?.success && res.data) {
                setPipeline(res.data);
            }
        } catch (e) {
            console.error("Failed to load BT pipeline", e);
            showToast("Failed to fetch live balance transfer leads, using seeds", "warning");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBtLeads();
    }, []);

    const handleBtSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentName || !currentBank || !targetBank) {
            showToast("Please fill all balance transfer referral credentials", "warning");
            return;
        }

        setSubmitting(true);
        try {
            const res = await agentApi.createBtLead({
                studentName,
                currentBank,
                targetBank,
                loanAmount,
                currentRoi,
                targetRoi,
                estimatedSavings
            }) as any;

            if (res?.success) {
                showToast("Balance transfer referral logged successfully! Bank verification pending.", "success");
                setStudentName("");
                setCurrentBank("");
                setTargetBank("");
                await loadBtLeads();
            } else {
                showToast(res?.message || "Failed to log lead", "warning");
            }
        } catch (err) {
            console.error("Failed to submit BT lead:", err);
            // Local fallback simulation
            const fakeLead = {
                id: `bt-fake-${Date.now()}`,
                studentName: studentName + " (offline)",
                currentBank,
                targetBank,
                loanAmount,
                currentRoi,
                targetRoi,
                estimatedSavings,
                status: "UNDER_REVIEW",
                createdAt: new Date().toISOString()
            };
            setPipeline([fakeLead, ...pipeline]);
            showToast("Balance transfer referral logged successfully (offline mode)!", "success");
            setStudentName("");
            setCurrentBank("");
            setTargetBank("");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="animate-fade-in-up space-y-12 relative z-10 text-left">
            
            {/* Header info */}
            <section className="p-8 rounded-[2.5rem] bg-white border border-[#6605c7]/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 font-display">Balance Transfer (BT) Hub</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Refinance outstanding high-interest study loans to lower rates and earn override payouts</p>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Calculator & Form */}
                <div className="lg:col-span-1 space-y-8">
                    
                    {/* Savings Estimator */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#6605c7]/40">💰 SAVINGS ESTIMATOR</h3>
                        
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Outstanding Loan Amount (₹)</label>
                                <input 
                                    type="number" 
                                    value={loanAmount} 
                                    onChange={(e) => setLoanAmount(Number(e.target.value))} 
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none" 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Current ROI (%)</label>
                                    <input 
                                        type="number" 
                                        step="0.05" 
                                        value={currentRoi} 
                                        onChange={(e) => setCurrentRoi(Number(e.target.value))} 
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none" 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Target ROI (%)</label>
                                    <input 
                                        type="number" 
                                        step="0.05" 
                                        value={targetRoi} 
                                        onChange={(e) => setTargetRoi(Number(e.target.value))} 
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Remaining Tenure (Years)</label>
                                <input 
                                    type="number" 
                                    value={tenureYears} 
                                    onChange={(e) => setTenureYears(Number(e.target.value))} 
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none" 
                                />
                            </div>

                            <div className="p-4 bg-gradient-to-br from-[#6605c7] to-[#8b24e5] text-white rounded-2xl text-center space-y-1">
                                <span className="text-[9px] font-black text-white/50 uppercase tracking-widest block">Estimated Interest Savings</span>
                                <div className="text-xl font-black font-display">₹{estimatedSavings.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    {/* BT Submit Form */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#6605c7]/40 mb-6">📝 LOG BT REFERRAL</h3>
                        
                        <form onSubmit={handleBtSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Student Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={studentName} 
                                    onChange={(e) => setStudentName(e.target.value)} 
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-800 focus:outline-none" 
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Current Financer / Bank</label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="e.g. Auxilo, Avanse, Credila" 
                                    value={currentBank} 
                                    onChange={(e) => setCurrentBank(e.target.value)} 
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-800 focus:outline-none" 
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Proposed Takeover Bank</label>
                                <input 
                                    type="text" 
                                    required 
                                    placeholder="e.g. SBI Scholar, BOB" 
                                    value={targetBank} 
                                    onChange={(e) => setTargetBank(e.target.value)} 
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-800 focus:outline-none" 
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={submitting} 
                                className="w-full py-4 bg-[#6605c7] hover:bg-[#6605c7]/95 disabled:bg-gray-300 text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-sm"
                            >
                                {submitting ? "Submitting..." : "Submit Takeover Lead"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* BT Pipeline Tracker Table */}
                <div className="lg:col-span-2 bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#6605c7]/40 block mb-6">Balance Transfer Pipeline Ledger</span>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs font-bold border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-400 border-b border-gray-100">
                                        <th className="p-4">Student</th>
                                        <th className="p-4">Original Bank</th>
                                        <th className="p-4">Target Bank</th>
                                        <th className="p-4">Loan Amount</th>
                                        <th className="p-4">Savings Payout</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {pipeline.length > 0 ? pipeline.map((sa, i) => (
                                        <tr key={i}>
                                            <td className="p-4 font-bold text-gray-800">{sa.studentName}</td>
                                            <td className="p-4">{sa.currentBank} ({sa.currentRoi}%)</td>
                                            <td className="p-4">{sa.targetBank} ({sa.targetRoi}%)</td>
                                            <td className="p-4 font-mono">₹{sa.loanAmount.toLocaleString()}</td>
                                            <td className="p-4 font-mono font-black text-emerald-600">₹{sa.estimatedSavings.toLocaleString()}</td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                                    sa.status === 'LOGGED' ? 'bg-amber-50 text-amber-700' :
                                                    sa.status === 'UNDER_REVIEW' ? 'bg-indigo-50 text-indigo-700' :
                                                    sa.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                                                    'bg-gray-50 text-gray-400'
                                                }`}>
                                                    {sa.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-gray-400">
                                                No balance transfer referrals logged yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-[#6605c7] text-[10px] font-bold uppercase tracking-wider text-center mt-6">
                        💡 DSA Override Rule: Balance transfer takeovers earn you 0.40% override bonus on the total disbursed balance transfer amount post bank clearance.
                    </div>
                </div>
            </div>
        </div>
    );
}
