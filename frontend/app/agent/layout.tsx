"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AgentProvider, useAgent } from "./AgentContext";
import Link from "next/link";

function AgentLayoutInner({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [notificationsOpen, setNotificationsOpen] = React.useState(false);
    const {
        logout,
        toast,
        sidebarCollapsed, setSidebarCollapsed,
        sidebarOpen, setSidebarOpen,
        agentProfile
    } = useAgent();

    // Side navigation bar definition
    const navItems = [
        { section: "dashboard", icon: "space_dashboard", label: "Home Dashboard" },
        { section: "lead-submission", icon: "add_circle", label: "Submit Lead" },
        { section: "students", icon: "groups", label: "My Students" },
        { section: "documents", icon: "folder_shared", label: "Documents" },
        { section: "calendar", icon: "calendar_month", label: "Calendar" },
        { section: "commissions", icon: "account_balance_wallet", label: "Commissions" },
        { section: "profile", icon: "manage_accounts", label: "Profile & KYC" },
        { section: "analytics", icon: "monitoring", label: "Performance" },
        { section: "sub-agents", icon: "share_reviews", label: "Sub-Agents" },
        { section: "training", icon: "school", label: "LMS & Training" },
        { section: "alumni", icon: "diversity_3", label: "Alumni Referrals" },
        { section: "chat-staff", icon: "support_agent", label: "Staff RM Line" },
        { section: "chat-student", icon: "forum", label: "Student Line" },
        { section: "qr-code", icon: "qr_code_2", label: "QR Lead Capture" },
        { section: "tracking-links", icon: "link", label: "Tracking Links" },
        { section: "whatsapp-bot", icon: "chat_bubble", label: "WhatsApp Bot" },
        { section: "balance-transfer", icon: "swap_horiz", label: "Balance Transfer" },
    ];

    // Determine current section heading name
    const currentNavItem = navItems.find(item => pathname.startsWith(`/agent/${item.section}`));
    const sectionTitle = currentNavItem ? currentNavItem.label : "Agent Operations Hub";

    return (
        <div className="h-screen overflow-hidden bg-[#fcfaff] flex font-sans selection:bg-[#6605c7]/10 selection:text-[#6605c7]">
            {/* Toast Banner Alert */}
            {toast && (
                <div className="fixed top-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-xl bg-white border border-[#6605c7]/10 animate-fade-in-up flex items-center gap-3">
                    <span className={`material-symbols-outlined ${toast.type === 'success' ? 'text-emerald-500' : toast.type === 'warning' ? 'text-rose-500' : 'text-[#6605c7]'}`}>
                        {toast.type === 'success' ? 'check_circle' : toast.type === 'warning' ? 'warning' : 'info'}
                    </span>
                    <span className="text-xs font-bold text-gray-800">{toast.message}</span>
                </div>
            )}

            {/* Sidebar Navigation */}
            <aside className={`fixed inset-y-0 left-0 z-50 transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] lg:relative lg:translate-x-0 lg:h-full ${sidebarCollapsed ? "w-24 lg:w-24 p-3 lg:pr-2" : "w-80 lg:w-80 p-6 lg:pr-3"} ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="flex flex-col h-full bg-white rounded-[3rem] border border-[#6605c7]/5 shadow-[0_20px_50px_rgb(102,5,199,0.06)] overflow-hidden relative">
                    <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#6605c7]/5 to-transparent pointer-events-none" />
                    
                    {/* Brand Banner Logo */}
                    <div className={`py-6 ${sidebarCollapsed ? "px-2 justify-center" : "px-8 justify-between"} border-b border-[#6605c7]/5 relative z-10 flex items-center`}>
                        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                            <div className="w-10 h-10 rounded-[1rem] bg-gradient-to-br from-[#6605c7] to-[#8b24e5] flex items-center justify-center text-white shadow-xl shadow-[#6605c7]/30 transform group-hover:rotate-[15deg] transition-all duration-500 flex-shrink-0 overflow-hidden">
                                {agentProfile?.profileImage || "/agent-logo.png" ? (
                                    <img src={agentProfile?.profileImage || "/agent-logo.png"} alt="Agent Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined font-black text-xl">handshake</span>
                                )}
                            </div>
                            {!sidebarCollapsed && (
                                <div className="animate-fade-in overflow-hidden">
                                    <span className="font-display font-black text-xl lg:text-2xl tracking-tighter text-gray-900 block leading-tight break-words pr-2" title={agentProfile?.businessName || "VidyaAgent"}>
                                        {agentProfile?.businessName || <>Vidya<span className="text-[#6605c7]">Agent</span></>}
                                    </span>
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]/40 block mt-1">DSA Partner Hub</span>
                                </div>
                            )}
                        </div>
                        {!sidebarCollapsed && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setSidebarCollapsed(true); }} 
                                className="hidden lg:flex w-7 h-7 rounded-lg bg-gray-50 hover:bg-[#6605c7]/5 text-gray-400 hover:text-[#6605c7] items-center justify-center transition-all"
                                title="Collapse Sidebar"
                            >
                                <span className="material-symbols-outlined text-base">chevron_left</span>
                            </button>
                        )}
                    </div>

                    {/* Nav Items List */}
                    <nav className={`flex-1 ${sidebarCollapsed ? "px-1.5" : "px-4"} py-3 space-y-1.5 overflow-y-auto relative z-10 custom-scrollbar`}>
                        {!sidebarCollapsed && <p className="text-[9px] font-black text-[#6605c7]/40 uppercase tracking-[0.25em] px-4 mb-1">Main</p>}
                        
                        {navItems.map((item, idx) => {
                            const isActive = pathname.startsWith(`/agent/${item.section}`);
                            return (
                                <React.Fragment key={item.section}>
                                    {idx === 3 && !sidebarCollapsed && <p className="text-[9px] font-black text-[#6605c7]/40 uppercase tracking-[0.25em] px-4 pt-2 mb-1">Backoffice</p>}
                                    {idx === 7 && !sidebarCollapsed && <p className="text-[9px] font-black text-[#6605c7]/40 uppercase tracking-[0.25em] px-4 pt-2 mb-1">Grow Network</p>}
                                    {idx === 11 && !sidebarCollapsed && <p className="text-[9px] font-black text-[#6605c7]/40 uppercase tracking-[0.25em] px-4 pt-2 mb-1">Live Support</p>}
                                    {idx === 13 && !sidebarCollapsed && <p className="text-[9px] font-black text-[#6605c7]/40 uppercase tracking-[0.25em] px-4 pt-2 mb-1">Smart Tools</p>}
                                    
                                    <Link 
                                        href={`/agent/${item.section}`} 
                                        onClick={() => setSidebarOpen(false)}
                                        className={`w-full rounded-[1.25rem] flex items-center transition-all duration-300 ${sidebarCollapsed ? "justify-center p-2.5" : "px-4 py-2.5 gap-3 text-left"} ${isActive ? "bg-[#6605c7] text-white shadow-[0_12px_24px_rgb(102,5,199,0.3)] scale-[1.02]" : "text-gray-500 hover:bg-[#6605c7]/5 hover:text-[#6605c7]"}`}
                                        title={item.label}
                                    >
                                        <span className="material-symbols-outlined text-xl">{item.icon}</span>
                                        {!sidebarCollapsed && <span className="font-bold text-[10px] tracking-[0.15em] uppercase flex-1">{item.label}</span>}
                                    </Link>
                                </React.Fragment>
                            );
                        })}
                    </nav>

                    {/* Agent Session Info Footer */}
                    <div className={`${sidebarCollapsed ? "p-2" : "p-4"} border-t border-[#6605c7]/5 bg-[#fcfaff]/50 backdrop-blur-xl relative z-10 flex-shrink-0`}>

                        <button onClick={logout} className={`w-full py-2.5 rounded-[1rem] flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600 transition-all font-black text-[9px] tracking-widest uppercase border border-transparent hover:border-red-100 ${sidebarCollapsed ? "px-0" : "gap-2"}`} title="Terminate Session">
                            <span className="material-symbols-outlined text-base">logout</span>
                            {!sidebarCollapsed && <span>Terminate Session</span>}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Application Area */}
            <main className="flex-1 p-6 lg:pl-3 min-w-0 flex flex-col h-full overflow-hidden">
                <div className="flex-1 bg-white rounded-[3rem] border border-[#6605c7]/5 shadow-[0_20px_50px_rgb(102,5,199,0.06)] overflow-hidden flex flex-col relative">
                    
                    {/* Header bar */}
                    <header className="h-28 px-12 flex justify-between items-center sticky top-0 z-40 bg-white/70 backdrop-blur-3xl border-b border-[#6605c7]/5 flex-shrink-0">
                        <div className="flex items-center gap-10">
                            <button 
                                onClick={() => {
                                    if (window.innerWidth >= 1024) {
                                        setSidebarCollapsed(!sidebarCollapsed);
                                    } else {
                                        setSidebarOpen(!sidebarOpen);
                                    }
                                }} 
                                className="p-4 text-[#6605c7] hover:bg-[#6605c7]/5 rounded-2xl transition-all"
                                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                            >
                                <span className="material-symbols-outlined">
                                    {sidebarCollapsed ? "menu_open" : "menu"}
                                </span>
                            </button>
                            <div>
                                <h1 className="text-3xl font-black font-display text-gray-900 capitalize tracking-tighter leading-none mb-1">
                                    {sectionTitle}
                                </h1>
                                <p className="text-[10px] font-bold text-[#6605c7]/40 uppercase tracking-[0.2em]">{agentProfile?.businessName || "VidyaLoan Agency"} | June 2026</p>
                            </div>
                        </div>

                        {/* Support Desk Quick Trigger Info */}
                        <div className="flex items-center gap-8">
                            <div className="hidden lg:flex items-center gap-6 pr-6 border-r border-gray-100">
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1">Assigned Staff RM</p>
                                    <p className="text-xs font-black text-[#6605c7]">Neha Sharma</p>
                                </div>
                                <Link href="/agent/chat-staff" className="w-10 h-10 rounded-xl bg-[#6605c7]/5 border border-[#6605c7]/10 flex items-center justify-center text-[#6605c7] hover:bg-[#6605c7] hover:text-white transition-all">
                                    <span className="material-symbols-outlined text-xl">contact_phone</span>
                                </Link>
                            </div>
                            <div className="relative">
                                <button 
                                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                                    className="relative w-12 h-12 flex items-center justify-center rounded-2xl bg-[#6605c7]/5 text-[#6605c7] hover:bg-[#6605c7]/10 transition-all border border-[#6605c7]/10"
                                >
                                    <span className="material-symbols-outlined">notifications</span>
                                    <div className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
                                </button>

                                {notificationsOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                                        <div className="absolute right-0 mt-4 w-[480px] bg-white rounded-[2rem] shadow-[0_30px_60px_rgb(0,0,0,0.12)] border border-gray-100 overflow-hidden z-50 animate-fade-in-up">
                                            <div className="p-6 border-b border-gray-50 flex justify-between items-end bg-white">
                                                <div>
                                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Notifications</h3>
                                                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Last 24 Hours</p>
                                                </div>
                                                <button onClick={() => setNotificationsOpen(false)} className="text-[9px] font-black text-[#6605c7] uppercase tracking-widest hover:underline">
                                                    [Mark All as Read]
                                                </button>
                                            </div>
                                            
                                            <div className="max-h-[60vh] overflow-y-auto bg-white">
                                                <div className="p-5 hover:bg-gray-50/80 transition-colors border-b border-gray-50 flex gap-4 items-start cursor-pointer">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="text-[11px] font-black text-gray-900">Priya Sharma: Loan Sanctioned ₹14L by SBI</span>
                                                            <span className="text-[9px] font-bold text-gray-400">13:02</span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 font-bold">Commission: ₹9,800</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="p-5 bg-rose-50/30 hover:bg-rose-50/50 transition-colors border-b border-gray-50 flex gap-4 items-start cursor-pointer">
                                                    <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="text-[11px] font-black text-gray-900">HDFC Query on Rahul Sinha</span>
                                                            <span className="text-[9px] font-bold text-gray-400">12:31</span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 font-bold mb-2">Deadline: Today 5 PM</p>
                                                        <span className="inline-block px-2.5 py-1 bg-rose-100 text-rose-700 rounded text-[9px] font-black uppercase tracking-widest">[Take Action]</span>
                                                    </div>
                                                </div>

                                                <div className="p-5 hover:bg-gray-50/80 transition-colors border-b border-gray-50 flex gap-4 items-start cursor-pointer">
                                                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="text-[11px] font-black text-gray-900">Anjali Raju: Document verified by Staff</span>
                                                            <span className="text-[9px] font-bold text-gray-400">11:47</span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 font-bold">now pending bank submit</p>
                                                    </div>
                                                </div>

                                                <div className="p-5 hover:bg-gray-50/80 transition-colors border-b border-gray-50 flex gap-4 items-start cursor-pointer">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="text-[11px] font-black text-gray-900">System: SBI raised loan limit</span>
                                                            <span className="text-[9px] font-bold text-gray-400">10:00</span>
                                                        </div>
                                                        <button className="text-[10px] text-[#6605c7] font-black uppercase tracking-widest hover:underline mt-1">[Link] Read product update</button>
                                                    </div>
                                                </div>

                                                <div className="p-5 hover:bg-gray-50/80 transition-colors flex gap-4 items-start cursor-pointer">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="text-[11px] font-black text-gray-900">Venu Gopal: Loan Disbursed ₹12L</span>
                                                            <span className="text-[9px] font-bold text-gray-400">09:30</span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 font-bold">Your commission pending payout</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="p-4 bg-gray-50/50 border-t border-gray-50 text-center">
                                                <button onClick={() => setNotificationsOpen(false)} className="text-[10px] font-black text-gray-900 uppercase tracking-widest hover:text-[#6605c7] transition-colors">
                                                    [View All Notifications]
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* Scrollable modules render window */}
                    <div className={`flex-1 overflow-y-auto relative ${pathname.includes('/chat-') ? 'p-0' : 'p-12 space-y-12'}`}>
                        {/* Decorative mesh background blur */}
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#6605c7]/5 rounded-full blur-[150px] pointer-events-none" />
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function AgentLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isAgent = user?.role === 'agent' || user?.role === 'partner_agent' || user?.role === 'admin' || user?.role === 'super_admin';

    useEffect(() => {
        if (!isLoading && pathname !== "/agent/login") {
            if (!isAuthenticated) {
                router.replace("/agent/login?redirect=" + encodeURIComponent(pathname));
            } else if (!isAgent) {
                router.replace("/dashboard");
            }
        }
    }, [isAgent, isLoading, isAuthenticated, router, pathname]);

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-transparent">
                <div className="w-12 h-12 border-4 border-[#6605c7]/20 border-t-[#6605c7] rounded-full animate-spin" />
            </div>
        );
    }

    if (pathname === "/agent/login") return <>{children}</>;

    if (!isAuthenticated || !isAgent) return null;

    return (
        <AgentProvider>
            <AgentLayoutInner>{children}</AgentLayoutInner>
        </AgentProvider>
    );
}
