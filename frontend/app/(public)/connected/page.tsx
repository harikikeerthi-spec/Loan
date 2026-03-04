"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
    useInView,
    AnimatePresence
} from "framer-motion";

// --- Custom Hooks ---

function useMousePosition() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);
    return mousePosition;
}

// --- Components ---

const MagneticButton = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const { clientX, clientY } = e;
        const { left, top, width, height } = ref.current.getBoundingClientRect();
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        const distanceX = clientX - centerX;
        const distanceY = clientY - centerY;

        setPosition({ x: distanceX * 0.3, y: distanceY * 0.3 });
    };

    const resetPosition = () => setPosition({ x: 0, y: 0 });

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={resetPosition}
            animate={{ x: position.x, y: position.y }}
            transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

const StatItem = ({ label, value, prefix = "", suffix = "" }: { label: string; value: number; prefix?: string; suffix?: string }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (isInView) {
            let start = 0;
            const end = value;
            const duration = 2000;
            const increment = end / (duration / 16);

            const timer = setInterval(() => {
                start += increment;
                if (start >= end) {
                    setCount(end);
                    clearInterval(timer);
                } else {
                    setCount(Math.floor(start));
                }
            }, 16);
            return () => clearInterval(timer);
        }
    }, [isInView, value]);

    return (
        <div ref={ref} className="text-center p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10">
            <div className="text-4xl md:text-5xl font-black text-[#F7C600] mb-2 font-display">
                {prefix}{count.toLocaleString()}{suffix}
            </div>
            <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">{label}</div>
        </div>
    );
};

const SectionHeader = ({ subtitle, title, light = false }: { subtitle: string; title: string; light?: boolean }) => (
    <div className="mb-20">
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
        >
            <span className={`inline-block px-4 py-1.5 ${light ? "bg-black text-white" : "bg-[#F7C600] text-black"} text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-6`}>
                {subtitle}
            </span>
            <h2 className={`text-5xl md:text-7xl font-black ${light ? "text-black" : "text-white"} leading-[1.1] tracking-tighter italic font-display`}>
                {title}
            </h2>
        </motion.div>
    </div>
);

