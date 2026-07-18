"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useStaffLayout } from "@/app/staff/layout";
import { adminApi, referenceApi, staffProfileApi, apiFetch } from "@/lib/api";
import Link from "next/link";
import ApplicationDetailView from "@/components/staff/ApplicationDetailView";
import SendEmailModal from "@/components/staff/SendEmailModal";

const IST_OFFSET = 5.5 * 60 * 60 * 1000;

const convertToIST = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    let cleanDs = dateStr;
    if (typeof cleanDs === 'string' && !cleanDs.includes('Z') && !cleanDs.includes('+')) {
        if (cleanDs.includes('T') || cleanDs.includes(':')) {
            const formatted = cleanDs.replace(' ', 'T');
            cleanDs = formatted.includes('Z') ? formatted : formatted + 'Z';
        }
    }
    const utcDate = new Date(cleanDs);
    return new Date(utcDate.getTime() + IST_OFFSET);
};

const formatIST = (dateVal: any, includeTime: boolean = true): string => {
    if (!dateVal) return "—";
    try {
        let cleanDs = dateVal;
        if (typeof cleanDs === 'string' && !cleanDs.includes('Z') && !cleanDs.includes('+')) {
            if (cleanDs.includes('T') || cleanDs.includes(':')) {
                const formatted = cleanDs.replace(' ', 'T');
                cleanDs = formatted.includes('Z') ? formatted : formatted + 'Z';
            }
        }
        const d = new Date(cleanDs);
        if (isNaN(d.getTime())) return "—";

        const parts = new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: includeTime ? "2-digit" : undefined,
            minute: includeTime ? "2-digit" : undefined,
            second: includeTime ? "2-digit" : undefined,
            hour12: false
        }).formatToParts(d);

        const getPart = (type: string) => parts.find(p => p.type === type)?.value || "";

        const month = getPart("month");
        const day = getPart("day");
        const year = getPart("year");

        if (includeTime) {
            const hour = getPart("hour");
            const minute = getPart("minute");
            const second = getPart("second");
            return `${month} ${day}, ${year} • ${hour}:${minute}:${second}`;
        } else {
            return `${month} ${day}, ${year} `;
        }
    } catch {
        return "—";
    }
};

const getApplicationDisplayProgress = (app: any): number => {
    const status = (app.status || "").toLowerCase();
    const stage = (app.stage || "").toLowerCase();
    const bankWorkflow = (app.bankWorkflowStatus || "").toUpperCase();

    if (
        status === "disbursed" ||
        status === "disbursement_confirmed" ||
        status === "closed" ||
        bankWorkflow === "DISBURSED"
    ) {
        return 100;
    }
    if (status === "approved" || stage === "sanction" || stage === "sanctioned") {
        return Math.max(app.progress ?? 0, 95);
    }
    if (
        stage === "bank_review" ||
        status === "under_bank_review" ||
        status === "processing"
    ) {
        return Math.max(app.progress ?? 0, 90);
    }
    if (stage === "credit_check" || status === "query_raised") {
        return Math.max(app.progress ?? 0, 75);
    }
    if (
        stage === "submit_to_bank" ||
        stage === "bank_submission" ||
        status === "submitted_to_bank" ||
        status === "file_logged"
    ) {
        return Math.max(app.progress ?? 0, 50);
    }
    if (
        stage === "document_verification" ||
        stage === "documents_verification" ||
        status === "staff_verified" ||
        status === "docs_received" ||
        status === "docs_uploaded" ||
        status === "under_review"
    ) {
        return Math.max(app.progress ?? 0, 40);
    }
    if (status === "submitted" || stage === "application_submitted") {
        return Math.max(app.progress ?? 0, 25);
    }

    return app.progress ?? 10;
};

