"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

// --- Components ---

const SettingSection = ({ icon, title, subtitle, children, delay = 0 }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.6 }}
        className="glass-card p-10 rounded-[3.5rem] bg-white/70 border-[#6605c7]/10 relative overflow-hidden group shadow-2xl shadow-purple-900/[0.02]"
    >
        <div className="flex items-center gap-6 mb-10 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-[#6605c7]/5 flex items-center justify-center text-[#6605c7] group-hover:bg-[#6605c7] group-hover:text-white transition-all duration-500 shadow-sm">
                <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
            <div>
                <h3 className="text-xl font-black font-display text-gray-900 tracking-tight italic uppercase">{title}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1.5 italic">{subtitle}</p>
            </div>
        </div>
        <div className="relative z-10 space-y-8">
            {children}
        </div>
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#6605c7]/5 rounded-full blur-3xl group-hover:bg-[#6605c7]/10 transition-colors" />
    </motion.div>
);

const InputField = ({ label, value, type = "text", placeholder, icon }: any) => (
    <div className="space-y-4">
        <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 block ml-1">{label}</label>
        <div className="relative group">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl group-focus-within:text-[#6605c7] transition-colors">{icon}</span>
            <input
                type={type}
                defaultValue={value}
                placeholder={placeholder}
                className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-[11px] font-black focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 focus:border-[#6605c7]/20 transition-all uppercase tracking-widest placeholder:text-gray-300"
            />
        </div>
    </div>
);

const ToggleSwitch = ({ label, description, defaultChecked }: any) => (
    <div className="flex items-center justify-between p-6 rounded-3xl bg-gray-50/30 border border-gray-100 group hover:bg-[#6605c7]/5 transition-all">
        <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">{label}</p>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em]">{description}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked={defaultChecked} className="sr-only peer" />
            <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#6605c7]/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6605c7]"></div>
        </label>
    </div>
);

// --- Page ---

export default function BankSettings() {
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            alert("Protocol Synchronized Successfully.");
        }, 1500);
    };

    return (
        <div className="p-8 lg:p-12 space-y-12 animate-fade-in relative z-10 pb-32">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-4">
                <div className="space-y-4">
                    <h2 className="text-5xl lg:text-6xl font-black font-display text-gray-900 tracking-tighter italic leading-none">
                        System <span className="text-[#6605c7]">Config</span>
                    </h2>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] flex items-center gap-2 pl-1">
                        <span className="material-symbols-outlined text-xs">settings_suggest</span>
                        Terminal Preferences Protocol v4.0
                    </p>
                </div>
                
                <div className="flex gap-4">
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="px-10 py-5 rounded-[2rem] bg-[#6605c7] text-white flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-purple-500/30 group hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70"
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <span className="material-symbols-outlined text-xl group-hover:rotate-180 transition-transform duration-700">sync</span>
                        )}
                        Sync Changes
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Node Identity */}
                <SettingSection icon="account_circle" title="Node Identity" subtitle="Primary Profile Configuration" delay={0.1}>
                    <div className="flex flex-col md:flex-row gap-10 items-center mb-6">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-[#6605c7] to-[#8b24e5] flex items-center justify-center text-white text-4xl font-black font-display italic shadow-2xl shadow-purple-500/30 group-hover:rotate-6 transition-all duration-500">
                                {user?.firstName?.[0] || "B"}{user?.lastName?.[0] || "N"}
                            </div>
                            <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center text-[#6605c7] hover:bg-[#6605c7] hover:text-white transition-all">
                                <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                        </div>
                        <div className="flex-1 space-y-4 text-center md:text-left">
                            <h4 className="text-2xl font-black font-display text-gray-900 tracking-tight italic uppercase">{user?.firstName} {user?.lastName}</h4>
                            <p className="text-[10px] font-black text-[#6605c7] uppercase tracking-[0.3em] bg-[#6605c7]/5 px-4 py-1.5 rounded-full inline-block border border-[#6605c7]/10 italic">Senior Node Auditor</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Identity Name" value={user?.firstName} icon="person" />
                        <InputField label="Identity Surname" value={user?.lastName} icon="badge" />
                        <InputField label="Quantum Email" value={user?.email} icon="alternate_email" />
                        <InputField label="Bio Node" value="+91 98765 43210" icon="phone_iphone" />
                    </div>
                </SettingSection>

                {/* Signal Matrix */}
                <SettingSection icon="notifications_active" title="Signal Matrix" subtitle="Notification Channel Preferences" delay={0.2}>
                    <div className="space-y-4">
                        <ToggleSwitch label="WhatsApp Sync" description="Real-time transmission to mobile node" defaultChecked={true} />
                        <ToggleSwitch label="Email Dispatch" description="Secure audit trail for all events" defaultChecked={true} />
                        <ToggleSwitch label="System Alerts" description="Visual pulse indicators in terminal" defaultChecked={true} />
                        <ToggleSwitch label="Biometric Pulse" description="Require node verification for changes" defaultChecked={false} />
                    </div>
                </SettingSection>

                {/* Secure Protocol */}
                <SettingSection icon="security" title="Secure Protocol" subtitle="Authentication & Encryption Access" delay={0.3}>
                    <div className="space-y-6">
                        <InputField label="Current Protocol (Password)" type="password" placeholder="••••••••••••" icon="lock_open" />
                        <InputField label="New Protocol" type="password" placeholder="ENTROPY REQ: HIGH" icon="lock" />
                        <InputField label="Confirm Protocol" type="password" placeholder="RE-ENTER SEQUENCE" icon="verified_user" />
                    </div>
                    <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                                <span className="material-symbols-outlined text-xl">shield_moon</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">2FA Node Status: <span className="text-emerald-500">ACTIVE</span></span>
                        </div>
                        <button className="text-[10px] font-black uppercase tracking-widest text-[#6605c7] hover:underline underline-offset-8">Rotate Keys</button>
                    </div>
                </SettingSection>

                {/* Core Preferences */}
                <SettingSection icon="settings_accessibility" title="Core Preferences" subtitle="Environment & Display Parameters" delay={0.4}>
                    <div className="space-y-4">
                        <div className="p-6 rounded-3xl bg-gray-50/30 border border-gray-100 space-y-4">
                            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 block">Terminal Aesthetic</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['Luminous', 'Eclipse', 'System'].map((theme) => (
                                    <button key={theme} className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${theme === 'Luminous' ? 'bg-[#6605c7] text-white border-[#6605c7] shadow-lg shadow-purple-500/20' : 'bg-white text-gray-400 border-gray-100 hover:border-[#6605c7]/20'}`}>
                                        {theme}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 rounded-3xl bg-gray-50/30 border border-gray-100 space-y-4">
                            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 block">Synchronization Interval</label>
                            <select className="w-full bg-white border border-gray-100 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 transition-all appearance-none italic">
                                <option>REAL-TIME (CONTINUOUS)</option>
                                <option>5 MINUTE PULSE</option>
                                <option>15 MINUTE PULSE</option>
                                <option>HOURLY SYNC</option>
                            </select>
                        </div>
                    </div>
                </SettingSection>
            </div>
            
            {/* Mesh background subtle overlay */}
            <div className="fixed inset-0 bg-mesh-gradient opacity-[0.03] pointer-events-none -z-10" />
        </div>
    );
}