export default function ConnectedPage() {
    const [scrolled, setScrolled] = useState(false);
    const { scrollYProgress } = useScroll();
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
    const { x, y } = useMousePosition();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 80);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const heroImageY = useTransform(scrollYProgress, [0, 0.5], [0, 200]);

    return (
        <div className="bg-white min-h-screen font-sans selection:bg-[#F7C600] selection:text-black cursor-none">
            {/* Custom Cursor */}
            <motion.div
                className="fixed top-0 left-0 w-8 h-8 rounded-full border-2 border-[#F7C600] z-[1000] pointer-events-none mix-blend-difference hidden md:block"
                animate={{ x: x - 16, y: y - 16 }}
                transition={{ type: "spring", stiffness: 500, damping: 28, mass: 0.5 }}
            />
            <motion.div
                className="fixed top-0 left-0 w-2 h-2 rounded-full bg-[#F7C600] z-[1000] pointer-events-none hidden md:block"
                animate={{ x: x - 4, y: y - 4 }}
                transition={{ type: "spring", stiffness: 1000, damping: 40, mass: 0.1 }}
            />

            {/* Scroll Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-[#F7C600] z-[200] origin-left"
                style={{ scaleX: smoothProgress }}
            />

            {/* Navigation */}
            <nav className={`fixed top-0 w-full z-[100] transition-all duration-700 ${scrolled ? "bg-black/80 backdrop-blur-2xl py-4 border-b border-white/10" : "bg-transparent py-8"}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-3 group/logo cursor-pointer">
                        <div className="w-10 h-10 bg-[#F7C600] rounded-xl flex items-center justify-center rotate-3 group-hover/logo:rotate-0 transition-transform duration-500 shadow-lg relative">
                            <span className="material-symbols-outlined text-black font-bold">house</span>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity">
                                <span className="material-symbols-outlined text-[10px] text-black font-bold">arrow_back</span>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black tracking-tighter text-white font-display leading-none">
                                connect<span className="text-[#F7C600]">ED</span>
                            </span>
                            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[#F7C600] mt-1 group-hover/logo:text-white transition-colors">Back to VidhyaLoans</span>
                        </div>
                    </Link>

                    <div className="hidden lg:flex items-center gap-10">
                        {["Mission", "Experience", "Process", "Community"].map((item) => (
                            <Link key={item} href={`#${item.toLowerCase()}`} className="group relative text-white/60 hover:text-white text-[11px] font-black uppercase tracking-[0.3em] transition-colors">
                                {item}
                                <span className="absolute -bottom-2 left-0 w-0 h-px bg-[#F7C600] transition-all group-hover:w-full" />
                            </Link>
                        ))}
                    </div>

                    <MagneticButton>
                        <Link href="#apply" className="px-8 py-3 bg-[#F7C600] text-black text-[11px] font-black uppercase tracking-[0.4em] rounded-full hover:bg-white transition-all shadow-xl hover:shadow-[#F7C600]/20">
                            Apply
                        </Link>
                    </MagneticButton>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative h-screen min-h-[900px] bg-black overflow-hidden flex items-center">
                <motion.div style={{ y: heroImageY }} className="absolute inset-0 z-0">
                    <Image
                        src="/connected/hero.png"
                        alt="Background"
                        fill
                        className="object-cover opacity-50 scale-105"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80"></div>
                </motion.div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
                    <div className="max-w-4xl">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <span className="inline-flex items-center gap-3 px-5 py-2 bg-gradient-to-r from-[#F7C600] to-yellow-200 text-black text-[10px] font-black uppercase tracking-[0.4em] rounded-full mb-10 shadow-lg shadow-yellow-500/20">
                                <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
                                Admissions Ready Delhi Cohort
                            </span>

                            <h1 className="text-6xl md:text-[140px] font-black text-white leading-[0.85] tracking-[-0.05em] mb-12 italic font-display">
                                BUILD YOUR <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F7C600] via-white to-white">COHORT.</span>
                            </h1>

                            <div className="flex flex-col md:flex-row items-end gap-12">
                                <p className="text-white/50 text-xl font-medium max-w-xl leading-relaxed">
                                    A private circles of 30 hand-picked aspirants navigating the complex world of global education together. Offline meetings, masterclasses, and peer accountability.
                                </p>

                                <div className="flex gap-4">
                                    <MagneticButton>
                                        <Link href="#apply" className="w-16 h-16 rounded-full bg-[#F7C600] flex items-center justify-center text-black group hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined font-black group-hover:rotate-45 transition-transform">arrow_outward</span>
                                        </Link>
                                    </MagneticButton>
                                    <div className="flex flex-col justify-center">
                                        <span className="text-white font-black text-xs uppercase tracking-widest">Start Journey</span>
                                        <span className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Next Cohort Dec '25</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Vertical Sidebar Text */}
                <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center gap-20 select-none">
                    <div className="w-px h-32 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                    <span className="text-white/20 uppercase font-black text-[10px] tracking-[1em] rotate-90 whitespace-nowrap">INDIA'S FIRST PEER COMMUNITY</span>
                    <div className="w-px h-32 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                </div>
            </section>

            {/* Stats Ribbon */}
            <section className="bg-black py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <StatItem label="Active Aspirants" value={1000} suffix="+" />
                        <StatItem label="University Admits" value={450} suffix="+" />
                        <StatItem label="Scholarships Won" value={1.5} suffix="Cr" prefix="₹" />
                        <StatItem label="Community Experts" value={50} suffix="+" />
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section id="mission" className="py-40 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <SectionHeader subtitle="The Collective" title="PEER POWER OVER WEBINARS." light />

                    <div className="grid lg:grid-cols-3 gap-16">
                        <BenefitCard
                            icon="groups"
                            title="Curated Cohorts"
                            desc="We don't do thousands. We do thirty. Groups matched by profile, destination, and ambition level for maximum synergy."
                            delay={0.1}
                        />
                        <BenefitCard
                            icon="auto_stories"
                            title="Shared Milestones"
                            desc="Stop solo-grinding. Track SOPs, GRE scores, and Visa prep with a group that pushes you to beat every deadline."
                            delay={0.2}
                        />
                        <BenefitCard
                            icon="verified_user"
                            title="Unfiltered Alpha"
                            desc="Direct access to alumni from Ivy Leagues and top-tier globals. No sugar-coated marketing, only real-world hacks."
                            delay={0.3}
                        />
                    </div>
                </div>

                {/* Background decorative element */}
                <div className="absolute top-1/2 -right-40 w-[600px] h-[600px] bg-[#F7C600]/5 rounded-full blur-[120px] pointer-events-none" />
            </section>

            {/* Image Parallax Section */}
            <section id="experience" className="py-20 bg-black">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="relative h-[600px] rounded-[3rem] overflow-hidden group">
                        <Image
                            src="/connected/peer-power.png"
                            alt="Community"
                            fill
                            className="object-cover transition-transform duration-[2s] group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-700"></div>
                        <div className="absolute inset-0 flex items-center justify-center p-12 text-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 1 }}
                            >
                                <h3 className="text-4xl md:text-7xl font-black text-white italic font-display mb-8">
                                    YOUR NETWORK <br /> IS YOUR NET WORTH.
                                </h3>
                                <MagneticButton>
                                    <button className="px-12 py-5 bg-white text-black text-xs font-black uppercase tracking-[0.5em] rounded-full hover:bg-[#F7C600] transition-colors">
                                        Experience It
                                    </button>
                                </MagneticButton>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Experience Cards */}
            <section className="py-40 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-32 items-center">
                        <div className="order-2 lg:order-1">
                            <div className="grid grid-cols-2 gap-6 relative">
                                <motion.div
                                    className="col-span-1 space-y-6 pt-12"
                                    style={{ y: useTransform(scrollYProgress, [0.3, 0.6], [0, -100]) }}
                                >
                                    <PolaroidFrame image="/connected/mentor.png" angle="-5deg" />
                                    <PolaroidFrame image="/connected/hero.png" angle="3deg" />
                                </motion.div>
                                <motion.div
                                    className="col-span-1 space-y-6"
                                    style={{ y: useTransform(scrollYProgress, [0.3, 0.6], [0, 100]) }}
                                >
                                    <PolaroidFrame image="/connected/peer-power.png" angle="2deg" />
                                    <PolaroidFrame image="/connected/aspirant.png" angle="-4deg" />
                                </motion.div>

                                {/* Decorative "Scribble" or element */}
                                <div className="absolute -top-10 -left-10 w-40 h-40 border-t-2 border-l-2 border-[#F7C600] rounded-tl-[100px] opacity-20" />
                            </div>
                        </div>

                        <div className="order-1 lg:order-2">
                            <SectionHeader subtitle="The Journey" title="HOW WE MOVE." light />
                            <div className="space-y-12">
                                <TimelineStep
                                    number="01"
                                    title="Strategic Cohorting"
                                    desc="We match you with 29 others who share your goals, timeline, and intensity. This isn't a classroom; it's a team."
                                />
                                <TimelineStep
                                    number="02"
                                    title="Milestone Sprints"
                                    desc="Bi-weekly offline meetups in Delhi to smash goals—from university shortlisting to first draft SOP reviews."
                                />
                                <TimelineStep
                                    number="03"
                                    title="Expert Infiltration"
                                    desc="Access private Q&A sessions with admissions officers and alumni. Get the answers you can't find on Google."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Registration CTA */}
            <section id="apply" className="py-40 bg-black text-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-24 items-center">
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-12 h-12 bg-[#F7C600] rounded-2xl flex items-center justify-center -rotate-3">
                                    <span className="material-symbols-outlined text-black font-bold">celebration</span>
                                </div>
                                <span className="text-white/40 uppercase font-black text-[11px] tracking-[0.5em]">Delhi Edition</span>
                            </div>

                            <h2 className="text-7xl md:text-[120px] font-black text-white leading-none tracking-tighter italic mb-12 font-display">
                                APPLY <br /> TO THE <br /> <span className="text-[#F7C600]">CIRCLE.</span>
                            </h2>

                            <p className="text-white/40 text-xl font-medium max-w-lg mb-12 leading-relaxed">
                                Our December cohort is our most exclusive yet. Applications close November 30th. Strictly 30 seats.
                            </p>

                            <div className="flex items-center gap-8">
                                <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[#F7C600] text-3xl animate-bounce">arrow_downward</span>
                                </div>
                                <div>
                                    <span className="text-white font-black text-xs uppercase tracking-[0.3em] block mb-1">Scroll to Apply</span>
                                    <span className="text-white/20 text-[10px] uppercase font-bold tracking-[0.2em]">6,000+ Applications last month</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-3xl p-12 rounded-[3.5rem] border border-white/10 shadow-2xl"
                            >
                                <form className="space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black tracking-[0.5em] text-[#F7C600] px-2">Your Identity</label>
                                        <input type="text" placeholder="Johnathan Doe" className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-white placeholder:text-white/10 focus:outline-none focus:bg-white/10 focus:border-[#F7C600] transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black tracking-[0.5em] text-[#F7C600] px-2">Digital Address</label>
                                        <input type="email" placeholder="hello@aspirant.com" className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-white placeholder:text-white/10 focus:outline-none focus:bg-white/10 focus:border-[#F7C600] transition-all" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-black tracking-[0.5em] text-[#F7C600] px-2">Calling Code</label>
                                            <input type="tel" placeholder="+91" className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-white placeholder:text-white/10 focus:outline-none focus:bg-white/10 focus:border-[#F7C600] transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-black tracking-[0.5em] text-[#F7C600] px-2">Target Intake</label>
                                            <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-white focus:outline-none focus:bg-white/10 focus:border-[#F7C600] transition-all appearance-none cursor-pointer">
                                                <option>Fall 2026</option>
                                                <option>Spring 2026</option>
                                                <option>Fall 2027</option>
                                            </select>
                                        </div>
                                    </div>

                                    <MagneticButton>
                                        <button className="w-full py-6 bg-[#F7C600] hover:bg-white text-black text-xs font-black uppercase tracking-[0.6em] rounded-2xl shadow-xl transition-all">
                                            SEND INTENT
                                        </button>
                                    </MagneticButton>
                                </form>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Background Text Shadow */}
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
                    <span className="text-[40vw] font-black italic">CONNECTED</span>
                </div>
            </section>

            {/* Premium Footer */}
            <footer className="py-20 bg-white border-t border-gray-100 overflow-hidden relative">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col items-center gap-12">
                        <Link href="/" className="flex items-center gap-3 group/flogo cursor-pointer">
                            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center group-hover/flogo:bg-[#F7C600] transition-colors shadow-lg">
                                <span className="material-symbols-outlined text-[20px] text-[#F7C600] group-hover/flogo:text-black">house</span>
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-lg font-black tracking-tighter text-black font-display uppercase leading-none">
                                    connect<span className="text-gray-300">ED</span>
                                </span>
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#F7C600]">Return to VidhyaLoans</span>
                            </div>
                        </Link>

                        <div className="flex flex-wrap justify-center gap-12">
                            {["Instagram", "LinkedIn", "YouTube", "Discord"].map(social => (
                                <Link key={social} href="#" className="text-[11px] font-black uppercase tracking-[0.4em] text-black/30 hover:text-black transition-colors">
                                    {social}
                                </Link>
                            ))}
                        </div>

                        <div className="text-center space-y-4">
                            <p className="text-black/20 text-[10px] uppercase font-black tracking-[0.3em]">
                                A Subsidiary of VidhyaLoans Educational Services Pvt Ltd
                            </p>
                            <p className="text-black/50 text-[9px] font-bold uppercase tracking-[0.3em]">
                                &copy; {new Date().getFullYear()} All Rights Reserved. Stay Hungry.
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// --- Internal UI Components ---

function BenefitCard({ icon, title, desc, delay }: { icon: string; title: string; desc: string; delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay }}
            whileHover={{ y: -10 }}
            className="p-10 bg-gray-50 rounded-[3rem] border border-gray-100 hover:border-[#F7C600]/30 transition-all hover:shadow-2xl hover:shadow-[#F7C600]/5 group"
        >
            <div className="w-16 h-16 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-[#F7C600] transition-all duration-500">
                <span className="material-symbols-outlined text-black text-3xl group-hover:font-black">{icon}</span>
            </div>
            <h3 className="text-2xl font-black text-black mb-4 font-display italic tracking-tight uppercase">{title}</h3>
            <p className="text-black/40 font-medium leading-relaxed">
                {desc}
            </p>
        </motion.div>
    );
}

function PolaroidFrame({ image, angle }: { image: string; angle: string }) {
    return (
        <div
            className="bg-white p-4 pb-16 shadow-2xl border border-gray-100 relative group overflow-hidden rounded-sm"
            style={{ transform: `rotate(${angle})` }}
        >
            <div className="aspect-[4/5] overflow-hidden relative">
                <Image src={image} alt="Moment" fill className="object-cover group-hover:scale-110 transition-transform duration-1000 grayscale-[20%] group-hover:grayscale-0" />
            </div>
            {/* Gloss overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-100 rounded-full" />
        </div>
    );
}

function TimelineStep({ number, title, desc }: { number: string; title: string; desc: string }) {
    return (
        <motion.div
            className="flex gap-8 group"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
        >
            <div className="text-4xl md:text-5xl font-black text-gray-100 group-hover:text-[#F7C600] transition-colors font-display italic">
                {number}
            </div>
            <div className="pt-2">
                <h4 className="text-xl font-black text-black mb-2 uppercase tracking-tight">{title}</h4>
                <p className="text-black/40 font-medium leading-relaxed max-w-sm">
                    {desc}
                </p>
            </div>
        </motion.div>
    );
}
