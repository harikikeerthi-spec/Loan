"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function ApplicationManagement() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return (
        <div className="min-h-screen p-8 lg:p-12 transition-all duration-300">
            <div className="max-w-7xl mx-auto space-y-12">
                
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-rose-600 bg-rose-50 p-2 rounded-xl">gavel</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-600">Module 02</span>
                        </div>
                        <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight">Application Management</h1>
                        <p className="text-sm text-gray-500 mt-2 font-medium">Processing pipeline for Reject / Sanction decisions.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="w-12 h-12 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-[#6605c7] flex items-center justify-center transition-all">
                            <span className="material-symbols-outlined text-gray-400">filter_list</span>
                        </button>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Search by ID or Name..." 
                                className="pl-12 pr-6 py-3 w-64 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#6605c7] focus:ring-4 focus:ring-[#6605c7]/5 shadow-sm transition-all"
                            />
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                        </div>
                    </div>
                </motion.div>

                {/* Pipeline Matrix Shell */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden">
                    <div className="p-8 border-b border-gray-100 flex gap-8">
                        <button className="text-sm font-bold text-[#6605c7] border-b-2 border-[#6605c7] pb-2">Pending Review (24)</button>
                        <button className="text-sm font-bold text-gray-400 hover:text-gray-600 pb-2">Approved Queue (12)</button>
                        <button className="text-sm font-bold text-gray-400 hover:text-gray-600 pb-2">Rejected (5)</button>
                    </div>
                    
                    <div className="p-8 h-[500px] flex flex-col items-center justify-center relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="material-symbols-outlined text-gray-200 text-6xl mb-4">account_tree</span>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Processing Matrix Offline</h3>
                        <p className="text-sm text-gray-400 text-center max-w-sm">The decision pipeline interface will be rendered here.</p>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
