"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { format } from "date-fns";
import ChatInterface from "@/components/Chat/ChatInterface";

// --- Components ---

const StatCard = ({ label, value, icon, color, loading, hint }: any) => (
    <div className="bg-white border border-[#6605c7]/5 p-6 rounded-[2rem] relative overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(102,5,199,0.06)] transition-all duration-300 flex flex-col justify-between min-h-[160px] hover:-translate-y-1">
        <div className="flex justify-between items-start relative z-10 w-full">
            <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${color} bg-opacity-5 shrink-0 border border-current border-opacity-10`}>
                <span className="material-symbols-outlined text-2xl" style={{ color: 'currentColor' }}>{icon}</span>
            </div>
            <div className="text-right">
                <p className="text-[#6605c7]/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
                {hint && <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{hint}</p>}
            </div>
        </div>
        <div className="relative z-10 mt-6">
            <div className="text-4xl font-black tracking-tighter text-gray-900 font-display group-hover:text-[#6605c7] transition-colors">
                {loading ? <span className="h-10 bg-gray-50 animate-pulse rounded-lg block w-24" /> : value ?? "—"}
            </div>
        </div>
        <div className="absolute -right-6 -bottom-6 opacity-[0.02] pointer-events-none transform group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500">
            <span className="material-symbols-outlined text-[10rem]">{icon}</span>
        </div>
    </div>
);

const NavItem = ({ section, active, icon, label, onClick }: any) => (
    <button
        onClick={() => onClick(section)}
        className={`w-full text-left px-5 py-3.5 rounded-2xl flex items-center gap-4 group transition-all duration-300 ${active === section ? "bg-[#6605c7] text-white shadow-[0_8px_20px_rgb(102,5,199,0.25)]" : "text-gray-500 hover:bg-[#6605c7]/5 hover:text-[#6605c7]"}`}
    >
        <span className={`material-symbols-outlined transition-colors text-xl ${active === section ? "text-white" : "group-hover:text-[#6605c7]"}`}>{icon}</span>
        <span className="font-bold text-xs tracking-widest uppercase">{label}</span>
        {active === section && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        )}
    </button>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
    <thead>
        <tr>{children}</tr>
    </thead>
);

export default function StaffDashboardPage() {
    const { user, logout } = useAuth();
    const [activeSection, setActiveSection] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>({});
    const [data, setData] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [autoStartUser, setAutoStartUser] = useState<any>(null);

    // Application detail modal state
    const [selectedApp, setSelectedApp] = useState<any>(null);
    const [actionRemarks, setActionRemarks] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    
    // Add student state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newStudent, setNewStudent] = useState({
        email: "",
        firstName: "",
        lastName: "",
        mobile: "",
        role: "student"
    });
    const [createLoading, setCreateLoading] = useState(false);
    
    // Document state
    const [userDocuments, setUserDocuments] = useState<any[]>([]);
    const [docsLoading, setDocsLoading] = useState(false);

    const loadOverview = useCallback(async () => {
        setLoading(true);
        try {
            const [blogStats, appStats, userStats]: [any, any, any] = await Promise.all([
                adminApi.getBlogStats().catch(() => ({ data: {} })),
                adminApi.getApplicationStats().catch(() => ({ data: {} })),
                adminApi.getUsers().catch(() => ({ data: [] }))
            ]);

            setStats({
                blogs: blogStats.data || {},
                apps: appStats.data || {},
                users: { total: userStats.data?.length || 0 }
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadData = useCallback(async () => {
        if (activeSection === "overview" || activeSection.startsWith("chat_")) return;
        setLoading(true);
        setData([]);
        try {
            let res: any;
            if (activeSection === "blogs") {
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
            } else if (activeSection === "users") {
                res = await adminApi.getUsers();
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

    const handleAppStatus = async (appId: string, status: string) => {
        setActionLoading(true);
        try {
            await adminApi.updateApplicationStatus(appId, {
                status,
                remarks: actionRemarks || undefined,
            });
            setSelectedApp(null);
            setActionRemarks("");
            loadData();
            loadOverview();
        } catch (e) {
            alert("Failed to update application status");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        try {
            await adminApi.createUser(newStudent);
            setIsAddModalOpen(false);
            setNewStudent({ email: "", firstName: "", lastName: "", mobile: "", role: "student" });
            loadData();
            alert("Student added successfully!");
        } catch (e: any) {
            alert(e.message || "Failed to add student");
        } finally {
            setCreateLoading(false);
        }
    };

    const fetchUserDocuments = async (userId: string) => {
        setDocsLoading(true);
        try {
            const res = await adminApi.getUsersDocuments?.(userId);
            setUserDocuments(res?.data || []);
        } catch (e) {
            console.error("Failed to load documents");
        } finally {
            setDocsLoading(false);
        }
    };

    const filteredData = data.filter(item => {
        const query = searchQuery.toLowerCase();
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
        if (activeSection === 'users') {
            return (item.email?.toLowerCase().includes(query) ||
                item.firstName?.toLowerCase().includes(query) ||
                item.lastName?.toLowerCase().includes(query) ||
                item.role?.toLowerCase().includes(query));
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

    const pendingCount = Number(stats.apps?.pending ?? stats.apps?.processing ?? 0);
    const approvedCount = Number(stats.apps?.approved ?? 0);
    const rejectedCount = Number(stats.apps?.rejected ?? 0);
    const totalApps = Number(stats.apps?.total ?? 0);
    const approvalRate = totalApps > 0 ? Math.round((approvedCount / totalApps) * 100) : 0;

    return (
        <div className="min-h-screen flex bg-[#fbf9ff]">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-all duration-500 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} p-4 lg:p-6 lg:pr-3`}>
                <div className="flex flex-col h-full bg-white rounded-[2.5rem] border border-[#6605c7]/5 shadow-[0_8px_30px_rgb(102,5,199,0.04)] overflow-hidden relative">
                    {/* Top glass reflection effect */}
                    <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#6605c7]/5 to-transparent pointer-events-none" />
                    
                    <div className="p-8 border-b border-[#6605c7]/5 relative z-10">
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="w-10 h-10 rounded-[1rem] bg-gradient-to-br from-[#6605c7] to-[#8b24e5] flex items-center justify-center text-white shadow-lg shadow-[#6605c7]/20 group-hover:scale-110 transition-transform duration-300">
                                <span className="material-symbols-outlined font-black text-xl">token</span>
                            </div>
                            <span className="font-bold text-xl tracking-tight text-gray-900 font-display">Vidhya<span className="text-[#6605c7]">Staff</span></span>
                        </div>
                        <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Management Portal</p>
                    </div>

                    <nav className="flex-1 p-5 space-y-1.5 overflow-y-auto no-scrollbar relative z-10">
                        <NavItem section="overview" active={activeSection} icon="space_dashboard" label="Dashboard" onClick={setActiveSection} />
                        <NavItem section="applications" active={activeSection} icon="docs_apps_script" label="Applications" onClick={setActiveSection} />
                        <NavItem section="users" active={activeSection} icon="group" label="Users" onClick={setActiveSection} />
                        <NavItem section="blogs" active={activeSection} icon="news" label="Blogs" onClick={setActiveSection} />
                        <NavItem section="community" active={activeSection} icon="forum" label="Community" onClick={setActiveSection} />

                        <div className="my-4 pt-4 pb-2">
                            <p className="text-[9px] font-black text-[#6605c7]/40 uppercase tracking-[0.2em] px-5">Communications</p>
                        </div>
                        <NavItem section="chat_bank" active={activeSection} icon="account_balance" label="Bank Channel" onClick={(s: string) => { setActiveSection(s); setAutoStartUser(null); }} />
                        <NavItem section="chat_customer" active={activeSection} icon="chat" label="Student Support" onClick={(s: string) => { setActiveSection(s); setAutoStartUser(null); }} />
                    </nav>

                    <div className="p-6 border-t border-[#6605c7]/5 relative z-10 bg-white/50 backdrop-blur-3xl">
                        <div className="p-4 rounded-[1.5rem] bg-[#fbf9ff] border border-[#6605c7]/10 mb-3 group hover:border-[#6605c7]/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#6605c7]/20 to-[#6605c7]/5 flex items-center justify-center text-[#6605c7] border border-white shadow-sm overflow-hidden">
                                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="Avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-gray-900 truncate tracking-tight">{user?.firstName || 'Staff Agent'}</p>
                                    <p className="text-[9px] font-black text-[#6605c7]/60 uppercase tracking-[0.15em]">{user?.role?.replace('_', ' ')}</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={logout} className="w-full px-5 py-3.5 rounded-[1rem] flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 hover:text-red-600 transition-all font-black text-[10px] tracking-widest uppercase border border-transparent hover:border-red-100">
                            <span className="material-symbols-outlined text-sm">logout</span>
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 lg:pl-3">
                <div className="flex-1 bg-white rounded-[2.5rem] border border-[#6605c7]/5 shadow-[0_8px_30px_rgb(102,5,199,0.04)] overflow-hidden flex flex-col relative">
                    {/* Header */}
                    <header className="h-24 px-8 md:px-12 flex justify-between items-center sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-[#6605c7]/5">
                        <div className="flex items-center gap-6">
                            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-3 text-[#6605c7] hover:bg-[#6605c7]/5 rounded-2xl transition-colors">
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                            <h1 className="text-2xl font-black font-display text-gray-900 capitalize tracking-tight flex items-center gap-3">
                                {activeSection.replace('chat_', 'Chat ')} 
                                <span className="text-[#6605c7]/20">|</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#6605c7] bg-[#6605c7]/5 px-3 py-1.5 rounded-full mt-1 relative top-[-1px]">Connected</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Current Time</p>
                                <p className="text-xs font-bold text-[#6605c7]">{format(new Date(), 'HH:mm • MMM d, yyyy')}</p>
                            </div>
                        </div>
                    </header>

                    <div className={`flex-1 overflow-y-auto no-scrollbar relative ${activeSection.startsWith('chat_') ? 'p-0' : 'p-8 md:p-12 space-y-12'} `}>
                        {/* Background subtle blur element */}
                        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#6605c7]/5 rounded-full blur-[120px] pointer-events-none" />

                        {/* Chat Section Content */}
                        {activeSection === "chat_bank" && <ChatInterface role="bank" />}
                        {activeSection === "chat_customer" && <ChatInterface role="staff" initialUser={autoStartUser} />}

                        {/* Tab Selection Content */}
                        {activeSection === "overview" && (
                            <div className="relative z-10 space-y-10 animate-fade-in">
                                <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-[#6605c7]/5 pb-8">
                                    <div>
                                        <h2 className="text-5xl font-bold font-display mb-3 text-gray-900 tracking-tight">Dashboard Overview</h2>
                                        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#6605c7] animate-pulse" />
                                            Monitoring platform activity
                                        </p>
                                    </div>
                                    <div className="px-5 py-2.5 rounded-full bg-[#fbf9ff] border border-[#6605c7]/10 text-[10px] font-bold uppercase tracking-widest text-[#6605c7] shadow-sm flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[14px]">notifications</span>
                                        {pendingCount > 0 ? `${pendingCount} Applications Pending` : 'All tasks completed'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                                    <StatCard label="Total Applications" value={stats.apps?.total} icon="description" color="text-[#6605c7]" loading={loading} />
                                    <StatCard label="Pending Review" value={pendingCount} icon="pending_actions" color="text-amber-500" loading={loading} />
                                    <StatCard label="Approval Rate" value={`${approvalRate}%`} icon="verified" color="text-emerald-500" loading={loading} />
                                    <StatCard label="Published Blogs" value={stats.blogs?.published ?? stats.blogs?.total ?? 0} icon="article" color="text-blue-500" loading={loading} />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-6">
                                        <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#6605c7]/40 border-b border-[#6605c7]/10 pb-4">Performance Metrics</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="p-6 rounded-[2rem] bg-[#fbf9ff] border border-[#6605c7]/5 group hover:bg-[#6605c7]/5 transition-colors">
                                                <span className="material-symbols-outlined text-[#6605c7] mb-4 text-3xl opacity-50 group-hover:scale-110 transition-transform">published_with_changes</span>
                                                <div>
                                                    <p className="text-xl font-black text-gray-900 tracking-tighter">{approvedCount + rejectedCount}</p>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Processed</p>
                                                </div>
                                            </div>
                                            <div className="p-6 rounded-[2rem] bg-[#fbf9ff] border border-[#6605c7]/5 group hover:bg-[#6605c7]/5 transition-colors">
                                                <span className="material-symbols-outlined text-[#6605c7] mb-4 text-3xl opacity-50 group-hover:scale-110 transition-transform">supervisor_account</span>
                                                <div>
                                                    <p className="text-xl font-black text-gray-900 tracking-tighter">{Number(stats.users?.total ?? 0)}</p>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Accts Sync</p>
                                                </div>
                                            </div>
                                            <div className="p-6 rounded-[2rem] bg-red-50/50 border border-red-50 group hover:bg-red-50 transition-colors">
                                                <span className="material-symbols-outlined text-red-400 mb-4 text-3xl opacity-50 group-hover:scale-110 transition-transform">warning</span>
                                                <div>
                                                    <p className="text-xl font-black text-red-600 tracking-tighter">{rejectedCount + Number(stats.apps?.cancelled ?? 0)}</p>
                                                    <p className="text-[9px] font-black text-red-400/80 uppercase tracking-widest mt-1">Flags</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#6605c7]/40 border-b border-[#6605c7]/10 pb-4">Quick Communication</h3>
                                        <div className="space-y-4">
                                            <button onClick={() => { setActiveSection('chat_customer'); setAutoStartUser(null); }} className="w-full text-left p-6 rounded-[2rem] border border-[#6605c7]/10 hover:border-[#6605c7]/30 hover:bg-[#6605c7]/5 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                                                <div className="absolute right-[-10px] bottom-[-10px] w-20 h-20 bg-[#6605c7]/10 rounded-full blur-2xl group-hover:bg-[#6605c7]/20 transition-all border-[#6605c7]" />
                                                <div className="flex items-center gap-4 relative z-10">
                                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-[#6605c7] border border-[#6605c7]/5">
                                                        <span className="material-symbols-outlined text-xl">forum</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 tracking-tight">Student Chat</p>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Direct support</p>
                                                    </div>
                                                </div>
                                            </button>
                                            <button onClick={() => { setActiveSection('chat_bank'); setAutoStartUser(null); }} className="w-full text-left p-6 rounded-[2rem] border border-[#6605c7]/10 hover:border-[#6605c7]/30 hover:bg-[#6605c7]/5 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                                                <div className="flex items-center gap-4 relative z-10">
                                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-[#6605c7] border border-[#6605c7]/5">
                                                        <span className="material-symbols-outlined text-xl">account_balance</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 tracking-tight">Bank Channel</p>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Lender requests</p>
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {["applications", "blogs", "community", "users"].includes(activeSection) && (
                            <div className="relative z-10 animate-fade-in space-y-10">
                                <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-[#6605c7]/5 pb-8">
                                    <div>
                                        <h2 className="text-5xl font-bold font-display text-gray-900 capitalize tracking-tight">{activeSection} Management</h2>
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-3">View and edit {activeSection} data</p>
                                    </div>
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        {activeSection === 'users' && (
                                            <button 
                                                onClick={() => setIsAddModalOpen(true)}
                                                className="px-6 py-4 bg-[#6605c7] text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-[#5504a5] shadow-lg shadow-[#6605c7]/20 transition-all flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-lg">person_add</span>
                                                Add Student
                                            </button>
                                        )}
                                        <div className="relative flex-1 md:w-80">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-xl">search</span>
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder={`Search ${activeSection}...`}
                                                className="w-full pl-12 pr-6 py-4 bg-[#fbf9ff] border border-gray-200 rounded-full text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 focus:border-[#6605c7]/20 transition-all"
                                            />
                                        </div>
                                        {activeSection === 'applications' && (
                                            <select
                                                value={filterStatus}
                                                onChange={(e) => setFilterStatus(e.target.value)}
                                                className="px-6 py-4 bg-[#fbf9ff] border border-[#6605c7]/10 rounded-full text-[10px] font-black uppercase tracking-[0.1em] text-[#6605c7] focus:outline-none focus:ring-4 focus:ring-[#6605c7]/10 focus:border-[#6605c7]/30 cursor-pointer appearance-none transition-all"
                                                style={{ backgroundImage: 'none' }}
                                            >
                                                <option value="all">Global view</option>
                                                <option value="pending">Pending</option>
                                                <option value="processing">In Progress</option>
                                                <option value="approved">Approved</option>
                                                <option value="rejected">Rejected</option>
                                            </select>
                                        )}
                                    </div>
                                </div>

                                <div className="overflow-hidden">
                                    <div className="overflow-x-auto pb-8">
                                        <table className="w-full text-left border-separate border-spacing-y-2">
                                            <TableHeader>
                                                {activeSection === "blogs" && (
                                                    <>
                                                        <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-[#6605c7]/50 border-b border-[#6605c7]/5">Document</th>
                                                        <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-[#6605c7]/50 border-b border-[#6605c7]/5 w-32">Status</th>
                                                        <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-[#6605c7]/50 border-b border-[#6605c7]/5 w-32">Engagement</th>
                                                    </>
                                                )}
                                                {activeSection === "applications" && (
                                                    <>
                                                        <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-[#6605c7]/50 border-b border-[#6605c7]/5 w-40">Reference</th>
                                                        <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-[#6605c7]/50 border-b border-[#6605c7]/5">Subject</th>
                                                        <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-[#6605c7]/50 border-b border-[#6605c7]/5">Partner</th>
                                                        <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-[#6605c7]/50 border-b border-[#6605c7]/5 w-32">State</th>
                                                        <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-[#6605c7]/50 border-b border-[#6605c7]/5 w-32">Task</th>
                                                    </>
                                                )}
                                                {activeSection === "users" && (
                                                    <>
                                                        <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-[#6605c7]/50 border-b border-[#6605c7]/5">Identity</th>
                                                        <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-[#6605c7]/50 border-b border-[#6605c7]/5">Contact</th>
                                                        <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-[#6605c7]/50 border-b border-[#6605c7]/5 w-32">Access</th>
                                                        <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-[#6605c7]/50 border-b border-[#6605c7]/5 w-40">Record</th>
                                                        <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-[#6605c7]/50 border-b border-[#6605c7]/5 w-32">Comm</th>
                                                    </>
                                                )}
                                                {activeSection === "community" && (
                                                    <>
                                                        <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-[#6605c7]/50 border-b border-[#6605c7]/5">Topic</th>
                                                        <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-[#6605c7]/50 border-b border-[#6605c7]/5 w-48">Creator</th>
                                                        <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-[#6605c7]/50 border-b border-[#6605c7]/5 w-32">Signal</th>
                                                    </>
                                                )}
                                            </TableHeader>
                                            <tbody>
                                                {loading ? (
                                                    <tr>
                                                        <td colSpan={6} className="px-8 py-32 text-center">
                                                            <div className="flex flex-col items-center justify-center gap-4">
                                                                <div className="w-12 h-12 border-[3px] border-[#6605c7]/10 border-t-[#6605c7] rounded-full animate-spin" />
                                                                <p className="text-[10px] font-black tracking-[0.2em] text-[#6605c7]/40 uppercase">Syncing</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : filteredData.length > 0 ? filteredData.map((item, idx) => (
                                                    <tr key={idx} className="group transition-all duration-300 transform hover:-translate-y-0.5">
                                                        {activeSection === "blogs" && (
                                                            <>
                                                                <td className="px-8 py-5 bg-[#fbf9ff] group-hover:bg-[#6605c7] rounded-l-[1.5rem] group-hover:shadow-[0_8px_20px_rgb(102,5,199,0.15)] transition-all">
                                                                    <p className="text-sm font-black text-gray-900 group-hover:text-white tracking-tight leading-none mb-1">{item.title}</p>
                                                                    <p className="text-[10px] font-bold text-[#6605c7]/50 group-hover:text-white/70">by {item.authorName}</p>
                                                                </td>
                                                                <td className="px-8 py-5 bg-[#fbf9ff] group-hover:bg-[#6605c7] transition-all">
                                                                    <span className="text-[9px] uppercase font-black tracking-widest text-[#6605c7] bg-white/60 px-3 py-1.5 rounded-full">{item.isPublished ? 'Live' : 'Draft'}</span>
                                                                </td>
                                                                <td className="px-8 py-5 bg-[#fbf9ff] group-hover:bg-[#6605c7] rounded-r-[1.5rem] transition-all group-hover:shadow-[0_8px_20px_rgb(102,5,199,0.15)] text-[10px] font-black text-gray-500 group-hover:text-white/70 uppercase">
                                                                    {item.views || 0} hits
                                                                </td>
                                                            </>
                                                        )}
                                                        {activeSection === "applications" && (
                                                            <>
                                                                <td className="px-8 py-5 bg-[#fbf9ff] group-hover:bg-white border border-transparent group-hover:border-[#6605c7]/10 rounded-l-[1.5rem] transition-all text-[10px] font-black tracking-widest text-[#6605c7]/50 uppercase">{item.applicationNumber}</td>
                                                                <td className="px-8 py-5 bg-[#fbf9ff] group-hover:bg-white border border-transparent group-hover:border-[#6605c7]/10 group-hover:border-x-0 transition-all">
                                                                    <p className="text-sm font-black text-gray-900 tracking-tight">{item.firstName} {item.lastName}</p>
                                                                </td>
                                                                <td className="px-8 py-5 bg-[#fbf9ff] group-hover:bg-white border border-transparent group-hover:border-[#6605c7]/10 group-hover:border-x-0 transition-all text-xs font-black text-gray-600">{item.bank}</td>
                                                                <td className="px-8 py-5 bg-[#fbf9ff] group-hover:bg-white border border-transparent group-hover:border-[#6605c7]/10 group-hover:border-x-0 transition-all">
                                                                    <span className={`inline-flex px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusColors[item.status] || "bg-gray-100 text-gray-600"}`}>
                                                                        {item.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-8 py-5 bg-[#fbf9ff] group-hover:bg-white border border-transparent group-hover:border-[#6605c7]/10 rounded-r-[1.5rem] transition-all">
                                                                    <button
                                                                        onClick={() => { setSelectedApp(item); setActionRemarks(""); }}
                                                                        className="px-5 py-2.5 bg-[#6605c7] text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:shadow-[0_8px_15px_rgb(102,5,199,0.25)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                                                                    >
                                                                        Audit
                                                                    </button>
                                                                </td>
                                                            </>
                                                        )}
                                                        {activeSection === "users" && (
                                                            <>
                                                                <td className="px-8 py-5 bg-[#fbf9ff] group-hover:bg-[#6605c7]/5 rounded-l-[1.5rem] transition-all">
                                                                    <p className="text-sm font-bold text-gray-900 tracking-tight">{item.firstName || '—'} {item.lastName || ''}</p>
                                                                </td>
                                                                <td className="px-8 py-5 bg-[#fbf9ff] group-hover:bg-[#6605c7]/5 transition-all text-xs font-bold text-[#6605c7]/70">{item.email}</td>
                                                                <td className="px-8 py-5 bg-[#fbf9ff] group-hover:bg-[#6605c7]/5 transition-all">
                                                                    <span className="text-[9px] uppercase font-bold tracking-widest text-[#6605c7] bg-white px-3 py-1.5 rounded-full border border-[#6605c7]/10">{item.role?.replace('_', ' ')}</span>
                                                                </td>
                                                                <td className="px-8 py-5 bg-[#fbf9ff] group-hover:bg-[#6605c7]/5 transition-all text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                                    {item.createdAt ? format(new Date(item.createdAt), 'dd MMM yyyy') : '—'}
                                                                </td>
                                                                <td className="px-8 py-5 bg-[#fbf9ff] group-hover:bg-[#6605c7]/5 rounded-r-[1.5rem] transition-all">
                                                                    {item.role !== 'agent' && (
                                                                        <button
                                                                            onClick={() => { setAutoStartUser(item); setActiveSection("chat_customer"); }}
                                                                            className="w-10 h-10 bg-white shadow-sm text-[#6605c7] rounded-full hover:bg-[#6605c7] hover:text-white flex items-center justify-center transition-all"
                                                                        >
                                                                            <span className="material-symbols-outlined text-lg">chat</span>
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </>
                                                        )}
                                                        {activeSection === "community" && (
                                                            <>
                                                                <td className="px-8 py-5 bg-[#fbf9ff] group-hover:bg-[#6605c7]/5 rounded-l-[1.5rem] transition-all">
                                                                    <p className="text-sm font-black text-gray-900 tracking-tight">{item.title}</p>
                                                                </td>
                                                                <td className="px-8 py-5 bg-[#fbf9ff] group-hover:bg-[#6605c7]/5 transition-all text-[10px] font-black uppercase tracking-widest text-gray-500">{item.author?.firstName}</td>
                                                                <td className="px-8 py-5 bg-[#fbf9ff] group-hover:bg-[#6605c7]/5 rounded-r-[1.5rem] transition-all flex items-center gap-2 text-[10px] font-black text-[#6605c7] uppercase">
                                                                    <span className="material-symbols-outlined text-[14px]">favorite</span> {item.likesCount || 0}
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={6} className="px-8 py-32 text-center">
                                                            <div className="flex flex-col items-center justify-center opacity-40">
                                                                <span className="material-symbols-outlined text-6xl mb-4">search_off</span>
                                                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Zero Records Found</p>
                                                            </div>
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
                </div>
            </main>

            {/* Application Detail Modal Overlay */}
            {selectedApp && (
                <div className="fixed inset-0 z-[60] flex">
                    <div className="absolute inset-0 bg-[#fbf9ff]/80 backdrop-blur-md" onClick={() => setSelectedApp(null)} />
                    <div className="absolute right-4 top-4 bottom-4 w-full max-w-xl bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(102,5,199,0.08)] border border-[#6605c7]/10 overflow-hidden flex flex-col transform transition-transform animate-slide-in-right">
                        <div className="p-8 border-b border-[#6605c7]/5 flex items-center justify-between bg-white relative z-10">
                            <h2 className="text-2xl font-black font-display text-gray-900 tracking-tighter">Application Details <span className="text-[#6605c7]">#{selectedApp.applicationNumber}</span></h2>
                            <button onClick={() => setSelectedApp(null)} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar bg-[#fbf9ff]/30">
                            <div className="bg-white p-6 rounded-[2rem] border border-[#6605c7]/5 flex justify-between items-center">
                                <div>
                                    <p className="text-[9px] text-[#6605c7]/60 uppercase font-black tracking-[0.2em] mb-1">Primary Applicant</p>
                                    <p className="text-xl font-black text-gray-900 tracking-tight">{selectedApp.firstName} {selectedApp.lastName}</p>
                                    <p className="text-xs font-bold text-gray-500 mt-1">{selectedApp.email} <span className="mx-2 text-gray-300">|</span> {selectedApp.phone}</p>
                                </div>
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#6605c7] to-[#4e0399] flex items-center justify-center text-white shadow-lg shadow-[#6605c7]/20">
                                   <span className="material-symbols-outlined text-2xl font-black">person</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-6 rounded-[2rem] border border-[#6605c7]/5">
                                    <p className="text-[9px] text-[#6605c7]/60 uppercase font-black tracking-[0.2em] mb-1">Financial Request</p>
                                    <p className="text-2xl font-black text-[#6605c7] tracking-tighter">₹{Number(selectedApp.amount).toLocaleString('en-IN')}</p>
                                    <p className="text-xs font-bold text-gray-500 mt-1">{selectedApp.loanType || 'General'}</p>
                                </div>
                                <div className="bg-white p-6 rounded-[2rem] border border-[#6605c7]/5">
                                    <p className="text-[9px] text-[#6605c7]/60 uppercase font-black tracking-[0.2em] mb-1">Partner Route</p>
                                    <p className="text-lg font-black text-gray-900 tracking-tight mt-2">{selectedApp.bank}</p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-[2rem] border border-[#6605c7]/5">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">folder_open</span>
                                    Student Documents
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between group hover:bg-white transition-all cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                                <span className="material-symbols-outlined">description</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-900">Aadhaar Card.pdf</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Identification</p>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-gray-300 group-hover:text-[#6605c7]">download</span>
                                    </div>
                                    <button className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:border-[#6605c7]/30 hover:text-[#6605c7] transition-all flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-lg">add_circle</span>
                                        Request Additional Document
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-[2rem] border border-[#6605c7]/5">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#6605c7]/60 mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[14px]">rate_review</span>
                                    Staff Remarks
                                </h3>
                                <textarea
                                    value={actionRemarks}
                                    onChange={(e) => setActionRemarks(e.target.value)}
                                    placeholder="Enter internal audit notes or rejection rationale..."
                                    className="w-full p-5 bg-[#fbf9ff] border border-[#6605c7]/10 rounded-[1.5rem] text-sm focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 focus:border-[#6605c7]/30 transition-all mb-6 font-medium placeholder:font-bold placeholder:text-gray-400"
                                    rows={4}
                                />
                                <div className="grid grid-cols-3 gap-3">
                                    <button disabled={actionLoading} onClick={() => handleAppStatus(selectedApp.id, 'processing')} className="py-4 text-[10px] font-bold uppercase tracking-widest bg-gray-50 text-gray-600 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all">Move to Processing</button>
                                    <button disabled={actionLoading} onClick={() => handleAppStatus(selectedApp.id, 'approved')} className="py-4 text-[10px] font-bold uppercase tracking-widest bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10">Approve</button>
                                    <button disabled={actionLoading} onClick={() => handleAppStatus(selectedApp.id, 'rejected')} className="py-4 text-[10px] font-bold uppercase tracking-widest bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all">Reject</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Student Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-zoom-in">
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold font-display flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#6605c7]">person_add</span>
                                Add New Student
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleCreateStudent} className="p-8 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block ml-1">First Name</label>
                                    <input required type="text" value={newStudent.firstName} onChange={e => setNewStudent({...newStudent, firstName: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 focus:bg-white transition-all" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block ml-1">Last Name</label>
                                    <input required type="text" value={newStudent.lastName} onChange={e => setNewStudent({...newStudent, lastName: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 focus:bg-white transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block ml-1">Email Address</label>
                                <input required type="email" value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 focus:bg-white transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block ml-1">Mobile Number</label>
                                <input required type="tel" value={newStudent.mobile} onChange={e => setNewStudent({...newStudent, mobile: e.target.value})} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 focus:bg-white transition-all" />
                            </div>
                            <button disabled={createLoading} type="submit" className="w-full py-4 bg-[#6605c7] text-white text-[10px] font-bold uppercase tracking-widest rounded-2xl hover:bg-[#5504a5] shadow-lg shadow-[#6605c7]/20 transition-all flex items-center justify-center gap-2 mt-4">
                                {createLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : (
                                    <><span className="material-symbols-outlined text-lg">person_add</span> Create Student Account</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
