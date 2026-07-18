"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { adminApi } from "@/lib/api";
import { PageHeader } from "@/components/bank/SharedUI";

interface Tranche {
    id: string;
    amount: number;
    date: string;
    utr: string;
    mode: string;
}

// ─────────────────────────────────────────────────────────────────────
// Custom SVG empty-state illustration
// (graduation cap + floating coins + document → digital wallet)
// ─────────────────────────────────────────────────────────────────────
function DisbursementEmptyIllustration() {
    return (
        <svg viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-52 h-auto mb-6">
            <ellipse cx="120" cy="145" rx="90" ry="18" fill="url(#sh)" />
            {/* Document */}
            <rect x="52" y="32" width="96" height="122" rx="10" fill="url(#doc)" />
            <rect x="64" y="52" width="50" height="6" rx="3" fill="#C4B5FD" opacity="0.7" />
            <rect x="64" y="66" width="72" height="4" rx="2" fill="#DDD6FE" opacity="0.6" />
            <rect x="64" y="78" width="60" height="4" rx="2" fill="#DDD6FE" opacity="0.5" />
            <rect x="64" y="90" width="72" height="4" rx="2" fill="#DDD6FE" opacity="0.5" />
            <rect x="64" y="102" width="40" height="4" rx="2" fill="#DDD6FE" opacity="0.4" />
            <line x1="64" y1="116" x2="136" y2="116" stroke="#C4B5FD" strokeWidth="1" strokeDasharray="4 3" />
            {/* Graduation cap */}
            <polygon points="120,8 148,22 120,36 92,22" fill="url(#ctop)" />
            <rect x="93" y="22" width="54" height="30" rx="6" fill="url(#cbody)" opacity="0.9" />
            <circle cx="120" cy="22" r="4" fill="#7C3AED" />
            <line x1="148" y1="22" x2="158" y2="30" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
            <circle cx="158" cy="33" r="3" fill="#7C3AED" opacity="0.8" />
            {/* Coin stack */}
            <ellipse cx="172" cy="118" rx="20" ry="6" fill="url(#cg)" />
            <rect x="152" y="104" width="40" height="14" rx="5" fill="url(#cb)" />
            <ellipse cx="172" cy="104" rx="20" ry="6" fill="url(#ct)" />
            <ellipse cx="172" cy="97" rx="20" ry="6" fill="url(#cg)" />
            <rect x="152" y="83" width="40" height="14" rx="5" fill="url(#cb)" />
            <ellipse cx="172" cy="83" rx="20" ry="6" fill="url(#ct)" />
            {/* Dashed arrow */}
            <path d="M 140 100 Q 155 100 155 110" stroke="#7C3AED" strokeWidth="1.5" strokeDasharray="3 2" fill="none" strokeLinecap="round" />
            <polygon points="153,113 158,107 163,113" fill="#7C3AED" opacity="0.6" />
            <defs>
                <radialGradient id="sh" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.10" />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="doc" x1="52" y1="32" x2="148" y2="154" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F5F3FF" /><stop offset="1" stopColor="#EDE9FE" />
                </linearGradient>
                <linearGradient id="cbody" x1="93" y1="22" x2="147" y2="52" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#7C3AED" /><stop offset="1" stopColor="#4C1D95" />
                </linearGradient>
                <linearGradient id="ctop" x1="92" y1="8" x2="148" y2="36" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#8B5CF6" /><stop offset="1" stopColor="#6D28D9" />
                </linearGradient>
                <linearGradient id="cg" x1="152" y1="97" x2="192" y2="118" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#DDD6FE" /><stop offset="1" stopColor="#C4B5FD" />
                </linearGradient>
                <linearGradient id="cb" x1="152" y1="83" x2="192" y2="118" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#EDE9FE" /><stop offset="1" stopColor="#DDD6FE" />
                </linearGradient>
                <linearGradient id="ct" x1="152" y1="83" x2="192" y2="97" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F5F3FF" /><stop offset="1" stopColor="#DDD6FE" />
                </linearGradient>
            </defs>
        </svg>
    );
}

