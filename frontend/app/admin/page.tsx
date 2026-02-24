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
        try {
            await adminApi.updateApplicationStatus(appId, { status });
            loadData();
            loadOverview();
        } catch (e) {
            alert("Failed to update application status");
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
                item.lastName?.toLowerCase().includes(query));
        }
        return true;
    });

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
                                                            <td className="px-8 py-6 text-sm font-black text-[#6605c7]">₹{item.amount?.toLocaleString()}</td>
                                                            <td className="px-8 py-6">
                                                                <span className={`status-badge status-${item.status}`}>
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => handleAppStatus(item.id, 'approved')} className="p-2 text-green-500 hover:bg-green-50 rounded-xl shadow-sm"><span className="material-symbols-outlined text-lg">check_circle</span></button>
                                                                    <button onClick={() => handleAppStatus(item.id, 'rejected')} className="p-2 text-red-500 hover:bg-red-50 rounded-xl shadow-sm"><span className="material-symbols-outlined text-lg">cancel</span></button>
                                                                </div>
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
        </div>
    );
}
