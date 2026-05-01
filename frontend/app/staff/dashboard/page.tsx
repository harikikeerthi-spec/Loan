"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, authApi, documentApi, onboardingApi, staffProfileApi } from "@/lib/api";
import { format } from "date-fns";
import ChatInterface from "@/components/Chat/ChatInterface";
import ApplicantsSection from "@/components/staff/ApplicantsSection";
import PullDocumentsModal from "@/components/staff/PullDocumentsModal";
import { getAllCountries, getStatesByCountry } from "@/lib/countriesData";

// --- Components ---

const StatCard = ({ label, value, icon, color, trend, loading, hint }: any) => (
    <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm group hover:border-indigo-200 transition-colors">
        <div className="flex justify-between items-start mb-3">
            <div className={`w-8 h-8 rounded bg-slate-50 flex items-center justify-center border border-slate-100 ${color?.includes('text-') ? color : 'text-slate-600'}`}>
                <span className="material-symbols-outlined text-[16px]">{icon}</span>
            </div>
            {hint && !loading && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700">{hint}</span>
            )}
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
        className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-all text-[12px] font-semibold ${active === section ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent"}`}
    >
        <span className={`material-symbols-outlined text-[18px] ${active === section ? "text-emerald-600" : "text-slate-400"}`}>{icon}</span>
        <span className="flex-1">{label}</span>
        {badge > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${active === section ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
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
    const [showPullModal, setShowPullModal] = useState(false);
    const [recentActivity] = useState([
        { id: 1, type: "approved", msg: "Application #APP-1021 approved", time: "2m ago", icon: "check_circle", color: "text-emerald-600 bg-emerald-50" },
        { id: 2, type: "new", msg: "New applicant Rahul Sharma onboarded", time: "18m ago", icon: "person_add", color: "text-indigo-600 bg-indigo-50" },
        { id: 3, type: "pending", msg: "3 documents awaiting review for #APP-1018", time: "1h ago", icon: "hourglass_empty", color: "text-amber-600 bg-amber-50" },
        { id: 4, type: "chat", msg: "Bank HDFC sent a query on #APP-1015", time: "2h ago", icon: "chat", color: "text-blue-600 bg-blue-50" },
        { id: 5, type: "rejected", msg: "Application #APP-1009 rejected — docs missing", time: "3h ago", icon: "cancel", color: "text-rose-600 bg-rose-50" },
    ]);

    // Real-time updates
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
    const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

    // Tasks State
    const [tasks, setTasks] = useState([
        { id: 1, title: "Review pending applications from HDFC", completed: false },
        { id: 2, title: "Follow up with Student #8921 on missing documents", completed: false },
        { id: 3, title: "Sync with Bank representative regarding SLA", completed: true },
    ]);
    const [newTaskTitle, setNewTaskTitle] = useState("");

    // Email / Communications
    const [emailData, setEmailData] = useState({ to: "", subject: "", content: "", role: "user", isBulk: false });
    const [emailLoading, setEmailLoading] = useState(false);

    // Application detail modal state
    const [selectedApp, setSelectedApp] = useState<any>(null);
    const [actionRemarks, setActionRemarks] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    
    // Onboard applicant — two-step state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [onboardStep, setOnboardStep] = useState<1|2|3>(1);
    const [createdUser, setCreatedUser] = useState<any>(null);
    const [quickForm, setQuickForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
    const [profileTab, setProfileTab] = useState<"personal"|"academic"|"work"|"tests">("personal");
    const [newStudent, setNewStudent] = useState({
        email: "", firstName: "", lastName: "", middleName: "", mobile: "", role: "student",
        dob: "", gender: "", maritalStatus: "",
        mailingAddress: { address1: "", address2: "", city: "", state: "", country: "", pincode: "" },
        permanentAddress: { address1: "", address2: "", city: "", state: "", country: "", pincode: "" },
        passport: { number: "", issueDate: "", expiryDate: "", issueCountry: "", birthCity: "", birthCountry: "" },
        nationality: { name: "", citizenship: "", dualCitizenship: "No", livingOtherCountry: "No", livingOtherCountryName: "" },
        background: { immigrationApplied: "No", immigrationAppliedCountry: "", medicalCondition: "No", medicalConditionDetails: "", visaRefusal: "No", visaRefusalDetails: "", criminalOffence: "No", criminalOffenceDetails: "" },
        emergencyContact: { name: "", phone: "", email: "", relation: "" },
        academic: { 
            countryOfEducation: "", 
            highestLevel: "", 
            postgrad: { country: "", state: "", university: "", qualification: "", city: "", grading: "", percentage: "", language: "", startDate: "", endDate: "" }, 
            undergrad: { country: "", state: "", university: "", qualification: "", city: "", grading: "", score: "", backlogs: "", language: "", startDate: "", endDate: "" },
            grade12: { country: "", state: "", board: "", institution: "", city: "", grading: "", score: "", language: "", startDate: "", endDate: "" },
            grade10: { country: "", state: "", board: "", institution: "", city: "", grading: "", score: "", language: "", startDate: "", endDate: "" }
        },
        workExperience: [{ employer: "", role: "", country: "", startDate: "", endDate: "", current: false }],
        tests: { ielts: "", toefl: "", pte: "", gre: "", gmat: "", sat: "" }
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

    // Auto-refresh for real-time updates
    useEffect(() => {
        if (!autoRefreshEnabled) return;

        if (activeSection === "overview") {
            // Refresh overview every 20 seconds
            autoRefreshInterval.current = setInterval(() => {
                loadOverview();
                setLastRefresh(new Date());
            }, 20000);
        } else if (activeSection === "applications") {
            // Refresh applications every 15 seconds for real-time pipeline
            autoRefreshInterval.current = setInterval(() => {
                loadData();
                setLastRefresh(new Date());
            }, 15000);
        } else if (activeSection === "performance") {
            // Refresh metrics every 30 seconds
            autoRefreshInterval.current = setInterval(() => {
                loadOverview();
                setLastRefresh(new Date());
            }, 30000);
        } else if (activeSection === "users") {
            // Refresh users every 25 seconds
            autoRefreshInterval.current = setInterval(() => {
                loadData();
                setLastRefresh(new Date());
            }, 25000);
        }

        return () => {
            if (autoRefreshInterval.current) clearInterval(autoRefreshInterval.current);
        };
    }, [activeSection, autoRefreshEnabled, loadOverview, loadData]);

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

    const toggleTask = (id: number) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const addTask = () => {
        if (!newTaskTitle.trim()) return;
        setTasks([{ id: Date.now(), title: newTaskTitle, completed: false }, ...tasks]);
        setNewTaskTitle("");
    };

    const deleteTask = (id: number) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    const resetOnboardModal = () => {
        setActiveSection('overview');
        setOnboardStep(1);
        setCreatedUser(null);
        setQuickForm({ firstName: "", lastName: "", email: "", phone: "" });
        setProfileTab("personal");
    };

    const handleQuickRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickForm.firstName || !quickForm.lastName || !quickForm.email || !quickForm.phone) return;
        setCreateLoading(true);
        try {
            const res: any = await adminApi.createUser({
                firstName: quickForm.firstName,
                lastName: quickForm.lastName,
                email: quickForm.email,
                mobile: quickForm.phone,
                role: "student",
            });
            
            console.log("Create User Response Full:", JSON.stringify(res, null, 2));
            console.log("Response keys:", Object.keys(res || {}));
            
            // Handle different possible response structures
            const user = res?.user || (Array.isArray(res?.data) ? res.data[0] : res.data) || res;
            console.log("Extracted user object:", JSON.stringify(user, null, 2));
            console.log("User object keys:", Object.keys(user || {}));
            
            const userId = user?.id || user?.uid || user?._id;
            console.log("Extracted userId:", userId);

            if (!userId) {
                console.error("Failed to extract user ID. Response structure:", {
                    hasUser: !!res?.user,
                    userKeys: Object.keys(res?.user || {}),
                    hasData: !!res?.data,
                    hasId: !!user?.id,
                    hasUid: !!user?.uid,
                    has_id: !!user?._id,
                    responseObj: res
                });
                throw new Error("User created but no valid ID returned from server. Response: " + JSON.stringify(res));
            }

            setCreatedUser(user);
            setNewStudent(s => ({ ...s, firstName: quickForm.firstName, lastName: quickForm.lastName, email: quickForm.email, mobile: quickForm.phone }));
            
            // Create a StaffProfile for this user to enable document fetching/syncing
            try {
                await staffProfileApi.create({
                    linked_user_id: userId,
                    internal_notes: `Staff-initiated onboarding for ${quickForm.firstName}`
                });
            } catch (spErr) {
                console.warn("Staff profile creation failed", spErr);
            }

            setOnboardStep(2);
        } catch (e: any) {
            alert(e.message || "Failed to register applicant");
        } finally {
            setCreateLoading(false);
        }
    };

    // Auto-fetch documents when entering step 3
    useEffect(() => {
        if (onboardStep === 3 && createdUser) {
            const userId = createdUser.id || createdUser.uid || createdUser._id;
            if (userId) fetchUserDocuments(userId);
        }
    }, [onboardStep, createdUser]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        try {
            await adminApi.updateUserDetails({
                email: newStudent.email,
                firstName: newStudent.firstName,
                lastName: newStudent.lastName,
                phoneNumber: newStudent.mobile,
                dateOfBirth: newStudent.dob,
            });
            loadData();
            setProfileTab('academic');
            alert(`✅ Personal Information for ${newStudent.firstName} saved! Please complete academic details.`);
        } catch (e: any) {
            alert(e.message || "Failed to save profile");
        } finally {
            setCreateLoading(false);
        }
    };

    const handleFinalOnboardSubmit = async () => {
        setCreateLoading(true);
        try {
            await onboardingApi.submit(newStudent);
            alert("🎉 Onboarding complete! Applicant profile has been fully updated.");
            resetOnboardModal();
            loadData();
        } catch (e: any) {
            alert("Failed to finalize onboarding: " + e.message);
        } finally {
            setCreateLoading(false);
        }
    };

    const fetchUserDocuments = async (userId: string) => {
        setDocsLoading(true);
        try {
            const res: any = await documentApi.getUsersDocuments(userId);
            setUserDocuments(res?.data || res || []);
        } catch (e) {
            console.error("Failed to load documents");
        } finally {
            setDocsLoading(false);
        }
    };

    const handleDeleteBlog = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this editorial piece? This action cannot be undone.")) return;
        try {
            await adminApi.deleteBlog(id);
            alert("Editorial content deleted successfully.");
            loadData();
        } catch (e: any) {
            alert("Failed to delete: " + e.message);
        }
    };

    const handleToggleBlogStatus = async (item: any) => {
        try {
            await adminApi.bulkUpdateBlogStatus([item.id || item._id], !item.isPublished);
            alert(`Content ${!item.isPublished ? 'published live' : 'moved to drafts'}.`);
            loadData();
        } catch (e: any) {
            alert("Failed to update status: " + e.message);
        }
    };

    const handleDeleteCommunityPost = async (id: string) => {
        if (!window.confirm("Are you sure you want to remove this community broadcast?")) return;
        try {
            await adminApi.deleteForumPost(id);
            alert("Community post removed.");
            loadData();
        } catch (e: any) {
            alert("Failed to delete: " + e.message);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!window.confirm("CRITICAL: Delete this user account? All profile data and records will be purged. This action is irreversible.")) return;
        try {
            await adminApi.deleteUser(id);
            alert("User account has been permanently removed.");
            loadData();
        } catch (e: any) {
            alert("Operation failed: " + e.message);
        }
    };

    const handleDeleteApplication = async (id: string) => {
        if (!window.confirm("Are you sure you want to purge this loan application record?")) return;
        try {
            await adminApi.deleteApplication(id);
            alert("Application record removed.");
            loadData();
        } catch (e: any) {
            alert("Failed to remove record: " + e.message);
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

    const pendingCount = Number(stats.apps?.statusStats?.pending || 0) + Number(stats.apps?.statusStats?.processing || 0) + Number(stats.apps?.statusStats?.submitted || 0);
    const approvedCount = Number(stats.apps?.statusStats?.approved || 0) + Number(stats.apps?.statusStats?.disbursed || 0);
    const rejectedCount = Number(stats.apps?.statusStats?.rejected || 0) + Number(stats.apps?.statusStats?.cancelled || 0);
    const totalApps = Number(stats.apps?.total ?? 0);
    const approvalRate = totalApps > 0 ? Math.round((approvedCount / totalApps) * 100) : 0;

    const sectionTitles: Record<string, string> = {
        overview: 'Dashboard',
        applicants: 'Pull & Share Documents',
        applications: 'Active Pipeline',
        tasks: 'Action Items',
        performance: 'Performance',
        users: 'User Directory',
        blogs: 'Editorial Content',
        community: 'Engagement Hub',
        communications: 'Outreach Center',
        my_profile: 'My Profile',
        chat_customer: 'Support Chat',
        onboarding: 'Applicant Onboarding',
    };

    const navItems = [
        { section: "overview", icon: "dashboard", label: "Dashboard", badge: 0 },
        { section: "applicants", icon: "send_to_mobile", label: "Document Transfer", badge: 0 },
        { section: "applications", icon: "description", label: "Active Pipeline", badge: pendingCount },
        { section: "tasks", icon: "check_circle", label: "Action Items", badge: tasks.filter(t => !t.completed).length },
        { section: "performance", icon: "insights", label: "Performance", badge: 0 },
        { section: "users", icon: "people", label: "User Directory", badge: 0 },
        { section: "blogs", icon: "article", label: "Editorial Content", badge: 0 },
        { section: "community", icon: "groups", label: "Engagement Hub", badge: 0 },
        { section: "communications", icon: "mail", label: "Outreach Center", badge: 0 },
        { section: "chat_customer", icon: "support_agent", label: "Support Chat", badge: 0 },
        { section: "my_profile", icon: "badge", label: "My Profile", badge: 0 },
    ];

    return (
        <div className="h-screen overflow-hidden flex bg-slate-50 text-slate-900 font-sans text-sm selection:bg-indigo-100 selection:text-indigo-900">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-white transform transition-transform duration-300 lg:translate-x-0 border-r border-slate-200 flex flex-col ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
                <div className="h-16 px-6 flex items-center border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                            <span className="material-symbols-outlined text-[20px]">shield_person</span>
                        </div>
                        <span className="font-bold text-[15px] text-slate-900 tracking-tight">Staff<span className="text-emerald-600">Portal</span></span>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                    <div className="px-3 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Management</div>
                    {navItems.map(item => (
                        <NavItem key={item.section} {...item} active={activeSection} onClick={(s: string) => {
                            if (s === 'chat_customer') setAutoStartUser(null);
                            setActiveSection(s);
                            setSidebarOpen(false);
                        }} />
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
                    <div className="flex items-center gap-3 mb-4 p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="Avatar" className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 object-cover" />
                        <div className="min-w-0">
                            <p className="text-[13px] font-bold text-slate-900 truncate">{user?.firstName || 'Staff'}</p>
                            <p className="text-[11px] text-slate-500 font-medium truncate capitalize">{user?.role?.replace('_', ' ')}</p>
                        </div>
                    </div>
                    <button onClick={logout} className="w-full px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all text-[12px] font-bold flex items-center justify-center gap-2 shadow-sm">
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden lg:ml-[260px] bg-[#f8fafc]">
                {/* Header */}
                <header className="h-16 bg-[#007367] px-8 flex justify-between items-center sticky top-0 z-40 flex-shrink-0 shadow-lg border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 text-white/80 hover:bg-white/10 rounded-xl transition-all">
                            <span className="material-symbols-outlined text-[24px]">menu</span>
                        </button>
                        <div className="flex flex-col">
                            <h1 className="text-[16px] font-bold text-white flex items-center gap-2">
                                {sectionTitles[activeSection] || activeSection}
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/30">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">Live</span>
                                </div>
                            </h1>
                            <p className="text-[10px] text-emerald-100/60 font-medium tracking-wide uppercase">Operational Hub • {format(new Date(), 'EEEE, MMM do')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block group">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors text-[18px]">search</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Intelligent Search..."
                                className="pl-10 pr-4 py-2 bg-white/10 hover:bg-white/15 focus:bg-white border border-white/10 focus:border-white rounded-xl text-[13px] focus:outline-none w-64 transition-all text-white focus:text-slate-900 placeholder:text-white/40 focus:placeholder:text-slate-400 shadow-inner"
                            />
                        </div>
                        <button className="relative w-10 h-10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                            <span className="material-symbols-outlined text-[22px]">notifications</span>
                            {pendingCount > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-[#007367] shadow-sm" />}
                        </button>
                        <div className="h-8 w-px bg-white/10 mx-1" />
                        <div className="flex items-center gap-3 pl-2 group cursor-pointer">
                            <div className="text-right hidden sm:block">
                                <p className="text-[12px] font-bold text-white leading-none">Hello, {user?.firstName || 'Staff'}</p>
                                <p className="text-[10px] text-emerald-100/60 font-medium mt-1 uppercase tracking-tighter">View Profile</p>
                            </div>
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="Avatar" className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 object-cover group-hover:scale-105 transition-transform" />
                        </div>
                    </div>
                </header>

                <div className={`flex-1 overflow-y-auto custom-scrollbar ${(activeSection.startsWith('chat_') || activeSection === 'onboarding') ? 'p-0' : 'p-6 lg:p-8 space-y-6'} bg-slate-50/50`}>
                    {activeSection === "chat_customer" && <ChatInterface role="staff" initialUser={autoStartUser} />}

                    
                    {/* Onboarding Flow View */}
                    {activeSection === "onboarding" && (
                        <div className="flex flex-col h-full bg-white animate-in fade-in duration-300">
                            {/* Header / Breadcrumbs & Stepper */}
                            <div className="bg-white border-b border-slate-200 shrink-0">
                                <div className="px-8 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-emerald-600 font-bold cursor-pointer hover:underline" onClick={resetOnboardModal}>Students</span>
                                        <span className="text-slate-400 material-symbols-outlined text-[16px]">chevron_right</span>
                                        <span className="text-slate-900 font-bold">
                                            {onboardStep === 1 ? 'New Applicant Onboarding' : `${newStudent.firstName} ${newStudent.lastName}`}
                                        </span>
                                    </div>
                                    <button onClick={resetOnboardModal} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                                        <span className="material-symbols-outlined text-[20px]">close</span>
                                    </button>
                                </div>
                                
                                {onboardStep >= 2 && (
                                    <div className="px-8 py-5 flex items-center gap-8">
                                        {/* Profile summary card */}
                                        <div className="flex items-center gap-4 bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm min-w-[280px]">
                                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner">
                                                {newStudent.firstName?.[0] || ''}{newStudent.lastName?.[0] || ''}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-slate-900 truncate">{newStudent.firstName} {newStudent.lastName}</div>
                                                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium"><span className="material-symbols-outlined text-[14px]">mail</span> {newStudent.email}</div>
                                                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium"><span className="material-symbols-outlined text-[14px]">call</span> {newStudent.mobile}</div>
                                            </div>
                                        </div>
                                        
                                        <button className="flex flex-col items-center justify-center border border-slate-200 bg-white rounded-2xl p-4 shadow-sm hover:bg-slate-50 transition-all text-emerald-600 min-w-[110px] group">
                                            <span className="material-symbols-outlined mb-1 group-hover:scale-110 transition-transform">share</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Platform Link</span>
                                        </button>

                                        {/* Progress Stepper */}
                                        <div className="flex-1 flex items-center justify-center gap-12 pl-12 border-l border-slate-200">
                                            <div className="flex flex-col items-center gap-2 relative cursor-pointer group" onClick={() => setOnboardStep(2)}>
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm z-10 shadow-md transition-all ${onboardStep >= 2 ? 'bg-emerald-600 text-white scale-110' : 'bg-white border-2 border-slate-200 text-slate-400'}`}>
                                                    {onboardStep > 2 ? <span className="material-symbols-outlined text-[18px]">check</span> : '1'}
                                                </div>
                                                <div className={`text-[10px] font-bold uppercase tracking-widest ${onboardStep >= 2 ? 'text-emerald-700' : 'text-slate-400'}`}>Profile</div>
                                                <div className={`absolute top-4.5 left-9 w-28 h-[2px] -z-0 ${onboardStep >= 3 ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>
                                            </div>
                                            <div className="flex flex-col items-center gap-2 relative cursor-pointer group" onClick={() => { if(onboardStep >= 2) setOnboardStep(3) }}>
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm z-10 shadow-md transition-all ${onboardStep >= 3 ? 'bg-emerald-600 text-white scale-110' : 'bg-white border-2 border-slate-200 text-slate-400'}`}>
                                                    {onboardStep > 3 ? <span className="material-symbols-outlined text-[18px]">check</span> : '2'}
                                                </div>
                                                <div className={`text-[10px] font-bold uppercase tracking-widest ${onboardStep >= 3 ? 'text-emerald-700' : 'text-slate-400'}`}>Documents</div>
                                                <div className={`absolute top-4.5 left-9 w-28 h-[2px] -z-0 ${onboardStep >= 4 ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>
                                            </div>
                                            <div className="flex flex-col items-center gap-2 relative group">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm z-10 shadow-md transition-all ${onboardStep >= 4 ? 'bg-emerald-600 text-white scale-110' : 'bg-white border-2 border-slate-200 text-slate-400'}`}>3</div>
                                                <div className={`text-[10px] font-bold uppercase tracking-widest ${onboardStep >= 4 ? 'text-emerald-700' : 'text-slate-400'}`}>Applications</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {onboardStep === 2 && (
                                    <div className="px-8 flex items-center gap-10 border-t border-slate-100 bg-slate-50/30 overflow-x-auto no-scrollbar">
                                        {[
                                            { id: 'personal', label: 'Personal Information', status: 'Incomplete', color: 'text-rose-500', icon: 'person' },
                                            { id: 'academic', label: 'Academic Qualifications', status: 'Incomplete', color: 'text-rose-500', icon: 'school' },
                                            { id: 'work', label: 'Work Experience', status: 'Optional', color: 'text-amber-500', icon: 'work' },
                                            { id: 'tests', label: 'Tests', status: 'Incomplete', color: 'text-rose-500', icon: 'terminal' }
                                        ].map(tab => (
                                            <button 
                                                key={tab.id}
                                                type="button"
                                                onClick={() => setProfileTab(tab.id as any)}
                                                className={`py-4 flex items-center gap-2 border-b-2 transition-all shrink-0 ${profileTab === tab.id ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                                            >
                                                <span className={`material-symbols-outlined text-[18px] ${profileTab === tab.id ? 'text-emerald-600' : 'text-slate-400'}`}>{tab.icon}</span>
                                                <div className="text-left">
                                                    <div className="text-[11px] font-bold uppercase tracking-tight leading-none mb-0.5">{tab.label}</div>
                                                    <div className={`text-[9px] font-bold ${profileTab === tab.id ? 'text-emerald-500' : tab.color}`}>{tab.status}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-8 relative">
                            {onboardStep === 1 ? (
                                /* STEP 1: Quick Register */
                                <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl shadow-emerald-900/5 border border-slate-200 p-10 mt-12 animate-in slide-in-from-bottom-8 duration-500">
                                    <div className="text-center mb-10">
                                        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner transform -rotate-3 group-hover:rotate-0 transition-transform">
                                            <span className="material-symbols-outlined text-[40px]">person_add</span>
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Register New Applicant</h2>
                                        <p className="text-slate-500 mt-2 text-sm font-medium">Create a student account to initiate the application process.</p>
                                    </div>
                                    <form id="quick-register-form" onSubmit={handleQuickRegister} className="space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">First Name*</label>
                                                <input required type="text" value={quickForm.firstName} onChange={e => setQuickForm({ ...quickForm, firstName: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold placeholder:text-slate-300" placeholder="e.g. Rahul" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Last Name*</label>
                                                <input required type="text" value={quickForm.lastName} onChange={e => setQuickForm({ ...quickForm, lastName: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold placeholder:text-slate-300" placeholder="e.g. Sharma" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email Address*</label>
                                            <input required type="email" value={quickForm.email} onChange={e => setQuickForm({ ...quickForm, email: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold placeholder:text-slate-300" placeholder="rahul@example.com" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">Mobile Number*</label>
                                            <div className="flex gap-3">
                                                <div className="px-4 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-[13px] flex items-center gap-2 font-bold text-slate-600">🇮🇳 +91</div>
                                                <input required type="tel" value={quickForm.phone} onChange={e => setQuickForm({ ...quickForm, phone: e.target.value })} className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold placeholder:text-slate-300" placeholder="9876543210" />
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            ) : onboardStep === 2 ? (
                                /* STEP 2: Full Profile */
                                <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-12">
                                    
                                    {/* Auto-fill banner */}
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center justify-between shadow-sm shadow-emerald-900/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white text-emerald-600 rounded-xl flex items-center justify-center shadow-sm border border-emerald-100">
                                                <span className="material-symbols-outlined text-[28px]">magic_button</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-[15px]">Intelligent Autofill</h4>
                                                <p className="text-xs text-slate-500 font-medium">Instantly populate profile data from uploaded documents.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 items-center">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Available Credits</span>
                                                <span className="text-xs font-black text-slate-900">14 Student Autofills left</span>
                                            </div>
                                            <button type="button" onClick={() => setOnboardStep(3)} className="text-[12px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20">
                                                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                                                Bulk Upload
                                            </button>
                                        </div>
                                    </div>

                                    {profileTab === 'personal' && (
                                        <form id="profile-personal-form" onSubmit={handleSaveProfile} className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                                            <section>
                                                <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                    <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">person</span>
                                                    Personal Information
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">First Name*</label>
                                                        <input required type="text" value={newStudent.firstName} onChange={e => setNewStudent({ ...newStudent, firstName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Middle Name</label>
                                                        <input type="text" value={newStudent.middleName} onChange={e => setNewStudent({ ...newStudent, middleName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" placeholder="Enter Middle Name" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Last Name*</label>
                                                        <input required type="text" value={newStudent.lastName} onChange={e => setNewStudent({ ...newStudent, lastName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Email Address*</label>
                                                        <input required type="email" value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Mobile Number*</label>
                                                        <div className="flex gap-2">
                                                            <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm flex items-center gap-2">🇮🇳 +91</div>
                                                            <input required type="tel" value={newStudent.mobile} onChange={e => setNewStudent({ ...newStudent, mobile: e.target.value })} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Date of Birth*</label>
                                                        <input required type="date" value={newStudent.dob} onChange={e => setNewStudent({ ...newStudent, dob: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-600" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Gender*</label>
                                                        <select required value={newStudent.gender} onChange={e => setNewStudent({ ...newStudent, gender: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium appearance-none text-slate-600">
                                                            <option value="">Select Gender</option>
                                                            <option value="male">Male</option>
                                                            <option value="female">Female</option>
                                                            <option value="other">Other</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Marital Status*</label>
                                                        <select required value={newStudent.maritalStatus} onChange={e => setNewStudent({ ...newStudent, maritalStatus: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium appearance-none text-slate-600">
                                                            <option value="">Select Marital Status</option>
                                                            <option value="single">Single</option>
                                                            <option value="married">Married</option>
                                                            <option value="divorced">Divorced</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </section>

                                            <div className="h-px bg-slate-100 my-8"></div>

                                            <section>
                                                <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                    <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">location_on</span>
                                                    Mailing Address
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Address 1*</label>
                                                        <input type="text" value={newStudent.mailingAddress.address1} onChange={e => setNewStudent({ ...newStudent, mailingAddress: { ...newStudent.mailingAddress, address1: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" placeholder="Enter Address" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Address 2</label>
                                                        <input type="text" value={newStudent.mailingAddress.address2} onChange={e => setNewStudent({ ...newStudent, mailingAddress: { ...newStudent.mailingAddress, address2: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" placeholder="Enter Address" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country*</label>
                                                        <select value={newStudent.mailingAddress.country} onChange={e => setNewStudent({ ...newStudent, mailingAddress: { ...newStudent.mailingAddress, country: e.target.value, state: "" } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                            <option value="">Select Country</option>
                                                            {getAllCountries().map(country => (
                                                                <option key={country} value={country}>{country}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">State*</label>
                                                        <select value={newStudent.mailingAddress.state} onChange={e => setNewStudent({ ...newStudent, mailingAddress: { ...newStudent.mailingAddress, state: e.target.value } })} disabled={!newStudent.mailingAddress.country} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                                            <option value="">Select State</option>
                                                            {newStudent.mailingAddress.country && getStatesByCountry(newStudent.mailingAddress.country).map(state => (
                                                                <option key={state} value={state}>{state}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">City*</label>
                                                        <input type="text" value={newStudent.mailingAddress.city} onChange={e => setNewStudent({ ...newStudent, mailingAddress: { ...newStudent.mailingAddress, city: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter City" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Pincode*</label>
                                                        <input type="text" value={newStudent.mailingAddress.pincode} onChange={e => setNewStudent({ ...newStudent, mailingAddress: { ...newStudent.mailingAddress, pincode: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Pincode" />
                                                    </div>
                                                </div>
                                            </section>

                                            <div className="h-px bg-slate-100 my-8"></div>
                                            
                                            <section>
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                                                        <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">location_on</span>
                                                        Permanent Address
                                                    </div>
                                                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setNewStudent({ ...newStudent, permanentAddress: { ...newStudent.mailingAddress } });
                                                                }
                                                            }}
                                                            className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" 
                                                        />
                                                        Same as mailing address
                                                    </label>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Address 1*</label>
                                                        <input type="text" value={newStudent.permanentAddress.address1} onChange={e => setNewStudent({ ...newStudent, permanentAddress: { ...newStudent.permanentAddress, address1: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Address" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Address 2</label>
                                                        <input type="text" value={newStudent.permanentAddress.address2} onChange={e => setNewStudent({ ...newStudent, permanentAddress: { ...newStudent.permanentAddress, address2: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Address" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country*</label>
                                                        <select value={newStudent.permanentAddress.country} onChange={e => setNewStudent({ ...newStudent, permanentAddress: { ...newStudent.permanentAddress, country: e.target.value, state: "" } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                            <option value="">Select Country</option>
                                                            {getAllCountries().map(country => (
                                                                <option key={country} value={country}>{country}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">State*</label>
                                                        <select value={newStudent.permanentAddress.state} onChange={e => setNewStudent({ ...newStudent, permanentAddress: { ...newStudent.permanentAddress, state: e.target.value } })} disabled={!newStudent.permanentAddress.country} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                                            <option value="">Select State</option>
                                                            {newStudent.permanentAddress.country && getStatesByCountry(newStudent.permanentAddress.country).map(state => (
                                                                <option key={state} value={state}>{state}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">City*</label>
                                                        <input type="text" value={newStudent.permanentAddress.city} onChange={e => setNewStudent({ ...newStudent, permanentAddress: { ...newStudent.permanentAddress, city: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter City" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Pincode*</label>
                                                        <input type="text" value={newStudent.permanentAddress.pincode} onChange={e => setNewStudent({ ...newStudent, permanentAddress: { ...newStudent.permanentAddress, pincode: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Pincode" />
                                                    </div>
                                                </div>
                                            </section>

                                            <div className="h-px bg-slate-100 my-8"></div>

                                            <section>
                                                <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                    <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">badge</span>
                                                    Passport Information
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Passport Number*</label>
                                                        <input type="text" value={newStudent.passport.number} onChange={e => setNewStudent({ ...newStudent, passport: { ...newStudent.passport, number: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Number" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Issue Date*</label>
                                                        <input type="date" value={newStudent.passport.issueDate} onChange={e => setNewStudent({ ...newStudent, passport: { ...newStudent.passport, issueDate: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Expiry Date*</label>
                                                        <input type="date" value={newStudent.passport.expiryDate} onChange={e => setNewStudent({ ...newStudent, passport: { ...newStudent.passport, expiryDate: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Issue Country*</label>
                                                        <select value={newStudent.passport.issueCountry} onChange={e => setNewStudent({ ...newStudent, passport: { ...newStudent.passport, issueCountry: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="">Select Issue Country</option><option value="India">India</option></select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">City of Birth*</label>
                                                        <input type="text" value={newStudent.passport.birthCity} onChange={e => setNewStudent({ ...newStudent, passport: { ...newStudent.passport, birthCity: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter City" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country of Birth*</label>
                                                        <select value={newStudent.passport.birthCountry} onChange={e => setNewStudent({ ...newStudent, passport: { ...newStudent.passport, birthCountry: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="">Select Country of Birth</option><option value="India">India</option></select>
                                                    </div>
                                                </div>
                                            </section>

                                            <div className="h-px bg-slate-100 my-8"></div>

                                            <section>
                                                <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                    <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">public</span>
                                                    Nationality
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Nationality*</label>
                                                        <select value={newStudent.nationality.name} onChange={e => setNewStudent({ ...newStudent, nationality: { ...newStudent.nationality, name: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="">Select Nationality</option><option value="Indian">Indian</option><option value="American">American</option></select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Citizenship*</label>
                                                        <select value={newStudent.nationality.citizenship} onChange={e => setNewStudent({ ...newStudent, nationality: { ...newStudent.nationality, citizenship: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="">Select Citizenship</option><option value="India">India</option><option value="USA">USA</option></select>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-700 mb-2 block">Is the applicant a citizen of more than one country?*</label>
                                                        <div className="flex gap-4">
                                                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                <input type="radio" name="dualCitizen" checked={newStudent.nationality.dualCitizenship === 'No'} onChange={() => setNewStudent({ ...newStudent, nationality: { ...newStudent.nationality, dualCitizenship: 'No' } })} className="w-4 h-4 text-emerald-500" /> No
                                                            </label>
                                                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                <input type="radio" name="dualCitizen" checked={newStudent.nationality.dualCitizenship === 'Yes'} onChange={() => setNewStudent({ ...newStudent, nationality: { ...newStudent.nationality, dualCitizenship: 'Yes' } })} className="w-4 h-4 text-emerald-500" /> Yes
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <input 
                                                            type="text"
                                                            value={newStudent.nationality.dualCitizenship === 'Yes' ? newStudent.nationality.name : ""}
                                                            disabled={newStudent.nationality.dualCitizenship === 'No'}
                                                            onChange={e => setNewStudent({ ...newStudent, nationality: { ...newStudent.nationality, name: e.target.value } })}
                                                            className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${newStudent.nationality.dualCitizenship === 'No' ? 'opacity-50 grayscale' : ''}`} 
                                                            placeholder="Enter Nationality" 
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-700 mb-2 block">Is the applicant living and studying in any other country?*</label>
                                                        <div className="flex gap-4">
                                                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                <input type="radio" name="livingOther" checked={newStudent.nationality.livingOtherCountry === 'No'} onChange={() => setNewStudent({ ...newStudent, nationality: { ...newStudent.nationality, livingOtherCountry: 'No' } })} className="w-4 h-4 text-emerald-500" /> No
                                                            </label>
                                                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                <input type="radio" name="livingOther" checked={newStudent.nationality.livingOtherCountry === 'Yes'} onChange={() => setNewStudent({ ...newStudent, nationality: { ...newStudent.nationality, livingOtherCountry: 'Yes' } })} className="w-4 h-4 text-emerald-500" /> Yes
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <select 
                                                            value={newStudent.nationality.livingOtherCountryName}
                                                            disabled={newStudent.nationality.livingOtherCountry === 'No'}
                                                            onChange={e => setNewStudent({ ...newStudent, nationality: { ...newStudent.nationality, livingOtherCountryName: e.target.value } })}
                                                            className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${newStudent.nationality.livingOtherCountry === 'No' ? 'opacity-50 grayscale' : ''}`}
                                                        >
                                                            <option value="">Select Living Country</option>
                                                            <option value="USA">USA</option>
                                                            <option value="UK">UK</option>
                                                            <option value="Canada">Canada</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </section>

                                            <div className="h-px bg-slate-100 my-8"></div>

                                            <section>
                                                <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                    <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">info</span>
                                                    Background Info
                                                </div>
                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="text-[10px] font-black text-slate-700 mb-2 block">Has applicant applied for any type of immigration into any country?</label>
                                                            <div className="flex gap-4">
                                                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                    <input type="radio" name="bgImmigration" checked={newStudent.background.immigrationApplied === 'No'} onChange={() => setNewStudent({ ...newStudent, background: { ...newStudent.background, immigrationApplied: 'No' } })} className="w-4 h-4 text-emerald-500" /> No
                                                                </label>
                                                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                    <input type="radio" name="bgImmigration" checked={newStudent.background.immigrationApplied === 'Yes'} onChange={() => setNewStudent({ ...newStudent, background: { ...newStudent.background, immigrationApplied: 'Yes' } })} className="w-4 h-4 text-emerald-500" /> Yes
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div><select value={newStudent.background.immigrationAppliedCountry} disabled={newStudent.background.immigrationApplied === 'No'} onChange={e => setNewStudent({ ...newStudent, background: { ...newStudent.background, immigrationAppliedCountry: e.target.value } })} className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${newStudent.background.immigrationApplied === 'No' ? 'opacity-50 grayscale' : ''}`}><option value="">Select Country</option><option value="USA">USA</option><option value="Canada">Canada</option></select></div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="text-[10px] font-black text-slate-700 mb-2 block">Does applicant suffer from a serious medical condition?</label>
                                                            <div className="flex gap-4">
                                                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                    <input type="radio" name="bgMedical" checked={newStudent.background.medicalCondition === 'No'} onChange={() => setNewStudent({ ...newStudent, background: { ...newStudent.background, medicalCondition: 'No' } })} className="w-4 h-4 text-emerald-500" /> No
                                                                </label>
                                                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                    <input type="radio" name="bgMedical" checked={newStudent.background.medicalCondition === 'Yes'} onChange={() => setNewStudent({ ...newStudent, background: { ...newStudent.background, medicalCondition: 'Yes' } })} className="w-4 h-4 text-emerald-500" /> Yes
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div><input type="text" value={newStudent.background.medicalConditionDetails} disabled={newStudent.background.medicalCondition === 'No'} onChange={e => setNewStudent({ ...newStudent, background: { ...newStudent.background, medicalConditionDetails: e.target.value } })} className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${newStudent.background.medicalCondition === 'No' ? 'opacity-50 grayscale' : ''}`} placeholder="Specify Here..." /></div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="text-[10px] font-black text-slate-700 mb-2 block">Has applicant Visa refusal for any country?</label>
                                                            <div className="flex gap-4">
                                                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                    <input type="radio" name="bgVisa" checked={newStudent.background.visaRefusal === 'No'} onChange={() => setNewStudent({ ...newStudent, background: { ...newStudent.background, visaRefusal: 'No' } })} className="w-4 h-4 text-emerald-500" /> No
                                                                </label>
                                                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                    <input type="radio" name="bgVisa" checked={newStudent.background.visaRefusal === 'Yes'} onChange={() => setNewStudent({ ...newStudent, background: { ...newStudent.background, visaRefusal: 'Yes' } })} className="w-4 h-4 text-emerald-500" /> Yes
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-4">
                                                            <select value={newStudent.background.visaRefusalDetails.split('|')[0] || ""} disabled={newStudent.background.visaRefusal === 'No'} onChange={e => setNewStudent({ ...newStudent, background: { ...newStudent.background, visaRefusalDetails: `${e.target.value}|${newStudent.background.visaRefusalDetails.split('|')[1] || ""}` } })} className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${newStudent.background.visaRefusal === 'No' ? 'opacity-50 grayscale' : ''}`}><option value="">Select Country</option><option value="USA">USA</option><option value="UK">UK</option></select>
                                                            <input type="text" value={newStudent.background.visaRefusalDetails.split('|')[1] || ""} disabled={newStudent.background.visaRefusal === 'No'} onChange={e => setNewStudent({ ...newStudent, background: { ...newStudent.background, visaRefusalDetails: `${newStudent.background.visaRefusalDetails.split('|')[0] || ""}|${e.target.value}` } })} className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${newStudent.background.visaRefusal === 'No' ? 'opacity-50 grayscale' : ''}`} placeholder="Type of Visa" />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="text-[10px] font-black text-slate-700 mb-2 block">Has applicant ever been convicted of a criminal offence?</label>
                                                            <div className="flex gap-4">
                                                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                    <input type="radio" name="bgCrime" checked={newStudent.background.criminalOffence === 'No'} onChange={() => setNewStudent({ ...newStudent, background: { ...newStudent.background, criminalOffence: 'No' } })} className="w-4 h-4 text-emerald-500" /> No
                                                                </label>
                                                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                    <input type="radio" name="bgCrime" checked={newStudent.background.criminalOffence === 'Yes'} onChange={() => setNewStudent({ ...newStudent, background: { ...newStudent.background, criminalOffence: 'Yes' } })} className="w-4 h-4 text-emerald-500" /> Yes
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div><input type="text" value={newStudent.background.criminalOffenceDetails} disabled={newStudent.background.criminalOffence === 'No'} onChange={e => setNewStudent({ ...newStudent, background: { ...newStudent.background, criminalOffenceDetails: e.target.value } })} className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${newStudent.background.criminalOffence === 'No' ? 'opacity-50 grayscale' : ''}`} placeholder="Specify Here..." /></div>
                                                    </div>
                                                </div>
                                            </section>

                                            <div className="h-px bg-slate-100 my-8"></div>

                                            <section>
                                                <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                    <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">contact_emergency</span>
                                                    Important Contacts
                                                </div>
                                                <div className="mb-4">
                                                    <label className="text-[12px] font-black text-slate-900 block">Emergency Contacts</label>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Name*</label>
                                                        <input type="text" value={newStudent.emergencyContact.name} onChange={e => setNewStudent({ ...newStudent, emergencyContact: { ...newStudent.emergencyContact, name: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Name" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Phone*</label>
                                                        <div className="flex gap-2">
                                                            <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm flex items-center gap-2">🇮🇳 +91</div>
                                                            <input type="tel" value={newStudent.emergencyContact.phone} onChange={e => setNewStudent({ ...newStudent, emergencyContact: { ...newStudent.emergencyContact, phone: e.target.value } })} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Mobile Number" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Email*</label>
                                                        <input type="email" value={newStudent.emergencyContact.email} onChange={e => setNewStudent({ ...newStudent, emergencyContact: { ...newStudent.emergencyContact, email: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Email Address" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Relation with Applicant*</label>
                                                        <input type="text" value={newStudent.emergencyContact.relation} onChange={e => setNewStudent({ ...newStudent, emergencyContact: { ...newStudent.emergencyContact, relation: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Relation" />
                                                    </div>
                                                </div>
                                            </section>
                                        </form>
                                    )}

                                    {profileTab === 'academic' && (
                                        <div className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                                            <section>
                                                <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                    <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">school</span>
                                                    Education Summary
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country of Education*</label>
                                                        <select value={newStudent.academic.countryOfEducation} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, countryOfEducation: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="">Select Country</option><option value="India">India</option><option value="USA">USA</option><option value="UK">UK</option><option value="Canada">Canada</option></select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Highest Level of Education*</label>
                                                        <select value={newStudent.academic.highestLevel} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, highestLevel: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium appearance-none">
                                                            <option value="">Select Level</option>
                                                            <option value="Postgraduate">Postgraduate</option>
                                                            <option value="Undergraduate">Undergraduate</option>
                                                            <option value="Grade 12">Grade 12 or equivalent</option>
                                                            <option value="Grade 10">Grade 10 or equivalent</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </section>

                                            {(newStudent.academic.highestLevel === 'Postgraduate') && (
                                                <>
                                                    <div className="h-px bg-slate-100 my-8"></div>
                                                    <section>
                                                        <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                            <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">workspace_premium</span>
                                                            Post Graduate
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country of Study*</label>
                                                                <select value={newStudent.academic.postgrad.country} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, postgrad: { ...newStudent.academic.postgrad, country: e.target.value, state: "" } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                                <option value="">Select Country</option>
                                                                {getAllCountries().map(country => (
                                                                    <option key={country} value={country}>{country}</option>
                                                                ))}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">State of Study*</label>
                                                                <select value={newStudent.academic.postgrad.state} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, postgrad: { ...newStudent.academic.postgrad, state: e.target.value } } })} disabled={!newStudent.academic.postgrad.country} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                                                <option value="">Select State</option>
                                                                {newStudent.academic.postgrad.country && getStatesByCountry(newStudent.academic.postgrad.country).map(state => (
                                                                    <option key={state} value={state}>{state}</option>
                                                                ))}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Level of Study*</label>
                                                                <select value={newStudent.academic.postgrad.qualification} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, postgrad: { ...newStudent.academic.postgrad, qualification: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="Postgraduate">Postgraduate</option></select>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Name of University*</label>
                                                                <input type="text" value={newStudent.academic.postgrad.university} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, postgrad: { ...newStudent.academic.postgrad, university: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Name of University" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Qualification Achieved/Degree Awarded</label>
                                                                <input type="text" value={newStudent.academic.postgrad.qualification} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, postgrad: { ...newStudent.academic.postgrad, qualification: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Qualification Achieved / Degree Awarded" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">City of Study*</label>
                                                                <input type="text" value={newStudent.academic.postgrad.city} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, postgrad: { ...newStudent.academic.postgrad, city: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter City of Study" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Grading System*</label>
                                                                <select value={newStudent.academic.postgrad.grading} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, postgrad: { ...newStudent.academic.postgrad, grading: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="">Select...</option><option value="CGPA">CGPA</option><option value="Percentage">Percentage</option></select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Percentage*</label>
                                                                <input type="text" value={newStudent.academic.postgrad.percentage} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, postgrad: { ...newStudent.academic.postgrad, percentage: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Percentage" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Primary Language of Instruction*</label>
                                                                <input type="text" value={newStudent.academic.postgrad.language} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, postgrad: { ...newStudent.academic.postgrad, language: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Primary Language of Instruction" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 max-w-lg">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Start Date*</label>
                                                                <input type="date" value={newStudent.academic.postgrad.startDate} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, postgrad: { ...newStudent.academic.postgrad, startDate: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">End Date*</label>
                                                                <input type="date" value={newStudent.academic.postgrad.endDate} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, postgrad: { ...newStudent.academic.postgrad, endDate: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                                            </div>
                                                        </div>
                                                        <div className="mt-6 flex justify-center md:justify-start">
                                                            <button type="button" onClick={() => alert('Postgraduate details saved to local state.')} className="px-10 py-3 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20">Save</button>
                                                        </div>
                                                    </section>
                                                </>
                                            )}

                                            {(['Postgraduate', 'Undergraduate'].includes(newStudent.academic.highestLevel)) && (
                                                <>
                                                    <div className="h-px bg-slate-100 my-8"></div>
                                                    <section>
                                                        <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                            <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">menu_book</span>
                                                            Undergraduate
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country of Study*</label>
                                                                <select value={newStudent.academic.undergrad.country} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, undergrad: { ...newStudent.academic.undergrad, country: e.target.value, state: "" } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                                <option value="">Select Country</option>
                                                                {getAllCountries().map(country => (
                                                                    <option key={country} value={country}>{country}</option>
                                                                ))}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">State of Study*</label>
                                                                <select value={newStudent.academic.undergrad.state} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, undergrad: { ...newStudent.academic.undergrad, state: e.target.value } } })} disabled={!newStudent.academic.undergrad.country} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                                                <option value="">Select State</option>
                                                                {newStudent.academic.undergrad.country && getStatesByCountry(newStudent.academic.undergrad.country).map(state => (
                                                                    <option key={state} value={state}>{state}</option>
                                                                ))}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Level of Study*</label>
                                                                <select value={newStudent.academic.undergrad.qualification} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, undergrad: { ...newStudent.academic.undergrad, qualification: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="Undergraduate">Undergraduate</option></select>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Name of University*</label>
                                                                <input type="text" value={newStudent.academic.undergrad.university} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, undergrad: { ...newStudent.academic.undergrad, university: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Name of University" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Qualification Achieved/Degree Awarded</label>
                                                                <input type="text" value={newStudent.academic.undergrad.qualification} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, undergrad: { ...newStudent.academic.undergrad, qualification: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Qualification Achieved / Degree Awarded" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">City of Study*</label>
                                                                <input type="text" value={newStudent.academic.undergrad.city} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, undergrad: { ...newStudent.academic.undergrad, city: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter City of Study" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Grading System*</label>
                                                                <select value={newStudent.academic.undergrad.grading} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, undergrad: { ...newStudent.academic.undergrad, grading: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="">Select...</option><option value="CGPA">CGPA</option><option value="Percentage">Percentage</option></select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Score(UG)*</label>
                                                                <input type="text" value={newStudent.academic.undergrad.score} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, undergrad: { ...newStudent.academic.undergrad, score: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Score" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Primary Language of Instruction*</label>
                                                                <input type="text" value={newStudent.academic.undergrad.language} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, undergrad: { ...newStudent.academic.undergrad, language: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Primary Language of Instruction" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Backlogs</label>
                                                                <input type="text" value={newStudent.academic.undergrad.backlogs} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, undergrad: { ...newStudent.academic.undergrad, backlogs: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Backlogs" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Start Date*</label>
                                                                <input type="date" value={newStudent.academic.undergrad.startDate} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, undergrad: { ...newStudent.academic.undergrad, startDate: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">End Date*</label>
                                                                <input type="date" value={newStudent.academic.undergrad.endDate} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, undergrad: { ...newStudent.academic.undergrad, endDate: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                                            </div>
                                                        </div>
                                                        <div className="mt-6 flex justify-center md:justify-start">
                                                            <button type="button" onClick={() => alert('Undergraduate details saved.')} className="px-10 py-3 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20">Save</button>
                                                        </div>
                                                    </section>
                                                </>
                                            )}

                                            {(['Postgraduate', 'Undergraduate', 'Grade 12'].includes(newStudent.academic.highestLevel)) && (
                                                <>
                                                    <div className="h-px bg-slate-100 my-8"></div>
                                                    <section>
                                                        <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                            <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">school</span>
                                                            Grade 12th or equivalent education
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country of Study*</label>
                                                                <select value={newStudent.academic.grade12.country} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade12: { ...newStudent.academic.grade12, country: e.target.value, state: "" } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                                <option value="">Select Country</option>
                                                                {getAllCountries().map(country => (
                                                                    <option key={country} value={country}>{country}</option>
                                                                ))}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">State of Study*</label>
                                                                <select value={newStudent.academic.grade12.state} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade12: { ...newStudent.academic.grade12, state: e.target.value } } })} disabled={!newStudent.academic.grade12.country} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                                                <option value="">Select State</option>
                                                                {newStudent.academic.grade12.country && getStatesByCountry(newStudent.academic.grade12.country).map(state => (
                                                                    <option key={state} value={state}>{state}</option>
                                                                ))}
                                                                </select>
                                                            </div>

                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Name of Board*</label>
                                                                <input type="text" value={newStudent.academic.grade12.board} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade12: { ...newStudent.academic.grade12, board: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Name of Board" />
                                                            </div>

                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Name of the institution*</label>
                                                                <input type="text" value={newStudent.academic.grade12.institution} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade12: { ...newStudent.academic.grade12, institution: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Name of the institution" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">City of Study*</label>
                                                                <input type="text" value={newStudent.academic.grade12.city} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade12: { ...newStudent.academic.grade12, city: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter City of Study" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Grading System*</label>
                                                                <select value={newStudent.academic.grade12.grading} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade12: { ...newStudent.academic.grade12, grading: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="">Select...</option><option value="CGPA">CGPA</option><option value="Percentage">Percentage</option></select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Score(12th)*</label>
                                                                <input type="text" value={newStudent.academic.grade12.score} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade12: { ...newStudent.academic.grade12, score: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Score" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Primary Language of Instruction*</label>
                                                                <input type="text" value={newStudent.academic.grade12.language} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade12: { ...newStudent.academic.grade12, language: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Primary Language of Instruction" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 max-w-lg">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Start Date*</label>
                                                                <input type="date" value={newStudent.academic.grade12.startDate} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade12: { ...newStudent.academic.grade12, startDate: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">End Date*</label>
                                                                <input type="date" value={newStudent.academic.grade12.endDate} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade12: { ...newStudent.academic.grade12, endDate: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                                            </div>
                                                        </div>
                                                        <div className="mt-6 flex justify-center md:justify-start">
                                                            <button type="button" onClick={() => alert('Grade 12th details saved.')} className="px-10 py-3 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20">Save</button>
                                                        </div>
                                                    </section>
                                                </>
                                            )}

                                            {(['Postgraduate', 'Undergraduate', 'Grade 12', 'Grade 10'].includes(newStudent.academic.highestLevel)) && (
                                                <>
                                                    <div className="h-px bg-slate-100 my-8"></div>
                                                    <section>
                                                        <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                            <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">school</span>
                                                            Grade 10th or equivalent
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country of Study*</label>
                                                                <select value={newStudent.academic.grade10.country} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade10: { ...newStudent.academic.grade10, country: e.target.value, state: "" } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                                <option value="">Select Country</option>
                                                                {getAllCountries().map(country => (
                                                                    <option key={country} value={country}>{country}</option>
                                                                ))}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">State of Study*</label>
                                                                <select value={newStudent.academic.grade10.state} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade10: { ...newStudent.academic.grade10, state: e.target.value } } })} disabled={!newStudent.academic.grade10.country} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                                                <option value="">Select State</option>
                                                                {newStudent.academic.grade10.country && getStatesByCountry(newStudent.academic.grade10.country).map(state => (
                                                                    <option key={state} value={state}>{state}</option>
                                                                ))}
                                                                </select>
                                                            </div>

                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Name of Board*</label>
                                                                <input type="text" value={newStudent.academic.grade10.board} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade10: { ...newStudent.academic.grade10, board: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Name of Board" />
                                                            </div>

                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Name of the institution*</label>
                                                                <input type="text" value={newStudent.academic.grade10.institution} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade10: { ...newStudent.academic.grade10, institution: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Name of the institution" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">City of Study*</label>
                                                                <input type="text" value={newStudent.academic.grade10.city} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade10: { ...newStudent.academic.grade10, city: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter City of Study" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Grading System*</label>
                                                                <select value={newStudent.academic.grade10.grading} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade10: { ...newStudent.academic.grade10, grading: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="">Select...</option><option value="CGPA">CGPA</option><option value="Percentage">Percentage</option></select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Score(10th)*</label>
                                                                <input type="text" value={newStudent.academic.grade10.score} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade10: { ...newStudent.academic.grade10, score: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Score" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Primary Language of Instruction*</label>
                                                                <input type="text" value={newStudent.academic.grade10.language} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade10: { ...newStudent.academic.grade10, language: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Primary Language of Instruction" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 max-w-lg">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Start Date*</label>
                                                                <input type="date" value={newStudent.academic.grade10.startDate} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade10: { ...newStudent.academic.grade10, startDate: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">End Date*</label>
                                                                <input type="date" value={newStudent.academic.grade10.endDate} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, grade10: { ...newStudent.academic.grade10, endDate: e.target.value } } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                                                            </div>
                                                        </div>
                                                        <div className="mt-6 flex justify-center md:justify-start">
                                                            <button type="button" onClick={() => { alert('All academic details saved to profile.'); setProfileTab('work'); }} className="px-10 py-3 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20">Save & Continue</button>
                                                        </div>
                                                        <div className="mt-8 flex justify-center border-t border-dashed border-slate-200 pt-6">
                                                            <button type="button" className="flex items-center gap-2 text-emerald-600 text-sm font-bold hover:text-emerald-700 transition-all">
                                                                <span className="material-symbols-outlined text-white bg-emerald-500 rounded-full text-[16px] p-0.5">add</span>
                                                                Add Another
                                                            </button>
                                                        </div>
                                                    </section>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {profileTab === 'work' && (
                                        <div className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                                            <section>
                                                <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                    <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">work</span>
                                                    Professional Experience
                                                </div>
                                                {newStudent.workExperience.map((exp, index) => (
                                                    <div key={index} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl mb-6 relative group">
                                                        {index > 0 && (
                                                            <button 
                                                                type="button" 
                                                                onClick={() => {
                                                                    const newExp = [...newStudent.workExperience];
                                                                    newExp.splice(index, 1);
                                                                    setNewStudent({ ...newStudent, workExperience: newExp });
                                                                }}
                                                                className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">close</span>
                                                            </button>
                                                        )}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Employer / Company*</label>
                                                                <input type="text" value={exp.employer} onChange={e => {
                                                                    const newExp = [...newStudent.workExperience];
                                                                    newExp[index].employer = e.target.value;
                                                                    setNewStudent({ ...newStudent, workExperience: newExp });
                                                                }} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="e.g. Google" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Job Title / Role*</label>
                                                                <input type="text" value={exp.role} onChange={e => {
                                                                    const newExp = [...newStudent.workExperience];
                                                                    newExp[index].role = e.target.value;
                                                                    setNewStudent({ ...newStudent, workExperience: newExp });
                                                                }} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="e.g. Software Engineer" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country*</label>
                                                                <select value={exp.country} onChange={e => {
                                                                    const newExp = [...newStudent.workExperience];
                                                                    newExp[index].country = e.target.value;
                                                                    setNewStudent({ ...newStudent, workExperience: newExp });
                                                                }} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                                                                    <option value="">Select Country</option>
                                                                    {getAllCountries().map(country => (
                                                                        <option key={country} value={country}>{country}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Start Date*</label>
                                                                <input type="date" value={exp.startDate} onChange={e => {
                                                                    const newExp = [...newStudent.workExperience];
                                                                    newExp[index].startDate = e.target.value;
                                                                    setNewStudent({ ...newStudent, workExperience: newExp });
                                                                }} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-600" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">End Date</label>
                                                                <input type="date" value={exp.endDate} disabled={exp.current} onChange={e => {
                                                                    const newExp = [...newStudent.workExperience];
                                                                    newExp[index].endDate = e.target.value;
                                                                    setNewStudent({ ...newStudent, workExperience: newExp });
                                                                }} className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 ${exp.current ? 'opacity-50' : ''}`} />
                                                            </div>
                                                        </div>
                                                        <div className="mt-4">
                                                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                                                                <input type="checkbox" checked={exp.current} onChange={e => {
                                                                    const newExp = [...newStudent.workExperience];
                                                                    newExp[index].current = e.target.checked;
                                                                    if (e.target.checked) newExp[index].endDate = "";
                                                                    setNewStudent({ ...newStudent, workExperience: newExp });
                                                                }} className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
                                                                I currently work here
                                                            </label>
                                                        </div>
                                                    </div>
                                                ))}
                                                <button 
                                                    type="button" 
                                                    onClick={() => setNewStudent({ ...newStudent, workExperience: [...newStudent.workExperience, { employer: "", role: "", country: "", startDate: "", endDate: "", current: false }] })}
                                                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-bold uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/30 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                                    Add Experience
                                                </button>
                                                <div className="mt-8 flex justify-end">
                                                    <button type="button" onClick={() => { alert('Work experience saved.'); setProfileTab('tests'); }} className="px-10 py-3 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20">Save & Continue</button>
                                                </div>
                                            </section>
                                        </div>
                                    )}

                                    {profileTab === 'tests' && (
                                        <div className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                                            <section>
                                                <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                    <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">terminal</span>
                                                    Standardized Test Scores
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                    <div className="space-y-4">
                                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">English Proficiency</h4>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <label className="text-[10px] font-bold text-slate-500 mb-1 block">IELTS Score</label>
                                                                <input type="text" value={newStudent.tests.ielts} onChange={e => setNewStudent({ ...newStudent, tests: { ...newStudent.tests, ielts: e.target.value } })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="0.0" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-slate-500 mb-1 block">TOEFL Score</label>
                                                                <input type="text" value={newStudent.tests.toefl} onChange={e => setNewStudent({ ...newStudent, tests: { ...newStudent.tests, toefl: e.target.value } })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="0" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-slate-500 mb-1 block">PTE Score</label>
                                                                <input type="text" value={newStudent.tests.pte} onChange={e => setNewStudent({ ...newStudent, tests: { ...newStudent.tests, pte: e.target.value } })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="0" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Aptitude Tests</h4>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <label className="text-[10px] font-bold text-slate-500 mb-1 block">GRE Score</label>
                                                                <input type="text" value={newStudent.tests.gre} onChange={e => setNewStudent({ ...newStudent, tests: { ...newStudent.tests, gre: e.target.value } })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="0" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-slate-500 mb-1 block">GMAT Score</label>
                                                                <input type="text" value={newStudent.tests.gmat} onChange={e => setNewStudent({ ...newStudent, tests: { ...newStudent.tests, gmat: e.target.value } })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="0" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-slate-500 mb-1 block">SAT Score</label>
                                                                <input type="text" value={newStudent.tests.sat} onChange={e => setNewStudent({ ...newStudent, tests: { ...newStudent.tests, sat: e.target.value } })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="0" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-center text-center">
                                                        <span className="material-symbols-outlined text-[40px] text-slate-300 mb-4">info</span>
                                                        <p className="text-xs text-slate-500 leading-relaxed font-medium">Standardized test scores help in determining the eligibility for various universities and visa requirements.</p>
                                                    </div>
                                                </div>
                                                <div className="mt-8 flex justify-end">
                                                    <button type="button" onClick={() => { alert('Profile details complete!'); setOnboardStep(3); }} className="px-10 py-3 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20">Finalize & Upload Documents</button>
                                                </div>
                                            </section>
                                        </div>
                                    )}
                                    
                                    {/* Action buttons fixed at bottom */}
                                    <div className="sticky bottom-0 mt-8 py-4 bg-[#f8fafc] border-t border-slate-200 flex justify-between items-center z-10">
                                        <button type="button" onClick={resetOnboardModal} className="px-6 py-3 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-900 transition-all">Cancel</button>
                                        <div className="flex gap-4">
                                            {onboardStep === 2 && profileTab === 'personal' && (
                                                <button form="profile-personal-form" type="submit" disabled={createLoading} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50">
                                                    {createLoading ? 'Saving...' : 'Save Changes'}
                                                </button>
                                            )}
                                            {onboardStep === 2 && profileTab === 'academic' && (
                                                <button type="button" onClick={() => setOnboardStep(3)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2">
                                                    Proceed to Documents
                                                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : onboardStep === 3 ? (
                                /* STEP 3: Documents */
                                <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300 pb-12 mt-4">
                                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                                        <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[24px]">folder_managed</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-900">Applicant Documents</h3>
                                                    <p className="text-xs text-slate-500">Verify existing uploads or add missing documents.</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const userId = createdUser?.id || createdUser?.uid || createdUser?._id;
                                                    if (userId) fetchUserDocuments(userId);
                                                }}
                                                disabled={docsLoading}
                                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                                            >
                                                <span className={`material-symbols-outlined text-[18px] ${docsLoading ? 'animate-spin' : ''}`}>sync</span>
                                                {docsLoading ? 'Syncing...' : 'Fetch from Student Profile'}
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            {[
                                                { name: "Passport (Front & Back)", type: "passport", required: true },
                                                { name: "National ID / Aadhar Card", type: "national_id", required: true },
                                                { name: "10th Marksheet", type: "marksheet_10", required: true },
                                                { name: "12th Marksheet", type: "marksheet_12", required: newStudent.academic.highestLevel !== 'Grade 10' },
                                                { name: "Undergraduate Transcript", type: "ug_transcript", required: ['Undergraduate', 'Postgraduate'].includes(newStudent.academic.highestLevel) },
                                                { name: "Undergraduate Degree", type: "ug_degree", required: ['Undergraduate', 'Postgraduate'].includes(newStudent.academic.highestLevel) },
                                                { name: "Postgraduate Transcript", type: "pg_transcript", required: newStudent.academic.highestLevel === 'Postgraduate' },
                                                { name: "Postgraduate Degree", type: "pg_degree", required: newStudent.academic.highestLevel === 'Postgraduate' },
                                                { name: "IELTS / TOEFL / PTE Score Card", type: "english_test", required: (newStudent.tests.ielts || newStudent.tests.toefl || newStudent.tests.pte) ? true : false },
                                                { name: "GRE / GMAT / SAT Score Card", type: "aptitude_test", required: (newStudent.tests.gre || newStudent.tests.gmat || newStudent.tests.sat) ? true : false },
                                                { name: "Work Experience Letters", type: "work_letters", required: newStudent.workExperience.some(exp => exp.employer !== "") },
                                                { name: "Resume / CV", type: "resume", required: true },
                                                { name: "Statement of Purpose (SOP)", type: "sop", required: true },
                                                { name: "Letters of Recommendation (LOR)", type: "lor", required: true },
                                            ].filter(doc => doc.required).map((doc, i) => {
                                                const existingDoc = userDocuments.find(ud => ud.docType === doc.type || ud.type === doc.type);
                                                return (
                                                    <div key={i} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${existingDoc ? 'bg-emerald-50/30 border-emerald-100 shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${existingDoc ? 'bg-white text-emerald-500 border border-emerald-100' : 'bg-white border border-slate-200 text-slate-400'}`}>
                                                                <span className="material-symbols-outlined text-[20px]">{existingDoc ? 'task_alt' : 'description'}</span>
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                                                                    {existingDoc && (
                                                                        <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded leading-none">In Profile</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-3 mt-0.5">
                                                                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Required</p>
                                                                    {existingDoc && (
                                                                        <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                                                            <span className="material-symbols-outlined text-[12px]">cloud_done</span>
                                                                            Ready for verification
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {existingDoc ? (
                                                                <>
                                                                    <button onClick={() => window.open(existingDoc.filePath || existingDoc.url, '_blank')} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
                                                                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                                                                        Review
                                                                    </button>
                                                                    <button 
                                                                        onClick={async () => {
                                                                            try {
                                                                                const userId = createdUser?.id || createdUser?.uid || createdUser?._id;
                                                                                if (!userId) return;
                                                                                // Update document status in profile
                                                                                await authApi.uploadDocument({
                                                                                    userId: userId,
                                                                                    docType: doc.type,
                                                                                    uploaded: true,
                                                                                    filePath: existingDoc.filePath
                                                                                });
                                                                                alert(`✅ ${doc.name} verified and updated in user profile!`);
                                                                                fetchUserDocuments(userId);
                                                                            } catch (e) {
                                                                                alert("Failed to update verification status");
                                                                            }
                                                                        }}
                                                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md shadow-emerald-600/10"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[16px]">verified</span>
                                                                        Verify
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button className="px-5 py-2.5 bg-white border border-indigo-100 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-all flex items-center gap-2">
                                                                    <span className="material-symbols-outlined text-[16px]">upload</span>
                                                                    Upload
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    
                                    <div className="sticky bottom-0 mt-8 py-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center z-10 px-8 rounded-b-2xl">
                                        <button type="button" onClick={() => setOnboardStep(2)} className="px-8 py-3.5 text-slate-600 font-bold text-[12px] uppercase tracking-widest hover:text-slate-900 transition-all flex items-center gap-2 bg-white border border-slate-200 rounded-2xl">
                                            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                                            Back to Profile
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={handleFinalOnboardSubmit} 
                                            disabled={createLoading}
                                            className="px-10 py-3.5 bg-emerald-600 text-white rounded-2xl font-bold text-[12px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center gap-2 group disabled:opacity-50"
                                        >
                                            {createLoading ? 'Finalizing...' : 'Complete Onboarding'}
                                            {!createLoading && <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">verified</span>}
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                        
                        {/* Step 1 Footer */}
                        {onboardStep === 1 && (
                            <div className="p-8 bg-slate-50 border-t border-slate-200 flex justify-end gap-4 shrink-0">
                                <button type="button" onClick={resetOnboardModal} className="px-8 py-3.5 text-slate-500 font-bold text-[12px] uppercase tracking-widest hover:text-slate-900 transition-all border border-slate-200 bg-white rounded-2xl hover:shadow-md">Cancel</button>
                                <button form="quick-register-form" type="submit" disabled={createLoading} className="px-10 py-3.5 bg-emerald-600 text-white rounded-2xl font-bold text-[12px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-3 group">
                                    {createLoading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Register Applicant"}
                                    {!createLoading && <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>}
                                </button>
                            </div>
                        )}
                        </div>
                    )}
                    
{/* Document Pull & Share */}
                    {activeSection === "applicants" && (
                        <div className="animate-fade-in max-w-[1400px] mx-auto space-y-6">
                            <div className="border-b border-slate-100 pb-6">
                                <h2 className="text-[28px] font-black text-slate-900 tracking-tight mb-2">
                                    Pull & Share Student Documents
                                </h2>
                                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                    Direct workflow: Select student → Pull documents → Share with bank
                                </p>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-xl">🎓</div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Active Students</p>
                                            <p className="text-[24px] font-black text-slate-900 mt-1">{stats.users?.total || 0}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-xl">📄</div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Documents Pulled</p>
                                            <p className="text-[24px] font-black text-slate-900 mt-1">0</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-xl">🏦</div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Shared with Banks</p>
                                            <p className="text-[24px] font-black text-slate-900 mt-1">0</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Action Button */}
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-8 text-center">
                                <div className="mb-4">
                                    <span className="text-6xl">📤</span>
                                </div>
                                <h3 className="text-[20px] font-black text-slate-900 mb-2">
                                    Start Pulling & Sharing
                                </h3>
                                <p className="text-[13px] text-slate-600 mb-6 max-w-[400px] mx-auto">
                                    Click below to select a student, pull their documents, and share them directly with a bank in just 3 steps.
                                </p>
                                <button
                                    onClick={() => setShowPullModal(true)}
                                    className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:shadow-xl transition-all flex items-center gap-3 mx-auto shadow-lg"
                                >
                                    <span className="material-symbols-outlined text-[20px]">download</span>
                                    Open Pull & Share Modal
                                </button>
                            </div>

                            {/* Workflow Steps */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white border border-slate-200 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">1</div>
                                        <span className="material-symbols-outlined text-indigo-600">person_search</span>
                                    </div>
                                    <h4 className="text-[13px] font-bold text-slate-900 mb-2">Select Student</h4>
                                    <p className="text-[11px] text-slate-500">Choose the student whose documents you want to pull and share.</p>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">2</div>
                                        <span className="material-symbols-outlined text-purple-600">description</span>
                                    </div>
                                    <h4 className="text-[13px] font-bold text-slate-900 mb-2">Pull Documents</h4>
                                    <p className="text-[11px] text-slate-500">Review and select which documents to share from the student's profile.</p>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">3</div>
                                        <span className="material-symbols-outlined text-emerald-600">business</span>
                                    </div>
                                    <h4 className="text-[13px] font-bold text-slate-900 mb-2">Share with Bank</h4>
                                    <p className="text-[11px] text-slate-500">Select the target bank and instantly share the documents.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab Selection Content */}
                    {activeSection === "overview" && (
                        <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Operational Overview</h2>
                                    <p className="text-slate-500 text-[11px] mt-1 font-medium flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                        Synced: {format(new Date(), 'MMM do, yyyy')}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                                        className={`px-3 py-1.5 rounded border text-[11px] font-medium transition-all flex items-center gap-1.5 shadow-sm ${autoRefreshEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        <span className="material-symbols-outlined text-[14px]">{autoRefreshEnabled ? 'sync' : 'sync_disabled'}</span>
                                        {autoRefreshEnabled ? 'Live' : 'Paused'}
                                    </button>
                                    <button
                                        onClick={() => { loadOverview(); setLastRefresh(new Date()); }}
                                        className="px-3 py-1.5 rounded bg-white border border-slate-200 text-slate-700 font-medium text-[11px] hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">refresh</span>
                                        Refresh
                                    </button>
                                    <button onClick={() => setActiveSection('onboarding')} className="px-3 py-1.5 rounded bg-white border border-slate-200 text-slate-700 font-medium text-[11px] hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-1.5 shadow-sm">
                                        <span className="material-symbols-outlined text-[16px]">person_add</span> Add Student
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard label="Total Applications" value={stats.apps?.total} icon="analytics" color="text-indigo-600" loading={loading} />
                                <StatCard label="Awaiting Review" value={pendingCount} icon="hourglass_empty" color="text-amber-600" loading={loading} hint="Action Needed" />
                                <StatCard label="Approval Rate" value={`${approvalRate}%`} icon="verified" color="text-emerald-600" loading={loading} trend={approvalRate > 50 ? 5 : -3} />
                                <StatCard label="Total Users" value={stats.users?.total ?? 0} icon="group" color="text-slate-600" loading={loading} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {/* Pipeline Breakdown */}
                                <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                                    <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-slate-400 text-[16px]">donut_large</span>
                                        Application Pipeline
                                    </h3>
                                    <div className="space-y-3">
                                        {Object.entries(stats.apps?.statusStats || {}).sort(([, a]: any, [, b]: any) => b - a).map(([status, value]: any) => {
                                            let color = "bg-slate-500", textColor = "text-slate-700", bg = "bg-slate-50";
                                            if (['approved', 'disbursed'].includes(status)) { color = "bg-emerald-500"; textColor = "text-emerald-700"; bg = "bg-emerald-50"; }
                                            else if (['pending', 'submitted', 'documents_pending', 'draft'].includes(status)) { color = "bg-amber-400"; textColor = "text-amber-700"; bg = "bg-amber-50"; }
                                            else if (status === 'processing') { color = "bg-indigo-500"; textColor = "text-indigo-700"; bg = "bg-indigo-50"; }
                                            else if (['rejected', 'cancelled'].includes(status)) { color = "bg-rose-500"; textColor = "text-rose-700"; bg = "bg-rose-50"; }
                                            const label = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
                                            const total = totalApps || 1;
                                            return (
                                                <div key={label}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[12px] font-medium text-slate-700">{label}</span>
                                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${bg} ${textColor}`}>{value} / {total}</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                        <div className={`${color} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${Math.round((value / total) * 100)}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {Object.keys(stats.apps?.statusStats || {}).length === 0 && !loading && (
                                            <div className="text-[12px] font-medium text-slate-500 text-center py-2">No pipeline data available</div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100">
                                        <div className="text-center">
                                            <p className="text-lg font-semibold text-slate-900">{approvedCount + rejectedCount}</p>
                                            <p className="text-[10px] font-medium text-slate-400 mt-0.5">Processed</p>
                                        </div>
                                        <div className="text-center border-x border-slate-100">
                                            <p className="text-lg font-semibold text-slate-900">{Number(stats.users?.total ?? 0)}</p>
                                            <p className="text-[10px] font-medium text-slate-400 mt-0.5">Users</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-semibold text-rose-600">{rejectedCount + Number(stats.apps?.cancelled ?? 0)}</p>
                                            <p className="text-[10px] font-medium text-slate-400 mt-0.5">Rejected</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Activity Feed + Quick Actions */}
                                <div className="space-y-4">
                                    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                                        <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Recent Activity</h3>
                                        <div className="space-y-2.5">
                                            {recentActivity.map(a => (
                                                <div key={a.id} className="flex items-start gap-2.5">
                                                    <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${a.color}`}>
                                                        <span className="material-symbols-outlined text-[14px]">{a.icon}</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] font-medium text-slate-800 leading-snug">{a.msg}</p>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">{a.time}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <button onClick={() => { setActiveSection('chat_customer'); setAutoStartUser(null); }} className="w-full text-left p-3 rounded border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex items-center gap-3 bg-white shadow-sm">
                                            <span className="material-symbols-outlined text-indigo-500 text-[18px]">forum</span>
                                            <span className="text-[12px] font-medium text-slate-800">Support Chat</span>
                                            <span className="material-symbols-outlined text-slate-300 ml-auto text-[14px]">arrow_forward_ios</span>
                                        </button>
                                        <button onClick={() => setActiveSection('applicants')} className="w-full text-left p-3 rounded border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all flex items-center gap-3 bg-white shadow-sm">
                                            <span className="material-symbols-outlined text-emerald-500 text-[18px]">manage_accounts</span>
                                            <span className="text-[12px] font-medium text-slate-800">Applicant Profiles</span>
                                            <span className="material-symbols-outlined text-slate-300 ml-auto text-[14px]">arrow_forward_ios</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === "tasks" && (
                        <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Action Items</h2>
                                    <p className="text-slate-500 text-[11px] mt-1 font-medium">Daily tasks & follow-ups</p>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm max-w-3xl">
                                <form onSubmit={(e) => { e.preventDefault(); addTask(); }} className="flex gap-3 mb-5">
                                    <input
                                        type="text"
                                        placeholder="Add a new task..."
                                        value={newTaskTitle}
                                        onChange={e => setNewTaskTitle(e.target.value)}
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded text-[12px] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-700"
                                    />
                                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded text-[11px] font-medium hover:bg-indigo-700 transition-all shadow-sm">Add Task</button>
                                </form>
                                <div className="space-y-2">
                                    {tasks.map(task => (
                                        <div key={task.id} className={`flex items-center gap-3 p-3 rounded border transition-all group ${task.completed ? 'bg-slate-50/50 border-slate-100 text-slate-400' : 'bg-white border-slate-200 hover:border-indigo-200'}`}>
                                            <button onClick={() => toggleTask(task.id)} className={`w-5 h-5 rounded flex items-center justify-center transition-all flex-shrink-0 ${task.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-transparent border border-slate-300 group-hover:border-indigo-400'}`}>
                                                <span className="material-symbols-outlined text-[14px]">check</span>
                                            </button>
                                            <span className={`flex-1 text-[13px] font-medium ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.title}</span>
                                            <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-400 hover:bg-rose-50 rounded transition-all">
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                            </button>
                                        </div>
                                    ))}
                                    {tasks.length === 0 && (
                                        <div className="text-center py-10">
                                            <span className="material-symbols-outlined text-3xl block mb-2 opacity-20 text-slate-400">task_alt</span>
                                            <p className="text-[11px] font-medium text-slate-400">All tasks completed</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === "performance" && (
                        <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Performance Metrics</h2>
                                    <p className="text-slate-500 text-[11px] mt-1 font-medium flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${autoRefreshEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                        {autoRefreshEnabled ? 'Live metrics' : 'Manual update'}
                                    </p>
                                </div>
                                <span className="px-3 py-1.5 rounded bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-700 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[14px]">trending_up</span>
                                    Top 10% Contributor
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard label="Applications Processed" value="342" icon="task" color="text-indigo-600" loading={false} trend={8} />
                                <StatCard label="Avg. Resolution Time" value="4.2 Hrs" icon="timer" color="text-amber-600" loading={false} />
                                <StatCard label="Customer Rating" value="4.9/5.0" icon="star" color="text-emerald-600" loading={false} trend={2} />
                                <StatCard label="Tasks Completed" value={tasks.filter(t => t.completed).length + 28} icon="fact_check" color="text-blue-600" loading={false} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                                    <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-slate-400 text-[16px]">target</span>
                                        Weekly Target Progress
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-[12px] font-medium text-slate-700">Application Reviews</span>
                                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">42 / 50</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '84%' }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-[12px] font-medium text-slate-700">Customer Queries Handled</span>
                                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">112 / 120</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '93%' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                                    <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-slate-400 text-[16px]">military_tech</span>
                                        Recent Achievements
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 p-3 rounded border border-amber-100 bg-amber-50/30">
                                            <div className="w-8 h-8 rounded bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                                <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-semibold text-slate-900">Speed Demon</p>
                                                <p className="text-[11px] text-slate-500">Resolved 10 applications under 1 hour</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded border border-emerald-100 bg-emerald-50/30">
                                            <div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                                <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-semibold text-slate-900">Perfect Score</p>
                                                <p className="text-[11px] text-slate-500">Maintained a 5.0 rating over 20 interactions</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === "communications" && (
                        <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Outreach Center</h2>
                                    <p className="text-slate-500 text-[11px] mt-1 font-medium">Direct & Bulk Communication</p>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm max-w-3xl">
                                <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-slate-400 text-[16px]">send</span>
                                    Compose Message
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex gap-1.5 p-1 bg-slate-100 rounded w-fit mb-4">
                                        <button
                                            onClick={() => setEmailData({ ...emailData, isBulk: false })}
                                            className={`px-3 py-1.5 rounded text-[11px] font-medium transition-all ${!emailData.isBulk ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Direct
                                        </button>
                                        <button
                                            onClick={() => setEmailData({ ...emailData, isBulk: true })}
                                            className={`px-3 py-1.5 rounded text-[11px] font-medium transition-all ${emailData.isBulk ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
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
                                                <option value="user">Applicants</option>
                                                <option value="bank">Banking Entities</option>
                                            </select>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Subject</label>
                                        <input type="text" value={emailData.subject} onChange={e => setEmailData({ ...emailData, subject: e.target.value })} placeholder="Re: Application Status Update" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-[12px] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Message</label>
                                        <textarea value={emailData.content} onChange={e => setEmailData({ ...emailData, content: e.target.value })} placeholder="Type your message here..." rows={5} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-[12px] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none" />
                                    </div>
                                    <button
                                        onClick={handleSendEmail}
                                        disabled={emailLoading}
                                        className="w-full bg-indigo-600 text-white py-2.5 rounded text-[11px] font-medium flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-sm"
                                    >
                                        {emailLoading ? <div className="w-4 h-4 border-2 border-indigo-400 border-t-white rounded-full animate-spin" /> : (<><span className="material-symbols-outlined text-[16px]">send</span> Send Message</>)}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {["applications", "blogs", "community", "users"].includes(activeSection) && (
                        <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 tracking-tight capitalize">{activeSection === 'community' ? 'Engagement Hub' : activeSection === 'blogs' ? 'Editorial Content' : activeSection === 'users' ? 'User Directory' : 'Active Pipeline'}</h2>
                                    <p className="text-slate-500 text-[11px] mt-1 font-medium flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${autoRefreshEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                        Last sync: {format(lastRefresh, 'HH:mm:ss')}
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={() => { loadData(); setLastRefresh(new Date()); }}
                                        className="px-3 py-1.5 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">refresh</span>
                                        Refresh
                                    </button>
                                    {activeSection === 'users' && (
                                        <button
                                            onClick={() => setActiveSection('onboarding')}
                                            className="px-3 py-1.5 bg-indigo-600 text-white text-[11px] font-medium rounded hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-1.5"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">person_add</span>
                                            Onboard Applicant
                                        </button>
                                    )}
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder={`Search ${activeSection}...`}
                                            className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-[12px] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-700 w-52"
                                        />
                                    </div>
                                    {activeSection === 'applications' && (
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="px-3 py-1.5 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none transition-all shadow-sm"
                                        >
                                            <option value="all">All Status</option>
                                            <option value="pending">Pending</option>
                                            <option value="processing">Processing</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-lg border border-slate-200 overflow-hidden shadow-sm bg-white">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <TableHeader>
                                            {activeSection === "blogs" && (
                                                <>
                                                    <th className="px-4 py-3">Document Metadata</th>
                                                    <th className="px-4 py-3 w-32">Status</th>
                                                    <th className="px-4 py-3 w-32 text-right">Engagement</th>
                                                    <th className="px-4 py-3 w-40 text-right">Administrative</th>
                                                </>
                                            )}
                                            {activeSection === "applications" && (
                                                <>
                                                    <th className="px-4 py-3 w-40">Ref ID</th>
                                                    <th className="px-4 py-3">Principal Identity</th>
                                                    <th className="px-4 py-3">Lender Entity</th>
                                                    <th className="px-4 py-3 w-32">State</th>
                                                    <th className="px-4 py-3 w-32 text-right">Actions</th>
                                                </>
                                            )}
                                            {activeSection === "users" && (
                                                <>
                                                    <th className="px-4 py-3">Identity Profile</th>
                                                    <th className="px-4 py-3">Contact Protocol</th>
                                                    <th className="px-4 py-3 w-32">ACL Role</th>
                                                    <th className="px-4 py-3 w-40">Record Created</th>
                                                    <th className="px-4 py-3 w-32 text-right">Comm</th>
                                                </>
                                            )}
                                            {activeSection === "community" && (
                                                <>
                                                    <th className="px-4 py-3">Broadcast Topic</th>
                                                    <th className="px-4 py-3 w-48">Transmitter</th>
                                                    <th className="px-4 py-3 w-32 text-right">Social Signal</th>
                                                    <th className="px-4 py-3 w-32 text-right">Action</th>
                                                </>
                                            )}
                                        </TableHeader>
                                        <tbody className="divide-y divide-slate-50">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={6} className="px-8 py-32 text-center">
                                                        <div className="flex flex-col items-center justify-center gap-4">
                                                            <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
                                                            <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase">Synchronizing Nodes...</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : filteredData.length > 0 ? filteredData.map((item, idx) => (
                                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                                    {activeSection === "blogs" && (
                                                        <>
                                                        <td className="px-4 py-3">
                                                                <p className="text-[14px] font-bold text-slate-900 tracking-tight leading-tight mb-1">{item.title}</p>
                                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Writer: {item.authorName}</p>
                                                            </td>
                                                        <td className="px-4 py-3">
                                                                <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${item.isPublished ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                                    {item.isPublished ? 'Live' : 'Draft'}
                                                                </span>
                                                            </td>
                                                        <td className="px-4 py-3 text-right font-black text-slate-900 tabular-nums">
                                                                {item.views || 0} UITS
                                                            </td>
                                                        <td className="px-4 py-3 text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <button onClick={() => window.open(`/blogs/${item.id || item._id}`, '_blank')} className="w-8 h-8 rounded bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 flex items-center justify-center transition-all shadow-sm" title="View Article">
                                                                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                                    </button>
                                                                    <button onClick={() => handleToggleBlogStatus(item)} className={`w-8 h-8 rounded bg-white border border-slate-200 ${item.isPublished ? 'text-amber-500 hover:text-amber-600' : 'text-emerald-500 hover:text-emerald-600'} hover:border-slate-300 flex items-center justify-center transition-all shadow-sm`} title={item.isPublished ? "Unpublish" : "Publish"}>
                                                                        <span className="material-symbols-outlined text-[18px]">{item.isPublished ? 'archive' : 'publish'}</span>
                                                                    </button>
                                                                    <button onClick={() => handleDeleteBlog(item.id || item._id)} className="w-8 h-8 rounded bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 flex items-center justify-center transition-all shadow-sm" title="Delete">
                                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    )}
                                                    {activeSection === "applications" && (
                                                            <>
                                                            <td className="px-4 py-3 font-black text-slate-400 text-[11px] tracking-widest tabular-nums uppercase">#{item.applicationNumber?.toString().slice(0, 8) || 'REF-ID-0'}</td>
                                                            <td className="px-4 py-3 font-bold text-slate-900 text-[14px] tracking-tight">{item.firstName} {item.lastName}</td>
                                                            <td className="px-4 py-3 font-bold text-slate-600 text-[13px] tracking-tight">{item.bank}</td>
                                                            <td className="px-4 py-3">
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-[0.1em] border ${
                                                                        item.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                                                        item.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                                                                        item.status === 'processing' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                                                                        'bg-amber-50 text-amber-700 border-amber-100'
                                                                    }`}>
                                                                        {item.status || 'Pending'}
                                                                    </span>
                                                                </td>
                                                            <td className="px-4 py-3 text-right">
                                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                                                        <button onClick={() => { setSelectedApp(item); setActionRemarks(""); }} className="w-8 h-8 rounded bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 flex items-center justify-center transition-all shadow-sm">
                                                                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                                        </button>
                                                                        {(item.status === 'pending' || item.status === 'processing') && (
                                                                            <>
                                                                                <button onClick={() => handleAppStatus(item.id, 'approved')} className="w-8 h-8 rounded bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-300 flex items-center justify-center transition-all shadow-sm">
                                                                                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                                                                </button>
                                                                                <button onClick={() => handleAppStatus(item.id, 'rejected')} className="w-8 h-8 rounded bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 flex items-center justify-center transition-all shadow-sm">
                                                                                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                        <button onClick={() => handleDeleteApplication(item.id)} className="w-8 h-8 rounded bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 flex items-center justify-center transition-all shadow-sm" title="Purge Record">
                                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </>
                                                        )}
                                                        {activeSection === "users" && (
                                                            <>
                                                            <td className="px-4 py-3 cursor-pointer" onClick={() => window.open(`/staff/users/${item.id || item._id}`, '_blank')}>
                                                                    <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.email}`} alt="" className="w-full h-full object-cover" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-[14px] font-bold text-slate-900 tracking-tight truncate underline hover:text-indigo-600">{item.firstName || '—'} {item.lastName || ''}</p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            <td className="px-4 py-3 text-[13px] font-bold text-slate-600 tracking-tight lowercase">{item.email}</td>
                                                            <td className="px-4 py-3">
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-[0.1em] border ${item.role?.includes('admin') ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                                        {item.role?.replace('_', ' ') || 'USER'}
                                                                    </span>
                                                                </td>
                                                            <td className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 tabular-nums">
                                                                    {item.createdAt ? format(new Date(item.createdAt), 'MMM d, yyyy') : 'NO_RECORD'}
                                                                </td>
                                                            <td className="px-4 py-3 text-right">
                                                                    <div className="flex justify-end gap-2">
                                                                        <button onClick={() => window.open(`/staff/users/${item.id || item._id}`, '_blank')} className="w-8 h-8 rounded bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 flex items-center justify-center transition-all shadow-sm" title="View Full Profile">
                                                                            <span className="material-symbols-outlined text-[18px]">account_circle</span>
                                                                        </button>
                                                                        <button onClick={() => { setAutoStartUser(item); setActiveSection("chat_customer"); }} className="w-8 h-8 rounded bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-600 flex items-center justify-center transition-all shadow-sm" title="Direct Message">
                                                                            <span className="material-symbols-outlined text-[18px]">alternate_email</span>
                                                                        </button>
                                                                        {/* <button onClick={() => handleDeleteUser(item.id || item._id)} className="w-8 h-8 rounded bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 flex items-center justify-center transition-all shadow-sm" title="Delete Account">
                                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                        </button> */}
                                                                    </div>
                                                                </td>
                                                            </>
                                                        )}
                                                        {activeSection === "community" && (
                                                            <>
                                                            <td className="px-4 py-3">
                                                                    <p className="text-[14px] font-bold text-slate-900 tracking-tight line-clamp-1">{item.title}</p>
                                                                </td>
                                                            <td className="px-4 py-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 overflow-hidden">
                                                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.author?.email}`} alt="" className="w-full h-full" />
                                                                        </div>
                                                                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">{item.author?.firstName}</p>
                                                                    </div>
                                                                </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <button onClick={() => window.open(`/community/post/${item.id || item._id}`, '_blank')} className="w-8 h-8 rounded bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 flex items-center justify-center transition-all shadow-sm" title="Open Thread">
                                                                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                                                    </button>
                                                                    <button onClick={() => handleDeleteCommunityPost(item.id || item._id)} className="w-8 h-8 rounded bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 flex items-center justify-center transition-all shadow-sm" title="Remove Post">
                                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    )}
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={6} className="px-8 py-32 text-center">
                                                            <div className="flex flex-col items-center justify-center opacity-40">
                                                                <span className="material-symbols-outlined text-6xl mb-4">search_off</span>
                                                                <p className="text-sm font-bold uppercase tracking-wider">Zero Records Found</p>
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

                    {/* My Profile Section */}
                    {activeSection === "my_profile" && (
                        <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 tracking-tight">My Profile</h2>
                                    <p className="text-slate-500 text-[11px] mt-1 font-medium">Staff account & credentials</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Profile Card */}
                                <div className="bg-white rounded-2xl border border-slate-200/60 p-8 shadow-sm flex flex-col items-center text-center">
                                    <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden mb-5 shadow-lg">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="Avatar" className="w-full h-full object-cover" />
                                    </div>
                                    <h3 className="text-[20px] font-black text-slate-900 tracking-tight">{user?.firstName || '—'} {user?.lastName || ''}</h3>
                                    <p className="text-[11px] font-black uppercase tracking-widest text-indigo-600 mt-1">{user?.role?.replace('_', ' ') || 'Staff'}</p>
                                    <p className="text-[13px] text-slate-500 mt-2">{user?.email}</p>
                                    <div className="mt-6 w-full pt-6 border-t border-slate-100 space-y-3">
                                        <div className="flex justify-between text-[12px]">
                                            <span className="text-slate-400 font-medium">Status</span>
                                            <span className="font-black text-emerald-600 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block" />Active</span>
                                        </div>
                                        <div className="flex justify-between text-[12px]">
                                            <span className="text-slate-400 font-medium">Portal</span>
                                            <span className="font-bold text-slate-700">CoreOps Staff</span>
                                        </div>
                                        <div className="flex justify-between text-[12px]">
                                            <span className="text-slate-400 font-medium">Session</span>
                                            <span className="font-bold text-slate-700">{format(new Date(), 'MMM d, yyyy')}</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Stats Summary */}
                                <div className="lg:col-span-2 grid grid-cols-2 gap-5 content-start">
                                    {[
                                        { label: "Applications Managed", value: totalApps, icon: "description", color: "bg-indigo-50 text-indigo-600" },
                                        { label: "Pending Review", value: pendingCount, icon: "hourglass_empty", color: "bg-amber-50 text-amber-600" },
                                        { label: "Approved This Month", value: approvedCount, icon: "check_circle", color: "bg-emerald-50 text-emerald-600" },
                                        { label: "Rejection Rate", value: totalApps > 0 ? `${Math.round((rejectedCount/totalApps)*100)}%` : '0%', icon: "cancel", color: "bg-rose-50 text-rose-600" },
                                        { label: "Tasks Completed", value: tasks.filter(t => t.completed).length, icon: "fact_check", color: "bg-slate-100 text-slate-600" },
                                        { label: "Tasks Pending", value: tasks.filter(t => !t.completed).length, icon: "pending_actions", color: "bg-violet-50 text-violet-600" },
                                    ].map(s => (
                                        <div key={s.label} className="bg-white rounded-xl border border-slate-200/60 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color} shrink-0`}>
                                                <span className="material-symbols-outlined text-[22px]">{s.icon}</span>
                                            </div>
                                            <div>
                                                <p className="text-[22px] font-black text-slate-900 leading-none">{loading ? '—' : s.value}</p>
                                                <p className="text-[11px] text-slate-500 font-medium mt-1">{s.label}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Recent Activity */}
                            <div className="bg-white rounded-2xl border border-slate-200/60 p-7 shadow-sm">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5">Recent Activity Log</h3>
                                <div className="space-y-3">
                                    {recentActivity.map(a => (
                                        <div key={a.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/50 border border-slate-100 hover:border-slate-200 transition-all">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${a.color}`}>
                                                <span className="material-symbols-outlined text-[18px]">{a.icon}</span>
                                            </div>
                                            <p className="flex-1 text-[13px] font-bold text-slate-700">{a.msg}</p>
                                            <span className="text-[11px] text-slate-400 font-medium shrink-0">{a.time}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    </div>
                </main>

            {/* Application Detail Modal Overlay */}
            {selectedApp && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedApp(null)} />
                    <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                            <div>
                                <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Audit Terminal</h2>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Application ID: {selectedApp.applicationNumber}</p>
                            </div>
                            <button onClick={() => setSelectedApp(null)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all">
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <section>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Identity Profile</p>
                                        <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                                            <p className="text-[14px] font-bold text-slate-900">{selectedApp.firstName} {selectedApp.lastName}</p>
                                            <p className="text-[12px] font-medium text-slate-500 mt-1">{selectedApp.email}</p>
                                            <p className="text-[12px] font-medium text-slate-500">{selectedApp.phone}</p>
                                        </div>
                                    </section>
                                    
                                    <section>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Financial parameters</p>
                                        <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[12px] font-bold text-slate-500">Requested Amount</span>
                                                <span className="text-[14px] font-black text-slate-900 tabular-nums">₹{Number(selectedApp.amount).toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[12px] font-bold text-slate-500">Service Route</span>
                                                <span className="text-[13px] font-bold text-indigo-600">{selectedApp.bank}</span>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                <div className="space-y-6">
                                    <section>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Document Registry</p>
                                        <div className="space-y-2">
                                            {['Aadhaar_Card', 'PAN_Card', 'Income_Proof'].map((doc) => (
                                                <div key={doc} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-all cursor-pointer group bg-white shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <span className="material-symbols-outlined text-slate-400 text-[18px]">description</span>
                                                        <span className="text-[12px] font-bold text-slate-700">{doc.replace('_', ' ')}</span>
                                                    </div>
                                                    <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-900 text-[16px]">download</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            </div>

                            <section className="pt-4 border-t border-slate-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Staff Audit Notes</p>
                                <textarea
                                    value={actionRemarks}
                                    onChange={(e) => setActionRemarks(e.target.value)}
                                    placeholder="Enter internal verification notes or rejection rationale..."
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 min-h-[100px] transition-all"
                                />
                            </section>
                        </div>

                        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button 
                                onClick={() => setSelectedApp(null)}
                                className="px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all"
                            >
                                Dismiss
                            </button>

                        </div>
                    </div>
                </div>
            )}

            <PullDocumentsModal 
                isOpen={showPullModal} 
                onClose={() => setShowPullModal(false)} 
            />

                        </div>
    );
}
