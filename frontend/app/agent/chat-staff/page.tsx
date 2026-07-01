"use client";

import React from "react";
import ChatInterface from "@/components/Chat/ChatInterface";
import { useAgent } from "../AgentContext";

export default function AgentChatStaff() {
    const { autoStartUser } = useAgent();

    if (autoStartUser) {
        return (
            <ChatInterface role="agent" initialUser={autoStartUser} portalTitle="Student Pipeline" />
        );
    }

    return (
        <ChatInterface role="staff" initialUser={null} portalTitle="Support Central" />
    );
}
