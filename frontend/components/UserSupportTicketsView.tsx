"use client";

import { useState, useEffect } from "react";
import { supportApi } from "@/lib/api";
import SupportTicketModal from "@/components/SupportTicketModal";

interface UserSupportTicketsViewProps {
    userRole?: string;
    userInfo?: {
        id?: string;
        name?: string;
        email?: string;
    };
}

const parseISTDate = (dateVal: any): Date => {
    if (!dateVal) return new Date();
    if (dateVal instanceof Date) return dateVal;
    let s = String(dateVal).trim();
    if (!s.endsWith("Z") && !s.includes("+") && !s.includes("Z")) {
        s += "Z";
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date() : d;
};

const formatIST = (dateVal: any): string => {
    if (!dateVal) return "—";
    const d = parseISTDate(dateVal);
    const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    };
    return new Intl.DateTimeFormat("en-IN", options).format(d);
};

export default function UserSupportTicketsView({ userRole = "student", userInfo }: UserSupportTicketsViewProps) {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
    const [replyText, setReplyText] = useState("");
    const [replying, setReplying] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>("all");

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        setLoading(true);
        try {
            const res = await supportApi.getTickets() as any;
            setTickets(res?.data || []);
        } catch (err) {
            console.error("Failed to load tickets:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTicket = async (t: any) => {
        try {
            const detail = await supportApi.getTicket(t.id) as any;
            setSelectedTicket(detail);
        } catch (err) {
            setSelectedTicket(t);
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedTicket) return;
        setReplying(true);
        try {
            await supportApi.addComment(selectedTicket.id, replyText.trim());
            setReplyText("");
            const updated = await supportApi.getTicket(selectedTicket.id) as any;
            setSelectedTicket(updated);
            loadTickets();
        } catch (err: any) {
            console.error("Failed to send reply:", err);
        } finally {
            setReplying(false);
        }
    };

    const filteredTickets = filterStatus === "all"
        ? tickets
        : tickets.filter((t) => t.status === filterStatus);

    const openCount = tickets.filter((t) => t.status === "open").length;
    const inProgressCount = tickets.filter((t) => t.status === "in_progress" || t.status === "assigned").length;
    const resolvedCount = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;

    return (
        <div className="space-y-6 font-sans">
            {/* Header & Stats Banner */}
            <div className="bg-gradient-to-r from-[#6605c7] to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-black uppercase tracking-wider text-purple-200 border border-white/20">
                        <span className="material-symbols-outlined text-sm">support_agent</span>
                        Support Tickets & Help Center
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">Your Support Desk</h2>
                    <p className="text-xs text-purple-200 font-medium">Track your active issues, uploaded proofs, and official resolution responses.</p>
                </div>
                <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-6 py-3 bg-white text-[#6605c7] hover:bg-purple-50 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg border-0 cursor-pointer flex items-center gap-2 shrink-0"
                >
                    <span className="material-symbols-outlined text-base">add_circle</span>
                    Create Support Ticket
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                    onClick={() => setFilterStatus("all")}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${filterStatus === "all" ? "bg-purple-50 border-[#6605c7] shadow-xs" : "bg-white border-gray-100 hover:bg-gray-50"}`}
                >
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Total Tickets</span>
                    <span className="text-2xl font-black text-gray-900 mt-1 block">{tickets.length}</span>
                </div>
                <div
                    onClick={() => setFilterStatus("open")}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${filterStatus === "open" ? "bg-amber-50 border-amber-400 shadow-xs" : "bg-white border-gray-100 hover:bg-gray-50"}`}
                >
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 block">Open Issues</span>
                    <span className="text-2xl font-black text-amber-700 mt-1 block">{openCount}</span>
                </div>
                <div
                    onClick={() => setFilterStatus("in_progress")}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${filterStatus === "in_progress" ? "bg-blue-50 border-blue-400 shadow-xs" : "bg-white border-gray-100 hover:bg-gray-50"}`}
                >
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 block">In Progress</span>
                    <span className="text-2xl font-black text-blue-700 mt-1 block">{inProgressCount}</span>
                </div>
                <div
                    onClick={() => setFilterStatus("resolved")}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${filterStatus === "resolved" ? "bg-emerald-50 border-emerald-400 shadow-xs" : "bg-white border-gray-100 hover:bg-gray-50"}`}
                >
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">Resolved</span>
                    <span className="text-2xl font-black text-emerald-700 mt-1 block">{resolvedCount}</span>
                </div>
            </div>

            {/* Main Content Area: Ticket List & Detail Pane */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Ticket Cards List */}
                <div className="lg:col-span-1 space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Submitted Tickets</h3>
                        <button
                            type="button"
                            onClick={loadTickets}
                            className="text-xs text-[#6605c7] hover:underline font-bold border-0 bg-transparent cursor-pointer flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-sm">refresh</span> Refresh
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-12 text-center text-xs font-bold text-gray-400 bg-white rounded-3xl border border-gray-100">
                            <div className="w-5 h-5 border-2 border-[#6605c7] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            Loading support tickets...
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="py-12 text-center bg-white rounded-3xl border border-gray-100 p-6 space-y-3">
                            <span className="material-symbols-outlined text-4xl text-purple-200">confirmation_number</span>
                            <p className="text-xs text-gray-500 font-bold">No support tickets found.</p>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(true)}
                                className="px-4 py-2 bg-[#6605c7] text-white text-xs font-bold rounded-xl uppercase tracking-wider border-0 cursor-pointer"
                            >
                                Raise Ticket
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                            {filteredTickets.map((t) => (
                                <div
                                    key={t.id}
                                    onClick={() => handleSelectTicket(t)}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${selectedTicket?.id === t.id
                                            ? "border-[#6605c7] bg-purple-50/50 shadow-md ring-2 ring-[#6605c7]/20"
                                            : "border-gray-100 bg-white hover:border-purple-200 hover:shadow-xs"
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[10px] font-mono font-bold text-[#6605c7] bg-purple-100/60 px-2 py-0.5 rounded-md">{t.ticketNumber}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${t.status === "resolved" ? "bg-emerald-100 text-emerald-700" :
                                                t.status === "closed" ? "bg-gray-100 text-gray-700" :
                                                    t.status === "in_progress" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                                            }`}>
                                            {t.status.replace("_", " ")}
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{t.subject}</h4>
                                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium pt-1 border-t border-gray-100/60">
                                        <span>{t.category}</span>
                                        <span>{formatIST(t.createdAt || t.created_at)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Ticket Detail & Responses */}
                <div className="lg:col-span-2">
                    {selectedTicket ? (
                        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
                            <div className="flex justify-between items-start gap-4 pb-4 border-b border-gray-100">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono font-bold text-[#6605c7] bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">{selectedTicket.ticketNumber}</span>
                                        <span className="text-xs font-bold text-gray-400">{selectedTicket.category}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">{selectedTicket.subject}</h3>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shrink-0 ${selectedTicket.status === "resolved" ? "bg-emerald-100 text-emerald-700" :
                                        selectedTicket.status === "closed" ? "bg-gray-100 text-gray-700" :
                                            selectedTicket.status === "in_progress" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                                    }`}>
                                    {selectedTicket.status.replace("_", " ")}
                                </span>
                            </div>

                            {/* Ticket Description */}
                            <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Description</span>
                                <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-line font-medium">{selectedTicket.description}</p>
                            </div>

                            {/* Proof Attachments */}
                            {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Proof Attachments</span>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedTicket.attachments.map((att: any) => (
                                            <a
                                                key={att.id}
                                                href={`http://localhost:5000${att.filePath}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-xs font-bold text-[#6605c7] transition-all"
                                            >
                                                <span className="material-symbols-outlined text-sm">attachment</span>
                                                {att.fileName}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Updates & Responses Thread */}
                            <div className="space-y-4 pt-2">
                                <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">Official Responses & History</h4>
                                {(!selectedTicket.comments || selectedTicket.comments.length === 0) ? (
                                    <div className="p-6 rounded-2xl bg-purple-50/40 text-center space-y-1 border border-purple-100">
                                        <p className="text-xs font-bold text-[#6605c7]">Ticket Under Review</p>
                                        <p className="text-[11px] text-gray-400">Our resolution team has received your ticket and will update you shortly.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedTicket.comments.map((c: any) => (
                                            <div key={c.id} className="p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs space-y-1.5">
                                                <div className="flex justify-between items-center text-[10px] font-bold">
                                                    <span className="text-[#6605c7] font-black">{c.authorName} ({c.authorRole})</span>
                                                    <span className="text-gray-400">{formatIST(c.createdAt || c.created_at)}</span>
                                                </div>
                                                <p className="text-xs text-gray-700 font-medium leading-relaxed">{c.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Reply Input Box */}
                            <form onSubmit={handleSendReply} className="space-y-2 pt-2 border-t border-gray-100">
                                <textarea
                                    rows={3}
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Write a message or reply to support team..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium text-gray-800 focus:outline-none focus:border-[#6605c7] focus:bg-white transition-all resize-none"
                                />
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={replying || !replyText.trim()}
                                        className="px-6 py-2.5 bg-[#6605c7] hover:bg-[#5204a3] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all border-0 disabled:opacity-50 cursor-pointer shadow-md"
                                    >
                                        {replying ? "Sending..." : "Send Reply"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-3">
                            <span className="material-symbols-outlined text-4xl text-purple-200">touch_app</span>
                            <h4 className="text-sm font-bold text-gray-700">Select a support ticket from the list</h4>
                            <p className="text-xs text-gray-400 max-w-sm mx-auto">Click any ticket on the left pane to review its status, view uploaded proof attachments, or reply to our support team.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Ticket Modal */}
            <SupportTicketModal
                isOpen={isCreateModalOpen}
                onClose={() => { setIsCreateModalOpen(false); loadTickets(); }}
                userRole={userRole}
                userInfo={userInfo}
            />
        </div>
    );
}
