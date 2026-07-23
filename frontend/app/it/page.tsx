"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supportApi, blogApi } from "@/lib/api";

export default function ITOverviewPage() {
    const [ticketStats, setTicketStats] = useState({
        total: 0,
        open: 0,
        resolved: 0,
        critical: 0
    });
    const [recentTickets, setRecentTickets] = useState<any[]>([]);
    const [blogs, setBlogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboard = async () => {
            setLoading(true);
            try {
                const [ticketsRes, dashRes, blogsRes]: [any, any, any] = await Promise.all([
                    supportApi.getTickets({ limit: 25, sortBy: "createdAt", sortOrder: "desc" }).catch(() => ({ data: [] })),
                    supportApi.getDashboard().catch(() => null),
                    blogApi.getAll(1, 10).catch(() => ({ data: [] }))
                ]);

                // Prefer dashboard stats (accurate server-side counts)
                if (dashRes?.stats) {
                    const s = dashRes.stats;
                    setTicketStats({
                        total: s.totalTickets || 0,
                        open: s.openTickets || 0,
                        resolved: (s.resolvedTickets || 0) + (s.closedTickets || 0),
                        critical: s.criticalTickets || 0,
                    });
                } else {
                    // Fallback to computing from ticket list
                    const tData = ticketsRes?.data || ticketsRes || {};
                    const ticketList = Array.isArray(tData.data) ? tData.data : Array.isArray(tData) ? tData : [];
                    const open = ticketList.filter((t: any) => t.status === "open" || t.status === "in_progress").length;
                    const resolved = ticketList.filter((t: any) => t.status === "resolved" || t.status === "closed").length;
                    const critical = ticketList.filter((t: any) => t.priority === "critical" || t.priority === "high").length;
                    setTicketStats({ total: ticketList.length, open, resolved, critical });
                }

                // Recent tickets for the table
                const tData = ticketsRes?.data || ticketsRes || {};
                const ticketList = Array.isArray(tData.data) ? tData.data : Array.isArray(tData) ? tData : [];
                setRecentTickets(ticketList.slice(0, 5));
                setBlogs(blogsRes?.data || []);
            } catch (e) {
                console.error("IT Dashboard error:", e);
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    return (
        <div className="max-w-[1400px] mx-auto space-y-6 animate-fade-in">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-bold uppercase tracking-wider">
                        IT Operations Hub
                    </span>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">
                        Welcome to IT Dashboard
                    </h1>
                    <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
                        Monitor platform Support Tickets, resolve technical queries, and publish Blog CMS content in real-time.
                    </p>
                </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Open Tickets</span>
                        <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center material-symbols-outlined text-[18px]">
                            confirmation_number
                        </span>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900">{ticketStats.open}</p>
                    <p className="text-[11px] text-slate-500 font-semibold mt-1">Requires IT response</p>
                </div>

                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Critical Tickets</span>
                        <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center material-symbols-outlined text-[18px]">
                            warning
                        </span>
                    </div>
                    <p className="text-3xl font-extrabold text-rose-600">{ticketStats.critical}</p>
                    <p className="text-[11px] text-slate-500 font-semibold mt-1">High priority items</p>
                </div>

                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resolved Tickets</span>
                        <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center material-symbols-outlined text-[18px]">
                            check_circle
                        </span>
                    </div>
                    <p className="text-3xl font-extrabold text-emerald-600">{ticketStats.resolved}</p>
                    <p className="text-[11px] text-slate-500 font-semibold mt-1">Successfully closed</p>
                </div>

                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Blog Articles</span>
                        <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center material-symbols-outlined text-[18px]">
                            newspaper
                        </span>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900">{blogs.length}</p>
                    <p className="text-[11px] text-slate-500 font-semibold mt-1">Published CMS posts</p>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Support Tickets Section */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Support Tickets Center</h3>
                            <p className="text-xs text-slate-500">Manage user and staff issues</p>
                        </div>
                        <Link
                            href="/it/tickets"
                            className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all"
                        >
                            View All Tickets →
                        </Link>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {loading ? (
                            <div className="py-8 text-center text-xs text-slate-400">Loading tickets...</div>
                        ) : recentTickets.length > 0 ? (
                            recentTickets.map((t: any) => (
                                <div key={t.id || t._id} className="py-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-900 truncate">{t.subject || "Support Query"}</p>
                                        <p className="text-[10px] text-slate-400">{t.category || "General"} • #{t.ticketNumber || (t.id || '').slice(-6)}</p>
                                    </div>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                                        t.status === 'open' ? 'bg-blue-50 text-blue-600 border border-blue-200' : t.status === 'resolved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {t.status || 'OPEN'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-xs text-slate-400">No support tickets found</div>
                        )}
                    </div>
                </div>

                {/* Blog CMS Section */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Blog CMS Management</h3>
                            <p className="text-xs text-slate-500">Publish & edit platform articles</p>
                        </div>
                        <Link
                            href="/it/blogs?action=create"
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all"
                        >
                            + New Blog Post
                        </Link>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {loading ? (
                            <div className="py-8 text-center text-xs text-slate-400">Loading articles...</div>
                        ) : blogs.length > 0 ? (
                            blogs.slice(0, 5).map((b: any) => (
                                <div key={b.id || b._id} className="py-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-900 truncate">{b.title}</p>
                                        <p className="text-[10px] text-slate-400">{b.category || "General"} • By {b.authorName || "IT Staff"}</p>
                                    </div>
                                    <Link
                                        href="/it/blogs"
                                        className="text-xs text-indigo-600 hover:underline font-bold shrink-0"
                                    >
                                        Edit Article
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-xs text-slate-400">No blog posts found</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
