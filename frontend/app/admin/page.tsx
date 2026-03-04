"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { format } from "date-fns";

// --- Components ---

const StatCard = ({ label, value, icon, color, loading }: any) => (
    <div className="glass-card stat-card-gradient p-6 rounded-2xl relative overflow-hidden group">
        <div className="flex justify-between items-start relative z-10">
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">{label}</p>
                <div className="text-3xl font-black">
                    {loading ? <span className="h-8 bg-gray-100 animate-pulse rounded block w-20" /> : value ?? "—"}
                </div>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${color} bg-opacity-10`}>
                <span className="material-symbols-outlined text-3xl opacity-80">{icon}</span>
            </div>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-8xl">{icon}</span>
        </div>
    </div>
);

const NavItem = ({ section, active, icon, label, onClick }: any) => (
    <button
        onClick={() => onClick(section)}
        className={`admin-nav-item w-full text-left px-5 py-4 rounded-xl flex items-center gap-4 group ${active === section ? "active" : "text-gray-600"}`}
    >
        <span className={`material-symbols-outlined transition-colors ${active === section ? "text-[#6605c7]" : "group-hover:text-[#6605c7]"}`}>{icon}</span>
        <span className="font-bold text-sm tracking-wide">{label}</span>
        {active === section && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#6605c7] shadow-[0_0_8px_#6605c7]" />
        )}
    </button>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
    <thead className="admin-table">
        <tr>{children}</tr>
    </thead>
);

export default function AdminDashboardPage() {
    const { user, logout } = useAuth();
    const [activeSection, setActiveSection] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>({});
    const [data, setData] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Application detail modal state
    const [selectedApp, setSelectedApp] = useState<any>(null);
    const [actionRemarks, setActionRemarks] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    // AI Review state
    const [aiReview, setAiReview] = useState<any>(null);
    const [aiReviewLoading, setAiReviewLoading] = useState(false);
    const [drawerTab, setDrawerTab] = useState<'details' | 'ai_review'>('details');

    const loadOverview = useCallback(async () => {
        setLoading(true);
        try {
            const [blogStats, appStats, users, logs]: [any, any, any, any] = await Promise.all([
                adminApi.getBlogStats().catch(() => ({ data: {} })),
                adminApi.getApplicationStats().catch(() => ({ data: {} })),
                adminApi.getUsers().catch(() => ({ data: [] })),
                adminApi.getAuditLogs(10).catch(() => ({ data: [] }))
            ]);

            setStats({
                blogs: blogStats.data || {},
                apps: appStats.data || {},
                userCount: users.data?.length || 0,
                activeUsers: users.data?.filter((u: any) => u.role === 'admin' || u.role === 'super_admin').length || 0
            });
            setAuditLogs(logs.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadData = useCallback(async () => {
        if (activeSection === "overview") return;
        setLoading(true);
        setData([]);
        try {
            let res: any;
            if (activeSection === "users") {
                res = await adminApi.getUsers();
                setData(res.data || []);
            } else if (activeSection === "blogs") {
                res = await adminApi.getBlogs(100);
                setData(res.data || []);
            } else if (activeSection === "applications") {
                const params: any = {};
                if (filterStatus !== "all") params.status = filterStatus;
                res = await adminApi.getApplications(params);
                setData(res.data || []);
            } else if (activeSection === "community") {
                res = await adminApi.getForumPosts(50);
                setData(res.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [activeSection, filterStatus]);

    useEffect(() => {
        if (activeSection === "overview") loadOverview();
        else loadData();
    }, [activeSection, loadOverview, loadData]);

    const handleBlogStatus = async (blogId: string, currentStatus: boolean) => {
        try {
            await adminApi.bulkUpdateBlogStatus([blogId], !currentStatus);
            loadData();
            loadOverview();
        } catch (e) {
            alert("Failed to update blog status");
        }
    };

    const handleDeleteBlog = async (blogId: string) => {
        if (!confirm("Are you sure you want to delete this blog?")) return;
        try {
            await adminApi.deleteBlog(blogId);
            loadData();
            loadOverview();
        } catch (e) {
            alert("Failed to delete blog");
        }
    };

    const handleAppStatus = async (appId: string, status: string) => {
        setActionLoading(true);
        try {
            const remarks = aiReview
                ? `[AI Score: ${aiReview.overallScore}/100 | Rec: ${aiReview.recommendation}] ${actionRemarks || ''}`
                : actionRemarks || undefined;
            await adminApi.updateApplicationStatus(appId, {
                status,
                remarks,
                rejectionReason: status === 'rejected' ? (actionRemarks || aiReview?.aiSummary) : undefined,
            });
            setSelectedApp(null);
            setActionRemarks("");
            setAiReview(null);
            setDrawerTab('details');
            loadData();
            loadOverview();
        } catch (e) {
            alert("Failed to update application status");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAIReview = async (appId: string) => {
        setAiReviewLoading(true);
        setAiReview(null);
        setDrawerTab('ai_review');
        try {
            const result: any = await adminApi.aiReviewApplication(appId);
            setAiReview(result.data);
        } catch (e: any) {
            console.error('AI Review failed:', e);
            alert(`AI Review failed: ${e.message || 'Please try again.'}`);
        } finally {
            setAiReviewLoading(false);
        }
    };

    const handleUserRole = async (email: string, role: string) => {
        try {
            await adminApi.updateUserRole(email, role);
            alert(`User role updated to ${role}`);
            loadData();
        } catch (e) {
            alert("Failed to update user role");
        }
    };

    const filteredData = data.filter(item => {
        const query = searchQuery.toLowerCase();
        if (activeSection === 'users') {
            return (item.email?.toLowerCase().includes(query) ||
                item.firstName?.toLowerCase().includes(query) ||
                item.lastName?.toLowerCase().includes(query));
        }
        if (activeSection === 'blogs') {
            return (item.title?.toLowerCase().includes(query) ||
                item.authorName?.toLowerCase().includes(query));
        }
        if (activeSection === 'applications') {
            return (item.applicationNumber?.toLowerCase().includes(query) ||
                item.firstName?.toLowerCase().includes(query) ||
                item.lastName?.toLowerCase().includes(query) ||
                item.bank?.toLowerCase().includes(query) ||
                item.email?.toLowerCase().includes(query));
        }
        return true;
    });

    const statusColors: Record<string, string> = {
        pending: "bg-amber-100 text-amber-700 border-amber-200",
        processing: "bg-blue-100 text-blue-700 border-blue-200",
        approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
        rejected: "bg-red-100 text-red-600 border-red-200",
        disbursed: "bg-purple-100 text-purple-700 border-purple-200",
        cancelled: "bg-gray-100 text-gray-600 border-gray-200",
        draft: "bg-gray-100 text-gray-500 border-gray-200",
    };

    return (
        <div className="min-h-screen flex bg-[#f7f5f8]">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 admin-sidebar transform transition-all duration-500 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="flex flex-col h-full">
                    <div className="p-8 border-b border-[#6605c7]/10">
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="w-10 h-10 rounded-2xl bg-[#6605c7] flex items-center justify-center text-white shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined font-bold">token</span>
                            </div>
                            <span className="font-black text-2xl tracking-tighter text-gray-900 font-display">Vidhya<span className="text-[#6605c7]">Admin</span></span>
                        </div>
                    </div>

                    <nav className="flex-1 p-6 space-y-2 overflow-y-auto no-scrollbar">
                        <NavItem section="overview" active={activeSection} icon="dashboard" label="Dashboard" onClick={setActiveSection} />
                        <NavItem section="blogs" active={activeSection} icon="article" label="Blogs" onClick={setActiveSection} />
                        <NavItem section="applications" active={activeSection} icon="description" label="Applications" onClick={setActiveSection} />
                        <NavItem section="users" active={activeSection} icon="people" label="Users" onClick={setActiveSection} />
                        <NavItem section="community" active={activeSection} icon="groups" label="Community" onClick={setActiveSection} />
                        <NavItem section="settings" active={activeSection} icon="settings" label="Settings" onClick={setActiveSection} />
                    </nav>

                    <div className="p-6 border-t border-[#6605c7]/10">
                        <div className="glass-card p-4 rounded-2xl bg-white/40 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#6605c7]/10 flex items-center justify-center text-[#6605c7] border border-[#6605c7]/20">
                                    <span className="material-symbols-outlined text-lg">shield_person</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-gray-900 truncate">{user?.firstName || 'Admin User'}</p>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{user?.role?.replace('_', ' ')}</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={logout} className="w-full px-5 py-4 rounded-xl flex items-center gap-4 text-red-500 hover:bg-red-50:bg-red-900/10 transition-colors font-bold text-sm">
                            <span className="material-symbols-outlined">logout</span>
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-20 glass-card border-b border-[#6605c7]/10 px-8 flex justify-between items-center sticky top-0 z-40 bg-white/80 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <h1 className="text-xl font-black font-display text-gray-900 capitalize tracking-tight">
                            {activeSection} <span className="text-[#6605c7] opacity-40">/</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                            <input
                                type="text"
                                placeholder="Global Search..."
                                className="pl-10 pr-4 py-2.5 bg-gray-100/50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 w-64"
                            />
                        </div>
                        <button className="p-2.5 text-gray-500 hover:text-[#6605c7] hover:bg-[#6605c7]/5 rounded-xl transition-all">
                            <span className="material-symbols-outlined">notifications</span>
                        </button>
                        <button className="p-2.5 text-gray-500 hover:text-[#6605c7] hover:bg-[#6605c7]/5 rounded-xl transition-all">
                            <span className="material-symbols-outlined">dark_mode</span>
                        </button>
                        <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </header>

                <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
                    {/* Tab Selection Content */}
                    {activeSection === "overview" ? (
                        <div className="space-y-8 animate-fade-in">
                            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-4">
                                <div>
                                    <h2 className="text-4xl font-black font-display mb-1 text-gray-900">Admin Hub</h2>
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Luminous Portal Intelligence</p>
                                </div>
                                <div className="flex gap-3">
                                    <Link href="/admin/blogs/create" className="admin-btn-primary text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">add_circle</span> New Creation
                                    </Link>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard label="Total Blogs" value={stats.blogs?.total} icon="article" color="text-blue-500" loading={loading} />
                                <StatCard label="App Requests" value={stats.apps?.total} icon="description" color="text-[#6605c7]" loading={loading} />
                                <StatCard label="User Base" value={stats.userCount} icon="person" color="text-green-500" loading={loading} />
                                <StatCard label="Privileged" value={stats.activeUsers} icon="admin_panel_settings" color="text-red-500" loading={loading} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 glass-card p-8 rounded-[2.5rem] border-[#6605c7]/10 bg-white/60">
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="text-xl font-black font-display text-gray-900">Recent Intelligence</h3>
                                        <button onClick={loadOverview} className="p-2 text-gray-400 hover:text-[#6605c7] transition-colors"><span className="material-symbols-outlined">refresh</span></button>
                                    </div>
                                    <div className="space-y-6">
                                        {auditLogs.length > 0 ? auditLogs.map((log: any, i: number) => (
                                            <div key={i} className="flex gap-5 group">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-10 h-10 rounded-2xl bg-[#6605c7]/5 flex items-center justify-center text-[#6605c7] border border-[#6605c7]/10 group-hover:scale-110 transition-transform">
                                                        <span className="material-symbols-outlined text-xl">
                                                            {log.action === 'update' ? 'edit_square' : log.action === 'create' ? 'add_box' : 'delete'}
                                                        </span>
                                                    </div>
                                                    {i < auditLogs.length - 1 && <div className="w-px h-full bg-gray-100 my-2" />}
                                                </div>
                                                <div className="pb-4 border-b border-gray-50 flex-1 last:border-0">
                                                    <div className="flex justify-between mb-1">
                                                        <p className="text-sm font-black text-gray-900 capitalize uppercase tracking-tight">{log.action} {log.entityType}</p>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{format(new Date(log.createdAt), 'MMM d, p')}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 font-bold mb-2">Initiated by <span className="text-[#6605c7]">{log.initiator?.firstName || 'System'}</span></p>
                                                    <div className="bg-gray-50 rounded-xl p-3 text-[11px] font-mono text-gray-400 overflow-hidden truncate">
                                                        ID: {log.entityId}
                                                    </div>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center py-12 text-gray-400">
                                                <span className="material-symbols-outlined text-5xl mb-3 opacity-20 block">history</span>
                                                <p className="text-xs font-bold uppercase tracking-widest">No recent synchronization history</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="glass-card p-8 rounded-[2.5rem] border-[#6605c7]/10 bg-white/60">
                                        <h3 className="text-xl font-black font-display text-gray-900 mb-6">Quick Directives</h3>
                                        <div className="grid grid-cols-1 gap-3">
                                            <Link href="/admin/blogs/create" className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-[#6605c7]/5 transition-all group border border-gray-100">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform"><span className="material-symbols-outlined">post_add</span></div>
                                                <span className="text-xs font-black uppercase tracking-widest text-gray-700">Canva Editor</span>
                                            </Link>
                                            <button onClick={() => setActiveSection('users')} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-[#6605c7]/5 transition-all group border border-gray-100">
                                                <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center group-hover:scale-110 transition-transform"><span className="material-symbols-outlined">person_add</span></div>
                                                <span className="text-xs font-black uppercase tracking-widest text-gray-700">Manage Privileges</span>
                                            </button>
                                            <button onClick={() => setActiveSection('applications')} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-[#6605c7]/5 transition-all group border border-gray-100">
                                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform"><span className="material-symbols-outlined">receipt_long</span></div>
                                                <span className="text-xs font-black uppercase tracking-widest text-gray-700">Audit Applications</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="glass-card p-8 rounded-[2.5rem] bg-gradient-to-br from-[#6605c7] to-[#8b24e5] text-white overflow-hidden relative group">
                                        <div className="relative z-10">
                                            <h3 className="text-xl font-black font-display mb-2">Portal Status</h3>
                                            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-6 leading-relaxed">System core is fully operational with low latency.</p>
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_#4ade80]" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Luminous Engine active</span>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-[10rem] absolute -right-8 -bottom-8 text-white/10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">shield_locked</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade-in space-y-8">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <h2 className="text-4xl font-black font-display text-gray-900 capitalize tracking-tight">{activeSection} Control</h2>
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1">Management Matrix Unit</p>
                                </div>
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-80">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">filter_alt</span>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder={`Search ${activeSection}...`}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 shadow-sm"
                                        />
                                    </div>
                                    {activeSection === 'applications' && (
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="px-4 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 shadow-sm"
                                        >
                                            <option value="all">Every State</option>
                                            <option value="pending">Pending Audit</option>
                                            <option value="processing">Processing</option>
                                            <option value="approved">Success</option>
                                            <option value="rejected">Declined</option>
                                        </select>
                                    )}
                                </div>
                            </div>

                            <div className="admin-table-container rounded-[2.5rem] overflow-hidden shadow-2xl shadow-purple-900/5">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <TableHeader>
                                            {activeSection === "users" && (
                                                <>
                                                    <th className="px-8 py-5">Identity Structure</th>
                                                    <th className="px-8 py-5">Communication</th>
                                                    <th className="px-8 py-5">Matrix Role</th>
                                                    <th className="px-8 py-5">Registered</th>
                                                    <th className="px-8 py-5">Directives</th>
                                                </>
                                            )}
                                            {activeSection === "blogs" && (
                                                <>
                                                    <th className="px-8 py-5">Creation Identity</th>
                                                    <th className="px-8 py-5">Taxonomy</th>
                                                    <th className="px-8 py-5">State</th>
                                                    <th className="px-8 py-5">Metrics</th>
                                                    <th className="px-8 py-5">Synchronization</th>
                                                </>
                                            )}
                                            {activeSection === "applications" && (
                                                <>
                                                    <th className="px-8 py-5">Audit ID</th>
                                                    <th className="px-8 py-5">Applicant Profile</th>
                                                    <th className="px-8 py-5">Financial Node</th>
                                                    <th className="px-8 py-5">Quantum Amount</th>
                                                    <th className="px-8 py-5">Audit State</th>
                                                    <th className="px-8 py-5">Actions</th>
                                                </>
                                            )}
                                            {activeSection === "community" && (
                                                <>
                                                    <th className="px-8 py-5">Transmission</th>
                                                    <th className="px-8 py-5">Source Node</th>
                                                    <th className="px-8 py-5">Engagement</th>
                                                    <th className="px-8 py-5">Pinned</th>
                                                    <th className="px-8 py-5">Terminate</th>
                                                </>
                                            )}
                                        </TableHeader>
                                        <tbody className="divide-y divide-gray-50 bg-white/50">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={6} className="px-8 py-20 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-12 h-12 border-4 border-[#6605c7]/10 border-t-[#6605c7] rounded-full animate-spin mb-4" />
                                                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Decrypting Management Matrix...</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : filteredData.length > 0 ? filteredData.map((item, idx) => (
                                                <tr key={idx} className="group hover:bg-[#6605c7]/5 transition-all">
                                                    {activeSection === "users" && (
                                                        <>
                                                            <td className="px-8 py-6">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center font-black text-[#6605c7] text-xs">
                                                                        {item.firstName?.[0]}{item.lastName?.[0]}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-sm font-black text-gray-900 truncate tracking-tight">{item.firstName} {item.lastName}</p>
                                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{item.id}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6 text-sm font-medium text-gray-500">{item.email}</td>
                                                            <td className="px-8 py-6">
                                                                <span className={`status-badge ${item.role?.includes('admin') ? 'status-approved' : 'status-draft'}`}>
                                                                    {item.role || 'user'}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6 text-xs font-bold text-gray-400">
                                                                {item.createdAt ? format(new Date(item.createdAt), 'MMM d, yyyy') : '—'}
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => handleUserRole(item.email, item.role === 'admin' ? 'user' : 'admin')} className="p-2 text-gray-400 hover:text-[#6605c7] rounded-xl hover:bg-white transition-all shadow-sm"><span className="material-symbols-outlined text-lg">shield_with_heart</span></button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    )}
                                                    {activeSection === "blogs" && (
                                                        <>
                                                            <td className="px-8 py-6">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                                                                        {item.featuredImage && <img src={item.featuredImage} alt="" className="w-full h-full object-cover" />}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-sm font-black text-gray-900 truncate tracking-tight">{item.title}</p>
                                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">by {item.authorName}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-md text-gray-500">{item.category}</span>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <span className={`status-badge ${item.isPublished ? 'status-published' : 'status-draft'}`}>
                                                                    {item.isPublished ? 'Live' : 'Draft'}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6 text-xs font-black text-gray-900">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="material-symbols-outlined text-sm opacity-30">visibility</span> {item.views || 0}
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => handleBlogStatus(item.id, item.isPublished)} className={`p-2 rounded-xl transition-all shadow-sm ${item.isPublished ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`}>
                                                                        <span className="material-symbols-outlined text-lg">{item.isPublished ? 'unpublished' : 'publish'}</span>
                                                                    </button>
                                                                    <button onClick={() => handleDeleteBlog(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm"><span className="material-symbols-outlined text-lg">delete_sweep</span></button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    )}
                                                    {activeSection === "applications" && (
                                                        <>
                                                            <td className="px-8 py-6 text-[10px] font-black font-mono text-gray-400 uppercase tracking-widest">{item.applicationNumber}</td>
                                                            <td className="px-8 py-6">
                                                                <p className="text-sm font-black text-gray-900 tracking-tight">{item.firstName} {item.lastName}</p>
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.email}</p>
                                                            </td>
                                                            <td className="px-8 py-6 text-sm font-bold text-gray-700">{item.bank} <br /><span className="text-[10px] uppercase text-gray-400">{item.loanType}</span></td>
                                                            <td className="px-8 py-6 text-sm font-black text-[#6605c7]">â‚¹{item.amount?.toLocaleString()}</td>
                                                            <td className="px-8 py-6">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[item.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <button
                                                                    onClick={() => { setSelectedApp(item); setActionRemarks(""); }}
                                                                    className="px-4 py-2 bg-[#6605c7]/5 text-[#6605c7] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#6605c7]/10 transition-all flex items-center gap-1.5"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">visibility</span>
                                                                    View Details
                                                                </button>
                                                            </td>
                                                        </>
                                                    )}
                                                    {activeSection === "community" && (
                                                        <>
                                                            <td className="px-8 py-6">
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-black text-gray-900 truncate tracking-tight">{item.title}</p>
                                                                    <p className="text-[10px] font-bold text-gray-400 truncate">{item.topic || 'General'}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <p className="text-xs font-bold text-gray-600">{item.author?.firstName} {item.author?.lastName}</p>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <div className="flex items-center gap-3 text-xs font-black text-gray-400">
                                                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">thumb_up</span> {item.likesCount || 0}</span>
                                                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">chat_bubble</span> {item.comments?.length || 0}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <span className={`status-badge ${item.isPinned ? 'status-published' : 'status-draft'}`}>
                                                                    {item.isPinned ? 'Pinned' : 'Standard'}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <button onClick={async () => {
                                                                    if (!confirm("Terminate this transmission?")) return;
                                                                    await adminApi.deleteForumPost(item.id);
                                                                    loadData();
                                                                }} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm">
                                                                    <span className="material-symbols-outlined text-lg">delete_sweep</span>
                                                                </button>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={6} className="px-8 py-20 text-center text-gray-400">
                                                        <span className="material-symbols-outlined text-5xl mb-3 opacity-20 block">folder_off</span>
                                                        <p className="text-xs font-black uppercase tracking-widest">No matching datasets found in matrix</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Application Detail Modal / Drawer */}
            {selectedApp && (
                <div className="fixed inset-0 z-[60] flex">
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setSelectedApp(null); setAiReview(null); setDrawerTab('details'); }} />

                    {/* Drawer */}
                    <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto animate-slide-in-right flex flex-col">
                        {/* Header */}
                        <div className="sticky top-0 z-20 bg-white border-b border-gray-100">
                            <div className="px-8 py-5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black font-display text-gray-900">Application Details</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                        {selectedApp.applicationNumber}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[selectedApp.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                        {selectedApp.status}
                                    </span>
                                    <button onClick={() => { setSelectedApp(null); setAiReview(null); setDrawerTab('details'); }} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex px-8 gap-6 border-b border-gray-50">
                                <button
                                    onClick={() => setDrawerTab('details')}
                                    className={`py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${drawerTab === 'details' ? 'border-[#6605c7] text-[#6605c7]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                >
                                    Details
                                </button>
                                <button
                                    onClick={() => {
                                        if (!aiReview) handleAIReview(selectedApp.id);
                                        else setDrawerTab('ai_review');
                                    }}
                                    className={`py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${drawerTab === 'ai_review' ? 'border-[#6605c7] text-[#6605c7]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                >
                                    <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                                    AI Review {aiReview && `(${aiReview.overallScore}%)`}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {drawerTab === 'details' ? (
                                <>
                                    {/* Applicant Info */}
                                    <DetailSection icon="person" title="Applicant Information" color="bg-blue-50 text-blue-600">
                                        <DetailRow label="Full Name" value={`${selectedApp.firstName || ''} ${selectedApp.lastName || ''}`.trim() || '—'} />
                                        <DetailRow label="Email" value={selectedApp.email || selectedApp.user?.email || '—'} />
                                        <DetailRow label="Phone" value={selectedApp.phone || '—'} />
                                        <DetailRow label="Date of Birth" value={selectedApp.dateOfBirth ? new Date(selectedApp.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
                                        <DetailRow label="Address" value={selectedApp.address || '—'} />
                                    </DetailSection>

                                    {/* Loan Details */}
                                    <DetailSection icon="account_balance" title="Loan Details" color="bg-purple-50 text-purple-600">
                                        <DetailRow label="Bank" value={selectedApp.bank || '—'} />
                                        <DetailRow label="Loan Type" value={selectedApp.loanType || '—'} />
                                        <DetailRow label="Loan Amount" value={selectedApp.amount ? `₹${Number(selectedApp.amount).toLocaleString('en-IN')}` : '—'} highlight />
                                        <DetailRow label="Course / Program" value={selectedApp.courseName || '—'} />
                                        <DetailRow label="University" value={selectedApp.universityName || '—'} />
                                        <DetailRow label="Country" value={selectedApp.country || '—'} />
                                    </DetailSection>

                                    {/* Financial Details */}
                                    <DetailSection icon="payments" title="Financial Details" color="bg-emerald-50 text-emerald-600">
                                        <DetailRow label="Co-Applicant" value={selectedApp.hasCoApplicant ? (selectedApp.coApplicantRelation ? selectedApp.coApplicantRelation.charAt(0).toUpperCase() + selectedApp.coApplicantRelation.slice(1) : 'Yes') : 'None'} />
                                        {selectedApp.hasCoApplicant && selectedApp.coApplicantIncome && (
                                            <DetailRow label="Co-Applicant Income" value={`₹${Number(selectedApp.coApplicantIncome).toLocaleString('en-IN')} / year`} />
                                        )}
                                        <DetailRow label="Collateral" value={selectedApp.hasCollateral ? (selectedApp.collateralType || 'Yes') : 'No Collateral'} />
                                    </DetailSection>

                                    {/* Application Meta */}
                                    <DetailSection icon="info" title="Application Meta" color="bg-amber-50 text-amber-600">
                                        <DetailRow label="Application Number" value={selectedApp.applicationNumber} mono />
                                        <DetailRow label="Stage" value={selectedApp.stage?.replace(/_/g, ' ') || '—'} />
                                        <DetailRow label="Progress" value={`${selectedApp.progress || 0}%`} />
                                        <DetailRow label="Submitted" value={selectedApp.submittedAt ? new Date(selectedApp.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : (selectedApp.date ? new Date(selectedApp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—')} />
                                    </DetailSection>
                                </>
                            ) : (
                                <div className="space-y-6">
                                    {aiReviewLoading ? (
                                        <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                            <div className="w-16 h-16 rounded-full border-4 border-[#6605c7]/20 border-t-[#6605c7] animate-spin mb-4" />
                                            <p className="text-[11px] font-black uppercase tracking-widest text-gray-500 animate-pulse">Running AI Deep Scan...</p>
                                            <p className="text-[10px] font-bold text-gray-400 mt-2">Checking documents, financials, and eligibility</p>
                                        </div>
                                    ) : aiReview ? (
                                        <>
                                            {/* AI Summary Card */}
                                            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-[#6605c7] to-[#4c0491] text-white overflow-hidden shadow-2xl shadow-purple-500/20">
                                                <div className="relative z-10">
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-4xl font-black">{aiReview.overallScore}%</div>
                                                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Overall Score</div>
                                                        </div>
                                                    </div>
                                                    <h3 className="text-lg font-black mb-2 flex items-center gap-2">
                                                        AI Recommendation:
                                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] uppercase bg-white/20`}>
                                                            {aiReview.recommendation.replace(/_/g, ' ')}
                                                        </span>
                                                    </h3>
                                                    <p className="text-sm opacity-90 leading-relaxed italic">
                                                        "{aiReview.aiSummary}"
                                                    </p>
                                                </div>
                                                <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                                                    <span className="material-symbols-outlined text-[200px]">psychology</span>
                                                </div>
                                            </div>

                                            {/* AI Checks Grid */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Credit Risk</p>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className={`w-2 h-2 rounded-full ${aiReview.creditAssessment.riskLevel === 'low' ? 'bg-emerald-500' : aiReview.creditAssessment.riskLevel === 'medium' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                                        <span className="text-sm font-black uppercase tracking-tight text-gray-900">{aiReview.creditAssessment.riskLevel} Risk</span>
                                                    </div>
                                                    <p className="text-[11px] font-bold text-gray-500">I/L Ratio: {aiReview.creditAssessment.incomeToLoanRatio}</p>
                                                </div>
                                                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Completeness</p>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-black uppercase tracking-tight text-gray-900">{aiReview.completenessCheck.percentage}%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#6605c7]" style={{ width: `${aiReview.completenessCheck.percentage}%` }} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Flag Status */}
                                            <DetailSection icon="flag" title="Eligibility Flags" color="bg-gray-100 text-gray-700">
                                                {aiReview.eligibilityFlags.map((f: any, i: number) => (
                                                    <div key={i} className="px-5 py-3 flex items-start gap-4">
                                                        <span className={`material-symbols-outlined text-lg mt-0.5 ${f.status === 'pass' ? 'text-emerald-500' : f.status === 'warning' ? 'text-amber-500' : 'text-red-500'}`}>
                                                            {f.status === 'pass' ? 'check_circle' : f.status === 'warning' ? 'warning' : 'error'}
                                                        </span>
                                                        <div>
                                                            <p className="text-xs font-black text-gray-900">{f.flag}</p>
                                                            <p className="text-[11px] font-bold text-gray-500">{f.detail}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </DetailSection>

                                            {/* Document Check */}
                                            <DetailSection icon="description" title="Document Check" color="bg-gray-100 text-gray-700">
                                                <DetailRow label="Total Required" value={aiReview.documentCheck.totalRequired.toString()} />
                                                <DetailRow label="Uploaded" value={aiReview.documentCheck.uploaded.toString()} />
                                                <DetailRow label="Verified" value={aiReview.documentCheck.verified.toString()} />
                                                <DetailRow label="Status" value={aiReview.documentCheck.status.toUpperCase()} highlight={aiReview.documentCheck.status !== 'complete'} />
                                            </DetailSection>

                                            {/* Mentor Review Trigger */}
                                            {aiReview.mentorReviewRequired && (
                                                <div className="p-6 rounded-2xl bg-red-50 border border-red-100">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                                                            <span className="material-symbols-outlined">supervisor_account</span>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-black text-red-900">Manual Review Suggested</h4>
                                                            <p className="text-[10px] font-bold text-red-700/60 uppercase tracking-widest">Complex Risk detected</p>
                                                        </div>
                                                    </div>
                                                    <ul className="space-y-2">
                                                        {aiReview.mentorReviewReasons.map((r: string, i: number) => (
                                                            <li key={i} className="flex items-center gap-2 text-[11px] font-bold text-red-700">
                                                                <span className="w-1 h-1 rounded-full bg-red-400" />
                                                                {r}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-20">
                                            <button
                                                onClick={() => handleAIReview(selectedApp.id)}
                                                className="px-8 py-4 bg-[#6605c7] text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-[#4c0491] transition-all shadow-xl shadow-purple-500/20 flex items-center gap-3 mx-auto"
                                            >
                                                <span className="material-symbols-outlined">auto_awesome</span>
                                                Initialize AI Analysis
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer / Actions */}
                        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-8 pt-6">
                            <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[14px]">gavel</span>
                                Final Determination
                            </h3>
                            <textarea
                                value={actionRemarks}
                                onChange={(e) => setActionRemarks(e.target.value)}
                                placeholder={aiReview ? "AI insights will be attached automatically..." : "Add your manual remarks here..."}
                                rows={2}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:border-[#6605c7] transition-all mb-4"
                            />
                            <div className="flex gap-3">
                                {aiReview?.mentorReviewRequired ? (
                                    <button
                                        onClick={() => handleAppStatus(selectedApp.id, 'processing')}
                                        disabled={actionLoading}
                                        className="flex-[2] px-6 py-4 bg-amber-500 text-white text-[10px] uppercase font-black tracking-widest rounded-2xl hover:bg-amber-600 shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-3"
                                    >
                                        <span className="material-symbols-outlined">send_to_mobile</span>
                                        Escalate to Mentors
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleAppStatus(selectedApp.id, 'approved')}
                                            disabled={actionLoading || aiReviewLoading}
                                            className="flex-1 px-6 py-4 bg-emerald-500 text-white text-[10px] uppercase font-black tracking-widest rounded-2xl hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                        >
                                            {actionLoading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-base group-hover:scale-110 transition-transform">check_circle</span>}
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleAppStatus(selectedApp.id, 'rejected')}
                                            disabled={actionLoading || aiReviewLoading}
                                            className="flex-1 px-6 py-4 bg-red-500 text-white text-[10px] uppercase font-black tracking-widest rounded-2xl hover:bg-red-600 shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                        >
                                            {actionLoading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-base group-hover:scale-110 transition-transform">cancel</span>}
                                            Reject
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right {
                    animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </div>
    );
}

function DetailSection({ icon, title, color, children }: { icon: string; title: string; color: string; children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-3 flex items-center gap-2">
                <div className={`w-6 h-6 rounded-md ${color} flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-[14px]">{icon}</span>
                </div>
                {title}
            </h3>
            <div className="bg-gray-50/80 rounded-xl border border-gray-100 divide-y divide-gray-100">
                {children}
            </div>
        </div>
    );
}

function DetailRow({ label, value, highlight, mono }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
    return (
        <div className="flex justify-between items-center px-5 py-3">
            <span className="text-[12px] font-bold text-gray-500">{label}</span>
            <span className={`text-[13px] text-right max-w-[60%] break-words ${highlight ? 'font-black text-[#6605c7] text-base' : 'font-semibold text-gray-900'} ${mono ? 'font-mono text-[11px]' : ''}`}>
                {value}
            </span>
        </div>
    );
}
