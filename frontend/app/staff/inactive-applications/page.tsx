"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InactiveApplicationsRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/staff/inactive-pipeline");
    }, [router]);

    return (
        <div className="h-96 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#4F46E5]/20 border-t-[#4F46E5] rounded-full animate-spin" />
        </div>
    );
}
