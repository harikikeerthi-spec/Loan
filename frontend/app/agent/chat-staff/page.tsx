"use client";

import React, { useEffect, useState } from "react";
import ChatInterface from "@/components/Chat/ChatInterface";
import { useAgent } from "../AgentContext";

export default function AgentChatStaff() {
    const { token } = useAgent();
    const [conversation, setConversation] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const connectToStaff = async () => {
            if (!token) return;
            try {
                const res = await fetch("/api/chat/connect", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    }
                });
                const data = await res.json();
                if (data.success && data.conversation) {
                    setConversation(data.conversation);
                }
            } catch (err) {
                console.error("Failed to connect to Staff RM", err);
            } finally {
                setLoading(false);
            }
        };

        connectToStaff();
    }, [token]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[500px] gap-3">
                <div className="w-9 h-9 border-3 border-[#6605c7]/20 border-t-[#6605c7] rounded-full animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#6605c7]/50">Connecting to counselor line...</span>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up space-y-6 relative z-10">
            <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#6605c7]">Dedicated Support Channel</span>
                <h2 className="text-2xl font-black text-gray-900 font-display mt-0.5">Staff RM Line</h2>
                <p className="text-xs text-gray-500 font-medium">Direct secure line to your assigned counselor, Neha Sharma</p>
            </div>
            
            <ChatInterface 
                role="agent" 
                initialConversation={conversation} 
                hideSidebar={true} 
                portalTitle="Staff RM Support" 
                className="flex h-[600px] border border-[#6605c7]/10 rounded-[2.5rem] overflow-hidden bg-[#FFFFFF] shadow-[0_24px_80px_rgba(102,5,199,0.04)] mt-4 animate-fade-in"
            />
        </div>
    );
}
