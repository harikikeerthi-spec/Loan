"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    const displayName = user
        ? user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.email
        : "";

    return (
        <nav
            id="mainNav"
            className={`fixed top-0 w-full px-6 py-6 flex justify-center items-center z-50 transition-all duration-500 ${scrolled
                ? "bg-[rgba(17,8,26,0.9)] backdrop-blur-xl border-b border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.2)] !py-4"
                : "bg-transparent"
                }`}
        >
            <div className="w-full max-w-7xl flex justify-between items-center">
                {/* Logo */}
                <div className="flex items-center gap-8 lg:gap-12">
                    <Link href="/" className="flex items-center gap-2 group cursor-pointer relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-[#6605c7]/10 flex items-center justify-center shadow-lg backdrop-blur-sm border border-[#6605c7]/20">
                            <span className="material-symbols-outlined text-2xl text-[#6605c7]">school</span>
                        </div>
                        <span className={`font-bold text-2xl tracking-tight font-display transition-colors duration-500 ${scrolled ? "text-white" : "text-[#1a1626]"}`}>
                            VidhyaLoan
                        </span>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden lg:flex items-center gap-1">
                        {/* Loans Mega Menu */}
                        <div className="group/nav relative px-3 py-4">
                            <button className={`nav-link flex items-center gap-1 text-sm font-bold uppercase tracking-wider transition-colors duration-500 ${scrolled ? "!text-white" : "text-[#190f23]/90"}`}>
                                Loans
                            </button>
                            <div className="absolute top-full -left-4 w-[600px] pt-4 opacity-0 invisible translate-y-2 group-hover/nav:opacity-100 group-hover/nav:visible group-hover/nav:translate-y-0 transition-all duration-300 ease-out z-50">
                                <div className="bg-white/95 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 pl-3">Calculators</h3>
                                            <NavItem href="/emi" icon="calculate" title="EMI Calculator" desc="Plan your monthly repayments" />
                                            <NavItem href="/loan-eligibility" icon="smart_toy" title="Eligibility Checker" desc="Check your approval chances" color="text-blue-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 pl-3">Compare & Apply</h3>
                                            <NavItem href="/compare-loans" icon="compare" title="Compare Loans" desc="Find the best interest rates" color="text-orange-500" />
                                            <NavItem href="/bank-reviews" icon="rate_review" title="Bank Reviews" desc="Real feedback from students" color="text-green-500" />
                                        </div>
                                    </div>
                                    <Link href="/apply-loan" className="mt-4 flex items-center justify-center w-full py-3 bg-gradient-to-r from-primary to-purple-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:shadow-lg transition-all">
                                        Apply Now <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Services Mega Menu */}
                        <div className="group/nav relative px-3 py-4">
                            <button className={`nav-link flex items-center gap-1 text-sm font-bold uppercase tracking-wider transition-colors duration-500 ${scrolled ? "!text-white" : "text-[#190f23]/90"}`}>
                                Services
                            </button>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-[600px] pt-4 opacity-0 invisible translate-y-2 group-hover/nav:opacity-100 group-hover/nav:visible group-hover/nav:translate-y-0 transition-all duration-300 ease-out z-50">
                                <div className="bg-white/95 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-8">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#6605c7] mb-4 border-b border-primary/20 pb-2">Planning</h3>
                                            <NavItem href="/onboarding" icon="rocket_launch" title="Get Started" desc="Personalized loan journey" />
                                            <NavItem href="/repayment-stress" icon="monitoring" title="Stress Simulator" desc="Test repayment scenarios" />
                                            <NavItem href="/grade-converter" icon="grade" title="Grade Converter" desc="Convert GPA to percentage" />
                                        </div>
                                        <div>
                                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-pink-500 mb-4 border-b border-pink-500/20 pb-2">Application</h3>
                                            <NavItem href="/sop-writer" icon="auto_fix_high" title="AI SOP Writer" desc="Generate statements instantly" color="text-pink-500" />
                                            <NavItem href="/admit-predictor" icon="insights" title="Admit Predictor" desc="Chance of acceptance" color="text-pink-500" />
                                            <NavItem href="/compare-universities" icon="school" title="Compare Universities" desc="Find your best fit" color="text-purple-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Community */}
                        <div className="group/nav relative px-3 py-4">
                            <button className={`nav-link flex items-center gap-1 text-sm font-bold uppercase tracking-wider transition-colors duration-500 ${scrolled ? "!text-white" : "text-[#190f23]/90"}`}>
                                Community
                            </button>
                            <div className="absolute top-full -left-20 w-[500px] pt-4 opacity-0 invisible translate-y-2 group-hover/nav:opacity-100 group-hover/nav:visible group-hover/nav:translate-y-0 transition-all duration-300 ease-out z-50">
                                <div className="bg-white/95 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
                                    <div className="grid grid-cols-5 h-full">
                                        <div className="col-span-2 bg-gradient-to-br from-primary to-purple-800 p-6 flex flex-col justify-between">
                                            <div>
                                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white mb-4">
                                                    <span className="material-symbols-outlined text-xl">groups</span>
                                                </div>
                                                <h3 className="text-white font-display text-xl font-bold mb-2">Join the Club</h3>
                                                <p className="text-blue-100 text-xs leading-relaxed">Connect with 10k+ students worldwide.</p>
                                            </div>
                                            <Link href={isAuthenticated ? "/explore" : "/login"} className="mt-6 px-4 py-2.5 bg-white text-[#6605c7] rounded-xl text-xs font-bold text-center hover:bg-gray-50">
                                                Join Community
                                            </Link>
                                        </div>
                                        <div className="col-span-3 p-6">
                                            <NavItem href="/explore" icon="forum" title="Discussions" desc="Ask questions, get answers" color="text-yellow-500" />
                                            <NavItem href="/blog" icon="article" title="Blogs" desc="Latest news and guides" color="text-blue-500" />
                                            <NavItem href="/community-events" icon="event" title="Events & Webinars" desc="Upcoming sessions" color="text-red-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Link href="/about-us" className={`nav-link px-3 py-4 text-sm font-bold uppercase tracking-wider transition-colors duration-500 ${scrolled ? "!text-white" : "text-[#190f23]/90"}`}>Company</Link>
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-4">
                    {!isAuthenticated ? (
                        <Link
                            href="/login"
                            className="px-6 py-2.5 text-xs font-bold bg-white text-[#6605c7] uppercase tracking-wider rounded-full hover:bg-gray-100 transition-all shadow-lg cursor-pointer"
                        >
                            Login
                        </Link>
                    ) : (
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setProfileOpen((p) => !p)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border ${scrolled ? "border-white/20 bg-white/10" : "border-[#E5E7EB] bg-white/80"} shadow-sm hover:shadow-md`}
                            >
                                <div className="w-8 h-8 rounded-full bg-[#6605c7]/10 flex items-center justify-center overflow-hidden border border-[#6605c7]/20">
                                    <Image
                                        src={`https://i.pravatar.cc/80?u=${user?.email}`}
                                        alt="Avatar"
                                        width={32}
                                        height={32}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span className={`text-xs font-bold px-1 hidden md:block max-w-[150px] truncate transition-colors duration-500 ${scrolled ? "text-white" : "text-[#1a1626]"}`}>
                                    {displayName}
                                </span>
                            </button>

                            {profileOpen && (
                                <div className="absolute top-14 right-0 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 w-64 overflow-hidden">
                                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-purple-500/5">
                                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Logged in as</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">{user?.email}</p>
                                    </div>
                                    <div className="py-2">
                                        <ProfileDropItem href="/dashboard" icon="dashboard" label="Dashboard" iconClass="text-[#6605c7]" />
                                        <ProfileDropItem href="/profile" icon="person" label="My Profile" iconClass="text-[#6605c7]" />
                                    </div>
                                    <div className="border-t border-gray-200 p-2">
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center justify-center gap-2 w-full px-4 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors uppercase tracking-wider"
                                        >
                                            <span className="material-symbols-outlined text-sm">logout</span>
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mobile hamburger */}
                    <button
                        className={`lg:hidden w-9 h-9 rounded-full flex items-center justify-center transition-colors ${scrolled ? "bg-white/10 text-white" : "bg-[#190f23]/5 text-[#190f23]"}`}
                        onClick={() => setMobileOpen((o) => !o)}
                    >
                        <span className="material-symbols-outlined">{mobileOpen ? "close" : "menu"}</span>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="absolute top-full left-0 w-full bg-white/98 backdrop-blur-xl border-t border-gray-100 p-6 flex flex-col gap-4 lg:hidden shadow-xl">
                    <MobileLink href="/" label="Home" onClick={() => setMobileOpen(false)} />
                    <MobileLink href="/emi" label="EMI Calculator" onClick={() => setMobileOpen(false)} />
                    <MobileLink href="/compare-loans" label="Compare Loans" onClick={() => setMobileOpen(false)} />
                    <MobileLink href="/explore" label="Community" onClick={() => setMobileOpen(false)} />
                    <MobileLink href="/blog" label="Blog" onClick={() => setMobileOpen(false)} />
                    <MobileLink href="/sop-writer" label="AI Tools" onClick={() => setMobileOpen(false)} />
                    {isAuthenticated ? (
                        <>
                            <MobileLink href="/dashboard" label="Dashboard" onClick={() => setMobileOpen(false)} />
                            <button onClick={handleLogout} className="text-left text-red-500 font-bold text-sm">Sign Out</button>
                        </>
                    ) : (
                        <MobileLink href="/login" label="Login" onClick={() => setMobileOpen(false)} />
                    )}
                </div>
            )}
        </nav>
    );
}

function NavItem({ href, icon, title, desc, color = "text-[#6605c7]" }: {
    href: string; icon: string; title: string; desc: string; color?: string;
}) {
    return (
        <Link href={href} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-all group/item">
            <div className={`w-10 h-10 rounded-xl bg-current/10 flex items-center justify-center ${color} transition-all`} style={{ background: "rgba(102,5,199,0.08)" }}>
                <span className="material-symbols-outlined text-xl">{icon}</span>
            </div>
            <div>
                <div className={`font-bold text-gray-900 text-sm group-hover/item:${color} transition-colors`}>{title}</div>
                <div className="text-[11px] text-gray-500 leading-tight mt-1">{desc}</div>
            </div>
        </Link>
    );
}

function ProfileDropItem({ href, icon, label, iconClass }: {
    href: string; icon: string; label: string; iconClass?: string;
}) {
    return (
        <Link href={href} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <span className={`material-symbols-outlined text-lg ${iconClass}`}>{icon}</span>
            <span className="font-semibold">{label}</span>
        </Link>
    );
}

function MobileLink({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
    return (
        <Link href={href} onClick={onClick} className="text-gray-900 font-bold text-sm py-2 border-b border-gray-100">
            {label}
        </Link>
    );
}
