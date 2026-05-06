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
    <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm group hover:border-indigo-200 transition-colors">
        <div className="flex justify-between items-start mb-3">
            <div className={`w-8 h-8 rounded bg-slate-50 flex items-center justify-center border border-slate-100 ${color.includes('text-') ? color : 'text-slate-600'}`}>
                <span className="material-symbols-outlined text-[16px]">{icon}</span>
            </div>
            {trend !== undefined && !loading && (
                <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${trend >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    <span className="material-symbols-outlined text-[12px]">{trend >= 0 ? 'trending_up' : 'trending_down'}</span>
                    {Math.abs(trend)}%
                </span>
            )}
        </div>
        <div>
            <p className="text-slate-500 text-[11px] font-medium mb-0.5">{label}</p>
            <div className="text-[20px] font-semibold text-slate-900 tracking-tight">
                {loading ? <span className="h-6 bg-slate-100 animate-pulse rounded block w-16" /> : value ?? "—"}
            </div>
        </div>
    </div>
);

const NavItem = ({ section, active, icon, label, badge, onClick }: any) => (
    <button
        onClick={() => onClick(section)}
        className={`w-full text-left px-3 py-1.5 rounded flex items-center gap-3 transition-colors text-xs font-medium ${active === section ? "bg-indigo-500/10 text-indigo-400" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
    >
        <span className={`material-symbols-outlined text-[16px] ${active === section ? "text-indigo-400" : "text-slate-500"}`}>{icon}</span>
        <span className="flex-1">{label}</span>
        {badge > 0 && (
            <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-medium ${active === section ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                {badge}
            </span>
        )}
    </button>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
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



// ─── Announcement Banner ──────────────────────────────────────────────────────
const AnnouncementItem = ({ ann, onDelete }: { ann: any; onDelete: (id: string) => void }) => (
    <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-200 shadow-sm transition-all group">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${ann.type === 'warning' ? 'bg-amber-50 text-amber-600' : ann.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
            <span className="material-symbols-outlined text-[16px]">
                {ann.type === 'warning' ? 'warning' : ann.type === 'error' ? 'error' : 'info'}
            </span>
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-slate-900 leading-tight">{ann.title}</p>
                <span className="text-[10px] text-slate-400 border border-slate-100 px-1.5 py-0.5 rounded bg-slate-50 whitespace-nowrap">{formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true })}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{ann.message}</p>
            <div className="flex items-center justify-between mt-2">
                <span className={`text-[9px] font-medium px-2 py-0.5 rounded ${ann.target === 'all' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                    Target: {ann.target === 'all' ? 'System-wide' : ann.target}
                </span>
                <button onClick={() => onDelete(ann.id)} className="opacity-0 group-hover:opacity-100 p-1 text-rose-400 hover:text-rose-600 rounded transition-all">
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                </button>
            </div>
        </div>
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

    // User Profile Modal State
    const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);
    const [userLoans, setUserLoans] = useState<any[]>([]);
    const [userCredentials, setUserCredentials] = useState<any>(null);
    const [userProfileLoading, setUserProfileLoading] = useState(false);
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

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
            // Refresh applications every 15 seconds for real-time updates
            if (autoRefreshEnabled) {
                autoRefreshInterval.current = setInterval(() => {
                    loadData();
                    setLastRefresh(new Date());
                }, 15000);
            }
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
    }, [activeSection, loadOverview, loadData, loadCommunityData, stats.userCount, autoRefreshEnabled]);

    // Initial load of community data
    useEffect(() => {
        if (activeSection === "community") {
            loadCommunityData();
        }
    }, [activeSection, loadCommunityData]);

    // ─── Handlers ──────────────────────────────────────────────────────────────

    // Handler to view user credentials and all their loans
    const handleViewUserProfile = useCallback(async (applicant: any) => {
        setUserProfileLoading(true);
        try {
            // Fetch user details
            const userRes: any = await adminApi.getUsers().catch(() => ({ data: [] }));
            const selectedUser = (userRes.data || []).find((u: any) => u.email === applicant.email);
            
            // Fetch all applications for this user
            const appsRes: any = await adminApi.getApplications({ search: applicant.email }).catch(() => ({ data: [] }));
            
            setSelectedUserProfile(selectedUser || applicant);
            setUserCredentials(selectedUser);
            setUserLoans(appsRes.data || []);
        } catch (e) {
            console.error('Error loading user profile:', e);
        } finally {
            setUserProfileLoading(false);
        }
    }, []);

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

    const handleDeleteUser = async (userId: string, userName: string) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`);
        if (!confirmDelete) return;

        try {
            await adminApi.deleteUser(userId);
            alert("User deleted successfully.");
            loadData();
        } catch (e: any) {
            alert("Failed to delete user: " + e.message);
        }
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

        if (activeSection === 'users') {
            if (roleFilter !== 'all') {
                passesRole = item.role === roleFilter;
            }
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
        <div className="h-screen overflow-hidden flex bg-slate-50 text-slate-900 font-sans text-sm selection:bg-indigo-100 selection:text-indigo-900">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-[240px] bg-[#0f172a] text-slate-300 transform transition-transform duration-200 lg:translate-x-0 border-r border-slate-800 flex flex-col shadow-xl ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="h-14 px-4 flex items-center border-b border-slate-800 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-indigo-500 flex items-center justify-center text-white shadow-sm">
                            <span className="material-symbols-outlined text-[16px]">layers</span>
                        </div>
                        <span className="font-semibold text-[13px] text-white tracking-wide">Admin<span className="text-indigo-400">Portal</span></span>
                    </div>
                </div>

                <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
                    <div className="px-3 mb-2 mt-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest leading-none">Menu</div>
                    {navItems.map(item => (
                        <NavItem key={item.section} {...item} active={activeSection} onClick={setActiveSection} />
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex-shrink-0">
                    <div className="flex items-center gap-3 mb-3 p-1">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="Avatar" className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 object-cover" />
                        <div className="min-w-0">
                            <p className="text-[12px] font-medium text-slate-200 truncate">{user?.firstName || 'Admin'}</p>
                            <p className="text-[10px] text-slate-500 capitalize truncate">{user?.role?.replace('_', ' ')}</p>
                        </div>
                    </div>
                    <button onClick={logout} className="w-full px-3 py-2 rounded bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 text-slate-300 border border-slate-700 hover:border-rose-500/30 transition-all text-[11px] font-semibold flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">logout</span>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden lg:ml-[240px] bg-slate-50 rounded-tl-xl border-l border-t border-slate-200/60 shadow-inner mt-2 lg:mt-0 lg:rounded-none lg:border-none lg:shadow-none">
                {/* Header */}
                <header className="h-14 bg-white border-b border-slate-200 px-5 flex justify-between items-center sticky top-0 z-40 flex-shrink-0 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-all">
                            <span className="material-symbols-outlined text-[20px]">menu</span>
                        </button>
                        <h1 className="text-[14px] font-semibold text-slate-800 flex items-center gap-2">
                            {sectionTitles[activeSection] || activeSection}
                            <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 tracking-wide">Live</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative hidden md:block">
                            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-[12px] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-56 transition-all text-slate-700 placeholder:text-slate-400"
                            />
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setNotifOpen(!notifOpen)}
                                className="relative p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-all flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined text-[18px]">notifications</span>
                                {pendingCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border-2 border-white shadow-sm" />}
                            </button>
                            {notifOpen && (
                                <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-lg shadow-lg shadow-slate-200/50 border border-slate-200 z-50 overflow-hidden py-1">
                                    <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/80"><h4 className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">Notifications</h4></div>
                                    {pendingCount > 0 ? (
                                        <button className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-all flex items-start gap-3 border-b border-slate-50">
                                            <div className="w-8 h-8 rounded bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5 border border-amber-100"><span className="material-symbols-outlined text-[16px]">assignment</span></div>
                                            <div><p className="text-[12px] font-semibold text-slate-800">{pendingCount} Pending Applications</p><p className="text-[11px] text-slate-500 mt-0.5">Awaiting review</p></div>
                                        </button>
                                    ) : <div className="p-6 text-center text-slate-400 bg-white"><span className="material-symbols-outlined text-2xl mb-1 text-slate-300">task_alt</span><p className="text-[11px]">All caught up</p></div>}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="p-6 lg:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
                    {activeSection === "overview" && (
                        <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 tracking-tight">System Matrix</h2>
                                    <p className="text-slate-500 text-[11px] mt-1 font-medium flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                        Synced: {format(new Date(), 'MMM do, yyyy')}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setShowCreateUserModal(true)} className="px-3 py-1.5 rounded bg-white border border-slate-200 text-slate-700 font-medium text-[11px] hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-1.5 shadow-sm">
                                        <span className="material-symbols-outlined text-[16px]">person_add</span> User Node
                                    </button>
                                    <Link href="/admin/blogs/create" className="px-3 py-1.5 bg-indigo-600 text-white rounded text-[11px] font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[16px]">add</span> Post
                                    </Link>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard label="Capital Portfolio" value={`₹${(stats.totalAmount || 0).toLocaleString('en-IN')}`} icon="account_balance_wallet" color="text-indigo-600" loading={loading} trend={12} />
                                <StatCard label="Disbursed Pulse" value={`₹${(stats.disbursedAmount || 0).toLocaleString('en-IN')}`} icon="electric_bolt" color="text-emerald-600" loading={loading} trend={-5} />
                                <StatCard label="Active Transmission" value={stats.appCount || 0} icon="receipt_long" color="text-amber-600" loading={loading} trend={8} />
                                <StatCard label="Total Nodes" value={stats.userCount || 0} icon="public" color="text-blue-600" loading={loading} trend={24} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard
                                    label="Avg Unit Size"
                                    value={`₹${Math.round((stats.totalAmount || 0) / (stats.appCount || 1)).toLocaleString('en-IN')}`}
                                    icon="analytics"
                                    color="text-indigo-600"
                                    loading={loading}
                                />
                                <StatCard
                                    label="Conversion Rate"
                                    value={`${Math.round(((stats.disbursedCount || 0) / (stats.appCount || 1)) * 100)}%`}
                                    icon="trending_up"
                                    color="text-emerald-600"
                                    loading={loading}
                                />
                                <StatCard label="Protocol Managers" value={stats.staffCount} icon="badge" color="text-slate-600" loading={loading} />
                                <StatCard label="Banking Partners" value={stats.bankCount} icon="account_balance" color="text-slate-600" loading={loading} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Recent Activity */}
                                <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                    <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50 text-[12px]">
                                        <div>
                                            <h3 className="font-semibold text-slate-900 tracking-wide text-sm">System Audit Log</h3>
                                        </div>
                                        <button onClick={loadOverview} className="p-1 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded shadow-sm transition-colors">
                                            <span className="material-symbols-outlined text-[14px]">refresh</span>
                                        </button>
                                    </div>
                                    <div className="p-0 flex-1 overflow-y-auto max-h-[360px] custom-scrollbar">
                                        <table className="w-full text-left border-collapse">
                                            <tbody className="divide-y divide-slate-100">
                                                {auditLogs.length > 0 ? auditLogs.map((log: any, i: number) => (
                                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-4 py-2.5 w-10">
                                                            <div className={`w-6 h-6 rounded flex items-center justify-center text-white ${log.action === 'update' ? 'bg-blue-500' : log.action === 'create' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                                                <span className="material-symbols-outlined text-[12px]">
                                                                    {log.action === 'update' ? 'edit' : log.action === 'create' ? 'add' : 'delete'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <p className="font-medium text-slate-800 text-[12px] capitalize leading-snug">{log.action} {log.entityType}</p>
                                                            <p className="text-[10px] text-slate-500 leading-snug mt-0.5">By <span className="font-medium text-slate-600">{log.initiator?.firstName || 'System'}</span></p>
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <div className="bg-slate-100/60 rounded px-1.5 py-0.5 text-[9px] font-mono text-slate-600 border border-slate-200/60 inline-block w-20 truncate">
                                                                {log.entityId}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={4} className="text-center py-10 text-slate-400">
                                                            <span className="material-symbols-outlined text-3xl mb-2 opacity-30">history</span>
                                                            <p className="text-xs">No activity detected</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Quick Actions */}
                                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden p-4">
                                        <h3 className="text-xs font-semibold text-slate-900 mb-3 ml-1">Direct Commands</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { href: '/admin/blogs/create', label: 'Write Post', icon: 'post_add' },
                                                { section: 'users', label: 'Users', icon: 'people' },
                                                { section: 'applications', label: 'Review Apps', icon: 'receipt_long' },
                                                { section: 'system', label: 'Settings', icon: 'settings' },
                                            ].map((action, i) => (
                                                action.href ? (
                                                    <Link key={i} href={action.href} className="p-3 rounded border border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-200 transition-colors flex flex-col gap-2 items-start justify-center group">
                                                        <span className={`material-symbols-outlined text-[18px] text-indigo-500`}>{action.icon}</span>
                                                        <h4 className="text-[11px] font-medium text-slate-700">{action.label}</h4>
                                                    </Link>
                                                ) : (
                                                    <button key={i} onClick={() => setActiveSection(action.section!)} className="p-3 rounded border border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-200 transition-colors flex flex-col gap-2 items-start justify-center group text-left">
                                                        <span className={`material-symbols-outlined text-[18px] text-indigo-500`}>{action.icon}</span>
                                                        <h4 className="text-[11px] font-medium text-slate-700">{action.label}</h4>
                                                    </button>
                                                )
                                            ))}
                                        </div>
                                    </div>

                                    {/* System Health */}
                                    <div className="bg-slate-900 rounded-lg p-5 text-white shadow-sm overflow-hidden relative border border-slate-800">
                                        <div className="relative z-10">
                                            <h3 className="text-xs font-semibold mb-3 tracking-wide rounded">System Status</h3>
                                            <div className="space-y-0.5 mt-2 bg-slate-800/50 rounded-lg border border-slate-700/50 p-2">
                                                <HealthDot ok={true} label="API Core" />
                                                <HealthDot ok={true} label="Database" />
                                                <HealthDot ok={true} label="Auth Node" />
                                                <HealthDot ok={!maintenanceMode} label="Public API" />
                                            </div>
                                            <div className="flex items-center gap-2 mt-4 ml-1">
                                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                <span className="text-[9px] font-medium tracking-widest uppercase text-slate-300">Operational</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === "analytics" && (
                        <div className="space-y-8 animate-fade-in max-w-[1400px] mx-auto">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Performance Matrix</h2>
                                    <p className="text-slate-500 text-[11px] mt-1 font-medium flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[14px]">analytics</span>
                                        Real-time insights across the platform ecosystem
                                    </p>
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
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-lg" />)}
                                </div>
                            ) : (
                                <>
                                    {/* Key Performance Metrics */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm relative overflow-hidden group">
                                            <p className="text-[11px] font-medium text-slate-500 mb-0.5">Total Loan Value</p>
                                            <p className="text-[20px] font-semibold text-slate-900 tracking-tight">₹{(analyticsData.appStats?.totalAmount || 0).toLocaleString('en-IN')}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">Across all applications</p>
                                        </div>
                                        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm relative overflow-hidden group">
                                            <p className="text-[11px] font-medium text-slate-500 mb-0.5">Disbursed Amount</p>
                                            <p className="text-[20px] font-semibold text-slate-900 tracking-tight">₹{(analyticsData.appStats?.disbursedAmount || 0).toLocaleString('en-IN')}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">{analyticsData.appStats?.total ? Math.round(((analyticsData.appStats?.disbursedAmount || 0) / (analyticsData.appStats?.totalAmount || 1)) * 100) : 0}% of total</p>
                                        </div>
                                        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm relative overflow-hidden group">
                                            <p className="text-[11px] font-medium text-slate-500 mb-0.5">Approval Rate</p>
                                            <p className="text-[20px] font-semibold text-slate-900 tracking-tight">{analyticsData.appStats?.total ? Math.round(((analyticsData.appStats?.approved || 0 + analyticsData.appStats?.disbursed || 0) / analyticsData.appStats?.total) * 100) : 0}%</p>
                                            <p className="text-[10px] text-slate-400 mt-1">{(analyticsData.appStats?.approved || 0) + (analyticsData.appStats?.disbursed || 0)} approved</p>
                                        </div>
                                        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm relative overflow-hidden group">
                                            <p className="text-[11px] font-medium text-slate-500 mb-0.5">Pending Review</p>
                                            <p className="text-[20px] font-semibold text-slate-900 tracking-tight">{analyticsData.appStats?.pending || 0}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">{analyticsData.appStats?.total ? Math.round(((analyticsData.appStats?.pending || 0) / analyticsData.appStats?.total) * 100) : 0}% of pipeline</p>
                                        </div>
                                    </div>

                                    {/* Application status breakdown */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm lg:col-span-2">
                                            <h3 className="text-sm font-semibold text-slate-900 mb-1">Application Distribution</h3>
                                            <p className="text-[11px] text-slate-500 mb-5">Global processing statistics</p>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {[
                                                    { label: 'Pending', value: analyticsData.appStats?.pending || 0, color: 'bg-amber-400', style: 'bg-amber-50 border-amber-100 text-amber-700' },
                                                    { label: 'Processing', value: analyticsData.appStats?.processing || 0, color: 'bg-blue-400', style: 'bg-blue-50 border-blue-100 text-blue-700' },
                                                    { label: 'Approved', value: analyticsData.appStats?.approved || 0, color: 'bg-emerald-400', style: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
                                                    { label: 'Rejected', value: analyticsData.appStats?.rejected || 0, color: 'bg-rose-400', style: 'bg-rose-50 border-rose-100 text-rose-700' },
                                                    { label: 'Disbursed', value: analyticsData.appStats?.disbursed || 0, color: 'bg-slate-600', style: 'bg-slate-50 border-slate-200 text-slate-700' },
                                                    { label: 'Total', value: analyticsData.appStats?.total || 0, color: 'bg-indigo-400', style: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
                                                ].map((item, i) => {
                                                    const percentage = analyticsData.appStats?.total ? Math.round((item.value / analyticsData.appStats?.total) * 100) : 0;
                                                    return (
                                                        <div key={i} className={`p-3 rounded border flex flex-col gap-1 ${item.style}`}>
                                                            <div className={`w-4 h-1 rounded flex-shrink-0 ${item.color}`} />
                                                            <p className="text-xl font-semibold leading-none mt-1">{item.value}</p>
                                                            <p className="text-[10px] font-medium uppercase tracking-wider opacity-80">{item.label}</p>
                                                            {item.label !== 'Total' && <p className="text-[9px] font-medium opacity-70">{percentage}%</p>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* User role donut */}
                                        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                                            <h3 className="text-sm font-semibold text-slate-900 mb-1">User Segmentation</h3>
                                            <p className="text-[11px] text-slate-500 mb-5">By assigned personnel role</p>
                                            <DonutChart segments={[
                                                { label: 'Students', value: analyticsData.usersByRole?.student || 0, color: '#3b82f6' },
                                                { label: 'Staff', value: analyticsData.usersByRole?.staff || 0, color: '#6366f1' },
                                                { label: 'Bank', value: analyticsData.usersByRole?.bank || 0, color: '#10b981' },
                                                { label: 'Agent', value: analyticsData.usersByRole?.agent || 0, color: '#f59e0b' },
                                                { label: 'Admin', value: analyticsData.usersByRole?.admin || 0, color: '#0f172a' },
                                            ]} />
                                            <div className="mt-4 space-y-1.5 text-[11px] font-medium text-slate-600">
                                                <div className="flex justify-between">
                                                    <span>Students:</span> <span>{analyticsData.usersByRole?.student || 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Staff:</span> <span>{analyticsData.usersByRole?.staff || 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Banks:</span> <span>{analyticsData.usersByRole?.bank || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* User growth mini chart */}
                                    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-900">Platform Overview</h3>
                                                <p className="text-[11px] text-slate-500 mt-1">Key metrics snapshot - Last updated {lastRefresh.toLocaleTimeString('en-IN')}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                            <div className="p-3 bg-slate-50 rounded border border-slate-100">
                                                <p className="text-[10px] font-medium text-slate-500 uppercase mb-0.5">Total Users</p>
                                                <p className="text-lg font-semibold text-slate-900">{(analyticsData.usersByRole?.student || 0) + (analyticsData.usersByRole?.staff || 0) + (analyticsData.usersByRole?.bank || 0) + (analyticsData.usersByRole?.agent || 0) + (analyticsData.usersByRole?.admin || 0)}</p>
                                            </div>
                                            <div className="p-3 bg-indigo-50 rounded border border-indigo-100">
                                                <p className="text-[10px] font-medium text-indigo-600 uppercase mb-0.5">Active Apps</p>
                                                <p className="text-lg font-semibold text-indigo-700">{analyticsData.appStats?.total || 0}</p>
                                            </div>
                                            <div className="p-3 bg-emerald-50 rounded border border-emerald-100">
                                                <p className="text-[10px] font-medium text-emerald-600 uppercase mb-0.5">Successful</p>
                                                <p className="text-lg font-semibold text-emerald-700">{(analyticsData.appStats?.disbursed || 0)}</p>
                                            </div>
                                            <div className="p-3 bg-amber-50 rounded border border-amber-100">
                                                <p className="text-[10px] font-medium text-amber-600 uppercase mb-0.5">In Review</p>
                                                <p className="text-lg font-semibold text-amber-700">{(analyticsData.appStats?.processing || 0) + (analyticsData.appStats?.pending || 0)}</p>
                                            </div>
                                            <div className="p-3 bg-blue-50 rounded border border-blue-100">
                                                <p className="text-[10px] font-medium text-blue-600 uppercase mb-0.5">Avg Loan</p>
                                                <p className="text-lg font-semibold text-blue-700">₹{analyticsData.appStats?.total ? Math.round((analyticsData.appStats?.totalAmount || 0) / analyticsData.appStats?.total / 100000) * 100000 : 0}</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* ─── PORTAL CONTROL CENTER ────────────────────────────────── */}

                    {/* ─── SYSTEM CONTROL ───────────────────────────────────────── */}
                    {activeSection === "system" && (
                        <div className="space-y-6 animate-fade-in max-w-[1400px] mx-auto">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 tracking-tight">System Control Domain</h2>
                                    <p className="text-slate-500 text-[11px] mt-1 font-medium flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[14px]">settings</span>
                                        Platform-wide node controls and broadcasts
                                    </p>
                                </div>
                                <div className={`px-2.5 py-1 rounded border flex items-center gap-1.5 ${maintenanceMode ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${maintenanceMode ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`}></span>
                                    <span className="text-[10px] font-semibold uppercase tracking-wider">{maintenanceMode ? 'Maintenance Mode' : 'System Live'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Maintenance & Feature Flags */}
                                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-5">
                                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[16px] text-slate-400">tune</span>
                                        Platform Logic
                                    </h3>

                                    <div className="space-y-3">
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
                                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100 hover:border-slate-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm`}>
                                                    <span className="material-symbols-outlined text-[16px]">{feature.icon}</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-900 leading-tight">{feature.label}</p>
                                                    <p className="text-[10px] text-slate-500 mt-0.5">{feature.description}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={feature.toggle}
                                                className={`relative inline-flex w-8 h-4 rounded-full transition-colors ${feature.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                            >
                                                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${feature.active ? 'translate-x-4.5' : 'translate-x-0.5'}`} style={{ transform: feature.active ? 'translateX(16px)' : 'translateX(2px)' }} />
                                            </button>
                                        </div>
                                    ))}
                                    </div>
                                </div>

                                {/* Announcements */}
                                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col">
                                    <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[16px] text-slate-400">campaign</span>
                                        System Broadcasts
                                    </h3>

                                    <div className="space-y-3 mb-6">
                                        <input
                                            type="text"
                                            value={newAnnouncement.title}
                                            onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                            placeholder="Announcement title..."
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                        />
                                        <textarea
                                            value={newAnnouncement.message}
                                            onChange={e => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                                            placeholder="Detailed messaging..."
                                            rows={2}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <select
                                                value={newAnnouncement.type}
                                                onChange={e => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })}
                                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                            >
                                                <option value="info">ℹ Standard</option>
                                                <option value="warning">⚠ Caution</option>
                                                <option value="error">🔴 Critical</option>
                                            </select>
                                            <select
                                                value={newAnnouncement.target}
                                                onChange={e => setNewAnnouncement({ ...newAnnouncement, target: e.target.value })}
                                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
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
                                            className="w-full bg-slate-900 text-white py-2.5 rounded text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">send</span>
                                            Publish Broadcast
                                        </button>
                                    </div>

                                    <div className="space-y-2 flex-1 overflow-y-auto min-h-[160px] custom-scrollbar">
                                        {announcements.length === 0 ? (
                                            <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded bg-slate-50">
                                                <span className="material-symbols-outlined text-2xl block mb-1 opacity-50">notifications_none</span>
                                                <p className="text-[10px] font-medium uppercase tracking-wider">No active broadcasts</p>
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
                        <div className="space-y-6 animate-fade-in max-w-[1400px] mx-auto">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 tracking-tight">System Audit Catalog</h2>
                                    <p className="text-slate-500 text-[11px] mt-1 font-medium flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[14px]">history</span>
                                        Complete ledger of authenticated node operations
                                    </p>
                                </div>
                                <div className="flex gap-2 flex-wrap text-sm">
                                    {['all', 'create', 'update', 'delete'].map(f => (
                                        <button
                                            key={f}
                                            onClick={() => { setAuditFilter(f); setAuditPage(1); }}
                                            className={`px-3 py-1.5 rounded transition-colors text-xs font-medium border ${auditFilter === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            {f.charAt(0).toUpperCase() + f.slice(1)}
                                        </button>
                                    ))}
                                    <button onClick={loadData} className="ml-1 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors bg-white border border-slate-200 rounded shadow-sm">
                                        <span className="material-symbols-outlined text-[16px]">refresh</span>
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <TableHeader>
                                            <th className="px-4 py-3">Timestamp</th>
                                            <th className="px-4 py-3">Operation</th>
                                            <th className="px-4 py-3">Context</th>
                                            <th className="px-4 py-3">Entity Ref</th>
                                            <th className="px-4 py-3">Initiator</th>
                                        </TableHeader>
                                        <tbody className="divide-y divide-slate-100">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                                                        <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-2" />
                                                        <span className="text-[11px] font-medium">Loading...</span>
                                                    </td>
                                                </tr>
                                            ) : pagedAuditLogs.length > 0 ? pagedAuditLogs.map((log: any, i: number) => (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors text-xs">
                                                    <td className="px-4 py-3 text-slate-500 tabular-nums">
                                                        {format(new Date(log.createdAt), 'MMM d, yyyy · HH:mm')}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${log.action === 'create' ? 'bg-emerald-50 text-emerald-700' : log.action === 'delete' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-slate-700 font-medium capitalize text-[11px] bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                                                            {log.entityType}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <code className="text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                                            {log.entityId?.substring(0, 12)}
                                                        </code>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs font-medium text-slate-900">{log.initiator?.firstName || 'System'}</span>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400 text-xs">No matching events</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {filteredAuditLogs.length > 20 && (
                                    <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                                            {Math.min((auditPage - 1) * 20 + 1, filteredAuditLogs.length)}—{Math.min(auditPage * 20, filteredAuditLogs.length)} of {filteredAuditLogs.length}
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                                                disabled={auditPage === 1}
                                                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded text-[11px] font-medium disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() => setAuditPage(p => Math.min(Math.ceil(filteredAuditLogs.length / 20), p + 1))}
                                                disabled={auditPage >= Math.ceil(filteredAuditLogs.length / 20)}
                                                className="px-3 py-1.5 bg-slate-900 text-white rounded text-[11px] font-medium disabled:opacity-50 hover:bg-slate-800 transition-colors shadow-sm"
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
                        <div className="space-y-6 animate-fade-in max-w-[1400px] mx-auto">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Communication Dispatch</h2>
                                    <p className="text-slate-500 text-[11px] mt-1 font-medium flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[14px]">send</span>
                                        System-wide broadcast and direct relay node
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                                    <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[16px] text-slate-400">send</span>
                                        Compose Broadcast
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex gap-1 p-1 bg-slate-100 rounded w-fit mb-2">
                                            <button
                                                onClick={() => setEmailData({ ...emailData, isBulk: false })}
                                                className={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${!emailData.isBulk ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                Direct Message
                                            </button>
                                            <button
                                                onClick={() => setEmailData({ ...emailData, isBulk: true })}
                                                className={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${emailData.isBulk ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                Bulk Email
                                            </button>
                                        </div>

                                        {!emailData.isBulk ? (
                                            <div>
                                                <label className="text-[11px] font-medium text-slate-600 mb-1.5 block">Recipient Address</label>
                                                <input type="email" value={emailData.to} onChange={e => setEmailData({ ...emailData, to: e.target.value })} placeholder="Enter email address..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors" />
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="text-[11px] font-medium text-slate-600 mb-1.5 block">Target Audience</label>
                                                <select value={emailData.role} onChange={e => setEmailData({ ...emailData, role: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors">
                                                    <option value="user">Students (Verified)</option>
                                                    <option value="staff">Internal Team</option>
                                                    <option value="agent">Processing Agents</option>
                                                    <option value="bank">Banking Entities</option>
                                                </select>
                                            </div>
                                        )}

                                        <div className="p-3 rounded border border-indigo-100 bg-indigo-50/50 flex flex-col gap-1.5 mb-2">
                                            <label className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wider">Master Templates</label>
                                            <select 
                                                value={selectedTemplate}
                                                onChange={(e) => handleApplyTemplate(e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-indigo-200 rounded text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-colors cursor-pointer"
                                            >
                                                <option value="empty">-- Blank Message --</option>
                                                <option value="status_update">Status Progression Update</option>
                                                <option value="action_required">Action Required: Verify Documents</option>
                                                <option value="welcome_board">Welcome to VidhyaLoan</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-medium text-slate-600 mb-1.5 block">Subject Line</label>
                                            <input type="text" value={emailData.subject} onChange={e => setEmailData({ ...emailData, subject: e.target.value })} placeholder="Subject..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors text-slate-900" />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-medium text-slate-600 mb-1.5 block">Message Body</label>
                                            <textarea value={emailData.content} onChange={e => setEmailData({ ...emailData, content: e.target.value })} placeholder="Type message..." rows={5} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors resize-none text-slate-700" />
                                        </div>
                                        <button
                                            onClick={handleSendEmail}
                                            disabled={emailLoading}
                                            className="w-full bg-slate-900 text-white py-2.5 rounded text-xs font-semibold flex items-center justify-center gap-2 mt-2 hover:bg-slate-800 transition-colors shadow-sm"
                                        >
                                            {emailLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : (<><span className="material-symbols-outlined text-[14px]">send</span> Transmit Message</>)}
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                                    <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[16px] text-slate-400">query_stats</span>
                                        Node Distribution
                                    </h3>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Students', count: stats.userCount || 0, icon: 'person', color: 'text-slate-500' },
                                            { label: 'Banks', count: stats.bankCount || 0, icon: 'account_balance', color: 'text-slate-500' },
                                            { label: 'Agents', count: stats.agentCount || 0, icon: 'support_agent', color: 'text-slate-500' },
                                            { label: 'Staff', count: stats.staffCount || 0, icon: 'badge', color: 'text-slate-500' }
                                        ].map((group, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100 hover:border-slate-200 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center ${group.color} shadow-sm`}>
                                                        <span className="material-symbols-outlined text-[16px]">{group.icon}</span>
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-700">{group.label}</span>
                                                </div>
                                                <span className="text-sm font-semibold text-slate-900 tabular-nums">{group.count}</span>
                                            </div>
                                        ))}
                                        <div className="p-4 bg-slate-900 rounded border border-slate-800 mt-6">
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Network Security</p>
                                            <p className="text-[11px] text-slate-300">All outbound communications are signed via industrial SMTP relays to ensure high inbox placement.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── COMMUNITY FORUM MANAGEMENT ────────────────────────── */}
                    {activeSection === "community" && (
                        <div className="space-y-6 animate-fade-in max-w-[1400px] mx-auto">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Community Governance</h2>
                                    <p className="text-slate-500 text-[11px] mt-1 font-medium flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[14px]">forum</span>
                                        Mentorship oversight and resource distribution
                                    </p>
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
                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px] text-slate-400">workspace_premium</span>
                                            Mentorship Council
                                        </h3>
                                        <p className="text-[11px] text-slate-500 mt-1">{mentors.length} specialists actively broadcasting guidance</p>
                                    </div>
                                    <button className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 transition-colors shadow-sm">
                                        <span className="material-symbols-outlined text-[14px]">person_add</span>
                                        Onboard Specialist
                                    </button>
                                </div>

                                {mentors.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {mentors.map((mentor: any, i: number) => (
                                            <div key={i} className="p-4 rounded border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors group relative overflow-hidden">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <div className="w-10 h-10 rounded overflow-hidden border border-slate-200 bg-white flex-shrink-0 shadow-sm">
                                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.email || mentor.id}`} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold text-slate-900 truncate tracking-tight">{mentor.name || `${mentor.firstName} ${mentor.lastName}`}</p>
                                                            <p className="text-[10px] text-slate-500 truncate">{mentor.expertise || 'General Specialist'}</p>
                                                        </div>
                                                    </div>
                                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-semibold uppercase tracking-wider rounded border border-emerald-100">Live</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 mb-4">
                                                    <div className="p-2 bg-white border border-slate-100 rounded">
                                                        <p className="text-[9px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">Mentees</p>
                                                        <p className="text-[12px] font-semibold text-slate-900">{mentor.menteeCount || '15+'}</p>
                                                    </div>
                                                    <div className="p-2 bg-white border border-slate-100 rounded">
                                                        <p className="text-[9px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">Rating</p>
                                                        <p className="text-[12px] font-semibold text-slate-900">{mentor.rating || '4.9'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="flex-1 px-2 py-1.5 rounded bg-white hover:bg-slate-50 text-[10px] font-medium text-slate-600 transition-colors border border-slate-200 shadow-sm">Profile</button>
                                                    <button className="flex-1 px-2 py-1.5 rounded text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-[10px] font-medium transition-colors border border-transparent">Revoke</button>
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
                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px] text-slate-400">forum</span>
                                            Recent Social Broadcasts
                                        </h3>
                                        <p className="text-[11px] text-slate-500 mt-1">Live monitoring of community interaction layers</p>
                                    </div>
                                    <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded border border-slate-100">
                                        <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wider tabular-nums">Sync: {lastRefresh.toLocaleTimeString()}</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    </div>
                                </div>

                                {filteredData.length > 0 ? (
                                    <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                                        {filteredData.slice(0, 10).map((post: any, i: number) => (
                                            <div key={i} className="p-4 rounded border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-colors group">
                                                <div className="flex items-start justify-between gap-4 mb-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug">{post.title}</p>
                                                        <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
                                                            <span className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center text-[9px] font-semibold text-slate-600">
                                                                {(post.author?.firstName || post.authorName || 'U')[0]}
                                                            </span>
                                                            Broadcast by <span className="font-semibold">{post.author?.firstName || post.authorName}</span>
                                                        </p>
                                                    </div>
                                                    <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border flex-shrink-0 ${post.isPinned ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                        {post.isPinned ? 'Anchor' : 'Relay'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-[10px] font-medium text-slate-400 mb-3 tabular-nums">
                                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">favorite</span> {post.likesCount || 0}</span>
                                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">chat_bubble</span> {post.comments?.length || 0}</span>
                                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">visibility</span> {post.views || 0}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="px-3 py-1.5 rounded bg-white border border-slate-200 hover:bg-slate-50 text-[10px] font-medium text-slate-600 transition-colors shadow-sm">Pin to Top</button>
                                                    <button className="px-3 py-1.5 rounded bg-white border border-rose-100 text-rose-600 hover:bg-rose-50 text-[10px] font-medium transition-colors shadow-sm">Moderate</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded">
                                        <span className="material-symbols-outlined text-3xl text-slate-300 block mb-2">forum</span>
                                        <p className="text-[11px] font-medium text-slate-500">No active forum discussions detected</p>
                                    </div>
                                )}
                            </div>

                            {/* Community Resources Section */}
                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[16px] text-slate-400">library_books</span>
                                        Asset Repository
                                    </h3>
                                    <p className="text-[11px] text-slate-500 mt-1">Managed literature and instructional documentation</p>
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
                                        <div key={i} className="p-4 rounded border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-colors group">
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="w-8 h-8 rounded bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0 group-hover:text-slate-900 transition-colors">
                                                    <span className="material-symbols-outlined text-[16px]">{resource.icon}</span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider leading-none mb-1">{resource.type}</p>
                                                    <p className="text-xs font-semibold text-slate-900 leading-snug">{resource.title}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 mb-4 tabular-nums">
                                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">download</span> {resource.downloads} Units</span>
                                                <span className="text-amber-600 flex items-center gap-1">★ {resource.rating}</span>
                                            </div>
                                            <button className="w-full px-3 py-1.5 rounded bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold hover:bg-slate-50 transition-colors shadow-sm">Access File</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── USERS MANAGEMENT DASHBOARD ──────────────────────────────────────── */}
                    {activeSection === "users" && (
                        <div className="space-y-6 animate-fade-in max-w-[1400px] mx-auto">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 tracking-tight">User Identity Domain</h2>
                                    <p className="text-slate-500 text-[11px] mt-1 font-medium flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[14px]">groups</span>
                                        Managing {stats.userCount || 0} authenticated platform nodes
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setShowCreateUserModal(true)} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-[11px] font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[16px]">person_add</span>
                                        Add User Node
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                <StatCard label="Total Nodes" value={stats.userCount || 0} icon="group" color="text-slate-900" loading={loading} />
                                <StatCard label="Students" value={stats.studentCount || 0} icon="school" color="text-indigo-600" loading={loading} />
                                <StatCard label="Operations" value={stats.staffCount || 0} icon="badge" color="text-blue-600" loading={loading} />
                                <StatCard label="Bank Nodes" value={stats.bankCount || 0} icon="account_balance" color="text-emerald-600" loading={loading} />
                                <StatCard label="Agents" value={stats.agentCount || 0} icon="support_agent" color="text-amber-600" loading={loading} />
                            </div>
                            
                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">Entity Registry</h3>
                                        <p className="text-[11px] text-slate-500 mt-1">{filteredData.length} records active in current buffer</p>
                                    </div>
                                    <div className="flex flex-wrap gap-3 items-center">
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[14px]">search</span>
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                placeholder="Query identity..."
                                                className="pl-8 pr-4 py-1.5 bg-white border border-slate-200 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48 transition-all"
                                            />
                                        </div>
                                        <div className="flex bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
                                            {['all', 'user', 'staff', 'bank', 'agent', 'admin'].map(r => (
                                                <button
                                                    key={r}
                                                    onClick={() => setRoleFilter(r)}
                                                    className={`px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider transition-colors border-r last:border-r-0 border-slate-100 ${roleFilter === r ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
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
                                                className="px-3 py-1.5 bg-indigo-600 text-white rounded text-[10px] font-semibold uppercase tracking-wider"
                                            >
                                                Email {selectedUsers.length}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                                            <tr>
                                                <th className="px-5 py-3 w-10">
                                                    <input type="checkbox" onChange={e => setSelectedUsers(e.target.checked ? filteredData.map((u: any) => u.id) : [])} className="rounded border-slate-300" />
                                                </th>
                                                <th className="px-5 py-3">User Identity</th>
                                                <th className="px-5 py-3">Access Tier</th>
                                                <th className="px-5 py-3">Registration</th>
                                                <th className="px-5 py-3 text-right">Commands</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {loading ? (
                                                <tr><td colSpan={5} className="px-6 py-16 text-center">
                                                    <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                                                </td></tr>
                                            ) : (filteredData.length > 0 ? (
                                                filteredData.map((item: any, idx: number) => (
                                                    <tr key={idx} className={`group hover:bg-slate-50/50 transition-all ${selectedUsers.includes(item.id) ? 'bg-indigo-50/30' : ''}`}>
                                                        <td className="px-5 py-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedUsers.includes(item.id)}
                                                                onChange={() => toggleUserSelect(item.id)}
                                                                className="rounded border-slate-300"
                                                            />
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <button 
                                                                onClick={() => window.open(`/admin/user-details/${item.id}`, '_blank')}
                                                                className="flex items-center gap-3 cursor-pointer hover:bg-indigo-50 p-2 rounded -m-2 transition-all group w-full text-left"
                                                            >
                                                                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-slate-200">
                                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.email}`} alt="" className="w-full h-full object-cover" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[12px] font-semibold text-slate-900 group-hover:text-indigo-600 underline transition-colors">{item.firstName} {item.lastName}</p>
                                                                    <p className="text-[10px] text-slate-500 font-medium">{item.email}</p>
                                                                </div>
                                                            </button>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${
                                                                item.role === 'admin' ? 'bg-slate-900 text-white border-slate-900' :
                                                                item.role === 'staff' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                                item.role === 'bank' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                item.role === 'agent' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                                'bg-slate-50 text-slate-600 border-slate-200'
                                                            }`}>
                                                                {item.role || 'user'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3 text-[11px] font-medium text-slate-500 tabular-nums">
                                                            {item.createdAt ? format(new Date(item.createdAt), 'MMM d, yyyy') : '—'}
                                                        </td>
                                                        <td className="px-5 py-3 text-right">
                                                            <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => { setActiveSection('communications'); setEmailData({ ...emailData, to: item.email, isBulk: false }); }}
                                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100"
                                                                    title="Email User"
                                                                >
                                                                    <span className="material-symbols-outlined text-[16px]">mail</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingUser({ ...item })}
                                                                    className="p-1.5 text-slate-400 hover:text-slate-900 rounded hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200"
                                                                    title="Edit User"
                                                                >
                                                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteUser(item.id, `${item.firstName} ${item.lastName}`)}
                                                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                                                                    title="Delete User"
                                                                >
                                                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center">
                                                        <span className="material-symbols-outlined text-2xl text-slate-300 block mb-2">database_off</span>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No matching identity nodes</p>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── APPLICATIONS DASHBOARD ──────────────────────────────────────── */}
                    {activeSection === "applications" && (
                        <div className="space-y-6 animate-fade-in max-w-[1400px] mx-auto">
                            {/* Header with Title and Actions */}
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Application Pipeline</h2>
                                    <p className="text-slate-500 text-[11px] mt-1 font-medium flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                                        Real-time processing of loan transmission packets
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold ${autoRefreshEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${autoRefreshEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                            {autoRefreshEnabled ? 'LIVE SYNC' : 'PAUSED'}
                                        </span>
                                    </p>
                                </div>
                                        <div className="flex gap-2 flex-wrap">
                                            <button 
                                                onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                                                className={`px-3 py-1.5 rounded font-semibold text-[10px] transition-colors flex items-center gap-1.5 shadow-sm border ${autoRefreshEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`}
                                            >
                                                <span className="material-symbols-outlined text-[14px]">{autoRefreshEnabled ? 'sync' : 'sync_disabled'}</span>
                                                {autoRefreshEnabled ? 'Live' : 'Paused'}
                                            </button>
                                            <button onClick={loadData} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded font-semibold text-[10px] hover:bg-slate-200 transition-colors flex items-center gap-1.5 shadow-sm">
                                                <span className="material-symbols-outlined text-[14px]">refresh</span>Now
                                            </button>
                                            <button className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded font-semibold text-[10px] hover:bg-slate-200 transition-colors flex items-center gap-1.5 shadow-sm">
                                                <span className="material-symbols-outlined text-[14px]">download</span>Export
                                            </button>
                                            <button className="px-3 py-1.5 bg-slate-900 text-white rounded font-semibold text-[10px] hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm">
                                                <span className="material-symbols-outlined text-[14px]">add</span>New Application
                                            </button>
                                        </div>
                                    </div>

                                    {/* Status Overview Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        <div className="bg-white p-4 rounded border border-slate-200 hover:border-amber-300 transition-colors group shadow-sm">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="w-8 h-8 bg-amber-50 rounded flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                                                    <span className="material-symbols-outlined text-[16px] text-amber-600">pending_actions</span>
                                                </div>
                                                <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Pending</span>
                                            </div>
                                            <p className="text-xl font-bold text-slate-900">{data.filter((a: any) => a.status === 'pending').length}</p>
                                            <p className="text-[10px] text-slate-500 mt-1">Awaiting review</p>
                                        </div>

                                        <div className="bg-white p-4 rounded border border-slate-200 hover:border-blue-300 transition-colors group shadow-sm">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                                    <span className="material-symbols-outlined text-[16px] text-blue-600">hourglass_bottom</span>
                                                </div>
                                                <span className="text-[9px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Processing</span>
                                            </div>
                                            <p className="text-xl font-bold text-slate-900">{data.filter((a: any) => a.status === 'processing').length}</p>
                                            <p className="text-[10px] text-slate-500 mt-1">Under review</p>
                                        </div>

                                        <div className="bg-white p-4 rounded border border-slate-200 hover:border-emerald-300 transition-colors group shadow-sm">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="w-8 h-8 bg-emerald-50 rounded flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                                                    <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                                                </div>
                                                <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Approved</span>
                                            </div>
                                            <p className="text-xl font-bold text-slate-900">{data.filter((a: any) => a.status === 'approved').length}</p>
                                            <p className="text-[10px] text-slate-500 mt-1">Ready to disburse</p>
                                        </div>

                                        <div className="bg-white p-4 rounded border border-slate-200 hover:border-indigo-300 transition-colors group shadow-sm">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="w-8 h-8 bg-indigo-50 rounded flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                                    <span className="material-symbols-outlined text-[16px] text-indigo-600">account_balance_wallet</span>
                                                </div>
                                                <span className="text-[9px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Disbursed</span>
                                            </div>
                                            <p className="text-xl font-bold text-slate-900">{data.filter((a: any) => a.status === 'disbursed').length}</p>
                                            <p className="text-[10px] text-slate-500 mt-1">Completed</p>
                                        </div>
                                    </div>

                                    {/* Key Metrics */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex items-center gap-4">
                                            <div className="w-10 h-10 bg-indigo-50 rounded flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-[20px] text-indigo-600">payments</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Total Requested</p>
                                                <p className="text-lg font-bold text-slate-900 leading-none">₹{(data.reduce((sum: number, app: any) => sum + (app.amount || 0), 0) / 10000000).toFixed(1)}Cr</p>
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex items-center gap-4">
                                            <div className="w-10 h-10 bg-emerald-50 rounded flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-[20px] text-emerald-600">trending_up</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Approval Rate</p>
                                                <p className="text-lg font-bold text-slate-900 leading-none">{data.length ? Math.round(((data.filter((a: any) => a.status === 'approved' || a.status === 'disbursed').length) / data.length) * 100) : 0}%</p>
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex items-center gap-4">
                                            <div className="w-10 h-10 bg-blue-50 rounded flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-[20px] text-blue-600">average</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Avg. Loan</p>
                                                <p className="text-lg font-bold text-slate-900 leading-none">₹{data.length ? (data.reduce((sum: number, app: any) => sum + (app.amount || 0), 0) / data.length / 100000).toFixed(1) : 0}L</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Search and Filters Bar */}
                                    <div className="bg-white p-4 rounded border border-slate-200 shadow-sm">
                                        <div className="flex flex-col md:flex-row gap-4 items-end">
                                            {/* Search */}
                                            <div className="flex-1 w-full">
                                                <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">Quick Search</label>
                                                <div className="relative">
                                                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span>
                                                    <input
                                                        type="text"
                                                        value={searchQuery}
                                                        onChange={e => setSearchQuery(e.target.value)}
                                                        placeholder="Search by name, email, app ID..."
                                                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-slate-400 transition-colors"
                                                    />
                                                </div>
                                            </div>

                                            {/* Filters */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-auto">
                                                <div>
                                                    <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                                                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-slate-50 focus:outline-none focus:border-slate-400 transition-colors">
                                                        <option value="all">All</option>
                                                        <option value="pending">Pending</option>
                                                        <option value="processing">Processing</option>
                                                        <option value="approved">Approved</option>
                                                        <option value="disbursed">Disbursed</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">Bank</label>
                                                    <select value={filterBank} onChange={e => setFilterBank(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-slate-50 focus:outline-none focus:border-slate-400 transition-colors">
                                                        <option value="all">All Banks</option>
                                                        <option value="hdfc">HDFC Bank</option>
                                                        <option value="icici">ICICI Bank</option>
                                                        <option value="sbi">SBI</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">Loan Type</label>
                                                    <select value={filterLoanType} onChange={e => setFilterLoanType(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-slate-50 focus:outline-none focus:border-slate-400 transition-colors">
                                                        <option value="all">All Types</option>
                                                        <option value="unsecured">Unsecured</option>
                                                        <option value="secured">Secured</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block opacity-0 text-[10px] mb-1.5">Action</label>
                                                    <button
                                                        onClick={() => {
                                                            setFilterStatus("all");
                                                            setFilterBank("all");
                                                            setFilterLoanType("all");
                                                            setSearchQuery("");
                                                        }}
                                                        className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-semibold text-slate-600 hover:bg-slate-200 transition-colors uppercase tracking-wider"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Applications Table */}
                                    <div className="rounded border border-slate-200 shadow-sm bg-white overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-2 font-semibold text-slate-600 text-[9px] uppercase tracking-wider"><input type="checkbox" className="rounded" /></th>
                                                        <th className="px-4 py-2 font-semibold text-slate-600 text-[9px] uppercase tracking-wider">Application</th>
                                                        <th className="px-4 py-2 font-semibold text-slate-600 text-[9px] uppercase tracking-wider">Applicant</th>
                                                        <th className="px-4 py-2 font-semibold text-slate-600 text-[9px] uppercase tracking-wider">Bank</th>
                                                        <th className="px-4 py-2 font-semibold text-slate-600 text-[9px] uppercase tracking-wider">Amount</th>
                                                        <th className="px-4 py-2 font-semibold text-slate-600 text-[9px] uppercase tracking-wider">Status</th>
                                                        <th className="px-4 py-2 font-semibold text-slate-600 text-[9px] uppercase tracking-wider">Priority</th>
                                                        <th className="px-4 py-2 font-semibold text-slate-600 text-[9px] uppercase tracking-wider">Applied</th>
                                                        <th className="px-4 py-2 font-semibold text-slate-600 text-[9px] uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
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
                                                        <tr key={idx} className={`hover:bg-slate-50/50 transition-colors group ${hasMultipleApps ? 'bg-indigo-50/30' : ''}`}>
                                                            <td className="px-4 py-2.5"><input type="checkbox" className="rounded" /></td>
                                                            
                                                            {/* App ID */}
                                                            <td className="px-4 py-2.5">
                                                                <div className="flex flex-col">
                                                                    <code className="text-[10px] font-semibold text-slate-800 font-mono">{item.applicationNumber || item.id?.substring(0, 8)}</code>
                                                                    {item.referenceId && <span className="text-[9px] text-slate-500 truncate max-w-[100px]" title={item.referenceId}>Ref: {item.referenceId}</span>}
                                                                </div>
                                                            </td>
                                                            
{/* Applicant - Clickable for User Profile */}
                                            <td className="px-4 py-2.5 max-w-[140px]">
                                                <button
                                                    onClick={() => handleViewUserProfile(item)}
                                                    className="flex flex-col cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 p-2 rounded -m-2 transition-all group w-full text-left"
                                                    title="Click to view user credentials and all applications"
                                                >
                                                    <p className="font-semibold text-slate-900 text-xs truncate group-hover:text-indigo-700 transition-colors flex items-center gap-1" title={`${item.firstName} ${item.lastName}`}>
                                                        {item.firstName} {item.lastName}
                                                        <span className="material-symbols-outlined text-[10px] inline-block opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">open_in_new</span>
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 truncate group-hover:text-indigo-500 transition-colors" title={item.email}>{item.email}</p>
                                                </button>
                                                            </td>
                                                            
                                                            {/* Bank & Source */}
                                                            <td className="px-4 py-2.5">
                                                                <div className="flex flex-col text-[10px]">
                                                                    <div className="font-semibold text-slate-900">{item.bank || 'N/A'}</div>
                                                                    <div className="flex items-center gap-1 text-slate-500 whitespace-nowrap">
                                                                        <span className="material-symbols-outlined text-[10px]">person</span>
                                                                        <span className="truncate max-w-[80px]" title={item.staffName || item.processingStaff || 'Unassigned'}>{item.staffName || item.processingStaff || 'Unassigned'}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            
                                                            {/* Amount */}
                                                            <td className="px-4 py-2.5 whitespace-nowrap">
                                                                <p className="font-semibold text-slate-900 text-xs">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.amount || 0)}</p>
                                                            </td>
                                                            
                                                            {/* Status */}
                                                            <td className="px-4 py-2.5">
                                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border ${
                                                                    item.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                    item.status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                    item.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                                    item.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                                    item.status === 'disbursed' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                                    'bg-slate-50 text-slate-700 border-slate-200'
                                                                }`}>
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                            
                                                            {/* Priority */}
                                                            <td className="px-4 py-2.5">
                                                                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border ${
                                                                    priorityLevel === 'high' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                                    priorityLevel === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                    'bg-slate-50 text-slate-600 border-slate-200'
                                                                }`}>
                                                                    <span className="material-symbols-outlined text-[10px]">
                                                                        {priorityLevel === 'high' ? 'arrow_upward' : priorityLevel === 'medium' ? 'remove' : 'arrow_downward'}
                                                                    </span>
                                                                    {priorityLevel}
                                                                </span>
                                                            </td>
                                                            
                                                            {/* Applied Date */}
                                                            <td className="px-4 py-2.5 text-[10px] text-slate-500 whitespace-nowrap">
                                                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : '—'}
                                                            </td>
                                                            
                                                            {/* Actions */}
                                                            <td className="px-4 py-2.5">
                                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={() => { setSelectedApp(item); }}
                                                                        className="p-1.5 bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors"
                                                                        title="View Details"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                                                                    </button>
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

                    {/* ─── BLOGS DASHBOARD ──────────────────────────────────────── */}
                    {activeSection === "blogs" && (
                        <div className="space-y-6 animate-fade-in max-w-[1400px] mx-auto">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Editorial Domain</h2>
                                    <p className="text-slate-500 text-[11px] mt-1 font-medium flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[14px]">history_edu</span>
                                        Manage platform publications and editorial timeline
                                    </p>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <div className="flex bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
                                        <button onClick={() => setFilterBlogTime('all')} className={`px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider transition-colors ${filterBlogTime === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>All Time</button>
                                        <button onClick={() => setFilterBlogTime('weekly')} className={`px-3 py-1.5 border-l border-slate-200 text-[9px] font-semibold uppercase tracking-wider transition-colors ${filterBlogTime === 'weekly' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Weekly</button>
                                        <button onClick={() => setFilterBlogTime('monthly')} className={`px-3 py-1.5 border-l border-slate-200 text-[9px] font-semibold uppercase tracking-wider transition-colors ${filterBlogTime === 'monthly' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Monthly</button>
                                        <button onClick={() => setFilterBlogTime('yearly')} className={`px-3 py-1.5 border-l border-slate-200 text-[9px] font-semibold uppercase tracking-wider transition-colors ${filterBlogTime === 'yearly' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Yearly</button>
                                    </div>
                                    <button className="px-3 py-1.5 bg-slate-900 text-white rounded font-semibold text-[10px] hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm">
                                        <span className="material-symbols-outlined text-[14px]">add</span>New Post
                                    </button>
                                </div>
                            </div>

                            <div className="rounded border border-slate-200 shadow-sm bg-white overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-2 font-semibold text-slate-600 text-[9px] uppercase tracking-wider">Post Metadata</th>
                                                <th className="px-4 py-2 font-semibold text-slate-600 text-[9px] uppercase tracking-wider w-32">Status</th>
                                                <th className="px-4 py-2 font-semibold text-slate-600 text-[9px] uppercase tracking-wider w-40">Created</th>
                                                <th className="px-4 py-2 font-semibold text-slate-600 text-[9px] uppercase tracking-wider w-32 text-right">Engagement</th>
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
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-4 py-2.5">
                                                        <p className="text-xs font-semibold text-slate-900 leading-tight mb-0.5">{item.title}</p>
                                                        <p className="text-[10px] text-slate-500">Writer: {item.authorName}</p>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border ${item.isPublished ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                            {item.isPublished ? 'Live' : 'Draft'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-[10px] text-slate-500">
                                                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : '—'}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-semibold text-slate-900 text-xs tabular-nums">
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
                                <span className="material-symbols-outlined text-slate-600 text-[18px]">info</span>
                                <h3 className="text-[12px] font-bold text-gray-900 uppercase tracking-wide">Application Information</h3>
                            </div>
                            <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-[11px] font-medium text-blue-900">
                                    To take action on this application (Approve, Reject, Send Back, Add Remarks, or Assign Mentor), use the 
                                    <span className="font-bold text-blue-700"> Application Management Panel</span> from the admin dashboard.
                                </p>
                            </div>
                            <p className="text-[9px] text-gray-500 text-center font-bold uppercase tracking-tighter mt-4">
                                This is a read-only preview
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

            {/* ─── User Profile & Credentials Modal ─────────────────────────────────────────── */}
            {selectedUserProfile && (
                <div className="fixed inset-0 z-[110] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in" onClick={() => { setSelectedUserProfile(null); setUserCredentials(null); setUserLoans([]); }} />
                    <div className="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-slide-in-right border-l border-slate-200 overflow-hidden">
                        <div className="sticky top-0 z-20 bg-white border-b border-slate-100 px-8 py-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                                            <span className="material-symbols-outlined text-[24px]">person</span>
                                        </div>
                                        <div>
                                            <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">{selectedUserProfile.firstName} {selectedUserProfile.lastName}</h2>
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{selectedUserProfile.email}</p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => { setSelectedUserProfile(null); setUserCredentials(null); setUserLoans([]); }} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all border border-transparent hover:border-slate-100">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="flex gap-8 overflow-x-auto pb-2">
                                <div className="whitespace-nowrap pb-3 text-[11px] font-black uppercase tracking-widest border-b-2 border-purple-600 text-purple-600 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[14px]">badge</span>
                                    Credentials
                                </div>
                                <div className="whitespace-nowrap pb-3 text-[11px] font-black uppercase tracking-widest border-b-2 border-transparent text-slate-400 hover:text-slate-600 flex items-center gap-2 cursor-default">
                                    <span className="material-symbols-outlined text-[14px]">description</span>
                                    Applications ({userLoans.length})
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            {userProfileLoading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="w-12 h-12 border-3 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                                    <p className="text-[12px] font-bold text-slate-500">Loading user profile...</p>
                                </div>
                            ) : (
                                <>
                                    {/* User Credentials Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="material-symbols-outlined text-indigo-600 text-[20px]">security</span>
                                            <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide">Personal Information</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 bg-indigo-50 p-6 rounded-lg border border-indigo-100">
                                            <DetailRow label="Full Name" value={`${userCredentials?.firstName || selectedUserProfile.firstName} ${userCredentials?.lastName || selectedUserProfile.lastName}`} highlight />
                                            <DetailRow label="Email" value={userCredentials?.email || selectedUserProfile.email} />
                                            <DetailRow label="Phone" value={userCredentials?.mobile || userCredentials?.phoneNumber || '—'} />
                                            <DetailRow label="Role" value={userCredentials?.role?.toUpperCase() || '—'} />
                                            <DetailRow label="Date of Birth" value={userCredentials?.dob ? format(new Date(userCredentials.dob), 'dd MMM yyyy') : '—'} />
                                            <DetailRow label="Gender" value={userCredentials?.gender || '—'} />
                                            {userCredentials?.createdAt && (
                                                <DetailRow label="Member Since" value={format(new Date(userCredentials.createdAt), 'dd MMM yyyy')} />
                                            )}
                                        </div>
                                    </div>

                                    {/* Applied Loans Section */}
                                    <div className="space-y-6 pt-6 border-t border-slate-200">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="material-symbols-outlined text-emerald-600 text-[20px]">account_balance</span>
                                            <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide">Loan Applications ({userLoans.length})</h3>
                                        </div>
                                        
                                        {userLoans.length > 0 ? (
                                            <div className="space-y-3">
                                                {userLoans.map((loan: any, idx: number) => (
                                                    <div key={idx} className="p-4 border border-slate-100 rounded-lg hover:border-slate-200 hover:bg-slate-50/50 transition-all group">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex-1">
                                                                <p className="text-[12px] font-bold text-slate-900">
                                                                    {loan.bank} - {loan.loanType?.toUpperCase()}
                                                                </p>
                                                                <p className="text-[10px] text-slate-500 mt-1">
                                                                    App ID: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-mono">{loan.applicationNumber || loan.id?.substring(0, 8)}</code>
                                                                </p>
                                                            </div>
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                                                loan.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                                loan.status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                                loan.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                loan.status === 'disbursed' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                                                loan.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                                'bg-slate-50 text-slate-600 border-slate-100'
                                                            }`}>
                                                                {loan.status}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="text-[10px]">
                                                                <span className="text-slate-500 font-medium">Amount</span>
                                                                <p className="text-[12px] font-bold text-slate-900 mt-0.5">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(loan.amount || 0)}</p>
                                                            </div>
                                                            <div className="text-[10px]">
                                                                <span className="text-slate-500 font-medium">Applied On</span>
                                                                <p className="text-[12px] font-bold text-slate-900 mt-0.5">{loan.createdAt ? new Date(loan.createdAt).toLocaleDateString('en-IN') : '—'}</p>
                                                            </div>
                                                        </div>
                                                        {loan.universityName && (
                                                            <p className="text-[10px] text-slate-500 mt-3">
                                                                <span className="font-medium">University:</span> {loan.universityName} {loan.country && `(${loan.country})`}
                                                            </p>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                setSelectedApp(loan);
                                                                setSelectedUserProfile(null);
                                                            }}
                                                            className="mt-3 w-full px-3 py-2 bg-slate-900 text-white rounded text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                                                        >
                                                            <span className="material-symbols-outlined text-[12px]">open_in_full</span>
                                                            View Full Details
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                                <span className="material-symbols-outlined text-3xl text-slate-300 block mb-2">folder_off</span>
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No loan applications</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Summary Statistics */}
                                    <div className="space-y-6 pt-6 border-t border-slate-200">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="material-symbols-outlined text-blue-600 text-[20px]">analytics</span>
                                            <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide">Application Summary</h3>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-center">
                                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Total Loans</p>
                                                <p className="text-[18px] font-black text-blue-700 mt-1">{userLoans.length}</p>
                                            </div>
                                            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
                                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Approved</p>
                                                <p className="text-[18px] font-black text-emerald-700 mt-1">{userLoans.filter((l: any) => l.status === 'approved' || l.status === 'disbursed').length}</p>
                                            </div>
                                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-center">
                                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pending</p>
                                                <p className="text-[18px] font-black text-amber-700 mt-1">{userLoans.filter((l: any) => l.status === 'pending' || l.status === 'processing').length}</p>
                                            </div>
                                        </div>
                                        {userLoans.length > 0 && (
                                            <div className="p-4 bg-slate-900 text-white rounded-lg">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1">Total Loan Value Requested</p>
                                                <p className="text-[24px] font-black text-white">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(userLoans.reduce((sum: number, l: any) => sum + (l.amount || 0), 0))}</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
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
