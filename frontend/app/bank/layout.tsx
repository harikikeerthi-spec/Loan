"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { format } from "date-fns";
import BankNotificationsPanel from "@/components/bank/BankNotificationsPanel";
import SupportTicketModal from "@/components/SupportTicketModal";

const bankLogos: Record<string, string> = {
    auxilo: "/banks/auxilo.png",
    avanse: "/banks/avanse.png",
    credila: "/banks/credila.png",
    idfc: "/banks/idfc.png",
    poonawalla: "/banks/poonawalla.jpg",
};

// --- Components ---

const NavItem = ({ icon, label, path, active, collapsed, badge }: any) => {
    return (
        <Link
            href={path}
            className={`flex items-center py-2.5 px-3.5 rounded-md transition-all duration-300 relative group overflow-hidden ${active
                ? "text-[#0A2540] bg-[#4F46E5]/10 font-bold opacity-100"
                : "text-gray-500 hover:text-[#0A2540] hover:bg-gray-50 hover:opacity-100"
                }`}
        >
            {/* Active state vertical indicator on left edge */}
            {active && (
                <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[#4F46E5] rounded-r-md" />
            )}

            <div className="flex items-center gap-3.5 min-w-0 flex-1 relative z-10">
                <span className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${active ? "scale-110 text-[#4F46E5]" : "group-hover:scale-105 text-gray-500 group-hover:text-[#0A2540]"
                    }`}>
                    {icon}
                </span>

                {!collapsed && (
                    <span className={`text-[13px] tracking-wide whitespace-nowrap truncate font-sans ${active ? "text-[#0A2540] font-semibold" : "text-gray-650 font-medium"
                        }`}>
                        {label}
                    </span>
                )}

                {(typeof badge === 'number' ? badge > 0 : !!badge) && !collapsed && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[8.5px] font-bold shrink-0 ${active
                        ? "bg-[#4F46E5] text-white"
                        : "bg-gray-200 text-gray-700"
                        }`}>
                        {badge}
                    </span>
                )}
            </div>
        </Link >
    );
};

export default function BankLayout({ children }: { children: React.ReactNode }) {
    const { user, isBank, isAdmin, isLoading, logout, token } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(true);
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
                { icon: "confirmation_number", label: "Support Tickets", path: "/bank/support-tickets" },
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

    const [isSupportOpen, setIsSupportOpen] = useState(false);

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
            background: "linear-gradient(180deg, #F8F9FA 0%, #F4F5F7 100%)"
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
                className="fixed h-screen z-50 flex flex-col overflow-hidden bg-[#0f172a] text-slate-300 border-r border-slate-800 shadow-xl"
            >
                {/* Logo Section */}
                <div className="h-14 px-4 flex items-center border-b border-slate-800 flex-shrink-0 gap-2.5">
                    <img
                        src="/images/vidyaloans-logo-transparent.png"
                        alt="VidyaLoans Logo"
                        className="w-7 h-7 object-contain flex-shrink-0"
                    />
                    <AnimatePresence>
                        {isOpened && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center gap-2 min-w-0 flex-1"
                            >
                                <span className="font-semibold text-[13px] text-white tracking-wide whitespace-nowrap">
                                    VidyaLoans<span className="text-indigo-400"> Bank</span>
                                </span>
                                {selectedBankKey && bankLogos[selectedBankKey] && (
                                    <>
                                        <div className="h-4 w-px bg-slate-700 shrink-0 mx-0.5" />
                                        <img
                                            src={bankLogos[selectedBankKey]}
                                            alt={bankName}
                                            className="h-6 max-w-[60px] object-contain rounded shrink-0 bg-white/10 p-0.5"
                                            title={bankName}
                                        />
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Nav Section */}
                <nav className="flex-1 px-2 space-y-4 overflow-y-auto custom-scrollbar py-3">
                    {categorizedNav.map((cat, idx) => (
                        <div key={idx} className="space-y-1">
                            {isOpened && (
                                <div className="px-3 mb-1 mt-1 text-[10px] font-semibold text-slate-500 uppercase tracking-widest leading-none">
                                    {cat.category}
                                </div>
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
                <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex-shrink-0">
                    <div className="flex items-center gap-3 mb-3 p-1">
                        <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                            alt="Avatar"
                            className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 object-cover flex-shrink-0"
                        />
                        {isOpened && (
                            <div className="min-w-0 flex-1">
                                <p className="text-[12px] font-medium text-slate-200 truncate">{user.firstName} {user.lastName}</p>
                                <p className="text-[10px] text-slate-500 capitalize truncate">Bank Auditor</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={async () => {
                            await logout();
                            sessionStorage.removeItem("selectedBank");
                            router.push('/bank/login');
                        }}
                        className="w-full px-3 py-2 rounded bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 text-slate-300 border border-slate-700 hover:border-rose-500/30 transition-all text-[11px] font-semibold flex items-center justify-center gap-2"
                        title="Sign Out"
                    >
                        <span className="material-symbols-outlined text-[16px]">logout</span>
                        {isOpened && <span>Sign Out</span>}
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main
                className="flex-1 min-h-screen relative transition-all duration-300 flex flex-col pt-[72px]"
                style={{ paddingLeft: contentShiftWidth }}
            >
                {/* Persistent Top Header (F16 Notification Center & F30 Global Search) */}
                <header
                    className="fixed top-0 right-0 z-40 h-[72px] flex items-center justify-between px-8 border-b bg-white/80 backdrop-blur-md border-gray-200/50 shadow-sm"
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
                            className="w-full pl-9 pr-4 py-2 bg-[#F1F5F9] border-0 rounded-full text-xs font-semibold focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/15 focus:border-[#3B82F6] transition-all text-slate-800 placeholder-slate-400"
                        />
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>

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
                            <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full border border-[#E2E8F0] bg-white shadow-sm">
                                {bankLogos[selectedBankKey] ? (
                                    <img
                                        src={bankLogos[selectedBankKey]}
                                        alt={bankName}
                                        className="h-7 max-w-[60px] object-contain rounded"
                                        title={bankName}
                                    />
                                ) : (
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-black"
                                        style={{ background: 'linear-gradient(135deg, #6605c7, #8b24e5)' }}>
                                        {bankName?.[0] || 'B'}
                                    </div>
                                )}
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none">Partner Bank</span>
                                    <span className="text-[11.5px] font-bold text-gray-800 leading-tight truncate max-w-[120px]" title={bankName}>{bankName}</span>
                                </div>
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

                <style dangerouslySetInnerHTML={{ __html: `
                    .bank-portal main > div > div {
                        padding: 0 !important;
                    }
                `}} />

                <div className="relative p-6 lg:p-8">
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


