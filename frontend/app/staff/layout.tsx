"use client";

import { useState, useEffect, useCallback, useRef, useMemo, createContext, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { adminApi, staffProfileApi, apiFetch } from "@/lib/api";
import { format } from "date-fns";
import NotificationsPanel from "@/components/staff/NotificationsPanel";
import { io } from "socket.io-client";

export const StaffLayoutContext = createContext<{
    onlineEmails: string[];
    socket: any;
    unreadChatCount: number;
    fetchBadgeStats: () => Promise<void>;
} | null>(null);

export const useStaffLayout = () => {
    const context = useContext(StaffLayoutContext);
    if (!context) {
        // Fallback for safety if not rendered inside Layout
        return {
            onlineEmails: [],
            socket: null,
            unreadChatCount: 0,
            fetchBadgeStats: async () => { }
        };
    }
    return context;
};

const DASHBOARD_SECTIONS = [
    "overview",
    "applicants",
    "incoming_queue",
    "applications",
    "tasks",
    "performance",
    "users",
    "communications",
    "chat_customer",
    "my_profile",
    "onboarding",
    "calendar",
] as const;

const getDashboardSection = (section: string | null) =>
    DASHBOARD_SECTIONS.includes(section as any) ? section as typeof DASHBOARD_SECTIONS[number] : "overview";

const NavItem = ({ path, section, active, icon, label, badge, expanded }: any) => {
    const isActive = active === section;
    return (
        <Link
            href={path}
            title={label}
            className={`relative w-full flex items-center gap-3 px-4 transition-all duration-150 group/item ${isActive
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-200'
                }`}
            style={{ height: 44 }}
        >
            {isActive && (
                <span className="absolute inset-x-1 inset-y-1 rounded-lg bg-indigo-600" />
            )}
            {/* Icon — always visible */}
            <span className={`material-symbols-outlined text-[24px] relative z-10 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover/item:text-slate-200'
                }`}>{icon}</span>
            {/* Label — hidden at 56px, fades in when parent sidebar is hovered */}
            <span className={`relative z-10 text-[16px] font-['Playfair_Display',serif] tracking-wider whitespace-nowrap overflow-hidden transition-all duration-300
                ${expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 group-hover/sidebar:opacity-100 group-hover/sidebar:w-auto'}
                ${isActive ? 'text-white font-medium' : 'text-slate-300'}`}>
                {label}
            </span>
            {badge > 0 && (
                <span className={`relative z-10 ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full
                    bg-rose-500 text-white transition-opacity duration-300
                    ${expanded ? 'opacity-100' : 'opacity-0 group-hover/sidebar:opacity-100'}`}>
                    {badge > 9 ? '9+' : badge}
                </span>
            )}
        </Link>
    );
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
    const { isStaff, isLoading, isAuthenticated, user, logout, token } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [nowTime, setNowTime] = useState<Date>(new Date());
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const [incomingCount, setIncomingCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [tasksCount, setTasksCount] = useState(0);

    // F30 Global Search States
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

    // WebSocket state (can be used for syncing online presences, badge updates etc.)
    const socketRef = useRef<any>(null);
    const [onlineEmails, setOnlineEmails] = useState<string[]>([]);

    // Authentication and authorization checks
    useEffect(() => {
        if (!isLoading && pathname !== "/staff/login") {
            if (!isAuthenticated) {
                router.replace("/staff/login?redirect=" + encodeURIComponent(pathname));
            } else if (!isStaff) {
                router.replace("/dashboard");
            }
        }
    }, [isStaff, isLoading, isAuthenticated, router, pathname]);

    // Update real-time clock
    useEffect(() => {
        const intervalId = setInterval(() => {
            setNowTime(new Date());
        }, 1000);
        return () => clearInterval(intervalId);
    }, []);

    // Determine active section based on Next.js routing path
    const activeSection = useMemo(() => {
        if (pathname.includes("/staff/incoming-queue")) return "incoming_queue";
        if (pathname.includes("/staff/applications")) return "applications";
        if (pathname.includes("/staff/users")) return "users";
        if (pathname.includes("/staff/applicants")) return "applicants";
        if (pathname.includes("/staff/performance")) return "performance";
        if (pathname.includes("/staff/tasks")) return "tasks";
        if (pathname.includes("/staff/communications")) return "communications";
        if (pathname.includes("/staff/calendar")) return "calendar";
        if (pathname.includes("/staff/chat-customer")) return "chat_customer";
        if (pathname.includes("/staff/my-profile")) return "my_profile";
        if (pathname.includes("/staff/onboarding")) return "onboarding";
        return "overview";
    }, [pathname]);

    // Fetch dashboard badge counts (incoming, pending pipeline, chat count, tasks count)
    const fetchBadgeStats = useCallback(async () => {
        if (!token) return;
        try {
            const [appStats, conversationsRes]: [any, any] = await Promise.all([
                adminApi.getApplicationStats().catch(() => null),
                apiFetch<any[]>("/api/chat/conversations").catch(() => null),
            ]);

            if (appStats && appStats.data) {
                const statusStats = appStats.data.statusStats || {};
                setIncomingCount(Number(statusStats.submitted || 0));
                setPendingCount(Number(statusStats.pending || 0) + Number(statusStats.processing || 0));
            }

            if (Array.isArray(conversationsRes) && activeSection !== "chat_customer") {
                const totalUnread = conversationsRes.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);
                setUnreadChatCount(totalUnread);
            } else if (activeSection === "chat_customer") {
                setUnreadChatCount(0);
            }

            if (typeof window !== "undefined") {
                try {
                    const saved = localStorage.getItem("vidyaloans_staff_tasks");
                    if (saved) {
                        const tasksList = JSON.parse(saved);
                        const activeTasks = Array.isArray(tasksList)
                            ? tasksList.filter((t: any) => !t.completed).length
                            : 0;
                        setTasksCount(activeTasks);
                    } else {
                        setTasksCount(0);
                    }
                } catch {
                    setTasksCount(0);
                }
            }
        } catch (err) {
            console.error("Failed to load badge stats:", err);
        }
    }, [token, activeSection]);

    // Poll badge counts periodically
    useEffect(() => {
        if (isLoading || !isAuthenticated || !isStaff) return;
        fetchBadgeStats();
        const interval = setInterval(fetchBadgeStats, 15000);
        return () => clearInterval(interval);
    }, [isLoading, isAuthenticated, isStaff, fetchBadgeStats]);

    // WebSocket implementation
    useEffect(() => {
        if (!token) return;

        const baseApiUrl = typeof window !== 'undefined' && (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1'))
            ? 'http://localhost:5000'
            : (process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000'));
        const socketUrl = baseApiUrl.endsWith('/api')
            ? baseApiUrl.replace('/api', '/chat')
            : `${baseApiUrl.replace(/\/$/, '')}/chat`;

        console.log("[StaffLayout] Connecting to WebSocket at", socketUrl);
        const socketInstance = io(socketUrl, {
            auth: { token }
        });

        socketRef.current = socketInstance;

        socketInstance.on('connect', () => {
            console.log('[StaffLayout] Socket connected successfully');
            socketInstance.emit('request_presence');
            fetchBadgeStats();
        });

        socketInstance.on('presence_update', (emails: string[]) => {
            if (Array.isArray(emails)) {
                setOnlineEmails(emails);
            }
        });

        socketInstance.on('conversation_updated', () => {
            fetchBadgeStats();
        });

        socketInstance.on('new_message', () => {
            fetchBadgeStats();
        });

        return () => {
            socketInstance.disconnect();
        };
    }, [token, fetchBadgeStats]);

    // Global Search Logic
    const handleGlobalSearch = useCallback(async (q: string) => {
        setSearchQuery(q);
        if (q.trim().length < 2) {
            setSearchResults([]);
            setShowSearchSuggestions(false);
            return;
        }
        setIsSearching(true);
        try {
            const res = await staffProfileApi.globalSearch(q) as any;
            if (res && res.success) {
                setSearchResults(res.data || []);
                setShowSearchSuggestions(true);
            } else if (Array.isArray(res)) {
                setSearchResults(res);
                setShowSearchSuggestions(true);
            }
        } catch (err) {
            console.error("Global search error:", err);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const sectionTitles: Record<string, string> = {
        overview: 'Dashboard',
        applicants: 'Pull & Share Documents',
        incoming_queue: 'Incoming Queue',
        applications: 'Active Pipeline',
        tasks: 'Action Items',
        performance: 'Performance',
        users: 'Bank & Staff Members',
        communications: 'Outreach Center',
        my_profile: 'My Profile',
        chat_customer: 'Support Chat',
        onboarding: 'Applicant Onboarding',
        calendar: 'Deadline Calendar',
    };

    const navItems = [
        { section: "overview", path: "/staff/dashboard", icon: "dashboard", label: "Dashboard", badge: 0 },
        { section: "incoming_queue", path: "/staff/incoming-queue", icon: "move_to_inbox", label: "Incoming Queue", badge: incomingCount },
        { section: "applications", path: "/staff/applications", icon: "description", label: "Active Pipeline", badge: pendingCount },
        { section: "users", path: "/staff/users", icon: "people", label: "Bank & Staff Members", badge: 0 },
        { section: "applicants", path: "/staff/applicants", icon: "send_to_mobile", label: "Document Transfer", badge: 0 },
        { section: "performance", path: "/staff/performance", icon: "insights", label: "Performance", badge: 0 },
        { section: "tasks", path: "/staff/tasks", icon: "check_circle", label: "Action Items", badge: tasksCount },
        { section: "communications", path: "/staff/communications", icon: "mail", label: "Outreach Center", badge: 0 },
        { section: "calendar", path: "/staff/calendar", icon: "calendar_month", label: "Deadline Calendar", badge: 0 },
        { section: "chat_customer", path: "/staff/chat-customer", icon: "support_agent", label: "Support Chat", badge: unreadChatCount },
        { section: "my_profile", path: "/staff/my-profile", icon: "badge", label: "My Profile", badge: 0 },
    ];

    const contextValue = useMemo(() => ({
        onlineEmails,
        socket: socketRef.current,
        unreadChatCount,
        fetchBadgeStats
    }), [onlineEmails, unreadChatCount, fetchBadgeStats]);

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-transparent">
                <div className="w-12 h-12 border-4 border-[#6605c7]/20 border-t-[#6605c7] rounded-full animate-spin" />
            </div>
        );
    }

    if (pathname === "/staff/login") return <>{children}</>;

    if (!isAuthenticated || !isStaff) return null;

    return (
        <StaffLayoutContext.Provider value={contextValue}>
            <div className="staff-dashboard-shell h-screen overflow-hidden flex bg-white text-slate-900 text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {/* Mobile overlay */}
                {sidebarOpen && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
                )}

                {/* Sidebar — slim icon rail, expands on hover */}
                <aside className={`fixed inset-y-0 left-0 z-50 bg-[#0f172a] flex flex-col py-3 gap-1
                    shadow-2xl border-r border-slate-800/60 group/sidebar
                    transition-all duration-300 ease-in-out overflow-hidden
                    ${sidebarOpen
                        ? 'w-[280px] translate-x-0'
                        : 'w-[68px] lg:translate-x-0 -translate-x-full hover:w-[280px]'
                    }`}>

                    {/* Logo Area */}
                    <div className="flex flex-col items-center gap-1.5 px-2 mb-6 mt-2 flex-shrink-0">
                        <img
                            src="/images/vidyaloans-logo-transparent.png"
                            alt="VidyaLoans"
                            className="w-10 h-10 object-contain drop-shadow-md"
                        />
                        <span className={`text-[25px] font-bold text-white whitespace-nowrap transition-opacity duration-300 tracking-tight
                            ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 group-hover/sidebar:opacity-100 group-hover/sidebar:w-auto'}`}>
                            VidyaLoans
                        </span>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 flex flex-col w-full gap-0.5 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none' }}>
                        {navItems.map(item => (
                            <NavItem key={item.section} {...item} active={activeSection} expanded={sidebarOpen} />
                        ))}
                    </nav>

                    {/* Avatar + Sign-out at bottom */}
                    <div className="px-3 mt-2 flex-shrink-0">
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer group/profile border border-transparent hover:border-slate-700/50">
                            <Link href="/staff/my-profile" className="flex items-center gap-3 flex-1 min-w-0" title="View Profile">
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                                    alt="Avatar"
                                    className="w-8 h-8 rounded-full border border-slate-700 object-cover flex-shrink-0 group-hover/profile:border-indigo-500 transition-colors"
                                />
                                <div className={`min-w-0 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 group-hover/sidebar:opacity-100 group-hover/sidebar:w-auto'}`}>
                                    <p className="text-[13px] font-['Playfair_Display',serif] tracking-wide text-slate-200 truncate leading-tight">{user?.firstName || 'Staff Profile'}</p>
                                    <p className="text-[10px] text-slate-500 capitalize truncate mt-0.5">{user?.role?.replace('_', ' ')}</p>
                                </div>
                            </Link>
                            <button onClick={(e) => { e.stopPropagation(); logout(); }} className={`text-slate-500 hover:text-rose-400 p-1.5 flex-shrink-0 transition-all duration-200 rounded-md hover:bg-rose-500/10 ${sidebarOpen ? 'opacity-100' : 'opacity-0 group-hover/sidebar:opacity-100'}`} title="Sign Out">
                                <span className="material-symbols-outlined text-[16px]">logout</span>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className={`flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#f8fafc] transition-all duration-300 ${sidebarOpen ? 'lg:pl-[280px]' : 'lg:pl-[68px]'}`}>
                    {/* Header */}
                    <header className="h-[56px] bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40 flex-shrink-0">
                        {/* Left: Breadcrumb + Title */}
                        <div className="flex flex-col justify-center">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-0.5">VidyaLoans</p>
                            <h1 className="text-[18px] font-semibold text-slate-800 leading-tight">
                                {sectionTitles[activeSection] || activeSection}
                            </h1>
                        </div>

                        {/* Center: Search (F30) */}
                        <div className="relative hidden md:block">
                            {/* <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span> */}
                            {/* <input
                                type="text"
                                value={searchQuery}
                                onChange={e => handleGlobalSearch(e.target.value)}
                                onFocus={() => { if (searchResults.length > 0) setShowSearchSuggestions(true); }}
                                placeholder="Search applications, students, banks, IDs... (F30)"
                                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-white rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 focus:bg-white w-72 transition-all text-slate-700 placeholder:text-slate-400 shadow-sm focus:shadow-md hover:shadow-sm"
                            /> */}
                            {isSearching && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
                            )}
                            {showSearchSuggestions && searchResults.length > 0 && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowSearchSuggestions(false)} />
                                    <div className="absolute left-0 mt-2 w-[400px] max-h-[300px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 space-y-1">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-1 border-b border-slate-100">
                                            Found {searchResults.length} Results
                                        </div>
                                        {searchResults.map(app => (
                                            <div
                                                key={app.id}
                                                onClick={() => {
                                                    setShowSearchSuggestions(false);
                                                    setSearchQuery("");
                                                    setSearchResults([]);
                                                    router.push(`/staff/applications?id=${app.id}`);
                                                }}
                                                className="p-3 hover:bg-slate-50 rounded-lg flex items-center justify-between cursor-pointer transition-colors group"
                                            >
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 truncate">{app.firstName} {app.lastName}</p>
                                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">{app.applicationNumber || app.id} | {app.universityName || 'Tier-2 University'}</p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${['approved', 'sanctioned', 'disbursed'].includes(app.status?.toLowerCase())
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                        : ['rejected', 'cancelled'].includes(app.status?.toLowerCase())
                                                            ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                                                        }`}>
                                                        {app.status || 'Draft'}
                                                    </span>
                                                    <p className="text-[9px] text-slate-400 mt-1 font-bold">₹{(app.amount || 0).toLocaleString('en-IN')}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Right: Notifications + User + Logout */}
                        <div className="flex items-center gap-3">
                            {/* Real-time Sync Timer */}
                            <div className="hidden lg:flex items-center gap-4 border-r border-slate-200 pr-4">
                                <div className="flex items-center gap-1.5 text-[14px] text-black-600 font-bold uppercase tracking-widest font-mono">
                                    <span>{format(nowTime, 'MMM dd, HH:mm:ss')}</span>
                                </div>
                            </div>

                            <NotificationsPanel
                                staffId={user?.id}
                                maxDisplay={8}
                                showUnreadBadge={true}
                            />
                            <div className="h-5 w-px bg-slate-200" />
                            <div className="flex items-center gap-2">
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                                    alt="Avatar"
                                    className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 object-cover"
                                />
                                <div className="hidden sm:flex flex-col">
                                    <span className="text-[12px] font-semibold text-slate-800 leading-none">{user?.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName[0] + '.' : ''}` : 'Staff'}</span>
                                    <span className="text-[10px] text-slate-400 capitalize leading-none mt-0.5">{user?.role?.replace('_', ' ') || 'Staff'}</span>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                title="Sign Out"
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            >
                                <span className="material-symbols-outlined text-[20px]">logout</span>
                            </button>
                        </div>
                    </header>

                    <div className={`staff-dashboard-body flex-1 ${(activeSection.startsWith('chat_') || activeSection === 'onboarding') ? 'p-0 overflow-hidden' : 'p-6 overflow-y-auto space-y-5 custom-scrollbar'} bg-[#f8fafc]`}>
                        {children}
                    </div>
                </main>
            </div>
        </StaffLayoutContext.Provider>
    );
}
