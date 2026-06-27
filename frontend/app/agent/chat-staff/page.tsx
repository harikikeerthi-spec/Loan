"use client";

import React from "react";
import ChatInterface from "@/components/Chat/ChatInterface";

export default function AgentChatStaff() {
    return (
        <ChatInterface role="staff" initialUser={null} portalTitle="Support Central" />
    );
}
