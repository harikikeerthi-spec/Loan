"use client";

import { useState } from "react";
import { adminApi } from "@/lib/api";

export default function OutreachCenterPage() {
    const [emailData, setEmailData] = useState({
        to: "",
        subject: "",
        content: "",
        role: "student",
        isBulk: false
    });
    const [emailLoading, setEmailLoading] = useState(false);

    const handleSendEmail = async () => {
        if (!emailData.subject || !emailData.content) {
            alert("Subject and content are required");
            return;
        }
        if (!emailData.isBulk && !emailData.to) {
            alert("Recipient email is required for direct messages");
            return;
        }

        setEmailLoading(true);
        try {
            await adminApi.sendEmail({
                to: emailData.isBulk ? undefined : emailData.to,
                subject: emailData.subject,
                content: emailData.content,
                role: emailData.isBulk ? emailData.role : undefined,
                isBulk: emailData.isBulk
            });
            alert("Message dispatched successfully");
            setEmailData({ to: "", subject: "", content: "", role: "student", isBulk: false });
        } catch (e: any) {
            alert("Failed to dispatch message: " + (e.message || "Unknown error"));
        } finally {
            setEmailLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in pb-12 font-sans">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-[28px] tracking-tight flex items-center gap-3 font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">
                        Outreach Center
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            GLOBAL READY
                        </span>
                    </h2>
                    <p className="text-slate-500 text-[13px] mt-1 font-medium">Coordinate direct and bulk communication across all platform entities.</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-3xl">
                <h3 className="text-[12px] font-['Playfair_Display',serif] font-extrabold text-[#0d1b2a] uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">send</span>
                    Compose Message
                </h3>
                
                <div className="space-y-5">
                    <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl w-fit mb-4">
                        <button
                            type="button"
                            onClick={() => setEmailData({ ...emailData, isBulk: false })}
                            className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                                !emailData.isBulk
                                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                                    : 'text-slate-555 hover:text-slate-700'
                            }`}
                        >
                            Direct Message
                        </button>
                        <button
                            type="button"
                            onClick={() => setEmailData({ ...emailData, isBulk: true })}
                            className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                                emailData.isBulk
                                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                                    : 'text-slate-555 hover:text-slate-700'
                            }`}
                        >
                            Bulk Broadcast
                        </button>
                    </div>

                    {!emailData.isBulk ? (
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Recipient Email</label>
                            <input
                                type="email"
                                placeholder="student@example.com"
                                value={emailData.to}
                                onChange={e => setEmailData({ ...emailData, to: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-slate-800"
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Target Role Group</label>
                            <select
                                value={emailData.role}
                                onChange={e => setEmailData({ ...emailData, role: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 cursor-pointer"
                            >
                                <option value="student">STUDENTS</option>
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Subject</label>
                        <input
                            type="text"
                            placeholder="Enter email subject"
                            value={emailData.subject}
                            onChange={e => setEmailData({ ...emailData, subject: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-slate-800"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Message Body</label>
                        <textarea
                            placeholder="Type your announcement or message here..."
                            rows={8}
                            value={emailData.content}
                            onChange={e => setEmailData({ ...emailData, content: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-slate-800 min-h-[150px] resize-y"
                        />
                    </div>

                    <button
                        onClick={handleSendEmail}
                        disabled={emailLoading}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/15"
                    >
                        {emailLoading ? (
                            <div className="w-5 h-5 border-2 border-indigo-400 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[16px]">send</span>
                                Send Message
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