const renderBankLogo = (name: string, sizeClass: string = "h-11") => {
    const b = name.toLowerCase();
    if (b.includes('idfc')) return <img src="/images/lenders/idfc-first-bank.jpg" alt="IDFC" className={`${sizeClass} object-contain`} title="IDFC FIRST Bank" />;
    if (b.includes('avanse')) return <img src="/images/lenders/avanse.jpg" alt="Avanse" className={`${sizeClass} object-contain`} title="Avanse Financial" />;
    if (b.includes('auxilo')) return <img src="/images/lenders/auxilo.png" alt="Auxilo" className={`${sizeClass} object-contain`} title="Auxilo Finserve" />;
    if (b.includes('credila') || b.includes('hdfc')) return <img src="/images/lenders/hdfc-credila.png" alt="Credila" className={`${sizeClass} object-contain`} title="HDFC Credila" />;
    if (b.includes('poonawalla')) return <img src="/images/lenders/poonawalla.png" alt="Poonawalla" className={`${sizeClass} object-contain`} title="Poonawalla Fincorp" />;
    if (b.includes('incred')) return <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[9px] font-black border border-purple-200" title="InCred">InCred</span>;
    return <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[9px] font-black border border-slate-200" title={name}>{name}</span>;
};

const getApplicationStageLabel = (app: any, progress: number): string => {
    if (app.currentStage) return app.currentStage;

    const status = (app.status || "").toLowerCase();
    if (
        status === "disbursed" ||
        status === "disbursement_confirmed" ||
        status === "closed" ||
        (app.bankWorkflowStatus || "").toUpperCase() === "DISBURSED"
    ) {
        return "Disbursed";
    }

    if (progress <= 12) return "Application Created";
    if (progress <= 25) return "Application Submitted";
    if (progress <= 40) return "Docs Verification";
    if (progress <= 50) return "Submit to Bank";
    if (progress <= 75) return "Credit Check";
    if (progress <= 90) return "Bank Review";
    if (progress <= 95) return "Sanction";
    return "Disbursement";
};

const TableHeader = ({ children }: { children: React.ReactNode }) => (
    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] uppercase tracking-widest font-['Playfair_Display',serif] font-bold text-left">
        <tr>{children}</tr>
    </thead>
);

