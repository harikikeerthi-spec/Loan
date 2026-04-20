"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { format } from "date-fns";
import ChatInterface from "@/components/Chat/ChatInterface";

// --- Components ---

const StatCard = ({ label, value, icon, color, loading, hint }: any) => (
    <div className="bg-white border border-slate-200/60 p-7 rounded-2xl relative overflow-hidden group transition-all duration-300 hover:border-indigo-500/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-default">
        <div className="flex justify-between items-start relative z-10 w-full mb-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${color} bg-opacity-10 border border-current border-opacity-10 shadow-sm shadow-current/5`}>
                <span className="material-symbols-outlined text-[24px]" style={{ color: 'currentColor' }}>{icon}</span>
            </div>
            {hint && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-400 border border-slate-100">
                    {hint}
                </span>
            )}
        </div>
        <div className="relative z-10">
            <p className="text-slate-500 text-[13px] font-medium tracking-tight mb-1">{label}</p>
            <div className="text-[28px] font-bold tracking-tight text-slate-900 font-sans leading-none">
                {loading ? <span className="h-9 bg-slate-50 animate-pulse rounded-lg block w-32 mt-1" /> : value ?? "—"}
            </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-current to-transparent opacity-[0.015] -mr-16 -mt-16 rounded-full transition-transform duration-700 group-hover:scale-150" style={{ color: 'currentColor' }} />
    </div>
);

