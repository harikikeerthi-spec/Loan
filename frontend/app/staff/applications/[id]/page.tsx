"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";

export default function ApplicationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    useEffect(() => {
        if (id) {
            adminApi.getApplication(id)
                .then((res: any) => {
                    const app = res?.data || res;
                    const targetUserId = app?.userId || app?.studentId || app?.user?.id || app?.applicantId || app?.user_id;
                    if (targetUserId) {
                        router.replace(`/staff/users/${targetUserId}/applications`);
                    } else {
                        router.replace("/staff/users");
                    }
                })
                .catch(() => {
                    router.replace("/staff/users");
                });
        } else {
            router.replace("/staff/users");
        }
    }, [id, router]);

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
        </div>
    );
}
