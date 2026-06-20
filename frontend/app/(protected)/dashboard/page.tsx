"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { authApi, chatApi } from "@/lib/api";
import Navbar from "@/components/Navbar";
import ProgressTracker from "@/components/ProgressTracker";
import UserActivityLog from "@/components/User/UserActivityLog";
import StudentChatPanel from "@/components/Chat/StudentChatPanel";
import { io } from "socket.io-client";

interface DashboardData {
    applicationCount?: number;
    applications?: Array<{
        id: string;
        bank: string;
        amount: number;
        status: string;
        createdAt: string;
        loanType?: string;
        universityName?: string;
        country?: string;
        courseName?: string;
        stage?: string;
        progress?: number;
        applicationNumber?: string;
        submittedAt?: string;
        date?: string;
        firstName?: string;
        lastName?: string;
        remarks?: string;
    }>;
    recommendedLoans?: Array<{ name: string; rate: string }>;
    documents?: Array<{ name: string; status: string; docType: string }>;
    aiToolsUsed?: number;
    activity?: Array<{
        type: string;
        title: string;
        description: string;
        timestamp: string;
        link?: string;
    }>;
}

interface Stage {
    order: number;
    label: string;
    icon: string;
    progress: number;
}

const STAGES_CONFIG: Record<string, Stage> = {
    application_created: { order: 1, label: 'Created', icon: 'bolt', progress: 10 },
    application_submitted: { order: 2, label: 'Submitted', icon: 'send', progress: 25 },
    document_verification: { order: 3, label: 'Documents', icon: 'verified', progress: 40 },
    submit_to_bank: { order: 4, label: 'Submit to Bank', icon: 'account_balance', progress: 50 },
    credit_check: { order: 5, label: 'Credit Check', icon: 'credit_score', progress: 75 },
    bank_review: { order: 6, label: 'Review', icon: 'rate_review', progress: 90 },
    sanction: { order: 7, label: 'Sanction', icon: 'assignment_turned_in', progress: 95 },
    disbursement: { order: 8, label: 'Disbursed', icon: 'payments', progress: 100 },
};

const STAGES_LIST = Object.entries(STAGES_CONFIG)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key, value]) => ({ id: key, ...value }));