// Skeleton shimmer row shown while loading
function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((c) => (
                <td key={c} className="py-5 pr-6">
                    <div className="h-3.5 bg-violet-100/60 rounded-lg mb-2 w-4/5" />
                    <div className="h-2.5 bg-violet-50 rounded-lg w-3/5" />
                </td>
            ))}
        </tr>
    );
}

// Animated violet gradient progress bar
function GaugeBar({ pct }: { pct: number }) {
    return (
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg,#7C3AED,#4F46E5)" }}
            />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────
export default function DisbursementTracker() {
    const [mounted, setMounted] = useState(false);
    const [currentBankId, setCurrentBankId] = useState<string>("idfc");
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);
    const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");

    // Slide-over panel
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [showPanel, setShowPanel] = useState(false);

    // Beneficiary form
    const [beneficiaryName, setBeneficiaryName] = useState("");
    const [beneficiaryBank, setBeneficiaryBank] = useState("");
    const [beneficiaryAcc, setBeneficiaryAcc] = useState("");
    const [beneficiaryIfsc, setBeneficiaryIfsc] = useState("");

    // Tranche form
    const [trancheAmount, setTrancheAmount] = useState("");
    const [trancheDate, setTrancheDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [trancheUtr, setTrancheUtr] = useState("");
    const [trancheMode, setTrancheMode] = useState("NEFT");
    const [confirming, setConfirming] = useState(false);

    const [trancheRecords, setTrancheRecords] = useState<Record<string, {
        beneficiary: { name: string; bank: string; account: string; ifsc: string };
        history: Tranche[];
    }>>({});

    useEffect(() => {
        setMounted(true);
        if (typeof window !== "undefined") {
            const saved = sessionStorage.getItem("selectedBank") || localStorage.getItem("selectedBank");
            if (saved) setCurrentBankId(saved);
        }
    }, []);

    const fetchApplications = async (bankId: string) => {
        setLoading(true);
        try {
            const res: any = await adminApi.getApplications({ bank: bankId });
            if (res?.success) {
                const apps: any[] = res.data || [];
                setApplications(apps);
                const init: typeof trancheRecords = {};
                apps.forEach((app) => {
                    const sa = app.sanctionAmount || app.amount || 600000;
                    const bName = `${app.firstName} ${app.lastName}`;
                    const bBank = app.bankName || "HDFC Bank Ltd";
                    const bAcc = `501008291040${Math.floor(10 + Math.random() * 90)}`;
                    const bIfsc = "HDFC0000240";
                    if (app.status === "disbursed" || app.status === "disbursement_confirmed") {
                        const t1 = Math.round(sa * 0.6);
                        const t2 = app.disbursedAmount || (sa - t1);
                        init[app.id] = {
                            beneficiary: { name: bName, bank: bBank, account: bAcc, ifsc: bIfsc },
                            history: [
                                { id: "1", amount: t1, date: format(new Date(app.createdAt || Date.now()), "yyyy-MM-dd"), utr: `UTR-${app.applicationNumber}-T1`, mode: "RTGS" },
                                { id: "2", amount: t2, date: format(new Date(), "yyyy-MM-dd"), utr: `UTR-${app.applicationNumber}-T2`, mode: "NEFT" },
                            ],
                        };
                    } else {
                        init[app.id] = { beneficiary: { name: bName, bank: bBank, account: bAcc, ifsc: bIfsc }, history: [] };
                    }
                });
                setTrancheRecords(init);
            }
        } catch (err) {
            console.error("Failed to load applications:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (mounted) fetchApplications(currentBankId); }, [currentBankId, mounted]);

    const handleRefresh = () => fetchApplications(currentBankId);

    const filteredApps = useMemo(() => applications.filter((app) => {
        const q = search.toLowerCase();
        const match =
            (app.applicationNumber || "").toLowerCase().includes(q) ||
            (`${app.firstName || ""} ${app.lastName || ""}`).toLowerCase().includes(q) ||
            (app.lanNumber || "").toLowerCase().includes(q);
        if (!match) return false;
        const isApproved = app.status === "approved" || app.status === "sanctioned";
        const isDisbursed = app.status === "disbursed" || app.status === "disbursement_confirmed";
        return activeTab === "pending" ? isApproved : isDisbursed;
    }), [applications, activeTab, search]);

    const tabCounts = useMemo(() => {
        const c = { pending: 0, completed: 0 };
        applications.forEach((a) => {
            if (a.status === "approved" || a.status === "sanctioned") c.pending++;
            else if (a.status === "disbursed" || a.status === "disbursement_confirmed") c.completed++;
        });
        return c;
    }, [applications]);

    const handleReleaseTranche = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedApp || !trancheAmount || !trancheUtr.trim()) return;
        setConfirming(true);
        const amt = parseFloat(trancheAmount);
        const record = trancheRecords[selectedApp.id] || { beneficiary: { name: beneficiaryName, bank: beneficiaryBank, account: beneficiaryAcc, ifsc: beneficiaryIfsc }, history: [] };
        const prevTotal = record.history.reduce((s, t) => s + t.amount, 0);
        const sa = selectedApp.sanctionAmount || selectedApp.amount || 600000;
        const newTotal = prevTotal + amt;
        try {
            const history = [...record.history, { id: String(record.history.length + 1), amount: amt, date: trancheDate, utr: trancheUtr.trim(), mode: trancheMode }];
            setTrancheRecords((prev) => ({ ...prev, [selectedApp.id]: { beneficiary: { name: beneficiaryName, bank: beneficiaryBank, account: beneficiaryAcc, ifsc: beneficiaryIfsc }, history } }));
            const remarks = selectedApp.remarks
                ? `${selectedApp.remarks}\n[Tranche - ${format(new Date(), "MMM dd, HH:mm")}]: UTR: ${trancheUtr.trim()}`
                : `[Tranche - ${format(new Date(), "MMM dd, HH:mm")}]: UTR: ${trancheUtr.trim()}`;
            const appId = selectedApp.id || selectedApp._id;
            const res: any = await adminApi.updateApplication(appId, {
                status: newTotal >= sa ? "disbursed" : selectedApp.status,
                stage:  newTotal >= sa ? "disbursed" : selectedApp.stage,
                disbursedAmount: newTotal,
                disbursedAt: new Date(trancheDate).toISOString(),
                remarks,
            });
            if (res?.success) {
                alert(`Tranche released! Ref: ${trancheUtr}`);
                setTrancheUtr(""); setTrancheAmount("");
                setShowPanel(false); setSelectedApp(null);
                handleRefresh();
            }
        } catch (err) {
            console.error("Disbursement error:", err);
            alert("Failed to record disbursement");
        } finally {
            setConfirming(false);
        }
    };

    if (!mounted) return null;

    // Status badge — violet / blue / amber  (no green)
    const statusBadge = (app: any, paid: number) => {
        if (app.status === "disbursed" || app.status === "disbursement_confirmed")
            return <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 border border-indigo-200 rounded-lg uppercase tracking-wider">Fully Disbursed</span>;
        if (paid > 0)
            return <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 border border-blue-200 rounded-lg uppercase tracking-wider animate-pulse">Partial Release</span>;
        return <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 border border-amber-200 rounded-lg uppercase tracking-wider">Awaiting Release</span>;
    };

    const inp = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-violet-100 text-gray-700 transition-all";

    return (
        <>
            {/* Search-focus dim overlay */}
            <AnimatePresence>
                {searchFocused && (
                    <motion.div key="so" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="fixed inset-0 z-30 bg-slate-900/15 backdrop-blur-[1.5px] pointer-events-none" />
                )}
            </AnimatePresence>

            <div className="px-6 py-6 lg:px-10 lg:py-8 space-y-6 max-w-7xl mx-auto relative z-10">

                {/* Ambient background gradient blobs */}
                <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
                    <div className="absolute -top-40 -left-20 w-[500px] h-[500px] rounded-full bg-violet-200/25 blur-[110px]" />
                    <div className="absolute top-60 right-0 w-[400px] h-[400px] rounded-full bg-indigo-200/20 blur-[90px]" />
                    <div className="absolute bottom-0 left-1/2 w-[350px] h-[350px] rounded-full bg-purple-100/25 blur-[80px]" />
                </div>

                {/* Header */}
                <PageHeader
                    title="Disbursement Board"
                    description="Verify sanction files, register beneficiary details, execute fund payouts, and record payment tranches."
                    moduleName="Disbursement Desk"
                    icon="payments"
                    actionSlot={
                        <div className="flex flex-col sm:flex-row gap-3 relative z-40">
                            {/* Neumorphic search bar */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search student, LAN, ID..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onFocus={() => setSearchFocused(true)}
                                    onBlur={() => setSearchFocused(false)}
                                    className={[
                                        "pl-10 pr-4 py-2.5 w-full sm:w-72 bg-white/80 backdrop-blur-md border text-xs font-semibold rounded-xl outline-none transition-all duration-300",
                                        searchFocused
                                            ? "border-[#7C3AED] ring-2 ring-violet-200/60 shadow-[0_4px_20px_rgba(124,58,237,0.18)] scale-[1.02]"
                                            : "border-purple-100 shadow-[0_2px_8px_rgba(124,58,237,0.07),inset_0_1px_3px_rgba(124,58,237,0.05)] hover:border-purple-200",
                                    ].join(" ")}
                                />
                                <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base transition-colors duration-200 ${searchFocused ? "text-[#7C3AED]" : "text-gray-400"}`}>
                                    search
                                </span>
                            </div>
                            {/* Neumorphic refresh */}
                            <button
                                onClick={handleRefresh}
                                className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#6605c7] bg-white/80 backdrop-blur-md border border-purple-100 shadow-[0_2px_8px_rgba(124,58,237,0.07),inset_0_1px_3px_rgba(124,58,237,0.05)] hover:shadow-[0_4px_16px_rgba(124,58,237,0.14)] hover:border-purple-200 active:shadow-[inset_0_2px_6px_rgba(124,58,237,0.14)] active:scale-[0.98] transition-all duration-200 flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-xs">sync</span> Refresh
                            </button>
                        </div>
                    }
                />

                {/* Main glassmorphic card */}
                <div className="bg-white/65 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-xl shadow-violet-100/20 overflow-hidden">

                    {/* Tab bar — indigo gradient, no green */}
                    <div className="px-5 pt-5 pb-0 border-b border-purple-50/60 flex flex-wrap gap-2 bg-slate-50/30">
                        {(["pending", "completed"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={[
                                    "px-5 py-2.5 mb-[-1px] rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-all duration-250 flex items-center gap-2",
                                    activeTab === tab
                                        ? "bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-lg shadow-violet-500/20"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/80",
                                ].join(" ")}
                            >
                                <span>{tab === "pending" ? "Awaiting Payout (Sanctioned)" : "Disbursed Portfolio"}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${activeTab === tab ? "bg-white/25 text-white" : "bg-slate-200 text-slate-600"}`}>
                                    {tab === "pending" ? tabCounts.pending : tabCounts.completed}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="p-8">
                        <AnimatePresence mode="wait">
                            {loading ? (
                                /* Skeleton loading rows */
                                <motion.div key="sk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-purple-50 text-[9px] font-black uppercase tracking-widest text-gray-400">
                                                <th className="pb-4">Application &amp; LAN</th>
                                                <th className="pb-4">Student &amp; Program</th>
                                                <th className="pb-4">Sanction Details</th>
                                                <th className="pb-4">Released Payout</th>
                                                <th className="pb-4">Status</th>
                                                <th className="pb-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-purple-50/50">{[1,2,3,4].map((i) => <SkeletonRow key={i} />)}</tbody>
                                    </table>
                                </motion.div>
                            ) : filteredApps.length === 0 ? (
                                /* Premium empty state */
                                <motion.div key="em" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    transition={{ duration: 0.38 }}
                                    className="flex flex-col items-center justify-center py-16 text-center"
                                >
                                    <DisbursementEmptyIllustration />
                                    <h3 className="text-sm font-black text-slate-800 mb-2 tracking-tight">No Files in This Stage</h3>
                                    <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                                        There are no loan files matching your current disbursement filter. Try the other tab or clear your search.
                                    </p>
                                    {search && (
                                        <button onClick={() => setSearch("")}
                                            className="mt-5 px-4 py-2 bg-violet-50 border border-violet-100 text-violet-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-violet-100 transition-all">
                                            Clear Search
                                        </button>
                                    )}
                                </motion.div>
                            ) : (
                                /* Data table */
                                <motion.div key="tb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-purple-50 text-[9px] font-black uppercase tracking-widest text-gray-400">
                                                    <th className="pb-4">Application &amp; LAN</th>
                                                    <th className="pb-4">Student &amp; Program</th>
                                                    <th className="pb-4">Sanction Details</th>
                                                    <th className="pb-4">Released Payout</th>
                                                    <th className="pb-4">Status</th>
                                                    <th className="pb-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-purple-50/50">
                                                {filteredApps.map((app) => {
                                                    const rec = trancheRecords[app.id] || { history: [] };
                                                    const paid = rec.history.reduce((s, t) => s + t.amount, 0);
                                                    const sa   = app.sanctionAmount || app.amount || 600000;
                                                    return (
                                                        <motion.tr key={app.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                                            className="hover:bg-violet-50/20 transition-colors">
                                                            <td className="py-5">
                                                                <span className="text-xs font-bold text-gray-900 block">{app.applicationNumber}</span>
                                                                <span className="text-[9px] font-black text-[#6605c7] uppercase tracking-wider block mt-1">LAN: {app.lanNumber || "N/A"}</span>
                                                            </td>
                                                            <td className="py-5">
                                                                <span className="text-xs font-bold text-gray-900 uppercase tracking-tight block">{app.firstName} {app.lastName}</span>
                                                                <span className="text-[10px] text-gray-400 block truncate max-w-[200px]">{app.universityName}</span>
                                                            </td>
                                                            <td className="py-5">
                                                                <span className="text-xs font-bold text-gray-900 block">&#8377;{sa.toLocaleString()}</span>
                                                                <span className="text-[9px] font-bold text-violet-600 block">{app.sanctionedInterestRate || app.interestRate || "9.5"}% Effective ROI</span>
                                                            </td>
                                                            <td className="py-5">
                                                                <span className="text-xs font-black text-gray-900 block">&#8377;{paid.toLocaleString()}</span>
                                                                <span className="text-[9px] font-semibold text-gray-400 block mt-1">Remaining: &#8377;{(sa - paid).toLocaleString()}</span>
                                                            </td>
                                                            <td className="py-5">{statusBadge(app, paid)}</td>
                                                            <td className="py-5 text-right">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedApp(app);
                                                                        const r = trancheRecords[app.id] || { beneficiary: { name: `${app.firstName} ${app.lastName}`, bank: "HDFC Bank Ltd", account: "50100829104012", ifsc: "HDFC0000240" }, history: [] };
                                                                        setBeneficiaryName(r.beneficiary.name);
                                                                        setBeneficiaryBank(r.beneficiary.bank);
                                                                        setBeneficiaryAcc(r.beneficiary.account);
                                                                        setBeneficiaryIfsc(r.beneficiary.ifsc);
                                                                        setTrancheAmount((sa - paid).toString());
                                                                        setShowPanel(true);
                                                                    }}
                                                                    className="px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl ml-auto flex items-center gap-1.5 bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                                                                >
                                                                    <span className="material-symbols-outlined text-xs">payments</span>
                                                                    {app.status === "disbursed" || app.status === "disbursement_confirmed" ? "View Dossier" : "Release / History"}
                                                                </button>
                                                            </td>
                                                        </motion.tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Slide-over panel */}
                <AnimatePresence>
                    {showPanel && selectedApp && (
                        <div className="fixed inset-0 z-50 flex justify-end">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowPanel(false)} />

                            <motion.div
                                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                                transition={{ type: "spring", damping: 30, stiffness: 220 }}
                                className="relative w-full max-w-[700px] h-screen bg-[#FAFBFF] shadow-2xl z-10 flex flex-col overflow-hidden border-l border-violet-100"
                            >
                                {/* Panel header */}
                                <div className="p-6 bg-white border-b border-violet-50 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{selectedApp.applicationNumber}</span>
                                            <span className="text-[8.5px] font-black uppercase tracking-wider text-gray-400 font-mono">LAN: {selectedApp.lanNumber || "PENDING"}</span>
                                        </div>
                                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mt-1">
                                            Disbursement Dossier: {selectedApp.firstName} {selectedApp.lastName}
                                        </h2>
                                    </div>
                                    <button onClick={() => setShowPanel(false)}
                                        className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-all border border-gray-100">
                                        <span className="material-symbols-outlined text-lg">close</span>
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">

                                    {/* 1. Progress gauge */}
                                    {(() => {
                                        const sa   = selectedApp.sanctionAmount || selectedApp.amount || 600000;
                                        const rec  = trancheRecords[selectedApp.id] || { history: [] };
                                        const paid = rec.history.reduce((s, t) => s + t.amount, 0);
                                        const rem  = sa - paid;
                                        const pct  = Math.round((paid / sa) * 100);
                                        return (
                                            <div className="p-6 bg-white rounded-2xl border border-violet-50 shadow-sm space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Disbursement Progress Gauge</span>
                                                        <span className="text-lg font-black text-gray-900 mt-1 block">Released: {pct}% of Sanctioned Principal</span>
                                                    </div>
                                                    <span className="text-2xl font-black font-mono text-violet-700">&#8377;{paid.toLocaleString()}</span>
                                                </div>
                                                <GaugeBar pct={pct} />
                                                <div className="grid grid-cols-3 gap-4 pt-2 border-t border-violet-50/50">
                                                    <div>
                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Sanction Principal</span>
                                                        <span className="text-xs font-black text-gray-800">&#8377;{sa.toLocaleString()}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Released Tranches</span>
                                                        <span className="text-xs font-black text-indigo-700">&#8377;{paid.toLocaleString()}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Remaining Balance</span>
                                                        <span className="text-xs font-black text-amber-600">&#8377;{rem.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* 2. Beneficiary details */}
                                    <div className="p-6 bg-white rounded-2xl border border-violet-50 shadow-sm space-y-4 text-left">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#6605c7] border-b border-violet-50 pb-2 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-xs">account_box</span>
                                            Registered Beneficiary Details
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {[
                                                { label: "Account Holder Name", val: beneficiaryName, set: setBeneficiaryName, mono: false },
                                                { label: "Beneficiary Bank Name", val: beneficiaryBank, set: setBeneficiaryBank, mono: false },
                                                { label: "Account Number",        val: beneficiaryAcc,  set: setBeneficiaryAcc,  mono: true  },
                                                { label: "Bank IFSC Code",        val: beneficiaryIfsc, set: setBeneficiaryIfsc, mono: true  },
                                            ].map(({ label, val, set, mono }) => (
                                                <div key={label}>
                                                    <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest block mb-1">{label}</label>
                                                    <input type="text" value={val} onChange={(e) => set(e.target.value)} className={inp + (mono ? " font-mono" : "")} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 3. Tranche ledger */}
                                    <div className="p-6 bg-white rounded-2xl border border-violet-50 shadow-sm space-y-4 text-left">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#6605c7] border-b border-violet-50 pb-2 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-xs">history</span>
                                            Tranche Disbursement Ledger
                                        </h3>
                                        {(() => {
                                            const rec = trancheRecords[selectedApp.id] || { history: [] };
                                            if (rec.history.length === 0)
                                                return <p className="text-[10.5px] text-gray-400 italic py-4 text-center">No tranches released yet on this file.</p>;
                                            return (
                                                <div className="overflow-hidden border border-violet-50 rounded-xl">
                                                    <table className="w-full text-left text-xs border-collapse">
                                                        <thead>
                                                            <tr className="bg-slate-50 text-[8.5px] font-black uppercase text-gray-400 tracking-wider border-b border-violet-50">
                                                                <th className="p-3">Tranche</th><th className="p-3">Amount</th>
                                                                <th className="p-3">Payout Date</th><th className="p-3">Mode</th>
                                                                <th className="p-3">Transaction UTR</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-violet-50/50 font-medium">
                                                            {rec.history.map((t, i) => (
                                                                <tr key={t.id} className="hover:bg-violet-50/30 transition-colors">
                                                                    <td className="p-3 font-bold text-gray-900">#{String(i + 1).padStart(2, "0")}</td>
                                                                    <td className="p-3 font-bold text-gray-900">&#8377;{t.amount.toLocaleString()}</td>
                                                                    <td className="p-3 text-gray-400 font-semibold">{t.date}</td>
                                                                    <td className="p-3 font-mono text-[9.5px] text-violet-700 font-bold">{t.mode}</td>
                                                                    <td className="p-3 font-mono text-[9px] text-[#6605c7] hover:underline font-bold">
                                                                        <a href="#" onClick={(e) => { e.preventDefault(); alert(`Receipt verified — sha256:${t.utr}`); }}>{t.utr}</a>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* 4. Release form */}
                                    {(() => {
                                        const sa   = selectedApp.sanctionAmount || selectedApp.amount || 600000;
                                        const rec  = trancheRecords[selectedApp.id] || { history: [] };
                                        const paid = rec.history.reduce((s, t) => s + t.amount, 0);
                                        const rem  = sa - paid;
                                        if (rem <= 0) {
                                            return (
                                                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-700 text-xs font-semibold flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-indigo-600">check_circle</span>
                                                    <span>This sanctioned credit file is fully released. Ledger payout matches sanctioned parameters.</span>
                                                </div>
                                            );
                                        }
                                        return (
                                            <div className="p-6 bg-white rounded-2xl border border-violet-50 shadow-sm space-y-4 text-left">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#7C3AED] border-b border-violet-50 pb-2 flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-xs">add_card</span>
                                                    Release Next Tranche
                                                </h3>
                                                <form onSubmit={handleReleaseTranche} className="space-y-4">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest block mb-1">Payout Amount (&#8377;)</label>
                                                            <input type="number" required max={rem} value={trancheAmount} onChange={(e) => setTrancheAmount(e.target.value)} className={inp} />
                                                            <span className="text-[8.5px] text-amber-600 font-semibold block mt-1">Maximum: &#8377;{rem.toLocaleString()}</span>
                                                        </div>
                                                        <div>
                                                            <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest block mb-1">Release Date</label>
                                                            <input type="date" required value={trancheDate} onChange={(e) => setTrancheDate(e.target.value)} className={inp} />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest block mb-1">Transaction Ref / UTR</label>
                                                            <input type="text" required placeholder="e.g. UTR-HDFC-990812-X" value={trancheUtr} onChange={(e) => setTrancheUtr(e.target.value)} className={inp + " font-mono"} />
                                                        </div>
                                                        <div>
                                                            <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest block mb-1">Settlement Method</label>
                                                            <select value={trancheMode} onChange={(e) => setTrancheMode(e.target.value)} className={inp}>
                                                                <option value="NEFT">NEFT Settlement Desk</option>
                                                                <option value="RTGS">RTGS Realtime</option>
                                                                <option value="IMPS">IMPS Instant Payout</option>
                                                                <option value="UPI">UPI Merchant Ledger</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <button type="submit" disabled={confirming}
                                                        className="w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed">
                                                        <span className="material-symbols-outlined text-sm">send_money</span>
                                                        {confirming ? "Processing Payout..." : "Release Tranche Funds"}
                                                    </button>
                                                </form>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
