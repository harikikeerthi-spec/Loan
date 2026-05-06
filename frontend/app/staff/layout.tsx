"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
    const { isStaff, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && pathname !== "/staff/login") {
            if (!isAuthenticated) {
                router.replace("/staff/login?redirect=" + encodeURIComponent(pathname));
            } else if (!isStaff) {
                router.replace("/dashboard");
            }
        }
    }, [isStaff, isLoading, isAuthenticated, router, pathname]);

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-transparent">
                <div className="w-12 h-12 border-4 border-[#6605c7]/20 border-t-[#6605c7] rounded-full animate-spin" />
            </div>
        );
    }

    if (pathname === "/staff/login") return <>{children}</>;

    if (!isAuthenticated || !isStaff) return null;

    return <>{children}</>;
}
