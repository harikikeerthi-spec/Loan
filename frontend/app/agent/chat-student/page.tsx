"use client";

import React from "react";
import ChatInterface from "@/components/Chat/ChatInterface";
import { useAgent } from "../AgentContext";

export default function AgentChatStudent() {
    const { autoStartUser } = useAgent();
    return (
        <ChatInterface role="agent" chatContext="student" initialUser={autoStartUser} portalTitle="Student Pipeline" />
    );
}
