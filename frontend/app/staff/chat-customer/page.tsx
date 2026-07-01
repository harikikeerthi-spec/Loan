"use client";

import { useSearchParams } from "next/navigation";
import ChatInterface from "@/components/Chat/ChatInterface";

export default function SupportChatPage() {
    const searchParams = useSearchParams();

    const userId = searchParams.get("userId") || searchParams.get("id");
    const email = searchParams.get("email");
    const firstName = searchParams.get("firstName");
    const lastName = searchParams.get("lastName");
    const phone = searchParams.get("phone") || searchParams.get("phoneNumber");
    const applicationId = searchParams.get("applicationId");
    const applicationNumber = searchParams.get("applicationNumber");

    const bankName = searchParams.get("bankName");

    // Reconstruct autoStart objects if present in query params
    const initialUser = userId ? {
        id: userId,
        email: email || "",
        firstName: firstName || "Student",
        lastName: lastName || "",
        phone: phone || "",
        phoneNumber: phone || "",
        applicationId: applicationId || undefined,
        applicationNumber: applicationNumber || undefined
    } : null;

    const initialBank = bankName ? {
        bankName: bankName,
        applicationId: applicationId || undefined,
        applicationNumber: applicationNumber || undefined
    } : null;

    return (
        <div className="h-[calc(100vh-56px)] flex flex-col bg-white">
            <ChatInterface
                role="staff"
                initialUser={initialUser}
                initialBank={initialBank}
                className="flex flex-1 h-full border-0 rounded-none overflow-hidden bg-white shadow-none mt-0 animate-fade-in text-gray-900"
            />
        </div>
    );
}
