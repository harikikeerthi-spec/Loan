"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { format } from "date-fns";
import UserSupportTicketsView from "@/components/UserSupportTicketsView";
import SupportTicketModal from "@/components/SupportTicketModal";

export default function MyProfilePage() {
    const { user } = useAuth();
    const [applications, setApplications] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

    useEffect(() => {
        const loadProfileStats = async () => {
            setLoading(true);
            try {
                const res: any = await adminApi.getApplications({ limit: "1000" });
                if (res && res.data) {
                    setApplications(res.data);
                } else if (Array.isArray(res)) {
                    setApplications(res);
                }

                const savedTasks = localStorage.getItem("vidyaloans_staff_tasks");
                if (savedTasks) {
                    setTasks(JSON.parse(savedTasks));
                }
            } catch (e) {
                console.error("Failed to load profile stats", e);
            } finally {
                setLoading(false);
            }
        };
        loadProfileStats();
    }, []);

    const stats = useMemo(() => {
        const total = applications.length;
        const pending = applications.filter(app => ["pending", "processing", "submitted_to_bank"].includes(app.status?.toLowerCase())).length;
        const approved = applications.filter(app => ["approved", "verified", "disbursed", "disbursement_confirmed"].includes(app.status?.toLowerCase())).length;
        const rejected = applications.filter(app => app.status?.toLowerCase() === "rejected").length;
        const completedTasks = tasks.filter(t => t.completed).length;
        const pendingTasks = tasks.filter(t => !t.completed).length;

        return {
            total,
            pending,
            approved,
            rejected,
            completedTasks,
            pendingTasks
        };
    }, [applications, tasks]);

    return (
        <div className="space-y-8 max-w-[1400px] mx-auto animate-fade-in pb-12 font-sans">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-[28px] tracking-tight flex items-center gap-3 font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">
                        My Profile
                    </h2>
                    <p className="text-slate-500 text-[13px] mt-1 font-medium">Staff account, credentials & support tickets</p>
                </div>
                <button
                    type="button"
                    onClick={() => setIsSupportModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[18px]">support_agent</span>
                    Raise Support Ticket
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-8 shadow-sm flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden mb-5 shadow-lg">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-[20px] font-black text-slate-900 tracking-tight">{user?.firstName || '—'} {user?.lastName || ''}</h3>
                    <p className="text-[11px] font-black uppercase tracking-widest text-indigo-600 mt-1">{user?.role?.replace('_', ' ') || 'Staff'}</p>
                    <p className="text-[13px] text-slate-500 mt-2 font-semibold font-mono">{user?.email}</p>
                    
                    <button
                        type="button"
                        onClick={() => setIsSupportModalOpen(true)}
                        className="mt-5 w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all border border-indigo-200/60 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[16px]">confirmation_number</span>
                        New Support Ticket
                    </button>

                    <div className="mt-6 w-full pt-6 border-t border-slate-100 space-y-3">
                        <div className="flex justify-between text-[12px]">
                            <span className="text-slate-400 font-bold uppercase tracking-wider">Status</span>
                            <span className="font-black text-emerald-600 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block" />
                                Active
                            </span>
                        </div>
                        <div className="flex justify-between text-[12px]">
                            <span className="text-slate-400 font-bold uppercase tracking-wider">Portal</span>
                            <span className="font-bold text-slate-700">CoreOps Staff</span>
                        </div>
                        <div className="flex justify-between text-[12px]">
                            <span className="text-slate-400 font-bold uppercase tracking-wider">Session</span>
                            <span className="font-bold text-slate-700">{format(new Date(), 'MMM d, yyyy')}</span>
                        </div>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="lg:col-span-2 grid grid-cols-2 gap-5 content-start">
                    {[
                        { label: "Applications Managed", value: stats.total, icon: "description", color: "bg-indigo-50 text-indigo-600" },
                        { label: "Pending Review", value: stats.pending, icon: "hourglass_empty", color: "bg-amber-50 text-amber-600" },
                        { label: "Approved This Month", value: stats.approved, icon: "check_circle", color: "bg-emerald-50 text-emerald-600" },
                        { label: "Rejection Rate", value: stats.total > 0 ? `${Math.round((stats.rejected / stats.total) * 100)}%` : '0%', icon: "cancel", color: "bg-rose-50 text-rose-600" },
                        { label: "Tasks Completed", value: stats.completedTasks, icon: "fact_check", color: "bg-slate-100 text-slate-600" },
                        { label: "Tasks Pending", value: stats.pendingTasks, icon: "pending_actions", color: "bg-violet-50 text-violet-600" },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-xl border border-slate-200/60 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color} shrink-0`}>
                                <span className="material-symbols-outlined text-[22px]">{s.icon}</span>
                            </div>
                            <div>
                                <p className="text-[22px] font-black text-slate-900 leading-none">{loading ? '—' : s.value}</p>
                                <p className="text-[11px] text-slate-500 font-medium mt-1">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Support Tickets Section */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
                <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <span className="material-symbols-outlined text-indigo-600">confirmation_number</span>
                            Support Tickets & Requests
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Manage, track, and raise support tickets directly from your profile</p>
                    </div>
                </div>
                <UserSupportTicketsView
                    userRole={user?.role || "staff"}
                    userInfo={{
                        id: user?.id,
                        name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email,
                        email: user?.email,
                    }}
                />
            </div>

            <SupportTicketModal
                isOpen={isSupportModalOpen}
                onClose={() => setIsSupportModalOpen(false)}
                userRole={user?.role || "staff"}
                userInfo={{
                    id: user?.id,
                    name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email,
                    email: user?.email,
                }}
            />
        </div>
    );
}
