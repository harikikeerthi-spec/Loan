"use client";

import React from "react";
import { useAgent } from "../AgentContext";

export default function AgentTraining() {
    const {
        lmsModules,
        botMessages,
        botInput, setBotInput,
        handleAskBot, showToast,
        handleCompleteModule
    } = useAgent();

    return (
        <div className="animate-fade-in-up space-y-12 relative z-10">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* LMS modules checklists */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                        <h3 className="font-display font-black text-xl text-gray-900 mb-6 uppercase tracking-tight">Agent Learning Center (LMS)</h3>
                        
                        <div className="divide-y divide-gray-50">
                            {lmsModules.map((m, i) => (
                                <div key={i} className="py-4 flex justify-between items-center text-xs">
                                    <div>
                                        <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">{m.category}</span>
                                        <p className="font-black text-gray-900 mt-1">{m.title}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {m.completed ? (
                                            <span className="text-emerald-600 font-bold flex items-center gap-1"><span className="material-symbols-outlined text-sm">verified</span> Passed ({m.score}%)</span>
                                        ) : (
                                            <button onClick={() => handleCompleteModule(m.id)} className="px-4 py-2 bg-indigo-50 hover:bg-[#6605c7] hover:text-white text-[#6605c7] font-black uppercase tracking-wider rounded-xl transition-all">Launch</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reference library downloads */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#6605c7]/40 mb-6">QUICK REFERENCE LIBRARY</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button onClick={() => showToast("College List PDF download starting...", "success")} className="p-4 bg-gray-50 hover:bg-[#6605c7]/5 hover:text-[#6605c7] border border-gray-100 rounded-2xl text-left text-xs font-bold text-gray-800 transition-all flex items-center gap-3">
                                <span className="material-symbols-outlined text-indigo-500">picture_as_pdf</span> Approved College List (Bank-wise)
                            </button>
                            <button onClick={() => showToast("Product sheet comparison PDF download starting...", "success")} className="p-4 bg-gray-50 hover:bg-[#6605c7]/5 hover:text-[#6605c7] border border-gray-100 rounded-2xl text-left text-xs font-bold text-gray-800 transition-all flex items-center gap-3">
                                <span className="material-symbols-outlined text-indigo-500">picture_as_pdf</span> Bank Product Comparison Sheet
                            </button>
                            <button onClick={() => showToast("Document checklist Domestic PDF download starting...", "success")} className="p-4 bg-gray-50 hover:bg-[#6605c7]/5 hover:text-[#6605c7] border border-gray-100 rounded-2xl text-left text-xs font-bold text-gray-800 transition-all flex items-center gap-3">
                                <span className="material-symbols-outlined text-indigo-500">picture_as_pdf</span> Document Checklist (Domestic Loans)
                            </button>
                            <button onClick={() => showToast("Document checklist Abroad PDF download starting...", "success")} className="p-4 bg-gray-50 hover:bg-[#6605c7]/5 hover:text-[#6605c7] border border-gray-100 rounded-2xl text-left text-xs font-bold text-gray-800 transition-all flex items-center gap-3">
                                <span className="material-symbols-outlined text-indigo-500">picture_as_pdf</span> Document Checklist (Abroad Loans)
                            </button>
                        </div>
                    </div>
                </div>

                {/* AI Knowledge Bot Widget */}
                <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[460px]">
                    <div className="flex flex-col h-full justify-between">
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">AI Knowledge Assistant</h3>
                                <p className="text-gray-400 text-xs mt-1">Resolve eligibility criteria questions dynamically.</p>
                            </div>

                            <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 min-h-[220px] max-h-[240px] overflow-y-auto space-y-3.5 no-scrollbar flex flex-col">
                                {botMessages.map((m, i) => (
                                    <div key={i} className={`p-3.5 rounded-2xl text-xs max-w-[85%] ${m.sender === 'user' ? 'bg-[#6605c7] text-white self-end rounded-tr-none' : 'bg-white border border-gray-150 text-gray-700 self-start rounded-tl-none'}`}>
                                        {m.text}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleAskBot} className="flex gap-2 pt-4 border-t border-gray-100 mt-4">
                            <input type="text" value={botInput} onChange={(e) => setBotInput(e.target.value)} placeholder="e.g. Which banks accept partial collateral?" className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-800 focus:outline-none" />
                            <button type="submit" className="w-11 h-11 bg-[#6605c7] hover:bg-[#6605c7]/90 text-white rounded-xl flex items-center justify-center transition-all shadow-sm">
                                <span className="material-symbols-outlined text-base">send</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
