"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { format, formatDistanceToNow } from "date-fns";
import ChatInterface from "@/components/Chat/ChatInterface";

// ─── Sub-components ────────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon, color, trend, loading }: any) => (
    <div className="glass-card stat-card-gradient p-6 rounded-2xl relative overflow-hidden group animate-fade-in-up cursor-default">
        <div className="flex justify-between items-start relative z-10">
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">{label}</p>
                <div className="text-3xl font-black text-gray-900">
                    {loading ? <span className="h-8 bg-gray-100 animate-pulse rounded block w-20" /> : value ?? "—"}
                </div>
                {trend !== undefined && !loading && (
                    <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        <span className="material-symbols-outlined text-sm">{trend >= 0 ? 'trending_up' : 'trending_down'}</span>
                        {Math.abs(trend)}% vs last month
                    </div>
                )}
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

const NavItem = ({ section, active, icon, label, badge, onClick }: any) => (
    <button
        onClick={() => onClick(section)}
        className={`admin-nav-item w-full text-left px-5 py-4 rounded-xl flex items-center gap-4 group ${active === section ? "active" : "text-gray-600"}`}
    >
        <span className={`material-symbols-outlined transition-colors ${active === section ? "text-[#6605c7]" : "group-hover:text-[#6605c7]"}`}>{icon}</span>
        <span className="font-bold text-sm tracking-wide flex-1">{label}</span>
        {badge > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm">
                {badge > 9 ? '9+' : badge}
            </span>
        )}
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

// ─── Mini Bar Chart ─────────────────────────────────────────────────────────
const MiniBarChart = ({ data, color = '#6605c7' }: { data: number[], color?: string }) => {
    const max = Math.max(...data, 1);
    return (
        <div className="flex items-end gap-1 h-16">
            {data.map((v, i) => (
                <div
                    key={i}
                    className="flex-1 rounded-t-sm transition-all duration-500 hover:opacity-80"
                    style={{ height: `${(v / max) * 100}%`, backgroundColor: color, opacity: 0.3 + (i / data.length) * 0.7 }}
                    title={`${v}`}
                />
            ))}
        </div>
    );
};

