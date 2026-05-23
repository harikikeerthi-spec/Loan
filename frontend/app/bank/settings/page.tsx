"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/bank/SharedUI";

export default function BankSettings() {
    const [mounted, setMounted] = useState(false);
    const { user } = useAuth();

    // Settings States
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [smsAlerts, setSmsAlerts] = useState(false);
    const [autoAssign, setAutoAssign] = useState(true);
    const [slaThreshold, setSlaThreshold] = useState("48");
    const [themeMode, setThemeMode] = useState("light");
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaveStatus("idle");

        setTimeout(() => {
            setSaving(false);
            setSaveStatus("success");
            setTimeout(() => setSaveStatus("idle"), 3000);
        }, 1200);
    };

    if (!mounted || !user) return null;

    return (
        <div className="p-8 lg:p-12 space-y-8 max-w-4xl mx-auto relative z-10">
            {/* Page Header */}
            <PageHeader 
                title="Settings & Profile" 
                description="Manage your credit auditor account settings, configure automated task rules, and adjust notification preferences."
                moduleName="Settings Hub"
                icon="settings"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="glass-card bg-white/80 backdrop-blur-md border border-purple-50 p-6 rounded-3xl text-center relative overflow-hidden shadow-lg shadow-purple-900/[0.01]">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-600 to-indigo-600" />
                        
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6605c7] to-[#8b24e5] text-white flex items-center justify-center text-2xl font-black italic mx-auto shadow-md shadow-purple-500/25 mb-4">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        
                        <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">
                            {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-[9px] font-black text-[#6605c7] uppercase tracking-widest mt-1">
                            Bank Auditor Node
                        </p>
                        
                        <div className="border-t border-purple-50/50 mt-6 pt-6 text-left space-y-3">
                            <div>
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Email Address</span>
                                <span className="text-xs font-semibold text-gray-700 block truncate">{user.email}</span>
                            </div>
                            <div>
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Linked Institution</span>
                                <span className="text-xs font-bold text-gray-700 block">State Bank of India</span>
                            </div>
                            <div>
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Security Protocol</span>
                                <span className="text-xs font-black text-emerald-600 flex items-center gap-1 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Active 2FA OTP
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Settings Configuration */}
                <div className="md:col-span-2">
                    <form onSubmit={handleSave} className="glass-card bg-white/80 backdrop-blur-md border border-purple-50 p-8 rounded-3xl space-y-6 shadow-lg shadow-purple-900/[0.01]">
                        <h3 className="text-base font-black text-gray-900 uppercase tracking-tight border-b border-purple-50/50 pb-4 mb-4">
                            System Preferences
                        </h3>

                        {/* Toggles */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-1">
                                <div>
                                    <h4 className="text-xs font-black text-gray-800 uppercase tracking-wide">Email Transmissions</h4>
                                    <p className="text-[9px] text-gray-400 mt-0.5">Send a digest of incoming application files daily.</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setEmailAlerts(!emailAlerts)}
                                    className={`w-10 h-6 rounded-full transition-all relative ${emailAlerts ? 'bg-[#6605c7]' : 'bg-gray-200'}`}
                                >
                                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all ${emailAlerts ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="flex justify-between items-center py-1">
                                <div>
                                    <h4 className="text-xs font-black text-gray-800 uppercase tracking-wide">SMS Security Alerts</h4>
                                    <p className="text-[9px] text-gray-400 mt-0.5">Alert mobile phone when critical priority file is logged.</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setSmsAlerts(!smsAlerts)}
                                    className={`w-10 h-6 rounded-full transition-all relative ${smsAlerts ? 'bg-[#6605c7]' : 'bg-gray-200'}`}
                                >
                                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all ${smsAlerts ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="flex justify-between items-center py-1">
                                <div>
                                    <h4 className="text-xs font-black text-gray-800 uppercase tracking-wide">Auto-Allocation Algorithm</h4>
                                    <p className="text-[9px] text-gray-400 mt-0.5">Distribute incoming files to active credit officers automatically.</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setAutoAssign(!autoAssign)}
                                    className={`w-10 h-6 rounded-full transition-all relative ${autoAssign ? 'bg-[#6605c7]' : 'bg-gray-200'}`}
                                >
                                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all ${autoAssign ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>

                        {/* Select fields */}
                        <div className="grid grid-cols-2 gap-4 border-t border-purple-50/50 pt-6">
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">SLA Escalation Threshold</label>
                                <select 
                                    value={slaThreshold}
                                    onChange={(e) => setSlaThreshold(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] text-gray-700"
                                >
                                    <option value="24">24 Hours (Aggressive)</option>
                                    <option value="48">48 Hours (Standard)</option>
                                    <option value="72">72 Hours (Relaxed)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Portal Interface Theme</label>
                                <select 
                                    value={themeMode}
                                    onChange={(e) => setThemeMode(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] text-gray-700"
                                >
                                    <option value="light">Glass Violet (Default)</option>
                                    <option value="dark">Monochrome Dark</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-between items-center border-t border-purple-50/50 pt-6">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                {saveStatus === "success" && (
                                    <span className="text-emerald-600 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">check_circle</span>
                                        Configuration updated successfully
                                    </span>
                                )}
                            </span>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-3 bg-[#6605c7] hover:bg-[#8b24e5] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm font-black">save</span>
                                {saving ? "Saving Changes..." : "Save Preferences"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
