"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import Navbar from "@/components/Navbar";

interface DashboardData {
    applicationCount?: number;
    applications?: Array<{
        id: string;
        bank: string;
        amount: number;
        status: string;
        createdAt: string;
    }>;
    recommendedLoans?: Array<{ name: string; rate: string }>;
    documents?: Array<{ name: string; status: string }>;
    aiToolsUsed?: number;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [data, setData] = useState<DashboardData>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    const loadData = useCallback(async () => {
        if (!user?.email) return;
        setLoading(true);
        try {
            const dash = await authApi.getDashboard(user.email) as {
                success: boolean;
                user?: { id: string };
                applicationCount?: number;
                applications?: DashboardData["applications"];
            };
            if (dash?.success && dash.user?.id) {
                const dynamic = await authApi.getDashboardData(dash.user.id) as {
                    success: boolean;
                    applicationCount?: number;
                    applications?: DashboardData["applications"];
                };
                if (dynamic?.success) {
                    setData({
                        applicationCount: dynamic.applicationCount || 0,
                        applications: dynamic.applications || [],
                    });
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user?.email]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const stats = [
        { icon: "description", label: "Loan Applications", value: data.applicationCount ?? 0, color: "text-purple-500", bg: "bg-purple-500/10" },
        { icon: "account_balance", label: "Partner Banks", value: "50+", color: "text-blue-500", bg: "bg-blue-500/10" },
        { icon: "psychology", label: "AI Tools Available", value: "7", color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { icon: "school", label: "Universities Covered", value: "3K+", color: "text-amber-500", bg: "bg-amber-500/10" },
    ];

    const quickLinks = [
        { href: "/apply-loan", icon: "add_circle", label: "Apply for Loan", desc: "Start a new application", color: "from-purple-500 to-indigo-600" },
        { href: "/emi", icon: "calculate", label: "EMI Calculator", desc: "Plan your repayments", color: "from-blue-500 to-cyan-600" },
        { href: "/sop-writer", icon: "auto_fix_high", label: "AI SOP Writer", desc: "Draft your statement", color: "from-pink-500 to-rose-600" },
        { href: "/compare-loans", icon: "compare", label: "Compare Loans", desc: "Find the best rates", color: "from-amber-500 to-orange-600" },
        { href: "/explore", icon: "forum", label: "Community", desc: "Ask & share advice", color: "from-emerald-500 to-teal-600" },
        { href: "/onboarding", icon: "rocket_launch", label: "Get Started", desc: "Personalized journey", color: "from-violet-500 to-purple-600" },
    ];

    return (
        <div className="min-h-screen bg-transparent">
            <Navbar />

            <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
                {/* Welcome Banner */}
                <div className="mb-10 bg-gradient-to-r from-[#6605c7] to-purple-700 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-64 opacity-10">
                        <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=500&q=20')] bg-cover" />
                    </div>
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold mb-4">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                            </span>
                            Active Account
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold font-display mb-2">
                            Welcome back, {user?.firstName || user?.email?.split("@")[0]}! 👋
                        </h1>
                        <p className="text-purple-100 text-lg mb-6">Ready to take the next step in your education journey?</p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/apply-loan" className="px-6 py-3 bg-white text-[#6605c7] font-bold rounded-xl hover:bg-gray-50 transition-all">
                                Apply for Loan
                            </Link>
                            <Link href="/onboarding" className="px-6 py-3 bg-white/10 text-white border border-white/20 font-bold rounded-xl hover:bg-white/20 transition-all">
                                View Roadmap
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {stats.map((s) => (
                        <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-all">
                            <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center ${s.color} mb-4`}>
                                <span className="material-symbols-outlined">{s.icon}</span>
                            </div>
                            <div className="text-3xl font-bold dark:text-white">
                                {loading ? <span className="h-8 bg-gray-100 dark:bg-slate-700 rounded animate-pulse block w-16" /> : s.value}
                            </div>
                            <div className="text-sm text-gray-500 font-medium mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar">
                    {["overview", "applications", "documents", "profile"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all whitespace-nowrap ${activeTab === tab
                                    ? "bg-[#6605c7] text-white shadow-lg shadow-[#6605c7]/20"
                                    : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Quick Actions */}
                        <div className="lg:col-span-2">
                            <h2 className="text-xl font-bold dark:text-white mb-6">Quick Actions</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {quickLinks.map((l) => (
                                    <Link key={l.href} href={l.href} className="group p-5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all">
                                        <div className={`w-10 h-10 bg-gradient-to-r ${l.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                                            <span className="material-symbols-outlined text-lg">{l.icon}</span>
                                        </div>
                                        <div className="font-bold text-sm dark:text-white">{l.label}</div>
                                        <div className="text-xs text-gray-500 mt-1">{l.desc}</div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Progress Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6">
                            <h2 className="text-xl font-bold dark:text-white mb-6">My Journey</h2>
                            <div className="space-y-6">
                                {[
                                    { label: "Profile Completion", percent: 70, color: "bg-purple-500" },
                                    { label: "Documents Uploaded", percent: 40, color: "bg-blue-500" },
                                    { label: "Application Status", percent: data.applicationCount ? 100 : 0, color: "bg-green-500" },
                                ].map((p) => (
                                    <div key={p.label}>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm font-medium dark:text-gray-300">{p.label}</span>
                                            <span className="text-sm font-bold text-[#6605c7]">{p.percent}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div className={`h-full ${p.color} rounded-full transition-all duration-1000`} style={{ width: `${p.percent}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 p-4 rounded-xl bg-[#6605c7]/5 border border-[#6605c7]/10">
                                <p className="text-xs text-gray-500 mb-3">Next Step</p>
                                <p className="text-sm font-bold dark:text-white">Complete your document upload to speed up loan processing</p>
                                <Link href="/apply-loan" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#6605c7] hover:underline">
                                    Upload Documents <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Applications Tab */}
                {activeTab === "applications" && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold dark:text-white">My Applications</h2>
                            <Link href="/apply-loan" className="px-4 py-2 bg-[#6605c7] text-white text-sm font-bold rounded-xl">
                                + New Application
                            </Link>
                        </div>
                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-20 bg-gray-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : !data.applications?.length ? (
                            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl">
                                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4 block">description</span>
                                <p className="text-gray-500 text-lg font-medium">No applications yet</p>
                                <p className="text-gray-400 text-sm mt-2 mb-6">Start your education loan journey today</p>
                                <Link href="/apply-loan" className="px-6 py-3 bg-[#6605c7] text-white font-bold rounded-xl">
                                    Apply Now
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {data.applications.map((app) => (
                                    <div key={app.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-[#6605c7]/10 rounded-xl flex items-center justify-center text-[#6605c7]">
                                                <span className="material-symbols-outlined">account_balance</span>
                                            </div>
                                            <div>
                                                <div className="font-bold dark:text-white">{app.bank}</div>
                                                <div className="text-sm text-gray-500">₹{app.amount?.toLocaleString("en-IN")}</div>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${app.status === "approved" ? "bg-green-100 text-green-700" :
                                                app.status === "pending" ? "bg-amber-100 text-amber-700" :
                                                    "bg-gray-100 text-gray-700"
                                            }`}>
                                            {app.status?.toUpperCase()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Profile Tab */}
                {activeTab === "profile" && (
                    <div className="max-w-2xl">
                        <h2 className="text-xl font-bold dark:text-white mb-6">My Profile</h2>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-100 dark:border-slate-700">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-20 h-20 bg-[#6605c7] rounded-full flex items-center justify-center text-white text-3xl font-bold">
                                    {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold dark:text-white">
                                        {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "User"}
                                    </h3>
                                    <p className="text-gray-500">{user?.email}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                {[
                                    { label: "First Name", value: user?.firstName || "—" },
                                    { label: "Last Name", value: user?.lastName || "—" },
                                    { label: "Email", value: user?.email || "—" },
                                    { label: "Role", value: user?.role || "user" },
                                ].map((f) => (
                                    <div key={f.label}>
                                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{f.label}</label>
                                        <p className="text-sm font-medium dark:text-white mt-1">{f.value}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8">
                                <Link href="/profile" className="px-6 py-3 bg-[#6605c7] text-white font-bold rounded-xl text-sm">
                                    Edit Profile
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Documents Tab */}
                {activeTab === "documents" && (
                    <div>
                        <h2 className="text-xl font-bold dark:text-white mb-6">My Documents</h2>
                        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl">
                            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4 block">folder_open</span>
                            <p className="text-gray-500 font-medium">No documents uploaded yet</p>
                            <p className="text-gray-400 text-sm mt-2">Upload required documents for faster loan processing</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
