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
    <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[11px] uppercase tracking-wider font-sans font-bold text-left">
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
        draft: 'bg-amber-50 text-amber-700 border border-amber-200',
        pending: 'bg-amber-50 text-amber-700 border border-amber-200',
        submitted: 'bg-blue-50 text-blue-700 border border-blue-200',
        submitted_to_bank: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
        processing: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
        approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        verified: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        rejected: 'bg-rose-50 text-rose-700 border border-rose-200',
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
                    <h2 className="text-2xl font-bold tracking-tight text-[#0A2540]">
                        Active Pipeline
                    </h2>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">Active applications in progress across loan processing & bank review stages</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadData}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
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
                            placeholder="Search active pipeline..."
                            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 w-64 shadow-sm"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold uppercase tracking-wider text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-all shadow-sm"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <div className="rounded-[24px] border border-slate-100 overflow-hidden shadow-sm bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <TableHeader>
                            <th className="px-6 py-4">Applicant Profile</th>
                            <th className="px-6 py-4">College Name</th>
                            <th className="px-6 py-4">Target Bank</th>
                            <th className="px-6 py-4">Stage & Progress</th>
                            <th className="px-6 py-4">Current Status</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </TableHeader>
                        <tbody className={`divide-y divide-slate-50 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
                            {pagedData.length > 0 ? (
                                pagedData.map((item: any) => {
                                    const rowId = item.id || item._id;
                                    const initials = `${(item.firstName || item.student?.firstName || '?')[0]}${(item.lastName || item.student?.lastName || '')[0] || ''}`;
                                    const progress = getApplicationDisplayProgress(item);
                                    const stageLabel = getApplicationStageLabel(item, progress);
                                    const statusKey = (item.status || 'draft').toLowerCase();
                                    const bankName = item.bank || item.targetBank || item.lender || "IDFC FIRST Bank";

                                    return (
                                        <tr key={rowId} className="hover:bg-slate-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
                                                        {initials.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p
                                                            onClick={() => {
                                                                const uid = item.userId || item.user_id || item.student?.id || item.student?._id;
                                                                const email = item.email || item.student?.email;
                                                                if (uid) {
                                                                    window.open(`/staff/users/${uid}${email ? `?email=${encodeURIComponent(email)}` : ''}`, '_blank');
                                                                } else {
                                                                    router.push(`/staff/users?search=${encodeURIComponent(item.firstName || '')}`);
                                                                }
                                                            }}
                                                            className="text-sm font-bold text-slate-950 hover:text-indigo-600 cursor-pointer transition-colors"
                                                            title="Click to view Student Profile"
                                                        >
                                                            {item.firstName || item.student?.firstName || "—"} {item.lastName || item.student?.lastName || ""}
                                                        </p>
                                                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                                                            {item.applicationNumber || "Pending"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold text-slate-700 block truncate max-w-[200px]" title={item.universityName || item.college || "—"}>
                                                    {item.universityName || item.college || "—"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {renderBankLogo(bankName, "h-6")}
                                                    <span className="text-xs font-semibold text-slate-700 truncate max-w-[140px]">{bankName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-36 space-y-1">
                                                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                                                        <span>{stageLabel}</span>
                                                        <span className="text-indigo-600 font-bold">{progress}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                        <div className={`h-1.5 rounded-full transition-all duration-700 ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{ width: `${progress}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${statusKey === 'rejected' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                                                        statusKey === 'approved' || statusKey === 'verified' || statusKey === 'disbursed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                                            statusKey === 'processing' || statusKey === 'submitted_to_bank' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' :
                                                                'bg-amber-50 text-amber-600 border border-amber-200'
                                                    }`}>
                                                    {item.status || "Pending"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedApp(item)}
                                                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all border-0 cursor-pointer"
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const appNo = item.applicationNumber || `APP-${(item.id || item._id || 'UNKNOWN').slice(-6)}`;
                                                            router.push(`/staff/chat-customer?bankName=${encodeURIComponent(bankName)}&applicationId=${item.id || item._id}&applicationNumber=${encodeURIComponent(appNo)}`);
                                                        }}
                                                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-all border border-indigo-200 cursor-pointer flex items-center gap-1"
                                                        title={`Chat with ${bankName}`}
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">forum</span>
                                                        Chat with Bank
                                                    </button>
                                                    {(item.email || item.student?.email) && (
                                                        <button
                                                            onClick={() => {
                                                                const email = item.email || item.student?.email;
                                                                const name = `${item.firstName || item.student?.firstName || ''} ${item.lastName || item.student?.lastName || ''}`.trim();
                                                                openEmailModal(email, name);
                                                            }}
                                                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg transition-all border border-emerald-200 cursor-pointer flex items-center gap-1"
                                                            title="Send email to student"
                                                        >
                                                            <span className="material-symbols-outlined text-[14px]">mail</span>
                                                            Email
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4 text-slate-400">
                                            <span className="material-symbols-outlined text-5xl">inventory_2</span>
                                            <p className="text-[12px] font-black uppercase tracking-widest">No Active Applications Found</p>
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
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                                Previous
                            </button>
                            <button
                                disabled={currentPage >= totalPages || loading}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
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
