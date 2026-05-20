"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function CommunicationHub() {
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
                            <span className="material-symbols-outlined text-teal-600 bg-teal-50 p-2 rounded-xl">forum</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-600">Module 06</span>
                        </div>
                        <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight">Communication Hub</h1>
                        <p className="text-sm text-gray-500 mt-2 font-medium">Omnichannel messaging integrations: Slack, Email, Chat, WhatsApp.</p>
                    </div>
                </motion.div>

                {/* Shell */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 p-8 h-[500px] flex flex-col items-center justify-center relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="material-symbols-outlined text-gray-200 text-6xl mb-4">chat_bubble</span>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Omnichannel Intercom</h3>
                    <p className="text-sm text-gray-400 text-center max-w-sm">Direct communications to students and internal slack channels will render here.</p>
                </motion.div>

            </div>
        </div>
    );
}
