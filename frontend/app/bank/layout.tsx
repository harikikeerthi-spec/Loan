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
        className={`flex items-center gap-5 p-5 rounded-[1.75rem] transition-all relative group overflow-hidden ${
            active 
            ? "bg-[#6605c7] text-white shadow-2xl shadow-purple-500/20" 
            : "text-gray-400 hover:bg-[#6605c7]/5 hover:text-[#6605c7]"
        }`}
    >
        <span className={`material-symbols-outlined text-2xl relative z-10 transition-transform duration-500 ${active ? "scale-110" : "group-hover:scale-110 group-hover:rotate-6"}`}>
            {icon}
        </span>
        {!collapsed && (
            <span className="text-[10px] font-black uppercase tracking-[0.2em] relative z-10 italic">
                {label}
            </span>
        )}
        {active && (
            <motion.div 
                layoutId="nav-glow"
                className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none"
            />
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
        if (!isLoading && (!user || (!isBank && !isAdmin))) {
            router.push('/login');
        }
    }, [user, isLoading, isBank, isAdmin, router]);

    const navItems = [
        { icon: "dashboard", label: "Terminal", path: "/bank/dashboard" },
        { icon: "grid_view", label: "Matrix", path: "/bank/applications" },
        { icon: "monitoring", label: "Intelligence", path: "/bank/analytics" },
        { icon: "assignment", label: "Protocols", path: "/bank/tasks" },
        { icon: "forum", label: "Queries", path: "/bank/queries" },
        { icon: "settings", label: "Config", path: "/bank/settings" },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 border-4 border-[#6605c7]/5 border-t-[#6605c7] rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 animate-pulse italic">Synchronizing Node...</p>
                </div>
            </div>
        );
    }

    if (!user || (!isBank && !isAdmin)) return null;

    return (
        <div className="min-h-screen bg-transparent flex overflow-hidden">
            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: collapsed ? 110 : 320 }}
                className="fixed h-screen z-50 bg-white/60 backdrop-blur-3xl border-r border-[#6605c7]/10 flex flex-col p-6 lg:p-8 shadow-2xl"
            >
                {/* Logo Section */}
                <div className="flex items-center gap-5 mb-16 px-2 py-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#6605c7] flex items-center justify-center text-white shadow-xl shadow-purple-500/30 shrink-0">
                        <span className="material-symbols-outlined text-2xl font-bold">account_balance</span>
                    </div>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex flex-col"
                        >
                            <span className="text-xl font-black font-display text-gray-900 leading-none italic tracking-tighter">Vidhya<span className="text-[#6605c7]">Bank</span></span>
                            <span className="text-[8px] font-black text-[#6605c7] uppercase tracking-[0.3em] mt-1.5 opacity-60 italic">Partner Matrix</span>
                        </motion.div>
                    )}
                </div>

                {/* Nav Section */}
                <nav className="flex-1 space-y-4">
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
                <div className="mt-auto space-y-6">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="w-full flex items-center gap-5 p-5 rounded-[1.75rem] text-gray-400 hover:bg-gray-50 transition-all group"
                    >
                        <span className={`material-symbols-outlined text-2xl transition-transform duration-500 ${collapsed ? "rotate-180" : "group-hover:-rotate-90"}`}>
                            {collapsed ? "arrow_forward" : "arrow_back"}
                        </span>
                        {!collapsed && <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Collapse</span>}
                    </button>

                    <button
                        onClick={() => logout()}
                        className="w-full flex items-center gap-5 p-5 rounded-[1.75rem] text-rose-500 hover:bg-rose-50 transition-all group"
                    >
                        <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">power_settings_new</span>
                        {!collapsed && <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Deauthorize</span>}
                    </button>

                    <div className={`p-4 rounded-[2rem] bg-gray-50/50 border border-gray-100/50 flex items-center gap-4 ${collapsed ? "justify-center" : ""}`}>
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6605c7] to-[#8b24e5] flex items-center justify-center text-white font-black text-[10px] italic shadow-lg shrink-0">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-gray-900 truncate uppercase italic">{user.firstName} {user.lastName}</p>
                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Senior Auditor</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main
                className={`flex-1 transition-all duration-300 min-h-screen relative`}
                style={{ marginLeft: collapsed ? 110 : 320 }}
            >
                {/* Header Overlay (Dynamic) */}
                <header 
                    className={`fixed top-0 right-0 z-[40] transition-all duration-500 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-[#6605c7]/5 h-20' : 'h-0 pointer-events-none'}`}
                    style={{ left: collapsed ? 110 : 320 }}
                >
                    {scrolled && (
                        <div className="h-full flex items-center justify-between px-12">
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-gray-900 italic">Terminal Active</h2>
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-[#6605c7] animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#6605c7]">Live Protocol</span>
                            </div>
                        </div>
                    )}
                </header>

                <div className="relative">
                    {children}
                </div>
            </main>
            
            {/* Global Matrix Overlay Components */}
            <div className="fixed inset-0 pointer-events-none z-[60]">
                {/* Subtle Scan Line */}
                <div className="w-full h-[1px] bg-[#6605c7]/5 absolute top-0 animate-scan-line" />
            </div>
            
            {/* Mesh background subtle overlay */}
            <div className="fixed inset-0 bg-mesh-gradient opacity-[0.03] pointer-events-none -z-10" />
        </div>
    );
}
