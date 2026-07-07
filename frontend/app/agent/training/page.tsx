"use client";

import React, { useMemo } from "react";
import { useAgent } from "../AgentContext";

export default function AgentTraining() {
    const {
        lmsModules,
        botMessages,
        botInput, setBotInput,
        handleAskBot, showToast,
        handleCompleteModule
    } = useAgent();

    const completedCount = lmsModules.filter(m => m.completed).length;
    const totalCount = lmsModules.length || 6;
    const completedPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Certificate eligibility: all modules completed → certified
    const certifications = useMemo(() => [
        {
            title: "Certified Education Loan Agent",
            issuer: "Vidyaloans Academy",
            date: completedPct === 100 ? "Jun 2026" : null,
            badge: "workspace_premium",
            unlocked: completedPct === 100,
            color: "text-amber-600",
            bg: "bg-amber-50",
            border: "border-amber-200",
        },
        {
            title: "Abroad Loan Specialist",
            issuer: "Vidyaloans Academy",
            date: completedCount >= 3 ? "Jun 2026" : null,
            badge: "flight_takeoff",
            unlocked: completedCount >= 3,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            border: "border-indigo-200",
        },
        {
            title: "Document Verification Expert",
            issuer: "Vidyaloans Academy",
            date: completedCount >= 1 ? "Jun 2026" : null,
            badge: "verified",
            unlocked: completedCount >= 1,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "border-emerald-200",
        },
    ], [completedCount, completedPct]);

    return (
        <div className="animate-fade-in-up space-y-10 relative z-10">

            {/* Progress Header */}
            <section className="p-8 rounded-[2.5rem] bg-gradient-to-br from-[#6605c7] to-[#8b24e5] text-white shadow-xl relative overflow-hidden">
                <div className="absolute -right-16 -bottom-16 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Agent Learning Center</p>
                        <h2 className="text-2xl font-black font-display tracking-tight">Training &amp; Certification</h2>
                        <p className="text-xs text-white/70 font-medium">Complete modules to unlock certifications and grow your earning tier</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/10 shrink-0 min-w-[200px]">
                        <p className="text-[10px] font-black uppercase text-white/60 tracking-widest mb-2">Overall Progress</p>
                        <p className="text-3xl font-black font-display">{completedPct}%</p>
                        <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{ width: `${completedPct}%` }} />
                        </div>
                        <p className="text-[10px] text-white/60 font-bold mt-1">{completedCount} / {totalCount} modules complete</p>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">

                    {/* LMS Modules — with score bars */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">Agent Learning Modules</h3>
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                                {completedCount}/{totalCount} Passed
                            </span>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {lmsModules.map((m, i) => (
                                <div key={i} className="py-5">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">{m.category}</span>
                                                {m.completed && <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Certified</span>}
                                            </div>
                                            <p className="font-black text-gray-900 text-sm">{m.title}</p>
                                            {m.completed && (
                                                <div className="mt-2 space-y-1">
                                                    <div className="flex justify-between text-[9px] font-bold text-gray-500">
                                                        <span>Score</span>
                                                        <span className="text-emerald-600">{m.score}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${m.score}%` }} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {m.completed ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="flex items-center gap-1 text-emerald-600 font-black text-xs">
                                                        <span className="material-symbols-outlined text-base">verified</span> Passed
                                                    </span>
                                                    <button
                                                        onClick={() => showToast("Certificate PDF downloading...", "success")}
                                                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black uppercase tracking-wider rounded-xl transition-all text-[9px] flex items-center gap-1"
                                                    >
                                                        <span className="material-symbols-outlined text-[11px]">download</span> Cert
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleCompleteModule(m.id)}
                                                    className="px-4 py-2 bg-indigo-50 hover:bg-[#6605c7] hover:text-white text-[#6605c7] font-black uppercase tracking-wider rounded-xl transition-all text-xs flex items-center gap-1.5"
                                                >
                                                    <span className="material-symbols-outlined text-sm">play_arrow</span> Launch
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Certifications Panel */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                        <h3 className="font-display font-black text-xl text-gray-900 mb-6 uppercase tracking-tight">My Certifications</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {certifications.map((cert, idx) => (
                                <div key={idx} className={`p-5 rounded-2xl border ${cert.unlocked ? `${cert.bg} ${cert.border}` : 'bg-gray-50 border-gray-100'} flex flex-col gap-3 transition-all`}>
                                    <span className={`material-symbols-outlined text-2xl ${cert.unlocked ? cert.color : 'text-gray-300'}`}>{cert.badge}</span>
                                    <div>
                                        <p className={`text-xs font-black ${cert.unlocked ? 'text-gray-900' : 'text-gray-400'}`}>{cert.title}</p>
                                        <p className={`text-[9px] font-bold mt-0.5 ${cert.unlocked ? 'text-gray-500' : 'text-gray-300'}`}>{cert.issuer}</p>
                                        {cert.date && <p className="text-[9px] font-black text-emerald-600 mt-1">Issued: {cert.date}</p>}
                                    </div>
                                    {cert.unlocked ? (
                                        <button
                                            onClick={() => showToast(`${cert.title} certificate downloading...`, "success")}
                                            className={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg ${cert.bg} ${cert.color} hover:opacity-80 transition-all flex items-center gap-1`}
                                        >
                                            <span className="material-symbols-outlined text-[11px]">download</span> Download
                                        </button>
                                    ) : (
                                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-wider flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[11px]">lock</span> Locked
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Reference Library */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#6605c7]/40 mb-6">QUICK REFERENCE LIBRARY</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { label: "Approved College List (Bank-wise)", icon: "school", color: "text-indigo-500" },
                                { label: "Bank Product Comparison Sheet", icon: "account_balance", color: "text-[#6605c7]" },
                                { label: "Document Checklist — Domestic Loans", icon: "checklist", color: "text-emerald-600" },
                                { label: "Document Checklist — Abroad Loans", icon: "flight_takeoff", color: "text-amber-600" },
                                { label: "Commission Rate Card (All Tiers)", icon: "payments", color: "text-rose-500" },
                                { label: "FOIR & CIBIL Quick Reference Guide", icon: "analytics", color: "text-blue-600" },
                            ].map((ref, i) => (
                                <button
                                    key={i}
                                    onClick={() => showToast(`${ref.label} PDF downloading...`, "success")}
                                    className="p-4 bg-gray-50 hover:bg-[#6605c7]/5 hover:border-[#6605c7]/20 border border-gray-100 rounded-2xl text-left text-xs font-bold text-gray-800 transition-all flex items-center gap-3 group"
                                >
                                    <span className={`material-symbols-outlined ${ref.color} group-hover:scale-110 transition-transform`}>{ref.icon}</span>
                                    {ref.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">

                    {/* Today's Product Update Widget */}
                    <div className="bg-white border border-[#6605c7]/10 p-6 rounded-[2.5rem] shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6605c7]/50">Today's Update</h3>
                        </div>
                        <div className="space-y-4">
                            {[
                                {
                                    type: "product",
                                    icon: "account_balance",
                                    color: "text-indigo-600 bg-indigo-50",
                                    title: "SBI Scholar Loan — New Rate",
                                    desc: "ROI revised from 8.5% to 8.15% p.a. (effective 01 Jul 2026). Applies to all new sanctioned cases.",
                                    tag: "Rate Change",
                                },
                                {
                                    type: "policy",
                                    icon: "gavel",
                                    color: "text-amber-600 bg-amber-50",
                                    title: "Avanse — Co-Applicant Rule",
                                    desc: "Salaried co-applicant monthly income minimum raised to ₹30,000 (was ₹25,000) for abroad loans.",
                                    tag: "Policy Update",
                                },
                                {
                                    type: "feature",
                                    icon: "new_releases",
                                    color: "text-[#6605c7] bg-[#6605c7]/5",
                                    title: "Portal Update — Tracking Links",
                                    desc: "Student self-tracking link now includes disbursement ETA date display.",
                                    tag: "Feature",
                                },
                            ].map((update, i) => (
                                <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex items-start gap-3">
                                        <span className={`material-symbols-outlined text-base ${update.color.split(" ")[0]} ${update.color.split(" ")[1]} p-2 rounded-xl shrink-0`}>{update.icon}</span>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${update.color}`}>{update.tag}</span>
                                            </div>
                                            <p className="text-xs font-black text-gray-900">{update.title}</p>
                                            <p className="text-[10px] text-gray-500 font-medium mt-0.5">{update.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => showToast("Full product update log opened", "success")}
                            className="w-full mt-4 py-2.5 bg-gray-50 hover:bg-[#6605c7]/5 text-gray-500 hover:text-[#6605c7] rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border border-gray-100"
                        >
                            View All Updates →
                        </button>
                    </div>

                    {/* AI Knowledge Bot Widget */}
                    <div className="bg-white border border-[#6605c7]/10 p-6 rounded-[2.5rem] shadow-sm flex flex-col min-h-[440px]">
                        <div className="space-y-1 mb-4">
                            <h3 className="font-display font-black text-lg text-gray-900 uppercase tracking-tight">AI Knowledge Assistant</h3>
                            <p className="text-gray-400 text-[10px] font-bold">Ask eligibility, product or policy questions instantly</p>
                        </div>

                        <div className="flex-1 border border-gray-100 rounded-2xl p-4 bg-gray-50/50 min-h-[220px] max-h-[280px] overflow-y-auto space-y-3.5 no-scrollbar flex flex-col">
                            {botMessages.length === 0 && (
                                <div className="text-center text-[10px] text-gray-300 font-bold py-8">
                                    Ask anything — e.g. "Which banks accept partial collateral?"
                                </div>
                            )}
                            {botMessages.map((m, i) => (
                                <div key={i} className={`p-3.5 rounded-2xl text-xs max-w-[85%] ${m.sender === 'user' ? 'bg-[#6605c7] text-white self-end rounded-tr-none' : 'bg-white border border-gray-150 text-gray-700 self-start rounded-tl-none'}`}>
                                    {m.text}
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 space-y-2">
                            <div className="flex flex-wrap gap-1.5">
                                {["Collateral rules?", "HDFC TAT?", "CIBIL cutoff?"].map(q => (
                                    <button
                                        key={q}
                                        onClick={() => { /* quick-fill */ }}
                                        className="text-[9px] font-black text-[#6605c7] bg-[#6605c7]/5 hover:bg-[#6605c7]/10 px-2.5 py-1 rounded-full transition-all"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                            <form onSubmit={handleAskBot} className="flex gap-2 pt-1">
                                <input
                                    type="text"
                                    value={botInput}
                                    onChange={(e) => setBotInput(e.target.value)}
                                    placeholder="e.g. Which banks accept partial collateral?"
                                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/15 focus:bg-white transition-all"
                                />
                                <button type="submit" className="w-11 h-11 bg-[#6605c7] hover:bg-[#6605c7]/90 text-white rounded-xl flex items-center justify-center transition-all shadow-sm shrink-0">
                                    <span className="material-symbols-outlined text-base">send</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
