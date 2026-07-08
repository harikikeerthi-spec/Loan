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
    );
}
