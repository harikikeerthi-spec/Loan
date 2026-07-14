"use client";

import React, { useState, useEffect } from "react";

interface AdminStats {
    totalReferrals: number;
    totalPaidOut: number;
    pendingPayoutCount: number;
}

interface ReferralItem {
    id: string;
    referrerId: string;
    referrerName: string;
    referrerEmail: string;
    referrerPhone: string;
    refereeEmail: string;
    refereeName: string;
    refereePhone: string;
    status: string;
    reward: string | null;
    createdAt: string;
    completedAt: string | null;
}

interface AdminReferralsClientProps {
    initialStats: AdminStats;
    initialReferrals: ReferralItem[];
    token: string;
}

export default function AdminReferralsClient({ initialStats, initialReferrals, token }: AdminReferralsClientProps) {
    const [stats, setStats] = useState<AdminStats>(initialStats);
    const [referrals, setReferrals] = useState<ReferralItem[]>(initialReferrals);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [pendingPayoutFilter, setPendingPayoutFilter] = useState(false);
    
    // Modal states
    const [overrideItem, setOverrideItem] = useState<ReferralItem | null>(null);
    const [newStatus, setNewStatus] = useState("");
    const [overrideReason, setOverrideReason] = useState("");
    const [submittingOverride, setSubmittingOverride] = useState(false);
    const [overrideError, setOverrideError] = useState("");

    // Fetch filtered list
    const fetchList = async (search = searchTerm, status = statusFilter, pending = pendingPayoutFilter) => {
        try {
            const params = new URLSearchParams();
            if (status !== "all") params.set("status", status);
            if (search) params.set("search", search);
            if (pending) params.set("pendingPayout", "true");
            
            const res = await fetch(`/api/referral/admin/list?${params.toString()}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setReferrals(data.referrals || []);
            }
        } catch (err) {
            console.error("Failed to fetch filtered list:", err);
        }
    };

    // Fetch stats
    const fetchStats = async () => {
        try {
            const res = await fetch("/api/referral/admin/stats", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
            }
        } catch (err) {
            console.error("Failed to fetch stats:", err);
        }
    };

    // Handle search change with simple debouncing/effect
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchList(searchTerm, statusFilter, pendingPayoutFilter);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, statusFilter, pendingPayoutFilter]);

    // Handle override submit
    const handleOverrideSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!overrideItem || !newStatus) return;
        setSubmittingOverride(true);
        setOverrideError("");

        try {
            const res = await fetch(`/api/referral/admin/override/${overrideItem.id}`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: newStatus,
                    reason: overrideReason
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Failed to update status");
            }

            // Close modal & reset
            setOverrideItem(null);
            setNewStatus("");
            setOverrideReason("");
            
            // Refresh dashboard
            await Promise.all([fetchStats(), fetchList()]);
        } catch (err: any) {
            setOverrideError(err.message || "An error occurred");
        } finally {
            setSubmittingOverride(false);
        }
    };

    // CSV Export
    const handleCSVExport = () => {
        const headers = ["referralId", "referrerName", "referrerPhone", "refereeEmail", "refereePhone", "status", "reward", "dateJoined"];
        const rows = referrals.map(r => [
            r.id,
            r.referrerName,
            r.referrerPhone,
            r.refereeEmail,
            r.refereePhone,
            r.status,
            r.reward || "—",
            new Date(r.createdAt).toISOString()
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `referrals_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-[#070415] text-white pt-24 pb-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold font-display">Referral Administration</h1>
                        <p className="text-sm text-purple-300">View performance metrics and manage rewards/payouts.</p>
                    </div>
                    <button
                        onClick={handleCSVExport}
                        className="py-3 px-6 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-900/20 active:scale-95"
                    >
                        <span className="material-symbols-outlined text-lg">download</span>
                        Export Filtered to CSV
                    </button>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#120e32] border border-purple-900/30 rounded-2xl p-6 shadow-md">
                        <div className="text-xs text-purple-400 font-semibold uppercase tracking-wider">Total Referrals</div>
                        <div className="mt-4 text-4xl font-extrabold">{stats.totalReferrals}</div>
                        <div className="mt-2 text-xs text-purple-300">Across all user accounts</div>
                    </div>
                    <div className="bg-[#120e32] border border-purple-900/30 rounded-2xl p-6 shadow-md">
                        <div className="text-xs text-purple-400 font-semibold uppercase tracking-wider">Pending Payouts (rewarded)</div>
                        <div className="mt-4 text-4xl font-extrabold text-[#ffd700]">{stats.pendingPayoutCount}</div>
                        <div className="mt-2 text-xs text-purple-300">Requires manual disbursement confirmation</div>
                    </div>
                    <div className="bg-[#120e32] border border-purple-900/30 rounded-2xl p-6 shadow-md">
                        <div className="text-xs text-purple-400 font-semibold uppercase tracking-wider">Total Paid Out</div>
                        <div className="mt-4 text-4xl font-extrabold text-green-400">₹{stats.totalPaidOut.toLocaleString('en-IN')}</div>
                        <div className="mt-2 text-xs text-purple-300">Completed & paid referral payouts</div>
                    </div>
                </div>

                {/* Filter and Table Card */}
                <div className="bg-[#120e32] border border-purple-900/30 rounded-2xl overflow-hidden shadow-lg">
                    
                    {/* Controls Bar */}
                    <div className="p-6 border-b border-purple-900/30 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:max-w-md">
                            <span className="absolute left-3 top-3.5 material-symbols-outlined text-purple-400 text-sm">search</span>
                            <input
                                type="text"
                                placeholder="Search by referrer name, phone or referee email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[#0a051b] border border-purple-900/50 focus:border-purple-500 rounded-xl pl-10 pr-4 py-3 text-purple-200 outline-none text-sm transition-all"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-purple-400 uppercase font-semibold">Status:</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-[#0a051b] border border-purple-900/50 text-purple-200 rounded-xl px-3 py-2 text-sm outline-none cursor-pointer focus:border-purple-500"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="signed_up">Joined</option>
                                    <option value="rewarded">Pending Payout (rewarded)</option>
                                    <option value="completed">Paid Out (completed)</option>
                                    <option value="paid">Paid Out (paid)</option>
                                </select>
                            </div>

                            <button
                                onClick={() => setPendingPayoutFilter(!pendingPayoutFilter)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                    pendingPayoutFilter 
                                        ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                                        : "bg-purple-900/10 border-purple-900/30 text-purple-300 hover:border-purple-500/30"
                                }`}
                            >
                                Needs Payout Action
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    {referrals.length === 0 ? (
                        <div className="p-12 text-center text-purple-400/80">
                            <span className="material-symbols-outlined text-5xl mb-3 block">search_off</span>
                            No matching referrals found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#0a051b] border-b border-purple-900/30 text-purple-400 text-xs font-semibold uppercase tracking-wider">
                                        <th className="px-6 py-4">Referrer (User)</th>
                                        <th className="px-6 py-4">Referee (Friend)</th>
                                        <th className="px-6 py-4">Status & Reward</th>
                                        <th className="px-6 py-4">Date Logged</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-purple-900/20">
                                    {referrals.map((r) => (
                                        <tr key={r.id} className="hover:bg-[#181240]/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-white">{r.referrerName}</div>
                                                <div className="text-xs text-purple-400">{r.referrerEmail}</div>
                                                <div className="text-xs text-purple-400">{r.referrerPhone}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-white">{r.refereeName}</div>
                                                <div className="text-xs text-purple-400">{r.refereeEmail}</div>
                                                <div className="text-xs text-purple-400">{r.refereePhone}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                        r.status === "rewarded"
                                                            ? "bg-green-500/10 border-green-500/30 text-green-400"
                                                            : r.status === "completed" || r.status === "paid"
                                                            ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                                                            : r.status === "signed_up"
                                                            ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                                                            : "bg-gray-500/10 border-gray-500/30 text-gray-400"
                                                    }`}>
                                                        {r.status === "rewarded" ? "Pending Payout" :
                                                         r.status === "completed" || r.status === "paid" ? "Paid Out" :
                                                         r.status === "signed_up" ? "Joined" : "Pending"}
                                                    </span>
                                                    {r.reward && <span className="text-[#ffd700] text-xs font-extrabold">{r.reward}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-purple-300 text-sm">
                                                {new Date(r.createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <select
                                                    value={r.status}
                                                    onChange={(e) => {
                                                        setOverrideItem(r);
                                                        setNewStatus(e.target.value);
                                                    }}
                                                    className="bg-[#0a051b] border border-purple-900/50 text-purple-200 rounded-lg px-2.5 py-1 text-xs outline-none cursor-pointer focus:border-purple-500"
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="signed_up">Joined</option>
                                                    <option value="rewarded">Pending Payout (rewarded)</option>
                                                    <option value="completed">Paid Out (completed)</option>
                                                    <option value="paid">Paid Out (paid)</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Audit Reason Dialog Modal */}
                {overrideItem && (
                    <div className="fixed inset-0 bg-[#000]/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                        <div className="bg-[#120e32] border border-purple-900/40 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
                            <div className="flex justify-between items-center border-b border-purple-900/20 pb-4">
                                <h3 className="text-lg font-bold">Override Referral Status</h3>
                                <button 
                                    onClick={() => setOverrideItem(null)}
                                    className="text-purple-400 hover:text-white"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <form onSubmit={handleOverrideSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs text-purple-400 uppercase font-semibold">User Referee</label>
                                    <div className="text-sm font-semibold text-white mt-1">{overrideItem.refereeEmail}</div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-purple-400 uppercase font-semibold">Current Status</label>
                                        <div className="text-sm text-purple-300 mt-1 capitalize">{overrideItem.status}</div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-purple-400 uppercase font-semibold">Target Status</label>
                                        <div className="text-sm text-[#ffd700] mt-1 capitalize font-semibold">{newStatus}</div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs text-purple-400 uppercase font-semibold">Reason for Override (Required)</label>
                                    <textarea
                                        required
                                        rows={3}
                                        placeholder="Explain why this status is being changed manually (for audit trail)..."
                                        value={overrideReason}
                                        onChange={(e) => setOverrideReason(e.target.value)}
                                        className="w-full bg-[#0a051b] border border-purple-900/50 focus:border-purple-500 rounded-xl px-3 py-2 text-purple-200 outline-none text-sm transition-all"
                                    />
                                </div>

                                {overrideError && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs">
                                        {overrideError}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setOverrideItem(null)}
                                        className="flex-1 py-3 bg-purple-950/40 border border-purple-500/20 text-purple-200 font-bold rounded-xl hover:bg-purple-950/60 transition-all text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingOverride}
                                        className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-1 active:scale-95"
                                    >
                                        {submittingOverride ? (
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : "Confirm Override"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
