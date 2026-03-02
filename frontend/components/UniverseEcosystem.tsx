'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

const universeItems = [
    {
        id: 1,
        title: 'TRENDING Courses',
        subtitle: 'Global Academic Trends',
        desc: 'Stay ahead of the curve with courses that are shaping the future. From AI to Sustainable Energy, discover what\'s in demand.',
        icon: '📚',
        materialIcon: 'auto_stories',
        color: '#a855f7', // Purple
        gradient: 'linear-gradient(135deg, #a855f7, #6605c7)',
        label: 'Hot',
        bgImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        stats: '1,200+ Courses',
        cta: 'Browse Courses'
    },
    {
        id: 2,
        title: 'POPULAR Universities',
        subtitle: 'Elite Institution Network',
        desc: 'Connect with 500+ top-tier universities globally. Get insights into campus life, faculty, and research opportunities.',
        icon: '🏛️',
        materialIcon: 'account_balance',
        color: '#3b82f6', // Blue
        gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        label: 'Top',
        bgImage: 'https://images.unsplash.com/photo-1523050335392-93851179ae22?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        stats: '500+ Partners',
        cta: 'Explore Unis'
    },
    {
        id: 3,
        title: 'Exams Prep',
        subtitle: 'Master Your Scores',
        desc: 'Comprehensive prep tools for GRE, GMAT, IELTS, and TOEFL. Mock tests and AI-driven performance analytics.',
        icon: '✍️',
        materialIcon: 'edit_note',
        color: '#f59e0b', // Amber
        gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
        label: 'Pro',
        bgImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        stats: '98% Success Rate',
        cta: 'Start Prep'
    },
    {
        id: 4,
        title: 'HOT Scholarships',
        subtitle: 'Fund Your Future',
        desc: 'Access a curated list of scholarships worth millions. We help you find the financial support you deserve.',
        icon: '🏆',
        materialIcon: 'military_tech',
        color: '#10b981', // Emerald
        gradient: 'linear-gradient(135deg, #10b981, #059669)',
        label: 'Live',
        // Updated to a high-quality scholarship celebration image (removed unrelated burger image)
        bgImage: '/scholarship.png',
        stats: '₹50Cr+ Available',
        cta: 'Find Grants'
    },
    {
        id: 5,
        title: 'AI SOP Writer',
        subtitle: 'Draft with Precision',
        desc: 'Generate powerful Statements of Purpose tailored to your profile and university requirements.',
        icon: '🤖',
        materialIcon: 'psychology',
        color: '#ec4899', // Pink
        gradient: 'linear-gradient(135deg, #ec4899, #be185d)',
        label: 'Free',
        bgImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        stats: 'AI Powered',
        cta: 'Draft SOP'
    },
    {
        id: 6,
        title: 'Community Hub',
        subtitle: 'Connect & Grow',
        desc: 'Join a thriving community of 10,000+ students and alumni. Exchange tips, experiences, and opportunities.',
        icon: '🤝',
        materialIcon: 'groups',
        color: '#6366f1', // Indigo
        gradient: 'linear-gradient(135deg, #6366f1, #4338ca)',
        label: 'New',
        bgImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        stats: '10K+ Members',
        cta: 'Join Now'
    }
];

