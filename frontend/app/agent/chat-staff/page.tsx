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
        <ChatInterface 
            role="agent" 
            initialConversation={conversation} 
            portalTitle="Staff RM Line" 
        />
    );
}
