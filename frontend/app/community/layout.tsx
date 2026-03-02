import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginWall from "@/components/LoginWall";

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen relative overflow-x-hidden">
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
