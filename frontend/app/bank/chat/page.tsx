"use client";

import ChatInterface from "@/components/Chat/ChatInterface";
import { motion } from "framer-motion";

export default function BankChatPage() {
    return (
        <div className="p-8 space-y-8 animate-fade-in relative z-10 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
            <div className="flex justify-between items-end gap-6 mb-2">
                <div>
                    <h2 className="text-4xl font-black font-display mb-2 text-gray-900 tracking-tight italic">ACTIVE TRANSMISSIONS</h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs text-emerald-500">sensors</span>
                        WhatsApp Bridge Protocol v3.0 // Multi-Channel Node Aggregator
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="flex items-center gap-3 px-5 py-2.5 bg-white shadow-sm border border-black/5 rounded-2xl">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">Signal Synchronized</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-white/50 backdrop-blur-xl rounded-[3rem] border border-white/20 shadow-2xl shadow-indigo-500/5 overflow-hidden">
                <ChatInterface role="bank" />
            </div>
        </div>
    );
}
