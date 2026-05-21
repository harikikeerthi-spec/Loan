"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function DocumentManagement() {
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
                            <span className="material-symbols-outlined text-blue-600 bg-blue-50 p-2 rounded-xl">description</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Module 03</span>
                        </div>
                    </div>
                </div>

                {/* Shell */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 p-8 h-[500px] flex flex-col items-center justify-center relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="material-symbols-outlined text-gray-200 text-6xl mb-4">document_scanner</span>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">OCR Engine Standby</h3>
                    <p className="text-sm text-gray-400 text-center max-w-sm">Document processing queue and OCR extraction interface will be rendered here.</p>
                </motion.div>

            </div>

            {/* Document Verify Modal */}
            <AnimatePresence>
                {showVerifyModal && selectedDoc && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowVerifyModal(false)} />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl p-8 max-w-md w-full z-10 relative overflow-hidden"
                        >
                            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Verify Document Asset</h3>
                            <p className="text-xs text-gray-400 mb-6 font-bold uppercase tracking-wider">Acknowledge suitability or specify defects for resubmission.</p>

                            <form onSubmit={handleVerifySubmit} className="space-y-5">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Audit Verdict</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setVerifyStatus("verified")}
                                            className={`py-3 px-4 border rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                                                verifyStatus === "verified" 
                                                    ? "border-emerald-600 bg-emerald-50 text-emerald-600" 
                                                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-base">check_circle</span>
                                            Accept Asset
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setVerifyStatus("rejected")}
                                            className={`py-3 px-4 border rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                                                verifyStatus === "rejected" 
                                                    ? "border-rose-600 bg-rose-50 text-rose-600" 
                                                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-base">cancel</span>
                                            Reject Asset
                                        </button>
                                    </div>
                                </div>

                                {verifyStatus === "rejected" && (
                                    <div>
                                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Defect description</label>
                                        <textarea
                                            required
                                            rows={3}
                                            placeholder="Provide reasoning for reject verdict (e.g. Blurry photo, expired date)..."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#6605c7]"
                                        />
                                    </div>
                                )}

                                <div className="flex gap-4 pt-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowVerifyModal(false)}
                                        className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={verifying}
                                        className="flex-1 py-3 bg-[#6605c7] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#5203a4] shadow-lg shadow-purple-500/10 transition-all flex items-center justify-center"
                                    >
                                        {verifying ? "..." : "Save Audit"}
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
