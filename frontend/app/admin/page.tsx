"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface Stats {
    totalUsers?: number;
    totalBlogs?: number;
    totalApplications?: number;
    totalForumPosts?: number;
}

const navItems = [
    { id: "overview", label: "Overview", icon: "dashboard" },
    { id: "users", label: "Users", icon: "people" },
    { id: "blogs", label: "Blogs", icon: "article" },
    { id: "applications", label: "Applications", icon: "description" },
    { id: "community", label: "Community", icon: "forum" },
];

export default function AdminDashboardPage() {
    const { token } = useAuth();
    const [activeSection, setActiveSection] = useState("overview");
    const [stats, setStats] = useState<Stats>({});
    const [loading, setLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [tableData, setTableData] = useState<any[]>([]);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const res = await fetch(`${API_URL}/admin/stats`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch { /* ignore */ } finally {
                setLoading(false);
            }
        };
        if (token) loadStats();
    }, [token]);

    useEffect(() => {
        const fetchSection = async () => {
            setTableData([]);
            if (activeSection === "overview") return;
            const endpoints: Record<string, string> = {
                users: "/admin/users",
                blogs: "/blogs",
                applications: "/admin/applications",
                community: "/community/posts",
            };
            const url = endpoints[activeSection];
            if (!url) return;
            try {
                const res = await fetch(`${API_URL}${url}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setTableData(Array.isArray(data) ? data : data?.users || data?.blogs || data?.posts || data?.data || []);
            } catch { /* ignore */ }
        };
        fetchSection();
    }, [activeSection, token]);

    const statCards = [
        { label: "Total Users", value: stats.totalUsers, icon: "people", color: "text-blue-500 bg-blue-500/10" },
        { label: "Blog Posts", value: stats.totalBlogs, icon: "article", color: "text-purple-500 bg-purple-500/10" },
        { label: "Loan Applications", value: stats.totalApplications, icon: "description", color: "text-green-500 bg-green-500/10" },
        { label: "Forum Posts", value: stats.totalForumPosts, icon: "forum", color: "text-amber-500 bg-amber-500/10" },
    ];

    return (
        <div className="min-h-screen bg-transparent">
            <Navbar />
            <div className="flex pt-20">
                {/* Sidebar */}
                <aside className="hidden lg:flex flex-col w-64 h-[calc(100vh-80px)] sticky top-20 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 p-4">
                    <div className="mb-8 px-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold">
                            <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                            Admin Panel
                        </div>
                    </div>
                    <nav className="space-y-1 flex-1">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === item.id
                                        ? "bg-[#6605c7] text-white shadow-lg shadow-[#6605c7]/20"
                                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800"
                                    }`}
                            >
                                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </nav>
                    <div className="mt-auto p-4">
                        <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                            Back to Site
                        </Link>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6 lg:p-8 overflow-auto">
                    {activeSection === "overview" && (
                        <div>
                            <h1 className="text-2xl font-bold dark:text-white mb-8">Admin Overview</h1>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                                {statCards.map((s) => (
                                    <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${s.color}`}>
                                            <span className="material-symbols-outlined">{s.icon}</span>
                                        </div>
                                        <div className="text-3xl font-bold dark:text-white">
                                            {loading ? <span className="h-8 bg-gray-100 dark:bg-slate-700 animate-pulse rounded block w-12" /> : s.value ?? "—"}
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1">{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {navItems.slice(1).map((n) => (
                                    <button key={n.id} onClick={() => setActiveSection(n.id)}
                                        className="flex items-center gap-4 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:border-[#6605c7]/30 transition-all text-left group">
                                        <div className="w-12 h-12 bg-[#6605c7]/10 rounded-xl flex items-center justify-center text-[#6605c7] group-hover:bg-[#6605c7] group-hover:text-white transition-all">
                                            <span className="material-symbols-outlined">{n.icon}</span>
                                        </div>
                                        <div>
                                            <div className="font-bold dark:text-white">{n.label}</div>
                                            <div className="text-sm text-gray-500">Manage {n.label.toLowerCase()}</div>
                                        </div>
                                        <span className="material-symbols-outlined ml-auto text-gray-300 group-hover:text-[#6605c7]">chevron_right</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection !== "overview" && (
                        <div>
                            <h1 className="text-2xl font-bold dark:text-white mb-8 capitalize">{activeSection} Management</h1>
                            {tableData.length === 0 ? (
                                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl">
                                    <span className="material-symbols-outlined text-6xl text-gray-300 block mb-4">inbox</span>
                                    <p className="text-gray-500">No data available</p>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 dark:bg-slate-900">
                                                <tr>
                                                    {Object.keys(tableData[0] || {}).slice(0, 6).map((k) => (
                                                        <th key={k} className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                            {k}
                                                        </th>
                                                    ))}
                                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                                {tableData.slice(0, 20).map((row, i) => (
                                                    <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                                        {Object.entries(row).slice(0, 6).map(([k, v]) => (
                                                            <td key={k} className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                                                                {typeof v === "boolean" ? (v ? "Yes" : "No") :
                                                                    typeof v === "object" ? JSON.stringify(v).slice(0, 50) :
                                                                        String(v ?? "—").slice(0, 60)}
                                                            </td>
                                                        ))}
                                                        <td className="px-6 py-4">
                                                            <button className="text-xs text-red-500 font-bold hover:underline">Delete</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