export default function UniverseEcosystem() {
    const [active, setActive] = useState(0);
    const [animating, setAnimating] = useState(false);

    const goTo = useCallback((idx: number) => {
        if (idx === active || animating) return;
        setAnimating(true);
        setTimeout(() => {
            setActive(idx);
            setAnimating(false);
        }, 200);
    }, [active, animating]);

    // Auto-advance
    useEffect(() => {
        const timer = setInterval(() => {
            setActive(prev => (prev + 1) % universeItems.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const currentItem = universeItems[active];

    return (
        <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, amount: 0.05 }}
            transition={{ duration: 0.4 }}
            className="py-24 bg-transparent relative overflow-hidden"
        >
            {/* Mesh Gradient Background */}
            <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-purple-500/5 rounded-full blur-[120px] -mr-[20vw] -mt-[20vw] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] bg-blue-500/5 rounded-full blur-[120px] -ml-[20vw] -mb-[20vw] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, x: -60 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col lg:flex-row items-end justify-between mb-16 gap-8 text-[#1a1626]"
                >
                    <div className="max-w-2xl text-center lg:text-left">
                        <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white shadow-lg shadow-purple-500/5 border border-purple-100/30 mb-5 group cursor-default">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#6605c7] animate-pulse" />
                            <span className="text-[11px] font-black text-[#6605c7] uppercase tracking-widest">The Global Ecosystem</span>
                            <span className="w-px h-3 bg-purple-100 mx-2" />
                            <span className="text-[10px] font-bold text-gray-400">Powered by GradRight Insights</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-[#1a1626] leading-[1.05] tracking-tight mb-6 uppercase">
                            Study Abroad <br />
                            <span className="italic" style={{ background: 'linear-gradient(135deg, #6605c7, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Universe</span>
                        </h2>
                        <p className="text-[13px] text-gray-500 font-medium leading-relaxed max-w-xl">
                            Everything you need to kickstart your global education journey, unified in one powerful, AI-driven platform with real-world ROI data.
                        </p>
                    </div>
                </motion.div>

                <div className="flex flex-col lg:flex-row gap-6 items-stretch h-full">
                    {/* LEFT: MASTER FEATURED CARD (Poster Style) */}
                    <motion.div
                        initial={{ opacity: 0, x: -80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false, amount: 0.2 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="flex-[1.3] relative group"
                    >
                        <div
                            key={active}
                            className="h-full min-h-[500px] bg-[#1a1626] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col relative animate-fade-in-up"
                        >
                            {/* Background Image with Parallax-like feel */}
                            <div className="absolute inset-0">
                                <Image
                                    src={currentItem.bgImage}
                                    alt={currentItem.title}
                                    fill
                                    className="object-cover opacity-50 scale-105 group-hover:scale-100 transition-transform duration-[10s]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1626] via-[#1a1626]/40 to-transparent" />
                            </div>

                            <div className="relative z-10 h-full p-8 lg:p-12 flex flex-col">
                                {/* Top Label */}
                                <div className="flex justify-between items-start mb-auto">
                                    <div className="px-5 py-2.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white font-black text-[11px] tracking-widest uppercase flex items-center gap-2.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
                                        {currentItem.stats}
                                    </div>
                                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-4xl shadow-2xl transition-transform hover:scale-110">
                                        {currentItem.icon}
                                    </div>
                                </div>

                                {/* Content Details */}
                                <div className="mt-12">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-8 h-0.5 bg-purple-500 rounded-full" />
                                        <span className="text-purple-300 font-bold tracking-[0.2em] uppercase text-[10px]">{currentItem.subtitle}</span>
                                    </div>
                                    <h3 className="text-3xl lg:text-5xl font-black text-white mb-6 tracking-tight leading-none uppercase">
                                        {currentItem.title}
                                    </h3>
                                    <p className="text-gray-300 text-sm font-medium leading-relaxed mb-8 max-w-lg">
                                        {currentItem.desc}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-5">
                                        <Link
                                            href="/search-universities"
                                            className="px-10 py-5 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] transition-all hover:opacity-95 active:scale-95 shadow-[0_20px_40px_-10px_rgba(102,5,199,0.3)]"
                                            style={{ background: currentItem.gradient }}
                                        >
                                            {currentItem.cta} →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT: INTERACTIVE SELECTION GRID */}
                    <motion.div
                        initial={{ opacity: 0, x: 80 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false, amount: 0.2 }}
                        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="flex-1 grid grid-cols-2 gap-4"
                    >
                        {universeItems.slice(0, 6).map((item, idx) => {
                            const isActive = active === idx;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => goTo(idx)}
                                    className={`relative group rounded-[1.5rem] overflow-hidden p-0.5 transition-all duration-500 scale-100 hover:scale-[1.02] active:scale-95 ${isActive ? 'bg-gradient-to-br from-[#6605c7] to-[#a855f7] shadow-xl shadow-purple-500/20' : 'bg-white/40 shadow-sm border border-white/50'}`}
                                >
                                    <div className="relative h-full w-full bg-white rounded-[1.4rem] overflow-hidden">
                                        <div className="relative h-full p-6 flex flex-col justify-end items-center text-center">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-3 transition-all duration-500 ${isActive ? 'bg-[#6605c7] text-white shadow-lg -translate-y-1' : 'bg-gray-50 text-gray-400 group-hover:bg-purple-50'}`}>
                                                {item.icon}
                                            </div>

                                            <div className={`text-[9px] font-black uppercase tracking-[0.15em] mb-1 transition-colors ${isActive ? 'text-[#6605c7]' : 'text-gray-400'}`}>
                                                {item.label}
                                            </div>
                                            <div className={`text-[12px] font-black tracking-tight leading-tight uppercase transition-colors ${isActive ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}`}>
                                                {item.title}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </motion.div>
                </div>

            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}} />
        </motion.section>
    );
}
