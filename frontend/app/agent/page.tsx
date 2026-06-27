"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AgentRootPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/agent/dashboard");
    }, [router]);

    return (
        <div className="h-screen flex items-center justify-center bg-[#fcfaff]">
            <div className="w-12 h-12 border-4 border-[#6605c7]/20 border-t-[#6605c7] rounded-full animate-spin" />
        </div>
    );
}
