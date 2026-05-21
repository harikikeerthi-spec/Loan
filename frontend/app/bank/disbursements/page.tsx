"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function DisbursementTracker() {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return (
        <div className="min-h-screen p-8 lg:p-12 pl-[100px] lg:pl-[320px] transition-all duration-300">
            <div className="max-w-7xl mx-auto space-y-12">
                
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-emerald-600 bg-emerald-50 p-2 rounded-xl">payments</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Module 04 • Funds Release</span>
                        </div>
                        <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight">Disbursement Tracker</h1>
                        <p className="text-sm text-gray-500 mt-2 font-medium">Monitoring and tracking the release of sanctioned funds.</p>
                    </div>
                </motion.div>

                {/* Shell */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 p-8 h-[500px] flex flex-col items-center justify-center relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="material-symbols-outlined text-gray-200 text-6xl mb-4">account_balance_wallet</span>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Funds Release Matrix</h3>
                    <p className="text-sm text-gray-400 text-center max-w-sm">Active tranches and transfer receipts will be listed here.</p>
                </motion.div>

            </div>

            {/* Confirm Payout Modal */}
            <AnimatePresence>
                {showConfirmModal && selectedApp && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl p-8 max-w-md w-full z-10 relative overflow-hidden"
                        >
                            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Confirm Disbursement</h3>
                            <p className="text-xs text-gray-400 mb-6 font-bold uppercase tracking-wider">Acknowledge release of sanctioned amount and input transaction details.</p>

                            <form onSubmit={handleConfirmDisbursement} className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Disbursed Amount (₹)</label>
                                    <input 
                                        type="number"
                                        required
                                        value={disbursedAmount}
                                        onChange={(e) => setDisbursedAmount(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#6605c7]"
                                    />
                                </div>
                                
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Disbursement Date</label>
                                    <input 
                                        type="date"
                                        required
                                        value={disbursedAt}
                                        onChange={(e) => setDisbursedAt(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#6605c7]"
                                    />
                                </div>

                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Transaction Ref / UTR Number</label>
                                    <input 
                                        type="text"
                                        required
                                        placeholder="e.g. UTR-HDFC-990812-X"
                                        value={utrNumber}
                                        onChange={(e) => setUtrNumber(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#6605c7]"
                                    />
                                </div>

                                <div className="flex gap-4 pt-3 mt-6">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowConfirmModal(false)}
                                        className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={confirming}
                                        className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center"
                                    >
                                        {confirming ? "Processing..." : "Confirm Release"}
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
