"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StaffRootPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/staff/dashboard");
    }, [router]);

    return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <div className="w-8 h-8 border-4 border-[#4F46E5]/20 border-t-[#4F46E5] rounded-full animate-spin" />
        </div>
    );
}
