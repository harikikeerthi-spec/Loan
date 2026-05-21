"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export default function Compliance() {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [auditFilter, setAuditFilter] = useState("all");

    // Interactive Policy Evaluator states
    const [selectedRule, setSelectedRule] = useState("cibil");
    const [testValue, setTestValue] = useState("720");
    const [evaluationResult, setEvaluationResult] = useState<any>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);

    // KYC Verification items
    const [kycChecks, setKycChecks] = useState([
        { id: "1", name: "Devendra Kumar", doc: "Aadhaar Card", status: "Verified", date: "May 20, 2026", details: "Biometric e-KYC Match 100%" },
        { id: "2", name: "Priya Sharma", doc: "PAN Card Validation", status: "Verified", date: "May 19, 2026", details: "NSDL Database Match 100%" },
        { id: "3", name: "Rohan Das", doc: "Passport Verification", status: "Pending", date: "May 20, 2026", details: "Manual OCR Match Awaiting Staff Sign-off" },
        { id: "4", name: "Anjali Gupta", doc: "Income Certificate Check", status: "Verified", date: "May 18, 2026", details: "DigiLocker Certified Verification" }
    ]);

    // Bank detection helpers
    const currentBankId = typeof window !== "undefined" ? sessionStorage.getItem("selectedBank") : null;
    const currentBankName = useMemo(() => {
        if (!currentBankId) return user?.firstName || "SBI";
        const map: Record<string, string> = {
            auxilo: "Auxilo Finserve",
            avanse: "Avanse Financial",
            credila: "HDFC Credila",
            idfc: "IDFC FIRST Bank",
            poonawalla: "Poonawalla Fincorp",
        };
        return map[currentBankId] || currentBankId.toUpperCase();
    }, [currentBankId, user]);

    useEffect(() => {
        setMounted(true);
    }, []);

    const runRuleEvaluation = (e: React.FormEvent) => {
        e.preventDefault();
        setIsEvaluating(true);
        setEvaluationResult(null);

        setTimeout(() => {
            setIsEvaluating(false);
            if (selectedRule === "cibil") {
                const score = parseInt(testValue) || 0;
                if (score >= 700) {
                    setEvaluationResult({
                        status: "Approved",
                        summary: "CIBIL Score complies with policy thresholds.",
                        details: `Score: ${score} (Requires minimum 680). Low default probability.`
                    });
                } else {
                    setEvaluationResult({
                        status: "Rejected",
                        summary: "CIBIL Score is below the credit risk cutoff.",
                        details: `Score: ${score} is below cutoff of 680. Requires joint co-borrower collateral backing.`
                    });
                }
            } else if (selectedRule === "dti") {
                const ratio = parseFloat(testValue) || 0;
                if (ratio <= 50) {
                    setEvaluationResult({
                        status: "Approved",
                        summary: "Debt-to-Income (DTI) ratio is within limits.",
                        details: `DTI: ${ratio}% (Max limit 50%). Healthy debt coverage capacity.`
                    });
                } else {
                    setEvaluationResult({
                        status: "Rejected",
                        summary: "DTI ratio violates leverage constraints.",
                        details: `DTI: ${ratio}% exceeds the limit of 50%. Deemed high leverage risk.`
                    });
                }
            } else if (selectedRule === "collateral") {
                const value = parseFloat(testValue) || 0;
                if (value >= 1.2) {
                    setEvaluationResult({
                        status: "Approved",
                        summary: "Collateral Coverage Ratio satisfies safety spreads.",
                        details: `Ratio: ${value}x (Minimum 1.0x cover required). Low loss-given-default profile.`
                    });
                } else {
                    setEvaluationResult({
                        status: "Rejected",
                        summary: "Inadequate Collateral Coverage backing.",
                        details: `Ratio: ${value}x is below standard 1.0x coverage guidelines.`
                    });
                }
            }
        }, 1000);
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen p-8 lg:p-12 transition-all duration-300">
            <div className="max-w-7xl mx-auto space-y-10">

                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
                >
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-[#6605c7] bg-purple-50 p-2 rounded-xl">verified_user</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6605c7]">Risk Node</span>
                        </div>
                        <h1 className="text-4xl font-display font-black text-gray-900 tracking-tight italic uppercase">
                            Risk & Compliance
                        </h1>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                            Verify credit eligibility standards & AML/KYC checks for {currentBankName}
                        </p>
                    </div>

                    <button
                        onClick={() => alert("Downloading secure compliance PDF audits...")}
                        className="px-5 py-3 bg-[#6605c7] text-white hover:bg-[#5204a0] rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-md transition-all"
                    >
                        <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                        Generate Audit Log
                    </button>
                </motion.div>

                {/* Main risk stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card bg-white p-6 border border-gray-100 rounded-[2rem] flex flex-col justify-between shadow-sm">
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Underwriting Threshold</span>
                        <h3 className="text-2xl font-black italic text-[#6605c7]">AML Tier-1 Compliant</h3>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed mt-1">
                            Your branch system conforms 100% to RBI anti-money laundering frameworks.
                        </p>
                    </div>

                    <div className="glass-card bg-white p-6 border border-gray-100 rounded-[2rem] flex flex-col justify-between shadow-sm">
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Audit Score</span>
                        <h3 className="text-2xl font-black italic text-emerald-500">Grade A-Excellent</h3>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed mt-1">
                            Disbursement audits are clean. Zero reporting lapses logged in May 2026.
                        </p>
                    </div>

                    <div className="glass-card bg-white p-6 border border-gray-100 rounded-[2rem] flex flex-col justify-between shadow-sm">
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-1">Automatic OCR Match</span>
                        <h3 className="text-2xl font-black italic text-purple-600">98% Avg Confidence</h3>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed mt-1">
                            High precision document extraction bypasses manual verification bottlenecks.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* LEFT PANEL: POLICY EVALUATOR & CHECKS */}
                    <div className="lg:col-span-8 space-y-6 text-left">
                        
                        {/* Automated AML/KYC check List */}
                        <div className="glass-card bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                            <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-2">Outbox KYC Verification Desk</h3>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-6">List of student files pending or verified by automated clearing check systems</p>

                            <div className="divide-y divide-gray-100">
                                {kycChecks.map((check) => (
                                    <div key={check.id} className="py-4 flex justify-between items-center flex-wrap gap-4 text-xs font-semibold">
                                        <div>
                                            <span className="font-bold text-gray-950 uppercase italic block">{check.name}</span>
                                            <span className="text-[9px] text-[#6605c7] uppercase tracking-widest font-black block mt-0.5">{check.doc}</span>
                                            <span className="text-[9px] text-gray-400 font-bold block mt-1 font-mono">{check.details}</span>
                                        </div>
                                        <div className="text-right flex items-center gap-4">
                                            <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                                check.status === "Verified" ? "bg-emerald-50 text-emerald-500" : "bg-amber-50 text-amber-500 animate-pulse"
                                            }`}>
                                                {check.status}
                                            </span>
                                            {check.status === "Pending" && (
                                                <button
                                                    onClick={() => {
                                                        setKycChecks(prev => prev.map(c => c.id === check.id ? { ...c, status: "Verified", details: "Manual bypass cleared by Officer" } : c));
                                                        alert("Manual verification bypass approved successfully!");
                                                    }}
                                                    className="px-3 py-1 bg-purple-100 hover:bg-[#6605c7] hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                                                >
                                                    Approve
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT PANEL: INTERACTIVE POLICY EVALUATOR */}
                    <div className="lg:col-span-4 space-y-6 text-left">
                        
                        <div className="glass-card bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-md space-y-6">
                            <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">Eligibility Policy Sandbox</h3>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed">
                                Enter mock credit scores to check if applications fit the underwriting policy framework before manual logging.
                            </p>

                            <form onSubmit={runRuleEvaluation} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Credit Metric Rule</label>
                                    <select
                                        value={selectedRule}
                                        onChange={(e) => {
                                            setSelectedRule(e.target.value);
                                            setEvaluationResult(null);
                                            if (e.target.value === "cibil") setTestValue("720");
                                            else if (e.target.value === "dti") setTestValue("45");
                                            else if (e.target.value === "collateral") setTestValue("1.25");
                                        }}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold uppercase focus:outline-none focus:border-[#6605c7]"
                                    >
                                        <option value="cibil">CIBIL Cutoff Score</option>
                                        <option value="dti">Debt-to-Income (DTI) Ratio (%)</option>
                                        <option value="collateral">Collateral Coverage (x Ratio)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-gray-400">Test Entry Value</label>
                                    <input
                                        type="number"
                                        step="0.05"
                                        value={testValue}
                                        onChange={(e) => setTestValue(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7]"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isEvaluating}
                                    className="w-full py-4 bg-[#6605c7] hover:bg-[#5204a0] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    {isEvaluating ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-base">psychology</span>
                                            Evaluate Rule
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Evaluation results */}
                            <AnimatePresence>
                                {evaluationResult && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className={`p-5 rounded-2xl border text-left space-y-2 ${
                                            evaluationResult.status === "Approved" 
                                            ? "bg-emerald-50 border-emerald-200 text-emerald-900" 
                                            : "bg-rose-50 border-rose-200 text-rose-900"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">
                                                {evaluationResult.status === "Approved" ? "check_circle" : "cancel"}
                                            </span>
                                            <span className="text-xs font-black uppercase tracking-wider italic">
                                                Policy {evaluationResult.status}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-bold uppercase tracking-wide leading-relaxed">{evaluationResult.summary}</p>
                                        <p className="text-[9px] text-gray-500 font-mono mt-2 leading-relaxed">{evaluationResult.details}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
