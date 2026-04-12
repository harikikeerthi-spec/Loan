"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { format } from "date-fns";
import ChatInterface from "@/components/Chat/ChatInterface";

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
        className={`w-full text-left px-5 py-4 rounded-xl flex items-center gap-4 group ${active === section ? "bg-[#1d4ed8]/10 text-[#1d4ed8]" : "text-gray-600 hover:bg-gray-50"}`}
    >
        <span className={`material-symbols-outlined transition-colors ${active === section ? "text-[#1d4ed8]" : "group-hover:text-[#1d4ed8]"}`}>{icon}</span>
        <span className="font-bold text-sm tracking-wide">{label}</span>
        {active === section && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1d4ed8] shadow-[0_0_8px_#1d4ed8]" />
        )}
    </button>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
    <thead className="border-b border-gray-100">
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

    // Application detail modal state
    const [selectedApp, setSelectedApp] = useState<any>(null);
    const [actionRemarks, setActionRemarks] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

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

    return (
        <div className="min-h-screen flex bg-[#f7f5f8]">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#1d4ed8]/10 transform transition-all duration-500 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="flex flex-col h-full">
                    <div className="p-8 border-b border-[#1d4ed8]/10">
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="w-10 h-10 rounded-2xl bg-[#1d4ed8] flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined font-bold">support_agent</span>
                            </div>
                            <span className="font-black text-2xl tracking-tighter text-gray-900 font-display">Vidhya<span className="text-[#1d4ed8]">Staff</span></span>
                        </div>
                    </div>

                    <nav className="flex-1 p-6 space-y-2 overflow-y-auto no-scrollbar">
                        <NavItem section="overview" active={activeSection} icon="dashboard" label="Dashboard" onClick={setActiveSection} />
                        <NavItem section="applications" active={activeSection} icon="description" label="Applications" onClick={setActiveSection} />
                        <NavItem section="users" active={activeSection} icon="person" label="Users" onClick={setActiveSection} />
                        <NavItem section="blogs" active={activeSection} icon="article" label="Blogs" onClick={setActiveSection} />
                        <NavItem section="community" active={activeSection} icon="groups" label="Community" onClick={setActiveSection} />
                        
                        <div className="my-4 border-t border-gray-100 pt-4 pb-2">
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-5">Communications</p>
                        </div>
                        <NavItem section="chat_bank" active={activeSection} icon="account_balance" label="Bank Partner Chat" onClick={setActiveSection} />
                        <NavItem section="chat_customer" active={activeSection} icon="forum" label="Customer Chat" onClick={setActiveSection} />
                    </nav>

                    <div className="p-6 border-t border-[#1d4ed8]/10">
                        <div className="glass-card p-4 rounded-2xl bg-gray-50 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#1d4ed8]/10 flex items-center justify-center text-[#1d4ed8] border border-[#1d4ed8]/20">
                                    <span className="material-symbols-outlined text-lg">person</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-gray-900 truncate">{user?.firstName || 'Staff User'}</p>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{user?.role?.replace('_', ' ')}</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={logout} className="w-full px-5 py-4 rounded-xl flex items-center gap-4 text-red-500 hover:bg-red-50 transition-colors font-bold text-sm">
                            <span className="material-symbols-outlined">logout</span>
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-20 bg-white/80 border-b border-[#1d4ed8]/10 px-8 flex justify-between items-center sticky top-0 z-40 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <h1 className="text-xl font-black font-display text-gray-900 capitalize tracking-tight">
                            {activeSection.replace('chat_', 'Chat ')} <span className="text-[#1d4ed8] opacity-40">/</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </header>

                <div className={`flex-1 overflow-y-auto no-scrollbar ${activeSection.startsWith('chat_') ? 'p-0' : 'p-8 space-y-8'}`}>
                    {/* Chat Section Content */}
                    {activeSection === "chat_bank" && <ChatInterface role="bank" />}
                    {activeSection === "chat_customer" && <ChatInterface role="staff" />}

                    {/* Tab Selection Content */}
                    {activeSection === "overview" && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-4">
                                <div>
                                    <h2 className="text-4xl font-black font-display mb-1 text-gray-900">Staff Portal</h2>
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Operational Overview</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard label="Total Blogs" value={stats.blogs?.total} icon="article" color="text-blue-500" loading={loading} />
                                <StatCard label="App Requests" value={stats.apps?.total} icon="description" color="text-[#1d4ed8]" loading={loading} />
                                <StatCard label="Registered Users" value={stats.users?.total} icon="person" color="text-emerald-500" loading={loading} />
                            </div>
                        </div>
                    )}

                    {["applications", "blogs", "community"].includes(activeSection) && (
                        <div className="animate-fade-in space-y-8">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <h2 className="text-4xl font-black font-display text-gray-900 capitalize tracking-tight">{activeSection} Control</h2>
                                </div>
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-80">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">filter_alt</span>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder={`Search ${activeSection}...`}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#1d4ed8]/5 shadow-sm"
                                        />
                                    </div>
                                    {activeSection === 'applications' && (
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="px-4 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-[#1d4ed8]/5 shadow-sm"
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

                            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl shadow-blue-900/5">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <TableHeader>
                                            {activeSection === "blogs" && (
                                                <>
                                                    <th className="px-8 py-5">Title</th>
                                                    <th className="px-8 py-5">State</th>
                                                    <th className="px-8 py-5">Metrics</th>
                                                </>
                                            )}
                                            {activeSection === "applications" && (
                                                <>
                                                    <th className="px-8 py-5">Audit ID</th>
                                                    <th className="px-8 py-5">Applicant</th>
                                                    <th className="px-8 py-5">Bank</th>
                                                    <th className="px-8 py-5">Audits</th>
                                                    <th className="px-8 py-5">Actions</th>
                                                </>
                                            )}
                                            {activeSection === "users" && (
                                                <>
                                                    <th className="px-8 py-5">User</th>
                                                    <th className="px-8 py-5">Email</th>
                                                    <th className="px-8 py-5">Role</th>
                                                    <th className="px-8 py-5">Joined</th>
                                                </>
                                            )}
                                            {activeSection === "community" && (
                                                <>
                                                    <th className="px-8 py-5">Post</th>
                                                    <th className="px-8 py-5">Author</th>
                                                    <th className="px-8 py-5">Stats</th>
                                                </>
                                            )}
                                        </TableHeader>
                                        <tbody className="divide-y divide-gray-50 bg-white">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={6} className="px-8 py-20 text-center">
                                                        <div className="flex justify-center"><div className="w-8 h-8 border-4 border-[#1d4ed8]/10 border-t-[#1d4ed8] rounded-full animate-spin"/></div>
                                                    </td>
                                                </tr>
                                            ) : filteredData.length > 0 ? filteredData.map((item, idx) => (
                                                <tr key={idx} className="group hover:bg-[#1d4ed8]/5 transition-all">
                                                    {activeSection === "blogs" && (
                                                        <>
                                                            <td className="px-8 py-6">
                                                                <p className="text-sm font-black text-gray-900 tracking-tight">{item.title}</p>
                                                                <p className="text-[10px] font-bold text-gray-400">by {item.authorName}</p>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">{item.isPublished ? 'Live' : 'Draft'}</span>
                                                            </td>
                                                            <td className="px-8 py-6 text-xs text-gray-500">{item.views || 0} views</td>
                                                        </>
                                                    )}
                                                    {activeSection === "applications" && (
                                                        <>
                                                            <td className="px-8 py-6 text-[10px] font-mono text-gray-400">{item.applicationNumber}</td>
                                                            <td className="px-8 py-6">
                                                                <p className="text-sm font-black text-gray-900 tracking-tight">{item.firstName} {item.lastName}</p>
                                                            </td>
                                                            <td className="px-8 py-6 text-sm font-bold text-gray-700">{item.bank}</td>
                                                            <td className="px-8 py-6">
                                                                <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${statusColors[item.status] || "bg-gray-100 text-gray-600"}`}>
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <button
                                                                    onClick={() => { setSelectedApp(item); setActionRemarks(""); }}
                                                                    className="px-4 py-2 bg-[#1d4ed8]/5 text-[#1d4ed8] text-[10px] font-black uppercase rounded-xl hover:bg-[#1d4ed8]/10 flex items-center gap-1.5"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">visibility</span> View
                                                                </button>
                                                            </td>
                                                        </>
                                                    )}
                                                    {activeSection === "users" && (
                                                        <>
                                                            <td className="px-8 py-6">
                                                                <p className="text-sm font-black text-gray-900 tracking-tight">{item.firstName || '—'} {item.lastName || ''}</p>
                                                            </td>
                                                            <td className="px-8 py-6 text-sm text-gray-600">{item.email}</td>
                                                            <td className="px-8 py-6">
                                                                <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">{item.role}</span>
                                                            </td>
                                                            <td className="px-8 py-6 text-xs text-gray-500">
                                                                {item.createdAt ? format(new Date(item.createdAt), 'dd MMM yyyy') : '—'}
                                                            </td>
                                                        </>
                                                    )}
                                                    {activeSection === "community" && (
                                                        <>
                                                            <td className="px-8 py-6">
                                                                <p className="text-sm font-black text-gray-900 tracking-tight">{item.title}</p>
                                                            </td>
                                                            <td className="px-8 py-6 text-xs font-bold text-gray-600">{item.author?.firstName}</td>
                                                            <td className="px-8 py-6 text-xs text-gray-500">{item.likesCount || 0} likes</td>
                                                        </>
                                                    )}
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={6} className="px-8 py-20 text-center text-gray-400">No matching data.</td>
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

            {/* Application Detail Modal Overlay (Minimal version for Staff) */}
            {selectedApp && (
                <div className="fixed inset-0 z-[60] flex">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedApp(null)} />
                    <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl overflow-y-auto">
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-black font-display text-gray-900">Application Details</h2>
                            <button onClick={() => setSelectedApp(null)} className="p-2 text-gray-400 hover:text-gray-600"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-black tracking-widest mb-1">Applicant</p>
                                <p className="text-lg font-black text-gray-900">{selectedApp.firstName} {selectedApp.lastName}</p>
                                <p className="text-sm text-gray-600">{selectedApp.email} | {selectedApp.phone}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-black tracking-widest mb-1">Loan</p>
                                <p className="text-md font-bold">{selectedApp.bank} - {selectedApp.loanType}</p>
                                <p className="text-sm text-blue-600 font-bold">₹{Number(selectedApp.amount).toLocaleString('en-IN')}</p>
                            </div>
                            
                            <div className="border-t border-gray-100 pt-6 mt-6">
                                <h3 className="text-sm font-black uppercase tracking-widest text-[#1d4ed8] mb-4">Update Status</h3>
                                <textarea
                                    value={actionRemarks}
                                    onChange={(e) => setActionRemarks(e.target.value)}
                                    placeholder="Add an internal note or reason for status change... (required for rejection)"
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/20 focus:bg-white transition-all mb-4"
                                    rows={3}
                                />
                                <div className="flex gap-3">
                                    <button disabled={actionLoading} onClick={() => handleAppStatus(selectedApp.id, 'processing')} className="flex-1 py-3 text-xs font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-100 transition-all">Process</button>
                                    <button disabled={actionLoading} onClick={() => handleAppStatus(selectedApp.id, 'approved')} className="flex-1 py-3 text-xs font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all">Approve</button>
                                    <button disabled={actionLoading} onClick={() => handleAppStatus(selectedApp.id, 'rejected')} className="flex-1 py-3 text-xs font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-all">Reject</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
