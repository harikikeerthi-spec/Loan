"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { adminApi, bankApi } from "@/lib/api";
import { PageHeader, Spinner } from "@/components/bank/SharedUI";
import AlertModal from "@/components/AlertModal";

export default function ProcessingFeeTracker() {
    const [mounted, setMounted] = useState(false);
    const [currentBankId, setCurrentBankId] = useState<string>("idfc");
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modal / Drawer state
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [drawerMode, setDrawerMode] = useState<"payment" | "waiver" | null>(null);
    const [txnRef, setTxnRef] = useState("");
    const [paymentMode, setPaymentMode] = useState("online");
    const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [waiverReason, setWaiverReason] = useState("");
    const [processing, setProcessing] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: "success" | "error" | "info" | "warning";
    }>({
        isOpen: false,
        title: "",
        message: "",
        type: "success"
    });

    // Mock initial fee states stored in state to simulate changes locally
    const [feeRecords, setFeeRecords] = useState<Record<string, {
        status: "pending" | "paid" | "waived";
        txnRef?: string;
        paymentMode?: string;
        paymentDate?: string;
        actionReason?: string;
        amount: number;
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
            if (res && res.success) {
                const apps = res.data || [];
                setApplications(apps);
                
                // Initialize processing fee states for applications from DB
                const initialRecords: typeof feeRecords = {};
                apps.forEach((app: any) => {
                    const pfVal = app.ProcessingFee || app.processingFee;
                    const pf = Array.isArray(pfVal) ? pfVal[0] : pfVal;

                    if (pf) {
                        initialRecords[app.id] = {
                            status: (pf.status || "pending").toLowerCase() as "pending" | "paid" | "waived",
                            amount: pf.feeAmount !== undefined && pf.feeAmount !== null ? pf.feeAmount : Math.max(10000, Math.round((app.amount || 500000) * 0.01)),
                            txnRef: pf.paymentRef || undefined,
                            paymentMode: pf.paymentMode || undefined,
                            paymentDate: pf.paidAt ? format(new Date(pf.paidAt), "yyyy-MM-dd") : undefined,
                            actionReason: pf.waiverReason || undefined
                        };
                    } else {
                        const baseAmount = Math.max(10000, Math.round((app.amount || 500000) * 0.01));
                        const isApproved = app.status === "approved" || app.status === "disbursed";
                        initialRecords[app.id] = {
                            status: isApproved ? "paid" : "pending",
                            amount: baseAmount,
                            txnRef: isApproved ? `TXN-${app.applicationNumber}-F5` : undefined,
                            paymentMode: isApproved ? "direct_debit" : undefined,
                            paymentDate: isApproved ? format(new Date(app.createdAt || Date.now()), "yyyy-MM-dd") : undefined
                        };
                    }
                });
                setFeeRecords(initialRecords);
            }
        } catch (err) {
            console.error("Failed to load applications for processing fees:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) {
            fetchApplications(currentBankId);
        }
    }, [currentBankId, mounted]);

    // Computed totals
    const stats = useMemo(() => {
        let totalCollected = 0;
        let totalPending = 0;
        let totalWaived = 0;

        Object.values(feeRecords).forEach(rec => {
            const totalWithGst = Math.round(rec.amount * 1.18);
            if (rec.status === "paid") totalCollected += totalWithGst;
            else if (rec.status === "pending") totalPending += totalWithGst;
            else if (rec.status === "waived") totalWaived += totalWithGst;
        });

        return { totalCollected, totalPending, totalWaived };
    }, [feeRecords]);

    const filteredApps = useMemo(() => {
        return applications.filter(app => {
            const record = feeRecords[app.id];
            const matchesSearch = 
                (app.applicationNumber || "").toLowerCase().includes(search.toLowerCase()) ||
                (`${app.firstName || ""} ${app.lastName || ""}`).toLowerCase().includes(search.toLowerCase()) ||
                (app.lanNumber || "").toLowerCase().includes(search.toLowerCase());
            
            return matchesSearch;
        });
    }, [applications, feeRecords, search]);

    const handleActionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedApp) return;
        setProcessing(true);

        try {
            const baseAmount = (feeRecords[selectedApp.id]?.amount) || Math.max(10000, Math.round((selectedApp.amount || 500000) * 0.01));
            let payload: any = {};

            if (drawerMode === "payment") {
                const gst = Math.round(baseAmount * 0.18);
                const total = baseAmount + gst;
                payload = {
                    feeAmount: baseAmount,
                    gstAmount: gst,
                    totalAmount: total,
                    status: 'PAID',
                    paymentMode: paymentMode,
                    paymentRef: txnRef,
                    paidAt: new Date(paymentDate).toISOString(),
                    lanNumber: selectedApp.lanNumber || null
                };
            } else if (drawerMode === "waiver") {
                payload = {
                    feeAmount: 0,
                    gstAmount: 0,
                    totalAmount: 0,
                    status: 'WAIVED',
                    waiverReason: waiverReason,
                    lanNumber: selectedApp.lanNumber || null
                };
            }

            const res: any = await bankApi.setProcessingFee(selectedApp.id, payload);

            if (res && res.success) {
                setFeeRecords(prev => {
                    const current = prev[selectedApp.id] || { amount: baseAmount, status: "pending" };
                    if (drawerMode === "payment") {
                        return {
                            ...prev,
                            [selectedApp.id]: {
                                ...current,
                                status: "paid",
                                txnRef,
                                paymentMode,
                                paymentDate
                            }
                        };
                    } else if (drawerMode === "waiver") {
                        return {
                            ...prev,
                            [selectedApp.id]: {
                                ...current,
                                status: "waived",
                                actionReason: waiverReason
                            }
                        };
                    }
                    return prev;
                });

                const alertText = 
                    drawerMode === "payment" ? `Fee Payment confirmed for LAN ${selectedApp.lanNumber || 'N/A'}` :
                    `Fee Waived successfully for application ${selectedApp.applicationNumber}`;

                setAlertConfig({
                    isOpen: true,
                    title: drawerMode === "payment" ? "Payment Confirmed" : "Waiver Approved",
                    message: alertText,
                    type: "success"
                });

                setDrawerMode(null);
                setSelectedApp(null);
                setTxnRef("");
                setWaiverReason("");
            } else {
                throw new Error(res?.message || "Failed to update fee on the backend.");
            }
        } catch (err: any) {
            console.error("Failed to update fee record:", err);
            setAlertConfig({
                isOpen: true,
                title: "Action Failed",
                message: err.message || "An unexpected error occurred while saving fee details. Please check connection and try again.",
                type: "error"
            });
        } finally {
            setProcessing(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="p-8 lg:p-12 space-y-8 max-w-7xl mx-auto relative z-10">
            {/* Page Header */}
            <PageHeader 
                title="Processing Fee Tracker" 
                description="Manage processing fee collection profiles, record merchant bank tokens, and evaluate file-level fee waivers."
                moduleName="Fee Desk"
                icon="receipt_long"
                actionSlot={
                    <div className="relative">
                        <input 
                            type="text"
                            placeholder="Filter by student, LAN, ID..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2.5 w-full sm:w-64 bg-white/70 backdrop-blur-md border border-purple-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#6605c7] shadow-sm transition-all"
                        />
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
                    </div>
                }
            />

            {/* Fee Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card bg-white/70 p-5 rounded-2xl border-purple-150 flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Fees Collected</p>
                        <p className="text-2xl font-black text-emerald-600 mt-1 font-display">₹{stats.totalCollected.toLocaleString()}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <span className="material-symbols-outlined">payments</span>
                    </div>
                </div>
                <div className="glass-card bg-white/70 p-5 rounded-2xl border-purple-150 flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Awaiting Deposit</p>
                        <p className="text-2xl font-black text-amber-600 mt-1 font-display">₹{stats.totalPending.toLocaleString()}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <span className="material-symbols-outlined">hourglass_empty</span>
                    </div>
                </div>
                <div className="glass-card bg-white/70 p-5 rounded-2xl border-purple-150 flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Waived Processing</p>
                        <p className="text-2xl font-black text-purple-600 mt-1 font-display">₹{stats.totalWaived.toLocaleString()}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <span className="material-symbols-outlined">percent</span>
                    </div>
                </div>
            </div>

            {/* Fee Table Card */}
            <div className="bg-white/80 backdrop-blur-xl border border-purple-50 rounded-3xl shadow-xl p-6 overflow-hidden">
                {loading ? (
                    <Spinner message="Retrieving transaction dossiers..." />
                ) : filteredApps.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center">
                        <span className="material-symbols-outlined text-gray-200 text-5xl mb-3">receipt_long</span>
                        <h4 className="text-xs font-black text-gray-400 uppercase">No Fee Records Found</h4>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-purple-50 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                    <th className="pb-4">Application details</th>
                                    <th className="pb-4">Base Fee (1%)</th>
                                    <th className="pb-4">GST (18%)</th>
                                    <th className="pb-4">Total Amount</th>
                                    <th className="pb-4">Status</th>
                                    <th className="pb-4">Audit Trace</th>
                                    <th className="pb-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-50/50">
                                {filteredApps.map(app => {
                                    const rec = feeRecords[app.id] || { status: "pending", amount: 15000 };
                                    const gst = Math.round(rec.amount * 0.18);
                                    const total = rec.amount + gst;

                                    return (
                                        <tr key={app.id} className="hover:bg-purple-50/10 transition-colors">
                                            <td className="py-4.5">
                                                <span className="text-xs font-black text-gray-900 block">{app.firstName} {app.lastName}</span>
                                                <span className="text-[9px] font-black text-purple-600 uppercase mt-0.5 block">
                                                    {app.applicationNumber} • LAN: {app.lanNumber || "PENDING"}
                                                </span>
                                            </td>
                                            <td className="py-4.5 font-semibold text-xs text-gray-700">₹{rec.amount.toLocaleString()}</td>
                                            <td className="py-4.5 font-semibold text-xs text-gray-400">₹{gst.toLocaleString()}</td>
                                            <td className="py-4.5 font-bold text-xs text-gray-900">₹{total.toLocaleString()}</td>
                                            <td className="py-4.5">
                                                <span className={`inline-flex px-2 py-0.5 text-[8.5px] font-black uppercase rounded-lg border tracking-wider ${
                                                    rec.status === "paid" 
                                                        ? "bg-emerald-50 border-emerald-150 text-emerald-600" 
                                                        : rec.status === "waived"
                                                            ? "bg-purple-50 border-purple-150 text-purple-600"
                                                            : "bg-amber-50 border-amber-150 text-amber-600 animate-pulse"
                                                }`}>
                                                    {rec.status}
                                                </span>
                                            </td>
                                            <td className="py-4.5">
                                                {rec.status === "paid" && (
                                                    <span className="text-[8.5px] font-semibold text-gray-400 block font-mono">
                                                        Txn: {rec.txnRef || "N/A"}<br />
                                                        Date: {rec.paymentDate || "N/A"}
                                                    </span>
                                                )}
                                                {rec.status === "waived" && (
                                                    <span className="text-[8.5px] font-semibold text-gray-400 block italic max-w-[150px] truncate" title={rec.actionReason}>
                                                        Note: {rec.actionReason || "Approved"}
                                                    </span>
                                                )}
                                                {rec.status === "pending" && (
                                                    <span className="text-[8.5px] font-semibold text-gray-400 block">Pending deposit confirmation</span>
                                                )}
                                            </td>
                                            <td className="py-4.5 text-right">
                                                <div className="flex justify-end gap-1.5">
                                                    {rec.status === "pending" && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedApp(app);
                                                                    setDrawerMode("payment");
                                                                }}
                                                                className="px-3 py-1.5 bg-[#6605c7] hover:bg-[#5203a4] text-white text-[9.5px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm"
                                                            >
                                                                Confirm Paid
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedApp(app);
                                                                    setDrawerMode("waiver");
                                                                }}
                                                                className="px-2.5 py-1.5 border border-purple-150 text-purple-600 hover:bg-purple-50/40 text-[9.5px] font-black uppercase tracking-wider rounded-xl transition-all"
                                                            >
                                                                Waive
                                                            </button>
                                                        </>
                                                    )}
                                                    {(rec.status === "paid" || rec.status === "waived") && (
                                                        <span className="text-[9.5px] font-bold text-gray-400 italic">No further actions</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Actions Dialog / Modal Drawer */}
            <AnimatePresence>
                {drawerMode && selectedApp && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => { setDrawerMode(null); setSelectedApp(null); }} />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2rem] border border-purple-50 shadow-2xl p-8 max-w-md w-full z-10 relative overflow-hidden"
                        >
                            {drawerMode === "payment" && (
                                <>
                                    <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[#6605c7]">payments</span>
                                        Confirm Payment
                                    </h3>
                                    <p className="text-xs text-gray-400 mb-5 font-bold uppercase tracking-wider">
                                        Record payment parameters for {selectedApp.firstName} {selectedApp.lastName}
                                    </p>

                                    <form onSubmit={handleActionSubmit} className="space-y-4">
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Transaction Ref Token (UTR)</label>
                                            <input 
                                                type="text" 
                                                required 
                                                value={txnRef}
                                                onChange={e => setTxnRef(e.target.value)}
                                                placeholder="e.g. UTR-SBI-88910-X" 
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] text-gray-700"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Payment Mode</label>
                                                <select 
                                                    value={paymentMode}
                                                    onChange={e => setPaymentMode(e.target.value)}
                                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] text-gray-700"
                                                >
                                                    <option value="online">Net Banking</option>
                                                    <option value="upi">UPI Gateway</option>
                                                    <option value="card">Card Payment</option>
                                                    <option value="dd">Demand Draft</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Payment Date</label>
                                                <input 
                                                    type="date" 
                                                    required 
                                                    value={paymentDate}
                                                    onChange={e => setPaymentDate(e.target.value)}
                                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] text-gray-700"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-3">
                                            <button 
                                                type="button" 
                                                onClick={() => { setDrawerMode(null); setSelectedApp(null); }}
                                                className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all font-sans"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit"
                                                disabled={processing}
                                                className="flex-1 py-3 bg-[#6605c7] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#5203a4] shadow-lg shadow-purple-500/10 transition-all font-sans"
                                            >
                                                {processing ? "Processing..." : "Confirm Deposit"}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}

                            {drawerMode === "waiver" && (
                                <>
                                    <h3 className="text-xl font-black text-[#6605c7] mb-2 uppercase tracking-tight flex items-center gap-1.5">
                                        <span className="material-symbols-outlined">percent</span>
                                        Authorize Fee Waiver
                                    </h3>
                                    <p className="text-xs text-gray-400 mb-5 font-bold uppercase tracking-wider">
                                        Applying full fee waiver on application {selectedApp.applicationNumber}
                                    </p>

                                    <form onSubmit={handleActionSubmit} className="space-y-4">
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Reason for Waiver Approval</label>
                                            <textarea 
                                                required 
                                                rows={3}
                                                value={waiverReason}
                                                onChange={e => setWaiverReason(e.target.value)}
                                                placeholder="Explain corporate discount scheme, partner campaign, or manager override logic..."
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#6605c7] text-gray-700"
                                            />
                                        </div>

                                        <div className="flex gap-4 pt-3">
                                            <button 
                                                type="button" 
                                                onClick={() => { setDrawerMode(null); setSelectedApp(null); }}
                                                className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all font-sans"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit"
                                                disabled={processing}
                                                className="flex-1 py-3 bg-[#6605c7] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#5203a4] shadow-lg shadow-purple-500/10 transition-all font-sans"
                                            >
                                                {processing ? "Processing..." : "Approve Waiver"}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />
        </div>
    );
}
