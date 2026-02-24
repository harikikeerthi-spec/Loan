import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen relative overflow-x-hidden">
            <Navbar />
            <main className="relative z-10">{children}</main>
            <Footer />
        </div>
    );
}
