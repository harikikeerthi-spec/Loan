"use client";

import { useMemo } from "react";
import ChatInterface from "@/components/Chat/ChatInterface";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function BankChatPage() {
    const searchParams = useSearchParams();
    const { user } = useAuth();
    
    const applicationId = searchParams.get("applicationId");
    const applicationNumber = searchParams.get("applicationNumber");
    const bankParam = searchParams.get("bank");

    let bankNameKey = bankParam || "idfc";
    if (typeof window !== "undefined") {
        bankNameKey = bankParam || sessionStorage.getItem("selectedBank") || localStorage.getItem("selectedBank") || user?.bankName || user?.firstName || "idfc";
    }

    const initialBank = useMemo(() => {
        return applicationId ? {
            bankName: bankNameKey,
            applicationId,
            applicationNumber: applicationNumber || undefined
        } : null;
    }, [applicationId, applicationNumber, bankNameKey]);

    const conversationId = searchParams.get("conversationId");

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-white">
            <ChatInterface
                role="bank"
                initialBank={initialBank}
                initialConversationId={conversationId || undefined}
                className="flex flex-1 h-full border-0 rounded-none overflow-hidden bg-white shadow-none mt-0 animate-fade-in text-gray-900"
            />
        </div>
    );
}
