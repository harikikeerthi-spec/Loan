"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { adminApi, bankApi } from "@/lib/api";
import { PageHeader, StatusBadge, PriorityTag, DataTable, Spinner, EmptyState } from "@/components/bank/SharedUI";

export default function DecisionsHub() {
    const [mounted, setMounted] = useState(false);
    const [currentBankId, setCurrentBankId] = useState<string>("idfc");
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    // Modal state for logging decision
    const [selectedApp, setSelectedApp] = useState<any | null>(null);
    const [showDecisionModal, setShowDecisionModal] = useState(false);
    
    // Decision form fields
    const [decisionType, setDecisionType] = useState<"approve" | "reject" | "query" | "counter_offer">("approve");
    const [sanctionAmount, setSanctionAmount] = useState("");
    const [interestRate, setInterestRate] = useState("9.5");
    const [processingFee, setProcessingFee] = useState("1.0");
    const [rejectionReason, setRejectionReason] = useState("");
    const [queryText, setQueryText] = useState("");
    const [counterOfferAmount, setCounterOfferAmount] = useState("");
    const [decisionNotes, setDecisionNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

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
                setApplications(res.data || []);
            }
        } catch (err) {
            console.error("Failed to load applications for decisions:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted) {
            fetchApplications(currentBankId);
        }
    }, [currentBankId, mounted]);

    const handleRefresh = () => {
        fetchApplications(currentBankId);
    };

    // Filtered Applications for Decision Hub
    const filteredApps = useMemo(() => {
        return applications.filter(app => {
            const matchesSearch = 
                (app.applicationNumber || "").toLowerCase().includes(search.toLowerCase()) ||
                (`${app.firstName || ""} ${app.lastName || ""}`).toLowerCase().includes(search.toLowerCase()) ||
                (app.lanNumber || "").toLowerCase().includes(search.toLowerCase());

            if (!matchesSearch) return false;

            if (filterStatus === "all") return true;
            if (filterStatus === "pending") return app.status === "processing" || app.status === "pending";
            if (filterStatus === "approved") return app.status === "approved" || app.status === "disbursed";
            if (filterStatus === "rejected") return app.status === "rejected";
            return true;
        });
    }, [applications, search, filterStatus]);

    // SLA Counts / Stats
    const stats = useMemo(() => {
        let totalDecisions = 0;
        let pendingDecisions = 0;
        let queryRaised = 0;
        applications.forEach(app => {
            if (app.status === "approved" || app.status === "rejected" || app.status === "disbursed") {
                totalDecisions++;
            } else {
                pendingDecisions++;
            }
            if (app.remarks && app.remarks.toLowerCase().includes("query")) {
                queryRaised++;
            }
        });
        return { totalDecisions, pendingDecisions, queryRaised };
    }, [applications]);

    const handleDecisionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedApp) return;
        setSubmitting(true);

        try {
            let res: any;
            const updatedRemarks = `${selectedApp.remarks || ""}\n[Decision Hub - ${format(new Date(), "MMM dd, HH:mm")}]: ${decisionType.toUpperCase()} - ${decisionNotes}`;

            if (decisionType === "approve") {
                const sanctionVal = parseFloat(sanctionAmount) || selectedApp.amount;
                const roiVal = parseFloat(interestRate) || 9.5;
                
                // Update loan application status & properties
                res = await adminApi.updateApplication(selectedApp.id, {
                    status: "approved",
                    stage: "approved",
                    progress: 90,
                    sanctionAmount: sanctionVal,
                    sanctionedInterestRate: roiVal,
                    remarks: updatedRemarks
                });

                // Also notify bank API
                await bankApi.submitDecision({
                    applicationId: selectedApp.id,
                    decision: "approved",
                    sanctionAmount: sanctionVal,
                    interestRate: roiVal,
                    notes: decisionNotes
                }).catch(() => {});

            } else if (decisionType === "reject") {
                res = await adminApi.updateApplication(selectedApp.id, {
                    status: "rejected",
                    stage: "rejected",
                    progress: 100,
                    remarks: `${updatedRemarks} | Reason: ${rejectionReason}`
                });

                await bankApi.submitDecision({
                    applicationId: selectedApp.id,
                    decision: "rejected",
                    notes: `${decisionNotes} | Reason: ${rejectionReason}`
                }).catch(() => {});

            } else if (decisionType === "query") {
                res = await adminApi.updateApplication(selectedApp.id, {
                    status: "processing",
                    remarks: `${updatedRemarks} | Raised Query: ${queryText}`
                });

                await bankApi.raiseQuery({
                    applicationId: selectedApp.id,
                    query: queryText,
                    notes: decisionNotes
                }).catch(() => {});

            } else if (decisionType === "counter_offer") {
                const offerAmt = parseFloat(counterOfferAmount) || selectedApp.amount * 0.9;
                res = await adminApi.updateApplication(selectedApp.id, {
                    status: "processing",
                    remarks: `${updatedRemarks} | Counter Offer: INR ${offerAmt.toLocaleString()}`
                });

                await bankApi.counterOffer({
                    applicationId: selectedApp.id,
                    amount: offerAmt,
                    notes: decisionNotes
                }).catch(() => {});
            }

            if (res && res.success) {
                setShowDecisionModal(false);
                setSelectedApp(null);
                setDecisionNotes("");
                setRejectionReason("");
                setQueryText("");
                setCounterOfferAmount("");
                fetchApplications(currentBankId);
            }
        } catch (err) {
            console.error("Failed to log underwriting decision:", err);
            alert("Error logging underwriting decision.");
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        {
            header: "App Number / LAN",
            accessorKey: "applicationNumber",
            cell: (row: any) => (
                <div>
                    <span className="font-bold text-gray-900 block">{row.applicationNumber}</span>
                    <span className="text-[9px] font-black text-[#6605c7] uppercase tracking-wider block mt-0.5">
                        LAN: {row.lanNumber || "Not Logged"}
                    </span>
                </div>
            )
        },
        {
            header: "Student & Institution",
            accessorKey: "firstName",
            cell: (row: any) => (
                <div>
                    <span className="font-bold text-gray-900 block uppercase tracking-tight">
                        {row.firstName} {row.lastName}
                    </span>
                    <span className="text-[10px] text-gray-400 block truncate max-w-[220px]">
                        {row.universityName}
                    </span>
                </div>
            )
        },
        {
            header: "Requested Amount",
            accessorKey: "amount",
            cell: (row: any) => (
                <div>
                    <span className="font-black text-gray-900 block">
                        ₹{row.amount?.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
                        {row.loanType || "Education Loan"}
                    </span>
                </div>
            )
        },
        {
            header: "Priority & Date",
            accessorKey: "createdAt",
            cell: (row: any) => {
                const priority = row.lanNumber ? "high" : "medium";
                return (
                    <div>
                        <PriorityTag priority={priority} />
                        <span className="text-[9px] font-mono text-gray-400 block mt-1 font-bold">
                            {row.createdAt ? format(new Date(row.createdAt), "dd MMM yyyy") : "N/A"}
                        </span>
                    </div>
                );
            }
        },
        {
            header: "State",
            accessorKey: "status",
            cell: (row: any) => <StatusBadge status={row.status} />
        },
        {
            header: "Underwriting Actions",
            accessorKey: "id",
            sortable: false,
            cell: (row: any) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setSelectedApp(row);
                            setSanctionAmount(row.amount.toString());
                            setCounterOfferAmount((row.amount * 0.9).toString());
                            setShowDecisionModal(true);
                        }}
                        className="px-3 py-1.5 bg-[#6605c7] hover:bg-[#8b24e5] text-white text-[9px] font-black uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[12px]">gavel</span>
                        Decide
                    </button>
                </div>
            )
        }
    ];

    if (!mounted) return null;

    return (
        <div className="p-8 lg:p-12 space-y-8 max-w-7xl mx-auto relative z-10">
            {/* Header */}
            <PageHeader 
                title="Underwriting Decisions Hub" 
                description="Evaluate loan applications, review credit assessment criteria, sanction loans, raise queries, or submit final approvals."
                moduleName="Module 05 • Decisions Hub"
                icon="gavel"
                actionSlot={
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="Search student, LAN, code..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2.5 w-full sm:w-64 bg-white/70 backdrop-blur-md border border-purple-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#6605c7] shadow-sm transition-all"
                            />
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
                        </div>
                        <button 
                            onClick={handleRefresh}
                            className="px-4 py-2.5 border border-purple-100 bg-white/70 hover:bg-white text-[10px] font-black uppercase tracking-widest text-[#6605c7] rounded-xl shadow-sm transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-xs">sync</span> Refresh
                        </button>
                    </div>
                }
            />

            {/* Credit Metrics Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card bg-white/70 p-4.5 rounded-2xl border-purple-100/50 flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Decisions Executed</p>
                        <p className="text-2xl font-black text-gray-900 mt-1 italic font-display">{stats.totalDecisions}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#6605c7]">
                        <span className="material-symbols-outlined">verified</span>
                    </div>
                </div>
                <div className="glass-card bg-white/70 p-4.5 rounded-2xl border-purple-100/50 flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Awaiting Decision</p>
                        <p className="text-2xl font-black text-gray-900 mt-1 italic font-display">{stats.pendingDecisions}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <span className="material-symbols-outlined">pending_actions</span>
                    </div>
                </div>
                <div className="glass-card bg-white/70 p-4.5 rounded-2xl border-purple-100/50 flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Queries Outstanding</p>
                        <p className="text-2xl font-black text-gray-900 mt-1 italic font-display">{stats.queryRaised}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <span className="material-symbols-outlined">help_center</span>
                    </div>
                </div>
            </div>

            {/* Decisions Queue Table Card */}
            <div className="bg-white/80 backdrop-blur-xl border border-purple-50 rounded-3xl shadow-xl p-6 overflow-hidden">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <div className="flex gap-2">
                        {["all", "pending", "approved", "rejected"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilterStatus(tab)}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                    filterStatus === tab
                                        ? "bg-[#6605c7] text-white shadow-md shadow-purple-500/20"
                                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                {tab === "all" ? "All Applications" : tab === "pending" ? "Pending Credit Evaluation" : tab}
                            </button>
                        ))}
                    </div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        Queue Capacity: {filteredApps.length} Files
                    </span>
                </div>

                {loading ? (
                    <Spinner message="Retrieving decision nodes..." />
                ) : filteredApps.length === 0 ? (
                    <EmptyState message="No application files currently align with your credit evaluation parameters." />
                ) : (
                    <DataTable data={filteredApps} columns={columns} />
                )}
            </div>

            {/* Underwriting Decision Modal */}
            <AnimatePresence>
                {showDecisionModal && selectedApp && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowDecisionModal(false)} />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl p-8 max-w-lg w-full z-10 relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Credit Evaluation</h3>
                                    <p className="text-[9px] font-black text-[#6605c7] uppercase tracking-widest mt-1">
                                        LAN: {selectedApp.lanNumber || "NOT ASSIGNED"} | App: {selectedApp.applicationNumber}
                                    </p>
                                </div>
                                <button onClick={() => setShowDecisionModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            {/* Applicant Profile Preview */}
                            <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100/50 mb-6 flex justify-between items-center">
                                <div>
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Applicant Node</p>
                                    <p className="text-xs font-black text-gray-900 uppercase tracking-tight mt-0.5">{selectedApp.firstName} {selectedApp.lastName}</p>
                                    <p className="text-[9px] text-gray-500 font-medium truncate max-w-[200px] mt-0.5">{selectedApp.universityName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Sought Quantum</p>
                                    <p className="text-sm font-black text-[#6605c7] italic mt-0.5">₹{selectedApp.amount?.toLocaleString()}</p>
                                </div>
                            </div>

                            <form onSubmit={handleDecisionSubmit} className="space-y-4">
                                {/* Decision Type Toggles */}
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Underwriting Verdict</label>
                                    <div className="grid grid-cols-4 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                                        {(["approve", "reject", "query", "counter_offer"] as const).map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setDecisionType(t)}
                                                className={`py-2 rounded-lg text-[8.5px] font-black uppercase tracking-wider text-center transition-all ${
                                                    decisionType === t
                                                        ? "bg-[#6605c7] text-white shadow-sm"
                                                        : "text-gray-400 hover:text-gray-600"
                                                }`}
                                            >
                                                {t.replace("_", " ")}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Form Fields Conditional on Verdict */}
                                <AnimatePresence mode="wait">
                                    {decisionType === "approve" && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-3"
                                        >
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest block mb-1">Sanctioned Amount (₹)</label>
                                                    <input 
                                                        type="number"
                                                        required
                                                        value={sanctionAmount}
                                                        onChange={(e) => setSanctionAmount(e.target.value)}
                                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7]"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest block mb-1">Interest Rate (%)</label>
                                                    <input 
                                                        type="number"
                                                        step="0.01"
                                                        required
                                                        value={interestRate}
                                                        onChange={(e) => setInterestRate(e.target.value)}
                                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7]"
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {decisionType === "reject" && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-3"
                                        >
                                            <div>
                                                <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest block mb-1">Rejection Category / Reason</label>
                                                <select
                                                    required
                                                    value={rejectionReason}
                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7] text-gray-700"
                                                >
                                                    <option value="">Select a reason...</option>
                                                    <option value="High DTI (Debt-to-Income) Ratio">High DTI (Debt-to-Income) Ratio</option>
                                                    <option value="Unsatisfactory CIBIL/Credit Score">Unsatisfactory CIBIL/Credit Score</option>
                                                    <option value="Ineligible University/Program Tier">Ineligible University/Program Tier</option>
                                                    <option value="Insufficient Collateral Value">Insufficient Collateral Value</option>
                                                    <option value="Verification Fraud / Document Deficiencies">Verification Fraud / Document Deficiencies</option>
                                                </select>
                                            </div>
                                        </motion.div>
                                    )}

                                    {decisionType === "query" && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-3"
                                        >
                                            <div>
                                                <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest block mb-1">Query Information Required</label>
                                                <textarea
                                                    required
                                                    placeholder="Specify the document anomaly or additional verification parameters requested from student..."
                                                    value={queryText}
                                                    onChange={(e) => setQueryText(e.target.value)}
                                                    rows={3}
                                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6605c7]"
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    {decisionType === "counter_offer" && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-3"
                                        >
                                            <div>
                                                <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest block mb-1">Counter Offer Amount (₹)</label>
                                                <input 
                                                    type="number"
                                                    required
                                                    value={counterOfferAmount}
                                                    onChange={(e) => setCounterOfferAmount(e.target.value)}
                                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7]"
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div>
                                    <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest block mb-1">Underwriter Remarks & Notes</label>
                                    <textarea
                                        required
                                        placeholder="Record details of credit analysis, risk profile evaluation, or policy exceptions allowed..."
                                        value={decisionNotes}
                                        onChange={(e) => setDecisionNotes(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6605c7]"
                                    />
                                </div>

                                <div className="flex gap-4 pt-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowDecisionModal(false)}
                                        className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 py-3 bg-[#6605c7] hover:bg-[#8b24e5] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/10 transition-all flex items-center justify-center"
                                    >
                                        {submitting ? "Submitting Verdict..." : "Confirm Verdict"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
