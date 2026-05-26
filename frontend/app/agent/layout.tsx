"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isAgent = user?.role === 'agent' || user?.role === 'partner_agent' || user?.role === 'admin' || user?.role === 'super_admin';

    useEffect(() => {
        if (!isLoading && pathname !== "/agent/login") {
            if (!isAuthenticated) {
                router.replace("/agent/login?redirect=" + encodeURIComponent(pathname));
            } else if (!isAgent) {
                router.replace("/dashboard");
            }
        }
    }, [isAgent, isLoading, isAuthenticated, router, pathname]);

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-transparent">
                <div className="w-12 h-12 border-4 border-[#6605c7]/20 border-t-[#6605c7] rounded-full animate-spin" />
            </div>
        );
    }

    if (pathname === "/agent/login") return <>{children}</>;

    if (!isAuthenticated || !isAgent) return null;

    return <>{children}</>;
}
