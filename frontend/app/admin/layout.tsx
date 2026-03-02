"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isAdmin, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && pathname !== "/admin/login") {
            if (!isAuthenticated) {
                router.replace("/admin/login?redirect=" + encodeURIComponent(pathname));
            } else if (!isAdmin) {
                router.replace("/dashboard");
            }
        }
    }, [isAdmin, isLoading, isAuthenticated, router, pathname]);

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-transparent">
                <div className="w-12 h-12 border-4 border-[#6605c7]/20 border-t-[#6605c7] rounded-full animate-spin" />
            </div>
        );
    }

    if (pathname === "/admin/login") return <>{children}</>;

    if (!isAuthenticated || !isAdmin) return null;

    return <>{children}</>;
}
