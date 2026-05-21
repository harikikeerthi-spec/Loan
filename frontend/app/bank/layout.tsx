"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// --- Components ---

const NavItem = ({ icon, label, path, active, collapsed }: any) => (
    <Link
        href={path}
        className={`flex items-center gap-3 py-2 px-3 rounded-xl transition-all relative group overflow-hidden ${
            active ? "text-white" : "text-gray-400 hover:text-gray-800"
        }`}
        style={active ? {
            background: 'linear-gradient(135deg, #6605c7, #8b24e5)',
            boxShadow: '0 4px 14px rgba(102, 5, 199, 0.22)'
        } : undefined}
    >
        {/* Hover background */}
        {!active && (
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: 'rgba(102, 5, 199, 0.06)' }} />
        )}

        <span className={`material-symbols-outlined text-[18px] relative z-10 transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-105"}`}>
            {icon}
        </span>

        {!collapsed && (
            <span className="text-[9.5px] font-black uppercase tracking-[0.18em] relative z-10 italic whitespace-nowrap">
                {label}
            </span>
        )}
    </Link>
);

export default function BankLayout({ children }: { children: React.ReactNode }) {
    const { user, isBank, isAdmin, isLoading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [scrolled, setScrolled] = useState(false);

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

    const navItems = [
        { icon: "dashboard", label: "Overview", path: "/bank/dashboard" },
        { icon: "gavel", label: "Decisions", path: "/bank/applications" },
        { icon: "description", label: "Documents", path: "/bank/documents" },
        { icon: "payments", label: "Disbursal", path: "/bank/disbursements" },
        { icon: "verified_user", label: "Risk & Comp", path: "/bank/compliance" },
        { icon: "forum", label: "Comms Hub", path: "/bank/communication" },
        { icon: "monitoring", label: "Analytics", path: "/bank/analytics" },
        { icon: "extension", label: "Integrations", path: "/bank/integrations" },
        { icon: "settings", label: "Settings", path: "/bank/settings" },
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
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 animate-pulse italic">
                        Synchronizing Node...
                    </p>
                </div>
            </div>
        );
    }

    if (!user || (!isBank && !isAdmin)) return null;

    const sidebarWidth = collapsed ? 80 : 280;

    return (
        <div className="min-h-screen flex overflow-hidden" style={{
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
                                <span className="text-base font-black text-gray-900 leading-none italic tracking-tight">
                                    Vidhya<span style={{ color: '#6605c7' }}>Bank</span>
                                </span>
                                <span className="text-[7px] font-black uppercase tracking-[0.3em] mt-0.5 opacity-50 italic"
                                    style={{ color: '#6605c7' }}>
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
                    {/* Collapse + Sign Out side by side */}
                    <div className="flex gap-1.5">
                        {/* Collapse */}
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
                            {!collapsed && <span className="text-[9px] font-black uppercase tracking-[0.15em] italic">Collapse</span>}
                        </button>

                        {/* Sign Out */}
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
                            {!collapsed && <span className="text-[9px] font-black uppercase tracking-[0.15em] italic">Sign Out</span>}
                        </button>
                    </div>

                    {/* User Card */}
                    <div
                        className="flex items-center gap-2.5 p-2.5 rounded-xl border"
                        style={{
                            backgroundColor: 'rgba(102, 5, 199, 0.03)',
                            borderColor: 'rgba(102, 5, 199, 0.08)',
                            justifyContent: collapsed ? 'center' : undefined
                        }}
                    >
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-[10px] italic shrink-0 shadow-md"
                            style={{ background: 'linear-gradient(135deg, #6605c7, #8b24e5)' }}
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
                                    <p className="text-[9.5px] font-black text-gray-900 truncate uppercase italic">
                                        {user.firstName} {user.lastName}
                                    </p>
                                    <p className="text-[7.5px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
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
                className="flex-1 min-h-screen relative transition-all duration-300"
                style={{ marginLeft: sidebarWidth }}
            >
                {/* Sticky Header on Scroll */}
                <header
                    className={`fixed top-0 right-0 z-40 transition-all duration-500 ${scrolled ? 'h-16' : 'h-0 pointer-events-none'}`}
                    style={{
                        left: sidebarWidth,
                        background: scrolled ? 'rgba(255,255,255,0.85)' : 'transparent',
                        backdropFilter: scrolled ? 'blur(16px)' : 'none',
                        borderBottom: scrolled ? '1px solid rgba(102,5,199,0.06)' : 'none',
                    }}
                >
                    {scrolled && (
                        <div className="h-full flex items-center justify-between px-10">
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-gray-900 italic">Terminal Active</h2>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#6605c7' }} />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: '#6605c7' }}>Live Protocol</span>
                            </div>
                        </div>
                    )}
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
