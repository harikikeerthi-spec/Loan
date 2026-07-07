"use client";

import React, { useState } from "react";
import { useAgent } from "../AgentContext";

interface EventQR {
    name: string;
    date: string;
    expiry: string;
    utm: string;
    scans: number;
    isBest?: boolean;
    isArchived?: boolean;
}

export default function AgentQrCode() {
    const { agentProfile, showToast } = useAgent();
    const agencyName = agentProfile?.businessName || "Krishna Agency";
    const agencyCode = "VL-AGT-007";

    // 13.2 Initial Event-Specific QR Codes
    const [eventQRs, setEventQRs] = useState<EventQR[]>([
        {
            name: "Default (Always Active)",
            date: "N/A",
            expiry: "Never",
            utm: "default",
            scans: 12
        },
        {
            name: "IIT Bombay Open Day",
            date: "2-Jun-2026",
            expiry: "After event",
            utm: "iitb_openday",
            scans: 4
        },
        {
            name: "Coaching Center - Ameerpet",
            date: "15-May-2026",
            expiry: "Never",
            utm: "coaching_ameerpet",
            scans: 18,
            isBest: true
        }
    ]);

    // Create Event Form States
    const [eventName, setEventName] = useState("");
    const [eventDate, setEventDate] = useState("28-Jun-2026");
    const [expiryOption, setExpiryOption] = useState("Never");
    const [customUTM, setCustomUTM] = useState("");

    // Selected QR Code state for visual simulator viewing
    const [activeQRName, setActiveQRName] = useState("Default (Always Active)");
    const [activeUTM, setActiveUTM] = useState("default");

    const getReferralUrl = (utm: string) => {
        return `https://apply.vidyaloans.com/?ref=${agencyCode}&utm_source=${utm}`;
    };

    const handleCreateEventQR = (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventName.trim()) {
            showToast("Please enter an event name", "warning");
            return;
        }

        const utmString = customUTM.trim() || eventName.toLowerCase().replace(/[^a-z0-9]/g, "_");
        const newQR: EventQR = {
            name: eventName.trim(),
            date: eventDate,
            expiry: expiryOption,
            utm: utmString,
            scans: 0
        };

        setEventQRs([...eventQRs, newQR]);
        setActiveQRName(newQR.name);
        setActiveUTM(newQR.utm);
        showToast(`Event QR Code generated for "${newQR.name}"!`, "success");
        setEventName("");
        setCustomUTM("");
    };

    const handleDownload = (format: "PNG" | "PDF" | "Poster") => {
        showToast(`Downloading ${activeQRName} QR Code as ${format}...`, "info");
        setTimeout(() => {
            showToast(`${format} file downloaded!`, "success");
        }, 1000);
    };

    const handleCopyLink = (utm: string) => {
        navigator.clipboard.writeText(getReferralUrl(utm));
        showToast("Referral link copied to clipboard!", "success");
    };

    const handleShareWhatsApp = (utm: string) => {
        const text = encodeURIComponent(`Apply for an education loan using this agent-tagged link: ${getReferralUrl(utm)}`);
        window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
        showToast("Sharing via WhatsApp...", "success");
    };

    const handleArchive = (name: string) => {
        setEventQRs(prev => prev.map(q => q.name === name ? { ...q, isArchived: true } : q));
        showToast(`QR Code "${name}" archived successfully.`, "success");
    };

    // Filter non-archived events
    const activeQRs = eventQRs.filter(q => !q.isArchived);

    return (
        <div className="animate-fade-in-up space-y-8 relative z-10 text-left pb-12">
            
            {/* Header banner */}
            <section className="p-8 rounded-[2.5rem] bg-white border border-[#6605c7]/10 shadow-2xl shadow-[#6605c7]/2 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 font-display tracking-tight">QR Code Hub</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5">Module 13 • Generate unique, agent-tagged QR code configurations to scan & capture study loan leads offline</p>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 13.1 Agent QR Code Generator Display */}
                <div className="lg:col-span-1 bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-2xl shadow-[#6605c7]/2 flex flex-col justify-between min-h-[500px]">
                    <div className="space-y-6 text-center">
                        <div className="text-left">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6605c7] block">Scan Badge</span>
                            <h3 className="text-sm font-black text-gray-900 mt-0.5 truncate">
                                MY QR CODE — {agencyName} ({agencyCode})
                            </h3>
                        </div>

                        {/* Interactive QR Code Frame Graphic matching 13.1 */}
                        <div className="w-60 h-60 mx-auto p-5 border border-gray-150 rounded-3xl bg-white shadow-md flex flex-col items-center justify-between relative overflow-hidden group">
                            <div className="w-full flex-1 flex items-center justify-center p-2">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getReferralUrl(activeUTM))}`} 
                                    alt="QR Code Badge" 
                                    className="w-40 h-40 object-contain group-hover:scale-105 transition-transform duration-500" 
                                />
                            </div>
                            <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-2">
                                Scan to apply for education loan
                            </div>
                            <div className="text-[9px] font-black text-[#6605c7] uppercase tracking-wider mt-1">
                                Agent Tagged: {agencyCode}
                            </div>
                        </div>

                        <div className="space-y-1 text-left bg-indigo-50/40 p-3 rounded-2xl border border-indigo-100/50">
                            <span className="text-[9px] font-black text-[#6605c7] uppercase tracking-wider block">Target Landing URL</span>
                            <span className="text-[10px] font-mono text-gray-600 truncate block">{getReferralUrl(activeUTM)}</span>
                        </div>
                    </div>

                    <div className="space-y-2 pt-6 border-t border-gray-50">
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <button onClick={() => handleDownload("PNG")} className="py-2.5 bg-gray-50 border border-gray-100 hover:bg-gray-100 text-gray-600 font-black uppercase rounded-xl flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-sm">image</span> Download PNG
                            </button>
                            <button onClick={() => handleDownload("PDF")} className="py-2.5 bg-gray-50 border border-gray-100 hover:bg-gray-100 text-gray-600 font-black uppercase rounded-xl flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-sm">picture_as_pdf</span> Download PDF
                            </button>
                        </div>
                        <button onClick={() => handleDownload("Poster")} className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-[#6605c7] text-[10px] font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5">
                            <span className="material-symbols-outlined text-base font-bold">newspaper</span> Print-Ready Poster Template
                        </button>
                        <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                            <button onClick={() => handleCopyLink(activeUTM)} className="py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-black uppercase rounded-xl flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-sm">content_copy</span> Copy Link
                            </button>
                            <button onClick={() => handleShareWhatsApp(activeUTM)} className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase rounded-xl flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-sm">chat</span> Share WA
                            </button>
                        </div>
                    </div>
                </div>

                {/* 13.2 Event-Specific QR Codes */}
                <div className="lg:col-span-2 bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-2xl shadow-[#6605c7]/2 space-y-6 flex flex-col justify-between">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* Event QR Creator Form */}
                        <div className="space-y-4">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6605c7] block">Campaign Creator</span>
                                <h3 className="text-lg font-black text-gray-900 font-display tracking-tight">Create Event QR Code</h3>
                            </div>

                            <form onSubmit={handleCreateEventQR} className="space-y-3.5">
                                <div className="space-y-1">
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">Event Name</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. IIT Bombay Career Fair — June 2026"
                                        value={eventName}
                                        onChange={(e) => setEventName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-150 text-xs font-bold text-gray-700 focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#6605c7]/5 transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">Event Date</label>
                                        <input 
                                            type="text"
                                            value={eventDate}
                                            onChange={(e) => setEventDate(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-150 text-xs font-bold text-gray-700 focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#6605c7]/5 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">Expiry Option</label>
                                        <select 
                                            value={expiryOption}
                                            onChange={(e) => setExpiryOption(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-150 text-xs font-bold text-gray-700 focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#6605c7]/5 transition-all"
                                        >
                                            <option value="Never">Never</option>
                                            <option value="After event">After event</option>
                                            <option value="30 days">30 days</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">Custom UTM Slug</label>
                                    <input 
                                        type="text"
                                        placeholder="career_fair_iitb_jun26"
                                        value={customUTM}
                                        onChange={(e) => setCustomUTM(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-150 text-xs font-bold text-gray-700 focus:outline-none focus:bg-white focus:ring-4 focus:ring-[#6605c7]/5 transition-all"
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    className="w-full py-3.5 bg-[#6605c7] hover:bg-[#6605c7]/95 text-white font-black uppercase tracking-wider text-[10px] rounded-xl transition-all shadow-md shadow-[#6605c7]/15"
                                >
                                    Generate Event QR
                                </button>
                            </form>
                        </div>

                        {/* Event QR Directory List */}
                        <div className="space-y-4">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6605c7] block">Directory Ledger</span>
                                <h3 className="text-lg font-black text-gray-900 font-display tracking-tight">My QR Codes</h3>
                            </div>

                            <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                                {activeQRs.map((qr, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => { setActiveQRName(qr.name); setActiveUTM(qr.utm); }}
                                        className={`p-3.5 border rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                            activeQRName === qr.name 
                                                ? 'bg-[#6605c7]/5 border-[#6605c7]/20 shadow-sm' 
                                                : 'bg-gray-50 border-gray-100 hover:bg-gray-100/50'
                                        }`}
                                    >
                                        <div className="min-w-0 flex-1 space-y-0.5">
                                            <p className="text-xs font-black text-gray-900 truncate flex items-center gap-1.5">
                                                {qr.name}
                                                {qr.isBest && <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">✨ Best</span>}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">UTM: {qr.utm}</p>
                                        </div>

                                        <div className="flex items-center gap-3 text-right">
                                            <div>
                                                <p className="text-xs font-black text-gray-900 font-mono">{qr.scans} scans</p>
                                                <p className="text-[8px] text-gray-450 font-bold uppercase">traffic</p>
                                            </div>
                                            
                                            <div className="flex gap-1.5">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleShareWhatsApp(qr.utm); }}
                                                    className="p-1.5 bg-white border border-gray-150 rounded-lg text-gray-500 hover:text-emerald-600 transition-colors"
                                                    title="Share QR Link"
                                                >
                                                    <span className="material-symbols-outlined text-sm font-bold">share</span>
                                                </button>
                                                {qr.name !== "Default (Always Active)" && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleArchive(qr.name); }}
                                                        className="p-1.5 bg-white border border-gray-150 rounded-lg text-gray-500 hover:text-red-500 transition-colors"
                                                        title="Archive"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">archive</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-[#6605c7] text-[10px] font-bold uppercase tracking-wider text-center mt-6">
                        💡 DSA Sourcing Strategy: Separate QR Codes help track event ROI and identify which marketing coaching center conversions are most active.
                    </div>
                </div>

            </div>

            {/* 13.3 QR Scan Analytics */}
            <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-2xl shadow-[#6605c7]/2 space-y-6">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6605c7] block">Performance Suite</span>
                    <h3 className="text-xl font-black font-display tracking-tight mt-0.5 text-gray-900">QR Code Analytics — June 2026</h3>
                </div>

                {/* Main Scan metrics counters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl text-left space-y-1">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Total QR Scans</span>
                        <div className="text-3xl font-black text-gray-900 font-display">34 <span className="text-xs font-normal text-gray-400">students</span></div>
                    </div>
                    <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-left space-y-1">
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider block">Leads Generated</span>
                        <div className="text-3xl font-black text-emerald-700 font-display">28 <span className="text-xs font-black uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded ml-1.5">82% Conv</span></div>
                    </div>
                    <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-left space-y-1">
                        <span className="text-[9px] font-black text-[#6605c7] uppercase tracking-wider block">Leads Proceeding</span>
                        <div className="text-3xl font-black text-indigo-700 font-display">16 <span className="text-xs font-black uppercase tracking-wider bg-indigo-100 px-2 py-0.5 rounded ml-1.5">57% Active</span></div>
                    </div>
                    <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-2xl text-left space-y-1">
                        <span className="text-[9px] font-black text-amber-600 uppercase tracking-wider block">Sanctions from QR</span>
                        <div className="text-3xl font-black text-amber-700 font-display">5 <span className="text-xs font-normal text-gray-400">files</span></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#6605c7]/5 flex items-center justify-center text-[#6605c7]">
                            <span className="material-symbols-outlined text-lg">flag</span>
                        </div>
                        <div>
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">Top QR Source</span>
                            <span className="text-xs font-black text-gray-800">Coaching Center Ameerpet (18 scans)</span>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#6605c7]/5 flex items-center justify-center text-[#6605c7]">
                            <span className="material-symbols-outlined text-lg">location_city</span>
                        </div>
                        <div>
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">Best Cities Scan Traffic</span>
                            <span className="text-xs font-black text-gray-800">Hyderabad (22 scans) • Secunderabad (8 scans)</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