function ApplicationProgressCollapse({ app }: { app: any }) {
    const isRejected = app.status?.toLowerCase() === 'rejected' || app.status?.toLowerCase() === 'cancelled';

    const currentStageKey = (() => {
        if (!app) return null;
        if (app.status?.toLowerCase() === 'rejected' || app.status?.toLowerCase() === 'cancelled') return null;

        let stageKey = app.stage;
        if (!stageKey || !STAGES_CONFIG[stageKey]) {
            // Infer stage from status
            const status = app.status?.toLowerCase() || '';
            if (status.includes('approve') || status.includes('sanction')) return 'sanction';
            if (status.includes('disburse')) return 'disbursement';
            if (status.includes('process') || status.includes('review')) return 'bank_review';
            if (status.includes('submit_to_bank') || status.includes('submitted_to_bank')) return 'submit_to_bank';
            if (status === 'submitted') return 'application_submitted';
            if (status.includes('document')) return 'document_verification';
            if (status.includes('credit')) return 'credit_check';
            
            // Fallback: infer from progress if available
            if (app.progress >= 100) return 'disbursement';
            if (app.progress >= 95) return 'sanction';
            if (app.progress >= 90) return 'bank_review';
            if (app.progress >= 75) return 'credit_check';
            if (app.progress >= 50) return 'submit_to_bank';
            if (app.progress >= 40) return 'document_verification';
            if (app.progress >= 25) return 'application_submitted';

            return 'application_created';
        }
        return stageKey;
    })();

    const currentStage = currentStageKey ? STAGES_CONFIG[currentStageKey] : null;
    const currentProgress = currentStage?.progress || 10;

    const appCreatedAt = app.createdAt || app.created_at || app.submittedAt || app.submitted_at || app.date;
    const appUpdatedAt = app.updatedAt || app.updated_at || appCreatedAt;

    const completedThresholds = [1, 2, 3, 4, 5, 6, 7, 8];
    const currentOrder = currentStage?.order || 1;
    const lastCompletedIdx = completedThresholds.reduce((acc, val, i) => currentOrder >= val ? i : acc, -1);

    const getStageTimestamp = (stageIdx: number, completed: boolean, active?: boolean): string | undefined => {
        if (!completed && !active) return undefined;
        if (stageIdx === 0) return appCreatedAt;
        if (active || stageIdx === lastCompletedIdx) return appUpdatedAt || appCreatedAt;

        // Give intermediate steps a small simulated progressive delay for realism
        try {
            const baseDate = new Date(appCreatedAt);
            if (stageIdx > 0 && !isNaN(baseDate.getTime())) {
                const offsetDate = new Date(baseDate.getTime() + stageIdx * 18 * 60 * 60 * 1000);
                const updatedDate = new Date(appUpdatedAt);
                if (offsetDate.getTime() < updatedDate.getTime()) {
                    return offsetDate.toISOString();
                }
            }
        } catch { }
        return appCreatedAt;
    };

    const formatToIST = (dateVal: any): { date: string; time: string } | null => {
        if (!dateVal) return null;
        try {
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return null;

            const parts = new Intl.DateTimeFormat("en-US", {
                timeZone: "Asia/Kolkata",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            }).formatToParts(d);

            const getPart = (type: string) => parts.find(p => p.type === type)?.value || "";

            const month = getPart("month");
            const day = getPart("day");
            const hour = getPart("hour");
            const minute = getPart("minute");
            const dayPeriod = getPart("dayPeriod").toUpperCase();

            return {
                date: `${month} ${day}`,
                time: `${hour}:${minute} ${dayPeriod}`
            };
        } catch {
            return null;
        }
    };

    if (isRejected) {
        return (
            <div className="mt-4 bg-red-50/50 border border-red-100 rounded-xl p-6 shadow-sm animate-fadeIn">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white shadow-md shrink-0">
                        <span className="material-symbols-outlined text-xl">cancel</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-red-900 capitalize">Application {app.status}</h3>
                        <p className="text-red-700/60 text-xs truncate">Your {app.bank} application was {app.status}.</p>
                    </div>
                    <Link
                        href={`/staff/applications/${app.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-red-50 text-red-700 text-[10px] font-extrabold uppercase tracking-wider rounded border border-red-200 transition-all shadow-sm shrink-0"
                    >
                        <span className="material-symbols-outlined text-[12px] font-bold">admin_panel_settings</span>
                        Staff Portal View
                        <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                    </Link>
                </div>
                <div className="p-3 bg-white/60 rounded-lg border border-red-100">
                    <p className="text-xs text-red-700 font-medium">Please contact our support team or start a new application for a different bank.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-4 bg-[#6605c7]/[0.01] border border-gray-100 rounded-xl p-6 md:p-8 shadow-inner animate-fadeIn">
            {/* Header / Info */}
            <div className="flex justify-between items-center mb-10">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#6605c7] flex items-center gap-2">
                    <span className="w-5 h-5 bg-[#6605c7]/10 text-[#6605c7] rounded flex items-center justify-center">
                        <span className="material-symbols-outlined text-xs">rocket_launch</span>
                    </span>
                    Application Progress
                </h3>
                <div className="flex items-center gap-3">
                    {/* <Link
                        href={`/staff/applications/${app.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-extrabold uppercase tracking-wider rounded border border-indigo-100 hover:border-indigo-200 transition-all shadow-sm"
                        title="Open this application directly in the staff dashboard"
                    >
                        <span className="material-symbols-outlined text-[12px] font-bold">admin_panel_settings</span>
                        Staff Portal View
                        <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                    </Link> */}
                    <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {currentProgress}% Complete
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="relative px-2 mb-20 select-none">
                {/* Background Line */}
                <div className="absolute top-5 left-0 right-0 h-[2px] bg-gray-100 rounded-full mx-6" />

                {/* Active Progress Line */}
                <div
                    className="absolute top-5 left-0 h-[3px] bg-[#6605c7] rounded-full mx-6 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(102,5,199,0.3)]"
                    style={{ width: `calc(${currentProgress}% - 48px)` }}
                />

                <div className="relative flex justify-between">
                    {STAGES_LIST.map((stage) => {
                        const isCompleted = !!(currentStage && stage.order < currentStage.order);
                        const isCurrent = !!(currentStage && stage.id === currentStageKey);
                        const stageTimestamp = getStageTimestamp(stage.order - 1, isCompleted, isCurrent);
                        const stageTimestampFormatted = formatToIST(stageTimestamp);

                        return (
                            <div key={stage.id} className="flex flex-col items-center group relative" style={{ width: '40px' }}>
                                {/* Step Circle */}
                                <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-500 border-2
                                    ${isCompleted ? 'bg-emerald-500 border-emerald-100 text-white shadow-lg shadow-emerald-500/10' :
                                        isCurrent ? 'bg-white border-[#6605c7] text-[#6605c7] shadow-lg shadow-[#6605c7]/10 scale-110' :
                                            'bg-white border-gray-100 text-gray-300'}
                                `}>
                                    <span className={`material-symbols-outlined text-[18px] ${isCurrent ? 'animate-pulse' : ''}`}>
                                        {isCompleted ? 'check' : stage.icon}
                                    </span>
                                </div>

                                {/* Label & Completion Timestamp */}
                                <div className="absolute top-12 whitespace-nowrap text-center flex flex-col items-center">
                                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${isCompleted ? 'text-emerald-600' : isCurrent ? 'text-[#6605c7]' : 'text-gray-400'}`}>
                                        {stage.label}
                                    </span>
                                    {stageTimestampFormatted && (
                                        <div className="text-[8px] leading-tight text-gray-400 font-bold tracking-wider mt-1 select-none tabular-nums text-center">
                                            <div>{stageTimestampFormatted.date}</div>
                                            <div className="text-gray-400/80 font-medium mt-0.5">{stageTimestampFormatted.time}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Current Status Info */}
            <div className="mt-8 p-5 bg-[#6605c7]/[0.02] border border-[#6605c7]/5 rounded-xl flex items-start gap-4">
                <div className="w-9 h-9 bg-[#6605c7] text-white rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-[#6605c7]/20">
                    <span className="material-symbols-outlined text-lg">{currentStage?.icon || 'hourglass_empty'}</span>
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#6605c7]/60 mb-1">Current Status</div>
                    <h4 className="font-bold text-gray-900 text-[14px]">{currentStage?.label.replace('<br>', ' ')}</h4>
                    <p className="text-gray-500 text-[13px] mt-1 leading-relaxed">
                        Your {app.bank} application {app.applicationNumber ? `(#${app.applicationNumber})` : ""} is currently in the <strong>{currentStage?.label.replace('<br>', ' ')}</strong> stage.
                        Estimated completion: <span className="text-gray-900 font-bold">
                            {(() => {
                                const appDate = app.date ? new Date(app.date) : new Date();
                                const est = new Date(appDate);
                                est.setDate(appDate.getDate() + 14);
                                return est.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                            })()}
                        </span>
                        {app.id && (
                            <span className="block text-[11px] text-gray-400 font-mono mt-1.5" title={`Application ID: ${app.id}`}>
                                App #: {app.applicationNumber || app.id}
                            </span>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}

const getDynamicProgress = (app: any) => {
    if (!app) return 10;
    const s = String(app.status || '').toLowerCase();
    if (['disbursed', 'closed'].includes(s)) return 100;
    if (['sanctioned', 'approved', 'sanction'].includes(s)) return 95;
    if (['under_bank_review', 'query_raised', 'conditional_sanction', 'processing'].includes(s)) return 90;
    if (['submitted_to_bank', 'file_logged'].includes(s)) return 75;
    if (['staff_verified', 'verification', 'documents_verified'].includes(s)) return 50;
    if (['docs_received', 'docs_uploaded', 'under_review'].includes(s)) return 40;
    if (['submitted', 'application_submitted'].includes(s)) return 25;
    return typeof app.progress === 'number' && app.progress > 0 ? app.progress : 10;
};

export default function DashboardPage() {
    const { user, token } = useAuth();
    // The new ID is already human-readable (e.g. VL-STU-2026-54097) — no mangling needed
    const displayUserId = user?.id || "";
    const [data, setData] = useState<DashboardData>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [expandedApps, setExpandedApps] = useState<Record<string, boolean>>({});
    const [chatOpen, setChatOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeToast, setActiveToast] = useState<{ sender: string; content: string } | null>(null);
    const [conversationId, setConversationId] = useState<string | null>(null);

    const toggleAppProgress = (appId: string) => {
        setExpandedApps(prev => ({ ...prev, [appId]: !prev[appId] }));
    };

    const loadData = useCallback(async () => {
        if (!user?.email) return;
        setLoading(true);
        try {
            const dash = await authApi.getDashboard(user.email) as {
                success: boolean;
                user?: { id: string };
                applicationCount?: number;
                applications?: DashboardData["applications"];
            };
            if (dash?.success && dash.user?.id) {
                const dynamic = await authApi.getDashboardData(dash.user.id) as {
                    success: boolean;
                    data?: {
                        applications?: DashboardData["applications"];
                        documents?: DashboardData["documents"];
                        activity?: DashboardData["activity"];
                        applicationCount?: number;
                    };
                };
                if (dynamic?.success && dynamic.data) {
                    setData({
                        applicationCount: dynamic.data.applications?.length || 0,
                        applications: dynamic.data.applications || [],
                        documents: dynamic.data.documents || [],
                        activity: dynamic.data.activity || [],
                    });
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user?.email]);

    // Fetch active conversation ID on mount for background socket listening
    useEffect(() => {
        if (!user) return;
        chatApi.connect().then((res: any) => {
            if (res?.conversation?.id) {
                setConversationId(res.conversation.id);
            }
        }).catch(e => console.error("Could not fetch conversation details for notifications:", e));
    }, [user]);

    // Establish WebSocket connection for real-time notifications
    useEffect(() => {
        if (!token) return;

        const baseApiUrl = typeof window !== "undefined" && (window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1"))
            ? "http://localhost:5000"
            : (process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:5000"));
        const socketUrl = baseApiUrl.endsWith("/api")
            ? baseApiUrl.replace("/api", "/chat")
            : `${baseApiUrl.replace(/\/$/, "")}/chat`;

        const sock = io(socketUrl, { auth: { token } });

        sock.on("connect", () => {
            if (conversationId) {
                sock.emit("join_conversation", conversationId);
            }
        });

        sock.on("new_message", (msg: any) => {
            // Only notify if message belongs to this conversation AND is from staff/bank/system (not the student customer)
            if (conversationId && msg.conversationId === conversationId && msg.senderType !== "customer") {
                // If chat is open, we don't increment unread count or show toast because StudentChatPanel handles it
                if (!chatOpen) {
                    setUnreadCount(prev => prev + 1);
                    setActiveToast({
                        sender: msg.senderType === "system" ? "System Alert" : "Support Agent",
                        content: msg.content
                    });
                }
            }
        });

        sock.on("notification_received", (notif: any) => {
            setUnreadCount(prev => prev + 1);
            setActiveToast({
                sender: notif.title || "System Notification",
                content: notif.body
            });
            // Reload dashboard data in background (fresh documents/activities)
            loadData();
        });

        return () => {
            if (conversationId) {
                sock.emit("leave_conversation", conversationId);
            }
            sock.disconnect();
        };
    }, [conversationId, token, chatOpen, loadData]);

    // Auto-dismiss notification toast
    useEffect(() => {
        if (activeToast) {
            const timer = setTimeout(() => {
                setActiveToast(null);
            }, 6000);
            return () => clearTimeout(timer);
        }
    }, [activeToast]);

    useEffect(() => {
        loadData();
        // Set tab from hash if present
        if (typeof window !== "undefined" && window.location.hash) {
            const hashTab = window.location.hash.replace("#", "");
            if (["overview", "applications", "documents", "profile"].includes(hashTab)) {
                setActiveTab(hashTab);
            }
        }
    }, [loadData]);

    // Listen for dashboard updates from other pages/tabs
    useEffect(() => {
        const onExternalUpdate = () => {
            loadData();
        };
        const onStorage = (e: StorageEvent) => {
            if (e.key && e.key.startsWith('dashboardDataUpdated_')) {
                loadData();
            }
        };

        window.addEventListener('dashboard-data-changed', onExternalUpdate as EventListener);
        window.addEventListener('storage', onStorage);

        return () => {
            window.removeEventListener('dashboard-data-changed', onExternalUpdate as EventListener);
            window.removeEventListener('storage', onStorage);
        };
    }, [loadData]);

    const stats = [
        { icon: "description", label: "Loan Applications", value: data.applicationCount ?? 0, color: "text-purple-500", bg: "bg-purple-500/10" },
        { icon: "account_balance", label: "Partner Network", value: "5+", color: "text-blue-500", bg: "bg-blue-500/10" },
        { icon: "psychology", label: "AI Tools Available", value: "7", color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { icon: "school", label: "Universities Covered", value: "3K+", color: "text-amber-500", bg: "bg-amber-500/10" },
    ];

    const quickLinks = [
        { href: "/apply-loan", icon: "add_circle", label: "Apply for Loan", desc: "Start a new application", color: "from-purple-500 to-indigo-600" },
        { href: "/document-vault", icon: "folder_shared", label: "Document Vault", desc: "Securely upload docs", color: "from-blue-600 to-indigo-700" },
        { href: "/emi", icon: "calculate", label: "EMI Calculator", desc: "Plan your repayments", color: "from-blue-500 to-cyan-600" },
        { href: "/sop-writer", icon: "auto_fix_high", label: "AI SOP Writer", desc: "Draft your statement", color: "from-pink-500 to-rose-600" },
        { href: "/compare-loans", icon: "compare", label: "Compare Loans", desc: "Find the best rates", color: "from-amber-500 to-orange-600" },
        { href: "/community/discussions", icon: "forum", label: "Community", desc: "Ask & share advice", color: "from-emerald-500 to-teal-600" },
    ];

    return (
        <div className="min-h-screen bg-transparent">
            {/* Student in-app support chat panel */}
            {chatOpen && <StudentChatPanel onClose={() => setChatOpen(false)} />}
            <Navbar />

            <div className="max-w-7xl mx-auto px-6 pt-32 pb-16">
                {/* Welcome Banner */}
                <div className="mb-10 bg-[#6605c7]/[0.03] border border-[#6605c7]/10 rounded-2xl p-8 md:p-10 relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-64 opacity-[0.03] grayscale">
                        <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=500&q=20')] bg-cover" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6605c7]/10 text-[#6605c7] text-[10px] font-bold uppercase tracking-wider">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                    </span>
                                    Active Account
                                </div>
                                {user?.id && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-3 rounded-full bg-[#6605c7]/5 text-[#6605c7] text-[10px] font-bold uppercase tracking-wider border border-[#6605c7]/10 shadow-sm">
                                        <span className="material-symbols-outlined text-[30px] text-[#6605c7]">fingerprint</span>
                                        <span className="text-[13px]">User ID: {user.id}</span>
                                    </div>
                                )}
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold font-display text-gray-900 mb-2">
                                Welcome back, {user?.firstName ? (user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName) : user?.email?.split("@")[0]}! 👋
                            </h1>
                            <p className="text-gray-500 text-sm">
                                {data.applications?.length
                                    ? `Your education loan journey is ${getDynamicProgress(data.applications[0])}% complete. ${getDynamicProgress(data.applications[0]) >= 50 ? "You're doing great!" : "Keep going!"}`
                                    : "Start your education loan journey today!"}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                id="btn-connect-support"
                                onClick={async () => {
                                    try {
                                        const res = await chatApi.connect() as any;
                                        const whatsappUrl = res?.whatsappUrl;
                                        if (whatsappUrl) {
                                            window.open(whatsappUrl, '_blank');
                                            return;
                                        }
                                        const rawNumber = process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER || '+14155238886';
                                        const cleanNumber = rawNumber.replace('whatsapp:', '').replace(/\D/g, '');
                                        window.open(`https://wa.me/${cleanNumber}`, '_blank');
                                    } catch (e) {
                                        const rawNumber = process.env.NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER || '+14155238886';
                                        const cleanNumber = rawNumber.replace('whatsapp:', '').replace(/\D/g, '');
                                        window.open(`https://wa.me/${cleanNumber}`, '_blank');
                                    }
                                }}
                                className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">chat</span>
                                Connect with Support
                            </button>
                            <Link href="/onboarding" className="px-5 py-2.5 bg-white text-gray-700 border border-gray-200 text-xs font-bold rounded-lg hover:bg-gray-50 transition-all">
                                View Roadmap
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    {stats.map((s) => (
                        <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-100 hover:border-[#6605c7]/20 transition-all">
                            <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center ${s.color} mb-3`}>
                                <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
                            </div>
                            <div className="text-xl font-bold text-gray-900">
                                {loading ? <span className="h-6 bg-gray-100 rounded animate-pulse block w-12" /> : s.value}
                            </div>
                            <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-8 overflow-x-auto no-scrollbar border-b border-gray-100">
                    {["overview", "applications", "documents", "activity", "profile"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border-b-2 ${activeTab === tab
                                ? "border-[#6605c7] text-[#6605c7]"
                                : "border-transparent text-gray-400 hover:text-gray-600"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Quick Actions */}
                        <div className="lg:col-span-2">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Quick Actions</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                                {quickLinks.map((l) => (
                                    <Link key={l.href} href={l.href} className="group p-5 bg-white rounded-xl border border-gray-100 hover:border-[#6605c7]/20 transition-all">
                                        <div className={`w-9 h-9 bg-gradient-to-r ${l.color} rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                                            <span className="material-symbols-outlined text-lg">{l.icon}</span>
                                        </div>
                                        <div className="font-bold text-[13px] text-gray-900">{l.label}</div>
                                        <div className="text-[11px] text-gray-500 mt-1 line-clamp-1">{l.desc}</div>
                                    </Link>
                                ))}
                            </div>

                            {/* Active Applications Summary */}
                            <div className="mb-10">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Active Applications</h2>
                                    {(data.applications?.length || 0) > 0 && (
                                        <button onClick={() => setActiveTab("applications")} className="text-[10px] font-bold uppercase tracking-wider text-[#6605c7] hover:underline flex items-center gap-1">
                                            View All <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                                        </button>
                                    )}
                                </div>
                                {!data.applications?.length ? (
                                    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                                        <div className="w-14 h-14 bg-[#6605c7]/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <span className="material-symbols-outlined text-3xl text-[#6605c7]/40">add_circle</span>
                                        </div>
                                        <p className="text-gray-500 text-[13px] font-semibold mb-1">No applications yet</p>
                                        <p className="text-gray-400 text-[11px] mb-4">Start your education loan journey</p>
                                        <Link href="/apply-loan" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6605c7] text-white text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-[#5504a8] transition-all">
                                            <span className="material-symbols-outlined text-[16px]">add</span> Apply Now
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {data.applications.slice(0, 3).map((app) => {
                                            const statusColors: Record<string, string> = {
                                                pending: "bg-amber-100 text-amber-700",
                                                submitted: "bg-blue-100 text-blue-700",
                                                processing: "bg-indigo-100 text-indigo-700",
                                                approved: "bg-emerald-100 text-emerald-700",
                                                rejected: "bg-red-100 text-red-600",
                                                disbursed: "bg-purple-100 text-purple-700",
                                            };
                                            const sc = statusColors[app.status] || "bg-gray-100 text-gray-600";
                                            return (
                                                <div key={app.id} className="bg-white rounded-xl p-4 border border-gray-100 hover:border-[#6605c7]/15 transition-all">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                                            <div className="w-9 h-9 bg-[#6605c7]/5 rounded-lg flex items-center justify-center text-[#6605c7] shrink-0">
                                                                <span className="material-symbols-outlined text-xl">account_balance</span>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-[15px] text-gray-900 truncate">{app.bank}</span>
                                                                    {app.applicationNumber && (
                                                                        <span className="text-[17px] text-black-900 font-semibold bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100/50">
                                                                            #{app.applicationNumber}
                                                                        </span>
                                                                    )}
                                                                    <span className={`px-2 py-0.5 rounded-full text-[12px] font-bold uppercase tracking-wider ${sc}`}>
                                                                        {app.status}
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-x-3 text-[14px] text-gray-500 mt-0.5">
                                                                    <span className="font-semibold text-gray-700">₹{app.amount?.toLocaleString("en-IN")}</span>
                                                                    {app.universityName && <span>• {app.universityName}</span>}
                                                                    {app.country && <span>• {app.country}</span>}

                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Mini Progress */}
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                                            <div
                                                                className="bg-gradient-to-r from-[#6605c7] to-purple-400 h-1.5 rounded-full transition-all duration-700"
                                                                style={{ width: `${getDynamicProgress(app)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-[#6605c7] whitespace-nowrap">{getDynamicProgress(app)}%</span>
                                                    </div>

                                                    {/* Action Footer for detailed progress toggle */}
                                                    <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-gray-50 select-none">
                                                        <button
                                                            onClick={() => toggleAppProgress(app.id)}
                                                            className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase text-[#6605c7] hover:text-[#5504a8] transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">
                                                                {expandedApps[app.id] ? 'expand_less' : 'expand_more'}
                                                            </span>
                                                            {expandedApps[app.id] ? 'Hide Progress Details' : 'View Progress Details'}
                                                        </button>

                                                        {app.id && (
                                                            <span className="text-[9px] font-black uppercase text-gray-300 tracking-wider">
                                                                Track Progress
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Expanded Stepper timeline */}
                                                    {expandedApps[app.id] && (
                                                        <ApplicationProgressCollapse app={app} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>


                        </div>

                        {/* Recent Activity */}
                        <div className="lg:col-span-1">
                            <UserActivityLog userId={user?.id} limit={10} refreshInterval={30000} variant="sidebar" />
                        </div>
                    </div>
                )}

                {/* Applications Tab */}
                {activeTab === "applications" && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">My Applications</h2>
                            <Link href="/apply-loan" className="px-4 py-2 bg-[#6605c7] text-white text-xs font-bold rounded-lg hover:bg-[#5504a8] transition-all">
                                + New Application
                            </Link>
                        </div>
                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : !data.applications?.length ? (
                            <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                                <span className="material-symbols-outlined text-5xl text-gray-200 mb-4 block">description</span>
                                <p className="text-gray-500 text-sm font-bold">No applications yet</p>
                                <p className="text-gray-400 text-xs mt-2 mb-6">Start your education loan journey today</p>
                                <Link href="/apply-loan" className="px-6 py-2.5 bg-[#6605c7] text-white text-xs font-bold rounded-lg">
                                    Apply Now
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {data.applications.map((app) => {
                                    const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
                                        pending: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: "schedule" },
                                        submitted: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", icon: "assignment" },
                                        processing: { bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700", icon: "sync" },
                                        approved: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: "check_circle" },
                                        rejected: { bg: "bg-red-50 border-red-200", text: "text-red-600", icon: "cancel" },
                                        disbursed: { bg: "bg-purple-50 border-purple-200", text: "text-purple-700", icon: "paid" },
                                    };
                                    const sc = statusConfig[app.status] || statusConfig.pending;
                                    const submittedDate = app.submittedAt || app.date || app.createdAt;
                                    return (
                                        <div key={app.id} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#6605c7]/20 hover:shadow-lg transition-all group">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-[#6605c7]/10 to-purple-100 rounded-xl flex items-center justify-center text-[#6605c7] shrink-0">
                                                        <span className="material-symbols-outlined text-2xl">account_balance</span>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-bold text-[15px] text-gray-900 truncate">{app.bank}</h3>
                                                            {app.applicationNumber && (
                                                                <span className="text-[11px] text-gray-400 font-semibold bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                                                    #{app.applicationNumber}
                                                                </span>
                                                            )}
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${sc.bg} ${sc.text}`}>
                                                                {app.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-gray-500 mt-1">
                                                            <span className="font-bold text-gray-900">₹{app.amount?.toLocaleString("en-IN")}</span>
                                                            {app.loanType && <span>• {app.loanType}</span>}
                                                            {app.universityName && (
                                                                <span className="flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-[14px]">school</span>
                                                                    {app.universityName}
                                                                </span>
                                                            )}
                                                            {app.country && (
                                                                <span className="flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-[14px]">public</span>
                                                                    {app.country}
                                                                </span>
                                                            )}
                                                            {app.id && (
                                                                <span className="flex items-center gap-1 font-mono text-[10px] text-gray-400" title={`Application ID: ${app.id}`}>
                                                                    • App #: {app.applicationNumber || app.id}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {/* Progress Bar */}
                                                        {app.progress !== undefined && (
                                                            <div className="mt-3">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                                        {app.stage?.replace(/_/g, ' ') || 'application submitted'}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-[#6605c7]">{getDynamicProgress(app)}%</span>
                                                                </div>
                                                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                                    <div
                                                                        className="bg-gradient-to-r from-[#6605c7] to-purple-400 h-1.5 rounded-full transition-all duration-500"
                                                                        style={{ width: `${getDynamicProgress(app)}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 shrink-0">
                                                    {submittedDate && (
                                                        <span className="text-[10px] text-gray-400 font-bold">
                                                            {new Date(submittedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Footer for detailed progress toggle */}
                                            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between gap-4 select-none">
                                                <button
                                                    onClick={() => toggleAppProgress(app.id)}
                                                    className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase text-[#6605c7] hover:text-[#5504a8] transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">
                                                        {expandedApps[app.id] ? 'expand_less' : 'expand_more'}
                                                    </span>
                                                    {expandedApps[app.id] ? 'Hide Progress Details' : 'View Progress Details'}
                                                </button>

                                                {app.id && (
                                                    <span className="text-[9px] font-black uppercase text-gray-300 tracking-wider">
                                                        Track Progress
                                                    </span>
                                                )}
                                            </div>

                                            {/* Expanded Stepper timeline */}
                                            {expandedApps[app.id] && (
                                                <ApplicationProgressCollapse app={app} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Activity Tab */}
                {activeTab === "activity" && (
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Activity Log</h2>
                        <div className="bg-white rounded-xl border border-gray-100 p-8">
                            <UserActivityLog
                                userId={user?.id}
                                limit={50}
                                refreshInterval={30000}
                                variant="page"
                            />
                        </div>
                    </div>
                )}

                {/* Profile Tab */}
                {activeTab === "profile" && (
                    <div className="max-w-2xl">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">My Profile</h2>
                        <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-5 mb-8">
                                <div className="w-16 h-16 bg-[#6605c7] rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                                    {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "User"}
                                    </h3>
                                    <p className="text-gray-500 text-sm">{user?.email}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                {[
                                    { label: "User ID", value: displayUserId || "—" },
                                    { label: "First Name", value: user?.firstName || "—" },
                                    { label: "Last Name", value: user?.lastName || "—" },
                                    { label: "Email", value: user?.email || "—" },
                                    { label: "Phone Number", value: user?.phoneNumber || "—" },
                                    { label: "Date of Birth", value: user?.dateOfBirth || "—" },
                                    { label: "Role", value: user?.role || "user" },
                                ].map((f) => (
                                    <div key={f.label}>
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{f.label}</label>
                                        <p className="text-[13px] font-medium text-gray-900 mt-1">{f.value}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 border-t border-gray-50 pt-8">
                                <Link href="/profile" className="px-5 py-2.5 bg-[#6605c7] text-white text-xs font-bold rounded-lg hover:bg-[#5504a8] transition-all">
                                    Edit Profile
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Documents Tab */}
                {activeTab === "documents" && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">My Documents</h2>
                            <Link href="/document-vault" className="px-4 py-2 bg-white text-gray-700 border border-gray-200 text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-all">
                                <span className="material-symbols-outlined text-[16px]">cloud_upload</span> Open Vault
                            </Link>
                        </div>
                        {!data.documents?.length ? (
                            <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                                <span className="material-symbols-outlined text-5xl text-gray-200 mb-4 block">folder_open</span>
                                <p className="text-gray-500 text-sm font-bold">No documents uploaded yet</p>
                                <p className="text-gray-400 text-xs mt-2 mb-6">Upload required documents for faster loan processing</p>
                                <Link href="/document-vault" className="px-6 py-2.5 bg-[#6605c7] text-white text-xs font-bold rounded-lg">
                                    Go to Document Vault
                                </Link>
                            </div>
                        ) : (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {data.documents.map((doc: any, i) => {
                                    const status = doc.status;
                                    const isVerified = status === 'verified';
                                    const isRejected = status === 'rejected';
                                    const isPending = status === 'uploaded' || status === 'pending';

                                    let statusLabel = "Uploaded";
                                    let statusColor = "text-gray-400";
                                    let bgClass = "bg-gray-50 text-gray-600";
                                    let iconName = "description";
                                    let checkIcon = "check";
                                    let checkColor = "bg-emerald-500 text-white";

                                    if (isVerified) {
                                        statusLabel = "Verified";
                                        statusColor = "text-emerald-600";
                                        bgClass = "bg-emerald-50 text-emerald-600";
                                        iconName = "check_circle";
                                        checkIcon = "check";
                                        checkColor = "bg-emerald-500 text-white";
                                    } else if (isRejected) {
                                        statusLabel = "Rejected";
                                        statusColor = "text-rose-600";
                                        bgClass = "bg-rose-50 text-rose-600";
                                        iconName = "cancel";
                                        checkIcon = "close";
                                        checkColor = "bg-rose-500 text-white";
                                    } else if (isPending) {
                                        statusLabel = "Pending Review";
                                        statusColor = "text-amber-600";
                                        bgClass = "bg-amber-50 text-[#d97706]";
                                        iconName = "pending";
                                        checkIcon = "hourglass_empty";
                                        checkColor = "bg-amber-500 text-white";
                                    }

                                    return (
                                        <div key={i} className={`bg-white rounded-xl p-5 border flex flex-col justify-between hover:border-[#6605c7]/20 transition-all ${
                                            isRejected ? 'border-rose-100 bg-rose-50/5' : isPending ? 'border-amber-100 bg-amber-50/5' : isVerified ? 'border-emerald-100 bg-emerald-50/5' : 'border-gray-100'
                                        }`}>
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-9 h-9 ${bgClass} rounded-lg flex items-center justify-center shrink-0`}>
                                                        <span className="material-symbols-outlined text-xl">{iconName}</span>
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-[13px] text-gray-900 capitalize">{doc.docType.replace(/_/g, ' ')}</div>
                                                        <div className={`text-[10px] uppercase font-black tracking-widest mt-0.5 ${statusColor}`}>{statusLabel}</div>
                                                    </div>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full ${checkColor} flex items-center justify-center shrink-0`}>
                                                    <span className="material-symbols-outlined text-[14px] font-bold">{checkIcon}</span>
                                                </div>
                                            </div>

                                            {isRejected && (
                                                <div className="mt-4 p-3 bg-rose-50 rounded-lg border border-rose-100 flex gap-2">
                                                    <span className="material-symbols-outlined text-rose-500 text-[14px] shrink-0 mt-0.5">info</span>
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase tracking-wider text-rose-600 mb-0.5">Rejection Reason</p>
                                                        <p className="text-[10px] text-rose-700 leading-normal font-medium">{doc.verificationMetadata?.rejectionReason || doc.rejectionReason || "Please upload a clearer document."}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Real-time Notification Toast */}
            {activeToast && (
                <div className="fixed bottom-24 right-6 z-50 max-w-sm w-full bg-white/90 backdrop-blur-md border border-gray-150 rounded-3xl p-5 shadow-[0_24px_60px_rgba(102,5,199,0.12)] flex gap-4 items-start animate-in slide-in-from-bottom-5 duration-300 animate-fade-in">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6605c7] to-[#8b3cf7] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#6605c7]/20 border border-white/20">
                        <span className="material-symbols-outlined text-[20px]">support_agent</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-gray-900 font-bold text-xs uppercase tracking-wider mb-1">{activeToast.sender}</h4>
                        <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed font-medium">{activeToast.content}</p>
                        <button
                            onClick={() => {
                                setChatOpen(true);
                                setUnreadCount(0);
                                setActiveToast(null);
                            }}
                            className="mt-3 text-[10px] font-black uppercase tracking-widest text-[#6605c7] hover:underline flex items-center gap-1"
                        >
                            Open Chat <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                        </button>
                    </div>
                    <button
                        onClick={() => setActiveToast(null)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
            )}

            {/* Floating Support Chat Bubble */}
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => {
                        setChatOpen(true);
                        setUnreadCount(0);
                        setActiveToast(null);
                    }}
                    className="relative w-14 h-14 bg-gradient-to-br from-[#6605c7] to-[#8b3cf7] hover:from-[#5504a8] hover:to-[#7a2fe0] text-white rounded-full flex items-center justify-center shadow-[0_12px_36px_rgba(102,5,199,0.3)] transition-all hover:scale-105 active:scale-95 group border border-white/10"
                >
                    <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform duration-200">chat</span>

                    {/* Unread Badge */}
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 border-2 border-white text-white text-[9px] font-black w-6 h-6 rounded-full flex items-center justify-center animate-pulse shadow-md">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
}
