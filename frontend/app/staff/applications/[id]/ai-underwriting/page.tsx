"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AiUnderwritingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    useEffect(() => {
        if (id) {
            router.replace(`/staff/applications?id=${encodeURIComponent(id)}`);
        } else {
            router.replace("/staff/applications");
        }
    }, [id, router]);

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
        </div>
    );
}
