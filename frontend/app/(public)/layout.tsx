"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginWall from "@/components/LoginWall";
import { usePathname } from "next/navigation";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isConnectedPage = pathname === "/connected";
    const isVisaMockPage = pathname === "/visa-mock";
    const showHeaderFooter = !isConnectedPage && !isVisaMockPage;

    return (
        <div className="min-h-screen text-gray-900 bg-transparent relative overflow-x-hidden">
            {showHeaderFooter && <Navbar />}
            <main className="relative z-10">
                <LoginWall>
                    {children}
                </LoginWall>
            </main>
            {showHeaderFooter && <Footer />}
        </div>
    );
}
