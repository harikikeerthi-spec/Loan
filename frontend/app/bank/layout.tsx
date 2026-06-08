"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { adminApi } from "@/lib/api";

// --- Components ---

const NavItem = ({ icon, label, path, active, collapsed, badge }: any) => (
    <Link
        href={path}
        className={`flex items-center py-2 px-3 rounded-xl transition-all relative group overflow-hidden ${
            active ? "text-white" : "text-gray-400 hover:text-gray-800"
        }`}
        style={active ? {
            background: 'linear-gradient(135deg, #6605c7, #8b24e5)',
            boxShadow: '0 4px 14px rgba(102, 5, 199, 0.22)'
        } : undefined}
    >
        <div className="flex items-center gap-3 min-w-0 flex-1 relative z-10">
            {/* Hover background */}
            {!active && (
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: 'rgba(102, 5, 199, 0.06)' }} />
            )}

            <span className={`material-symbols-outlined text-[18px] relative z-10 transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-105"}`}>
                {icon}
            </span>

            {!collapsed && (
                <span className="text-[11.5px] font-semibold tracking-wide relative z-10 whitespace-nowrap truncate" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                    {label}
                </span>
            )}

            {badge && !collapsed && (
                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-extrabold relative z-10 shrink-0 ${
                    active ? "bg-white text-[#6605c7]" : "bg-[#6605c7] text-white"
                }`}>
                    {badge}
                </span>
            )}
        </div>

        {/* Collapsed Tooltip */}
        {collapsed && (
            <div className="absolute left-16 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-[10px] font-bold tracking-wider uppercase rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap shadow-lg">
                {label}
                {badge && (
                    <span className="ml-1.5 px-1 py-0.2 bg-white/20 rounded text-[8px] font-extrabold">
                        {badge}
                    </span>
                )}
            </div>
        )}
    </Link>
);

export default function BankLayout({ children }: { children: React.ReactNode }) {
    const { user, isBank, isAdmin, isLoading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Sidebar badge counts
    const [incomingCount, setIncomingCount] = useState(0);
    const [loggedCount, setLoggedCount] = useState(0);
    const [chatCount, setChatCount] = useState(2); // Mock unread chat messages

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (!isLoading && pathname !== '/bank/login' && (!user || (!isBank && !isAdmin))) {
            router.push('/bank/login');
        }
    }, [user, isLoading, isBank, isAdmin, router, pathname]);

    const [bankName, setBankName] = useState("SBI");
    const [branchName, setBranchName] = useState("Hyderabad Branch");

    // --- F16 Notifications & F30 Global Search States ---
    const [globalSearch, setGlobalSearch] = useState("");
    const [showSearchPop, setShowSearchPop] = useState(false);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [activeNotifTab, setActiveNotifTab] = useState<"all" | "unread" | "read">("all");
    const [applications, setApplications] = useState<any[]>([]);
    const [notifications, setNotifications] = useState([
        { id: 1, title: "SLA Warning", text: "LAN-IDFC-89210 (Rahul Sen) has exceeded 48h underwriting window!", type: "warning", time: "12m ago", read: false },
        { id: 2, title: "Document Uploaded", text: "Student Sneha Reddy uploaded visa approval records.", type: "info", time: "1h ago", read: false },
        { id: 3, title: "Query Refined", text: "Re-verification file uploaded for LAN-SBI-10492.", type: "query", time: "3h ago", read: false }
    ]);

    const filteredNotifications = useMemo(() => {
        if (activeNotifTab === "unread") return notifications.filter(n => !n.read);
        if (activeNotifTab === "read") return notifications.filter(n => n.read);
        return notifications;
    }, [notifications, activeNotifTab]);

    const toggleRead = (id: number) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: !n.read } : n));
    };

    const highlightMatch = (text: string, query: string) => {
        if (!text) return "";
        if (!query.trim()) return text;
        const index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) return text;
        const before = text.substring(0, index);
        const match = text.substring(index, index + query.length);
        const after = text.substring(index + query.length);
        return (
            <>
                {before}
                <mark className="bg-yellow-250 text-purple-900 rounded-sm font-black px-0.5">{match}</mark>
                {after}
            </>
        );
    };

    const searchResults = useMemo(() => {
        if (!globalSearch.trim()) return [];
        const query = globalSearch.toLowerCase();
        return applications.filter(app => {
            const fullName = `${app.firstName || ""} ${app.lastName || ""}`.toLowerCase();
            const lan = (app.lanNumber || "").toLowerCase();
            const appNum = (app.applicationNumber || "").toLowerCase();
            const uni = (app.universityName || "").toLowerCase();
            return fullName.includes(query) || lan.includes(query) || appNum.includes(query) || uni.includes(query);
        }).slice(0, 8);
    }, [globalSearch, applications]);

    // Fetch counts for badges
    useEffect(() => {
        if (!isLoading && user && (isBank || isAdmin)) {
            const savedBank = sessionStorage.getItem("selectedBank") || localStorage.getItem("selectedBank") || "idfc";
            adminApi.getApplications({ bank: savedBank })
                .then((res: any) => {
                    if (res && res.success && Array.isArray(res.data)) {
                        setApplications(res.data);
                        let incoming = 0;
                        let logged = 0;
                        res.data.forEach((app: any) => {
                            const hasLan = !!app.lanNumber;
                            const status = app.status;
                            if (!hasLan && status !== "rejected" && status !== "approved" && status !== "disbursed") {
                                incoming++;
                            } else if (hasLan && status !== "rejected" && status !== "approved" && status !== "disbursed") {
                                logged++;
                            }
                        });
                        setIncomingCount(incoming);
                        setLoggedCount(logged);
                    }
                })
                .catch(err => console.error("Failed to load badge stats in sidebar:", err));
        }
    }, [user, isLoading, isBank, isAdmin, pathname]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const selected = sessionStorage.getItem("selectedBank");
            if (selected) {
                const map: Record<string, string> = {
                    auxilo: "Auxilo Finserve",
                    avanse: "Avanse Financial",
                    credila: "HDFC Credila",
                    idfc: "IDFC FIRST Bank",
                    poonawalla: "Poonawalla Fincorp",
                };
                setBankName(map[selected] || selected.toUpperCase());
            } else if (user?.firstName) {
                setBankName(user.firstName);
            }
        }
    }, [user]);

    const navItems = [
        { icon: "dashboard", label: "Overview Dashboard", path: "/bank/dashboard" },
        { icon: "calendar_month", label: "Calendar View", path: "/bank/calendar" },
        { icon: "download", label: "Incoming Queue", path: "/bank/incoming", badge: incomingCount },
        { icon: "assignment", label: "My Files (Logged)", path: "/bank/applications", badge: loggedCount },
        { icon: "view_kanban", label: "Kanban Files Board", path: "/bank/kanban" },
        { icon: "folder_shared", label: "Document Vault", path: "/bank/documents" },
        { icon: "gavel", label: "Decisions Hub", path: "/bank/decisions" },
        { icon: "payments", label: "Disbursement Board", path: "/bank/disbursements" },
        { icon: "receipt_long", label: "Processing Fees", path: "/bank/fees" },
        { icon: "forum", label: "Secure Chat Stream", path: "/bank/chat", badge: chatCount },
        { icon: "assignment_add", label: "Task Matrix", path: "/bank/tasks" },
        { icon: "monitoring", label: "Analytics & SLA", path: "/bank/analytics" },
        { icon: "extension", label: "System Integrations", path: "/bank/integrations" },
        { icon: "lan", label: "Branch Matrix", path: "/bank/branches" },
        { icon: "shopping_bag", label: "Active Products", path: "/bank/products" },
        { icon: "settings", label: "Settings & Profile", path: "/bank/settings" },
    ];

    if (pathname === '/bank/login') {
        return <>{children}</>;
    }


    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-gray-100 rounded-full animate-spin"
                        style={{ borderTopColor: '#6605c7' }} />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 animate-pulse">
                        Synchronizing Node...
                    </p>
                </div>
            </div>
        );
    }

    if (!user || (!isBank && !isAdmin)) return null;

    const sidebarWidth = collapsed ? 80 : 280;


    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const clearNotification = (id: number) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    return (
        <div className="bank-portal min-h-screen flex overflow-hidden" style={{
            background: `
                radial-gradient(ellipse 80% 60% at 0% 0%, rgba(102, 5, 199, 0.12) 0%, transparent 60%),
                radial-gradient(ellipse 60% 50% at 100% 0%, rgba(139, 36, 229, 0.08) 0%, transparent 55%),
                radial-gradient(ellipse 70% 70% at 50% 100%, rgba(79, 70, 229, 0.07) 0%, transparent 60%),
                radial-gradient(ellipse 50% 40% at 100% 60%, rgba(168, 85, 247, 0.06) 0%, transparent 50%),
                linear-gradient(160deg, #f5f0ff 0%, #faf8ff 40%, #f0f4ff 70%, #f8f5ff 100%)
            `
        }}>
            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: sidebarWidth }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="fixed h-screen z-50 flex flex-col shadow-2xl overflow-hidden"
                style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,244,255,0.88) 100%)',
                    backdropFilter: 'blur(28px)',
                    WebkitBackdropFilter: 'blur(28px)',
                    borderRight: '1px solid rgba(102, 5, 199, 0.12)',
                    boxShadow: '4px 0 40px rgba(102, 5, 199, 0.06)'
                }}
            >
                {/* Logo Section */}
                <div className="flex items-center gap-3 px-4 py-4 mb-2">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #6605c7, #8b24e5)', boxShadow: '0 6px 16px rgba(102,5,199,0.3)' }}
                    >
                        <span className="material-symbols-outlined text-lg">account_balance</span>
                    </div>
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col min-w-0"
                            >
                                <span className="text-lg font-bold text-gray-900 leading-none tracking-tight" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                                    Vidya<span style={{ color: '#6605c7' }}>Bank</span>
                                </span>
                                <span className="text-[8.5px] font-bold uppercase tracking-[0.2em] mt-1 opacity-55"
                                    style={{ color: '#6605c7', fontFamily: '"DM Sans", sans-serif' }}>
                                    Partner Matrix
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Nav Section */}
                <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto no-scrollbar">
                    {navItems.map((item) => (
                        <NavItem
                            key={item.path}
                            {...item}
                            active={pathname === item.path || (item.path !== "/bank/dashboard" && pathname.startsWith(item.path))}
                            collapsed={collapsed}
                        />
                    ))}
                </nav>

                {/* Footer Section */}
                <div className="mt-auto px-3 pb-4 space-y-2">
                    <div className="flex gap-1.5">
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            title="Collapse"
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-2 rounded-xl text-gray-400 transition-all group"
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                        >
                            <span className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}>
                                chevron_left
                            </span>
                            {!collapsed && <span className="text-[11px] font-semibold tracking-wide" style={{ fontFamily: '"DM Sans", sans-serif' }}>Collapse</span>}
                        </button>

                        <button
                            onClick={async () => {
                                await logout();
                                sessionStorage.removeItem("selectedBank");
                                router.push('/bank/login');
                            }}
                            title="Sign Out"
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-2 rounded-xl transition-all group"
                            style={{ color: '#f43f5e' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(244,63,94,0.06)')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                        >
                            <span className="material-symbols-outlined text-[18px] group-hover:rotate-12 transition-transform">power_settings_new</span>
                            {!collapsed && <span className="text-[11px] font-semibold tracking-wide" style={{ fontFamily: '"DM Sans", sans-serif' }}>Sign Out</span>}
                        </button>
                    </div>

                    <div
                        className="flex items-center gap-2.5 p-2.5 rounded-xl border"
                        style={{
                            backgroundColor: 'rgba(102, 5, 199, 0.03)',
                            borderColor: 'rgba(102, 5, 199, 0.08)',
                            justifyContent: collapsed ? 'center' : undefined
                        }}
                    >
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0 shadow-md"
                            style={{ background: 'linear-gradient(135deg, #6605c7, #8b24e5)', fontFamily: '"DM Sans", sans-serif' }}
                        >
                            {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <AnimatePresence>
                            {!collapsed && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex-1 min-w-0"
                                >
                                    <p className="text-[11.5px] font-bold text-gray-900 truncate" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                                        {user.firstName} {user.lastName}
                                    </p>
                                    <p className="text-[8.5px] font-semibold text-gray-400 uppercase tracking-widest mt-0.5" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                                        Bank Auditor
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main
                className="flex-1 min-h-screen relative transition-all duration-300 flex flex-col pt-20"
                style={{ paddingLeft: sidebarWidth }}
            >
                {/* Persistent Top Header (F16 Notification Center & F30 Global Search) */}
                <header
                    className="fixed top-0 right-0 z-40 h-[72px] flex items-center justify-between px-8 border-b bg-white/70 backdrop-blur-md border-purple-50 shadow-sm"
                    style={{ left: sidebarWidth }}
                >
                    {/* F30 Global Search Bar */}
                    <div className="relative w-full max-w-md">
                        <input
                            type="text"
                            placeholder="Global Search: Student name, LAN, university..."
                            value={globalSearch}
                            onChange={(e) => {
                                setGlobalSearch(e.target.value);
                                setShowSearchPop(true);
                            }}
                            onFocus={() => setShowSearchPop(true)}
                            className="w-full pl-10 pr-4 py-2.5 bg-[#fbfbff] border border-purple-50 rounded-2xl text-xs font-semibold focus:outline-none focus:border-[#6605c7] shadow-sm transition-all"
                        />
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>

                        {/* Search Results Popover */}
                        <AnimatePresence>
                            {showSearchPop && globalSearch.trim() && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowSearchPop(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-12 left-0 right-0 z-50 bg-white border border-purple-50 rounded-2xl shadow-xl p-4 max-h-80 overflow-y-auto space-y-2.5"
                                    >
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">
                                            Search Results ({searchResults.length})
                                        </p>
                                        {searchResults.length === 0 ? (
                                            <p className="text-[10px] text-gray-400 py-2 text-center">No concurrent application records match.</p>
                                        ) : (
                                            searchResults.map(res => (
                                                <div
                                                    key={res.id}
                                                    onClick={() => {
                                                        setShowSearchPop(false);
                                                        setGlobalSearch("");
                                                        router.push(`/bank/applications?id=${res.id}`);
                                                    }}
                                                    className="flex justify-between items-center p-2.5 rounded-xl hover:bg-purple-50/50 cursor-pointer border border-transparent hover:border-purple-100 transition-all"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <span className="text-[11.5px] font-black text-gray-800 block uppercase truncate">
                                                            {highlightMatch(`${res.firstName || ""} ${res.lastName || ""}`, globalSearch)}
                                                        </span>
                                                        <span className="text-[9px] text-gray-400 font-bold block mt-0.5 truncate">
                                                            {highlightMatch(res.universityName || "Global University", globalSearch)}
                                                        </span>
                                                    </div>
                                                    <div className="text-right shrink-0 ml-4">
                                                        <span className="text-[10px] font-black text-[#6605c7] block font-mono">
                                                            ₹{res.amount?.toLocaleString()}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase font-mono block mt-0.5">
                                                            {highlightMatch(res.lanNumber || res.applicationNumber || "", globalSearch)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* F16 Notification Center & System Ticker */}
                    <div className="flex items-center gap-6">
                        {/* Live Protocol tag */}
                        <div className="hidden sm:flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9.5px] font-black text-emerald-600 uppercase tracking-widest">Active Node</span>
                        </div>

                        {/* Bell Notification Trigger */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                                className="w-10 h-10 rounded-xl bg-[#fbfbff] border border-purple-50 hover:bg-purple-50/40 text-gray-500 hover:text-[#6605c7] flex items-center justify-center relative transition-all"
                            >
                                <span className="material-symbols-outlined text-lg">notifications</span>
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center shadow-md animate-bounce">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown (F16 Center) */}
                            <AnimatePresence>
                                {showNotifDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowNotifDropdown(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 top-12 z-50 w-80 bg-white/95 backdrop-blur-xl border border-purple-50 rounded-3xl shadow-2xl p-5 space-y-4"
                                        >                                            <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                                                <h3 className="text-xs font-black text-gray-800 uppercase tracking-wide">
                                                    Notifications Center
                                                </h3>
                                                {unreadCount > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={markAllRead}
                                                        className="text-[9px] font-black text-[#6605c7] uppercase tracking-wider hover:underline"
                                                    >
                                                        Mark all read
                                                    </button>
                                                )}
                                            </div>

                                            {/* Filter Tabs */}
                                            <div className="flex gap-1.5 p-0.5 bg-gray-50 rounded-xl border border-gray-100 text-[8.5px] font-black uppercase tracking-wider">
                                                {(["all", "unread", "read"] as const).map(tab => (
                                                    <button
                                                        key={tab}
                                                        onClick={() => setActiveNotifTab(tab)}
                                                        className={`flex-1 py-1 rounded-lg text-center transition-all ${
                                                            activeNotifTab === tab 
                                                                ? "bg-[#6605c7] text-white shadow-sm" 
                                                                : "text-gray-400 hover:text-gray-700"
                                                        }`}
                                                    >
                                                        {tab} ({
                                                            tab === "all" ? notifications.length :
                                                            tab === "unread" ? notifications.filter(n => !n.read).length :
                                                            notifications.filter(n => n.read).length
                                                        })
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                                                {filteredNotifications.length === 0 ? (
                                                    <p className="text-[10px] text-gray-400 py-8 text-center uppercase tracking-wider font-bold">No notifications</p>
                                                ) : (
                                                    filteredNotifications.map(notif => (
                                                        <div
                                                            key={notif.id}
                                                            onClick={() => toggleRead(notif.id)}
                                                            className={`p-3 border rounded-2xl relative transition-all cursor-pointer group ${
                                                                notif.read ? "bg-white border-gray-100 opacity-60 hover:opacity-100" : "bg-purple-50/20 border-purple-100 hover:bg-purple-50/30"
                                                            }`}
                                                        >
                                                            <div className="flex justify-between items-start pr-4">
                                                                <span className="text-[9.5px] font-black uppercase text-gray-800">{notif.title}</span>
                                                                <span className="text-[8px] font-bold text-gray-400">{notif.time}</span>
                                                            </div>
                                                            <p className="text-[10.5px] text-gray-550 mt-1 leading-relaxed">{notif.text}</p>
                                                            
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    clearNotification(notif.id);
                                                                }}
                                                                className="absolute top-2 right-2 text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <span className="material-symbols-outlined text-xs">close</span>
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                <div className="relative">
                    {children}
                </div>
            </main>

            {/* Decorative floating orbs */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                {/* Top-left violet orb */}
                <div style={{
                    position: 'absolute', top: '-10%', left: '-5%',
                    width: '500px', height: '500px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(102,5,199,0.10) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                    animation: 'float 12s ease-in-out infinite'
                }} />
                {/* Top-right amber orb */}
                <div style={{
                    position: 'absolute', top: '-5%', right: '-10%',
                    width: '400px', height: '400px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(224,195,137,0.12) 0%, transparent 70%)',
                    filter: 'blur(50px)',
                    animation: 'float 15s ease-in-out infinite reverse'
                }} />
                {/* Bottom-right indigo orb */}
                <div style={{
                    position: 'absolute', bottom: '-10%', right: '10%',
                    width: '450px', height: '450px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)',
                    filter: 'blur(45px)',
                    animation: 'float 18s ease-in-out infinite'
                }} />
                {/* Center-left soft pink orb */}
                <div style={{
                    position: 'absolute', top: '50%', left: '20%',
                    width: '300px', height: '300px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)',
                    filter: 'blur(35px)',
                    animation: 'float 10s ease-in-out infinite reverse'
                }} />
            </div>
        </div>
    );
}