const NavItem = ({ section, active, icon, label, onClick }: any) => (
    <button
        onClick={() => onClick(section)}
        className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3.5 group transition-all duration-200 ${active === section ? "bg-slate-900 text-white shadow-md shadow-slate-200" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
    >
        <span className={`material-symbols-outlined transition-colors text-[20px] ${active === section ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`}>{icon}</span>
        <span className={`font-medium text-[14px] flex-1 ${active === section ? "font-semibold" : ""}`}>{label}</span>
        {active === section && (
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
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
    
    // Add student state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newStudent, setNewStudent] = useState({
        email: "", firstName: "", lastName: "", middleName: "", mobile: "", role: "student",
        dob: "", gender: "", maritalStatus: "",
        mailingAddress: { address1: "", address2: "", city: "", state: "", country: "", pincode: "" },
        permanentAddress: { address1: "", address2: "", city: "", state: "", country: "", pincode: "" },
        passport: { number: "", issueDate: "", expiryDate: "", issueCountry: "", birthCity: "", birthCountry: "" },
        nationality: { name: "", citizenship: "", dualCitizenship: "No", dualNational: "", livingOtherCountry: "No", livingOtherCountryName: "" },
        background: { immigrationApplied: "No", immigrationAppliedCountry: "", medicalCondition: "No", medicalConditionDetails: "", visaRefusal: "No", visaRefusalDetails: "", criminalOffence: "No", criminalOffenceDetails: "" },
        emergencyContact: { name: "", phone: "", email: "", relation: "" }
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

    const handleCreateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        try {
            await adminApi.createUser(newStudent);
            setIsAddModalOpen(false);
            setNewStudent({
                email: "", firstName: "", lastName: "", middleName: "", mobile: "", role: "student",
                dob: "", gender: "", maritalStatus: "",
                mailingAddress: { address1: "", address2: "", city: "", state: "", country: "", pincode: "" },
                permanentAddress: { address1: "", address2: "", city: "", state: "", country: "", pincode: "" },
                passport: { number: "", issueDate: "", expiryDate: "", issueCountry: "", birthCity: "", birthCountry: "" },
                nationality: { name: "", citizenship: "", dualCitizenship: "No", dualNational: "", livingOtherCountry: "No", livingOtherCountryName: "" },
                background: { immigrationApplied: "No", immigrationAppliedCountry: "", medicalCondition: "No", medicalConditionDetails: "", visaRefusal: "No", visaRefusalDetails: "", criminalOffence: "No", criminalOffenceDetails: "" },
                emergencyContact: { name: "", phone: "", email: "", relation: "" }
            });
            loadData();
            alert("Student profile created successfully!");
        } catch (e: any) {
            alert(e.message || "Failed to add student profile");
        } finally {
            setCreateLoading(false);
        }
    };

    const fetchUserDocuments = async (userId: string) => {
        setDocsLoading(true);
        try {
            // @ts-ignore - Check if method exists on adminApi
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
        <div className="min-h-screen flex bg-[#f8fafc]">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} border-r border-slate-200 bg-white flex flex-col`}>
                <div className="h-20 flex items-center px-8 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-900/20">
                            <span className="material-symbols-outlined text-[20px]">account_balance</span>
                        </div>
                        <span className="text-[18px] font-bold text-slate-900 tracking-tight italic">Core<span className="text-indigo-600">Ops</span></span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-8 space-y-1 custom-scrollbar">
                    <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Command Center</p>
                    <NavItem section="overview" active={activeSection} icon="grid_view" label="Infrastructure" onClick={setActiveSection} />
                    <NavItem section="applications" active={activeSection} icon="description" label="Active Pipeline" onClick={setActiveSection} />
                    <NavItem section="tasks" active={activeSection} icon="check_circle" label="Action Items" onClick={setActiveSection} />
                    <NavItem section="performance" active={activeSection} icon="insights" label="Performance Metrics" onClick={setActiveSection} />
                    <NavItem section="users" active={activeSection} icon="person_search" label="User Directory" onClick={setActiveSection} />
                    <NavItem section="blogs" active={activeSection} icon="history_edu" label="Editorial Content" onClick={setActiveSection} />
                    <NavItem section="community" active={activeSection} icon="diversity_3" label="Engagement Hub" onClick={setActiveSection} />
                    <NavItem section="communications" active={activeSection} icon="mail" label="Outreach Center" onClick={setActiveSection} />

                    <div className="pt-8 mb-4">
                        <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Communication</p>
                    </div>
                    <NavItem section="chat_bank" active={activeSection} icon="send_and_archive" label="Bank Transmit" onClick={(s: string) => { setActiveSection(s); setAutoStartUser(null); }} />
                    <NavItem section="chat_customer" active={activeSection} icon="support_agent" label="Support Sync" onClick={(s: string) => { setActiveSection(s); setAutoStartUser(null); }} />
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-slate-200/60 shadow-sm mb-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[13px] font-bold text-slate-900 truncate tracking-tight">{user?.firstName || 'Staff Agent'}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user?.role?.replace('_', ' ')}</p>
                        </div>
                    </div>
                    <button onClick={logout} className="w-full px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all font-black text-[10px] uppercase tracking-widest border border-transparent hover:border-rose-100">
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        Terminate Session
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-white">
                <header className="h-20 px-8 flex justify-between items-center border-b border-slate-100 sticky top-0 z-40 bg-white/80 backdrop-blur-md">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-all">
                            <span className="material-symbols-outlined">menu_open</span>
                        </button>
                        <h1 className="text-[20px] font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            {activeSection.replace('chat_', '').replace(/_/g, ' ').toUpperCase()}
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-1 rounded">STAFF_AUTH_LEVEL_2</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right hidden md:block border-r border-slate-100 pr-6">
                            <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">Node Sync Time</p>
                            <p className="text-[13px] font-bold text-slate-600 mt-0.5">{format(new Date(), 'HH:mm • MMM d, yyyy')}</p>
                        </div>
                        <div className="relative group">
                            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 cursor-pointer transition-all hover:bg-white hover:shadow-sm">
                                <span className="material-symbols-outlined text-[20px]">notifications</span>
                            </div>
                            <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500 border-2 border-white"></div>
                        </div>
                    </div>
                </header>

                <div className={`flex-1 overflow-y-auto custom-scrollbar ${activeSection.startsWith('chat_') ? 'p-0' : 'p-8 space-y-8'} `}>
                    {/* Chat Section Content */}
                    {activeSection === "chat_bank" && <ChatInterface role="bank" />}
                    {activeSection === "chat_customer" && <ChatInterface role="staff" initialUser={autoStartUser} />}

                    {/* Tab Selection Content */}
                    {activeSection === "overview" && (
                        <div className="animate-fade-in space-y-10">
                            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-100 pb-8">
                                <div>
                                    <h2 className="text-[32px] font-black text-slate-900 tracking-tighter">Operational Overview</h2>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Real-time Infrastructure Monitoring</p>
                                    </div>
                                </div>
                                <div className="px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-black uppercase tracking-widest text-slate-400 shadow-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">sync_alt</span>
                                    {pendingCount > 0 ? `${pendingCount} Nodes Awaiting Clearance` : 'System Fully Syncronized'}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard label="Pipeline Throughput" value={stats.apps?.total} icon="analytics" color="text-slate-900" loading={loading} />
                                <StatCard label="Awaiting Review" value={pendingCount} icon="hourglass_empty" color="text-amber-600" loading={loading} hint="Critical" />
                                <StatCard label="Success Index" value={`${approvalRate}%`} icon="verified" color="text-emerald-600" loading={loading} />
                                <StatCard label="Documentation" value={stats.blogs?.published ?? stats.blogs?.total ?? 0} icon="menu_book" color="text-indigo-600" loading={loading} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Analytical Performance Data</p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="p-6 rounded-xl bg-slate-50 border border-slate-100 group transition-all">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="material-symbols-outlined text-slate-400 text-[20px]">task_alt</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Processed</span>
                                            </div>
                                            <p className="text-[24px] font-black text-slate-900 tracking-tight">{approvedCount + rejectedCount}</p>
                                        </div>
                                        <div className="p-6 rounded-xl bg-slate-50 border border-slate-100 group transition-all">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="material-symbols-outlined text-slate-400 text-[20px]">hub</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Directory Sync</span>
                                            </div>
                                            <p className="text-[24px] font-black text-slate-900 tracking-tight">{Number(stats.users?.total ?? 0)}</p>
                                        </div>
                                        <div className="p-6 rounded-xl bg-rose-50/30 border border-rose-100 group transition-all">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="material-symbols-outlined text-rose-400 text-[20px]">report</span>
                                                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Anomalies</span>
                                            </div>
                                            <p className="text-[24px] font-black text-rose-600 tracking-tight">{rejectedCount + Number(stats.apps?.cancelled ?? 0)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Quick Access Terminals</p>
                                    <div className="space-y-3">
                                        <button onClick={() => { setActiveSection('chat_customer'); setAutoStartUser(null); }} className="w-full text-left p-5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group flex items-center gap-4 bg-white shadow-sm">
                                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-indigo-600 border border-slate-200 transition-all">
                                                <span className="material-symbols-outlined text-[20px]">forum</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[14px] font-bold text-slate-900 tracking-tight">Support Node</p>
                                                <p className="text-[11px] font-medium text-slate-500 truncate">Direct applicant interface</p>
                                            </div>
                                            <span className="material-symbols-outlined text-slate-300 group-hover:text-indigo-400 text-[18px]">arrow_forward_ios</span>
                                        </button>
                                        <button onClick={() => { setActiveSection('chat_bank'); setAutoStartUser(null); }} className="w-full text-left p-5 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all group flex items-center gap-4 bg-white shadow-sm">
                                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-slate-900 border border-slate-200 transition-all">
                                                <span className="material-symbols-outlined text-[20px]">shield_person</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[14px] font-bold text-slate-900 tracking-tight">Bank Terminal</p>
                                                <p className="text-[11px] font-medium text-slate-500 truncate">Institution gateway</p>
                                            </div>
                                            <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-900 text-[18px]">arrow_forward_ios</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === "tasks" && (
                        <div className="animate-fade-in space-y-8">
                            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-100 pb-8">
                                <div>
                                    <h2 className="text-[32px] font-black text-slate-900 tracking-tighter">Action Items</h2>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2 flex items-center gap-2">Daily tasks & follow-ups</p>
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm max-w-3xl">
                                <form onSubmit={(e) => { e.preventDefault(); addTask(); }} className="flex gap-4 mb-8">
                                    <input 
                                        type="text" 
                                        placeholder="Add a new task..."
                                        value={newTaskTitle}
                                        onChange={e => setNewTaskTitle(e.target.value)}
                                        className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all text-slate-700 font-medium"
                                    />
                                    <button type="submit" className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">Add Task</button>
                                </form>
                                <div className="space-y-3">
                                    {tasks.map(task => (
                                        <div key={task.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all group ${task.completed ? 'bg-slate-50/50 border-slate-100 text-slate-400' : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300'}`}>
                                            <button onClick={() => toggleTask(task.id)} className={`w-6 h-6 rounded flex items-center justify-center transition-all flex-shrink-0 ${task.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-transparent border border-slate-300 group-hover:border-indigo-400'}`}>
                                                <span className="material-symbols-outlined text-[16px]">check</span>
                                            </button>
                                            <span className={`flex-1 text-[14px] font-bold tracking-tight ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.title}</span>
                                            <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-all">
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    ))}
                                    {tasks.length === 0 && (
                                        <div className="text-center py-12">
                                            <span className="material-symbols-outlined text-4xl block mb-2 opacity-20 text-slate-400">task_alt</span>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">All tasks completed / Nothing to do</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === "performance" && (
                        <div className="animate-fade-in space-y-8">
                            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-100 pb-8">
                                <div>
                                    <h2 className="text-[32px] font-black text-slate-900 tracking-tighter">Performance Metrics</h2>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2 flex items-center gap-2">Staff operational efficiency and KPIs</p>
                                </div>
                                <div className="px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-black uppercase tracking-widest text-emerald-600 shadow-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                                    Top 10% Contributor
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard label="Applications Processed" value="342" icon="task" color="text-indigo-600" loading={false} />
                                <StatCard label="Avg. Resolution Time" value="4.2 Hrs" icon="timer" color="text-amber-600" loading={false} />
                                <StatCard label="Customer Rating" value="4.9/5.0" icon="star" color="text-emerald-600" loading={false} />
                                <StatCard label="Tasks Completed" value={tasks.filter(t => t.completed).length + 28} icon="fact_check" color="text-blue-600" loading={false} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm">
                                    <h3 className="text-[18px] font-bold text-slate-900 mb-6 flex items-center gap-3">
                                        <span className="material-symbols-outlined text-slate-400">target</span>
                                        Weekly Target Progress
                                    </h3>
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-[13px] font-bold text-slate-700">Application Reviews</span>
                                                <span className="text-[11px] font-black text-slate-400">42 / 50</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '84%' }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-[13px] font-bold text-slate-700">Customer Queries Handled</span>
                                                <span className="text-[11px] font-black text-slate-400">112 / 120</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: '93%' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm">
                                    <h3 className="text-[18px] font-bold text-slate-900 mb-6 flex items-center gap-3">
                                        <span className="material-symbols-outlined text-slate-400">military_tech</span>
                                        Recent Achievements
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                                <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
                                            </div>
                                            <div>
                                                <p className="text-[14px] font-bold text-slate-900 tracking-tight">Speed Demon</p>
                                                <p className="text-[11px] font-medium text-slate-500">Resolved 10 applications under 1 hour</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                                <span className="material-symbols-outlined text-[20px]">thumb_up</span>
                                            </div>
                                            <div>
                                                <p className="text-[14px] font-bold text-slate-900 tracking-tight">Perfect Score</p>
                                                <p className="text-[11px] font-medium text-slate-500">Maintained a 5.0 rating over 20 interactions</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === "communications" && (
                        <div className="animate-fade-in space-y-8">
                            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-100 pb-8">
                                <div>
                                    <h2 className="text-[32px] font-black text-slate-900 tracking-tighter">Outreach Center</h2>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2 flex items-center gap-2">Direct & Bulk Communication Protocol</p>
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm max-w-3xl">
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
                                                <option value="user">Applicants</option>
                                                <option value="bank">Banking Entities</option>
                                            </select>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Subject Line</label>
                                        <input type="text" value={emailData.subject} onChange={e => setEmailData({ ...emailData, subject: e.target.value })} placeholder="Re: Application Status Update" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Message Narrative</label>
                                        <textarea value={emailData.content} onChange={e => setEmailData({ ...emailData, content: e.target.value })} placeholder="Type your formal communication here..." rows={6} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 transition-all resize-none" />
                                    </div>
                                    <button
                                        onClick={handleSendEmail}
                                        disabled={emailLoading}
                                        className="w-full bg-slate-900 text-white py-4 rounded-lg font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 mt-4 hover:bg-slate-800 transition-all shadow-md active:scale-[0.98]"
                                    >
                                        {emailLoading ? <div className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin" /> : (<><span className="material-symbols-outlined text-[18px]">send</span> Transmit Message</>)}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {["applications", "blogs", "community", "users"].includes(activeSection) && (
                        <div className="animate-fade-in space-y-8">
                            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-100 pb-8">
                                <div>
                                    <h2 className="text-[32px] font-black text-slate-900 tracking-tight capitalize">{activeSection} Management</h2>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                        System-wide Data Access & Control
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                    {activeSection === 'users' && (
                                        <button 
                                            onClick={() => setIsAddModalOpen(true)}
                                            className="px-5 py-3 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-800 shadow-lg shadow-slate-900/10 transition-all flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">person_add</span>
                                            Onboard Applicant
                                        </button>
                                    )}
                                    <div className="relative flex-1 md:w-[320px]">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder={`Registry search for ${activeSection}...`}
                                            className="w-full pl-11 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all"
                                        />
                                    </div>
                                    {activeSection === 'applications' && (
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="px-5 py-3 bg-white border border-slate-200 rounded-lg text-[11px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-900/5 cursor-pointer appearance-none transition-all shadow-sm pr-10"
                                            style={{ backgroundImage: 'none' }}
                                        >
                                            <option value="all">ANY STATUS</option>
                                            <option value="pending">Awaiting</option>
                                            <option value="processing">In Review</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Denied</option>
                                        </select>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm bg-white">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <TableHeader>
                                            {activeSection === "blogs" && (
                                                <>
                                                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">Document Metadata</th>
                                                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 w-32">Status</th>
                                                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 w-32 text-right">Engagement</th>
                                                </>
                                            )}
                                            {activeSection === "applications" && (
                                                <>
                                                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 w-40">Ref ID</th>
                                                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">Principal Identity</th>
                                                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">Lender Entity</th>
                                                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 w-32">State</th>
                                                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 w-32 text-right">Actions</th>
                                                </>
                                            )}
                                            {activeSection === "users" && (
                                                <>
                                                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">Identity Profile</th>
                                                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">Contact Protocol</th>
                                                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 w-32">ACL Role</th>
                                                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 w-40">Record Created</th>
                                                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 w-32 text-right">Comm</th>
                                                </>
                                            )}
                                            {activeSection === "community" && (
                                                <>
                                                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">Broadcast Topic</th>
                                                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 w-48">Transmitter</th>
                                                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 w-32 text-right">Social Signal</th>
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
                                                <tr key={idx} className="group hover:bg-slate-50/80 transition-all border-l-2 border-transparent hover:border-indigo-500">
                                                    {activeSection === "blogs" && (
                                                        <>
                                                            <td className="px-8 py-6">
                                                                <p className="text-[14px] font-bold text-slate-900 tracking-tight leading-tight mb-1">{item.title}</p>
                                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Writer: {item.authorName}</p>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${item.isPublished ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                                    {item.isPublished ? 'Live' : 'Draft'}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6 text-right font-black text-slate-900 tabular-nums">
                                                                {item.views || 0} UITS
                                                            </td>
                                                        </>
                                                    )}
                                                    {activeSection === "applications" && (
                                                            <>
                                                                <td className="px-8 py-6 font-black text-slate-400 text-[11px] tracking-widest tabular-nums uppercase">#{item.applicationNumber?.toString().slice(0, 8) || 'REF-ID-0'}</td>
                                                                <td className="px-8 py-6 font-bold text-slate-900 text-[14px] tracking-tight">{item.firstName} {item.lastName}</td>
                                                                <td className="px-8 py-6 font-bold text-slate-600 text-[13px] tracking-tight">{item.bank}</td>
                                                                <td className="px-8 py-6">
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-[0.1em] border ${
                                                                        item.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                                                        item.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                                                                        item.status === 'processing' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                                                                        'bg-amber-50 text-amber-700 border-amber-100'
                                                                    }`}>
                                                                        {item.status || 'Pending'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-8 py-6 text-right">
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
                                                                    </div>
                                                                </td>
                                                            </>
                                                        )}
                                                        {activeSection === "users" && (
                                                            <>
                                                                <td className="px-8 py-6">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.email}`} alt="" className="w-full h-full object-cover" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-[14px] font-bold text-slate-900 tracking-tight truncate">{item.firstName || '—'} {item.lastName || ''}</p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-6 text-[13px] font-bold text-slate-600 tracking-tight lowercase">{item.email}</td>
                                                                <td className="px-8 py-6">
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-[0.1em] border ${item.role?.includes('admin') ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                                        {item.role?.replace('_', ' ') || 'USER'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-slate-400 tabular-nums">
                                                                    {item.createdAt ? format(new Date(item.createdAt), 'MMM d, yyyy') : 'NO_RECORD'}
                                                                </td>
                                                                <td className="px-8 py-6 text-right">
                                                                    <button onClick={() => { setAutoStartUser(item); setActiveSection("chat_customer"); }} className="w-9 h-9 rounded bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-600 flex items-center justify-center transition-all hover:shadow-lg hover:shadow-indigo-50 group/btn">
                                                                        <span className="material-symbols-outlined text-[20px] transition-transform group-hover/btn:scale-110">alternate_email</span>
                                                                    </button>
                                                                </td>
                                                            </>
                                                        )}
                                                        {activeSection === "community" && (
                                                            <>
                                                                <td className="px-8 py-6">
                                                                    <p className="text-[14px] font-bold text-slate-900 tracking-tight line-clamp-1">{item.title}</p>
                                                                </td>
                                                                <td className="px-8 py-6">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 overflow-hidden">
                                                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.author?.email}`} alt="" className="w-full h-full" />
                                                                        </div>
                                                                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">{item.author?.firstName}</p>
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-6 text-right">
                                                                    <span className="text-[11px] font-black text-slate-900 tabular-nums uppercase border border-slate-100 px-2 py-1 bg-slate-50/50 rounded">
                                                                        {item.likesCount || 0} Σ
                                                                    </span>
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
                            <div className="flex gap-2">
                                <button 
                                    disabled={actionLoading}
                                    onClick={() => handleAppStatus(selectedApp.id, 'rejected')}
                                    className="px-5 py-2.5 bg-white border border-rose-200 text-rose-600 text-[11px] font-black uppercase tracking-widest rounded hover:bg-rose-50 transition-all disabled:opacity-50"
                                >
                                    Flag/Reject
                                </button>
                                <button 
                                    disabled={actionLoading}
                                    onClick={() => handleAppStatus(selectedApp.id, 'approved')}
                                    className="px-5 py-2.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg shadow-slate-900/20"
                                >
                                    Approve & Sync
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Student Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
                    <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                            <div>
                                <h3 className="text-[16px] font-extrabold text-slate-900 tracking-tight uppercase">Manual Student Onboarding</h3>
                                <p className="text-[11px] font-medium text-slate-400 mt-0.5 uppercase tracking-widest">Complete profile creation as per documentation</p>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-all">
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>

                        <div className="overflow-y-auto no-scrollbar p-10 pt-6 space-y-12">
                            <form id="staff-student-creation-form" onSubmit={handleCreateStudent} className="space-y-12">
                                {/* Section 1: Personal Information */}
                                <section>
                                    <div className="flex items-center gap-2 mb-6 text-slate-900 font-bold text-xs uppercase tracking-widest">
                                        <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                                        Personal Information
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">First Name*</label>
                                            <input required type="text" value={newStudent.firstName} onChange={e => setNewStudent({ ...newStudent, firstName: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium" placeholder="E.g. Hari" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Middle Name</label>
                                            <input type="text" value={newStudent.middleName} onChange={e => setNewStudent({ ...newStudent, middleName: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium" placeholder="Optional" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Last Name*</label>
                                            <input required type="text" value={newStudent.lastName} onChange={e => setNewStudent({ ...newStudent, lastName: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium" placeholder="E.g. Kalyan" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Email Address*</label>
                                            <input required type="email" value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium" placeholder="example@email.com" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Mobile Number*</label>
                                            <input required type="tel" value={newStudent.mobile} onChange={e => setNewStudent({ ...newStudent, mobile: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium" placeholder="+91 0000000000" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Date of Birth</label>
                                            <input type="date" value={newStudent.dob} onChange={e => setNewStudent({ ...newStudent, dob: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Gender</label>
                                            <select value={newStudent.gender} onChange={e => setNewStudent({ ...newStudent, gender: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium appearance-none">
                                                <option value="">Select Gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Marital Status</label>
                                            <select value={newStudent.maritalStatus} onChange={e => setNewStudent({ ...newStudent, maritalStatus: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium appearance-none">
                                                <option value="">Select Status</option>
                                                <option value="single">Single</option>
                                                <option value="married">Married</option>
                                                <option value="divorced">Divorced</option>
                                            </select>
                                        </div>
                                    </div>
                                </section>

                                {/* Section 2: Mailing Address */}
                                <section>
                                    <div className="flex items-center gap-2 mb-6 text-slate-900 font-bold text-xs uppercase tracking-widest">
                                        <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                                        Location & Address
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Address 1</label>
                                            <input type="text" value={newStudent.mailingAddress.address1} onChange={e => setNewStudent({ ...newStudent, mailingAddress: { ...newStudent.mailingAddress, address1: e.target.value } })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium" placeholder="E.g. House No, Street" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Address 2</label>
                                            <input type="text" value={newStudent.mailingAddress.address2} onChange={e => setNewStudent({ ...newStudent, mailingAddress: { ...newStudent.mailingAddress, address2: e.target.value } })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium" placeholder="Area / Landmark" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Country</label>
                                            <input type="text" value={newStudent.mailingAddress.country} onChange={e => setNewStudent({ ...newStudent, mailingAddress: { ...newStudent.mailingAddress, country: e.target.value } })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium" placeholder="India" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">State</label>
                                            <input type="text" value={newStudent.mailingAddress.state} onChange={e => setNewStudent({ ...newStudent, mailingAddress: { ...newStudent.mailingAddress, state: e.target.value } })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium" placeholder="State" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">City</label>
                                            <input type="text" value={newStudent.mailingAddress.city} onChange={e => setNewStudent({ ...newStudent, mailingAddress: { ...newStudent.mailingAddress, city: e.target.value } })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium" placeholder="City" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Pincode</label>
                                            <input type="text" value={newStudent.mailingAddress.pincode} onChange={e => setNewStudent({ ...newStudent, mailingAddress: { ...newStudent.mailingAddress, pincode: e.target.value } })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium" placeholder="000000" />
                                        </div>
                                    </div>
                                </section>

                                {/* Section 3: Passport Information */}
                                <section>
                                    <div className="flex items-center gap-2 mb-6 text-slate-900 font-bold text-xs uppercase tracking-widest">
                                        <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                                        Passport Verification
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Passport Number</label>
                                            <input type="text" value={newStudent.passport.number} onChange={e => setNewStudent({ ...newStudent, passport: { ...newStudent.passport, number: e.target.value } })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium" placeholder="L61XXXX" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Issue Date</label>
                                                <input type="date" value={newStudent.passport.issueDate} onChange={e => setNewStudent({ ...newStudent, passport: { ...newStudent.passport, issueDate: e.target.value } })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Expiry Date</label>
                                                <input type="date" value={newStudent.passport.expiryDate} onChange={e => setNewStudent({ ...newStudent, passport: { ...newStudent.passport, expiryDate: e.target.value } })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Issue Country</label>
                                            <input type="text" value={newStudent.passport.issueCountry} onChange={e => setNewStudent({ ...newStudent, passport: { ...newStudent.passport, issueCountry: e.target.value } })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium" placeholder="E.g. India" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">City of Birth</label>
                                            <input type="text" value={newStudent.passport.birthCity} onChange={e => setNewStudent({ ...newStudent, passport: { ...newStudent.passport, birthCity: e.target.value } })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium" placeholder="City" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Country of Birth</label>
                                            <input type="text" value={newStudent.passport.birthCountry} onChange={e => setNewStudent({ ...newStudent, passport: { ...newStudent.passport, birthCountry: e.target.value } })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium" placeholder="Country" />
                                        </div>
                                    </div>
                                </section>

                                {/* Section 4: Nationality & Background */}
                                <section>
                                    <div className="flex items-center gap-2 mb-6 text-slate-900 font-bold text-xs uppercase tracking-widest">
                                        <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                                        Background & Nationality
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Nationality*</label>
                                            <input type="text" value={newStudent.nationality.name} onChange={e => setNewStudent({ ...newStudent, nationality: { ...newStudent.nationality, name: e.target.value } })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium" placeholder="Select Nationality" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Citizenship*</label>
                                            <input type="text" value={newStudent.nationality.citizenship} onChange={e => setNewStudent({ ...newStudent, nationality: { ...newStudent.nationality, citizenship: e.target.value } })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium" placeholder="Select Citizenship" />
                                        </div>
                                    </div>

                                    <div className="mt-8 space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 leading-none uppercase">Dual Citizenship</p>
                                                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tight">Citizen of more than one country?</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {['No', 'Yes'].map(opt => (
                                                    <button key={opt} type="button" onClick={() => setNewStudent({ ...newStudent, nationality: { ...newStudent.nationality, dualCitizenship: opt } })} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${newStudent.nationality.dualCitizenship === opt ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'}`}>{opt}</button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 leading-none uppercase">Immigration History</p>
                                                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tight">Previous applications for any country?</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {['No', 'Yes'].map(opt => (
                                                    <button key={opt} type="button" onClick={() => setNewStudent({ ...newStudent, background: { ...newStudent.background, immigrationApplied: opt } })} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${newStudent.background.immigrationApplied === opt ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'}`}>{opt}</button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 leading-none uppercase">Medical Declaration</p>
                                                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tight">Does applicant suffer from serious conditions?</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {['No', 'Yes'].map(opt => (
                                                    <button key={opt} type="button" onClick={() => setNewStudent({ ...newStudent, background: { ...newStudent.background, medicalCondition: opt } })} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${newStudent.background.medicalCondition === opt ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'}`}>{opt}</button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 leading-none uppercase">Visa Refusal Status</p>
                                                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tight">Any Visa refusal for any country?</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {['No', 'Yes'].map(opt => (
                                                    <button key={opt} type="button" onClick={() => setNewStudent({ ...newStudent, background: { ...newStudent.background, visaRefusal: opt } })} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${newStudent.background.visaRefusal === opt ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'}`}>{opt}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Section 5: Emergency Contacts */}
                                <section className="pb-10">
                                    <div className="flex items-center gap-2 mb-6 text-slate-900 font-bold text-xs uppercase tracking-widest">
                                        <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                                        Emergency Contact
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Contact Name</label>
                                            <input type="text" value={newStudent.emergencyContact.name} onChange={e => setNewStudent({ ...newStudent, emergencyContact: { ...newStudent.emergencyContact, name: e.target.value } })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium" placeholder="Full Name" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Relationship</label>
                                            <input type="text" value={newStudent.emergencyContact.relation} onChange={e => setNewStudent({ ...newStudent, emergencyContact: { ...newStudent.emergencyContact, relation: e.target.value } })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium" placeholder="E.g. Father, Mother" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Phone Number</label>
                                            <input type="tel" value={newStudent.emergencyContact.phone} onChange={e => setNewStudent({ ...newStudent, emergencyContact: { ...newStudent.emergencyContact, phone: e.target.value } })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium" placeholder="+91 00000-00000" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Email Address</label>
                                            <input type="email" value={newStudent.emergencyContact.email} onChange={e => setNewStudent({ ...newStudent, emergencyContact: { ...newStudent.emergencyContact, email: e.target.value } })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium" placeholder="contact@email.com" />
                                        </div>
                                    </div>
                                </section>
                            </form>
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
                            <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-8 py-4 bg-white text-slate-400 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 border border-slate-200 transition-all">Abort</button>
                            <button form="staff-student-creation-form" type="submit" disabled={createLoading} className="flex-[2] bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 active:scale-95 transition-all">
                                {createLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Authorize New Profile"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
