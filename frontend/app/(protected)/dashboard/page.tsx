"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import Navbar from "@/components/Navbar";
import ProgressTracker from "@/components/ProgressTracker";

interface DashboardData {
    applicationCount?: number;
    applications?: Array<{
        id: string;
        bank: string;
        amount: number;
        status: string;
        createdAt: string;
        loanType?: string;
        universityName?: string;
        country?: string;
        courseName?: string;
        stage?: string;
        progress?: number;
        applicationNumber?: string;
        submittedAt?: string;
        date?: string;
        firstName?: string;
        lastName?: string;
        remarks?: string;
    }>;
    recommendedLoans?: Array<{ name: string; rate: string }>;
    documents?: Array<{ name: string; status: string; docType: string }>;
    aiToolsUsed?: number;
    activity?: Array<{
        type: string;
        title: string;
        description: string;
        timestamp: string;
        link?: string;
    }>;
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
                    data?: {
                        applications?: DashboardData["applications"];
                        documents?: DashboardData["documents"];
                        activity?: DashboardData["activity"];
                        applicationCount?: number;
                    };
                };
                if (dynamic?.success && dynamic.data) {
                    setData({
                        applicationCount: dynamic.data.applications?.length || 0,
                        applications: dynamic.data.applications || [],
                        documents: dynamic.data.documents || [],
                        activity: dynamic.data.activity || [],
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

    // Listen for dashboard updates from other pages/tabs
    useEffect(() => {
        const onExternalUpdate = () => {
            loadData();
        };
        const onStorage = (e: StorageEvent) => {
            if (e.key && e.key.startsWith('dashboardDataUpdated_')) {
                loadData();
            }
        };

        window.addEventListener('dashboard-data-changed', onExternalUpdate as EventListener);
        window.addEventListener('storage', onStorage);

        return () => {
            window.removeEventListener('dashboard-data-changed', onExternalUpdate as EventListener);
            window.removeEventListener('storage', onStorage);
        };
    }, [loadData]);

    const stats = [
        { icon: "description", label: "Loan Applications", value: data.applicationCount ?? 0, color: "text-purple-500", bg: "bg-purple-500/10" },
        { icon: "account_balance", label: "Partner Network", value: "5+", color: "text-blue-500", bg: "bg-blue-500/10" },
        { icon: "psychology", label: "AI Tools Available", value: "7", color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { icon: "school", label: "Universities Covered", value: "3K+", color: "text-amber-500", bg: "bg-amber-500/10" },
    ];

    const quickLinks = [
        { href: "/apply-loan", icon: "add_circle", label: "Apply for Loan", desc: "Start a new application", color: "from-purple-500 to-indigo-600" },
        { href: "/document-vault", icon: "folder_shared", label: "Document Vault", desc: "Securely upload docs", color: "from-blue-600 to-indigo-700" },
        { href: "/emi", icon: "calculate", label: "EMI Calculator", desc: "Plan your repayments", color: "from-blue-500 to-cyan-600" },
        { href: "/sop-writer", icon: "auto_fix_high", label: "AI SOP Writer", desc: "Draft your statement", color: "from-pink-500 to-rose-600" },
        { href: "/compare-loans", icon: "compare", label: "Compare Loans", desc: "Find the best rates", color: "from-amber-500 to-orange-600" },
        { href: "/explore", icon: "forum", label: "Community", desc: "Ask & share advice", color: "from-emerald-500 to-teal-600" },
    ];

    return (
        <div className="min-h-screen bg-transparent">
            <Navbar />

            <div className="max-w-7xl mx-auto px-6 pt-32 pb-16">
                {/* Welcome Banner */}
                <div className="mb-10 bg-[#6605c7]/[0.03] border border-[#6605c7]/10 rounded-2xl p-8 md:p-10 relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-64 opacity-[0.03] grayscale">
                        <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=500&q=20')] bg-cover" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6605c7]/10 text-[#6605c7] text-[10px] font-bold uppercase tracking-wider mb-4">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                Active Account
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold font-display text-gray-900 mb-2">
                                Welcome back, {user?.firstName || user?.email?.split("@")[0]}! 👋
                            </h1>
                            <p className="text-gray-500 text-sm">Your education loan journey is 45% complete. You're doing great!</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link href="/apply-loan" className="px-5 py-2.5 bg-[#6605c7] text-white text-xs font-bold rounded-lg hover:bg-[#5504a8] transition-all shadow-sm">
                                Apply for Loan
                            </Link>
                            <Link href="/onboarding" className="px-5 py-2.5 bg-white text-gray-700 border border-gray-200 text-xs font-bold rounded-lg hover:bg-gray-50 transition-all">
                                View Roadmap
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    {stats.map((s) => (
                        <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-100 hover:border-[#6605c7]/20 transition-all">
                            <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center ${s.color} mb-3`}>
                                <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
                            </div>
                            <div className="text-xl font-bold text-gray-900">
                                {loading ? <span className="h-6 bg-gray-100 rounded animate-pulse block w-12" /> : s.value}
                            </div>
                            <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-8 overflow-x-auto no-scrollbar border-b border-gray-100">
                    {["overview", "applications", "documents", "profile"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border-b-2 ${activeTab === tab
                                ? "border-[#6605c7] text-[#6605c7]"
                                : "border-transparent text-gray-400 hover:text-gray-600"
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
                            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Quick Actions</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                                {quickLinks.map((l) => (
                                    <Link key={l.href} href={l.href} className="group p-5 bg-white rounded-xl border border-gray-100 hover:border-[#6605c7]/20 transition-all">
                                        <div className={`w-9 h-9 bg-gradient-to-r ${l.color} rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                                            <span className="material-symbols-outlined text-lg">{l.icon}</span>
                                        </div>
                                        <div className="font-bold text-[13px] text-gray-900">{l.label}</div>
                                        <div className="text-[11px] text-gray-500 mt-1 line-clamp-1">{l.desc}</div>
                                    </Link>
                                ))}
                            </div>

                            {/* Journey Tracker */}
                            <ProgressTracker application={data.applications?.[0]} documents={data.documents} />
                        </div>

                        {/* Recent Activity */}
                        <div className="lg:col-span-1">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Recent Activity</h2>
                            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden shadow-sm">
                                {!data.activity?.length ? (
                                    <div className="p-12 text-center">
                                        <span className="material-symbols-outlined text-4xl text-gray-200 mb-2">history</span>
                                        <p className="text-gray-400 text-[11px] font-bold uppercase">No recent activity</p>
                                    </div>
                                ) : (
                                    data.activity.map((act, i) => (
                                        <div key={i} className="p-5 hover:bg-gray-50 transition-colors">
                                            <div className="flex gap-4">
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${act.type === 'forum_post' ? 'bg-blue-100 text-blue-600' :
                                                    act.type === 'forum_comment' ? 'bg-amber-100 text-amber-600' :
                                                        act.type.includes('approved') ? 'bg-green-100 text-green-600' :
                                                            act.type.includes('rejected') ? 'bg-red-100 text-red-600' :
                                                                'bg-purple-100 text-[#6605c7]'
                                                    }`}>
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        {act.type === 'forum_post' ? 'forum' :
                                                            act.type === 'forum_comment' ? 'chat_bubble' :
                                                                act.type === 'upload' ? 'upload_file' :
                                                                    act.type === 'application' ? 'description' : 'notifications'}
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <div className="text-[13px] font-bold text-gray-900 truncate pr-2">{act.title}</div>
                                                        <div className="text-[10px] text-gray-400 font-bold whitespace-nowrap">
                                                            {new Date(act.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                        </div>
                                                    </div>
                                                    <div className="text-[12px] text-gray-500 line-clamp-2 leading-relaxed">{act.description}</div>
                                                    {act.link && (
                                                        <a href={act.link} className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-[#6605c7] mt-3 hover:underline">
                                                            View Details <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Applications Tab */}
                {activeTab === "applications" && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">My Applications</h2>
                            <Link href="/apply-loan" className="px-4 py-2 bg-[#6605c7] text-white text-xs font-bold rounded-lg hover:bg-[#5504a8] transition-all">
                                + New Application
                            </Link>
                        </div>
                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : !data.applications?.length ? (
                            <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                                <span className="material-symbols-outlined text-5xl text-gray-200 mb-4 block">description</span>
                                <p className="text-gray-500 text-sm font-bold">No applications yet</p>
                                <p className="text-gray-400 text-xs mt-2 mb-6">Start your education loan journey today</p>
                                <Link href="/apply-loan" className="px-6 py-2.5 bg-[#6605c7] text-white text-xs font-bold rounded-lg">
                                    Apply Now
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {data.applications.map((app) => {
                                    const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
                                        pending: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: "schedule" },
                                        processing: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", icon: "sync" },
                                        approved: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: "check_circle" },
                                        rejected: { bg: "bg-red-50 border-red-200", text: "text-red-600", icon: "cancel" },
                                        disbursed: { bg: "bg-purple-50 border-purple-200", text: "text-purple-700", icon: "paid" },
                                    };
                                    const sc = statusConfig[app.status] || statusConfig.pending;
                                    const submittedDate = app.submittedAt || app.date || app.createdAt;
                                    return (
                                        <div key={app.id} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#6605c7]/20 hover:shadow-lg transition-all group">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-[#6605c7]/10 to-purple-100 rounded-xl flex items-center justify-center text-[#6605c7] shrink-0">
                                                        <span className="material-symbols-outlined text-2xl">account_balance</span>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-bold text-[15px] text-gray-900 truncate">{app.bank}</h3>
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${sc.bg} ${sc.text}`}>
                                                                {app.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-gray-500 mt-1">
                                                            <span className="font-bold text-gray-900">₹{app.amount?.toLocaleString("en-IN")}</span>
                                                            {app.loanType && <span>• {app.loanType}</span>}
                                                            {app.universityName && (
                                                                <span className="flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-[14px]">school</span>
                                                                    {app.universityName}
                                                                </span>
                                                            )}
                                                            {app.country && (
                                                                <span className="flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-[14px]">public</span>
                                                                    {app.country}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {/* Progress Bar */}
                                                        {app.progress !== undefined && (
                                                            <div className="mt-3">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                                        {app.stage?.replace(/_/g, ' ') || 'application submitted'}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-[#6605c7]">{app.progress}%</span>
                                                                </div>
                                                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                                    <div
                                                                        className="bg-gradient-to-r from-[#6605c7] to-purple-400 h-1.5 rounded-full transition-all duration-500"
                                                                        style={{ width: `${app.progress}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 shrink-0">
                                                    {submittedDate && (
                                                        <span className="text-[10px] text-gray-400 font-bold">
                                                            {new Date(submittedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Profile Tab */}
                {activeTab === "profile" && (
                    <div className="max-w-2xl">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">My Profile</h2>
                        <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-5 mb-8">
                                <div className="w-16 h-16 bg-[#6605c7] rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                                    {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "User"}
                                    </h3>
                                    <p className="text-gray-500 text-sm">{user?.email}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                {[
                                    { label: "First Name", value: user?.firstName || "—" },
                                    { label: "Last Name", value: user?.lastName || "—" },
                                    { label: "Email", value: user?.email || "—" },
                                    { label: "Role", value: user?.role || "user" },
                                ].map((f) => (
                                    <div key={f.label}>
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{f.label}</label>
                                        <p className="text-[13px] font-medium text-gray-900 mt-1">{f.value}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 border-t border-gray-50 pt-8">
                                <Link href="/profile" className="px-5 py-2.5 bg-[#6605c7] text-white text-xs font-bold rounded-lg hover:bg-[#5504a8] transition-all">
                                    Edit Profile
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Documents Tab */}
                {activeTab === "documents" && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">My Documents</h2>
                            <Link href="/document-vault" className="px-4 py-2 bg-white text-gray-700 border border-gray-200 text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-all">
                                <span className="material-symbols-outlined text-[16px]">cloud_upload</span> Open Vault
                            </Link>
                        </div>
                        {!data.documents?.length ? (
                            <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                                <span className="material-symbols-outlined text-5xl text-gray-200 mb-4 block">folder_open</span>
                                <p className="text-gray-500 text-sm font-bold">No documents uploaded yet</p>
                                <p className="text-gray-400 text-xs mt-2 mb-6">Upload required documents for faster loan processing</p>
                                <Link href="/document-vault" className="px-6 py-2.5 bg-[#6605c7] text-white text-xs font-bold rounded-lg">
                                    Go to Document Vault
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {data.documents.map((doc, i) => (
                                    <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 flex items-center justify-between hover:border-[#6605c7]/20 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                                                <span className="material-symbols-outlined text-xl">description</span>
                                            </div>
                                            <div>
                                                <div className="font-bold text-[13px] text-gray-900 capitalize">{doc.docType.replace('_', ' ')}</div>
                                                <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-0.5">Verified</div>
                                            </div>
                                        </div>
                                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