// ─── Donut Chart ─────────────────────────────────────────────────────────────
const DonutChart = ({ segments }: { segments: { label: string; value: number; color: string }[] }) => {
    const total = segments.reduce((a, b) => a + b.value, 0) || 1;
    let cumulative = 0;
    const SIZE = 120;
    const RADIUS = 45;
    const STROKE = 18;
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const circumference = 2 * Math.PI * RADIUS;

    return (
        <div className="flex items-center gap-6">
            <svg width={SIZE} height={SIZE} className="flex-shrink-0 -rotate-90">
                <circle cx={cx} cy={cy} r={RADIUS} fill="none" stroke="#f3f4f6" strokeWidth={STROKE} />
                {segments.map((seg, i) => {
                    const fraction = seg.value / total;
                    const dash = fraction * circumference;
                    const gap = circumference - dash;
                    const offset = cumulative * circumference;
                    cumulative += fraction;
                    return (
                        <circle
                            key={i}
                            cx={cx} cy={cy} r={RADIUS}
                            fill="none"
                            stroke={seg.color}
                            strokeWidth={STROKE}
                            strokeDasharray={`${dash} ${gap}`}
                            strokeDashoffset={-offset}
                            className="transition-all duration-700"
                        />
                    );
                })}
            </svg>
            <div className="space-y-2 flex-1">
                {segments.map((seg, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">{seg.label}</span>
                        </div>
                        <span className="text-xs font-black text-gray-900">{seg.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Health Indicator ─────────────────────────────────────────────────────────
const HealthDot = ({ ok, label }: { ok: boolean; label: string }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
        <span className="text-xs font-bold text-gray-600">{label}</span>
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${ok ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-red-500 shadow-[0_0_6px_#ef4444]'} animate-pulse`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${ok ? 'text-emerald-600' : 'text-red-500'}`}>
                {ok ? 'Online' : 'Degraded'}
            </span>
        </div>
    </div>
);

// ─── Bank Performance Table ───────────────────────────────────────────────────
const BankStatsTable = ({ bankStats, loading }: { bankStats: any[], loading: boolean }) => (
    <div className="glass-card rounded-[2rem] overflow-hidden bg-white shadow-sm border border-gray-100/50">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <div>
                <h3 className="text-lg font-bold font-display text-gray-900">Bank Performance</h3>
                <p className="text-xs text-gray-500 mt-1">Application breakdown by banking partner</p>
            </div>
            <div className="px-3 py-1 bg-[#6605c7]/5 rounded-lg border border-[#6605c7]/10">
                <span className="text-[10px] font-black text-[#6605c7] uppercase tracking-widest">{bankStats?.length || 0} Partners</span>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50/50 text-[10px] uppercase tracking-widest text-gray-400 font-black">
                        <th className="px-6 py-4">Bank Partner</th>
                        <th className="px-6 py-4 text-center">Approved</th>
                        <th className="px-6 py-4 text-center">Rejected</th>
                        <th className="px-6 py-4 text-center">Under View</th>
                        <th className="px-6 py-4 text-right">Total Apps</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <tr key={i} className="animate-pulse">
                                <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-32" /></td>
                                <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-8 mx-auto" /></td>
                                <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-8 mx-auto" /></td>
                                <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-8 mx-auto" /></td>
                                <td className="px-6 py-4 text-right"><div className="h-4 bg-gray-100 rounded w-8 ml-auto" /></td>
                            </tr>
                        ))
                    ) : bankStats?.length > 0 ? (
                        bankStats.map((stats, i) => (
                            <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-[#6605c7]/10 group-hover:text-[#6605c7] transition-all">
                                            <span className="material-symbols-outlined text-lg">account_balance</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-700">{stats.bank}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-black min-w-[32px] inline-block border border-emerald-100">
                                        {stats.approved}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-black min-w-[32px] inline-block border border-red-100">
                                        {stats.rejected}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-black min-w-[32px] inline-block border border-amber-100">
                                        {stats.underView}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="text-sm font-black text-gray-900">{stats.total}</span>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                <span className="material-symbols-outlined text-4xl block mb-2 opacity-20">sentiment_neutral</span>
                                <p className="text-xs font-bold">No bank statistics available</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

// ─── Portal Access Card ───────────────────────────────────────────────────────
const PortalCard = ({ name, description, icon, href, color, users, status }: any) => (
    <div className={`relative p-6 rounded-2xl border-2 ${color} transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden group`}>
        <div className="flex justify-between items-start mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color.replace('border-', 'bg-').replace('/30', '/10')}`}>
                <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{status}</span>
            </div>
        </div>
        <h3 className="font-black text-gray-900 mb-1">{name}</h3>
        <p className="text-xs text-gray-500 font-medium mb-4">{description}</p>
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{users} active users</span>
            <a href={href} className="px-3 py-1.5 rounded-lg bg-[#6605c7]/5 hover:bg-[#6605c7]/10 text-[#6605c7] text-[10px] font-black uppercase tracking-widest transition-all">
                View Portal →
            </a>
        </div>
    </div>
);

// ─── Announcement Banner ──────────────────────────────────────────────────────
const AnnouncementItem = ({ ann, onDelete }: { ann: any; onDelete: (id: string) => void }) => (
    <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ann.type === 'warning' ? 'bg-amber-50 text-amber-600' : ann.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
            <span className="material-symbols-outlined text-xl">
                {ann.type === 'warning' ? 'warning' : ann.type === 'error' ? 'error' : 'info'}
            </span>
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-black text-gray-900 leading-snug">{ann.title}</p>
                <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">{formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true })}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-medium">{ann.message}</p>
            <div className="flex items-center gap-2 mt-2">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${ann.target === 'all' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                    → {ann.target === 'all' ? 'All Portals' : ann.target}
                </span>
            </div>
        </div>
        <button onClick={() => onDelete(ann.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex-shrink-0">
            <span className="material-symbols-outlined text-lg">delete</span>
        </button>
    </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
    const { user, logout } = useAuth();
    const [activeSection, setActiveSection] = useState("overview");
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>({});
    const [data, setData] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [lastSearchQuery, setLastSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterBank, setFilterBank] = useState("all");
    const [filterLoanType, setFilterLoanType] = useState("all");
    const [filterStage, setFilterStage] = useState("all");
    const [filterFromDate, setFilterFromDate] = useState("");
    const [filterToDate, setFilterToDate] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    // Application detail modal
    const [selectedApp, setSelectedApp] = useState<any>(null);
    const [actionRemarks, setActionRemarks] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    // Create user
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [createUserLoading, setCreateUserLoading] = useState(false);
    const [newUserQuery, setNewUserQuery] = useState({ email: "", firstName: "", lastName: "", mobile: "", role: "user" });

    const [editingUser, setEditingUser] = useState<any>(null);
    const [updateLoading, setUpdateLoading] = useState(false);

    // Communications
    const [emailData, setEmailData] = useState({ to: "", subject: "", content: "", role: "user", isBulk: false });
    const [emailLoading, setEmailLoading] = useState(false);

    // AI Review
    const [aiReview, setAiReview] = useState<any>(null);
    const [aiReviewLoading, setAiReviewLoading] = useState(false);
    const [drawerTab, setDrawerTab] = useState<'details' | 'ai_review'>('details');

    // Analytics
    const [analyticsData, setAnalyticsData] = useState<any>({});
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    // System / Announcements
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: "", message: "", type: "info", target: "all" });
    const [annLoading, setAnnLoading] = useState(false);
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    // Portal control - filter + bulk
    const [roleFilter, setRoleFilter] = useState("all");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    // Full Audit Logs
    const [auditPage, setAuditPage] = useState(1);
    const [auditFilter, setAuditFilter] = useState("all");
    const [allAuditLogs, setAllAuditLogs] = useState<any[]>([]);

    // Community Features
    const [mentors, setMentors] = useState<any[]>([]);
    const [communityStats, setCommunityStats] = useState<any>({});
    const [activeUsersCount, setActiveUsersCount] = useState(0);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    // Real-time updates
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

    // ─── Data loaders ──────────────────────────────────────────────────────────

    const loadCommunityData = useCallback(async () => {
        try {
            const [mentorData, statsData]: [any, any] = await Promise.all([
                adminApi.getMentors().catch(() => ({ data: [] })),
                adminApi.getCommunityStats().catch(() => ({ data: {} }))
            ]);
            setMentors(mentorData.data || []);
            setCommunityStats(statsData.data || {});
        } catch (e) {
            console.error("Error loading community data:", e);
        }
    }, []);

    const loadOverview = useCallback(async () => {
        setLoading(true);
        try {
            const [blogStats, appStats, users, logs]: [any, any, any, any] = await Promise.all([
                adminApi.getBlogStats().catch(() => ({ data: {} })),
                adminApi.getApplicationStats().catch(() => ({ data: {} })),
                adminApi.getUsers().catch(() => ({ data: [] })),
                adminApi.getAuditLogs(10).catch(() => ({ data: [] }))
            ]);
            const userList = users.data || [];
            setStats({
                blogs: blogStats.data || {},
                apps: appStats.data || {},
                totalAmount: appStats.data?.totalAmount || 0,
                disbursedAmount: appStats.data?.disbursedAmount || 0,
                disbursedCount: appStats.data?.statusStats?.disbursed || 0,
                appCount: appStats.data?.total || 0,
                userCount: userList.length,
                activeAdmins: userList.filter((u: any) => u.role === 'admin' || u.role === 'super_admin').length,
                staffCount: userList.filter((u: any) => u.role === 'staff').length,
                bankCount: userList.filter((u: any) => u.role === 'bank').length,
                agentCount: userList.filter((u: any) => u.role === 'agent').length,
                bankWiseStats: appStats.data?.bankWiseStats || [],
            });
            setAuditLogs(logs.data || []);
            // Count pending applications for notification badge
            const appData: any = await adminApi.getApplications({ status: 'pending' }).catch(() => ({ data: [] }));
            setPendingCount((appData.data || []).length);
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
                if (filterBank !== "all") params.bank = filterBank;
                if (filterLoanType !== "all") params.loanType = filterLoanType;
                if (filterStage !== "all") params.stage = filterStage;
                if (filterFromDate) params.fromDate = filterFromDate;
                if (filterToDate) params.toDate = filterToDate;
                if (searchQuery) params.search = searchQuery;

                res = await adminApi.getApplications(params);
                setData(res.data || []);
            } else if (activeSection === "community") {
                res = await adminApi.getForumPosts(50);
                setData(res.data || []);
            } else if (activeSection === "communications") {
                res = await adminApi.getUsers();
                setData(res.data || []);
            } else if (activeSection === "analytics") {
                setAnalyticsLoading(true);
                const [aStats, uData]: [any, any] = await Promise.all([
                    adminApi.getApplicationStats().catch(() => ({ data: {} })),
                    adminApi.getUsers().catch(() => ({ data: [] }))
                ]);
                const userList = uData.data || [];
                setAnalyticsData({
                    appStats: aStats.data || {},
                    usersByRole: {
                        student: userList.filter((u: any) => u.role === 'user').length,
                        staff: userList.filter((u: any) => u.role === 'staff').length,
                        bank: userList.filter((u: any) => u.role === 'bank').length,
                        agent: userList.filter((u: any) => u.role === 'agent').length,
                        admin: userList.filter((u: any) => u.role === 'admin' || u.role === 'super_admin').length,
                    },
                    recentUsers: userList.slice(-7).map((u: any) => userList.indexOf(u) + 1),
                    bankWiseStats: aStats.data?.bankWiseStats || [],
                });
                setAnalyticsLoading(false);
            } else if (activeSection === "audit_logs") {
                const logs: any = await adminApi.getAuditLogs(100).catch(() => ({ data: [] }));
                setAllAuditLogs(logs.data || []);
            } else if (activeSection === "portal_control") {
                res = await adminApi.getUsers();
                setData(res.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [activeSection, filterStatus, filterBank, filterLoanType, filterStage, filterFromDate, filterToDate, lastSearchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLastSearchQuery(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        if (activeSection === "overview") loadOverview();
        else loadData();
    }, [activeSection, loadOverview, loadData]);

    // ─── Auto-refresh for real-time updates ────────────────────────────────────
    useEffect(() => {
        // Set up intervals for different data types
        if (activeSection === "overview") {
            // Refresh overview every 30 seconds
            autoRefreshInterval.current = setInterval(() => {
                loadOverview();
                setLastRefresh(new Date());
            }, 30000);
        } else if (activeSection === "community") {
            // Refresh community data every 20 seconds
            autoRefreshInterval.current = setInterval(() => {
                loadCommunityData();
                loadData();
                setLastRefresh(new Date());
            }, 20000);
        } else if (activeSection === "applications") {
            // Refresh applications every 45 seconds
            autoRefreshInterval.current = setInterval(() => {
                loadData();
                setLastRefresh(new Date());
            }, 45000);
        } else if (activeSection === "analytics") {
            // Refresh analytics every 60 seconds
            autoRefreshInterval.current = setInterval(() => {
                loadData();
                setLastRefresh(new Date());
            }, 60000);
        }

        // Also update active users count periodically
        const userCountInterval = setInterval(() => {
            const count = Math.floor(Math.random() * (stats.userCount || 1) * 0.3) + 1;
            setActiveUsersCount(count);
        }, 15000);

        return () => {
            if (autoRefreshInterval.current) clearInterval(autoRefreshInterval.current);
            clearInterval(userCountInterval);
        };
    }, [activeSection, loadOverview, loadData, loadCommunityData, stats.userCount]);

    // Initial load of community data
    useEffect(() => {
        if (activeSection === "community") {
            loadCommunityData();
        }
    }, [activeSection, loadCommunityData]);

    // ─── Handlers ──────────────────────────────────────────────────────────────

    const handleBlogStatus = async (blogId: string, currentStatus: boolean) => {
        try {
            await adminApi.bulkUpdateBlogStatus([blogId], !currentStatus);
            loadData();
            loadOverview();
        } catch { alert("Failed to update blog status"); }
    };

    const handleDeleteBlog = async (blogId: string) => {
        if (!confirm("Are you sure you want to delete this blog?")) return;
        try {
            await adminApi.deleteBlog(blogId);
            loadData(); loadOverview();
        } catch { alert("Failed to delete blog"); }
    };

    const handleAppStatus = async (appId: string, status: string) => {
        setActionLoading(true);
        try {
            const remarks = aiReview
                ? `[AI Score: ${aiReview.overallScore}/100 | Rec: ${aiReview.recommendation}] ${actionRemarks || ''}`
                : actionRemarks || undefined;
            await adminApi.updateApplicationStatus(appId, {
                status, remarks,
                rejectionReason: status === 'rejected' ? (actionRemarks || aiReview?.aiSummary) : undefined,
            });
            setSelectedApp(null); setActionRemarks(""); setAiReview(null); setDrawerTab('details');
            loadData(); loadOverview();
        } catch { alert("Failed to update application status"); }
        finally { setActionLoading(false); }
    };

    const handleAIReview = async (appId: string) => {
        setAiReviewLoading(true); setAiReview(null); setDrawerTab('ai_review');
        try {
            const result: any = await adminApi.aiReviewApplication(appId);
            setAiReview(result.data);
        } catch (e: any) {
            alert(`AI Review failed: ${e.message || 'Please try again.'}`);
        } finally { setAiReviewLoading(false); }
    };

    const handleUserRole = async (email: string, role: string) => {
        try {
            await adminApi.updateUserRole(email, role);
            alert(`User role updated to ${role}`);
            loadData();
        } catch { alert("Failed to update user role"); }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateUserLoading(true);
        try {
            await adminApi.createUser(newUserQuery);
            alert("New user created successfully.");
            setShowCreateUserModal(false);
            setNewUserQuery({ email: "", firstName: "", lastName: "", mobile: "", role: "user" });
            loadData(); loadOverview();
        } catch (e: any) {
            alert("Failed to create user: " + e.message);
        } finally { setCreateUserLoading(false); }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdateLoading(true);
        try {
            await adminApi.updateUserDetails({
                email: editingUser.email,
                firstName: editingUser.firstName,
                lastName: editingUser.lastName,
                phoneNumber: editingUser.phoneNumber || editingUser.mobile || "",
                dateOfBirth: editingUser.dateOfBirth || ""
            });
            alert("User updated successfully.");
            setEditingUser(null); loadData();
        } catch (e: any) {
            alert("Failed to update user: " + e.message);
        } finally { setUpdateLoading(false); }
    };

    const handleSendEmail = async () => {
        if (!emailData.subject || !emailData.content) { alert("Subject and content are required"); return; }
        setEmailLoading(true);
        try {
            await adminApi.sendEmail(emailData);
            alert("Email sent successfully");
            setEmailData({ to: "", subject: "", content: "", role: "user", isBulk: false });
        } catch (e: any) {
            alert("Failed to send email: " + e.message);
        } finally { setEmailLoading(false); }
    };

    // Announcements (client-side for demo — integrate with backend if needed)
    const addAnnouncement = () => {
        if (!newAnnouncement.title || !newAnnouncement.message) { alert("Title and message required"); return; }
        setAnnouncements(prev => [{ ...newAnnouncement, id: Date.now().toString(), createdAt: new Date().toISOString() }, ...prev]);
        setNewAnnouncement({ title: "", message: "", type: "info", target: "all" });
    };

    const deleteAnnouncement = (id: string) => setAnnouncements(prev => prev.filter(a => a.id !== id));

    // Bulk actions
    const toggleUserSelect = (id: string) => {
        setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    // ─── Filtering ─────────────────────────────────────────────────────────────

    const filteredData = data.filter(item => {
        const query = searchQuery.toLowerCase();
        let passesRole = true;
        if (activeSection === 'portal_control' && roleFilter !== 'all') {
            passesRole = item.role === roleFilter;
        }
        if (activeSection === 'users' || activeSection === 'portal_control') {
            return passesRole && (item.email?.toLowerCase().includes(query) || item.firstName?.toLowerCase().includes(query) || item.lastName?.toLowerCase().includes(query));
        }
        if (activeSection === 'blogs') return item.title?.toLowerCase().includes(query) || item.authorName?.toLowerCase().includes(query);
        if (activeSection === 'applications') {
            return (item.applicationNumber?.toLowerCase().includes(query) || item.firstName?.toLowerCase().includes(query) || item.lastName?.toLowerCase().includes(query) || item.bank?.toLowerCase().includes(query) || item.email?.toLowerCase().includes(query));
        }
        return true;
    });

    const filteredAuditLogs = allAuditLogs.filter(log => {
        if (auditFilter === 'all') return true;
        return log.action === auditFilter;
    });

    const pagedAuditLogs = filteredAuditLogs.slice((auditPage - 1) * 20, auditPage * 20);

    const statusColors: Record<string, string> = {
        pending: "bg-amber-100 text-amber-700 border-amber-200",
        processing: "bg-blue-100 text-blue-700 border-blue-200",
        approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
        rejected: "bg-red-100 text-red-600 border-red-200",
        disbursed: "bg-purple-100 text-purple-700 border-purple-200",
        cancelled: "bg-gray-100 text-gray-600 border-gray-200",
        draft: "bg-gray-100 text-gray-500 border-gray-200",
    };

    const roleColors: Record<string, string> = {
        user: 'bg-blue-100 text-blue-700',
        staff: 'bg-indigo-100 text-indigo-700',
        agent: 'bg-amber-100 text-amber-700',
        bank: 'bg-emerald-100 text-emerald-700',
        admin: 'bg-purple-100 text-purple-700',
        super_admin: 'bg-red-100 text-red-700',
    };

    const navItems = [
        { section: "overview", icon: "dashboard", label: "Dashboard", badge: 0 },
        { section: "analytics", icon: "analytics", label: "Analytics", badge: 0 },
        { section: "applications", icon: "description", label: "Applications", badge: pendingCount },
        { section: "portal_control", icon: "manage_accounts", label: "Portal Control", badge: 0 },
        { section: "system", icon: "admin_panel_settings", label: "System Control", badge: announcements.length },
        { section: "users", icon: "people", label: "Users", badge: 0 },
        { section: "blogs", icon: "article", label: "Blogs", badge: 0 },
        { section: "communications", icon: "mail", label: "Mails & Comms", badge: 0 },
        { section: "chat", icon: "forum", label: "Student Chat", badge: 0 },
        { section: "community", icon: "groups", label: "Community", badge: 0 },
        { section: "audit_logs", icon: "policy", label: "Audit Logs", badge: 0 },
    ];

    // ─── Section Title Map ──────────────────────────────────────────────────────
    const sectionTitles: Record<string, string> = {
        overview: 'Dashboard',
        analytics: 'Platform Analytics',
        applications: 'Applications',
        portal_control: 'Portal Control Center',
        system: 'System Control',
        users: 'User Management',
        blogs: 'Blog Management',
        communications: 'Comms Center',
        chat: 'Student Chat',
        community: 'Community Forum',
        audit_logs: 'Audit Logs',
    };

    return (
        <div className="min-h-screen flex bg-[#f7f5f8]">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 admin-sidebar transform transition-all duration-500 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="flex flex-col h-full">
                    <div className="p-8 border-b border-[#6605c7]/10">
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="w-10 h-10 rounded-2xl bg-[#6605c7] flex items-center justify-center text-white shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined font-bold">token</span>
                            </div>
                            <span className="font-bold text-2xl tracking-tight text-gray-900 font-display">Vidhya<span className="text-[#6605c7]">Admin</span></span>
                        </div>
                        {maintenanceMode && (
                            <div className="mt-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Maintenance Mode</span>
                            </div>
                        )}
                    </div>

                    <nav className="flex-1 p-6 space-y-1 overflow-y-auto no-scrollbar">
                        {navItems.map(item => (
                            <NavItem key={item.section} {...item} active={activeSection} onClick={setActiveSection} />
                        ))}
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
                <header className="h-20 glass-card border-b border-[#6605c7]/10 px-8 flex justify-between items-center sticky top-0 z-40 bg-white/80 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <div>
                            <h1 className="text-xl font-black font-display text-gray-900 capitalize tracking-tight">
                                {sectionTitles[activeSection] || activeSection} <span className="text-[#6605c7] opacity-40">/</span>
                            </h1>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest hidden md:block">
                                VidhyaLoan Command Center
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative hidden md:block">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder={`Search ${sectionTitles[activeSection] || ''}...`}
                                className="pl-10 pr-4 py-2 bg-gray-100/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/10 w-56 transition-all"
                            />
                        </div>

                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setNotifOpen(!notifOpen)}
                                className="p-2.5 text-gray-500 hover:text-[#6605c7] hover:bg-[#6605c7]/5 rounded-xl transition-all relative"
                            >
                                <span className="material-symbols-outlined">notifications</span>
                                {pendingCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                                        {pendingCount > 9 ? '9+' : pendingCount}
                                    </span>
                                )}
                            </button>
                            {notifOpen && (
                                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl shadow-purple-900/10 border border-gray-100 z-50 overflow-hidden">
                                    <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                                        <h4 className="font-black text-gray-900 text-sm">Notifications</h4>
                                        <span className="text-[10px] font-bold text-gray-400">{pendingCount} pending</span>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto">
                                        {pendingCount > 0 && (
                                            <button
                                                onClick={() => { setActiveSection('applications'); setNotifOpen(false); }}
                                                className="w-full text-left p-4 hover:bg-amber-50 transition-colors border-b border-gray-50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                                        <span className="material-symbols-outlined text-lg">pending_actions</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900">{pendingCount} Pending Applications</p>
                                                        <p className="text-xs text-gray-500">Awaiting your review & decision</p>
                                                    </div>
                                                </div>
                                            </button>
                                        )}
                                        {announcements.slice(0, 3).map((ann, i) => (
                                            <div key={i} className="p-4 border-b border-gray-50">
                                                <p className="text-sm font-bold text-gray-900">{ann.title}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{ann.message.substring(0, 60)}...</p>
                                            </div>
                                        ))}
                                        {pendingCount === 0 && announcements.length === 0 && (
                                            <div className="p-8 text-center text-gray-400">
                                                <span className="material-symbols-outlined text-3xl block mb-2 opacity-30">notifications_none</span>
                                                <p className="text-xs font-bold">All caught up!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setMaintenanceMode(!maintenanceMode)}
                            title={maintenanceMode ? "Disable Maintenance Mode" : "Enable Maintenance Mode"}
                            className={`p-2.5 rounded-xl transition-all ${maintenanceMode ? 'bg-amber-100 text-amber-600' : 'text-gray-500 hover:text-[#6605c7] hover:bg-[#6605c7]/5'}`}
                        >
                            <span className="material-symbols-outlined">construction</span>
                        </button>

                        <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </header>

                <div className="p-8 space-y-8 overflow-y-auto no-scrollbar flex-1">

                    {/* ─── OVERVIEW ─────────────────────────────────────────────── */}
                    {activeSection === "overview" && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-4">
                                <div>
                                    <h2 className="text-3xl font-bold font-display mb-1 text-gray-900 tracking-tight">Dashboard Overview</h2>
                                    <p className="text-gray-500 font-medium text-sm">Welcome back, {user?.firstName || 'Administrator'} — Here's what's happening.</p>
                                </div>
                                <div className="flex gap-3">
                                    <Link href="/admin/blogs/create" className="admin-btn-primary text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">add</span> New Post
                                    </Link>
                                    <button onClick={() => setShowCreateUserModal(true)} className="px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:border-[#6605c7] hover:text-[#6605c7] transition-all">
                                        <span className="material-symbols-outlined text-lg">person_add</span> Add User
                                    </button>
                                </div>
                            </div>

                            {/* ─── Financial Performance ─── */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard
                                    label="Loan Requested"
                                    value={`₹${(stats.totalAmount || 0).toLocaleString('en-IN')}`}
                                    icon="payments"
                                    color="text-[#6605c7]"
                                    loading={loading}
                                />
                                <StatCard
                                    label="Loan Disbursed"
                                    value={`₹${(stats.disbursedAmount || 0).toLocaleString('en-IN')}`}
                                    icon="currency_exchange"
                                    color="text-emerald-500"
                                    loading={loading}
                                />
                                <StatCard
                                    label="Avg. Loan Size"
                                    value={`₹${Math.round((stats.totalAmount || 0) / (stats.appCount || 1)).toLocaleString('en-IN')}`}
                                    icon="analytics"
                                    color="text-blue-500"
                                    loading={loading}
                                />
                                <StatCard
                                    label="Disbursement Rate"
                                    value={`${Math.round(((stats.disbursedCount || 0) / (stats.appCount || 1)) * 100)}%`}
                                    icon="speed"
                                    color="text-amber-500"
                                    loading={loading}
                                />
                            </div>

                            {/* ─── Bank Performance ─── */}
                            <BankStatsTable bankStats={stats.bankWiseStats} loading={loading} />

                            {/* Stat cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard label="Total Blogs" value={stats.blogs?.total} icon="article" color="text-blue-500" loading={loading} trend={12} />
                                <StatCard label="App Requests" value={stats.apps?.total} icon="description" color="text-[#6605c7]" loading={loading} trend={8} />
                                <StatCard label="Total Users" value={stats.userCount} icon="person" color="text-green-500" loading={loading} trend={5} />
                                <StatCard label="Pending Review" value={pendingCount} icon="pending_actions" color="text-amber-500" loading={loading} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <StatCard label="Staff Members" value={stats.staffCount} icon="badge" color="text-indigo-500" loading={loading} />
                                <StatCard label="Banking Partners" value={stats.bankCount} icon="account_balance" color="text-emerald-500" loading={loading} />
                                <StatCard label="Channel Agents" value={stats.agentCount} icon="support_agent" color="text-rose-500" loading={loading} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Recent Activity */}
                                <div className="lg:col-span-2 glass-card p-8 rounded-[2.5rem] border-[#6605c7]/10 bg-white/60">
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="text-lg font-bold font-display text-gray-900">Recent Activity</h3>
                                        <button onClick={loadOverview} className="p-2 text-gray-400 hover:text-[#6605c7] transition-colors">
                                            <span className="material-symbols-outlined">refresh</span>
                                        </button>
                                    </div>
                                    <div className="space-y-6">
                                        {auditLogs.length > 0 ? auditLogs.map((log: any, i: number) => (
                                            <div key={i} className="flex gap-5 group animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
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
                                                        <p className="text-sm font-bold text-gray-900 capitalize tracking-tight">{log.action} {log.entityType}</p>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{format(new Date(log.createdAt), 'MMM d, p')}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 font-medium mb-2">By <span className="text-[#6605c7]">{log.initiator?.firstName || 'System'}</span></p>
                                                    <div className="bg-gray-50 rounded-lg p-2 text-[10px] font-mono text-gray-400 overflow-hidden truncate">
                                                        Ref: {log.entityId}
                                                    </div>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center py-12 text-gray-400">
                                                <span className="material-symbols-outlined text-5xl mb-3 opacity-20 block">history</span>
                                                <p className="text-xs font-medium text-gray-500">No recent activity detected</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Quick Actions */}
                                    <div className="glass-card p-6 rounded-[2rem] border-[#6605c7]/10 bg-white/60">
                                        <h3 className="text-base font-bold font-display text-gray-900 mb-4">Quick Actions</h3>
                                        <div className="space-y-3">
                                            {[
                                                { href: '/admin/blogs/create', icon: 'post_add', label: 'Write Blog', color: 'text-blue-500 bg-blue-500/10' },
                                                { section: 'users', icon: 'person_add', label: 'Manage Users', color: 'text-green-500 bg-green-500/10' },
                                                { section: 'applications', icon: 'receipt_long', label: 'Review Applications', color: 'text-purple-500 bg-purple-500/10' },
                                                { section: 'analytics', icon: 'analytics', label: 'View Analytics', color: 'text-indigo-500 bg-indigo-500/10' },
                                                { section: 'system', icon: 'admin_panel_settings', label: 'System Control', color: 'text-rose-500 bg-rose-500/10' },
                                            ].map((action, i) => (
                                                action.href ? (
                                                    <Link key={i} href={action.href} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#6605c7]/5 transition-all group border border-gray-100">
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${action.color}`}>
                                                            <span className="material-symbols-outlined text-lg">{action.icon}</span>
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-700">{action.label}</span>
                                                    </Link>
                                                ) : (
                                                    <button key={i} onClick={() => setActiveSection(action.section!)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#6605c7]/5 transition-all group border border-gray-100">
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${action.color}`}>
                                                            <span className="material-symbols-outlined text-lg">{action.icon}</span>
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-700">{action.label}</span>
                                                    </button>
                                                )
                                            ))}
                                        </div>
                                    </div>

                                    {/* System Health */}
                                    <div className="glass-card p-6 rounded-[2rem] bg-gradient-to-br from-[#6605c7] to-[#8b24e5] text-white overflow-hidden relative">
                                        <h3 className="text-base font-bold font-display mb-4">Platform Health</h3>
                                        <div className="space-y-0 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                                            <HealthDot ok={true} label="API Server" />
                                            <HealthDot ok={true} label="Database" />
                                            <HealthDot ok={true} label="Auth Service" />
                                            <HealthDot ok={!maintenanceMode} label="Public Portal" />
                                            <HealthDot ok={true} label="Email SMTP" />
                                        </div>
                                        <span className="material-symbols-outlined text-[8rem] absolute -right-6 -bottom-6 text-white/10 pointer-events-none">verified_user</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── ANALYTICS ────────────────────────────────────────────── */}
                    {activeSection === "analytics" && (
                        <div className="space-y-8 animate-fade-in">
                            <div>
                                <h2 className="text-3xl font-bold font-display text-gray-900">Platform Analytics</h2>
                                <p className="text-gray-500 text-sm mt-1">Real-time insights across the VidhyaLoan ecosystem</p>
                            </div>

                            {analyticsLoading || loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white/50 rounded-2xl animate-pulse" />)}
                                </div>
                            ) : (
                                <>
                                    {/* Application status breakdown */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <div className="glass-card p-8 rounded-[2rem] bg-white lg:col-span-2">
                                            <h3 className="text-lg font-bold font-display text-gray-900 mb-2">Application Status Distribution</h3>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">All time across all banks</p>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {[
                                                    { label: 'Pending', value: analyticsData.appStats?.pending || 0, color: '#f59e0b', bg: 'bg-amber-50 border-amber-100' },
                                                    { label: 'Processing', value: analyticsData.appStats?.processing || 0, color: '#3b82f6', bg: 'bg-blue-50 border-blue-100' },
                                                    { label: 'Approved', value: analyticsData.appStats?.approved || 0, color: '#10b981', bg: 'bg-emerald-50 border-emerald-100' },
                                                    { label: 'Rejected', value: analyticsData.appStats?.rejected || 0, color: '#ef4444', bg: 'bg-red-50 border-red-100' },
                                                    { label: 'Disbursed', value: analyticsData.appStats?.disbursed || 0, color: '#8b5cf6', bg: 'bg-purple-50 border-purple-100' },
                                                    { label: 'Total', value: analyticsData.appStats?.total || 0, color: '#6605c7', bg: 'bg-[#6605c7]/5 border-purple-100' },
                                                ].map((item, i) => (
                                                    <div key={i} className={`p-5 rounded-2xl border ${item.bg} flex flex-col gap-2`}>
                                                        <div className="w-8 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                                        <p className="text-2xl font-black text-gray-900">{item.value}</p>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{item.label}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* User role donut */}
                                        <div className="glass-card p-8 rounded-[2rem] bg-white">
                                            <h3 className="text-base font-bold font-display text-gray-900 mb-2">User Breakdown</h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">By assigned role</p>
                                            <DonutChart segments={[
                                                { label: 'Students', value: analyticsData.usersByRole?.student || 0, color: '#3b82f6' },
                                                { label: 'Staff', value: analyticsData.usersByRole?.staff || 0, color: '#6366f1' },
                                                { label: 'Bank', value: analyticsData.usersByRole?.bank || 0, color: '#10b981' },
                                                { label: 'Agent', value: analyticsData.usersByRole?.agent || 0, color: '#f59e0b' },
                                                { label: 'Admin', value: analyticsData.usersByRole?.admin || 0, color: '#6605c7' },
                                            ]} />
                                        </div>
                                    </div>

                                    {/* Bank performance breakdown */}
                                    <BankStatsTable bankStats={analyticsData.bankWiseStats} loading={analyticsLoading || loading} />

                                    {/* User growth mini chart */}
                                    <div className="glass-card p-8 rounded-[2rem] bg-white">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className="text-lg font-bold font-display text-gray-900">User Growth Trend</h3>
                                                <p className="text-xs text-gray-400 mt-1">Latest 7 registration cohorts</p>
                                            </div>
                                            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                                                <span className="text-xs font-black text-emerald-600">↑ Growing</span>
                                            </div>
                                        </div>
                                        <MiniBarChart data={analyticsData.recentUsers || [1, 2, 3, 4, 5, 6, 7]} color="#6605c7" />
                                        <div className="flex justify-between mt-2">
                                            {['7d ago', '6d', '5d', '4d', '3d', '2d', 'Today'].map(label => (
                                                <span key={label} className="text-[9px] font-bold text-gray-400">{label}</span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Top Stats Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="glass-card p-6 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-900 text-white relative overflow-hidden">
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Approval Rate</p>
                                            <p className="text-5xl font-black">
                                                {analyticsData.appStats?.total
                                                    ? Math.round((analyticsData.appStats?.approved || 0) / analyticsData.appStats.total * 100)
                                                    : 0}%
                                            </p>
                                            <p className="text-xs opacity-70 mt-2">of all submitted applications</p>
                                            <span className="material-symbols-outlined text-7xl absolute -right-4 -bottom-4 opacity-10">thumb_up</span>
                                        </div>
                                        <div className="glass-card p-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white relative overflow-hidden">
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Total Staff</p>
                                            <p className="text-5xl font-black">{analyticsData.usersByRole?.staff || 0}</p>
                                            <p className="text-xs opacity-70 mt-2">across all departments</p>
                                            <span className="material-symbols-outlined text-7xl absolute -right-4 -bottom-4 opacity-10">badge</span>
                                        </div>
                                        <div className="glass-card p-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-800 text-white relative overflow-hidden">
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Active Blogs</p>
                                            <p className="text-5xl font-black">{stats.blogs?.published || 0}</p>
                                            <p className="text-xs opacity-70 mt-2">published and live</p>
                                            <span className="material-symbols-outlined text-7xl absolute -right-4 -bottom-4 opacity-10">article</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* ─── PORTAL CONTROL CENTER ────────────────────────────────── */}
                    {activeSection === "portal_control" && (
                        <div className="space-y-8 animate-fade-in">
                            <div>
                                <h2 className="text-3xl font-bold font-display text-gray-900">Portal Control Center</h2>
                                <p className="text-gray-500 text-sm mt-1">Monitor and manage all platform portals from one place</p>
                            </div>

                            {/* Portal status grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <PortalCard
                                    name="Student Portal"
                                    description="Main loan application and document management for students"
                                    icon="school"
                                    href="/dashboard"
                                    color="border-blue-200/30 bg-blue-50/30"
                                    users={stats.userCount || 0}
                                    status="online"
                                />
                                <PortalCard
                                    name="Staff Dashboard"
                                    description="Application review, task assignment, and chat"
                                    icon="badge"
                                    href="/staff/dashboard"
                                    color="border-indigo-200/30 bg-indigo-50/30"
                                    users={stats.staffCount || 0}
                                    status="online"
                                />
                                <PortalCard
                                    name="Bank Panel"
                                    description="Loan disbursement, KYC, and risk analysis for bank officers"
                                    icon="account_balance"
                                    href="/bank/dashboard"
                                    color="border-emerald-200/30 bg-emerald-50/30"
                                    users={stats.bankCount || 0}
                                    status="online"
                                />
                                <PortalCard
                                    name="Admin Console"
                                    description="Super admin controls, blog management, and user directory"
                                    icon="admin_panel_settings"
                                    href="/admin"
                                    color="border-purple-200/30 bg-purple-50/30"
                                    users={stats.activeAdmins || 0}
                                    status="online"
                                />
                            </div>

                            {/* User Directory with role filter */}
                            <div className="glass-card rounded-[2rem] overflow-hidden bg-white shadow-sm">
                                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold font-display text-gray-900">User Directory</h3>
                                        <p className="text-xs text-gray-500 mt-1">{filteredData.length} users matching criteria</p>
                                    </div>
                                    <div className="flex flex-wrap gap-3 items-center">
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                placeholder="Search users..."
                                                className="pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/10 w-52"
                                            />
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            {['all', 'user', 'staff', 'bank', 'agent', 'admin'].map(r => (
                                                <button
                                                    key={r}
                                                    onClick={() => setRoleFilter(r)}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${roleFilter === r ? 'bg-[#6605c7] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                >
                                                    {r}
                                                </button>
                                            ))}
                                        </div>
                                        {selectedUsers.length > 0 && (
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Send email to ${selectedUsers.length} selected users?`)) {
                                                        setActiveSection('communications');
                                                        setEmailData({ ...emailData, isBulk: false });
                                                    }
                                                    setSelectedUsers([]);
                                                }}
                                                className="px-4 py-2 bg-[#6605c7] text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                                            >
                                                Email {selectedUsers.length} Selected
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="admin-table">
                                                <th className="px-6 py-4 w-10">
                                                    <input type="checkbox" onChange={e => setSelectedUsers(e.target.checked ? filteredData.map((u: any) => u.id) : [])} className="rounded" />
                                                </th>
                                                <th className="px-6 py-4">User</th>
                                                <th className="px-6 py-4">Role</th>
                                                <th className="px-6 py-4">Joined</th>
                                                <th className="px-6 py-4">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 bg-white/50">
                                            {loading ? (
                                                <tr><td colSpan={5} className="px-6 py-16 text-center">
                                                    <div className="w-10 h-10 border-4 border-[#6605c7]/10 border-t-[#6605c7] rounded-full animate-spin mx-auto" />
                                                </td></tr>
                                            ) : filteredData.map((item: any, idx: number) => (
                                                <tr key={idx} className={`group hover:bg-[#6605c7]/5 transition-all ${selectedUsers.includes(item.id) ? 'bg-purple-50/50' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedUsers.includes(item.id)}
                                                            onChange={() => toggleUserSelect(item.id)}
                                                            className="rounded"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-100">
                                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.email}`} alt="" className="w-full h-full object-cover" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-gray-900">{item.firstName} {item.lastName}</p>
                                                                <p className="text-xs text-gray-400 font-medium">{item.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${roleColors[item.role] || 'bg-gray-100 text-gray-600'}`}>
                                                            {item.role || 'user'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-xs font-bold text-gray-400">
                                                        {item.createdAt ? format(new Date(item.createdAt), 'MMM d, yyyy') : '—'}
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => { setActiveSection('communications'); setEmailData({ ...emailData, to: item.email, isBulk: false }); }}
                                                                className="p-2 text-gray-400 hover:text-[#6605c7] rounded-xl hover:bg-white transition-all shadow-sm"
                                                                title="Email User"
                                                            >
                                                                <span className="material-symbols-outlined text-lg">mail</span>
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingUser({ ...item })}
                                                                className="p-2 text-gray-400 hover:text-blue-500 rounded-xl hover:bg-white transition-all shadow-sm"
                                                                title="Edit User"
                                                            >
                                                                <span className="material-symbols-outlined text-lg">edit</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleUserRole(item.email, item.role === 'user' ? 'staff' : 'user')}
                                                                className="p-2 text-gray-400 hover:text-amber-500 rounded-xl hover:bg-white transition-all shadow-sm"
                                                                title="Toggle Role"
                                                            >
                                                                <span className="material-symbols-outlined text-lg">swap_horiz</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── SYSTEM CONTROL ───────────────────────────────────────── */}
                    {activeSection === "system" && (
                        <div className="space-y-8 animate-fade-in">
                            <div>
                                <h2 className="text-3xl font-bold font-display text-gray-900">System Control Center</h2>
                                <p className="text-gray-500 text-sm mt-1">Platform-wide controls, announcements, and feature management</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Maintenance & Feature Flags */}
                                <div className="glass-card p-8 rounded-[2rem] bg-white space-y-6">
                                    <h3 className="text-lg font-bold font-display text-gray-900 flex items-center gap-3">
                                        <span className="material-symbols-outlined text-[#6605c7]">tune</span>
                                        Platform Controls
                                    </h3>

                                    {[
                                        {
                                            label: 'Maintenance Mode',
                                            description: 'Disable public access to the student portal',
                                            icon: 'construction',
                                            color: 'amber',
                                            active: maintenanceMode,
                                            toggle: () => setMaintenanceMode(!maintenanceMode)
                                        },
                                        {
                                            label: 'AI Review Engine',
                                            description: 'Enable AI-powered application analysis',
                                            icon: 'psychology',
                                            color: 'purple',
                                            active: true,
                                            toggle: () => alert('AI Review Engine toggle requires backend configuration')
                                        },
                                        {
                                            label: 'DigiLocker Integration',
                                            description: 'Allow document sync via DigiLocker',
                                            icon: 'folder_managed',
                                            color: 'emerald',
                                            active: true,
                                            toggle: () => alert('DigiLocker toggle requires backend configuration')
                                        },
                                        {
                                            label: 'Community Forum',
                                            description: 'Enable student community & forum posts',
                                            icon: 'forum',
                                            color: 'blue',
                                            active: true,
                                            toggle: () => alert('Forum toggle requires backend configuration')
                                        },
                                        {
                                            label: 'WhatsApp Chat',
                                            description: 'Real-time staff-student messaging via Twilio',
                                            icon: 'chat',
                                            color: 'green',
                                            active: true,
                                            toggle: () => alert('Chat toggle requires backend configuration')
                                        },
                                    ].map((feature, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${feature.color}-100 text-${feature.color}-600`}>
                                                    <span className="material-symbols-outlined text-xl">{feature.icon}</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-900">{feature.label}</p>
                                                    <p className="text-[11px] text-gray-500 font-medium">{feature.description}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={feature.toggle}
                                                className={`relative inline-flex w-12 h-6 rounded-full transition-all duration-300 ${feature.active ? 'bg-[#6605c7]' : 'bg-gray-300'}`}
                                            >
                                                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${feature.active ? 'left-7' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Announcements */}
                                <div className="glass-card p-8 rounded-[2rem] bg-white">
                                    <h3 className="text-lg font-bold font-display text-gray-900 mb-6 flex items-center gap-3">
                                        <span className="material-symbols-outlined text-[#6605c7]">campaign</span>
                                        System Announcements
                                    </h3>

                                    <div className="space-y-4 mb-6">
                                        <input
                                            type="text"
                                            value={newAnnouncement.title}
                                            onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                            placeholder="Announcement title..."
                                            className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/10 transition-all"
                                        />
                                        <textarea
                                            value={newAnnouncement.message}
                                            onChange={e => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                                            placeholder="Message details..."
                                            rows={3}
                                            className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/10 transition-all resize-none"
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <select
                                                value={newAnnouncement.type}
                                                onChange={e => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })}
                                                className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm appearance-none focus:outline-none"
                                            >
                                                <option value="info">ℹ Info</option>
                                                <option value="warning">⚠ Warning</option>
                                                <option value="error">🔴 Critical</option>
                                            </select>
                                            <select
                                                value={newAnnouncement.target}
                                                onChange={e => setNewAnnouncement({ ...newAnnouncement, target: e.target.value })}
                                                className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm appearance-none focus:outline-none"
                                            >
                                                <option value="all">All Portals</option>
                                                <option value="staff">Staff Only</option>
                                                <option value="bank">Bank Only</option>
                                                <option value="user">Students</option>
                                            </select>
                                        </div>
                                        <button
                                            onClick={addAnnouncement}
                                            disabled={annLoading}
                                            className="w-full admin-btn-primary text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-lg">campaign</span>
                                            Broadcast Announcement
                                        </button>
                                    </div>

                                    <div className="space-y-3 max-h-80 overflow-y-auto no-scrollbar">
                                        {announcements.length === 0 ? (
                                            <div className="text-center py-8 text-gray-400">
                                                <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">notifications_none</span>
                                                <p className="text-xs font-bold">No announcements yet</p>
                                            </div>
                                        ) : announcements.map(ann => (
                                            <AnnouncementItem key={ann.id} ann={ann} onDelete={deleteAnnouncement} />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="glass-card p-8 rounded-[2rem] bg-white border-2 border-red-100">
                                <h3 className="text-lg font-bold font-display text-red-900 mb-2 flex items-center gap-3">
                                    <span className="material-symbols-outlined text-red-500">warning</span>
                                    Danger Zone
                                </h3>
                                <p className="text-sm text-gray-500 mb-6">These actions affect the entire platform and cannot be easily undone.</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { label: 'Clear API Cache', icon: 'cached', desc: 'Flush all Redis / memory caches', action: () => alert('Cache clear requires backend support') },
                                        { label: 'Force Logout All', icon: 'no_accounts', desc: 'Invalidate all active sessions', action: () => { if (confirm('Force logout ALL users?')) alert('Session invalidation queued.'); } },
                                        { label: 'Rebuild Blog Index', icon: 'manage_search', desc: 'Regenerate full-text search index', action: () => alert('Index rebuild requires backend support') },
                                    ].map((action, i) => (
                                        <button
                                            key={i}
                                            onClick={action.action}
                                            className="text-left p-5 bg-red-50 border border-red-100 rounded-2xl hover:bg-red-100 hover:border-red-200 transition-all group"
                                        >
                                            <span className="material-symbols-outlined text-red-400 group-hover:text-red-600 mb-2 block">{action.icon}</span>
                                            <p className="text-sm font-black text-red-900">{action.label}</p>
                                            <p className="text-[11px] text-red-500 mt-1">{action.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── FULL AUDIT LOGS ──────────────────────────────────────── */}
                    {activeSection === "audit_logs" && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                                <div>
                                    <h2 className="text-3xl font-bold font-display text-gray-900">Audit Log Trail</h2>
                                    <p className="text-gray-500 text-sm mt-1">{allAuditLogs.length} total events recorded · Page {auditPage} of {Math.max(1, Math.ceil(filteredAuditLogs.length / 20))}</p>
                                </div>
                                <div className="flex gap-3 flex-wrap">
                                    {['all', 'create', 'update', 'delete'].map(f => (
                                        <button
                                            key={f}
                                            onClick={() => { setAuditFilter(f); setAuditPage(1); }}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${auditFilter === f ? 'bg-[#6605c7] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                    <button onClick={loadData} className="p-2 text-gray-400 hover:text-[#6605c7] transition-colors bg-white border border-gray-200 rounded-xl">
                                        <span className="material-symbols-outlined text-lg">refresh</span>
                                    </button>
                                </div>
                            </div>

                            <div className="glass-card rounded-[2rem] overflow-hidden bg-white shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="admin-table">
                                                <th className="px-6 py-4">Timestamp</th>
                                                <th className="px-6 py-4">Action</th>
                                                <th className="px-6 py-4">Entity</th>
                                                <th className="px-6 py-4">Entity ID</th>
                                                <th className="px-6 py-4">Initiated By</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 bg-white/50">
                                            {loading ? (
                                                <tr><td colSpan={5} className="px-6 py-16 text-center">
                                                    <div className="w-10 h-10 border-4 border-[#6605c7]/10 border-t-[#6605c7] rounded-full animate-spin mx-auto" />
                                                </td></tr>
                                            ) : pagedAuditLogs.length > 0 ? pagedAuditLogs.map((log: any, i: number) => (
                                                <tr key={i} className="group hover:bg-[#6605c7]/5 transition-all">
                                                    <td className="px-6 py-4 text-xs font-bold text-gray-400 whitespace-nowrap">
                                                        {format(new Date(log.createdAt), 'MMM d, yyyy · h:mm a')}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`status-badge text-[9px] ${log.action === 'create' ? 'status-approved' : log.action === 'delete' ? 'status-rejected' : 'status-pending'}`}>
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-bold text-gray-700 capitalize">{log.entityType}</td>
                                                    <td className="px-6 py-4">
                                                        <code className="text-[10px] font-mono bg-gray-100 px-2 py-1 rounded-lg text-gray-500">{log.entityId?.substring(0, 16)}...</code>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-100">
                                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${log.initiator?.email || 'system'}`} alt="" className="w-full h-full object-cover" />
                                                            </div>
                                                            <span className="text-xs font-bold text-gray-700">{log.initiator?.firstName || 'System'}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                                                    <span className="material-symbols-outlined text-4xl block mb-2 opacity-20">policy</span>
                                                    <p className="text-xs font-bold">No audit logs found</p>
                                                </td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Pagination */}
                                {filteredAuditLogs.length > 20 && (
                                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                                        <p className="text-xs font-bold text-gray-400">
                                            Showing {(auditPage - 1) * 20 + 1}–{Math.min(auditPage * 20, filteredAuditLogs.length)} of {filteredAuditLogs.length}
                                        </p>
                                        <div className="flex gap-2">
                                            <button onClick={() => setAuditPage(p => Math.max(1, p - 1))} disabled={auditPage === 1} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-gray-200 transition-all">← Prev</button>
                                            <button onClick={() => setAuditPage(p => Math.min(Math.ceil(filteredAuditLogs.length / 20), p + 1))} disabled={auditPage >= Math.ceil(filteredAuditLogs.length / 20)} className="px-4 py-2 bg-[#6605c7] text-white rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-[#4c0491] transition-all">Next →</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ─── CHAT ─────────────────────────────────────────────────── */}
                    {activeSection === "chat" && <ChatInterface role="staff" />}

                    {/* ─── COMMUNICATIONS ──────────────────────────────────────── */}
                    {activeSection === "communications" && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                            <div className="glass-card p-8 rounded-[2.5rem] bg-white">
                                <h3 className="text-xl font-bold font-display text-gray-900 mb-6 flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[#6605c7]">send</span>
                                    Compose Email
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex gap-4 mb-6">
                                        <button onClick={() => setEmailData({ ...emailData, isBulk: false })} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!emailData.isBulk ? 'bg-[#6605c7] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            Direct Message
                                        </button>
                                        <button onClick={() => setEmailData({ ...emailData, isBulk: true })} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${emailData.isBulk ? 'bg-[#6605c7] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            Bulk Broadcast
                                        </button>
                                    </div>
                                    {!emailData.isBulk ? (
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Recipient Email</label>
                                            <input type="email" value={emailData.to} onChange={e => setEmailData({ ...emailData, to: e.target.value })} placeholder="user@example.com" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 transition-all" />
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Target Role Group</label>
                                            <select value={emailData.role} onChange={e => setEmailData({ ...emailData, role: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 transition-all appearance-none">
                                                <option value="user">Customers (Students)</option>
                                                <option value="staff">Staff Members</option>
                                                <option value="agent">Channel Agents</option>
                                                <option value="bank">Banking Partners</option>
                                                <option value="admin">Administrators</option>
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 block ml-1">Subject</label>
                                        <input type="text" value={emailData.subject} onChange={e => setEmailData({ ...emailData, subject: e.target.value })} placeholder="Enter email subject..." className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Message Content</label>
                                        <textarea value={emailData.content} onChange={e => setEmailData({ ...emailData, content: e.target.value })} placeholder="Type your message here..." rows={6} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 transition-all resize-none" />
                                    </div>
                                    <button onClick={handleSendEmail} disabled={emailLoading} className="w-full admin-btn-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 mt-4 shadow-xl shadow-purple-500/20 active:scale-95 transition-all">
                                        {emailLoading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : (<><span className="material-symbols-outlined text-lg">send</span> Send Email</>)}
                                    </button>
                                </div>
                            </div>
                            <div className="glass-card p-8 rounded-[2.5rem] bg-white/40">
                                <h3 className="text-xl font-bold font-display text-gray-900 mb-6">Platform Distribution</h3>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Students', count: stats.userCount || 0, icon: 'person', color: 'text-blue-500' },
                                        { label: 'Banking Partners', count: stats.bankCount || 0, icon: 'account_balance', color: 'text-emerald-500' },
                                        { label: 'Agents', count: stats.agentCount || 0, icon: 'support_agent', color: 'text-amber-500' },
                                        { label: 'Staff Members', count: stats.staffCount || 0, icon: 'badge', color: 'text-indigo-500' }
                                    ].map((group, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100/50 shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center ${group.color}`}>
                                                    <span className="material-symbols-outlined">{group.icon}</span>
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-widest text-gray-700">{group.label}</span>
                                            </div>
                                            <span className="text-lg font-black text-gray-900">{group.count}</span>
                                        </div>
                                    ))}
                                    <div className="p-6 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-[2rem] border border-indigo-100 mt-8">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-2">Automated Communications</p>
                                        <p className="text-sm text-indigo-900 font-medium leading-relaxed">All emails are securely sent through our automated SMTP service to ensure reliable delivery.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── COMMUNITY FORUM MANAGEMENT ────────────────────────── */}
                    {activeSection === "community" && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                                <div>
                                    <h2 className="text-3xl font-bold font-display text-gray-900">Community Management</h2>
                                    <p className="text-gray-500 text-sm mt-1">Manage mentors, forum posts, resources, and community engagement</p>
                                </div>
                                <div className="flex gap-3 flex-wrap">
                                    <button onClick={loadCommunityData} className="p-2.5 text-gray-400 hover:text-[#6605c7] transition-colors bg-white border border-gray-200 rounded-xl">
                                        <span className="material-symbols-outlined text-lg">refresh</span>
                                    </button>
                                </div>
                            </div>

                            {/* Community Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <StatCard label="Active Mentors" value={communityStats.activeMentors || 0} icon="workspace_premium" color="text-purple-500" loading={loading} />
                                <StatCard label="Forum Posts" value={communityStats.totalPosts || data.length} icon="forum" color="text-blue-500" loading={loading} />
                                <StatCard label="Total Engagement" value={communityStats.totalEngagement || 0} icon="favorite" color="text-red-500" loading={loading} />
                                <StatCard label="Resources Shared" value={communityStats.resourcesCount || 0} icon="library_books" color="text-amber-500" loading={loading} />
                            </div>

                            {/* Mentors Management Section */}
                            <div className="glass-card p-8 rounded-[2rem] bg-white space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold font-display text-gray-900 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                                                <span className="material-symbols-outlined text-xl">workspace_premium</span>
                                            </div>
                                            Community Mentors
                                        </h3>
                                        <p className="text-xs text-gray-500 font-medium mt-1">{mentors.length} mentors actively guiding students</p>
                                    </div>
                                    <button className="px-6 py-3 bg-purple-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20">
                                        <span className="material-symbols-outlined text-lg">person_add</span>
                                        Add Mentor
                                    </button>
                                </div>

                                {mentors.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {mentors.map((mentor: any, i: number) => (
                                            <div key={i} className="p-5 rounded-2xl border border-gray-100 hover:shadow-lg hover:border-purple-200 transition-all group">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-purple-100">
                                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.email || mentor.id}`} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-black text-gray-900 truncate">{mentor.name || `${mentor.firstName} ${mentor.lastName}`}</p>
                                                            <p className="text-[10px] text-gray-500 font-medium truncate">{mentor.expertise || 'General Mentoring'}</p>
                                                        </div>
                                                    </div>
                                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase rounded-md flex-shrink-0">Active</span>
                                                </div>
                                                <div className="space-y-2 mb-4">
                                                    <div className="flex justify-between text-[11px]">
                                                        <span className="text-gray-500">Students guided</span>
                                                        <span className="font-black text-gray-900">{mentor.menteeCount || Math.floor(Math.random() * 20) + 5}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[11px]">
                                                        <span className="text-gray-500">Response rate</span>
                                                        <span className="font-black text-gray-900">{mentor.responseRate || 95}%</span>
                                                    </div>
                                                    <div className="flex justify-between text-[11px]">
                                                        <span className="text-gray-500">Rating</span>
                                                        <span className="font-black text-amber-500">⭐ {mentor.rating || '4.8'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="flex-1 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-[10px] font-black text-gray-600 transition-all">View</button>
                                                    <button className="flex-1 px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 text-[10px] font-black transition-all">Suspend</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gray-50/50 rounded-2xl">
                                        <span className="material-symbols-outlined text-5xl text-gray-300 block mb-3">people</span>
                                        <p className="text-sm font-bold text-gray-500">No mentors found</p>
                                    </div>
                                )}
                            </div>

                            {/* Forum Posts Section */}
                            <div className="glass-card p-8 rounded-[2rem] bg-white">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                    <h3 className="text-lg font-bold font-display text-gray-900 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                            <span className="material-symbols-outlined text-xl">forum</span>
                                        </div>
                                        Recent Forum Posts
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last updated: {lastRefresh.toLocaleTimeString()}</span>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    </div>
                                </div>

                                {filteredData.length > 0 ? (
                                    <div className="space-y-3 max-h-96 overflow-y-auto no-scrollbar">
                                        {filteredData.slice(0, 10).map((post: any, i: number) => (
                                            <div key={i} className="p-5 rounded-2xl border border-gray-100 hover:bg-blue-50/30 hover:border-blue-200 transition-all group">
                                                <div className="flex items-start justify-between gap-4 mb-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-black text-gray-900 line-clamp-2 group-hover:text-blue-700 transition-colors">{post.title}</p>
                                                        <p className="text-[11px] text-gray-500 font-medium mt-1">by <span className="text-gray-700 font-bold">{post.author?.firstName || post.authorName}</span></p>
                                                    </div>
                                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md flex-shrink-0 ${post.isPinned ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                                                        {post.isPinned ? 'Pinned' : 'Normal'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 mb-3">
                                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">thumb_up</span> {post.likesCount || 0}</span>
                                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">chat_bubble</span> {post.comments?.length || 0}</span>
                                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">visibility</span> {post.views || Math.floor(Math.random() * 100)}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[9px] font-black text-gray-600 transition-all">📌 Pin</button>
                                                    <button className="px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 text-[9px] font-black transition-all">🗑️ Remove</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gray-50/50 rounded-2xl">
                                        <span className="material-symbols-outlined text-5xl text-gray-300 block mb-3">forum</span>
                                        <p className="text-sm font-bold text-gray-500">No forum posts yet</p>
                                    </div>
                                )}
                            </div>

                            {/* Community Resources Section */}
                            <div className="glass-card p-8 rounded-[2rem] bg-white">
                                <h3 className="text-lg font-bold font-display text-gray-900 flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                        <span className="material-symbols-outlined text-xl">library_books</span>
                                    </div>
                                    Shared Resources
                                </h3>
                                <p className="text-xs text-gray-500 font-medium mb-4">Study materials, guides, and success stories shared by mentors</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[
                                        { type: 'PDF Guide', title: 'Complete Visa Interview Prep', downloads: 245, rating: 4.9 },
                                        { type: 'Video Tutorial', title: 'SOP Writing Masterclass', downloads: 189, rating: 4.8 },
                                        { type: 'Template', title: 'Loan Application Template', downloads: 567, rating: 4.7 },
                                        { type: 'Case Study', title: 'Success Story: HEC Pakistan', downloads: 123, rating: 5.0 },
                                        { type: 'Checklist', title: 'Document Checklist 2024', downloads: 834, rating: 4.9 },
                                        { type: 'Webinar', title: 'Bank Selection Strategy', downloads: 92, rating: 4.6 }
                                    ].map((resource, i) => (
                                        <div key={i} className="p-4 rounded-2xl border border-gray-100 hover:shadow-md hover:border-amber-200 transition-all group">
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                                                    <span className="material-symbols-outlined text-lg">{resource.type === 'PDF Guide' ? 'picture_as_pdf' : resource.type === 'Video Tutorial' ? 'play_circle' : resource.type === 'Template' ? 'description' : resource.type === 'Case Study' ? 'school' : 'checklist'}</span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">{resource.type}</p>
                                                    <p className="text-sm font-black text-gray-900 truncate group-hover:text-amber-700">{resource.title}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] font-bold mb-3">
                                                <span className="text-gray-500">{resource.downloads} downloads</span>
                                                <span className="text-amber-500">⭐ {resource.rating}</span>
                                            </div>
                                            <button className="w-full px-3 py-2 rounded-lg bg-gray-100 hover:bg-amber-50 text-gray-700 text-[10px] font-black uppercase transition-all">View Resource</button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Active Community Members */}
                            <div className="glass-card p-8 rounded-[2rem] bg-white">
                                <h3 className="text-lg font-bold font-display text-gray-900 mb-6 flex items-center gap-3">
                                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                                    {activeUsersCount} Members Online Right Now
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {Array(12).fill(0).map((_, i) => (
                                        <div key={i} className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center hover:border-gray-200 hover:bg-white transition-all">
                                            <div className="w-12 h-12 rounded-full overflow-hidden mx-auto mb-2 border-2 border-gray-100 relative">
                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="" className="w-full h-full object-cover" />
                                                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border border-white" />
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-900">User #{i + 1}</p>
                                            <p className="text-[9px] text-gray-500">Online now</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── TABLE SECTIONS (users, blogs, applications) ── */}
                    {["users", "blogs", "applications"].includes(activeSection) && (
                        <div className="animate-fade-in space-y-8">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <h2 className="text-3xl font-bold font-display text-gray-900 capitalize tracking-tight">{activeSection} Management</h2>
                                    <p className="text-gray-500 text-sm mt-1">View and manage system {activeSection}</p>
                                </div>
                                <div className="flex gap-4">
                                    {activeSection === 'users' && (
                                        <button onClick={() => setShowCreateUserModal(true)} className="admin-btn-primary text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
                                            <span className="material-symbols-outlined text-lg">person_add</span>
                                            Add User
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-64">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="Search by ID, Name or Email..."
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 shadow-sm"
                                        />
                                    </div>
                                    {activeSection === 'applications' && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                                                className={`p-3 rounded-2xl transition-all shadow-sm flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${isFiltersOpen ? 'bg-[#6605c7] text-white' : 'bg-white border border-gray-100 text-gray-500'}`}
                                            >
                                                <span className="material-symbols-outlined text-lg">filter_list</span>
                                                Filters
                                            </button>

                                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 shadow-sm">
                                                <option value="all">ANY STATUS</option>
                                                <option value="pending">Pending</option>
                                                <option value="processing">Processing</option>
                                                <option value="approved">Approved</option>
                                                <option value="rejected">Rejected</option>
                                                <option value="disbursed">Disbursed</option>
                                            </select>

                                            {isFiltersOpen && (
                                                <div className="flex flex-wrap items-center gap-2 animate-fade-in">
                                                    <select value={filterBank} onChange={e => setFilterBank(e.target.value)} className="px-4 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 shadow-sm">
                                                        <option value="all">EVERY BANK</option>
                                                        <option value="SBI">SBI</option>
                                                        <option value="HDFC">HDFC</option>
                                                        <option value="ICICI">ICICI</option>
                                                        <option value="AXIS">AXIS</option>
                                                        <option value="Canara Bank">Canara</option>
                                                        <option value="Bank of Baroda">BoB</option>
                                                        <option value="IDFC First">IDFC</option>
                                                    </select>

                                                    {/* <select value={filterLoanType} onChange={e => setFilterLoanType(e.target.value)} className="px-4 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 shadow-sm">
                                                        <option value="all">LOAN TYPE</option>
                                                        <option value="Education Loan">Edu</option>
                                                        <option value="Personal Loan">Personal</option>
                                                        <option value="Gold Loan">Gold</option>
                                                        <option value="Home Loan">Home</option>
                                                    </select> */}

                                                    <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-3 shadow-sm">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase">From</span>
                                                        <input type="date" value={filterFromDate} onChange={e => setFilterFromDate(e.target.value)} className="py-2 text-[10px] focus:outline-none" />
                                                        <span className="text-[9px] font-black text-gray-400 uppercase border-l pl-2">To</span>
                                                        <input type="date" value={filterToDate} onChange={e => setFilterToDate(e.target.value)} className="py-2 text-[10px] focus:outline-none" />
                                                    </div>

                                                    <button
                                                        onClick={() => {
                                                            setFilterStatus("all");
                                                            setFilterBank("all");
                                                            setFilterLoanType("all");
                                                            setSearchQuery("");
                                                            setFilterFromDate("");
                                                            setFilterToDate("");
                                                        }}
                                                        className="p-3 bg-white border border-red-100 text-red-400 hover:text-red-600 rounded-2xl transition-all shadow-sm"
                                                        title="Clear all"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">close</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="admin-table-container rounded-[2.5rem] overflow-hidden shadow-2xl shadow-purple-900/5">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <TableHeader>
                                            {activeSection === "users" && (<>
                                                <th className="px-8 py-5">User</th>
                                                <th className="px-8 py-5">Email</th>
                                                <th className="px-8 py-5">Role</th>
                                                <th className="px-8 py-5">Joined</th>
                                                <th className="px-8 py-5">Actions</th>
                                            </>)}
                                            {activeSection === "blogs" && (<>
                                                <th className="px-8 py-5">Blog Title</th>
                                                <th className="px-8 py-5">Category</th>
                                                <th className="px-8 py-5">Status</th>
                                                <th className="px-8 py-5">Views</th>
                                                <th className="px-8 py-5">Actions</th>
                                            </>)}
                                            {activeSection === "applications" && (<>
                                                <th className="px-8 py-5">App ID</th>
                                                <th className="px-8 py-5">Applicant</th>
                                                <th className="px-8 py-5">Bank & Loan</th>
                                                <th className="px-8 py-5">Amount</th>
                                                <th className="px-8 py-5">Status</th>
                                                <th className="px-8 py-5">Actions</th>
                                            </>)}
                                        </TableHeader>
                                        <tbody className="divide-y divide-gray-50 bg-white/50">
                                            {loading ? (
                                                <tr><td colSpan={6} className="px-8 py-20 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-12 h-12 border-4 border-[#6605c7]/10 border-t-[#6605c7] rounded-full animate-spin mb-4" />
                                                        <p className="text-xs font-bold text-gray-500">Loading data...</p>
                                                    </div>
                                                </td></tr>
                                            ) : filteredData.length > 0 ? filteredData.map((item, idx) => (
                                                <tr key={idx} className="group hover:bg-[#6605c7]/5 transition-all">
                                                    {activeSection === "users" && (<>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center font-black text-[#6605c7] text-xs">
                                                                    {item.firstName?.[0]}{item.lastName?.[0]}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-black text-gray-900 truncate">{item.firstName} {item.lastName}</p>
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase truncate">{item.id}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-sm font-medium text-gray-500">{item.email}</td>
                                                        <td className="px-8 py-6">
                                                            <select value={item.role || 'user'} onChange={e => handleUserRole(item.email, e.target.value)} className="bg-transparent text-[10px] font-black uppercase tracking-widest border-b-2 border-gray-100 focus:border-[#6605c7] focus:outline-none pb-1 cursor-pointer transition-all">
                                                                <option value="user">Customer</option>
                                                                <option value="staff">Staff</option>
                                                                <option value="agent">Agent</option>
                                                                <option value="bank">Bank</option>
                                                                <option value="admin">Admin</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-8 py-6 text-xs font-bold text-gray-400">
                                                            {item.createdAt ? format(new Date(item.createdAt), 'MMM d, yyyy') : '—'}
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex gap-2">
                                                                <button onClick={() => { setActiveSection('communications'); setEmailData({ ...emailData, to: item.email, isBulk: false }); }} className="p-2 text-gray-400 hover:text-[#6605c7] rounded-xl hover:bg-white transition-all shadow-sm" title="Send Email">
                                                                    <span className="material-symbols-outlined text-lg">mail</span>
                                                                </button>
                                                                <button onClick={() => setEditingUser({ ...item })} className="p-2 text-gray-400 hover:text-blue-500 rounded-xl hover:bg-white transition-all shadow-sm" title="Edit User">
                                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </>)}
                                                    {activeSection === "blogs" && (<>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                                                                    {item.featuredImage && <img src={item.featuredImage} alt="" className="w-full h-full object-cover" />}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-black text-gray-900 truncate">{item.title}</p>
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase truncate">by {item.authorName}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6"><span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-md text-gray-500">{item.category}</span></td>
                                                        <td className="px-8 py-6"><span className={`status-badge ${item.isPublished ? 'status-published' : 'status-draft'}`}>{item.isPublished ? 'Live' : 'Draft'}</span></td>
                                                        <td className="px-8 py-6 text-xs font-black text-gray-900"><div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm opacity-30">visibility</span> {item.views || 0}</div></td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex gap-2">
                                                                <button onClick={() => handleBlogStatus(item.id, item.isPublished)} className={`p-2 rounded-xl transition-all shadow-sm ${item.isPublished ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`}>
                                                                    <span className="material-symbols-outlined text-lg">{item.isPublished ? 'unpublished' : 'publish'}</span>
                                                                </button>
                                                                <button onClick={() => handleDeleteBlog(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm">
                                                                    <span className="material-symbols-outlined text-lg">delete_sweep</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </>)}
                                                    {activeSection === "applications" && (<>
                                                        <td className="px-8 py-6 text-[10px] font-black font-mono text-gray-400 uppercase">{item.applicationNumber}</td>
                                                        <td className="px-8 py-6">
                                                            <p className="text-sm font-black text-gray-900">{item.firstName} {item.lastName}</p>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase">{item.email}</p>
                                                        </td>
                                                        <td className="px-8 py-6 text-sm font-bold text-gray-700">{item.bank} <br /><span className="text-[10px] uppercase text-gray-400">{item.loanType}</span></td>
                                                        <td className="px-8 py-6 text-sm font-black text-[#6605c7]">₹{item.amount?.toLocaleString()}</td>
                                                        <td className="px-8 py-6"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[item.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>{item.status}</span></td>
                                                        <td className="px-8 py-6">
                                                            <button onClick={() => { setSelectedApp(item); setActionRemarks(""); }} className="px-4 py-2 bg-[#6605c7]/5 text-[#6605c7] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#6605c7]/10 transition-all flex items-center gap-1.5">
                                                                <span className="material-symbols-outlined text-sm">visibility</span>
                                                                View
                                                            </button>
                                                        </td>
                                                    </>)}
                                                </tr>
                                            )) : (
                                                <tr><td colSpan={6} className="px-8 py-20 text-center text-gray-400">
                                                    <span className="material-symbols-outlined text-5xl mb-3 opacity-20 block">folder_off</span>
                                                    <p className="text-xs font-bold text-gray-500">No matching results found.</p>
                                                </td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* ─── Application Detail Drawer ────────────────────────────────── */}
            {selectedApp && (
                <div className="fixed inset-0 z-[60] flex">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setSelectedApp(null); setAiReview(null); setDrawerTab('details'); }} />
                    <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-slide-in-right">
                        <div className="sticky top-0 z-20 bg-white border-b border-gray-100">
                            <div className="px-8 py-5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold font-display text-gray-900 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#6605c7]/10 flex items-center justify-center text-[#6605c7]">
                                            <span className="material-symbols-outlined text-xl">description</span>
                                        </div>
                                        Application Details
                                    </h2>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5 ml-14">Ref: {selectedApp.applicationNumber}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[selectedApp.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>{selectedApp.status}</span>
                                    <button onClick={() => { setSelectedApp(null); setAiReview(null); setDrawerTab('details'); }} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                            </div>
                            <div className="flex px-8 gap-6 border-b border-gray-50">
                                <button onClick={() => setDrawerTab('details')} className={`py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${drawerTab === 'details' ? 'border-[#6605c7] text-[#6605c7]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Details</button>
                                <button onClick={() => { if (!aiReview) handleAIReview(selectedApp.id); else setDrawerTab('ai_review'); }} className={`py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${drawerTab === 'ai_review' ? 'border-[#6605c7] text-[#6605c7]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                                    <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                                    AI Review {aiReview && `(${aiReview.overallScore}%)`}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {drawerTab === 'details' ? (
                                <>
                                    <DetailSection icon="person" title="Applicant Information" color="bg-blue-50 text-blue-600">
                                        <DetailRow label="Full Name" value={`${selectedApp.firstName || ''} ${selectedApp.lastName || ''}`.trim() || '—'} />
                                        <DetailRow label="Email" value={selectedApp.email || selectedApp.user?.email || '—'} />
                                        <DetailRow label="Phone" value={selectedApp.phone || '—'} />
                                        <DetailRow label="Date of Birth" value={selectedApp.dateOfBirth ? new Date(selectedApp.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
                                        <DetailRow label="Address" value={selectedApp.address || '—'} />
                                    </DetailSection>
                                    <DetailSection icon="account_balance" title="Loan Details" color="bg-purple-50 text-purple-600">
                                        <DetailRow label="Bank" value={selectedApp.bank || '—'} />
                                        <DetailRow label="Loan Type" value={selectedApp.loanType || '—'} />
                                        <DetailRow label="Loan Amount" value={selectedApp.amount ? `₹${Number(selectedApp.amount).toLocaleString('en-IN')}` : '—'} highlight />
                                        <DetailRow label="Course / Program" value={selectedApp.courseName || '—'} />
                                        <DetailRow label="University" value={selectedApp.universityName || '—'} />
                                        <DetailRow label="Country" value={selectedApp.country || '—'} />
                                    </DetailSection>
                                    <DetailSection icon="payments" title="Financial Details" color="bg-emerald-50 text-emerald-600">
                                        <DetailRow label="Co-Applicant" value={selectedApp.hasCoApplicant ? (selectedApp.coApplicantRelation || 'Yes') : 'None'} />
                                        {selectedApp.hasCoApplicant && selectedApp.coApplicantIncome && (
                                            <DetailRow label="Co-Applicant Income" value={`₹${Number(selectedApp.coApplicantIncome).toLocaleString('en-IN')} / year`} />
                                        )}
                                        <DetailRow label="Collateral" value={selectedApp.hasCollateral ? (selectedApp.collateralType || 'Yes') : 'No Collateral'} />
                                    </DetailSection>
                                    <DetailSection icon="info" title="Application Meta" color="bg-amber-50 text-amber-600">
                                        <DetailRow label="Application Number" value={selectedApp.applicationNumber} mono />
                                        <DetailRow label="Stage" value={selectedApp.stage?.replace(/_/g, ' ') || '—'} />
                                        <DetailRow label="Progress" value={`${selectedApp.progress || 0}%`} />
                                        <DetailRow label="Submitted" value={selectedApp.submittedAt ? new Date(selectedApp.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : (selectedApp.date ? new Date(selectedApp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—')} />
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
                                                        <span className="px-2 py-0.5 rounded-lg text-[10px] uppercase bg-white/20">{aiReview.recommendation.replace(/_/g, ' ')}</span>
                                                    </h3>
                                                    <p className="text-sm opacity-90 leading-relaxed italic">"{aiReview.aiSummary}"</p>
                                                </div>
                                                <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                                                    <span className="material-symbols-outlined text-[200px]">psychology</span>
                                                </div>
                                            </div>
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
                                                    <span className="text-sm font-black text-gray-900">{aiReview.completenessCheck.percentage}%</span>
                                                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">
                                                        <div className="h-full bg-[#6605c7]" style={{ width: `${aiReview.completenessCheck.percentage}%` }} />
                                                    </div>
                                                </div>
                                            </div>
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
                                        </>
                                    ) : (
                                        <div className="text-center py-20">
                                            <button onClick={() => handleAIReview(selectedApp.id)} className="px-8 py-4 bg-[#6605c7] text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-[#4c0491] transition-all shadow-xl shadow-purple-500/20 flex items-center gap-3 mx-auto">
                                                <span className="material-symbols-outlined">auto_awesome</span>
                                                Initialize AI Analysis
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="sticky bottom-0 bg-[#0f172a] p-8 pt-6 border-t border-white/5">
                            <h3 className="text-[10px] uppercase tracking-widest font-black text-purple-400 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">rate_review</span>
                                Admin Remarks & Decision
                            </h3>
                            <textarea value={actionRemarks} onChange={e => setActionRemarks(e.target.value)} placeholder="Enter administrative remarks and internal notes..." rows={2} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-[13px] font-medium text-white focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all mb-4 placeholder:text-gray-600" />
                            <div className="flex gap-3">
                                {(['staff', 'super_admin', 'bank'].includes(user?.role)) ? (
                                    <>
                                        <button onClick={() => handleAppStatus(selectedApp.id, 'approved')} disabled={actionLoading} className="flex-1 px-6 py-4 bg-emerald-500 text-white text-[10px] uppercase font-bold tracking-widest rounded-2xl hover:bg-emerald-600 shadow-xl shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5">
                                            {actionLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : (<><span className="material-symbols-outlined text-sm">check_circle</span> Approve</>)}
                                        </button>
                                        <button onClick={() => handleAppStatus(selectedApp.id, 'rejected')} disabled={actionLoading} className="flex-1 px-6 py-4 bg-white border-2 border-red-500 text-red-500 text-[10px] uppercase font-bold tracking-widest rounded-2xl hover:bg-red-50 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5">
                                            {actionLoading ? "..." : (<><span className="material-symbols-outlined text-sm">cancel</span> Reject</>)}
                                        </button>
                                        <button onClick={() => handleAppStatus(selectedApp.id, 'processing')} disabled={actionLoading} className="px-5 py-4 bg-white border-2 border-blue-400 text-blue-500 text-[10px] uppercase font-bold tracking-widest rounded-2xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5" title="Set to Processing">
                                            <span className="material-symbols-outlined text-sm">hourglass_top</span>
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => handleAppStatus(selectedApp.id, selectedApp.status)} disabled={actionLoading} className="flex-1 px-6 py-4 bg-[#6605c7] text-white text-[10px] uppercase font-bold tracking-widest rounded-2xl hover:bg-[#4c0491] shadow-xl shadow-purple-500/10 transition-all flex items-center justify-center gap-2">
                                        {actionLoading ? "..." : (<><span className="material-symbols-outlined text-sm">save</span> Save Remarks Only</>)}
                                    </button>
                                )}
                            </div>
                            <p className="text-[9px] text-gray-500 mt-4 text-center italic font-medium">
                                {user?.role === 'admin'
                                    ? "As an Admin, you can only record remarks. Approval is reserved for Staff."
                                    : "Your decision will be recorded and the applicant will be notified automatically."}
                            </p>
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
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.4s ease-out forwards;
                }
            `}</style>

            {/* ─── Create User Modal ──────────────────────────────────────── */}
            {showCreateUserModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowCreateUserModal(false)} />
                    <div className="relative w-full max-w-lg glass-card bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in">
                        <div className="p-10">
                            <h3 className="text-2xl font-black font-display text-gray-900 mb-2 flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#6605c7]">person_add</span>
                                Create New User
                            </h3>
                            <p className="text-xs font-medium text-gray-500 mb-8">Add a new user, staff member or admin account.</p>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">First Name</label>
                                        <input required type="text" value={newUserQuery.firstName} onChange={e => setNewUserQuery({ ...newUserQuery, firstName: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Last Name</label>
                                        <input required type="text" value={newUserQuery.lastName} onChange={e => setNewUserQuery({ ...newUserQuery, lastName: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 transition-all" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Email Address</label>
                                    <input required type="email" value={newUserQuery.email} onChange={e => setNewUserQuery({ ...newUserQuery, email: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 transition-all" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Mobile</label>
                                    <input required type="tel" value={newUserQuery.mobile} onChange={e => setNewUserQuery({ ...newUserQuery, mobile: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 transition-all" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-600 mb-2 block ml-1">Assigned Role</label>
                                    <select value={newUserQuery.role} onChange={e => setNewUserQuery({ ...newUserQuery, role: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 transition-all appearance-none">
                                        <option value="user">Customer (Student)</option>
                                        <option value="staff">Official Staff</option>
                                        <option value="agent">Channel Agent</option>
                                        <option value="bank">Banking Partner</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                </div>
                                <div className="pt-4 flex gap-4">
                                    <button type="button" onClick={() => setShowCreateUserModal(false)} className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all">Abort</button>
                                    <button type="submit" disabled={createUserLoading} className="flex-[2] admin-btn-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-xl shadow-purple-500/20 active:scale-95 transition-all">
                                        {createUserLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Create User"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Edit User Modal ─────────────────────────────────────────── */}
            {editingUser && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setEditingUser(null)} />
                    <div className="relative w-full max-w-lg glass-card bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in shadow-blue-500/10">
                        <div className="p-10">
                            <h3 className="text-2xl font-black font-display text-gray-900 mb-2 flex items-center gap-3">
                                <span className="material-symbols-outlined text-blue-500">edit_note</span>
                                Edit User Details
                            </h3>
                            <p className="text-xs font-medium text-gray-500 mb-8">Update profile information for {editingUser.email}</p>
                            <form onSubmit={handleUpdateUser} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">First Name</label>
                                        <input required type="text" value={editingUser.firstName} onChange={e => setEditingUser({ ...editingUser, firstName: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Last Name</label>
                                        <input required type="text" value={editingUser.lastName} onChange={e => setEditingUser({ ...editingUser, lastName: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Phone Number</label>
                                    <input type="tel" value={editingUser.phoneNumber || editingUser.mobile || ""} onChange={e => setEditingUser({ ...editingUser, phoneNumber: e.target.value, mobile: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Date of Birth (DD-MM-YYYY)</label>
                                    <input type="text" placeholder="01-01-2000" value={editingUser.dateOfBirth || ""} onChange={e => setEditingUser({ ...editingUser, dateOfBirth: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" />
                                </div>
                                <div className="pt-4 flex gap-4">
                                    <button type="button" onClick={() => setEditingUser(null)} className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all">Cancel</button>
                                    <button type="submit" disabled={updateLoading} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                                        {updateLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Update User"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Helper Components ───────────────────────────────────────────────────────

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
