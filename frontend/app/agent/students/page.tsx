"use client";

import React, { useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAgent } from "../AgentContext";

export default function AgentStudentsList() {
    const router = useRouter();
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const {
        applications,
        totalLeadCount,
        studentsPage, setStudentsPage,
        studentsLoading,
        studentSearch, setStudentSearch,
        studentStatusFilter, setStudentStatusFilter,
        studentLoanTypeFilter, setStudentLoanTypeFilter,
        docUploadState, setDocUploadState,
        setAutoStartUser,
        downloadCSV, showToast,
        loadStudents,
    } = useAgent();

    // On filter/search change, trigger server-side load with debounce for search
    const triggerLoad = useCallback((search: string, status: string, loanType: string, page: number) => {
        loadStudents(
            search || undefined,
            status !== "All" ? status.toLowerCase() : undefined,
            loanType !== "All" ? loanType : undefined,
            page
        );
    }, [loadStudents]);

    // Debounce on search text change
    useEffect(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            triggerLoad(studentSearch, studentStatusFilter, studentLoanTypeFilter, 1);
            setStudentsPage(1);
        }, 400);
        return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentSearch]);

    // Immediate load on status/type filter change
    useEffect(() => {
        triggerLoad(studentSearch, studentStatusFilter, studentLoanTypeFilter, 1);
        setStudentsPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentStatusFilter, studentLoanTypeFilter]);

    const handlePageChange = (newPage: number) => {
        triggerLoad(studentSearch, studentStatusFilter, studentLoanTypeFilter, newPage);
    };

    const ITEMS_PER_PAGE = 20;
    const totalPages = Math.max(1, Math.ceil(totalLeadCount / ITEMS_PER_PAGE));

    // Local filtering on top of whatever is returned from API (for instant UI response)
    const filteredApps = useMemo(() => {
        if (!studentSearch) return applications;
        const q = studentSearch.toLowerCase();
        return applications.filter(app =>
            app.firstName.toLowerCase().includes(q) ||
            app.lastName.toLowerCase().includes(q) ||
            app.email.toLowerCase().includes(q) ||
            app.applicationNumber.toLowerCase().includes(q) ||
            app.collegeName.toLowerCase().includes(q)
        );
    }, [applications, studentSearch]);

    const statusColors: Record<string, string> = {
        pending: "bg-amber-50 text-amber-700 border-amber-100",
        processing: "bg-blue-50 text-blue-700 border-blue-100",
        submitted: "bg-blue-50 text-blue-700 border-blue-100",
        approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
        disbursed: "bg-purple-50 text-purple-700 border-purple-100",
        rejected: "bg-red-50 text-red-700 border-red-100",
        query_raised: "bg-orange-50 text-orange-700 border-orange-100",
        document_rejected: "bg-red-50 text-red-700 border-red-100",
    };

    return (
        <div className="animate-fade-in-up space-y-8 relative z-10">

            {/* Filters and Search row */}
            <section className="p-8 rounded-[2.5rem] bg-white border border-[#6605c7]/10 shadow-sm space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="relative sm:col-span-2">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#6605c7]/40 text-xl">search</span>
                        <input
                            type="text"
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            placeholder="Search name, email, ref number, college..."
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-800 focus:outline-none focus:bg-white transition-all"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">Pipeline Status</label>
                        <select
                            value={studentStatusFilter}
                            onChange={(e) => setStudentStatusFilter(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none"
                        >
                            <option>All</option>
                            <option>Pending</option>
                            <option>Processing</option>
                            <option>Submitted</option>
                            <option>Approved</option>
                            <option>Disbursed</option>
                            <option>Rejected</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">Loan Destination</label>
                        <select
                            value={studentLoanTypeFilter}
                            onChange={(e) => setStudentLoanTypeFilter(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none"
                        >
                            <option>All</option>
                            <option>Abroad</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
                    <div className="flex gap-2 text-[10px]">
                        <button
                            onClick={() => { setStudentStatusFilter("All"); setStudentLoanTypeFilter("All"); setStudentSearch(""); }}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg font-bold transition-colors"
                        >
                            Reset Filters
                        </button>
                        <button
                            onClick={() => downloadCSV()}
                            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#6605c7] rounded-lg font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">export_notes</span> Export CSV
                        </button>
                    </div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {studentsLoading ? (
                            <span className="flex items-center gap-2 text-[#6605c7]">
                                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                Loading...
                            </span>
                        ) : `Showing ${filteredApps.length} of ${totalLeadCount} lead records`}
                    </div>
                </div>
            </section>

            {/* Lead list table */}
            <section className="overflow-x-auto pb-4 custom-scrollbar">
                <table className="w-full border-separate border-spacing-y-4">
                    <thead>
                        <tr>
                            <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]/40 text-left border-b border-[#6605c7]/5">Student Name</th>
                            <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]/40 text-left border-b border-[#6605c7]/5">Course & College</th>
                            <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]/40 text-left border-b border-[#6605c7]/5">Loan Amount</th>
                            <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]/40 text-left border-b border-[#6605c7]/5">Status</th>
                            <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]/40 text-left border-b border-[#6605c7]/5">Bank Partner</th>
                            <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]/40 text-left border-b border-[#6605c7]/5">Commission</th>
                            <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.3em] text-[#6605c7]/40 text-right border-b border-[#6605c7]/5">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {studentsLoading && filteredApps.length === 0 ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-8 py-6 bg-gray-50 rounded-l-[2rem]"><div className="h-4 bg-gray-200 rounded w-3/4" /></td>
                                    <td className="px-8 py-6 bg-gray-50"><div className="h-4 bg-gray-200 rounded w-2/3" /></td>
                                    <td className="px-8 py-6 bg-gray-50"><div className="h-4 bg-gray-200 rounded w-1/2" /></td>
                                    <td className="px-8 py-6 bg-gray-50"><div className="h-4 bg-gray-200 rounded w-1/3" /></td>
                                    <td className="px-8 py-6 bg-gray-50"><div className="h-4 bg-gray-200 rounded w-1/2" /></td>
                                    <td className="px-8 py-6 bg-gray-50"><div className="h-4 bg-gray-200 rounded w-1/3" /></td>
                                    <td className="px-8 py-6 bg-gray-50 rounded-r-[2rem]"><div className="h-4 bg-gray-200 rounded w-full" /></td>
                                </tr>
                            ))
                        ) : filteredApps.length > 0 ? filteredApps.map((app, idx) => (
                            <tr key={app.id || idx} className="group hover:-translate-y-1 transition-all duration-300">
                                <td className="px-8 py-6 bg-white group-hover:bg-[#fcfaff] rounded-l-[2rem] border-y border-l border-gray-100 group-hover:border-[#6605c7]/20 transition-all">
                                    <div className="flex flex-col">
                                        <button
                                            onClick={() => router.push(`/agent/students/${app.id}`)}
                                            className="text-sm font-black text-gray-900 group-hover:text-[#6605c7] text-left hover:underline transition-colors"
                                        >
                                            {app.firstName} {app.lastName}
                                        </button>
                                        <span className="text-[10px] text-gray-400 mt-0.5 font-mono">{app.applicationNumber}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 bg-white group-hover:bg-[#fcfaff] border-y border-transparent group-hover:border-[#6605c7]/20 transition-all text-xs">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-800">{app.courseName || "—"}</span>
                                        <span className="text-gray-400">{app.collegeName || "—"}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 bg-white group-hover:bg-[#fcfaff] border-y border-transparent group-hover:border-[#6605c7]/20 transition-all font-black text-gray-900 text-sm tracking-tight font-mono">
                                    ₹{app.amount.toLocaleString()}
                                </td>
                                <td className="px-8 py-6 bg-white group-hover:bg-[#fcfaff] border-y border-transparent group-hover:border-[#6605c7]/20 transition-all">
                                    <span className={`inline-flex px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColors[app.status] || "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                        {app.status.replace(/_/g, " ")}
                                    </span>
                                </td>
                                <td className="px-8 py-6 bg-white group-hover:bg-[#fcfaff] border-y border-transparent group-hover:border-[#6605c7]/20 transition-all text-xs font-bold text-gray-600">
                                    {app.bank || "—"}
                                </td>
                                <td className="px-8 py-6 bg-white group-hover:bg-[#fcfaff] border-y border-transparent group-hover:border-[#6605c7]/20 transition-all text-xs">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-[#6605c7]">₹{app.projectedCommission.toLocaleString()}</span>
                                        <span className="text-[9px] text-gray-400">({app.commissionRate}% cut)</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 bg-white group-hover:bg-[#fcfaff] rounded-r-[2rem] border-y border-r border-gray-100 group-hover:border-[#6605c7]/20 transition-all text-right">
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => { setDocUploadState({ ...docUploadState, studentId: app.id }); router.push(`/agent/students/${app.id}#documents`); }}
                                            className="w-9 h-9 bg-gray-50 hover:bg-[#6605c7]/5 hover:text-[#6605c7] text-gray-500 rounded-xl flex items-center justify-center transition-all"
                                            title="Upload Documents"
                                        >
                                            <span className="material-symbols-outlined text-lg">upload</span>
                                        </button>
                                        <button
                                            onClick={() => showToast(`Doc chase WhatsApp reminder sent to ${app.firstName}`, "success")}
                                            className="w-9 h-9 bg-gray-50 hover:bg-[#6605c7]/5 hover:text-[#6605c7] text-gray-500 rounded-xl flex items-center justify-center transition-all"
                                            title="WhatsApp Reminder"
                                        >
                                            <span className="material-symbols-outlined text-lg">message</span>
                                        </button>
                                        <button
                                            onClick={() => { setAutoStartUser({ id: app.id, email: app.email, firstName: app.firstName, lastName: app.lastName }); router.push("/agent/chat-student"); }}
                                            className="w-9 h-9 bg-[#6605c7] hover:scale-105 text-white rounded-xl flex items-center justify-center transition-all"
                                            title="Connect Chat"
                                        >
                                            <span className="material-symbols-outlined text-lg">chat</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={7} className="px-8 py-32 text-center bg-white rounded-[2rem] border border-gray-100">
                                    <div className="flex flex-col items-center justify-center opacity-30">
                                        <span className="material-symbols-outlined text-7xl mb-4">search_off</span>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">No leads matching criteria</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 pb-8">
                    <p className="text-xs text-gray-500 font-bold">
                        Page {studentsPage} of {totalPages} ({totalLeadCount} total)
                    </p>
                    <div className="flex gap-2">
                        <button
                            disabled={studentsPage <= 1 || studentsLoading}
                            onClick={() => handlePageChange(studentsPage - 1)}
                            className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-600 hover:border-[#6605c7]/30 hover:text-[#6605c7] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            ← Prev
                        </button>
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            const page = studentsPage <= 3 ? i + 1 : studentsPage - 2 + i;
                            if (page > totalPages) return null;
                            return (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                                        page === studentsPage
                                            ? "bg-[#6605c7] text-white shadow-md"
                                            : "bg-white border border-gray-200 text-gray-600 hover:border-[#6605c7]/30 hover:text-[#6605c7]"
                                    }`}
                                >
                                    {page}
                                </button>
                            );
                        })}
                        <button
                            disabled={studentsPage >= totalPages || studentsLoading}
                            onClick={() => handlePageChange(studentsPage + 1)}
                            className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-600 hover:border-[#6605c7]/30 hover:text-[#6605c7] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
