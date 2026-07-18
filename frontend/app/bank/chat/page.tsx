"use client";

import ChatInterface from "@/components/Chat/ChatInterface";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function BankChatPage() {
    const searchParams = useSearchParams();
    const { user } = useAuth();
    
    const applicationId = searchParams.get("applicationId");
    const applicationNumber = searchParams.get("applicationNumber");

    let bankNameKey = "idfc";
    if (typeof window !== "undefined") {
        bankNameKey = sessionStorage.getItem("selectedBank") || localStorage.getItem("selectedBank") || user?.bankName || user?.firstName || "idfc";
    }

    const initialBank = applicationId ? {
        bankName: bankNameKey,
        applicationId,
        applicationNumber: applicationNumber || undefined
    } : null;

    const conversationId = searchParams.get("conversationId");

    return (
        <div className="p-6 space-y-4 animate-fade-in relative z-10 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
            <div className="flex justify-between items-end gap-6 mb-1">
                <div>
                    <h2 className="text-2xl font-black font-display mb-1 text-gray-900 tracking-tight">ACTIVE TRANSMISSIONS</h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs text-emerald-500">sensors</span>
                        WhatsApp Bridge Protocol v3.0 // Multi-Channel Node Aggregator
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="flex items-center gap-3 px-5 py-2.5 bg-[#FFFFFF] shadow-sm border border-black/5 rounded-2xl">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Signal Synchronized</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-[#FFFFFF]/50 backdrop-blur-xl rounded-[3rem] border border-white/20 shadow-2xl shadow-indigo-500/5 overflow-hidden flex flex-col">
                <ChatInterface role="bank" initialBank={initialBank} initialConversationId={conversationId || undefined} hideSidebar={!!applicationId} className="flex h-full w-full overflow-hidden bg-[#FFFFFF]/95 text-gray-900 animate-fade-in" />
            </div>
        </div>
    );
}
