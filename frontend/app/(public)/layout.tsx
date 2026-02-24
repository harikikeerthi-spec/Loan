import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen text-gray-900 bg-transparent relative overflow-x-hidden">
            <Navbar />
            <main className="relative z-10">{children}</main>
            <Footer />
        </div>
    );
}
