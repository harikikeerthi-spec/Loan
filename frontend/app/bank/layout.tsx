"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface NavItemProps {
    href: string;
    icon: string;
    label: string;
    active: boolean;
}

const NavItem = ({ href, icon, label, active }: NavItemProps) => (
    <Link
        href={href}
        className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
            active 
            ? "bg-[#6605c7]/10 text-[#6605c7] font-bold shadow-sm border border-[#6605c7]/5" 
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
        }`}
    >
        <span className={`material-symbols-outlined transition-transform duration-500 ${active ? "scale-110" : "group-hover:scale-110"}`}>
            {icon}
        </span>
        <span className="text-sm tracking-wide uppercase font-black text-[10px]">{label}</span>
        {active && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#6605c7] animate-pulse shadow-[0_0_8px_#6605c7]" />
        )}
    </Link>
);

export default function BankLayout({ children }: { children: React.ReactNode }) {
    const { user, isBank, isAdmin, isLoading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // RBAC - allow if user is a bank staff or an admin
    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push("/login");
            } else if (!isBank && !isAdmin) {
                 // For demo purposes, we'll allow access but show a warning or redirect
                 // In a production app, we would redirect: router.push("/dashboard");
            }
        }
    }, [user, isLoading, router, isBank, isAdmin]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f7f5f8]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-[#6605c7]/10 border-t-[#6605c7] rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 animate-pulse">Syncing Node...</p>
                </div>
            </div>
        );
    }

    const navigation = [
        { href: "/bank/dashboard", icon: "dashboard", label: "Overview" },
        { href: "/bank/applications", icon: "assignment", label: "Applications" },
        { href: "/bank/chat", icon: "chat_bubble", label: "WhatsApp Connect" },
        { href: "/bank/tasks", icon: "task_alt", label: "Mission Control" },
        { href: "/bank/analytics", icon: "monitoring", label: "Insight Hub" },
        { href: "/bank/settings", icon: "settings", label: "System Config" },
    ];

    return (
        <div className="min-h-screen bg-[#f7f5f8] flex overflow-hidden">
            {/* Sidebar */}
            <aside 
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/70 backdrop-blur-3xl border-r border-[#6605c7]/10 transform transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] lg:relative lg:translate-x-0 ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo Section */}
                    <div className="p-8 border-b border-[#6605c7]/5">
                        <Link href="/bank/dashboard" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6605c7] to-[#8b24e5] flex items-center justify-center text-white shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-500">
                                <span className="material-symbols-outlined font-bold">account_balance</span>
                            </div>
                            <div>
                                <span className="font-black text-xl tracking-tighter text-gray-900 font-display block leading-none">Vidhya<span className="text-[#6605c7]">Bank</span></span>
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#6605c7] opacity-60">Partner Portal</span>
                            </div>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-6 space-y-2 overflow-y-auto no-scrollbar">
                        {navigation.map((item) => (
                            <NavItem 
                                key={item.href} 
                                href={item.href} 
                                icon={item.icon} 
                                label={item.label} 
                                active={pathname === item.href || (item.href !== "/bank/dashboard" && pathname.startsWith(item.href))}
                            />
                        ))}
                    </nav>

                    {/* Footer / User Profile */}
                    <div className="p-6 mt-auto">
                        <div className="glass-card mb-4 rounded-[2rem] p-4 relative overflow-hidden group">
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#6605c7]/20 to-[#8b24e5]/20 flex items-center justify-center border border-white/50">
                                    <span className="material-symbols-outlined text-lg text-[#6605c7]">person</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-gray-900 truncate uppercase tracking-wider">{user?.firstName} {user?.lastName}</p>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em]">Bank Officer</p>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-symbols-outlined text-4xl">verified_user</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => logout()}
                            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-black text-[10px] uppercase tracking-widest"
                        >
                            <span className="material-symbols-outlined">logout</span>
                            Terminate Session
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Header */}
                <header className="h-20 bg-white/50 backdrop-blur-xl border-b border-[#6605c7]/10 px-8 flex justify-between items-center sticky top-0 z-40">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => setSidebarOpen(!sidebarOpen)} 
                            className="lg:hidden p-2.5 text-gray-600 hover:bg-[#6605c7]/5 rounded-xl transition-all"
                        >
                            <span className="material-symbols-outlined">{sidebarOpen ? "close" : "menu"}</span>
                        </button>
                        
                        <div className="relative hidden md:block group">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-focus-within:text-[#6605c7] transition-colors">search</span>
                            <input
                                type="text"
                                placeholder="Search applicants, nodes, or tasks..."
                                className="pl-10 pr-6 py-2.5 bg-[#6605c7]/5 border border-transparent rounded-2xl text-[11px] font-bold focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 focus:bg-white focus:border-[#6605c7]/10 w-96 transition-all placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Network Active</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="p-2.5 text-gray-500 hover:text-[#6605c7] hover:bg-[#6605c7]/5 rounded-xl transition-all relative">
                                <span className="material-symbols-outlined">notifications</span>
                                <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                            </button>
                            <button className="p-2.5 text-gray-500 hover:text-[#6605c7] hover:bg-[#6605c7]/5 rounded-xl transition-all">
                                <span className="material-symbols-outlined">settings_suggest</span>
                            </button>
                        </div>
                        
                        <div className="h-8 w-px bg-gray-100 mx-2" />

                        <div className="flex items-center gap-3 pl-2">
                            <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden p-0.5">
                                <img 
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'bank'}`} 
                                    alt="Avatar" 
                                    className="w-full h-full object-cover rounded-xl"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Overlay/Canvas */}
                <main className="flex-1 overflow-y-auto no-scrollbar relative">
                    <div className="absolute inset-0 bg-mesh-gradient opacity-30 pointer-events-none" />
                    <div className="relative z-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
