"use client";

import React, { useState } from "react";
import { useAgent } from "../AgentContext";

export default function AgentWhatsAppBot() {
    const { showToast } = useAgent();

    // Local configuration states
    const [welcomeMsg, setWelcomeMsg] = useState(true);
    const [slaDigest, setSlaDigest] = useState(true);
    const [queryAlerts, setQueryAlerts] = useState(true);
    
    const [customWelcomeText, setCustomWelcomeText] = useState("Hello! Welcome to VidyaLoan Education Financing. I am your automated financing advisor helper. Let me know if you need to trace your document verification or bank status!");

    const handleSaveBotSettings = () => {
        showToast("WhatsApp bot configurations saved successfully!", "success");
    };

    return (
        <div className="animate-fade-in-up space-y-12 relative z-10 text-left">
            
            {/* Header info */}
            <section className="p-8 rounded-[2.5rem] bg-white border border-[#6605c7]/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 font-display">WhatsApp Bot Settings</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Configure automated notifications, command helpers, and query chase sequences</p>
                </div>
                <button onClick={handleSaveBotSettings} className="px-6 py-3 bg-[#6605c7] text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#6605c7]/95 transition-all shadow-sm">
                    Save Bot Rules
                </button>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration panel */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Bot Toggles */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm space-y-6">
                        <h3 className="font-display font-black text-lg text-gray-900 uppercase tracking-tight">Active Automation Triggers</h3>
                        
                        <div className="space-y-4">
                            <label className="flex items-start gap-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer hover:bg-gray-100/50 transition-all">
                                <input 
                                    type="checkbox" 
                                    checked={welcomeMsg} 
                                    onChange={(e) => setWelcomeMsg(e.target.checked)} 
                                    className="w-5 h-5 rounded text-[#6605c7] focus:ring-[#6605c7] mt-1" 
                                />
                                <div className="text-xs space-y-1">
                                    <span className="font-bold text-gray-805 block">Enable Welcome Message</span>
                                    <p className="text-gray-400 font-medium">Sends an immediate WhatsApp alert to new referrals containing signup confirmation and their self-tracking dashboard link.</p>
                                </div>
                            </label>

                            <label className="flex items-start gap-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer hover:bg-gray-100/50 transition-all">
                                <input 
                                    type="checkbox" 
                                    checked={slaDigest} 
                                    onChange={(e) => setSlaDigest(e.target.checked)} 
                                    className="w-5 h-5 rounded text-[#6605c7] focus:ring-[#6605c7] mt-1" 
                                />
                                <div className="text-xs space-y-1">
                                    <span className="font-bold text-gray-805 block">Enable Daily SLA Breach Digest</span>
                                    <p className="text-gray-400 font-medium">Dispatches a summary reports alert of applications nearing verification or sanction expiry thresholds every morning at 9:00 AM.</p>
                                </div>
                            </label>

                            <label className="flex items-start gap-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer hover:bg-gray-100/50 transition-all">
                                <input 
                                    type="checkbox" 
                                    checked={queryAlerts} 
                                    onChange={(e) => setQueryAlerts(e.target.checked)} 
                                    className="w-5 h-5 rounded text-[#6605c7] focus:ring-[#6605c7] mt-1" 
                                />
                                <div className="text-xs space-y-1">
                                    <span className="font-bold text-gray-805 block">Enable Query Escalation Auto-Alerts</span>
                                    <p className="text-gray-400 font-medium">Instantly messages both the student co-applicant and you when bank partner raises a discrepancy request or rejects a document template.</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Customizable templates */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm space-y-4">
                        <h3 className="font-display font-black text-lg text-gray-900 uppercase tracking-tight">Onboarding Message Template</h3>
                        <div className="space-y-1 text-xs">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase">Custom welcome text content</label>
                            <textarea 
                                rows={4} 
                                value={customWelcomeText} 
                                onChange={(e) => setCustomWelcomeText(e.target.value)} 
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#6605c7]/15 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Commands documentation card */}
                <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#6605c7]/40 block mb-6">WhatsApp Interactive Bot Commands</span>
                        <p className="text-xs text-gray-400 mb-6">Your sub-agents and students can message the Twilio WhatsApp bridge number with the following query triggers to interact dynamically:</p>
                        
                        <div className="space-y-4 text-xs">
                            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-1">
                                <span className="font-mono font-bold text-[#6605c7]">!status [Ref_No]</span>
                                <p className="text-gray-550">Returns real-time milestone status details and pending queries of the reference number application.</p>
                            </div>
                            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-1">
                                <span className="font-mono font-bold text-[#6605c7]">!cibil [Co-App_CIBIL]</span>
                                <p className="text-gray-550">Runs instant calculations matching lender matrix grids to yield eligibility matching recommendations.</p>
                            </div>
                            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-1">
                                <span className="font-mono font-bold text-[#6605c7]">!docs [Domestic/Abroad]</span>
                                <p className="text-gray-550">Responds with the complete PDF checklist criteria required to submit a loan file for review.</p>
                            </div>
                            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-1">
                                <span className="font-mono font-bold text-[#6605c7]">!help</span>
                                <p className="text-gray-550">Lists out all active interactive triggers and helpline counselor contact routes.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-[#6605c7] text-[10px] font-bold uppercase tracking-wider text-center mt-6">
                        💬 Active WhatsApp Gateway: +1 (415) 523-8886 (Sandbox)
                    </div>
                </div>
            </div>
        </div>
    );
}
