
"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ChatInterface from "@/components/Chat/ChatInterface";
import { useAgent } from "../AgentContext";

function AgentChatStaffContent() {
    const { autoStartUser } = useAgent();
    const searchParams = useSearchParams();
    const studentId = searchParams.get("studentId") || undefined;
    const sendLead = searchParams.get("sendLead") !== "false";

    return (
        <ChatInterface
            role="agent"
            chatContext="staff"
            initialUser={autoStartUser}
            portalTitle="RM Discussions"
            initialStudentId={studentId}
            autoSendLead={sendLead}
        />
    );
}

export default function AgentChatStaff() {
    return (
        <Suspense fallback={
            <div className="flex h-[800px] items-center justify-center bg-white border border-[#E2E8F0] rounded-[2.5rem] mt-6">
                <div className="w-8 h-8 border-3 border-[#5A42E4]/20 border-t-[#5A42E4] rounded-full animate-spin" />
            </div>
        }>
            <AgentChatStaffContent />
        </Suspense>
=======
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
>>>>>>> fd4765f9ad54da17f0772121e15751626c0a990c
    );
}
