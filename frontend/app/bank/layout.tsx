"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { format } from "date-fns";
import BankNotificationsPanel from "@/components/bank/BankNotificationsPanel";

const bankLogos: Record<string, string> = {
    auxilo: "/banks/auxilo.png",
    avanse: "/banks/avanse.png",
    credila: "/banks/credila.png",
    idfc: "/banks/idfc.png",
    poonawalla: "/banks/poonawalla.jpg",
};

// --- Components ---

const NavItem = ({ icon, label, path, active, collapsed, badge }: any) => {
    const isDashboard = path === "/bank/dashboard";
    const activeStyle = active
        ? isDashboard
            ? {
                background: 'linear-gradient(135deg, #6605c7, #8b24e5)',
                boxShadow: '0 4px 14px rgba(102, 5, 199, 0.22)'
            }
            : {
                background: '#111111',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }
        : undefined;

    return (
        <Link
            href={path}
            className={`flex items-center py-2 px-3 rounded-xl transition-all relative group overflow-hidden ${active ? "text-white" : "text-gray-500 hover:text-gray-900"
                }`}
            style={activeStyle}
        >
            <div className="flex items-center gap-3 min-w-0 flex-1 relative z-10">
                {/* Hover background */}
                {!active && (
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: 'rgba(102, 5, 199, 0.04)' }} />
                )}

                <span className={`material-symbols-outlined text-[18px] relative z-10 transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-105"} ${active ? "text-white" : "text-gray-500 group-hover:text-gray-900"}`}>
                    {icon}
                </span>

                {!collapsed && (
                    <span className="text-[13.5px] font-bold tracking-wide relative z-10 whitespace-nowrap truncate">
                        {label}
                    </span>
                )}

                {badge && !collapsed && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-extrabold relative z-10 shrink-0 ${active
                        ? isDashboard ? "bg-white text-[#6605c7]" : "bg-white/20 text-white border border-white/10"
                        : "bg-[#6605c7] text-white"
                        }`}>
                        {badge}
                    </span>
                )}
            </div>

            {/* Collapsed Tooltip */}
            {/* {collapsed && (
                <div className="absolute left-16 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-[10px] font-bold tracking-wider uppercase rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap shadow-lg">
                    {label}
                    {badge && (
                        <span className="ml-1.5 px-1 py-0.2 bg-white/20 rounded text-[8px] font-extrabold">
                            {badge}
                        </span>
                    )}
                </div>
            )} */}
        </Link>
    );
};

export default function BankLayout({ children }: { children: React.ReactNode }) {
    const { user, isBank, isAdmin, isLoading, logout, token } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [hoverExpanded, setHoverExpanded] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const [syncTime, setSyncTime] = useState("");


    useEffect(() => {
        setSyncTime(format(new Date(), 'MMM dd, HH:mm:ss'));
        const interval = setInterval(() => {
            setSyncTime(format(new Date(), 'MMM dd, HH:mm:ss'));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Sidebar badge counts
    const [incomingCount, setIncomingCount] = useState(0);
    const [loggedCount, setLoggedCount] = useState(0);
    const [chatCount, setChatCount] = useState(0);

    const [bankName, setBankName] = useState("SBI");
    const [selectedBankKey, setSelectedBankKey] = useState("idfc");
    const [branchName, setBranchName] = useState("Hyderabad Branch");

    // Fetch unread chat count dynamically on 15s interval
    useEffect(() => {
        if (isLoading || !user || !token) return;

        const fetchChatUnreadCount = async () => {
            try {
                // Resolve bank name
                let currentBank = bankName;
                if (typeof window !== "undefined") {
                    const selected = sessionStorage.getItem("selectedBank") || localStorage.getItem("selectedBank");
                    const map: Record<string, string> = {
                        auxilo: "Auxilo Finserve",
                        avanse: "Avanse Financial",
                        credila: "HDFC Credila",
                        idfc: "IDFC FIRST Bank",
                        poonawalla: "Poonawalla Fincorp",
                    };
                    if (selected && map[selected]) {
                        currentBank = map[selected];
                    }
                }
                if (!currentBank) {
                    currentBank = user.bankName || user.firstName || "SBI";
                }

                const res = await fetch(`/api/chat/conversations?role=bank&bankName=${encodeURIComponent(currentBank)}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        const totalUnread = data.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);
                        setChatCount(totalUnread);
                    }
                }
            } catch (err) {
                console.error("Failed to load chat unread count:", err);
            }
        };

        fetchChatUnreadCount();
        const interval = setInterval(fetchChatUnreadCount, 15000);
        return () => clearInterval(interval);
    }, [user, isLoading, token, bankName]);

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

    // --- F30 Global Search States ---
    const [globalSearch, setGlobalSearch] = useState("");
    const [showSearchPop, setShowSearchPop] = useState(false);
    const [applications, setApplications] = useState<any[]>([]);

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
                            const isExcluded = ["rejected", "approved", "sanctioned", "disbursed", "disbursement_confirmed", "submitted", "pending", "draft", "docs_received", "staff_verified", "application_submitted"].includes(status);
                            if (!isExcluded) {
                                if (!hasLan) {
                                    incoming++;
                                } else {
                                    logged++;
                                }
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
            const selected = sessionStorage.getItem("selectedBank") || localStorage.getItem("selectedBank");
            if (selected) {
                setSelectedBankKey(selected);
                const map: Record<string, string> = {
                    auxilo: "Auxilo Finserve",
                    avanse: "Avanse Financial",
                    credila: "HDFC Credila",
                    idfc: "IDFC FIRST Bank",
                    poonawalla: "Poonawalla Fincorp",
                };
                setBankName(map[selected] || selected.toUpperCase());
            } else if (user?.firstName) {
                setSelectedBankKey("idfc");
                setBankName(user.firstName);
            }
        }
    }, [user]);

    const categorizedNav = useMemo(() => [
        {
            category: "Core Workflow",
            items: [
                { icon: "dashboard", label: "Overview Dashboard", path: "/bank/dashboard" },
                { icon: "download", label: "Incoming Queue", path: "/bank/incoming", badge: incomingCount },
                { icon: "assignment", label: "My Files (Logged)", path: "/bank/applications", badge: loggedCount },
                { icon: "view_kanban", label: "Kanban Files Board", path: "/bank/kanban" },
                { icon: "gavel", label: "Decisions Hub", path: "/bank/decisions" },
                { icon: "payments", label: "Disbursement Board", path: "/bank/disbursements" },
            ]
        },
        {
            category: "Collaboration & Operations",
            items: [
                { icon: "forum", label: "Secure Chat Stream", path: "/bank/chat", badge: chatCount },
                { icon: "assignment_add", label: "Task Matrix", path: "/bank/tasks" },
                { icon: "calendar_month", label: "Calendar View", path: "/bank/calendar" },
                { icon: "folder_shared", label: "Document Vault", path: "/bank/documents" },
                { icon: "receipt_long", label: "Processing Fees", path: "/bank/fees" },
            ]
        },
        {
            category: "Analytics & Settings",
            items: [
                { icon: "monitoring", label: "Analytics & SLA", path: "/bank/analytics" },
                { icon: "extension", label: "System Integrations", path: "/bank/integrations" },
                { icon: "lan", label: "Branch Matrix", path: "/bank/branches" },
                { icon: "shopping_bag", label: "Active Products", path: "/bank/products" },
                { icon: "settings", label: "Settings & Profile", path: "/bank/settings" },
            ]
        }
    ], [incomingCount, loggedCount, chatCount]);

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

    const isOpened = !collapsed || hoverExpanded;
    const sidebarWidth = isOpened ? 280 : 80;
    const contentShiftWidth = collapsed ? 80 : 280;

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
            <motion.aside
                initial={false}
                animate={{ width: sidebarWidth }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                onMouseEnter={() => {
                    if (collapsed) {
                        setHoverExpanded(true);
                    }
                }}
                onMouseLeave={() => {
                    setHoverExpanded(false);
                }}
                className="fixed h-screen z-50 flex flex-col overflow-hidden"
                style={{
                    background: 'rgba(255, 255, 255, 0.45)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.6)',
                    boxShadow: '10px 0 30px rgba(0, 0, 0, 0.03)'
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
                        {isOpened && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center gap-2 min-w-0 flex-1"
                            >
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xl font-extrabold text-gray-900 leading-none tracking-tight" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                                        Vidya<span style={{ color: '#6605c7' }}>Bank</span>
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] mt-1.5 opacity-55"
                                        style={{ color: '#6605c7', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                                        Partner Matrix
                                    </span>
                                </div>
                                {selectedBankKey && bankLogos[selectedBankKey] && (
                                    <>
                                        <div className="h-6 w-px bg-gray-200 shrink-0 mx-0.5" />
                                        <img
                                            src={bankLogos[selectedBankKey]}
                                            alt={bankName}
                                            className="h-8 max-w-[75px] object-contain rounded shrink-0"
                                            title={bankName}
                                        />
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Nav Section */}
                <nav className="flex-1 px-3 space-y-4 overflow-y-auto no-scrollbar py-2">
                    {categorizedNav.map((cat, idx) => (
                        <div key={idx} className="space-y-1">
                            {isOpened && (
                                <p className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#6605c7] opacity-80 mb-2">
                                    {cat.category}
                                </p>
                            )}
                            <div className="space-y-0.5">
                                {cat.items.map((item) => (
                                    <NavItem
                                        key={item.path}
                                        {...item}
                                        active={pathname === item.path || (item.path !== "/bank/dashboard" && pathname.startsWith(item.path))}
                                        collapsed={!isOpened}
                                    />
                                ))}
                            </div>
                        </div>
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
                            {isOpened && <span className="text-[11px] font-semibold tracking-wide">Collapse</span>}
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
                            {isOpened && <span className="text-[11px] font-semibold tracking-wide">Sign Out</span>}
                        </button>
                    </div>

                    <div
                        className="flex items-center gap-2.5 p-2.5 rounded-xl border"
                        style={{
                            backgroundColor: 'rgba(102, 5, 199, 0.02)',
                            borderColor: 'rgba(102, 5, 199, 0.05)',
                            boxShadow: 'inset 2px 2px 6px rgba(102, 5, 199, 0.08), inset -2px -2px 6px rgba(255, 255, 255, 0.9)',
                            justifyContent: isOpened ? undefined : 'center'
                        }}
                    >
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0 shadow-md"
                            style={{ background: 'linear-gradient(135deg, #6605c7, #8b24e5)' }}
                        >
                            {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <AnimatePresence>
                            {isOpened && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex-1 min-w-0"
                                >
                                    <p className="text-[13px] font-bold text-gray-900 truncate">
                                        {user.firstName} {user.lastName}
                                    </p>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-0.5">
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
                style={{ paddingLeft: contentShiftWidth }}
            >
                {/* Persistent Top Header (F16 Notification Center & F30 Global Search) */}
                <header
                    className="fixed top-0 right-0 z-40 h-[72px] flex items-center justify-between px-8 border-b bg-white/70 backdrop-blur-md border-purple-50 shadow-sm"
                    style={{ left: contentShiftWidth }}
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
                            className="w-full pl-8 pr-4 py-2 bg-transparent border-b border-gray-200 text-xs font-semibold focus:outline-none focus:border-gray-900 transition-all"
                        />
                        <span className="material-symbols-outlined absolute left-1 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>

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
                        {/* Partner Bank Identity Badge */}
                        {selectedBankKey && (
                            <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-xl border"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(102,5,199,0.04) 0%, rgba(139,36,229,0.03) 100%)',
                                    borderColor: 'rgba(102,5,199,0.12)',
                                    boxShadow: '0 2px 8px rgba(102,5,199,0.06)'
                                }}
                            >
                                {bankLogos[selectedBankKey] ? (
                                    <img
                                        src={bankLogos[selectedBankKey]}
                                        alt={bankName}
                                        className="h-7 max-w-[60px] object-contain rounded"
                                        title={bankName}
                                    />
                                ) : (
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[9px] font-black"
                                        style={{ background: 'linear-gradient(135deg, #6605c7, #8b24e5)' }}>
                                        {bankName?.[0] || 'B'}
                                    </div>
                                )}
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none">Partner Bank</span>
                                    <span className="text-[11.5px] font-bold text-gray-800 leading-tight truncate max-w-[120px]" title={bankName}>{bankName}</span>
                                </div>
                                {/* <div className="flex items-center gap-1 ml-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wide">Live</span>
                                </div> */}
                            </div>
                        )}

                        {/* Live Protocol tag & Real-time Sync Timer */}
                        <div className="hidden sm:flex items-center gap-4 border-r border-gray-100 pr-4">

                            {/* <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9.5px] font-black text-emerald-600 uppercase tracking-widest">Active Node</span>
                            </div> */}
                            <div className="flex items-center gap-1.5 text-[9.5px] text-black-400 font-bold uppercase tracking-widest font-mono">
                                {/* <span className="material-symbols-outlined text-[13px]">sync</span> */}
                                <span>{syncTime || '--:--:--'}</span>
                            </div>
                        </div>

                        {/* Real-time Notification Bell (Socket.io live) */}
                        <BankNotificationsPanel showUnreadBadge={true} />
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


