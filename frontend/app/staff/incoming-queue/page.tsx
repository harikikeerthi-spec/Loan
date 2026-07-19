"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useStaffLayout } from "@/app/staff/layout";
import { adminApi, staffProfileApi, apiFetch } from "@/lib/api";
import Link from "next/link";
import SendEmailModal from "@/components/staff/SendEmailModal";
import ShareWithBankModal from "@/components/staff/ShareWithBankModal";
 
import { useDialog } from "@/contexts/DialogContext";
import { motion, AnimatePresence } from "framer-motion";
import { checkFollowUpConflict, DEFAULT_TIME_SLOTS, formatSlot12Hr } from "@/lib/followUpUtils";

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

export default function IncomingQueuePage() {
    const router = useRouter();
    const { user, token } = useAuth();
    const { onlineEmails, fetchBadgeStats } = useStaffLayout();
    const { confirm: dialogConfirm } = useDialog();

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const applicationsPerPage = 20;

    

    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
    const [activeContactPopup, setActiveContactPopup] = useState<{ id: string; type: 'email' | 'phone' } | null>(null);
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    
    const [activeDockApp, setActiveDockApp] = useState<any | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [routingApp, setRoutingApp] = useState<any | null>(null);

    // Email Modal
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailModalRecipient, setEmailModalRecipient] = useState("");
    const [emailModalRecipientName, setEmailModalRecipientName] = useState("");

    

    // Rejection Modal
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [appToReject, setAppToReject] = useState<any | null>(null);

    const [editingFollowUpId, setEditingFollowUpId] = useState<string | null>(null);
    const [tempFollowUpDate, setTempFollowUpDate] = useState("");
    const [tempFollowUpTime, setTempFollowUpTime] = useState("");
    const [followUpDates, setFollowUpDates] = useState<Record<string, { date: string, time: string, studentName: string, appNumber: string, notes?: string }>>({});
    const [tempFollowUpNotes, setTempFollowUpNotes] = useState("");
    const [followUpItem, setFollowUpItem] = useState<any | null>(null);

    const followUpKey = user?.id 
        ? `staff_follow_up_dates_${user.id}` 
        : user?.email 
            ? `staff_follow_up_dates_${user.email}` 
            : `staff_follow_up_dates_default`;

    useEffect(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem(followUpKey);
            if (stored) {
                try {
                    setFollowUpDates(JSON.parse(stored));
                } catch (e) {
                    console.error("Failed to parse follow up dates:", e);
                }
            }
        }
    }, [followUpKey]);

    const saveFollowUp = async (appId: string, studentName: string, appNumber: string) => {
        if (!tempFollowUpDate) {
            alert("Please select a date.");
            return;
        }

        const selectedTime = tempFollowUpTime || "10:00";
        const staffId = user?.id || user?.email || "default";

        // Check if date and time slot is already assigned to another student
        const conflict = checkFollowUpConflict({
            staffId,
            date: tempFollowUpDate,
            time: selectedTime,
            currentAppId: appId
        });

        if (conflict) {
            alert(`⚠️ Schedule Conflict!\n\nThe slot (${tempFollowUpDate} at ${selectedTime}) is already assigned to ${conflict.studentName} (${conflict.appNumber || 'Student'}).\n\nThe same date and time cannot be assigned to two different students. Please choose a different date or time slot.`);
            return;
        }

        if (tempFollowUpNotes.trim()) {
            try {
                await adminApi.addRemark(appId, {
                    type: "note",
                    content: tempFollowUpNotes.trim(),
                    authorName: "Staff Member",
                    isInternal: true,
                } as any);
            } catch (err) {
                console.error("Failed to add follow-up notes as internal note:", err);
            }
        }

        const updated = {
            ...followUpDates,
            [appId]: {
                date: tempFollowUpDate,
                time: selectedTime,
                studentName,
                appNumber: appNumber || `VL-APP-${appId.slice(-5).toUpperCase()}`,
                notes: tempFollowUpNotes
            }
        };
        setFollowUpDates(updated);
        localStorage.setItem(followUpKey, JSON.stringify(updated));
        setEditingFollowUpId(null);
        setFollowUpItem(null);
    };

    const clearFollowUp = (appId: string) => {
        const updated = { ...followUpDates };
        delete updated[appId];
        setFollowUpDates(updated);
        localStorage.setItem(followUpKey, JSON.stringify(updated));
        setEditingFollowUpId(null);
        setFollowUpItem(null);
    };

    const openFollowUpModal = (rowId: string, item: any) => {
        setEditingFollowUpId(rowId);
        setFollowUpItem(item);
        if (followUpDates[rowId]) {
            setTempFollowUpDate(followUpDates[rowId].date);
            setTempFollowUpTime(followUpDates[rowId].time);
            setTempFollowUpNotes(followUpDates[rowId].notes || "");
        } else {
            setTempFollowUpDate("");
            setTempFollowUpTime("");
            setTempFollowUpNotes("");
        }
    };

    const applyQuickDate = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setTempFollowUpDate(`${yyyy}-${mm}-${dd}`);
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const offset = (currentPage - 1) * applicationsPerPage;
            const params: any = {
                limit: String(applicationsPerPage),
                offset: String(offset),
                status: "submitted",
            };
            if (searchQuery) params.search = searchQuery;
            const res: any = await adminApi.getApplications(params);
            if (res && res.data) {
                setData(res.data);
                setTotalItems(res.pagination?.total ?? res.total ?? res.data.length);
            } else {
                setData(Array.isArray(res) ? res : []);
                setTotalItems(Array.isArray(res) ? res.length : 0);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchQuery]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    

    const toggleRowExpanded = (rowId: string) => {
        setExpandedRows(prev => ({ ...prev, [rowId]: !prev[rowId] }));
    };

    const openEmailModal = (email: string, name: string) => {
        setEmailModalRecipient(email);
        setEmailModalRecipientName(name);
        setIsEmailModalOpen(true);
    };

    

    const logActivity = async (type: string, msg: string, icon: string, color: string) => {
        try {
            await staffProfileApi.logActivity({ type, msg, icon, color });
        } catch (e) {
            console.error(e);
        }
    };

    

    const handleApproveApplication = async (item: any) => {
        const appId = item.id || item._id;
        if (!appId) {
            alert("Application ID is missing.");
            return;
        }

        try {
            await adminApi.updateApplicationStatus(appId, {
                status: 'approved',
                stage: 'approved',
                progress: 100,
                remarks: 'Moved to active pipeline by staff',
            });

            await logActivity('approved', `Application #${item.applicationNumber || (appId + '').slice(-6)} moved to active pipeline`, 'check_circle', 'bg-emerald-50 text-emerald-700');
            setActiveDockApp(null);
            await loadData();
            await fetchBadgeStats();
        } catch (e: any) {
            alert(e?.message || 'Failed to approve application');
        }
    };

    const handleConfirmRejection = async () => {
        if (!appToReject || !rejectionReason.trim()) return;
        try {
            await adminApi.updateApplicationStatus(appToReject.id || appToReject._id, {
                status: 'rejected',
                rejectionReason: rejectionReason.trim(),
                remarks: rejectionReason.trim()
            });
            await logActivity('rejected', `Application #${appToReject.applicationNumber || appToReject.id?.slice(-4)} rejected by staff`, 'cancel', 'bg-rose-50 text-rose-700 border-rose-100');
            setActiveDockApp(null);
            setIsRejectModalOpen(false);
            setAppToReject(null);
            setRejectionReason("");
            await loadData();
        } catch (err) {
            alert("Failed to reject application");
        }
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

    const totalPages = Math.max(1, Math.ceil(totalItems / applicationsPerPage));
    const showingStart = (currentPage - 1) * applicationsPerPage + 1;
    const showingEnd = Math.min(currentPage * applicationsPerPage, totalItems);

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in pb-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <p className="text-[10px] font-['Playfair_Display',serif] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-sans font-semibold text-blue-700 ml-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            AWAITING DISTRIBUTION
                        </span>
                    </p>
                    <h2 className="text-[28px] tracking-tight flex items-center gap-3 font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">
                        Incoming Queue

                    </h2>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={loadData}
                        className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[16px]">refresh</span>
                        Refresh
                    </button>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            placeholder="Search incoming queue..."
                            className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-['Playfair_Display',serif] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 w-64 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-[24px] border border-slate-100 overflow-hidden shadow-sm bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <TableHeader>
                            <th className="sticky left-0 z-20 bg-slate-50 px-5 py-5"><span className="text-[12px] font-['Playfair_Display',serif] font-extrabold text-[#0d1b2a] uppercase tracking-widest">APPLICANT PROFILE</span></th>
                            <th className="px-5 py-5"><span className="text-[12px] font-['Playfair_Display',serif] font-extrabold text-[#0d1b2a] uppercase tracking-widest">COLLEGE NAME</span></th>
                            
                            <th className="px-5 py-5 w-48"><span className="text-[12px] font-['Playfair_Display',serif] font-extrabold text-[#0d1b2a] uppercase tracking-widest">PROGRESS</span></th>
                            <th className="px-5 py-5 min-w-[220px] w-[220px]"><span className="text-[12px] font-['Playfair_Display',serif] font-extrabold text-[#0d1b2a] uppercase tracking-widest">CURRENT STATUS</span></th>
                            <th className="px-5 py-5 w-52"><span className="text-[12px] font-['Playfair_Display',serif] font-extrabold text-[#0d1b2a] uppercase tracking-widest">FOLLOW UP</span></th>
                            <th className="px-5 py-5 text-center"><span className="text-[12px] font-['Playfair_Display',serif] font-extrabold text-[#0d1b2a] uppercase tracking-widest">ACTIONS</span></th>
                        </TableHeader>
                        <tbody className={`divide-y divide-slate-50 ${loading ? 'opacity-60 pointer-events-none transition-opacity duration-300' : 'transition-opacity duration-300'}`}>
                            {loading && data.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Loading incoming applications...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : data.length > 0 ? (
                                data.map((item, idx) => {
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
                                            </td>
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
                                            <td className="px-5 py-4 border-b border-slate-50 group-hover:bg-slate-50/50 transition-colors">
                                                <div className="relative">
                                                    {followUpDates[rowId] ? (
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                            <span>
                                                                {(() => {
                                                                    const dateObj = new Date(followUpDates[rowId].date + 'T00:00:00');
                                                                    const day = String(dateObj.getDate()).padStart(2, '0');
                                                                    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                                                                    const monthLabel = months[dateObj.getMonth()] || 'JUN';
                                                                    return `${day} ${monthLabel} ${followUpDates[rowId].time || '__:__'}`;
                                                                })()}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => openFollowUpModal(rowId, item)}
                                                                className="material-symbols-outlined text-[13px] text-rose-500 hover:text-rose-700 cursor-pointer border-0 bg-transparent p-0 flex items-center justify-center active:scale-95"
                                                            >
                                                                edit
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => openFollowUpModal(rowId, item)}
                                                            className="px-4 py-1 border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-full text-[10px] font-extrabold text-slate-400 hover:text-indigo-600 transition-colors bg-white active:scale-95 cursor-pointer"
                                                        >
                                                            Add +
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-center border-b border-slate-50 group-hover:bg-slate-50/50 transition-colors">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDockApp(item);
                                                    }}
                                                    className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center transition-all shadow-sm mx-auto"
                                                    title="Open Action Dock"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={10} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4 text-slate-400">
                                            <span className="material-symbols-outlined text-5xl">inbox_customize</span>
                                            <p className="text-[12px] font-black uppercase tracking-widest">No Incoming Applications Found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalItems > applicationsPerPage && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <p className="text-[11px] font-bold text-slate-700">
                            Showing <span className="text-indigo-600">{showingStart}-{showingEnd}</span> of {totalItems} entries
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

            {editingFollowUpId && followUpItem && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 font-sans" onClick={e => e.stopPropagation()}>
                        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Create Follow-up</p>
                                <h3 className="text-[14px] font-black text-slate-800 leading-tight">
                                    {`${followUpItem.firstName || followUpItem.student?.firstName || ''} ${followUpItem.lastName || followUpItem.student?.lastName || ''}`.trim()}
                                </h3>
                                <p className="text-[10px] text-indigo-500 font-bold mt-0.5">{followUpItem.applicationNumber || '—'}</p>
                            </div>
                            <button type="button" onClick={() => { setEditingFollowUpId(null); setFollowUpItem(null); }} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all border-0 bg-transparent cursor-pointer mt-0.5">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Set a due date</p>
                                <div className="flex items-center gap-2">
                                    {[{label: '1 Day', days: 1}, {label: '3 Days', days: 3}, {label: '1 Week', days: 7}].map(opt => {
                                        const pd = new Date(); pd.setDate(pd.getDate() + opt.days);
                                        const val = `${pd.getFullYear()}-${String(pd.getMonth()+1).padStart(2,'0')}-${String(pd.getDate()).padStart(2,'0')}`;
                                        const isActive = tempFollowUpDate === val;
                                        return (
                                            <button key={opt.label} type="button" onClick={() => applyQuickDate(opt.days)}
                                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${isActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'}`}>
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-px bg-slate-100" />
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Or</span>
                                <div className="flex-1 h-px bg-slate-100" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Set a custom due date</label>
                                    <input type="date" value={tempFollowUpDate} onChange={e => setTempFollowUpDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Select time slot</label>
                                    <select
                                        value={tempFollowUpTime}
                                        onChange={e => setTempFollowUpTime(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    >
                                        <option value="">Select Time Slot...</option>
                                        {DEFAULT_TIME_SLOTS.map(slot => {
                                            const staffId = user?.id || user?.email || "default";
                                            const conflict = tempFollowUpDate ? checkFollowUpConflict({
                                                staffId,
                                                date: tempFollowUpDate,
                                                time: slot,
                                                currentAppId: editingFollowUpId
                                            }) : null;

                                            return (
                                                <option key={slot} value={slot} disabled={!!conflict}>
                                                    {formatSlot12Hr(slot)} {conflict ? `❌ (Booked - ${conflict.studentName})` : '✓ (Available)'}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </div>
                            {tempFollowUpDate && (
                                <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                                    <p className="text-[11px] font-bold text-emerald-700">
                                        Due date will be <span className="font-black">{new Date(tempFollowUpDate + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                        {tempFollowUpTime && <> at <span className="font-black">{tempFollowUpTime}</span></>}
                                    </p>
                                </div>
                            )}
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Notes</label>
                                <textarea rows={3} value={tempFollowUpNotes} onChange={e => setTempFollowUpNotes(e.target.value)} placeholder="Add a quick note..." className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700 font-medium resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                            </div>
                        </div>
                        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                            <button type="button" onClick={() => clearFollowUp(editingFollowUpId)} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-100 bg-white transition-all cursor-pointer">Clear</button>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => { setEditingFollowUpId(null); setFollowUpItem(null); }} className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer">Cancel</button>
                                <button type="button" onClick={() => saveFollowUp(editingFollowUpId, `${followUpItem.firstName || followUpItem.student?.firstName || ''} ${followUpItem.lastName || followUpItem.student?.lastName || ''}`.trim(), followUpItem.applicationNumber)} className="px-5 py-2 text-[10px] font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all cursor-pointer">Create</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isRejectModalOpen && appToReject && (

                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-rose-600 text-[20px]">cancel</span>
                                <h2 className="text-[14px] font-black uppercase tracking-wider text-slate-800">
                                    Reject Application
                                </h2>
                            </div>
                            <button
                                onClick={() => { setIsRejectModalOpen(false); setAppToReject(null); setRejectionReason(""); }}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-[11px] font-bold text-slate-600">
                                Please provide the reason for rejecting {appToReject.firstName || appToReject.student?.firstName || ''} {appToReject.lastName || appToReject.student?.lastName || ''}'s application. This reason will be emailed to the student.
                            </p>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 ml-1">
                                    Rejection Reason *
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Enter detailed reason (e.g. CIBIL score too low, missing income proof, invalid academic certifications)..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-slate-900 resize-none"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                            <button
                                onClick={() => { setIsRejectModalOpen(false); setAppToReject(null); setRejectionReason(""); }}
                                className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmRejection}
                                disabled={!rejectionReason.trim()}
                                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-rose-600/10"
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            

            <AnimatePresence>
                {activeDockApp && (
                    <motion.div
                        initial={{ y: 120, x: "-50%", opacity: 0 }}
                        animate={{ y: 0, x: "-50%", opacity: 1 }}
                        exit={{ y: 120, x: "-50%", opacity: 0 }}
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        className="fixed bottom-8 left-1/2 z-50 w-full max-w-5xl bg-white/95 backdrop-blur-md border border-slate-100 rounded-[28px] shadow-[0_24px_60px_rgba(15,23,42,0.12)] px-8 py-5 flex items-center justify-between gap-8 font-sans"
                    >
                        {/* Info Section */}
                        <div className="shrink-0">
                            {/* <span className="text-[10px] font-black uppercase tracking-widest text-[#6605c7] block">Processing Lead</span> */}
                            <h4 className="text-[16px] font-black text-slate-800 tracking-tight mt-0.5">
                                {activeDockApp.firstName || activeDockApp.student?.firstName || '—'} {activeDockApp.lastName || activeDockApp.student?.lastName || ''}
                            </h4>
                            <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                                {(activeDockApp.applicationNumber && (activeDockApp.applicationNumber.startsWith('VTU-APP-') || activeDockApp.applicationNumber.startsWith('VTU-BNK-') || activeDockApp.applicationNumber.startsWith('VL-APP-'))) ? activeDockApp.applicationNumber : ''}
                            </span>
                        </div>

                        {/* View Profile */}
                        <button
                            onClick={() => router.push(`/staff/applications/${activeDockApp.id || activeDockApp._id}`)}
                            className="shrink-0 h-11 px-5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-wider text-slate-700 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[16px] text-slate-500">visibility</span>
                            View Application
                        </button>

                        {/* Select Target Banks: Pills style */}
                        {/* <div className="flex-1 flex flex-col gap-1 min-w-0">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Select Target Banks</span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {bankOptions.map((bankName: string) => {
                                    const currentBanks = activeDockApp.bank && activeDockApp.bank.toLowerCase().replace(/\s+/g, '') !== 'pendingpartner' ? activeDockApp.bank.split(', ').filter(Boolean) : [];
                                    const isChecked = currentBanks.includes(bankName);
                                    return (
                                        <button
                                            key={bankName}
                                            onClick={async () => {
                                                if (!isChecked && currentBanks.length >= 3) {
                                                    alert("You can select a maximum of 3 target banks.");
                                                    return;
                                                }
                                                const updated = isChecked
                                                    ? currentBanks.filter((b: string) => b !== bankName)
                                                    : [...currentBanks, bankName];
                                                const updateVal = updated.length > 0 ? updated.join(', ') : 'ANY BANK';
                                                try {
                                                    await adminApi.updateApplication(activeDockApp.id || activeDockApp._id, { bank: updateVal });
                                                    // Update locally in dataset
                                                    setData((prev: any[]) => prev.map(d => (d.id || d._id) === (activeDockApp.id || activeDockApp._id) ? { ...d, bank: updateVal } : d));
                                                    // Update currently active dock app state
                                                    setActiveDockApp((prev: any) => prev ? { ...prev, bank: updateVal } : null);
                                                } catch (err) {
                                                    alert("Failed to update target banks");
                                                }
                                            }}
                                            className={`h-7 px-3.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${isChecked
                                                ? 'bg-[#6605c7] text-white border-[#6605c7] shadow-sm shadow-purple-600/10'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                        >
                                            {bankName.replace(" Finserve", "").replace(" Financial", "").replace(" FIRST Bank", "").replace(" Fincorp", "").replace("HDFC ", "")}
                                        </button>
                                    );
                                })}
                            </div>
                        </div> */}

                        {/* Route / Send Bank button */}
                        <div className="shrink-0 flex items-center gap-3">
                            {/* Approve button: moves application to active pipeline */}
                            <button
                                onClick={() => {
                                    setRoutingApp(activeDockApp);
                                    setIsShareModalOpen(true);
                                }}
                                className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                Approve & Select Bank
                            </button>

                            {/* Close Capsule Button */}
                            <button
                                onClick={() => setActiveDockApp(null)}
                                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all flex items-center justify-center shrink-0"
                                title="Close"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {isShareModalOpen && routingApp && (
                <ShareWithBankModal
                    applicationId={routingApp.id || routingApp._id}
                    applicationNumber={routingApp.applicationNumber || ""}
                    studentName={`${routingApp.firstName || routingApp.student?.firstName || ""} ${routingApp.lastName || routingApp.student?.lastName || ""}`}
                    loanAmount={routingApp.amount || 1500000}
                    isOpen={isShareModalOpen}
                    onClose={() => {
                        setIsShareModalOpen(false);
                        setRoutingApp(null);
                    }}
                    onSuccess={async () => {
                        setIsShareModalOpen(false);
                        setRoutingApp(null);
                        setActiveDockApp(null);
                        await loadData();
                        await fetchBadgeStats();
                    }}
                />
            )}
        </div>
    );
}
