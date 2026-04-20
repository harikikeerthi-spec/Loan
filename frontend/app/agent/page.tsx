"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { agentApi } from "@/lib/api";
import { format } from "date-fns";
import ChatInterface from "@/components/Chat/ChatInterface";

// --- Sub-components ---

const StatCard = ({ label, value, icon, color, loading, subtitle }: any) => (
    <div className="bg-white border border-[#6605c7]/10 p-6 rounded-[2.5rem] relative overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(102,5,199,0.08)] transition-all duration-500 flex flex-col justify-between min-h-[180px] hover:-translate-y-1.5 cursor-default">
        <div className="flex justify-between items-start relative z-10 w-full">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-12 duration-500 ${color} bg-opacity-10 border border-current border-opacity-10 shadow-sm shadow-current`}>
                <span className="material-symbols-outlined text-3xl" style={{ color: 'currentColor' }}>{icon}</span>
            </div>
            <div className="text-right">
                <p className="text-[#6605c7]/50 text-[10px] font-black uppercase tracking-[0.25em] mb-1">{label}</p>
                {subtitle && <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full inline-block">{subtitle}</p>}
            </div>
        </div>
        <div className="relative z-10 mt-6">
            <div className="text-4xl font-black tracking-tighter text-gray-900 font-display group-hover:text-[#6605c7] transition-colors leading-none">
                {loading ? <span className="h-10 bg-gray-50 animate-pulse rounded-xl block w-32" /> : value ?? "—"}
            </div>
        </div>
        <div className="absolute -right-8 -bottom-8 opacity-[0.03] pointer-events-none transform group-hover:scale-125 group-hover:-rotate-45 transition-all duration-700">
            <span className="material-symbols-outlined text-[10rem]">{icon}</span>
        </div>
    </div>
);

const NavItem = ({ section, active, icon, label, onClick }: any) => (
    <button
        onClick={() => onClick(section)}
        className={`w-full text-left px-5 py-4 rounded-[1.5rem] flex items-center gap-4 group transition-all duration-300 ${active === section ? "bg-[#6605c7] text-white shadow-[0_12px_24px_rgb(102,5,199,0.3)] scale-[1.02]" : "text-gray-500 hover:bg-[#6605c7]/5 hover:text-[#6605c7]"}`}
    >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${active === section ? "bg-white/20" : "bg-[#6605c7]/5 group-hover:bg-[#6605c7]/10"}`}>
            <span className={`material-symbols-outlined text-xl ${active === section ? "text-white" : "text-[#6605c7]/60 group-hover:text-[#6605c7]"}`}>{icon}</span>
        </div>
        <span className="font-bold text-[11px] tracking-[0.15em] uppercase flex-1">{label}</span>
        {active === section && (
            <div className="w-1.5 h-6 rounded-full bg-white opacity-50" />
        )}
    </button>
);

