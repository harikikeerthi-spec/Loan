
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
            <Navbar />
            <main className="relative z-10">
                <LoginWall>
                    {children}
                </LoginWall>
            </main>
            <Footer />
        </div>
    );
}
