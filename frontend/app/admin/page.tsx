"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { format, formatDistanceToNow } from "date-fns";
import ChatInterface from "@/components/Chat/ChatInterface";

// ─── Sub-components ────────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon, color, trend, loading }: any) => (
    <div className="glass-card stat-card-gradient p-8 rounded-[2rem] relative overflow-hidden group transition-all duration-500 hover:shadow-[0_20px_50px_rgba(102,5,199,0.12)] hover:-translate-y-1 cursor-default border border-white/20 bg-white/40">
        <div className="flex justify-between items-start relative z-10 w-full mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${color} bg-opacity-10 border border-current border-opacity-20 shadow-lg shadow-current/10 group-hover:scale-110 group-hover:rotate-6`}>
                <span className="material-symbols-outlined text-[28px]" style={{ color: 'currentColor' }}>{icon}</span>
            </div>
            {trend !== undefined && !loading && (
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wide uppercase ${trend >= 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                    <span className="material-symbols-outlined text-[14px]">{trend >= 0 ? 'trending_up' : 'trending_down'}</span>
                    {Math.abs(trend)}%
                </span>
            )}
        </div>
        <div className="relative z-10">
            <p className="text-gray-500 text-[11px] font-black tracking-wider mb-2 uppercase">{label}</p>
            <div className="text-3xl font-black tracking-tight text-gray-900 font-display leading-none">
                {loading ? <span className="h-10 bg-gray-200 animate-pulse rounded-lg block w-40 mt-1" /> : value ?? "—"}
            </div>
        </div>
        <div className="absolute -right-8 -bottom-8 opacity-[0.03] pointer-events-none group-hover:scale-125 transition-transform duration-1000">
            <span className="material-symbols-outlined text-9xl" style={{ color: 'currentColor' }}>{icon}</span>
        </div>
    </div>
);

const NavItem = ({ section, active, icon, label, badge, onClick }: any) => (
    <button
        onClick={() => onClick(section)}
        className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 group transition-all duration-300 border font-medium ${active === section ? "bg-gradient-to-r from-[#6605c7] to-[#7c3aed] text-white border-[#6605c7]/20 shadow-lg shadow-purple-500/20" : "text-slate-600 border-transparent hover:bg-white hover:text-slate-900 hover:border-slate-200/50"}`}
    >
        <span className={`material-symbols-outlined transition-all text-[18px] ${active === section ? "text-white group-hover:scale-110" : "text-slate-400 group-hover:text-slate-700 group-hover:scale-110"}`}>{icon}</span>
        <span className={`font-semibold text-[13px] flex-1 ${active === section ? "font-bold" : ""}`}>{label}</span>
        {badge > 0 && (
            <span className={`px-2.5 py-0.5 min-w-[24px] rounded-full text-[9px] font-black text-center transition-all ${active === section ? 'bg-white/25 text-white font-bold' : 'bg-red-50 text-red-600 font-bold'}`}>
                {badge}
            </span>
        )}
    </button>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
    <thead className="admin-table">
        <tr>{children}</tr>
    </thead>
);

// ─── Mini Bar Chart ─────────────────────────────────────────────────────────
const MiniBarChart = ({ data, color = '#1d4ed8' }: { data: number[], color?: string }) => {
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

// ─── Portal Access Card ───────────────────────────────────────────────────────
const PortalCard = ({ name, description, icon, href, color, users, status }: any) => (
    <div className={`relative p-8 rounded-[2rem] border ${color} transition-all duration-500 hover:shadow-lg hover:-translate-y-2 overflow-hidden group bg-white/70 glass-card`}>
        <div className="flex justify-between items-start mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${color.replace('border-', 'bg-').replace('/60', '/15')}`}>
                <span className="material-symbols-outlined text-3xl opacity-80" style={{ color: color.split('-')[1] && `var(--color-${color.split('-')[1]}-600)` }}>{ icon}</span>
            </div>
            <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${status === 'online' ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]' : 'bg-red-400'}`} />
                <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">{status}</span>
            </div>
        </div>
        <h3 className="font-black text-gray-900 mb-2 text-[16px] font-display">{name}</h3>
        <p className="text-xs text-gray-600 font-medium mb-6 leading-relaxed">{description}</p>
        <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{users} active users</span>
            <a href={href} className="px-4 py-2 rounded-xl bg-[#6605c7]/10 hover:bg-[#6605c7]/20 text-[#6605c7] text-[9px] font-black uppercase tracking-wider transition-all hover:translate-x-0.5 border border-[#6605c7]/20">
                Access →
            </a>
        </div>
        <div className="absolute -right-8 -bottom-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <span className="material-symbols-outlined text-9xl">{icon}</span>
        </div>
    </div>
);

