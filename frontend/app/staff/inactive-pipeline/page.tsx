"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useStaffLayout } from "@/app/staff/layout";
import { adminApi, staffProfileApi } from "@/lib/api";
import Link from "next/link";
import ApplicationDetailView from "@/components/staff/ApplicationDetailView";

const IST_OFFSET = 5.5 * 60 * 60 * 1000;

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
            return `${month} ${day}, ${year}`;
        }
    } catch {
        return "—";
    }
};

const TableHeader = ({ children }: { children: React.ReactNode }) => (
    <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[11px] uppercase tracking-wider font-sans font-bold text-left">
        <tr>{children}</tr>
    </thead>
);

export default function InactivePipelinePage() {
    const router = useRouter();
    const { fetchBadgeStats } = useStaffLayout();

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

    const applicationsPerPage = 20;

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {
                limit: "1000",
            };
            const res: any = await adminApi.getApplications(params);
            if (res && res.data) {
                // Filter client-side to only show rejected applications (inactive pipeline)
                const inactiveApps = res.data.filter((app: any) => app.status === "rejected" || app.status === "cancelled");
                setData(inactiveApps);
                setTotalItems(inactiveApps.length);
            } else {
                setData([]);
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

    const handleMoveToIncomingQueue = async (item: any) => {
        const appId = item.id || item._id;
        if (!appId) return;

        if (!confirm(`Are you sure you want to add ${item.firstName || "this student"}'s application back to the incoming queue?`)) {
            return;
        }

        setIsActionLoading(appId);
        try {
            await adminApi.updateApplicationStatus(appId, {
                status: "submitted",
                stage: "application_submitted",
                progress: 15,
                remarks: "Re-added to incoming queue by staff",
            });

            // Log activity
            try {
                await staffProfileApi.logActivity({
                    type: "submitted",
                    msg: `Application #${item.applicationNumber || appId.slice(-6)} moved back to incoming queue`,
                    icon: "move_to_inbox",
                    color: "bg-blue-50 text-blue-700",
                });
            } catch (err) {
                console.error(err);
            }

            alert("Application successfully moved back to incoming queue!");
            await loadData();
            await fetchBadgeStats();
        } catch (e: any) {
            alert(e?.message || "Failed to move application to incoming queue");
        } finally {
            setIsActionLoading(null);
        }
    };

    const filteredData = useMemo(() => {
        return data.filter(item => {
            const fullName = `${item.firstName || item.student?.firstName || ''} ${item.lastName || item.student?.lastName || ''}`.toLowerCase();
            const college = (item.universityName || item.college || '').toLowerCase();
            const query = searchQuery.toLowerCase();
            return fullName.includes(query) || college.includes(query);
        });
    }, [data, searchQuery]);

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
                        Inactive Pipeline
                    </h2>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">Rejected or cancelled channels awaiting review or restore</p>
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
                            placeholder="Search inactive pipeline..."
                            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 w-64 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-[24px] border border-slate-100 overflow-hidden shadow-sm bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <TableHeader>
                            <th className="px-6 py-4">Applicant Profile</th>
                            <th className="px-6 py-4">College Name</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Rejection Reason</th>
                            <th className="px-6 py-4">Timestamp</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </TableHeader>
                        <tbody className={`divide-y divide-slate-50 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
                            {pagedData.length > 0 ? (
                                pagedData.map((item) => {
                                    const rowId = item.id || item._id;
                                    const initials = `${(item.firstName || '?')[0]}${(item.lastName || '')[0] || ''}`;

                                    return (
                                        <tr key={rowId} className="hover:bg-slate-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
                                                        {initials.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-950">
                                                            {item.firstName || "—"} {item.lastName || ""}
                                                        </p>
                                                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                                                            {item.applicationNumber || "Pending"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold text-slate-700 block truncate max-w-[200px]">
                                                    {item.universityName || item.college || "—"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200">
                                                    {item.status || "Rejected"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs text-slate-500 font-medium block truncate max-w-[250px]" title={item.rejectionReason || item.remarks}>
                                                    {item.rejectionReason || item.remarks || "No reason specified"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs text-slate-500 font-semibold">
                                                    {formatIST(item.updatedAt || item.submittedAt, true)}
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
                                                        onClick={() => handleMoveToIncomingQueue(item)}
                                                        disabled={isActionLoading === rowId}
                                                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg transition-all border border-emerald-200 cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-50"
                                                    >
                                                        {isActionLoading === rowId ? (
                                                            <div className="w-3.5 h-3.5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
                                                        ) : (
                                                            <span className="material-symbols-outlined text-[14px]">move_to_inbox</span>
                                                        )}
                                                        Add to Incoming Queue
                                                    </button>
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
                                            <p className="text-[12px] font-black uppercase tracking-widest">No Inactive Applications</p>
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

            {selectedApp && (
                <ApplicationDetailView
                    application={selectedApp}
                    onBack={() => setSelectedApp(null)}
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
