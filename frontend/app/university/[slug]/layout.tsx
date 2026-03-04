
import LoginWall from "@/components/LoginWall";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function UniversityLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-transparent">
            {/* Navbar and Footer are hidden to use the custom integrated ones in the university page */}
            <main className="relative z-10">
                <LoginWall>
                    {children}
                </LoginWall>
            </main>
        </div>
    );
}
