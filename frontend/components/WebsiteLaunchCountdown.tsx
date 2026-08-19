"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Target launch date: 19-08-2026 11:09 AM IST
const DEFAULT_LAUNCH_DATE = "2026-08-19T11:09:00+05:30";

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
}

export default function WebsiteLaunchCountdown() {
    const router = useRouter();
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 1 });
    const [isMounted, setIsMounted] = useState<boolean>(false);
    const [isLaunched, setIsLaunched] = useState<boolean>(false);
    const [isLaunching, setIsLaunching] = useState<boolean>(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const targetDateStr = process.env.NEXT_PUBLIC_LAUNCH_DATE || DEFAULT_LAUNCH_DATE;
    const targetTimestamp = new Date(targetDateStr).getTime();

    // Check localStorage on mount
    useEffect(() => {
        setIsMounted(true);
        try {
            const hasLaunched = localStorage.getItem("vidyaloans_platform_launched");
            if (hasLaunched === "true") {
                setIsLaunched(true);
            }
        } catch { }
    }, []);

    // Completely hide global navbar (megamenu, apply loan, login) while countdown is active
    useEffect(() => {
        if (!isMounted) return;

        const mainNav = document.getElementById("mainNav");
        if (!isLaunched) {
            if (mainNav) {
                mainNav.style.setProperty("display", "none", "important");
            }
            document.body.style.overflow = "hidden";
        } else {
            if (mainNav) {
                mainNav.style.removeProperty("display");
            }
            document.body.style.overflow = "";
        }

        return () => {
            if (mainNav) {
                mainNav.style.removeProperty("display");
            }
            document.body.style.overflow = "";
        };
    }, [isMounted, isLaunched]);

    // Countdown tick
    useEffect(() => {
        if (!isMounted || isLaunched) return;

        const calculateTimeLeft = (): TimeLeft => {
            const now = Date.now();
            const difference = targetTimestamp - now;

            if (difference <= 0) {
                return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            return { days, hours, minutes, seconds, total: difference };
        };

        setTimeLeft(calculateTimeLeft());

        const interval = setInterval(() => {
            const updated = calculateTimeLeft();
            setTimeLeft(updated);
        }, 1000);

        return () => clearInterval(interval);
    }, [isMounted, isLaunched, targetTimestamp]);

    // Confetti Animation on Launch
    const triggerConfetti = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            color: string;
            rotation: number;
            rotationSpeed: number;
            opacity: number;
        }> = [];

        const colors = ["#8b24e5", "#6605c7", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#e040fb"];

        for (let i = 0; i < 280; i++) {
            particles.push({
                x: canvas.width / 2 + (Math.random() - 0.5) * 350,
                y: canvas.height / 2 + (Math.random() - 0.5) * 150,
                vx: (Math.random() - 0.5) * 28,
                vy: (Math.random() - 0.85) * 28,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 15,
                opacity: 1,
            });
        }

        let animationFrameId: number;
        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            let activeCount = 0;
            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.45;
                p.vx *= 0.98;
                p.rotation += p.rotationSpeed;
                p.opacity -= 0.007;

                if (p.opacity > 0) {
                    activeCount++;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = Math.max(0, p.opacity);
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
                    ctx.restore();
                }
            });

            if (activeCount > 0) {
                animationFrameId = requestAnimationFrame(render);
            }
        };

        render();
    };

    const handleLaunchClick = () => {
        setIsLaunching(true);
        triggerConfetti();

        setTimeout(() => {
            try {
                localStorage.setItem("vidyaloans_platform_launched", "true");
            } catch { }
            setIsLaunched(true);
            setIsLaunching(false);
            // Smoothly reveals the home page directly
        }, 1200);
    };

    const handleResetLaunch = () => {
        try {
            localStorage.removeItem("vidyaloans_platform_launched");
        } catch { }
        setIsLaunched(false);
    };

    if (!isMounted || isLaunched) return null;

    const isTimerFinished = timeLeft.total <= 0;

    return (
        <>
            {/* Google Fonts & Custom Keyframe Styles */}
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

                .font-script {
                    font-family: 'Caveat', cursive, sans-serif;
                }

                .text-gradient {
                    background: linear-gradient(135deg, #9333EA 0%, #C026D3 50%, #EC4899 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                @keyframes floatSlow {
                    0%, 100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-8px);
                    }
                }

                @keyframes floatBadge1 {
                    0%, 100% {
                        transform: translateY(0px) rotate(0deg);
                    }
                    50% {
                        transform: translateY(-6px) rotate(-1deg);
                    }
                }

                @keyframes floatBadge2 {
                    0%, 100% {
                        transform: translateY(0px) rotate(0deg);
                    }
                    50% {
                        transform: translateY(-7px) rotate(1.5deg);
                    }
                }

                .float-slow {
                    animation: floatSlow 5s ease-in-out infinite;
                }

                .float-badge-1 {
                    animation: floatBadge1 4s ease-in-out infinite;
                }

                .float-badge-2 {
                    animation: floatBadge2 4.5s ease-in-out infinite 0.5s;
                }
            `}</style>

            <div
                className={`fixed inset-0 z-[999999] flex flex-col justify-between overflow-y-auto bg-gradient-to-b from-[#FAF5FF] via-[#F6EEFE] to-[#F1E4FC] text-slate-900 transition-all duration-1000 ${isLaunching ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
                    }`}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
                {/* Confetti Canvas */}
                <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />

                {/* Top Brand Bar */}
                <header className="relative z-20 w-full border-b border-purple-100/60 bg-white/70 backdrop-blur-xl">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
                        <div className="flex items-center gap-3">
                            <Image
                                src="/images/vidyaloans-logo-transparent.png"
                                alt="Vidya Loans Logo"
                                width={56}
                                height={56}
                                className="h-10 w-auto object-contain sm:h-12"
                                priority
                            />
                            <div>
                                <div className="text-lg font-black tracking-tight text-[#1a1626] sm:text-2xl leading-none">
                                    VIDYA <span className="text-gradient">LOANS</span>
                                </div>
                                <div className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide text-[#9333EA] mt-0.5">
                                    PRESENTED BY BMK STUDY ABROAD CONSULTANTS
                                </div>
                            </div>
                        </div>

                        {/* Right Top Badge */}
                        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white text-xs font-black uppercase tracking-wider shadow-md shadow-pink-500/25">
                            <span className="material-symbols-outlined text-sm animate-bounce">notifications</span>
                            <span>COMING SOON</span>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="mx-auto max-w-7xl px-4 pt-6 pb-8 sm:px-6 lg:pt-10 w-full my-auto">
                    <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
                        {/* Left Column: Typography, Badges, Countdown & Notice */}
                        <div>
                            <p className="font-script text-3xl md:text-4xl text-[#9333EA] font-bold">
                                Something Big is
                            </p>
                            <h1 className="mt-1 text-[clamp(3.2rem,8vw,5.4rem)] leading-[0.92] font-[900] tracking-[-0.03em] text-[#1a1626]">
                                <span className="block">COMING</span>
                                <span className="text-gradient block">SOON!</span>
                            </h1>

                            {/* Badges Side-by-Side */}
                            <div className="mt-5 flex flex-wrap items-center gap-2.5">
                                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#9333EA] via-[#A855F7] to-[#EC4899] px-4 py-1.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-purple-500/20">
                                    <span className="material-symbols-outlined text-sm">school</span>
                                    <span>Smart Loans for Bright Minds</span>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full bg-white/90 border border-purple-200 px-4 py-1.5 text-xs sm:text-sm font-bold text-[#7E22CE] shadow-xs">
                                    <span className="material-symbols-outlined text-sm text-[#9333EA]">apartment</span>
                                    <span>Presented by BMK Study Abroad Consultants</span>
                                </div>
                            </div>

                            {/* Launch Timer Countdown Box (Below the Badges) */}
                            <div className="mt-6 w-full max-w-xl rounded-[2rem] p-5 sm:p-6 bg-white/85 backdrop-blur-xl border border-purple-200/80 shadow-xl shadow-purple-950/5">
                                <p className="mb-3.5 text-xs font-black tracking-[0.25em] text-[#9333EA] uppercase flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base text-[#9333EA]">schedule</span>
                                    Launching in
                                </p>

                                {!isTimerFinished ? (
                                    <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5">
                                        {[
                                            { label: "Days", value: timeLeft.days },
                                            { label: "Hours", value: timeLeft.hours },
                                            { label: "Minutes", value: timeLeft.minutes },
                                            { label: "Seconds", value: timeLeft.seconds },
                                        ].map((u) => (
                                            <div
                                                key={u.label}
                                                className="rounded-2xl border border-purple-100/90 bg-purple-50/60 px-2 py-3.5 text-center shadow-xs transition-all sm:px-4 sm:py-4 hover:scale-102"
                                            >
                                                <div className="text-2xl font-black tabular-nums sm:text-4xl text-gradient font-mono">
                                                    {String(u.value).padStart(2, "0")}
                                                </div>
                                                <div className="mt-1 text-[0.62rem] font-bold tracking-[0.2em] text-slate-500 uppercase sm:text-xs">
                                                    {u.label}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-2 animate-fade-in-up flex flex-col items-center justify-center text-center">
                                        <button
                                            type="button"
                                            onClick={handleLaunchClick}
                                            disabled={isLaunching}
                                            className="h-14 px-10 text-base font-black tracking-wider uppercase bg-gradient-to-r from-[#9333EA] via-[#A855F7] to-[#EC4899] text-white rounded-full shadow-xl shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer mx-auto"
                                        >
                                            <span className="material-symbols-outlined text-xl">rocket_launch</span>
                                            <span>{isLaunching ? "Launching Platform..." : "Launch VidyaLoans"}</span>
                                        </button>
                                    </div>
                                )}

                                <p className="mt-3.5 text-xs text-slate-500 text-center">
                                    Go live: <span className="font-bold text-[#1a1626]">19 August 2026 • 11:09 AM IST</span>
                                </p>
                            </div>

                            {/* Sub-Notification Pill (At the Last) */}
                            <div className="mt-6 inline-flex max-w-md items-center gap-3 rounded-2xl px-4 py-2.5 bg-white/80 border border-purple-100 text-slate-700 text-xs font-semibold shadow-xs">
                                <span className="material-symbols-outlined text-base text-[#9333EA]">notifications_active</span>
                                <p>
                                    Big things are on the horizon.{" "}
                                    <strong className="text-[#9333EA]">Stay tuned!</strong>
                                </p>
                            </div>
                        </div>

                        {/* Right Column: 3D Illustration */}
                        <div className="relative">
                            <div className="overflow-hidden rounded-[2rem] border border-purple-200/80 bg-white/80 shadow-2xl shadow-purple-900/10 float-slow">
                                <Image
                                    src="/images/hero-3d.jpg"
                                    alt="3D illustration of students planning their abroad education"
                                    width={1280}
                                    height={1024}
                                    className="h-full w-full object-cover"
                                    priority
                                />
                            </div>

                            {/* Floating Badges */}
                            <div className="absolute -top-3 -left-3 hidden sm:inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-bold bg-white/95 border border-purple-100 text-[#7E22CE] shadow-lg float-badge-1">
                                <span className="font-extrabold">%</span>
                                <span>Affordable Plans</span>
                            </div>

                            <div className="absolute -top-4 right-6 hidden md:inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-bold bg-white/95 border border-purple-100 text-amber-600 shadow-lg float-badge-2">
                                <span>⭐</span>
                                <span>Bright Future</span>
                            </div>

                            <div className="absolute -right-2 bottom-8 hidden sm:inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold bg-white/95 border border-purple-100 text-[#1a1626] shadow-lg float-badge-1">
                                <span className="material-symbols-outlined text-sm text-[#9333EA]">school</span>
                                <span>Fuel Your Education</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