// ─── Announcement Banner ──────────────────────────────────────────────────────
const AnnouncementItem = ({ ann, onDelete }: { ann: any; onDelete: (id: string) => void }) => (
    <div className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-slate-200/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group glass-card">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-lg group-hover:scale-110 transition-transform ${ann.type === 'warning' ? 'bg-amber-100/60 text-amber-600 border border-amber-200/50' : ann.type === 'error' ? 'bg-red-100/60 text-red-600 border border-red-200/50' : 'bg-blue-100/60 text-blue-600 border border-blue-200/50'}`}>
            <span className="material-symbols-outlined text-2xl">
                {ann.type === 'warning' ? 'warning' : ann.type === 'error' ? 'error' : 'info'}
            </span>
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-black text-gray-900 leading-snug font-display">{ann.title}</p>
                <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap uppercase tracking-wider">{formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true })}</span>
            </div>
            <p className="text-xs text-gray-600 mt-2 font-medium leading-relaxed">{ann.message}</p>
            <div className="flex items-center gap-2 mt-3">
                <span className={`text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${ann.target === 'all' ? 'bg-[#6605c7]/10 text-[#6605c7] border-[#6605c7]/20' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
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
    const router = useRouter();
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
    const [filterBlogTime, setFilterBlogTime] = useState("all");
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
    const [newUserQuery, setNewUserQuery] = useState({
        email: "", firstName: "", lastName: "", middleName: "", mobile: "", role: "user",
        dob: "", gender: "", maritalStatus: "",
        mailingAddress: { address1: "", address2: "", city: "", state: "", country: "", pincode: "" },
        permanentAddress: { address1: "", address2: "", city: "", state: "", country: "", pincode: "" },
        passport: { number: "", issueDate: "", expiryDate: "", issueCountry: "", birthCity: "", birthCountry: "" },
        nationality: { name: "", citizenship: "", dualCitizenship: "No", dualNational: "", livingOtherCountry: "No", livingOtherCountryName: "" },
        background: { immigrationApplied: "No", immigrationAppliedCountry: "", medicalCondition: "No", medicalConditionDetails: "", visaRefusal: "No", visaRefusalDetails: "", criminalOffence: "No", criminalOffenceDetails: "" },
        emergencyContact: { name: "", phone: "", email: "", relation: "" }
    });

    const [editingUser, setEditingUser] = useState<any>(null);
    const [updateLoading, setUpdateLoading] = useState(false);

    // Communications
    const [emailData, setEmailData] = useState({ to: "", subject: "", content: "", role: "user", isBulk: false });
    const [emailLoading, setEmailLoading] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('empty');

    // AI Review
    const [aiReview, setAiReview] = useState<any>(null);
    const [aiReviewLoading, setAiReviewLoading] = useState(false);
    const [drawerTab, setDrawerTab] = useState<'details' | 'documents' | 'notes' | 'history' | 'ai_review'>('details');

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
            const res: any = await adminApi.createUser(newUserQuery);
            if (res.success && res.user?.id) {
                alert("New user account created successfully.");
                setShowCreateUserModal(false);
                setNewUserQuery({
                    email: "", firstName: "", lastName: "", middleName: "", mobile: "", role: "user",
                    dob: "", gender: "", maritalStatus: "",
                    mailingAddress: { address1: "", address2: "", city: "", state: "", country: "", pincode: "" },
                    permanentAddress: { address1: "", address2: "", city: "", state: "", country: "", pincode: "" },
                    passport: { number: "", issueDate: "", expiryDate: "", issueCountry: "", birthCity: "", birthCountry: "" },
                    nationality: { name: "", citizenship: "", dualCitizenship: "No", dualNational: "", livingOtherCountry: "No", livingOtherCountryName: "" },
                    background: { immigrationApplied: "No", immigrationAppliedCountry: "", medicalCondition: "No", medicalConditionDetails: "", visaRefusal: "No", visaRefusalDetails: "", criminalOffence: "No", criminalOffenceDetails: "" },
                    emergencyContact: { name: "", phone: "", email: "", relation: "" }
                });
                router.push(`/admin/users/${res.user.id}`);
            } else {
                alert("Failed to create profile: " + (res.message || "Unknown error"));
            }
        } catch (e: any) {
            alert("Failed to create profile: " + e.message);
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

    const handleApplyTemplate = (val: string) => {
        setSelectedTemplate(val);
        if (val === 'status_update') {
            setEmailData(prev => ({ ...prev, subject: "Formal Communication: Application Status Progression", content: "Dear Applicant,\n\nPlease refer to your recent application docket. Your processing status has been formally updated in our registry. Kindly log in to your secure portal to view the newly authorized details.\n\nRegards,\nVidhyaLoan Operations Control" }));
        } else if (val === 'action_required') {
            setEmailData(prev => ({ ...prev, subject: "Action Required: Requisite Document Verification", content: "Dear Applicant,\n\nWe noted an irregularity or missing item in the documentation submitted for your application node. Please log in immediately and provide the required verification materials via your secure dashboard to avoid compliance processing delays.\n\nRegards,\nVidhyaLoan Operations Control" }));
        } else if (val === 'welcome_board') {
            setEmailData(prev => ({ ...prev, subject: "Welcome: Complete Node Integration Successful", content: "Dear User,\n\nYour formal profile has been successfully integrated into our central node architecture. You now have full access to submit and securely track your applications under standardized service level agreements.\n\nRegards,\nVidhyaLoan Operations Control" }));
        } else {
            setEmailData(prev => ({ ...prev, subject: "", content: "" }));
        }
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
        if (activeSection === 'blogs') {
            const matchesSearch = item.title?.toLowerCase().includes(query) || item.authorName?.toLowerCase().includes(query);
            if (!matchesSearch) return false;
            
            if (filterBlogTime === 'weekly') {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                const itemDate = new Date(item.createdAt || new Date());
                return itemDate >= oneWeekAgo;
            } else if (filterBlogTime === 'monthly') {
                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                const itemDate = new Date(item.createdAt || new Date());
                return itemDate >= oneMonthAgo;
            } else if (filterBlogTime === 'yearly') {
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                const itemDate = new Date(item.createdAt || new Date());
                return itemDate >= oneYearAgo;
            }
            return true;
        }
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
        admin: 'bg-slate-100 text-slate-700',
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

    // Helper component for rendering detail rows in the drawer
    const DetailRow = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            <span className={`text-[14px] font-bold ${highlight ? 'text-indigo-600' : 'text-slate-900'}`}>
                {value}
            </span>
        </div>
    );

    return (
        <div className="h-screen overflow-hidden flex bg-gray-50 text-gray-900 font-sans">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-white border-r border-slate-200/60 transform transition-transform duration-300 lg:translate-x-0 shadow-lg shadow-slate-900/5 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="flex flex-col h-full">
                    <div className="h-20 px-6 flex items-center border-b border-slate-200/50 bg-gradient-to-r from-[#6605c7]/5 to-transparent">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6605c7] to-[#7c3aed] flex items-center justify-center text-white shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[20px] font-bold">dashboard</span>
                            </div>
                            <span className="font-bold text-[15px] tracking-tight text-slate-900">Vidhya<span className="text-[#6605c7] font-bold">Admin</span></span>
                        </div>
                    </div>

                    <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto no-scrollbar">
                        <div className="px-3 mb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Main Navigation</div>
                        {navItems.map(item => (
                            <NavItem key={item.section} {...item} active={activeSection} onClick={setActiveSection} />
                        ))}
                    </nav>

                    <div className="p-4 border-t border-slate-200/50 bg-white/50">
                        <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#6605c7]/5 to-transparent border border-[#6605c7]/10 flex items-center gap-3 mb-4 hover:border-[#6605c7]/20 transition-all group">
                            <div className="w-10 h-10 rounded-lg border-2 border-[#6605c7]/20 shadow-sm overflow-hidden flex-shrink-0 group-hover:scale-110 transition-transform">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[12px] font-bold text-gray-900 truncate leading-none">{user?.firstName || 'Admin'}</p>
                                <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-wider font-black">{user?.role?.replace('_', ' ')}</p>
                            </div>
                        </div>
                        <button onClick={logout} className="w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all font-bold text-[12px] border border-red-100/30 uppercase tracking-wider">
                            <span className="material-symbols-outlined text-[18px]">logout</span>
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden lg:ml-[280px]">
                {/* Header */}
                <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/40 px-6 lg:px-10 flex justify-between items-center sticky top-0 z-40 shadow-[0_2px_12px_rgba(102,5,199,0.06)]">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <h1 className="text-[22px] font-black text-gray-900 tracking-tight flex items-center gap-3 font-display italic">
                            {sectionTitles[activeSection] || activeSection}
                            <span className="text-[9px] font-black text-[#6605c7] bg-[#6605c7]/10 px-3 py-1.5 rounded-full border border-[#6605c7]/20 uppercase tracking-widest">Live</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative hidden md:block">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Quick search..."
                                className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:border-[#6605c7]/40 w-64 transition-all font-medium hover:border-slate-300"
                            />
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setNotifOpen(!notifOpen)}
                                className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all relative group"
                            >
                                <span className="material-symbols-outlined text-[22px]">notifications</span>
                                {pendingCount > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white shadow-lg shadow-red-500/50" />}
                            </button>
                            {notifOpen && (
                                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200/50 z-50 overflow-hidden py-2 backdrop-blur-sm">
                                    <div className="px-5 py-3 border-b border-slate-100 mb-1 bg-gradient-to-r from-slate-50 to-transparent">
                                        <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Notifications</h4>
                                    </div>
                                    {pendingCount > 0 ? (
                                        <button className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-all flex items-center gap-3 border-b border-slate-100 last:border-0 group">
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-[18px]">assignment_late</span></div>
                                            <div><p className="text-[13px] font-bold text-slate-900">{pendingCount} Applications</p><p className="text-[11px] text-slate-500 font-medium">Awaiting your approval</p></div>
                                        </button>
                                    ) : <div className="p-8 text-center text-slate-400"><span className="material-symbols-outlined text-4xl mb-2 opacity-30 block">notifications_none</span><p className="text-xs font-semibold">No new notifications</p></div>}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="p-6 lg:p-10 space-y-10 overflow-y-auto no-scrollbar flex-1 bg-gradient-to-b from-slate-50/50 to-white">
                    {activeSection === "overview" && (
                        <div className="space-y-10 animate-fade-in">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                <div>
                                    <h2 className="text-[32px] font-black font-display text-gray-900 tracking-tight mb-2 italic">System Control Matrix</h2>
                                    <p className="text-slate-500 text-[12px] font-bold uppercase tracking-widest flex items-center gap-2">
                                        <span className="material-symbols-outlined text-xs">calendar_today</span>
                                        Node Synchronized: {format(new Date(), 'EEEE, MMMM do, yyyy')}
                                    </p>
                                </div>
                                <div className="flex gap-3 flex-wrap">
                                    <button onClick={() => setShowCreateUserModal(true)} className="px-5 py-3 rounded-xl border border-slate-200/50 bg-white text-slate-600 font-bold text-[11px] uppercase tracking-wider hover:bg-white hover:border-slate-300 transition-all flex items-center gap-2 shadow-sm">
                                        <span className="material-symbols-outlined text-[18px]">person_add</span> Add User
                                    </button>
                                    <Link href="/admin/blogs/create" className="bg-gradient-to-r from-[#6605c7] to-[#7c3aed] text-white px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-wider hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]">add</span> Create Post
                                    </Link>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard label="Capital Portfolio" value={`₹${(stats.totalAmount || 0).toLocaleString('en-IN')}`} icon="account_balance_wallet" color="text-[#6605c7]" loading={loading} trend={12} />
                                <StatCard label="Disbursed Pulse" value={`₹${(stats.disbursedAmount || 0).toLocaleString('en-IN')}`} icon="electric_bolt" color="text-emerald-500" loading={loading} trend={-5} />
                                <StatCard label="Active Transmission" value={stats.appCount || 0} icon="receipt_long" color="text-amber-500" loading={loading} trend={8} />
                                <StatCard label="Total Nodes" value={stats.userCount || 0} icon="public" color="text-blue-500" loading={loading} trend={24} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard
                                    label="Avg Unit Size"
                                    value={`₹${Math.round((stats.totalAmount || 0) / (stats.appCount || 1)).toLocaleString('en-IN')}`}
                                    icon="analytics"
                                    color="text-indigo-500"
                                    loading={loading}
                                />
                                <StatCard
                                    label="Conversion Rate"
                                    value={`${Math.round(((stats.disbursedCount || 0) / (stats.appCount || 1)) * 100)}%`}
                                    icon="trending_up"
                                    color="text-emerald-500"
                                    loading={loading}
                                />
                            </div>

                            {/* System Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard label="Protocol Articles" value={stats.blogs?.total} icon="article" color="text-blue-500" loading={loading} trend={12} />
                                <StatCard label="Pending Nodes" value={stats.apps?.total} icon="description" color="text-[#6605c7]" loading={loading} trend={8} />
                                <StatCard label="Portal Users" value={stats.userCount} icon="person" color="text-emerald-500" loading={loading} trend={5} />
                                <StatCard label="Pending Audit" value={pendingCount} icon="pending_actions" color="text-amber-500" loading={loading} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <StatCard label="Protocol Managers" value={stats.staffCount} icon="badge" color="text-blue-600" loading={loading} />
                                <StatCard label="Banking Partners" value={stats.bankCount} icon="account_balance" color="text-emerald-600" loading={loading} />
                                <StatCard label="Channel Operators" value={stats.agentCount} icon="support_agent" color="text-amber-600" loading={loading} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Recent Activity */}
                                <div className="lg:col-span-2 glass-card p-10 rounded-[2.5rem] border-[#6605c7]/10 bg-white/60">
                                    <div className="flex justify-between items-center mb-8">
                                        <div>
                                            <h3 className="text-xl font-black font-display text-gray-900 tracking-tight italic">Recent Signal Sync</h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">System Activity Log</p>
                                        </div>
                                        <button onClick={loadOverview} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                                            <span className="material-symbols-outlined">refresh</span>
                                        </button>
                                    </div>
                                    <div className="space-y-6">
                                        {auditLogs.length > 0 ? auditLogs.map((log: any, i: number) => (
                                            <div key={i} className="flex gap-5 group animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-[11px] border group-hover:scale-110 transition-transform flex-shrink-0 ${log.action === 'update' ? 'bg-blue-500/10 text-blue-600 border-blue-200' : log.action === 'create' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-red-500/10 text-red-600 border-red-200'}`}>
                                                        <span className="material-symbols-outlined text-[20px]">
                                                            {log.action === 'update' ? 'edit_square' : log.action === 'create' ? 'add_box' : 'delete'}
                                                        </span>
                                                    </div>
                                                    {i < auditLogs.length - 1 && <div className="w-px h-12 bg-gradient-to-b from-slate-200 to-transparent my-2" />}
                                                </div>
                                                <div className="pb-4 border-b border-slate-100 flex-1 last:border-0 text-[13px]">
                                                    <div className="flex justify-between mb-1">
                                                        <p className="font-black text-slate-900 capitalize tracking-tight uppercase text-[11px]">{log.action} {log.entityType}</p>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(new Date(log.createdAt), 'MMM d, p')}</span>
                                                    </div>
                                                    <p className="text-slate-600 font-medium mb-2">By <span className="text-slate-900 font-bold">{log.initiator?.firstName || 'System'}</span></p>
                                                    <div className="bg-slate-50 rounded-lg px-3 py-1.5 text-[10px] font-mono text-slate-500 overflow-hidden truncate border border-slate-100">
                                                        ID: {log.entityId}
                                                    </div>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center py-16 text-slate-400">
                                                <span className="material-symbols-outlined text-6xl mb-3 opacity-20 block">history</span>
                                                <p className="text-sm font-medium text-slate-500">No recent activity detected</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Quick Actions */}
                                    <div className="glass-card p-10 rounded-[2.5rem] border-[#6605c7]/10 bg-white/60">
                                        <h3 className="text-xl font-black font-display text-gray-900 mb-8 tracking-tight italic">Direct Commands</h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            {[
                                                { href: '/admin/blogs/create', icon: 'post_add', label: 'Write Blog', sublabel: 'Create Content' },
                                                { section: 'users', icon: 'person_add', label: 'Manage Users', sublabel: 'Portal Users' },
                                                { section: 'applications', icon: 'receipt_long', label: 'Review Applications', sublabel: 'Transmission Queue' },
                                                { section: 'system', icon: 'admin_panel_settings', label: 'System Control', sublabel: 'Protocol Config' },
                                            ].map((action, i) => (
                                                action.href ? (
                                                    <Link key={i} href={action.href} className="glass-card p-6 rounded-[2.5rem] bg-white group hover:bg-[#6605c7]/5 transition-all text-left border-[#6605c7]/10">
                                                        <div className={`w-12 h-12 rounded-2xl bg-[#6605c7]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                                            <span className={`material-symbols-outlined text-2xl opacity-80 text-[#6605c7]`}>{action.icon}</span>
                                                        </div>
                                                        <h4 className="text-sm font-black text-gray-900 group-hover:text-[#6605c7] transition-colors">{action.label}</h4>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{action.sublabel}</p>
                                                    </Link>
                                                ) : (
                                                    <button key={i} onClick={() => setActiveSection(action.section!)} className="glass-card p-6 rounded-[2.5rem] bg-white group hover:bg-[#6605c7]/5 transition-all text-left border-[#6605c7]/10 w-full">
                                                        <div className={`w-12 h-12 rounded-2xl bg-[#6605c7]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                                            <span className={`material-symbols-outlined text-2xl opacity-80 text-[#6605c7]`}>{action.icon}</span>
                                                        </div>
                                                        <h4 className="text-sm font-black text-gray-900 group-hover:text-[#6605c7] transition-colors">{action.label}</h4>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{action.sublabel}</p>
                                                    </button>
                                                )
                                            ))}
                                        </div>
                                    </div>

                                    {/* System Health */}
                                    <div className="glass-card p-10 rounded-[2.5rem] bg-gradient-to-br from-[#6605c7] to-[#7c3aed] text-white overflow-hidden relative shadow-lg shadow-purple-500/20 border border-[#6605c7]/20">
                                        <div className="relative z-10">
                                            <h3 className="text-xl font-black font-display mb-4 uppercase tracking-tighter italic">Compliance Shield</h3>
                                            <div className="space-y-0 bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                                                <HealthDot ok={true} label="API Server" />
                                                <HealthDot ok={true} label="Database" />
                                                <HealthDot ok={true} label="Auth Service" />
                                                <HealthDot ok={!maintenanceMode} label="Public Portal" />
                                                <HealthDot ok={true} label="Email SMTP" />
                                            </div>
                                            <div className="flex items-center gap-3 mt-4">
                                                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_#4ade80]" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Guardian Engine Live</span>
                                            </div>
                                        </div>
                                        <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none">
                                            <span className="material-symbols-outlined text-9xl">verified_user</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── ANALYTICS ────────────────────────────────────────────── */}
                    {activeSection === "analytics" && (
                        <div className="space-y-10 animate-fade-in">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                <div>
                                    <h2 className="text-[32px] font-black font-display text-gray-900 tracking-tight mb-2 italic">Platform Analytics</h2>
                                    <p className="text-slate-500 text-[12px] font-bold uppercase tracking-widest">Real-time insights across the VidhyaLoan ecosystem</p>
                                </div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <button onClick={() => { setAnalyticsLoading(true); loadData(); }} disabled={analyticsLoading} className="px-5 py-3 rounded-xl border border-slate-200/50 bg-white text-slate-600 font-bold text-[11px] uppercase tracking-wider hover:bg-white transition-all flex items-center gap-2 disabled:opacity-50">
                                        <span className={`material-symbols-outlined text-[18px] ${analyticsLoading ? 'animate-spin' : ''}`}>refresh</span>
                                        Refresh
                                    </button>
                                    <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 shadow-sm">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></span>
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Syncing</span>
                                    </div>
                                </div>
                            </div>

                            {analyticsLoading || loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-slate-100 animate-pulse rounded-[2rem]" />)}
                                </div>
                            ) : (
                                <>
                                    {/* Key Performance Metrics */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="glass-card stat-card-gradient p-8 rounded-[2rem] relative overflow-hidden group transition-all duration-500 hover:shadow-lg border border-purple-200/30 bg-gradient-to-br from-purple-50/40 to-indigo-50/40">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Total Loan Value</p>
                                            <p className="text-3xl font-black text-purple-600 font-display">₹{(analyticsData.appStats?.totalAmount || 0).toLocaleString('en-IN')}</p>
                                            <p className="text-[10px] text-gray-500 mt-3 font-bold">Across all applications</p>
                                            <div className="absolute -right-6 -bottom-6 opacity-[0.05] pointer-events-none"><span className="material-symbols-outlined text-8xl">account_balance_wallet</span></div>
                                        </div>
                                        <div className="glass-card stat-card-gradient p-8 rounded-[2rem] relative overflow-hidden group transition-all duration-500 hover:shadow-lg border border-emerald-200/30 bg-gradient-to-br from-emerald-50/40 to-teal-50/40">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Disbursed Amount</p>
                                            <p className="text-3xl font-black text-emerald-600 font-display">₹{(analyticsData.appStats?.disbursedAmount || 0).toLocaleString('en-IN')}</p>
                                            <p className="text-[10px] text-gray-500 mt-3 font-bold">{analyticsData.appStats?.total ? Math.round(((analyticsData.appStats?.disbursedAmount || 0) / (analyticsData.appStats?.totalAmount || 1)) * 100) : 0}% of total</p>
                                            <div className="absolute -right-6 -bottom-6 opacity-[0.05] pointer-events-none"><span className="material-symbols-outlined text-8xl">electric_bolt</span></div>
                                        </div>
                                        <div className="glass-card stat-card-gradient p-8 rounded-[2rem] relative overflow-hidden group transition-all duration-500 hover:shadow-lg border border-blue-200/30 bg-gradient-to-br from-blue-50/40 to-cyan-50/40">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Approval Rate</p>
                                            <p className="text-3xl font-black text-blue-600 font-display">{analyticsData.appStats?.total ? Math.round(((analyticsData.appStats?.approved || 0 + analyticsData.appStats?.disbursed || 0) / analyticsData.appStats?.total) * 100) : 0}%</p>
                                            <p className="text-[10px] text-gray-500 mt-3 font-bold">{(analyticsData.appStats?.approved || 0) + (analyticsData.appStats?.disbursed || 0)} approved</p>
                                            <div className="absolute -right-6 -bottom-6 opacity-[0.05] pointer-events-none"><span className="material-symbols-outlined text-8xl">trending_up</span></div>
                                        </div>
                                        <div className="glass-card stat-card-gradient p-8 rounded-[2rem] relative overflow-hidden group transition-all duration-500 hover:shadow-lg border border-amber-200/30 bg-gradient-to-br from-amber-50/40 to-orange-50/40">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Pending Review</p>
                                            <p className="text-3xl font-black text-amber-600 font-display">{analyticsData.appStats?.pending || 0}</p>
                                            <p className="text-[10px] text-gray-500 mt-3 font-bold">{analyticsData.appStats?.total ? Math.round(((analyticsData.appStats?.pending || 0) / analyticsData.appStats?.total) * 100) : 0}% of pipeline</p>
                                            <div className="absolute -right-6 -bottom-6 opacity-[0.05] pointer-events-none"><span className="material-symbols-outlined text-8xl">pending_actions</span></div>
                                        </div>
                                    </div>

                                    {/* Application status breakdown */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-[14px]">
                                        <div className="glass-card p-10 rounded-[2.5rem] border-slate-200/30 bg-white/60 lg:col-span-2">
                                            <h3 className="text-xl font-black font-display text-slate-900 mb-2 tracking-tight italic">Application Distribution</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-8">Global processing statistics</p>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {[
                                                    { label: 'Pending', value: analyticsData.appStats?.pending || 0, color: 'bg-amber-400', style: 'bg-amber-50/50 border-amber-100 text-amber-900' },
                                                    { label: 'Processing', value: analyticsData.appStats?.processing || 0, color: 'bg-blue-400', style: 'bg-blue-50/50 border-blue-100 text-blue-900' },
                                                    { label: 'Approved', value: analyticsData.appStats?.approved || 0, color: 'bg-emerald-400', style: 'bg-emerald-50/50 border-emerald-100 text-emerald-900' },
                                                    { label: 'Rejected', value: analyticsData.appStats?.rejected || 0, color: 'bg-rose-400', style: 'bg-rose-50/50 border-rose-100 text-rose-900' },
                                                    { label: 'Disbursed', value: analyticsData.appStats?.disbursed || 0, color: 'bg-slate-900', style: 'bg-slate-50/50 border-slate-200 text-slate-900' },
                                                    { label: 'Total', value: analyticsData.appStats?.total || 0, color: 'bg-indigo-400', style: 'bg-indigo-50/50 border-indigo-100 text-indigo-900' },
                                                ].map((item, i) => {
                                                    const percentage = analyticsData.appStats?.total ? Math.round((item.value / analyticsData.appStats?.total) * 100) : 0;
                                                    return (
                                                        <div key={i} className={`p-5 rounded-xl border ${item.style} flex flex-col gap-2`}>
                                                            <div className={`w-8 h-1.5 rounded-full ${item.color}`} />
                                                            <p className="text-[28px] font-bold leading-none mt-1">{item.value}</p>
                                                            <p className="text-[11px] font-black uppercase tracking-widest opacity-60">{item.label}</p>
                                                            {item.label !== 'Total' && <p className="text-[10px] font-bold opacity-50">{percentage}%</p>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* User role donut */}
                                        <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm">
                                            <h3 className="text-[18px] font-bold text-slate-900 mb-2">User Segmentation</h3>
                                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-8">By assigned personnel role</p>
                                            <DonutChart segments={[
                                                { label: 'Students', value: analyticsData.usersByRole?.student || 0, color: '#3b82f6' },
                                                { label: 'Staff', value: analyticsData.usersByRole?.staff || 0, color: '#6366f1' },
                                                { label: 'Bank', value: analyticsData.usersByRole?.bank || 0, color: '#10b981' },
                                                { label: 'Agent', value: analyticsData.usersByRole?.agent || 0, color: '#f59e0b' },
                                                { label: 'Admin', value: analyticsData.usersByRole?.admin || 0, color: '#0f172a' },
                                            ]} />
                                            <div className="mt-6 space-y-2 text-[11px]">
                                                <div className="flex justify-between font-bold">
                                                    <span className="text-blue-600">Students: {analyticsData.usersByRole?.student || 0}</span>
                                                </div>
                                                <div className="flex justify-between font-bold">
                                                    <span className="text-indigo-600">Staff: {analyticsData.usersByRole?.staff || 0}</span>
                                                </div>
                                                <div className="flex justify-between font-bold">
                                                    <span className="text-emerald-600">Banks: {analyticsData.usersByRole?.bank || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* User growth mini chart */}
                                    <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className="text-[18px] font-bold text-slate-900">Platform Overview</h3>
                                                <p className="text-[13px] text-slate-500 mt-1">Key metrics snapshot - Last updated {lastRefresh.toLocaleTimeString('en-IN')}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                                <p className="text-[11px] font-bold text-slate-600 uppercase mb-1">Total Users</p>
                                                <p className="text-[20px] font-bold text-slate-900">{(analyticsData.usersByRole?.student || 0) + (analyticsData.usersByRole?.staff || 0) + (analyticsData.usersByRole?.bank || 0) + (analyticsData.usersByRole?.agent || 0) + (analyticsData.usersByRole?.admin || 0)}</p>
                                            </div>
                                            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                                <p className="text-[11px] font-bold text-purple-600 uppercase mb-1">Active Apps</p>
                                                <p className="text-[20px] font-bold text-purple-600">{analyticsData.appStats?.total || 0}</p>
                                            </div>
                                            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                                <p className="text-[11px] font-bold text-emerald-600 uppercase mb-1">Successful</p>
                                                <p className="text-[20px] font-bold text-emerald-600">{(analyticsData.appStats?.disbursed || 0)}</p>
                                            </div>
                                            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                                                <p className="text-[11px] font-bold text-amber-600 uppercase mb-1">In Review</p>
                                                <p className="text-[20px] font-bold text-amber-600">{(analyticsData.appStats?.processing || 0) + (analyticsData.appStats?.pending || 0)}</p>
                                            </div>
                                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                                <p className="text-[11px] font-bold text-blue-600 uppercase mb-1">Avg Loan</p>
                                                <p className="text-[16px] font-bold text-blue-600">₹{analyticsData.appStats?.total ? Math.round((analyticsData.appStats?.totalAmount || 0) / analyticsData.appStats?.total / 100000) * 100000 : 0}</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* ─── PORTAL CONTROL CENTER ────────────────────────────────── */}
                    {/* {activeSection === "portal_control" && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="flex items-center justify-between gap-4">
                                <div><h2 className="text-[24px] font-bold text-slate-900 tracking-tight">Portal Control Center</h2><p className="text-slate-500 text-[14px]">Monitor and manage ecosystem access nodes</p></div>
                            </div>

                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <PortalCard
                                    name="Student Portal"
                                    description="Main applicant dashboard and document center"
                                    icon="school"
                                    href="/dashboard"
                                    color="border-slate-200/60"
                                    users={stats.userCount || 0}
                                    status="online"
                                />
                                <PortalCard
                                    name="Staff Dashboard"
                                    description="Ops review, tracking and communications"
                                    icon="badge"
                                    href="/staff/dashboard"
                                    color="border-slate-200/60"
                                    users={stats.staffCount || 0}
                                    status="online"
                                />
                                <PortalCard
                                    name="Bank Panel"
                                    description="Funding, KYC and risk assessment gateway"
                                    icon="account_balance"
                                    href="/bank/dashboard"
                                    color="border-slate-200/60"
                                    users={stats.bankCount || 0}
                                    status="online"
                                />
                                <PortalCard
                                    name="Admin Console"
                                    description="Super admin nodes and security protocols"
                                    icon="admin_panel_settings"
                                    href="/admin"
                                    color="border-slate-900/10"
                                    users={stats.activeAdmins || 0}
                                    status="online"
                                />
                            </div>

                            
                            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                    <div>
                                        <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">User Directory</h3>
                                        <p className="text-[13px] text-slate-500 mt-1">{filteredData.length} records found in catalog</p>
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
                                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${roleColors[item.role] || 'bg-slate-100 text-slate-600'}`}>
                                                            {item.role || 'user'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-[13px] font-medium text-slate-500">
                                                        {item.createdAt ? format(new Date(item.createdAt), 'MMM d, yyyy') : '—'}
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => { setActiveSection('communications'); setEmailData({ ...emailData, to: item.email, isBulk: false }); }}
                                                                className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all"
                                                                title="Email User"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">mail</span>
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingUser({ ...item })}
                                                                className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all"
                                                                title="Edit User"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">edit</span>
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
                    )} */}

                    {/* ─── SYSTEM CONTROL ───────────────────────────────────────── */}
                    {activeSection === "system" && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="flex items-center justify-between gap-4">
                                <div><h2 className="text-[24px] font-bold text-slate-900 tracking-tight">System Control Center</h2><p className="text-slate-500 text-[14px]">Platform-wide node controls and broadcasts</p></div>
                                <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${maintenanceMode ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${maintenanceMode ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`}></span>
                                    <span className="text-[11px] font-black uppercase tracking-widest">{maintenanceMode ? 'Maintenance Hook Active' : 'All Portals Live'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Maintenance & Feature Flags */}
                                <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm space-y-6">
                                    <h3 className="text-[18px] font-bold text-slate-900 flex items-center gap-3">
                                        <span className="material-symbols-outlined text-slate-400">tune</span>
                                        Platform Logic
                                    </h3>

                                    {[
                                        {
                                            label: 'Maintenance Mode',
                                            description: 'Disable public access to the student portal',
                                            icon: 'construction',
                                            active: maintenanceMode,
                                            toggle: () => setMaintenanceMode(!maintenanceMode)
                                        },
                                        {
                                            label: 'AI Review Engine',
                                            description: 'Enable automated application scoring',
                                            icon: 'psychology',
                                            active: true,
                                            toggle: () => alert('AI Review toggle requires backend configuration')
                                        },
                                        {
                                            label: 'DigiLocker Integration',
                                            description: 'Direct document verification gateway',
                                            icon: 'folder_managed',
                                            active: true,
                                            toggle: () => alert('DigiLocker toggle requires backend configuration')
                                        },
                                        {
                                            label: 'Community Forum',
                                            description: 'Enable social and peer-to-peer modules',
                                            icon: 'forum',
                                            active: true,
                                            toggle: () => alert('Forum toggle requires backend configuration')
                                        },
                                    ].map((feature, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-600 shadow-sm`}>
                                                    <span className="material-symbols-outlined text-[20px]">{feature.icon}</span>
                                                </div>
                                                <div>
                                                    <p className="text-[14px] font-bold text-slate-900 tracking-tight">{feature.label}</p>
                                                    <p className="text-[11px] text-slate-500 font-medium">{feature.description}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={feature.toggle}
                                                className={`relative inline-flex w-11 h-6 rounded-full transition-all duration-300 ${feature.active ? 'bg-slate-900' : 'bg-slate-200'}`}
                                            >
                                                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${feature.active ? 'left-6' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Announcements */}
                                <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm">
                                    <h3 className="text-[18px] font-bold text-slate-900 mb-6 flex items-center gap-3">
                                        <span className="material-symbols-outlined text-slate-400">campaign</span>
                                        System Broadcasts
                                    </h3>

                                    <div className="space-y-4 mb-8">
                                        <input
                                            type="text"
                                            value={newAnnouncement.title}
                                            onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                            placeholder="Update title..."
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 transition-all font-medium"
                                        />
                                        <textarea
                                            value={newAnnouncement.message}
                                            onChange={e => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                                            placeholder="Detailed messaging..."
                                            rows={3}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 transition-all resize-none font-medium"
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <select
                                                value={newAnnouncement.type}
                                                onChange={e => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })}
                                                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] appearance-none focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-bold text-slate-600"
                                            >
                                                <option value="info">ℹ Standard</option>
                                                <option value="warning">⚠ Caution</option>
                                                <option value="error">🔴 Critical</option>
                                            </select>
                                            <select
                                                value={newAnnouncement.target}
                                                onChange={e => setNewAnnouncement({ ...newAnnouncement, target: e.target.value })}
                                                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] appearance-none focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-bold text-slate-600"
                                            >
                                                <option value="all">Every Portal</option>
                                                <option value="staff">Internal (Staff)</option>
                                                <option value="bank">Banking Nodes</option>
                                                <option value="user">Public (Users)</option>
                                            </select>
                                        </div>
                                        <button
                                            onClick={addAnnouncement}
                                            disabled={annLoading}
                                            className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold text-[13px] hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">campaign</span>
                                            Publish Broadcast
                                        </button>
                                    </div>

                                    <div className="space-y-3 max-h-80 overflow-y-auto no-scrollbar">
                                        {announcements.length === 0 ? (
                                            <div className="text-center py-12 text-slate-300 border-2 border-dashed border-slate-100 rounded-xl">
                                                <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">notifications_none</span>
                                                <p className="text-[11px] font-bold uppercase tracking-widest">Awaiting status updates</p>
                                            </div>
                                        ) : announcements.map(ann => (
                                            <AnnouncementItem key={ann.id} ann={ann} onDelete={deleteAnnouncement} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── FULL AUDIT LOGS ──────────────────────────────────────── */}
                    {activeSection === "audit_logs" && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                                <div>
                                    <h2 className="text-[24px] font-bold text-slate-900 tracking-tight">Ecosystem Audit Trail</h2>
                                    <p className="text-slate-500 text-[14px] mt-1">{allAuditLogs.length} events logged · Page {auditPage} of {Math.max(1, Math.ceil(filteredAuditLogs.length / 20))}</p>
                                </div>
                                <div className="flex gap-2 flex-wrap text-[13px]">
                                    {['all', 'create', 'update', 'delete'].map(f => (
                                        <button
                                            key={f}
                                            onClick={() => { setAuditFilter(f); setAuditPage(1); }}
                                            className={`px-4 py-1.5 rounded-lg font-bold transition-all border ${auditFilter === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                                        >
                                            {f.charAt(0).toUpperCase() + f.slice(1)}
                                        </button>
                                    ))}
                                    <button onClick={loadData} className="ml-2 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all bg-white border border-slate-200 rounded-lg">
                                        <span className="material-symbols-outlined text-[20px]">refresh</span>
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto text-[13px]">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/80 border-b border-slate-100">
                                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Timestamp</th>
                                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Operation</th>
                                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Context</th>
                                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Entity Reference</th>
                                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Initiator</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-24 text-center">
                                                        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto" />
                                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-4">Syncing Audit Trail...</p>
                                                    </td>
                                                </tr>
                                            ) : pagedAuditLogs.length > 0 ? pagedAuditLogs.map((log: any, i: number) => (
                                                <tr key={i} className="group hover:bg-slate-50 transition-all">
                                                    <td className="px-6 py-5 text-[13px] font-medium text-slate-500 whitespace-nowrap tabular-nums">
                                                        {format(new Date(log.createdAt), 'MMM d, yyyy · HH:mm')}
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${log.action === 'create' ? 'bg-emerald-50 text-emerald-700' :
                                                                log.action === 'delete' ? 'bg-rose-50 text-rose-700' :
                                                                    'bg-slate-100 text-slate-700'
                                                            }`}>
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className="text-slate-900 font-bold uppercase tracking-tight text-[11px] bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                                                            {log.entityType}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <code className="text-[11px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                                            {log.entityId?.substring(0, 12)}
                                                        </code>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600 shadow-sm">
                                                                {(log.initiator?.firstName || 'S')[0]}
                                                            </div>
                                                            <span className="text-[13px] font-bold text-slate-900">{log.initiator?.firstName || 'System'}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-24 text-center text-slate-300">
                                                        <span className="material-symbols-outlined text-4xl block mb-2 opacity-20">inventory_2</span>
                                                        <p className="text-[11px] font-bold uppercase tracking-widest">No matching security events</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {filteredAuditLogs.length > 20 && (
                                    <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                            Sequence {(auditPage - 1) * 20 + 1}—{Math.min(auditPage * 20, filteredAuditLogs.length)} of {filteredAuditLogs.length}
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                                                disabled={auditPage === 1}
                                                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[12px] font-bold disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() => setAuditPage(p => Math.min(Math.ceil(filteredAuditLogs.length / 20), p + 1))}
                                                disabled={auditPage >= Math.ceil(filteredAuditLogs.length / 20)}
                                                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[12px] font-bold disabled:opacity-30 hover:bg-slate-800 transition-all shadow-sm"
                                            >
                                                Next
                                            </button>
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
                        <div className="space-y-8 animate-fade-in">
                            <div>
                                <h2 className="text-[24px] font-bold text-slate-900 tracking-tight">Communication Hub</h2>
                                <p className="text-slate-500 text-[14px]">Direct and bulk outreach management</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm">
                                    <h3 className="text-[18px] font-bold text-slate-900 mb-6 flex items-center gap-3">
                                        <span className="material-symbols-outlined text-slate-400">send</span>
                                        Compose Broadcast
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit mb-6">
                                            <button
                                                onClick={() => setEmailData({ ...emailData, isBulk: false })}
                                                className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${!emailData.isBulk ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                Direct
                                            </button>
                                            <button
                                                onClick={() => setEmailData({ ...emailData, isBulk: true })}
                                                className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${emailData.isBulk ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                Bulk
                                            </button>
                                        </div>

                                        {!emailData.isBulk ? (
                                            <div>
                                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Recipient</label>
                                                <input type="email" value={emailData.to} onChange={e => setEmailData({ ...emailData, to: e.target.value })} placeholder="Enter email address..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 transition-all" />
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Target Audience</label>
                                                <select value={emailData.role} onChange={e => setEmailData({ ...emailData, role: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all appearance-none">
                                                    <option value="user">Students (Verified)</option>
                                                    <option value="staff">Internal Team</option>
                                                    <option value="agent">Processing Agents</option>
                                                    <option value="bank">Banking Entities</option>
                                                </select>
                                            </div>
                                        )}

                                        <div className="mb-6 p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 flex flex-col gap-3">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-[#6605c7]">Corporate Master Templates</label>
                                            <select 
                                                value={selectedTemplate}
                                                onChange={(e) => handleApplyTemplate(e.target.value)}
                                                className="w-full px-4 py-3 bg-white border border-indigo-100/60 rounded-xl text-[13px] text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-indigo-100/30 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="empty">-- SELECT TEMPLATE --</option>
                                                <option value="status_update">Formal: Status Progression Sync</option>
                                                <option value="action_required">Action Required: Document Verification</option>
                                                <option value="welcome_board">Welcome: Node Integration Successful</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Subject Line</label>
                                            <input type="text" value={emailData.subject} onChange={e => setEmailData({ ...emailData, subject: e.target.value })} placeholder="Re: Formal Application Sync..." className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#6605c7]/10 focus:border-[#6605c7]/30 transition-all text-slate-900" />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Message Narrative</label>
                                            <textarea value={emailData.content} onChange={e => setEmailData({ ...emailData, content: e.target.value })} placeholder="Type your formal communication protocol here..." rows={6} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#6605c7]/10 focus:border-[#6605c7]/30 transition-all resize-none leading-relaxed text-slate-700" />
                                        </div>
                                        <button
                                            onClick={handleSendEmail}
                                            disabled={emailLoading}
                                            className="w-full bg-slate-900 text-white py-4 rounded-lg font-bold uppercase tracking-widest text-[12px] flex items-center justify-center gap-2 mt-4 hover:bg-slate-800 transition-all shadow-md active:scale-[0.98]"
                                        >
                                            {emailLoading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : (<><span className="material-symbols-outlined text-[18px]">send</span> Transmit Message</>)}
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm">
                                    <h3 className="text-[18px] font-bold text-slate-900 mb-6 flex items-center gap-3">
                                        <span className="material-symbols-outlined text-slate-400">query_stats</span>
                                        Node Distribution
                                    </h3>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Verified Students', count: stats.userCount || 0, icon: 'person', color: 'text-slate-600' },
                                            { label: 'Banking Partners', count: stats.bankCount || 0, icon: 'account_balance', color: 'text-slate-600' },
                                            { label: 'Channel Agents', count: stats.agentCount || 0, icon: 'support_agent', color: 'text-slate-600' },
                                            { label: 'Internal Staff', count: stats.staffCount || 0, icon: 'badge', color: 'text-slate-600' }
                                        ].map((group, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center ${group.color} shadow-sm`}>
                                                        <span className="material-symbols-outlined text-[20px]">{group.icon}</span>
                                                    </div>
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{group.label}</span>
                                                </div>
                                                <span className="text-[18px] font-black text-slate-900 tabular-nums">{group.count}</span>
                                            </div>
                                        ))}
                                        <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 mt-8">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Network Security Protocol</p>
                                            <p className="text-[13px] text-slate-300 font-medium leading-relaxed">All outbound communications are signed via industrial SMTP relays to ensure 99.9% inbox placement.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── COMMUNITY FORUM MANAGEMENT ────────────────────────── */}
                    {activeSection === "community" && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                                <div>
                                    <h2 className="text-[24px] font-bold text-slate-900 tracking-tight">Community Governance</h2>
                                    <p className="text-slate-500 text-[14px]">Mentorship oversight and resource distribution</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={loadCommunityData} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all bg-white border border-slate-200 rounded-lg">
                                        <span className="material-symbols-outlined text-[20px]">refresh</span>
                                    </button>
                                </div>
                            </div>

                            {/* Community Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <StatCard label="Active Mentors" value={communityStats.activeMentors || 0} icon="workspace_premium" color="text-slate-900" loading={loading} />
                                <StatCard label="Social Signals" value={communityStats.totalPosts || 0} icon="forum" color="text-slate-900" loading={loading} />
                                <StatCard label="Appreciation" value={communityStats.totalEngagement || 0} icon="favorite" color="text-slate-900" loading={loading} />
                                <StatCard label="Resources" value={communityStats.resourcesCount || 0} icon="library_books" color="text-slate-900" loading={loading} />
                            </div>

                            {/* Mentors Management Section */}
                            <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div>
                                        <h3 className="text-[18px] font-bold text-slate-900 flex items-center gap-3">
                                            <span className="material-symbols-outlined text-slate-400">workspace_premium</span>
                                            Mentorship Council
                                        </h3>
                                        <p className="text-[13px] text-slate-500 font-semibold mt-1">{mentors.length} specialists actively broadcasting guidance</p>
                                    </div>
                                    <button className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-bold text-[12px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm">
                                        <span className="material-symbols-outlined text-[18px]">person_add</span>
                                        Onboard Specialist
                                    </button>
                                </div>

                                {mentors.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {mentors.map((mentor: any, i: number) => (
                                            <div key={i} className="p-6 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all group relative overflow-hidden">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-white flex-shrink-0 shadow-sm">
                                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.email || mentor.id}`} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[14px] font-bold text-slate-900 truncate tracking-tight">{mentor.name || `${mentor.firstName} ${mentor.lastName}`}</p>
                                                            <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest truncate">{mentor.expertise || 'General Specialist'}</p>
                                                        </div>
                                                    </div>
                                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase tracking-widest rounded border border-emerald-100">Live</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 mb-6">
                                                    <div className="p-3 bg-white border border-slate-100 rounded-lg">
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Mentees</p>
                                                        <p className="text-[14px] font-black text-slate-900">{mentor.menteeCount || '15+'}</p>
                                                    </div>
                                                    <div className="p-3 bg-white border border-slate-100 rounded-lg">
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Rating</p>
                                                        <p className="text-[14px] font-black text-slate-900">{mentor.rating || '4.9'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="flex-1 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-[10px] font-bold text-slate-600 transition-all border border-slate-200 shadow-sm uppercase tracking-widest">Profile</button>
                                                    <button className="flex-1 px-3 py-2 rounded-lg text-rose-500 hover:bg-rose-50 text-[10px] font-bold transition-all border border-transparent uppercase tracking-widest">Revoke</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                                        <span className="material-symbols-outlined text-5xl text-slate-200 block mb-3">supervisor_account</span>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No active specialists registered</p>
                                    </div>
                                )}
                            </div>

                            {/* Forum Posts Section */}
                            <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                                    <div>
                                        <h3 className="text-[18px] font-bold text-slate-900 flex items-center gap-3">
                                            <span className="material-symbols-outlined text-slate-400">forum</span>
                                            Recent Social Broadcasts
                                        </h3>
                                        <p className="text-[13px] text-slate-500 font-semibold mt-1">Live monitoring of community interaction layers</p>
                                    </div>
                                    <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest tabular-nums">Sync: {lastRefresh.toLocaleTimeString()}</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse outline outline-offset-2 outline-emerald-100" />
                                    </div>
                                </div>

                                {filteredData.length > 0 ? (
                                    <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar">
                                        {filteredData.slice(0, 10).map((post: any, i: number) => (
                                            <div key={i} className="p-6 rounded-xl border border-slate-100 hover:bg-slate-50/50 hover:border-slate-200 transition-all group">
                                                <div className="flex items-start justify-between gap-6 mb-4">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[14px] font-bold text-slate-900 line-clamp-2 group-hover:text-slate-800 transition-colors tracking-tight leading-snug">{post.title}</p>
                                                        <p className="text-[11px] text-slate-500 font-medium mt-1.5 flex items-center gap-2">
                                                            <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">
                                                                {(post.author?.firstName || post.authorName || 'U')[0]}
                                                            </span>
                                                            Broadcast by <span className="text-slate-900 font-bold">{post.author?.firstName || post.authorName}</span>
                                                        </p>
                                                    </div>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded border flex-shrink-0 ${post.isPinned ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                        {post.isPinned ? 'Anchor' : 'Relay'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-6 text-[11px] font-bold text-slate-400 mb-4 tabular-nums">
                                                    <span className="flex items-center gap-1.5 group-hover:text-rose-500 transition-colors"><span className="material-symbols-outlined text-[16px]">favorite</span> {post.likesCount || 0}</span>
                                                    <span className="flex items-center gap-1.5 group-hover:text-indigo-500 transition-colors"><span className="material-symbols-outlined text-[16px]">chat_bubble</span> {post.comments?.length || 0}</span>
                                                    <span className="flex items-center gap-1.5 group-hover:text-slate-900 transition-colors"><span className="material-symbols-outlined text-[16px]">visibility</span> {post.views || 0}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="flex-1 px-4 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-[10px] font-black text-slate-600 uppercase tracking-widest transition-all shadow-sm">Pin to Top</button>
                                                    <button className="flex-1 px-4 py-2 rounded-lg text-rose-500 hover:bg-rose-50 text-[10px] font-black uppercase tracking-widest transition-all">Moderate</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                                        <span className="material-symbols-outlined text-5xl text-slate-200 block mb-3">forum</span>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No active forum discussions detected</p>
                                    </div>
                                )}
                            </div>

                            {/* Community Resources Section */}
                            <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm">
                                <div className="mb-8">
                                    <h3 className="text-[18px] font-bold text-slate-900 flex items-center gap-3">
                                        <span className="material-symbols-outlined text-slate-400">library_books</span>
                                        Asset Repository
                                    </h3>
                                    <p className="text-[13px] text-slate-500 font-semibold mt-1">Managed literature and instructional documentation</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[
                                        { type: 'Technical Guide', title: 'Complete Visa Interview Protocol', downloads: 245, rating: 4.9, icon: 'article' },
                                        { type: 'Media Archive', title: 'SOP Strategic Architecture Masterclass', downloads: 189, rating: 4.8, icon: 'movie_edit' },
                                        { type: 'Data Template', title: 'Fiscal Application Structures', downloads: 567, rating: 4.7, icon: 'description' },
                                        { type: 'Analysis', title: 'HEC Pakistan Success Narrative', downloads: 123, rating: 5.0, icon: 'summarize' },
                                        { type: 'Protocol', title: 'Global Document Checklist 2024', downloads: 834, rating: 4.9, icon: 'fact_check' },
                                        { type: 'Seminar', title: 'Institutional Selection Strategy', downloads: 92, rating: 4.6, icon: 'podcasts' }
                                    ].map((resource, i) => (
                                        <div key={i} className="p-5 rounded-xl border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all group">
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0 group-hover:text-slate-900 transition-colors">
                                                    <span className="material-symbols-outlined text-[20px]">{resource.icon}</span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{resource.type}</p>
                                                    <p className="text-[13px] font-bold text-slate-900 group-hover:text-slate-800 transition-colors leading-snug">{resource.title}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] font-bold mb-5 tabular-nums">
                                                <span className="text-slate-400 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">download</span> {resource.downloads} Units</span>
                                                <span className="text-amber-500 flex items-center gap-1">★ {resource.rating}</span>
                                            </div>
                                            <button className="w-full px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">Access File</button>
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
                                    <h2 className="text-[24px] font-bold text-slate-900 tracking-tight capitalize">{activeSection} Management</h2>
                                    <p className="text-slate-500 text-[14px]">System-wide records for {activeSection} nodes</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                                    {activeSection === 'users' && (
                                        <button onClick={() => setShowCreateUserModal(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold text-[12px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm">
                                            <span className="material-symbols-outlined text-[18px]">person_add</span>
                                            Create Node
                                        </button>
                                    )}
                                    <div className="relative flex-1 md:w-80">
                                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="Query unique identifier or name..."
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
                                                        className="p-3 bg-white border border-red-100 text-red-400 hover:text-red-600 rounded-xl transition-all shadow-sm"
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

                            {/* ─── APPLICATIONS DASHBOARD ──────────────────────────────────────── */}
                            {activeSection === "applications" && (
                                <div className="space-y-6">
                                    {/* Header with Title and Actions */}
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        <div>
                                            <h2 className="text-[28px] font-bold text-slate-900 tracking-tight">Applications</h2>
                                            <p className="text-slate-500 text-[13px] font-medium mt-1">Manage and review loan applications across all channels</p>
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            <button className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-bold text-[12px] hover:bg-slate-200 transition-all flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px]">download</span>Export
                                            </button>
                                            <button className="px-4 py-2.5 bg-[#6605c7] text-white rounded-lg font-bold text-[12px] hover:bg-[#5a04b0] transition-all flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px]">add</span>New Application
                                            </button>
                                        </div>
                                    </div>

                                    {/* Status Overview Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-white p-5 rounded-xl border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all group">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-all">
                                                    <span className="material-symbols-outlined text-amber-600">pending_actions</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">Pending</span>
                                            </div>
                                            <p className="text-[26px] font-bold text-slate-900">{data.filter((a: any) => a.status === 'pending').length}</p>
                                            <p className="text-[12px] text-slate-600 font-medium mt-2">Awaiting review</p>
                                        </div>

                                        <div className="bg-white p-5 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-all">
                                                    <span className="material-symbols-outlined text-blue-600">hourglass_bottom</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">Processing</span>
                                            </div>
                                            <p className="text-[26px] font-bold text-slate-900">{data.filter((a: any) => a.status === 'processing').length}</p>
                                            <p className="text-[12px] text-slate-600 font-medium mt-2">Under review</p>
                                        </div>

                                        <div className="bg-white p-5 rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all group">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-all">
                                                    <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Approved</span>
                                            </div>
                                            <p className="text-[26px] font-bold text-slate-900">{data.filter((a: any) => a.status === 'approved').length}</p>
                                            <p className="text-[12px] text-slate-600 font-medium mt-2">Ready to disburse</p>
                                        </div>

                                        <div className="bg-white p-5 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all group">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-all">
                                                    <span className="material-symbols-outlined text-purple-600">account_balance_wallet</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">Disbursed</span>
                                            </div>
                                            <p className="text-[26px] font-bold text-slate-900">{data.filter((a: any) => a.status === 'disbursed').length}</p>
                                            <p className="text-[12px] text-slate-600 font-medium mt-2">Completed</p>
                                        </div>
                                    </div>

                                    {/* Key Metrics */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-indigo-600">payments</span>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] text-slate-600 font-semibold uppercase tracking-wide">Total Requested</p>
                                                    <p className="text-[20px] font-bold text-slate-900">₹{(data.reduce((sum: number, app: any) => sum + (app.amount || 0), 0) / 10000000).toFixed(1)}Cr</p>
                                                </div>
                                            </div>
                                            <p className="text-[12px] text-slate-500">Across {data.length} applications</p>
                                        </div>

                                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-emerald-600">trending_up</span>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] text-slate-600 font-semibold uppercase tracking-wide">Approval Rate</p>
                                                    <p className="text-[20px] font-bold text-slate-900">{data.length ? Math.round(((data.filter((a: any) => a.status === 'approved' || a.status === 'disbursed').length) / data.length) * 100) : 0}%</p>
                                                </div>
                                            </div>
                                            <p className="text-[12px] text-slate-500">Success ratio</p>
                                        </div>

                                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-blue-600">average</span>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] text-slate-600 font-semibold uppercase tracking-wide">Avg. Loan</p>
                                                    <p className="text-[20px] font-bold text-slate-900">₹{data.length ? (data.reduce((sum: number, app: any) => sum + (app.amount || 0), 0) / data.length / 100000).toFixed(1) : 0}L</p>
                                                </div>
                                            </div>
                                            <p className="text-[12px] text-slate-500">Per application</p>
                                        </div>
                                    </div>

                                    {/* Search and Filters Bar */}
                                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                                            {/* Search */}
                                            <div className="flex-1">
                                                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-2">Quick Search</label>
                                                <div className="relative">
                                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
                                                    <input
                                                        type="text"
                                                        value={searchQuery}
                                                        onChange={e => setSearchQuery(e.target.value)}
                                                        placeholder="Search by name, email, app ID..."
                                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-[#6605c7]/10 focus:border-[#6605c7]/20 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            {/* Filters */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-auto">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-1.5">Status</label>
                                                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-[#6605c7]/10 bg-gray-50">
                                                        <option value="all">All</option>
                                                        <option value="pending">Pending</option>
                                                        <option value="processing">Processing</option>
                                                        <option value="approved">Approved</option>
                                                        <option value="disbursed">Disbursed</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-1.5">Bank</label>
                                                    <select value={filterBank} onChange={e => setFilterBank(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-[#6605c7]/10 bg-gray-50">
                                                        <option value="all">All Banks</option>
                                                        <option value="hdfc">HDFC Bank</option>
                                                        <option value="icici">ICICI Bank</option>
                                                        <option value="sbi">SBI</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-1.5">Loan Type</label>
                                                    <select value={filterLoanType} onChange={e => setFilterLoanType(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-[#6605c7]/10 bg-gray-50">
                                                        <option value="all">All Types</option>
                                                        <option value="unsecured">Unsecured</option>
                                                        <option value="secured">Secured</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-1.5">Action</label>
                                                    <button
                                                        onClick={() => {
                                                            setFilterStatus("all");
                                                            setFilterBank("all");
                                                            setFilterLoanType("all");
                                                            setSearchQuery("");
                                                        }}
                                                        className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-[11px] font-bold text-gray-700 hover:bg-gray-200 transition-all uppercase tracking-wide"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Applications Table */}
                                    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-[13px]">
                                                <thead className="bg-slate-50 border-b border-gray-200 sticky top-0">
                                                    <tr>
                                                        <th className="px-5 py-3.5 font-bold text-slate-700 text-[10px] uppercase tracking-widest"><input type="checkbox" className="rounded" /></th>
                                                        <th className="px-5 py-3.5 font-bold text-slate-700 text-[10px] uppercase tracking-widest">Application</th>
                                                        <th className="px-5 py-3.5 font-bold text-slate-700 text-[10px] uppercase tracking-widest">Applicant</th>
                                                        <th className="px-5 py-3.5 font-bold text-slate-700 text-[10px] uppercase tracking-widest">Bank & Source</th>
                                                        <th className="px-5 py-3.5 font-bold text-slate-700 text-[10px] uppercase tracking-widest">Amount</th>
                                                        <th className="px-5 py-3.5 font-bold text-slate-700 text-[10px] uppercase tracking-widest">Status</th>
                                                        <th className="px-5 py-3.5 font-bold text-slate-700 text-[10px] uppercase tracking-widest">Priority</th>
                                                        <th className="px-5 py-3.5 font-bold text-slate-700 text-[10px] uppercase tracking-widest">Applied</th>
                                                        <th className="px-5 py-3.5 font-bold text-slate-700 text-[10px] uppercase tracking-widest">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {loading ? (
                                                        <tr><td colSpan={9} className="px-6 py-12 text-center">
                                                            <div className="flex flex-col items-center">
                                                                <div className="w-10 h-10 border-4 border-[#6605c7]/10 border-t-[#6605c7] rounded-full animate-spin mb-3" />
                                                                <p className="text-[12px] font-bold text-slate-500">Loading applications...</p>
                                                            </div>
                                                        </td></tr>
                                                    ) : filteredData.length > 0 ? filteredData.map((item: any, idx: number) => {
                                                        const applicantApps = filteredData.filter((a: any) => a.email === item.email);
                                                        const hasMultipleApps = applicantApps.length > 1;
                                                        const priorityLevel = item.priority || 'normal';
                                                        
                                                        return (
                                                        <tr key={idx} className={`hover:bg-slate-50/60 transition-all group ${hasMultipleApps ? 'bg-purple-50/20' : ''}`}>
                                                            <td className="px-5 py-3.5"><input type="checkbox" className="rounded" /></td>
                                                            
                                                            {/* App ID */}
                                                            <td className="px-5 py-3.5">
                                                                <div className="flex flex-col gap-1">
                                                                    <code className="text-[10px] font-bold text-[#6605c7] font-mono">{item.applicationNumber || item.id?.substring(0, 8)}</code>
                                                                    {item.referenceId && <span className="text-[9px] text-slate-500">Ref: {item.referenceId}</span>}
                                                                </div>
                                                            </td>
                                                            
                                                            {/* Applicant */}
                                                            <td className="px-5 py-3.5">
                                                                <div className="flex flex-col gap-0.5">
                                                                    <p className="font-bold text-slate-900 text-[11px]">{item.firstName} {item.lastName}</p>
                                                                    <p className="text-[9px] text-slate-500">{item.email}</p>
                                                                </div>
                                                            </td>
                                                            
                                                            {/* Bank & Source */}
                                                            <td className="px-5 py-3.5">
                                                                <div className="flex flex-col gap-1.5 text-[10px]">
                                                                    <div className="font-bold text-slate-900">{item.bank || 'N/A'}</div>
                                                                    <div className="flex items-center gap-1 text-slate-600">
                                                                        <span className="material-symbols-outlined text-[12px]">person</span>
                                                                        <span>{item.staffName || item.processingStaff || 'Unassigned'}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 text-slate-600">
                                                                        <span className="material-symbols-outlined text-[12px]">location_on</span>
                                                                        <span>{item.region || item.state || 'N/A'}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            
                                                            {/* Amount */}
                                                            <td className="px-5 py-3.5">
                                                                <p className="font-bold text-slate-900 text-[11px]">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.amount || 0)}</p>
                                                            </td>
                                                            
                                                            {/* Status */}
                                                            <td className="px-5 py-3.5">
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide border ${
                                                                    item.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                    item.status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                    item.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                                    item.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                    item.status === 'disbursed' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                                    'bg-gray-50 text-gray-700 border-gray-200'
                                                                }`}>
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                            
                                                            {/* Priority */}
                                                            <td className="px-5 py-3.5">
                                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide border ${
                                                                    priorityLevel === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                    priorityLevel === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                    'bg-gray-50 text-gray-700 border-gray-200'
                                                                }`}>
                                                                    <span className="material-symbols-outlined text-[10px]">
                                                                        {priorityLevel === 'high' ? 'arrow_upward' : priorityLevel === 'medium' ? 'remove' : 'arrow_downward'}
                                                                    </span>
                                                                    {priorityLevel}
                                                                </span>
                                                            </td>
                                                            
                                                            {/* Applied Date */}
                                                            <td className="px-5 py-3.5 text-[10px] text-slate-600 font-medium">
                                                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : '—'}
                                                            </td>
                                                            
                                                            {/* Actions */}
                                                            <td className="px-5 py-3.5">
                                                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={() => { setSelectedApp(item); setActionRemarks(""); }}
                                                                        className="p-2 bg-[#6605c7] text-white rounded-lg hover:bg-[#5a04b0] transition-all text-[12px] font-bold"
                                                                        title="View Details"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                                                                    </button>
                                                                    {item.status === 'pending' && (
                                                                        <button className="p-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-all" title="Approve">
                                                                            <span className="material-symbols-outlined text-[16px]">check</span>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        );
                                                    }) : (
                                                        <tr>
                                                            <td colSpan={9} className="px-6 py-16 text-center">
                                                                <span className="material-symbols-outlined text-4xl mb-3 opacity-20 block">folder_off</span>
                                                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">No applications found</p>
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
                    )}

                    {/* ─── BLOGS DASHBOARD ──────────────────────────────────────── */}
                    {activeSection === "blogs" && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-[28px] font-bold text-slate-900 tracking-tight">Editorial Content</h2>
                                    <p className="text-slate-500 text-[13px] font-medium mt-1">Manage platform publications and editorial timeline</p>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                                        <button onClick={() => setFilterBlogTime('all')} className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all ${filterBlogTime === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>All Time</button>
                                        <button onClick={() => setFilterBlogTime('weekly')} className={`px-4 py-2 border-l border-gray-200 text-[11px] font-black uppercase tracking-widest transition-all ${filterBlogTime === 'weekly' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Weekly</button>
                                        <button onClick={() => setFilterBlogTime('monthly')} className={`px-4 py-2 border-l border-gray-200 text-[11px] font-black uppercase tracking-widest transition-all ${filterBlogTime === 'monthly' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Monthly</button>
                                        <button onClick={() => setFilterBlogTime('yearly')} className={`px-4 py-2 border-l border-gray-200 text-[11px] font-black uppercase tracking-widest transition-all ${filterBlogTime === 'yearly' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Yearly</button>
                                    </div>
                                    <button className="px-4 py-2.5 bg-[#6605c7] text-white rounded-lg font-bold text-[12px] hover:bg-[#5a04b0] transition-all flex items-center gap-2 shadow-sm">
                                        <span className="material-symbols-outlined text-[16px]">add</span>New Post
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[13px]">
                                        <thead className="bg-slate-50 border-b border-gray-200 sticky top-0">
                                            <tr>
                                                <th className="px-5 py-3.5 font-bold text-slate-700 text-[10px] uppercase tracking-widest">Post Metadata</th>
                                                <th className="px-5 py-3.5 font-bold text-slate-700 text-[10px] uppercase tracking-widest w-32">Status</th>
                                                <th className="px-5 py-3.5 font-bold text-slate-700 text-[10px] uppercase tracking-widest w-40">Created</th>
                                                <th className="px-5 py-3.5 font-bold text-slate-700 text-[10px] uppercase tracking-widest w-32 text-right">Engagement</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {loading ? (
                                                <tr><td colSpan={4} className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-10 h-10 border-4 border-[#6605c7]/10 border-t-[#6605c7] rounded-full animate-spin mb-3" />
                                                        <p className="text-[12px] font-bold text-slate-500">Loading publications...</p>
                                                    </div>
                                                </td></tr>
                                            ) : filteredData.length > 0 ? filteredData.map((item: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-slate-50/60 transition-all group">
                                                    <td className="px-5 py-4">
                                                        <p className="text-[14px] font-bold text-slate-900 tracking-tight leading-tight mb-1">{item.title}</p>
                                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Writer: {item.authorName}</p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-[0.1em] border ${item.isPublished ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                            {item.isPublished ? 'Live' : 'Draft'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-[11px] text-slate-500 font-medium">
                                                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : '—'}
                                                    </td>
                                                    <td className="px-5 py-4 text-right font-black text-slate-900 tabular-nums">
                                                        {item.views || 0} UITS
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-16 text-center">
                                                        <span className="material-symbols-outlined text-4xl mb-3 opacity-20 block">history_edu</span>
                                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">No matching posts found</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

            {/* ─── Application Detail Drawer ────────────────────────────────── */}
            {selectedApp && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in" onClick={() => { setSelectedApp(null); setAiReview(null); setDrawerTab('details'); }} />
                    <div className="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-slide-in-right border-l border-slate-200">
                        <div className="sticky top-0 z-20 bg-white border-b border-slate-100 px-8 py-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-900/20">
                                            <span className="material-symbols-outlined text-[20px]">description</span>
                                        </div>
                                        <div>
                                            <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">Application Dossier</h2>
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Ref: {selectedApp.applicationNumber || selectedApp.id?.substring(0, 12)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${selectedApp.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            selectedApp.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                'bg-blue-50 text-blue-700 border-blue-100'
                                        }`}>{selectedApp.status}</span>
                                    <button onClick={() => { setSelectedApp(null); setAiReview(null); setDrawerTab('details'); }} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all border border-transparent hover:border-slate-100">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-8 overflow-x-auto pb-2">
                                <button onClick={() => setDrawerTab('details')} className={`whitespace-nowrap pb-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${drawerTab === 'details' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Applicant Info</button>
                                <button onClick={() => setDrawerTab('documents')} className={`whitespace-nowrap pb-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${drawerTab === 'documents' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                                    <span className="material-symbols-outlined text-[14px]">description</span>
                                    Documents
                                </button>
                                <button onClick={() => setDrawerTab('notes')} className={`whitespace-nowrap pb-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${drawerTab === 'notes' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                                    <span className="material-symbols-outlined text-[14px]">note</span>
                                    Admin Notes
                                </button>
                                <button onClick={() => setDrawerTab('history')} className={`whitespace-nowrap pb-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${drawerTab === 'history' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                                    <span className="material-symbols-outlined text-[14px]">timeline</span>
                                    Timeline
                                </button>
                                <button onClick={() => { if (!aiReview) handleAIReview(selectedApp.id); else setDrawerTab('ai_review'); }} className={`whitespace-nowrap pb-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${drawerTab === 'ai_review' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                                    <span className="material-symbols-outlined text-[14px]">psychology</span>
                                    AI Review
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                            {drawerTab === 'details' ? (
                                <>
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="material-symbols-outlined text-purple-600 text-[20px]">person</span>
                                            <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-wide">Applicant Details</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-y-4 gap-x-6 bg-purple-50/30 p-6 rounded-lg border border-purple-100">
                                            <DetailRow label="Full Name" value={`${selectedApp.firstName || ''} ${selectedApp.lastName || ''}`.trim() || '—'} />
                                            <DetailRow label="Email Address" value={selectedApp.email || '—'} />
                                            <DetailRow label="Phone Number" value={selectedApp.phone || '—'} />
                                            <DetailRow label="Date of Birth" value={selectedApp.dateOfBirth ? format(new Date(selectedApp.dateOfBirth), 'dd MMM yyyy') : '—'} />
                                            <div className="col-span-2">
                                                <DetailRow label="Address" value={selectedApp.address || '—'} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="material-symbols-outlined text-purple-600 text-[20px]">account_balance</span>
                                            <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-wide">Loan Details</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-y-4 gap-x-6 bg-purple-50/30 p-6 rounded-lg border border-purple-100">
                                            <DetailRow label="Bank Partner" value={selectedApp.bank || '—'} />
                                            <DetailRow label="Loan Type" value={selectedApp.loanType || '—'} />
                                            <DetailRow label="Loan Amount" value={selectedApp.amount ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(selectedApp.amount) : '—'} highlight />
                                            <DetailRow label="University" value={selectedApp.universityName || '—'} />
                                            <DetailRow label="Country" value={selectedApp.country || '—'} />
                                            <DetailRow label="Applied On" value={selectedApp.createdAt ? format(new Date(selectedApp.createdAt), 'dd MMM yyyy') : '—'} />
                                        </div>
                                    </div>

                                    {/* Application Metadata & Source */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="material-symbols-outlined text-blue-600 text-[20px]">info</span>
                                            <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-wide">Application Source & Metadata</h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 bg-blue-50/30 p-6 rounded-lg border border-blue-100">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Application ID</span>
                                                    <span className="text-[13px] font-bold text-blue-600 font-mono">{selectedApp.applicationNumber || selectedApp.id?.substring(0, 12) || '—'}</span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference ID</span>
                                                    <span className="text-[13px] font-bold text-slate-900">{selectedApp.referenceId || '—'}</span>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-blue-100 grid grid-cols-1 gap-4">
                                                {/* Staff Information */}
                                                <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-blue-100">
                                                    <span className="material-symbols-outlined text-blue-600 text-[20px] flex-shrink-0">person</span>
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Processing Staff</p>
                                                        <p className="text-[12px] font-bold text-slate-900">{selectedApp.staffName || selectedApp.processingStaff || 'Unassigned'}</p>
                                                        {selectedApp.staffId && <p className="text-[10px] text-slate-500 font-medium mt-1">Staff ID: {selectedApp.staffId}</p>}
                                                        {selectedApp.staffEmail && <p className="text-[10px] text-slate-500 font-medium">{selectedApp.staffEmail}</p>}
                                                    </div>
                                                </div>

                                                {/* Region Information */}
                                                <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-green-100">
                                                    <span className="material-symbols-outlined text-green-600 text-[20px] flex-shrink-0">location_on</span>
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Region / Location</p>
                                                        <p className="text-[12px] font-bold text-slate-900">{selectedApp.region || selectedApp.state || 'N/A'}</p>
                                                        {selectedApp.city && <p className="text-[10px] text-slate-500 font-medium mt-1">City: {selectedApp.city}</p>}
                                                        {selectedApp.country && <p className="text-[10px] text-slate-500 font-medium">Country: {selectedApp.country}</p>}
                                                    </div>
                                                </div>

                                                {/* Counselor Information */}
                                                <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-amber-100">
                                                    <span className="material-symbols-outlined text-amber-600 text-[20px] flex-shrink-0">support_agent</span>
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Counselor</p>
                                                        <p className="text-[12px] font-bold text-slate-900">{selectedApp.counselorName || selectedApp.counselor || 'Not Assigned'}</p>
                                                        {selectedApp.counselorEmail && <p className="text-[10px] text-slate-500 font-medium mt-1">{selectedApp.counselorEmail}</p>}
                                                        {selectedApp.counselorPhone && <p className="text-[10px] text-slate-500 font-medium">{selectedApp.counselorPhone}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Multi-Bank Application Priority Management */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="material-symbols-outlined text-purple-600 text-[20px]">hub</span>
                                            <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-wide">Multi-Bank Priority</h3>
                                        </div>
                                        <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <p className="text-[12px] font-bold text-gray-900">Applicant has 3 active bank applications</p>
                                                    <p className="text-[10px] text-gray-600 font-medium mt-1">Set priority to streamline the approval process</p>
                                                </div>
                                                <span className="material-symbols-outlined text-amber-500 text-[28px]">warning</span>
                                            </div>
                                            <div className="space-y-3 mt-4">
                                                <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-3">Set Priority Level</p>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <button className="flex flex-col items-center justify-center p-3 bg-red-50 border-2 border-red-200 rounded-lg hover:bg-red-100 transition-all group cursor-pointer">
                                                        <span className="material-symbols-outlined text-red-600 text-[24px] group-hover:scale-110 transition-transform">arrow_upward</span>
                                                        <p className="text-[10px] font-bold text-red-700 mt-1 uppercase">High</p>
                                                    </button>
                                                    <button className="flex flex-col items-center justify-center p-3 bg-amber-50 border-2 border-amber-200 rounded-lg hover:bg-amber-100 transition-all group cursor-pointer">
                                                        <span className="material-symbols-outlined text-amber-600 text-[24px] group-hover:scale-110 transition-transform">remove</span>
                                                        <p className="text-[10px] font-bold text-amber-700 mt-1 uppercase">Medium</p>
                                                    </button>
                                                    <button className="flex flex-col items-center justify-center p-3 bg-gray-50 border-2 border-gray-200 rounded-lg hover:bg-gray-100 transition-all group cursor-pointer">
                                                        <span className="material-symbols-outlined text-gray-600 text-[24px] group-hover:scale-110 transition-transform">arrow_downward</span>
                                                        <p className="text-[10px] font-bold text-gray-700 mt-1 uppercase">Normal</p>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-purple-200">
                                                <p className="text-[10px] text-gray-600 font-medium"><span className="font-bold">High Priority:</span> Process first, allocate dedicated reviewer</p>
                                                <p className="text-[10px] text-gray-600 font-medium mt-1"><span className="font-bold">Medium:</span> Process in standard queue, standard review</p>
                                                <p className="text-[10px] text-gray-600 font-medium mt-1"><span className="font-bold">Normal:</span> Queue as received, batch review</p>
                                            </div>
                                        </div>

                                        {/* Related Applications */}
                                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                                            <p className="text-[12px] font-bold text-gray-900 mb-4 uppercase tracking-wide">Related Bank Applications</p>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <div>
                                                        <p className="text-[11px] font-bold text-gray-900">HDFC Bank</p>
                                                        <p className="text-[10px] text-gray-600 font-medium">₹7,50,000 • Pending</p>
                                                    </div>
                                                    <span className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-[9px] font-bold">App ID: HD234</span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border-2 border-purple-300">
                                                    <div>
                                                        <p className="text-[11px] font-bold text-gray-900">ICICI Bank (Current)</p>
                                                        <p className="text-[10px] text-gray-600 font-medium">₹7,50,000 • Processing</p>
                                                    </div>
                                                    <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-[9px] font-bold">✓ Selected</span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <div>
                                                        <p className="text-[11px] font-bold text-gray-900">SBI</p>
                                                        <p className="text-[10px] text-gray-600 font-medium">₹7,50,000 • Pending</p>
                                                    </div>
                                                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[9px] font-bold">App ID: SB567</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : drawerTab === 'documents' ? (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="material-symbols-outlined text-purple-600 text-[20px]">description</span>
                                        <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-wide">Attached Documents</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { name: '10th Marksheet', status: 'verified', date: '2024-01-15' },
                                            { name: '12th Marksheet', status: 'verified', date: '2024-01-15' },
                                            { name: 'Passport/ID', status: 'verified', date: '2024-01-15' },
                                            { name: 'Bank Statements', status: 'pending', date: '2024-01-16' },
                                            { name: 'Income Certificate', status: 'rejected', date: '2024-01-16' },
                                        ].map((doc, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-gray-400 text-[20px]">article</span>
                                                    <div>
                                                        <p className="text-[12px] font-bold text-gray-900">{doc.name}</p>
                                                        <p className="text-[10px] text-gray-500 font-medium">{doc.date}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center px-2 py-1 text-[9px] font-bold uppercase rounded-full ${
                                                        doc.status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                                                        doc.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                        {doc.status === 'verified' && '✓ Verified'}
                                                        {doc.status === 'pending' && '⏳ Pending'}
                                                        {doc.status === 'rejected' && '✗ Rejected'}
                                                    </span>
                                                    <button className="p-2 text-gray-400 hover:text-purple-600 transition-all">
                                                        <span className="material-symbols-outlined">download</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : drawerTab === 'notes' ? (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="material-symbols-outlined text-purple-600 text-[20px]">note</span>
                                        <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-wide">Admin Notes</h3>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mb-4">
                                        <textarea placeholder="Add internal notes here..." rows={4} className="w-full px-4 py-3 bg-white border border-purple-100 rounded-lg text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-purple-600/10 focus:border-purple-600/30 transition-all resize-none" />
                                        <button className="mt-3 px-4 py-2 bg-purple-600 text-white text-[11px] font-bold rounded hover:bg-purple-700 transition-all">Save Note</button>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">Recent Notes</p>
                                        {[
                                            { author: 'Admin John', note: 'Applicant called to confirm address', date: '2 hours ago' },
                                            { author: 'Admin Sarah', note: 'Requested additional bank statements', date: '1 day ago' },
                                        ].map((item, i) => (
                                            <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <div className="flex items-start justify-between mb-2">
                                                    <p className="text-[12px] font-bold text-gray-900">{item.author}</p>
                                                    <p className="text-[10px] text-gray-500 font-medium">{item.date}</p>
                                                </div>
                                                <p className="text-[12px] text-gray-700">{item.note}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : drawerTab === 'history' ? (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="material-symbols-outlined text-purple-600 text-[20px]">timeline</span>
                                        <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-wide">Application Timeline</h3>
                                    </div>
                                    <div className="relative">
                                        {[
                                            { status: 'Application Submitted', date: '2024-01-10', time: '10:30 AM', icon: 'check' },
                                            { status: 'Documents Received', date: '2024-01-11', time: '02:15 PM', icon: 'description' },
                                            { status: 'AI Review Completed', date: '2024-01-12', time: '09:00 AM', icon: 'psychology' },
                                            { status: 'Pending Admin Review', date: '2024-01-13', time: 'In Progress', icon: 'hourglass_bottom' },
                                        ].map((item, i) => (
                                            <div key={i} className="flex gap-4 mb-6 last:mb-0 relative">
                                                <div className="relative z-10 flex flex-col items-center">
                                                    <div className="w-10 h-10 rounded-full bg-purple-100 border-2 border-purple-600 flex items-center justify-center text-purple-600">
                                                        <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                                                    </div>
                                                    {i < 3 && <div className="w-1 h-12 bg-purple-200 my-2" />}
                                                </div>
                                                <div className="pt-2">
                                                    <p className="text-[12px] font-bold text-gray-900">{item.status}</p>
                                                    <p className="text-[11px] text-gray-500 font-medium">{item.date} at {item.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {aiReviewLoading ? (
                                        <div className="flex flex-col items-center justify-center py-24 bg-purple-50 rounded-lg border border-dashed border-purple-200">
                                            <div className="w-12 h-12 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin mb-6" />
                                            <p className="text-[11px] font-black uppercase tracking-widest text-purple-400 animate-pulse">Running AI Analysis...</p>
                                        </div>
                                    ) : aiReview ? (
                                        <>
                                            <div className="p-6 rounded-lg bg-gradient-to-r from-purple-900 to-purple-800 text-white shadow-lg relative overflow-hidden">
                                                <div className="relative z-10">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-300 mb-1">AI Recommendation</p>
                                                            <h3 className="text-[16px] font-bold text-white">{aiReview.recommendation?.replace(/_/g, ' ').toUpperCase()}</h3>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[28px] font-bold leading-none tabular-nums">{aiReview.overallScore}%</p>
                                                            <p className="text-[9px] font-bold uppercase tracking-widest text-purple-300">Score</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-[12px] text-purple-100 font-medium">"{aiReview.aiSummary}"</p>
                                                </div>
                                                <span className="material-symbols-outlined absolute -right-4 top-1/2 -translate-y-1/2 text-[100px] text-white/5 pointer-events-none">psychology</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                                                    <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2">Risk Level</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2.5 h-2.5 rounded-full ${aiReview.creditAssessment?.riskLevel === 'low' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                        <span className="text-[12px] font-bold text-gray-900 uppercase">{aiReview.creditAssessment?.riskLevel}</span>
                                                    </div>
                                                </div>
                                                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                                                    <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2">Completeness</p>
                                                    <p className="text-[12px] font-bold text-gray-900">{aiReview.completenessCheck?.percentage || 85}% Verified</p>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-16">
                                            <button onClick={() => handleAIReview(selectedApp.id)} className="px-6 py-3 bg-purple-600 text-white text-[11px] font-bold rounded-lg hover:bg-purple-700 transition-all inline-flex items-center gap-2 shadow-md">
                                                <span className="material-symbols-outlined text-[16px]">psychology</span>
                                                Run AI Review
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 p-6 pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-purple-600 text-[18px]">gavel</span>
                                <h3 className="text-[12px] font-bold text-gray-900 uppercase tracking-wide">Admin Actions</h3>
                            </div>
                            <textarea value={actionRemarks} onChange={e => setActionRemarks(e.target.value)} placeholder="Add remarks or reason for this action..." rows={3} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-purple-600/10 focus:border-purple-600/30 transition-all mb-4 resize-none" />
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <button onClick={() => handleAppStatus(selectedApp.id, 'approved')} disabled={actionLoading} className="px-4 py-2.5 bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wide rounded-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                    {actionLoading ? "Approving..." : "Approve"}
                                </button>
                                <button onClick={() => handleAppStatus(selectedApp.id, 'rejected')} disabled={actionLoading} className="px-4 py-2.5 bg-red-600 text-white text-[11px] font-bold uppercase tracking-wide rounded-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                                    {actionLoading ? "Rejecting..." : "Reject"}
                                </button>
                            </div>
                            {selectedApp.status === 'approved' && (
                                <button className="w-full px-4 py-2.5 bg-purple-600 text-white text-[11px] font-bold uppercase tracking-wide rounded-lg hover:bg-purple-700 transition-all flex items-center justify-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                                    Disburse Funds
                                </button>
                            )}
                            <p className="text-[9px] text-gray-500 text-center font-bold uppercase tracking-tighter">
                                All decisions logged for audit compliance
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
                    <div className="relative w-full max-w-4xl glass-card bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
                        <div className="p-10 pb-6 border-b border-gray-100 shrink-0">
                            <h3 className="text-2xl font-black font-display text-gray-900 mb-2 flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#6605c7]">person_add</span>
                                Create Student Profile
                            </h3>
                            <p className="text-xs font-medium text-gray-500">Comprehensive student registration as per documentation standards.</p>
                        </div>

                        <div className="overflow-y-auto no-scrollbar p-10 pt-6 space-y-12">
                            <form id="student-creation-form" onSubmit={handleCreateUser} className="space-y-8">
                                <section>
                                    <div className="flex items-center gap-2 mb-6 text-indigo-600 font-bold text-xs uppercase tracking-widest">
                                        <span className="material-symbols-outlined text-lg">face</span>
                                        Basic Information
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">First Name*</label>
                                            <input required type="text" value={newUserQuery.firstName} onChange={e => setNewUserQuery({ ...newUserQuery, firstName: e.target.value })} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/10 transition-all font-medium" placeholder="E.g. Hari" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Last Name*</label>
                                            <input required type="text" value={newUserQuery.lastName} onChange={e => setNewUserQuery({ ...newUserQuery, lastName: e.target.value })} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/10 transition-all font-medium" placeholder="E.g. Kalyan" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Email Address*</label>
                                            <div className="relative">
                                                <input required type="email" value={newUserQuery.email} onChange={e => setNewUserQuery({ ...newUserQuery, email: e.target.value })} className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/10 transition-all font-medium" placeholder="example@gmail.com" />
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">mail</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Mobile Number*</label>
                                            <div className="relative">
                                                <input required type="tel" value={newUserQuery.mobile} onChange={e => setNewUserQuery({ ...newUserQuery, mobile: e.target.value })} className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/10 transition-all font-medium" placeholder="+91 0000000000" />
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">call</span>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Role Selection */}
                                <section>
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <label className="text-sm font-bold text-slate-700 mb-3 block">Functional Role Assignment</label>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                            {['user', 'staff', 'agent', 'bank', 'admin'].map(r => (
                                                <button
                                                    key={r}
                                                    type="button"
                                                    onClick={() => setNewUserQuery({ ...newUserQuery, role: r })}
                                                    className={`px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${newUserQuery.role === r ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'}`}
                                                >
                                                    {r}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            </form>
                        </div>

                        <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4 shrink-0">
                            <button type="button" onClick={() => setShowCreateUserModal(false)} className="flex-1 px-8 py-4 bg-white text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 border border-gray-200 transition-all">Cancel</button>
                            <button form="student-creation-form" type="submit" disabled={createUserLoading} className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 active:scale-95 transition-all">
                                {createUserLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Finalize Registration"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Edit User Modal ─────────────────────────────────────────── */}
            {editingUser && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setEditingUser(null)} />
                    <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[20px]">person_edit</span>
                                </div>
                                <div>
                                    <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Identity Modification</h3>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">Target: {editingUser.email}</p>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateUser} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">First Name</label>
                                        <input required type="text" value={editingUser.firstName} onChange={e => setEditingUser({ ...editingUser, firstName: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Last Name</label>
                                        <input required type="text" value={editingUser.lastName} onChange={e => setEditingUser({ ...editingUser, lastName: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Contact Interface</label>
                                    <input type="tel" value={editingUser.phoneNumber || editingUser.mobile || ""} onChange={e => setEditingUser({ ...editingUser, phoneNumber: e.target.value, mobile: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all" placeholder="+91 XXXX-XXXXXX" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Temporal Anchor (Birthdate)</label>
                                    <input type="text" placeholder="DD-MM-YYYY" value={editingUser.dateOfBirth || ""} onChange={e => setEditingUser({ ...editingUser, dateOfBirth: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all" />
                                </div>
                                <div className="pt-4 flex gap-4">
                                    <button type="button" onClick={() => setEditingUser(null)} className="flex-1 px-6 py-3 bg-slate-50 text-slate-400 rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 hover:text-slate-600 transition-all border border-slate-100">Cancel</button>
                                    <button type="submit" disabled={updateLoading} className="flex-[2] bg-slate-900 text-white py-3 rounded-lg font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 active:scale-95 transition-all">
                                        {updateLoading ? "SYNCING..." : "Commit Changes"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
                </div>

            </main>
        </div>
    );
}

// ─── Helper Components ───────────────────────────────────────────────────────

// This is a helper function defined outside the component to render detail rows in the drawer
// Move it to be accessible to the admin component
