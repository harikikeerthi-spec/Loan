"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isAdmin, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.replace("/login?redirect=/admin");
            } else if (!isAdmin) {
                router.replace("/dashboard");
            }
        }
    }, [isAdmin, isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#0f0a18]">
                <div className="w-12 h-12 border-4 border-[#6605c7]/20 border-t-[#6605c7] rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated || !isAdmin) return null;

    return <>{children}</>;
}
