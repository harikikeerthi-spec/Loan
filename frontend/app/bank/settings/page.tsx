"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Settings() {
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
                            <span className="material-symbols-outlined text-gray-600 bg-gray-100 p-2 rounded-xl">settings</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Module 09</span>
                        </div>
                        <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight">Settings & Config</h1>
                        <p className="text-sm text-gray-500 mt-2 font-medium">Global system configuration and administrative control settings.</p>
                    </div>
                </motion.div>

                {/* Shell */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 p-8 h-[500px] flex flex-col items-center justify-center relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="material-symbols-outlined text-gray-200 text-6xl mb-4">tune</span>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Control Panel</h3>
                    <p className="text-sm text-gray-400 text-center max-w-sm">Access controls, user roles, and global parameters will be managed here.</p>
                </motion.div>

            </div>
        </div>
    );
}