export default function AgentDashboardPage() {
    const { user, logout } = useAuth();
    const [activeSection, setActiveSection] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [autoStartUser, setAutoStartUser] = useState<any>(null);

    // Filter state
    const [searchQuery, setSearchQuery] = useState("");

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, appsRes] = await Promise.all([
                agentApi.getStats(),
                agentApi.getApplications()
            ]);
            setStats((statsRes as any).data);
            setApplications((appsRes as any).data || []);
        } catch (e) {
            console.error("Failed to load agent data", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredApplications = applications.filter(app => {
        const query = searchQuery.toLowerCase();
        return (
            app.applicationNumber?.toLowerCase().includes(query) ||
            app.firstName?.toLowerCase().includes(query) ||
            app.lastName?.toLowerCase().includes(query) ||
            app.email?.toLowerCase().includes(query)
        );
    });

    const statusColors: Record<string, string> = {
        pending: "bg-amber-100 text-amber-700 border-amber-200",
        processing: "bg-blue-100 text-blue-700 border-blue-200",
        approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
        rejected: "bg-red-100 text-red-600 border-red-200",
        disbursed: "bg-purple-100 text-purple-700 border-purple-200",
    };

    return (
        <div className="min-h-screen bg-[#fcfaff] flex font-sans selection:bg-[#6605c7]/10 selection:text-[#6605c7]">
            {/* Left Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-80 transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} p-6 lg:pr-3`}>
                <div className="flex flex-col h-full bg-white rounded-[3rem] border border-[#6605c7]/5 shadow-[0_20px_50px_rgb(102,5,199,0.06)] overflow-hidden relative">
                    <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#6605c7]/5 to-transparent pointer-events-none" />
                    
                    <div className="p-10 border-b border-[#6605c7]/5 relative z-10">
                        <div className="flex items-center gap-4 group cursor-pointer">
                            <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-[#6605c7] to-[#8b24e5] flex items-center justify-center text-white shadow-xl shadow-[#6605c7]/30 transform group-hover:rotate-[15deg] transition-all duration-500">
                                <span className="material-symbols-outlined font-black text-2xl">agent</span>
                            </div>
                            <div>
                                <span className="font-display font-black text-2xl tracking-tighter text-gray-900 block leading-none">Vidhya<span className="text-[#6605c7]">Agent</span></span>
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]/40">Partner Portal</span>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 p-6 space-y-2 overflow-y-auto no-scrollbar relative z-10">
                        <NavItem section="overview" active={activeSection} icon="space_dashboard" label="Dashboard" onClick={setActiveSection} />
                        <NavItem section="applications" active={activeSection} icon="description" label="Referrals" onClick={setActiveSection} />
                        
                        <div className="my-8 pt-8 border-t border-[#6605c7]/5">
                            <p className="text-[9px] font-black text-[#6605c7]/40 uppercase tracking-[0.25em] px-5 mb-4">Operations</p>
                            <NavItem section="chat_staff" active={activeSection} icon="support_agent" label="Staff Line" onClick={setActiveSection} />
                            <NavItem section="chat_student" active={activeSection} icon="forum" label="Student Chat" onClick={setActiveSection} />
                        </div>
                    </nav>

                    <div className="p-8 border-t border-[#6605c7]/5 bg-[#fcfaff]/50 backdrop-blur-xl relative z-10">
                        <div className="p-5 rounded-[2rem] bg-white border border-[#6605c7]/10 mb-5 group hover:border-[#6605c7]/30 transition-all duration-500">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full border-2 border-white shadow-md overflow-hidden bg-gradient-to-br from-[#6605c7]/10 to-[#6605c7]/5">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="Agent" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-black text-gray-900 truncate leading-none mb-1">{user?.firstName || 'Partner Agent'}</p>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">Verified Agent</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={logout} className="w-full py-4 rounded-[1.25rem] flex items-center justify-center gap-3 text-red-500 hover:bg-red-50 hover:text-red-600 transition-all font-black text-[10px] tracking-widest uppercase border border-transparent hover:border-red-100">
                            <span className="material-symbols-outlined text-base">logout</span>
                            Terminate Session
                        </button>
                    </div>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 p-6 lg:pl-3 min-w-0">
                <div className="h-full bg-white rounded-[3rem] border border-[#6605c7]/5 shadow-[0_20px_50px_rgb(102,5,199,0.06)] overflow-hidden flex flex-col relative">
                    
                    {/* Glass header */}
                    <header className="h-28 px-12 flex justify-between items-center sticky top-0 z-40 bg-white/70 backdrop-blur-3xl border-b border-[#6605c7]/5">
                        <div className="flex items-center gap-10">
                            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-4 text-[#6605c7] hover:bg-[#6605c7]/5 rounded-2xl transition-all">
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                            <div>
                                <h1 className="text-3xl font-black font-display text-gray-900 capitalize tracking-tighter leading-none mb-1">{activeSection.replace('_', ' ')}</h1>
                                <p className="text-[10px] font-bold text-[#6605c7]/40 uppercase tracking-[0.2em]">{format(new Date(), 'EEEE, MMMM do')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-8">
                            <div className="hidden lg:flex items-center gap-6 pr-6 border-r border-gray-100">
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1">Assigned Support</p>
                                    <p className="text-xs font-black text-[#6605c7]">Sr. Counsellor Priya</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-[#6605c7]/5 border border-[#6605c7]/10 flex items-center justify-center text-[#6605c7]">
                                    <span className="material-symbols-outlined text-xl">contact_phone</span>
                                </div>
                            </div>
                            <button className="relative w-12 h-12 flex items-center justify-center rounded-2xl bg-[#6605c7]/5 text-[#6605c7] hover:bg-[#6605c7]/10 transition-all border border-[#6605c7]/10">
                                <span className="material-symbols-outlined">notifications</span>
                                <div className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
                            </button>
                        </div>
                    </header>

                    <div className={`flex-1 overflow-y-auto no-scrollbar relative ${activeSection.startsWith('chat_') ? 'p-0' : 'p-12 space-y-12'}`}>
                        {/* Decorative background blur */}
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#6605c7]/5 rounded-full blur-[150px] pointer-events-none" />

                        {activeSection === "overview" && (
                            <div className="animate-fade-in-up space-y-12 relative z-10">
                                <section>
                                    <div className="flex justify-between items-end mb-10">
                                        <div>
                                            <h2 className="text-5xl font-black font-display text-gray-900 tracking-tighter mb-3">Portfolio Performance</h2>
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
                                                <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Live Revenue Data</p>
                                            </div>
                                        </div>
                                        <button onClick={loadData} className="px-6 py-3 rounded-2xl bg-[#6605c7] text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:shadow-xl hover:shadow-[#6605c7]/20 transition-all hover:-translate-y-1">
                                            <span className="material-symbols-outlined text-sm">refresh</span> Refresh Data
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <StatCard label="Applications Done" value={stats?.total || 0} icon="account_tree" color="text-indigo-600" loading={loading} />
                                        <StatCard label="Pipeline Value" value={`\u20B9${(stats?.totalAmount || 0).toLocaleString()}`} icon="payments" color="text-[#6605c7]" loading={loading} />
                                        <StatCard label="Total Disbursed" value={`\u20B9${(stats?.disbursedAmount || 0).toLocaleString()}`} icon="verified" color="text-emerald-500" loading={loading} />
                                        <StatCard label="Your Revenue" value={`\u20B9${(stats?.revenue || 0).toLocaleString()}`} icon="stars" color="text-amber-500" loading={loading} subtitle="+0.5% Commission" />
                                    </div>
                                </section> section

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-8">
                                        <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white relative overflow-hidden shadow-2xl">
                                            <div className="absolute top-0 right-0 p-10 opacity-10">
                                                <span className="material-symbols-outlined text-[12rem]">rocket_launch</span>
                                            </div>
                                            <div className="relative z-10 max-w-lg">
                                                <h3 className="text-3xl font-black font-display tracking-tight mb-4">Scale Your Agency with VidhyaLoan Plus.</h3>
                                                <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8">Get priority processing for your referrals, dedicated account managers, and up to 15% higher commissions on every disbursement.</p>
                                                <button className="px-8 py-4 bg-white text-[#0f172a] rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-3">
                                                    Upgrade Now <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-[#fcfaff] rounded-[2.5rem] border border-[#6605c7]/5 p-8 relative overflow-hidden">
                                            <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#6605c7]/50 mb-8 px-4">Recent Activity</h3>
                                            <div className="space-y-4">
                                                {stats?.recentApplications?.length > 0 ? stats.recentApplications.map((app: any, idx: number) => (
                                                    <div key={idx} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-[#6605c7]/5 border border-[#6605c7]/10 flex items-center justify-center text-[#6605c7]">
                                                                <span className="material-symbols-outlined text-xl">description</span>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-gray-900">Application #{app.applicationNumber}</p>
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{app.firstName} {app.lastName}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-black text-gray-900 leading-none">₹{Number(app.amount).toLocaleString()}</p>
                                                            <span className={`inline-block mt-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${statusColors[app.status] || "bg-gray-100 text-gray-500"}`}>
                                                                {app.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                                        <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                                                        <p className="text-[10px] font-black uppercase tracking-widest">No Recent Referrals</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-[0_20px_40px_rgb(102,5,199,0.04)] relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#6605c7]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#6605c7]/10 transition-all duration-700" />
                                            <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#6605c7]/40 mb-8">Assigned Counsellor</h3>
                                            <div className="flex flex-col items-center text-center">
                                                <div className="relative mb-6">
                                                    <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[#6605c7] to-[#8b24e5] p-1 shadow-xl transform group-hover:rotate-6 transition-all duration-700">
                                                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Priya" alt="Counsellor" className="w-full h-full rounded-[1.8rem] object-cover border-4 border-white" />
                                                    </div>
                                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg transform group-hover:-translate-y-2 transition-all duration-500">
                                                        <span className="material-symbols-outlined text-lg">verified</span>
                                                    </div>
                                                </div>
                                                <p className="text-xl font-black text-gray-900 tracking-tight leading-none mb-2">Priya Sharma</p>
                                                <p className="text-[10px] font-black text-[#6605c7] uppercase tracking-[0.2em] mb-6">Senior Student Relations</p>
                                                <div className="w-full space-y-3">
                                                    <button onClick={() => setActiveSection('chat_staff')} className="w-full py-4 bg-[#6605c7]/5 text-[#6605c7] rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#6605c7] hover:text-white transition-all">
                                                        <span className="material-symbols-outlined text-sm">chat_bubble</span> Connect via Chat
                                                    </button>
                                                    <button className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 border border-transparent hover:border-gray-200 transition-all">
                                                        <span className="material-symbols-outlined text-sm">call</span> Voice Request
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-[#6605c7] p-8 rounded-[2.5rem] text-white shadow-xl shadow-[#6605c7]/20 relative overflow-hidden group">
                                            <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700" />
                                            <h4 className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 mb-4">Referral Direct</h4>
                                            <p className="text-xs font-medium leading-relaxed mb-6 opacity-80">Share your unique code to track applications automatically.</p>
                                            <div className="flex gap-2">
                                                <div className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between group-hover:bg-white/20 transition-all">
                                                    <span className="text-xs font-black tracking-widest">VL-49X2Z</span>
                                                    <span className="material-symbols-outlined text-lg opacity-40 cursor-pointer hover:opacity-100 transition-all">content_copy</span>
                                                </div>
                                                <button className="w-12 h-12 bg-white text-[#6605c7] flex items-center justify-center rounded-xl hover:scale-105 transition-all shadow-lg">
                                                    <span className="material-symbols-outlined text-xl">share</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === "applications" && (
                            <div className="animate-fade-in-up space-y-12 relative z-10">
                                <div className="flex flex-col md:flex-row justify-between items-end gap-10 border-b border-[#6605c7]/5 pb-12">
                                    <div>
                                        <h2 className="text-5xl font-black font-display text-gray-900 tracking-tighter mb-4">Referral Pipeline</h2>
                                        <div className="flex items-center gap-4">
                                            <div className="flex -space-x-3">
                                                {[1, 2, 3, 4].map(n => (
                                                    <div key={n} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden shadow-sm">
                                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=u${n}`} alt="u" />
                                                    </div>
                                                ))}
                                                <div className="w-8 h-8 rounded-full border-2 border-white bg-[#6605c7] flex items-center justify-center text-[10px] font-black text-white shadow-sm">+8</div>
                                            </div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active student lead sync</p>
                                        </div>
                                    </div>
                                    <div className="relative w-full md:w-[400px]">
                                        <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-[#6605c7]/40 text-xl">search</span>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search student or ref #"
                                            className="w-full pl-14 pr-7 py-5 bg-[#fcfaff] border border-[#6605c7]/10 rounded-3xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-[#6605c7]/5 focus:border-[#6605c7]/30 transition-all shadow-sm shadow-[#6605c7]/5"
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto pb-10 no-scrollbar">
                                    <table className="w-full border-separate border-spacing-y-4">
                                        <thead>
                                            <tr>
                                                <th className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]/40 text-left border-b border-[#6605c7]/5">Reference</th>
                                                <th className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]/40 text-left border-b border-[#6605c7]/5">Student Identity</th>
                                                <th className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]/40 text-left border-b border-[#6605c7]/5">Loan Type</th>
                                                <th className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]/40 text-left border-b border-[#6605c7]/5">Evaluation</th>
                                                <th className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]/40 text-left border-b border-[#6605c7]/5">Status</th>
                                                <th className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]/40 text-right border-b border-[#6605c7]/5">Quick Connect</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={6} className="px-10 py-40 text-center">
                                                        <div className="flex flex-col items-center justify-center gap-6">
                                                            <div className="w-16 h-16 border-4 border-[#6605c7]/10 border-t-[#6605c7] rounded-full animate-spin" />
                                                            <p className="text-[10px] font-black tracking-[0.3em] text-[#6605c7]/40 uppercase animate-pulse">Synchronizing Data Node</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : filteredApplications.length > 0 ? filteredApplications.map((app, idx) => (
                                                <tr key={idx} className="group hover:-translate-y-1 transition-all duration-500">
                                                    <td className="px-10 py-7 bg-white group-hover:bg-[#fcfaff] rounded-l-[2rem] border-y border-l border-gray-100 group-hover:border-[#6605c7]/20 transition-all font-display font-black text-[#6605c7]/40 text-xs tracking-widest">{app.applicationNumber}</td>
                                                    <td className="px-10 py-7 bg-white group-hover:bg-[#fcfaff] border-y border-transparent group-hover:border-[#6605c7]/20 transition-all">
                                                        <div className="flex flex-col gap-0.5">
                                                            <p className="text-sm font-black text-gray-900 group-hover:text-[#6605c7] transition-colors">{app.firstName} {app.lastName}</p>
                                                            <p className="text-[10px] font-bold text-gray-400">{app.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-7 bg-white group-hover:bg-[#fcfaff] border-y border-transparent group-hover:border-[#6605c7]/20 transition-all">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-3 py-1 bg-gray-50 rounded-lg">{app.loanType}</span>
                                                    </td>
                                                    <td className="px-10 py-7 bg-white group-hover:bg-[#fcfaff] border-y border-transparent group-hover:border-[#6605c7]/20 transition-all font-black text-gray-900 leading-none text-sm tracking-tighter">
                                                        ₹{Number(app.amount).toLocaleString()}
                                                    </td>
                                                    <td className="px-10 py-7 bg-white group-hover:bg-[#fcfaff] border-y border-transparent group-hover:border-[#6605c7]/20 transition-all">
                                                        <span className={`inline-flex px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusColors[app.status] || "bg-gray-100 text-gray-500"}`}>
                                                            {app.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-10 py-7 bg-white group-hover:bg-[#fcfaff] rounded-r-[2rem] border-y border-r border-gray-100 group-hover:border-[#6605c7]/20 transition-all text-right">
                                                        <button 
                                                            onClick={() => { setAutoStartUser(app.user || { id: app.userId, email: app.email, firstName: app.firstName, lastName: app.lastName }); setActiveSection("chat_student"); }}
                                                            className="w-11 h-11 bg-[#6605c7] text-white rounded-full flex items-center justify-center hover:shadow-xl hover:shadow-[#6605c7]/30 hover:scale-110 transition-all ml-auto"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">chat</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={6} className="px-10 py-40 text-center">
                                                        <div className="flex flex-col items-center justify-center opacity-30">
                                                            <span className="material-symbols-outlined text-7xl mb-4">search_off</span>
                                                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">No referrals matching criteria</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeSection === "chat_staff" && <ChatInterface role="staff" initialUser={null} portalTitle="Support Central" />}
                        {activeSection === "chat_student" && <ChatInterface role="agent" initialUser={autoStartUser} portalTitle="Student Pipeline" />}
                    </div>
                </div>
            </main>
        </div>
    );
}