export default function ApplicationsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const appIdParam = searchParams.get("id");
    const { onlineEmails } = useStaffLayout();

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const applicationsPerPage = 20;

    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
    const [activeContactPopup, setActiveContactPopup] = useState<{ id: string; type: 'email' | 'phone' } | null>(null);
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    // Email Modal
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailModalRecipient, setEmailModalRecipient] = useState("");
    const [emailModalRecipientName, setEmailModalRecipientName] = useState("");

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {
                limit: "1000",
                excludeStatus: "submitted",
            };
            const res: any = await adminApi.getApplications(params);
            if (res && res.data) {
                setData(res.data);
                setTotalItems(res.data.length);
            } else {
                setData(Array.isArray(res) ? res : []);
                setTotalItems(0);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handle auto-opening of the application detail view modal if ID is in the query params
    useEffect(() => {
        if (appIdParam && data.length > 0) {
            const found = data.find(app => (app.id || app._id) === appIdParam);
            if (found) {
                setSelectedApp(found);
            }
        }
    }, [appIdParam, data]);

    const toggleRowExpanded = (rowId: string) => {
        setExpandedRows(prev => ({ ...prev, [rowId]: !prev[rowId] }));
    };

    const openEmailModal = (email: string, name: string) => {
        setEmailModalRecipient(email);
        setEmailModalRecipientName(name);
        setIsEmailModalOpen(true);
    };

    const statusColors: Record<string, string> = {
        draft: 'bg-amber-50 text-amber-600 border border-amber-200',
        pending: 'bg-amber-50 text-amber-600 border border-amber-200',
        submitted: 'bg-blue-50 text-blue-600 border border-blue-200',
        submitted_to_bank: 'bg-indigo-50 text-indigo-600 border border-indigo-200',
        processing: 'bg-indigo-50 text-indigo-600 border border-indigo-200',
        approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        verified: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        rejected: 'bg-rose-50 text-rose-600 border border-rose-200',
        disbursed: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
        routed_multiparty: 'bg-purple-50 text-purple-700 border border-purple-200',
    };

    // Filter and search on client-side for pipeline applications
    const filteredData = useMemo(() => {
        return data.filter(item => {
            const fullName = `${item.firstName || item.student?.firstName || ''} ${item.lastName || item.student?.lastName || ''}`.toLowerCase();
            const college = (item.universityName || item.college || '').toLowerCase();
            const course = (item.courseName || '').toLowerCase();
            const query = searchQuery.toLowerCase();

            const matchesSearch = fullName.includes(query) || college.includes(query) || course.includes(query);

            if (!matchesSearch) return false;
            if (filterStatus === "all") return true;

            const status = (item.status || "draft").toLowerCase();
            if (filterStatus === "pending") {
                return ["pending", "draft", "submitted"].includes(status);
            }
            if (filterStatus === "processing") {
                return [
                    "processing",
                    "submitted_to_bank",
                    "routed_multiparty",
                    "file_logged",
                    "docs_received",
                    "staff_verified",
                    "under_review",
                    "docs_uploaded"
                ].includes(status);
            }
            if (filterStatus === "approved") {
                return ["approved", "verified", "disbursed", "disbursement_confirmed"].includes(status);
            }
            if (filterStatus === "rejected") {
                return status === "rejected";
            }
            return status === filterStatus;
        });
    }, [data, searchQuery, filterStatus]);

    const totalPages = Math.max(1, Math.ceil(filteredData.length / applicationsPerPage));
    const pagedData = useMemo(() => {
        const start = (currentPage - 1) * applicationsPerPage;
        return filteredData.slice(start, start + applicationsPerPage);
    }, [filteredData, currentPage]);

    const showingStart = (currentPage - 1) * applicationsPerPage + 1;
    const showingEnd = Math.min(currentPage * applicationsPerPage, filteredData.length);

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in pb-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    {/* <p className="text-[10px] font-['Playfair_Display',serif] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">STAFF DASHBOARD</p> */}
                    <h2 className="text-[28px] tracking-tight flex items-center gap-3 font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">
                        Active Pipeline
                        {/* <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-sans font-semibold text-emerald-700 ml-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            LIVE SYSTEM
                        </span> */}
                    </h2>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={loadData}
                        className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[16px]">refresh</span>

                    </button>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            placeholder="Search applications..."
                            className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-['Playfair_Display',serif] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 w-64 shadow-sm"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-['Playfair_Display',serif] font-black uppercase tracking-widest text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-all shadow-sm"
                    >
                        <option value="all">ALL STATUS</option>
                        <option value="pending">PENDING</option>
                        <option value="processing">PROCESSING</option>
                        <option value="approved">APPROVED</option>
                        <option value="rejected">REJECTED</option>
                    </select>
                </div>
            </div>

            <div className="rounded-[24px] border border-slate-100 overflow-hidden shadow-sm bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <TableHeader>
                            <th className="sticky left-0 z-20 bg-slate-50 px-5 py-5"><span className="text-[12px] font-['Playfair_Display',serif] font-extrabold text-[#0d1b2a] uppercase tracking-widest">APPLICANT PROFILE</span></th>
                            <th className="px-5 py-5"><span className="text-[12px] font-['Playfair_Display',serif] font-extrabold text-[#0d1b2a] uppercase tracking-widest">COLLEGE NAME</span></th>
                            {/* <th className="px-6 py-5 min-w-[240px] w-[240px]"><span className="text-[12px] font-['Playfair_Display',serif] font-extrabold text-[#0d1b2a] uppercase tracking-widest">TARGET BANK</span></th> */}
                            <th className="px-5 py-5 w-48"><span className="text-[12px] font-['Playfair_Display',serif] font-extrabold text-[#0d1b2a] uppercase tracking-widest">PROGRESS</span></th>
                            <th className="px-5 py-5 min-w-[220px] w-[220px]"><span className="text-[12px] font-['Playfair_Display',serif] font-extrabold text-[#0d1b2a] uppercase tracking-widest">CURRENT STATUS</span></th>
                            <th className="px-5 py-5 text-center"><span className="text-[12px] font-['Playfair_Display',serif] font-extrabold text-[#0d1b2a] uppercase tracking-widest">ACTIONS</span></th>
                        </TableHeader>
                        <tbody className={`divide-y divide-slate-50 ${loading ? 'opacity-60 pointer-events-none transition-opacity duration-300' : 'transition-opacity duration-300'}`}>
                            {loading && pagedData.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Loading applications...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : pagedData.length > 0 ? (
                                pagedData.map((item: any, idx: number) => {
                                    const progress = getApplicationDisplayProgress(item);
                                    const statusKey = (item.status || 'draft').toLowerCase();
                                    const initials = `${(item.firstName || item.student?.firstName || '?')[0]}${(item.lastName || item.student?.lastName || '')[0] || ''}`;
                                    const stageLabel = getApplicationStageLabel(item, progress);
                                    const isOnline = (item.email || item.student?.email) && onlineEmails.map(e => e.toLowerCase()).includes((item.email || item.student?.email).toLowerCase());
                                    const popup = activeContactPopup;
                                    const rowId = item.id || item._id || String(idx);
                                    const isExpanded = !!expandedRows[rowId];

                                    return (
                                        <tr key={rowId} className="group hover:bg-slate-50/30 transition-colors">
                                            <td className={`sticky left-0 z-10 bg-white px-5 border-b border-slate-50 group-hover:bg-slate-50/50 transition-all ${isExpanded ? 'py-6' : 'py-4'}`} style={{ minWidth: 260, maxWidth: 280 }}>
                                                <div className={`flex ${isExpanded ? 'items-start' : 'items-center'} gap-3`}>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleRowExpanded(rowId)}
                                                        className={`shrink-0 w-6 h-6 rounded-md hover:bg-slate-100 active:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors ${isExpanded ? 'mt-1' : ''}`}
                                                        title={isExpanded ? "Collapse Details" : "Expand Details"}
                                                    >
                                                        <span className="material-symbols-outlined text-[18px] transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                                            expand_more
                                                        </span>
                                                    </button>

                                                    {isExpanded && (
                                                        <div
                                                            onClick={() => {
                                                                const uid = item.userId || item.user_id || item.student?.id || item.student?._id;
                                                                if (uid) {
                                                                    router.push(`/staff/chat-customer?userId=${uid}`);
                                                                }
                                                            }}
                                                            className="relative shrink-0 group/avatar hover:scale-105 transition-all cursor-pointer"
                                                            title="Click to Chat with Student"
                                                        >
                                                            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 flex items-center justify-center font-medium text-[13px] text-slate-600 transition-all relative overflow-hidden">
                                                                <span>{initials}</span>
                                                            </div>
                                                            {isOnline && (
                                                                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse shadow-sm shadow-emerald-500/30" />
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="min-w-0 flex-1 flex items-start justify-between gap-3">
                                                        <div className="min-w-0 flex-col gap-1">
                                                            <p
                                                                onClick={() => {
                                                                    const uid = item.userId || item.user_id || item.student?.id || item.student?._id;
                                                                    const email = item.email || item.student?.email;
                                                                    if (uid) window.open(`/staff/users/${uid}${email ? `?email=${email}` : ''}`, '_blank');
                                                                }}
                                                                className="text-[17px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a] leading-tight truncate cursor-pointer hover:text-indigo-600 transition-all"
                                                                title="Click to view Student Profile"
                                                            >
                                                                {item.firstName || item.student?.firstName || '—'} {item.lastName || item.student?.lastName || ''}
                                                            </p>
                                                            {isExpanded && (
                                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                                    {(item.applicationNumber && (item.applicationNumber.startsWith('VTU-APP-') || item.applicationNumber.startsWith('VTU-BNK-') || item.applicationNumber.startsWith('VL-APP-'))) && (
                                                                        <p
                                                                            onClick={() => router.push(`/staff/applications/${item.id || item._id}`)}
                                                                            className="text-[10px] bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-indigo-700 cursor-pointer transition-all font-bold uppercase tracking-widest inline-flex items-center gap-1.5 px-2 py-1 rounded whitespace-nowrap border border-slate-200"
                                                                            title="Click to open Application Page"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[12px]">description</span>
                                                                            {item.applicationNumber}
                                                                        </p>
                                                                    )}
                                                                    {/* {(item.bank || item.targetBank) && (
                                                                        <button
                                                                            onClick={() => {
                                                                                const bankParam = item.bank || item.targetBank || "";
                                                                                const appNo = item.applicationNumber || `APP-${(item.id || item._id || 'UNKNOWN').slice(-6)}`;
                                                                                router.push(`/staff/chat-customer?bankName=${encodeURIComponent(bankParam)}&applicationId=${item.id || item._id}&applicationNumber=${encodeURIComponent(appNo)}`);
                                                                            }}
                                                                            className="text-[10px] bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 cursor-pointer transition-all font-bold uppercase tracking-widest inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-indigo-200 shadow-sm whitespace-nowrap"
                                                                            title={`Chat with ${item.bank || item.targetBank}`}
                                                                        >
                                                                            <span className="material-symbols-outlined text-[12px]">forum</span>
                                                                            Chat with Bank
                                                                        </button>
                                                                    )} */}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {isExpanded && (
                                                            <div className="flex flex-col items-end shrink-0 pt-1">
                                                                <div className="flex items-center gap-2 relative">
                                                                    <button
                                                                        onClick={() => setActiveContactPopup(popup?.id === rowId && popup?.type === 'phone' ? null : { id: rowId, type: 'phone' })}
                                                                        className="w-7 h-7 rounded bg-white border border-slate-200 shadow-sm hover:border-indigo-300 hover:bg-indigo-50 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all"
                                                                        title="Phone number"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[14px]">phone_enabled</span>
                                                                    </button>

                                                                    <button
                                                                        onClick={() => setActiveContactPopup(popup?.id === rowId && popup?.type === 'email' ? null : { id: rowId, type: 'email' })}
                                                                        className="w-7 h-7 rounded bg-white border border-slate-200 shadow-sm hover:border-indigo-300 hover:bg-indigo-50 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all"
                                                                        title="Email address"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[14px]">mail</span>
                                                                    </button>

                                                                    {popup && popup.id === rowId && (
                                                                        <>
                                                                            <div className="fixed inset-0 z-40" onClick={() => setActiveContactPopup(null)} />
                                                                            <div className="absolute right-0 top-7 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2.5 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 duration-150 font-sans w-max max-w-[260px]">
                                                                                <span className="material-symbols-outlined text-slate-400 text-[15px]">
                                                                                    {popup.type === 'email' ? 'mail' : 'call'}
                                                                                </span>
                                                                                <span className="text-[12px] font-semibold text-slate-700 select-all truncate max-w-[160px]">
                                                                                    {popup.type === 'email'
                                                                                        ? (item.email || item.student?.email || 'No email')
                                                                                        : (item.phone || item.mobile || item.phoneNumber || item.student?.phone || 'No phone')}
                                                                                </span>
                                                                                {popup.type === 'email' && (
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            const email = item.email || item.student?.email;
                                                                                            const name = `${item.firstName || item.student?.firstName || ''} ${item.lastName || item.student?.lastName || ''}`.trim();
                                                                                            if (email) openEmailModal(email, name);
                                                                                            setActiveContactPopup(null);
                                                                                        }}
                                                                                        className="w-5 h-5 rounded hover:bg-indigo-50 flex items-center justify-center text-indigo-600 hover:text-indigo-800"
                                                                                        title="Compose Email"
                                                                                    >
                                                                                        <span className="material-symbols-outlined text-[14px]">mail</span>
                                                                                    </button>
                                                                                )}
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const textToCopy = popup.type === 'email'
                                                                                            ? (item.email || item.student?.email || '')
                                                                                            : (item.phone || item.mobile || item.phoneNumber || item.student?.phone || '');
                                                                                        navigator.clipboard.writeText(textToCopy);
                                                                                        alert(`${popup.type === 'email' ? 'Email' : 'Phone'} copied to clipboard!`);
                                                                                    }}
                                                                                    className="w-5 h-5 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
                                                                                    title="Copy to clipboard"
                                                                                >
                                                                                    <span className="material-symbols-outlined text-[13px]">content_copy</span>
                                                                                </button>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 border-b border-slate-50 group-hover:bg-slate-50/50 transition-colors">
                                                {item.universityName || item.college ? (() => {
                                                    const collegeName = item.universityName || item.college;
                                                    const slug = collegeName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                                    return (
                                                        <Link
                                                            href={`/university/${slug}`}
                                                            target="_blank"
                                                            className="text-[17px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a] hover:text-slate-800 cursor-pointer transition-all block truncate max-w-[180px]"
                                                            title="Click to view University Details"
                                                        >
                                                            {collegeName}
                                                        </Link>
                                                    );
                                                })() : (
                                                    <p className="text-[17px] font-['Playfair_Display',serif] font-bold text-[#0d1b2a] truncate max-w-[180px]">—</p>
                                                )}
                                                {/* <p className="text-[12px] text-slate-500 font-bold truncate max-w-[180px] mt-1">
                                                    {item.courseName || item.program || item.courseLevel || '—'}
                                                </p> */}
                                            </td>
                                            {/* <td className="px-6 py-4 border-b border-slate-50 group-hover:bg-slate-50/50 transition-colors min-w-[240px] w-[260px]">
                                                <div className="flex flex-col justify-center min-h-[60px] gap-1">
                                                    <div className="flex items-center">
                                                        {(() => {
                                                            const bStr = item.bank || item.targetBank || '';
                                                            if (bStr.includes(',') || (item.status || '').toLowerCase() === 'routed_multiparty') {
                                                                const banksList = bStr.split(',').map((s: string) => s.trim()).filter(Boolean);
                                                                return (
                                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                                        {banksList.map((bankName: string, index: number) => (
                                                                            <div key={index} className="h-9 px-2 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                                                                                {renderBankLogo(bankName, "h-7 max-w-[80px]")}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                );
                                                            }
                                                            const bName = bStr.toLowerCase();
                                                            if (bName.includes('idfc')) return <img src="/images/lenders/idfc-first-bank.jpg" alt="IDFC FIRST Bank" className="h-12 max-w-[190px] w-auto object-contain" />;
                                                            if (bName.includes('avanse')) return <img src="/images/lenders/avanse.jpg" alt="Avanse" className="h-14 max-w-[190px] w-auto object-contain" />;
                                                            if (bName.includes('auxilo')) return <img src="/images/lenders/auxilo.png" alt="Auxilo" className="h-24 max-w-[240px] w-auto object-contain" />;
                                                            if (bName.includes('credila') || bName.includes('hdfc')) return <img src="/images/lenders/hdfc-credila.png" alt="Credila" className="h-11 max-w-[190px] w-auto object-contain" />;
                                                            if (bName.includes('poonawalla')) return <img src="/images/lenders/poonawalla.png" alt="Poonawalla" className="h-[52px] max-w-[190px] w-auto object-contain" />;
                                                            if (bName.includes('incred')) return <span className="px-3 py-1.5 rounded-lg bg-purple-100 text-purple-800 text-[12px] font-black border border-purple-200">InCred</span>;
                                                            return <div className="text-[#0d1b2a] font-black text-[14px] uppercase truncate max-w-[200px]">{item.bank || item.targetBank || '—'}</div>;
                                                        })()}
                                                    </div>
                                                </div>
                                            </td> */}
                                            <td className="px-5 py-4 border-b border-slate-50 group-hover:bg-slate-50/50 transition-colors" style={{ minWidth: 160 }}>
                                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-2">
                                                    <div className={`h-1.5 rounded-full transition-all duration-700 ${progress === 100 ? 'bg-emerald-500' : 'bg-[#4f46e5]'}`} style={{ width: `${progress}%` }} />
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px]">✨</span>
                                                    <p className="text-[10px] font-bold text-slate-700">{stageLabel}</p>
                                                    <span className="text-[10px] font-bold text-[#4f46e5] ml-auto">{progress}%</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 border-b border-slate-50 group-hover:bg-slate-50/50 transition-colors">
                                                <div className="flex flex-col items-start gap-1.5">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-black uppercase tracking-wider border ${statusColors[statusKey] || 'bg-amber-50/50 text-amber-600 border-amber-200'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${statusKey === 'rejected' ? 'bg-rose-500' : statusKey === 'approved' || statusKey === 'verified' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                        {item.status || 'DRAFT'}
                                                    </span>
                                                    <div className="text-[12px] text-slate-500 font-medium">
                                                        <p>Submitted: {item.submittedAt ? formatIST(item.submittedAt, true) : '—'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-center border-b border-slate-50 group-hover:bg-slate-50/50 transition-colors">
                                                <div className="relative inline-block text-left">
                                                    <button
                                                        onClick={(e) => {
                                                            const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                                                            if (activeMenuId === rowId) {
                                                                setActiveMenuId(null);
                                                                setMenuPosition(null);
                                                            } else {
                                                                setActiveMenuId(rowId);
                                                                setMenuPosition({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
                                                            }
                                                        }}
                                                        className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center transition-all shadow-sm mx-auto"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                                    </button>

                                                    {activeMenuId === rowId && menuPosition && (
                                                        <>
                                                            <div className="fixed inset-0 z-40" onClick={() => { setActiveMenuId(null); setMenuPosition(null); }} />
                                                            <div
                                                                className="fixed w-56 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 py-3 animate-in fade-in zoom-in-95 duration-200 font-sans"
                                                                style={{ top: menuPosition.top, right: menuPosition.right }}
                                                            >
                                                                <button
                                                                    onClick={() => { setSelectedApp(item); setActiveMenuId(null); setMenuPosition(null); }}
                                                                    className="w-full flex gap-4 px-5 py-3 text-[12px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors"
                                                                >
                                                                    <span className="material-symbols-outlined text-[18px] text-indigo-500">visibility</span>
                                                                    View Application
                                                                </button>

                                                                <button
                                                                    onClick={() => { setSearchQuery(item.email || item.student?.email); setActiveMenuId(null); setMenuPosition(null); }}
                                                                    className="w-full flex gap-4 px-5 py-3 text-[12px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors"
                                                                >
                                                                    <span className="material-symbols-outlined text-[18px] text-emerald-500">list_alt</span>
                                                                    All Applications
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={10} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4 text-slate-400">
                                            <span className="material-symbols-outlined text-5xl">inventory_2</span>
                                            <p className="text-[12px] font-black uppercase tracking-widest">No Applications Found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredData.length > applicationsPerPage && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <p className="text-[11px] font-bold text-slate-700">
                            Showing <span className="text-indigo-600">{showingStart}-{showingEnd}</span> of {filteredData.length} entries
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={currentPage === 1 || loading}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
                            >
                                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                                Previous
                            </button>
                            <button
                                disabled={currentPage >= totalPages || loading}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
                            >
                                Next
                                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <SendEmailModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                recipientEmail={emailModalRecipient}
                recipientName={emailModalRecipientName}
            />

            {selectedApp && (
                <ApplicationDetailView
                    application={selectedApp}
                    onBack={() => {
                        setSelectedApp(null);
                        // Clean up URL parameter if modal is closed
                        if (appIdParam) router.push('/staff/applications');
                    }}
                    sidebarOpen={false}
                    setSidebarOpen={() => { }}
                    onAadhaarSaved={() => { }}
                    onApplicationUpdated={async () => {
                        await loadData();
                    }}
                />
            )}
        </div>
    );
}
