'use client';

import React, { useState } from 'react';

const steps = [
    {
        id: 1,
        title: "Exploration",
        desc: "Identify your goals and find universities that match your profile.",
        icon: "search",
        tip: "Pro Tip: Research 12 months before you plan to fly!"
    },
    {
        id: 2,
        title: "Preparation",
        desc: "Ace your GRE/IELTS and gather your academic transcripts.",
        icon: "edit_calendar",
        tip: "Practice tests are key to mastering time management."
    },
    {
        id: 3,
        title: "Application",
        desc: "Submit your SOP and LORs with precision and narrative flair.",
        icon: "description",
        tip: "Personalize your SOP to show why you fit that specific university."
    },
    {
        id: 4,
        title: "Financing",
        desc: "Secure the best loan rates and disbursement help with VidhyaLoan.",
        icon: "payments",
        tip: "Check your pre-approved offers in under 2 minutes with us.",
        active: true
    },
    {
        id: 5,
        title: "Visa Success",
        desc: "Complete documentation and ace your consulate interview.",
        icon: "verified_user",
        tip: "Keep all your original financial proofs neatly organized."
    },
    {
        id: 6,
        title: "Departure",
        desc: "Pack your dreams! Join our global student community.",
        icon: "flight_takeoff",
        tip: "Join our pre-departure sessions to meet your future classmates."
    }
];

export default function JourneyPath() {
    const [hovered, setHovered] = useState<number | null>(null);

    return (
        <section className="py-24 bg-transparent overflow-hidden relative">
            {/* Heading */}
            <div className="max-w-7xl mx-auto px-6 text-center mb-20 relative z-10">
                <span className="text-[#6605c7] font-bold text-sm tracking-widest uppercase mb-4 block">The Guided Trail</span>
                <h2 className="text-4xl md:text-6xl font-bold font-display text-gray-900 mb-6">
                    Your <span className="text-[#6605c7] italic">Global Roadmap</span>
                </h2>
                <p className="text-gray-500 max-w-2xl mx-auto">
                    We guide you through every milestone, from the first spark of curiosity to your first lecture abroad.
                </p>
            </div>

            <div className="relative lg:pt-10 lg:pb-32">
                {/* Animated Background Path (Desktop only) */}
                <div className="absolute top-1/2 left-0 w-full h-1 overflow-visible pointer-events-none hidden lg:block opacity-30">
                    <svg className="w-full h-40 -mt-20 overflow-visible" preserveAspectRatio="none" viewBox="0 0 1200 160">
                        <path
                            d="M -50 80 C 150 0, 250 160, 400 80 C 550 0, 650 160, 800 80 C 950 0, 1050 160, 1250 80"
                            fill="none"
                            stroke="url(#pathGradient)"
                            strokeWidth="4"
                            strokeDasharray="12 12"
                            className="animate-dash"
                        />
                        <defs>
                            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#6605c7" stopOpacity="0.2" />
                                <stop offset="50%" stopColor="#6605c7" stopOpacity="1" />
                                <stop offset="100%" stopColor="#6605c7" stopOpacity="0.2" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-x-6 gap-y-20">
                        {steps.map((step, idx) => (
                            <div
                                key={step.id}
                                className={`group relative flex flex-col items-center text-center transition-all duration-700 ${idx % 2 === 0 ? 'lg:translate-y-12' : 'lg:-translate-y-12'}`}
                                onMouseEnter={() => setHovered(step.id)}
                                onMouseLeave={() => setHovered(null)}
                            >
                                {/* Circle & Icon */}
                                <div className={`w-28 h-28 rounded-3xl flex items-center justify-center relative mb-8 transition-all duration-500 shadow-xl border ${step.active ? 'bg-[#6605c7] text-white scale-125 border-white/20 z-20' : 'bg-white text-gray-400 border-gray-100 group-hover:scale-110 group-hover:bg-[#6605c7]/5 group-hover:text-[#6605c7] group-hover:border-[#6605c7]/20'}`}>

                                    {/* Pulse Effect for Active Only */}
                                    {step.active && (
                                        <div className="absolute inset-0 rounded-3xl bg-[#6605c7] animate-ping opacity-20"></div>
                                    )}

                                    {/* Glass reflection */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    <span className="material-symbols-outlined text-4xl group-hover:rotate-12 transition-transform">{step.icon}</span>

                                    {/* Step Number Badge */}
                                    <div className={`absolute -top-3 -left-3 w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shadow-lg shadow-purple-500/10 transition-colors ${step.active ? 'bg-white text-[#6605c7]' : 'bg-[#6605c7] text-white'}`}>
                                        {step.id}
                                    </div>

                                    {/* Connector for mobile/tablet */}
                                    {idx < steps.length - 1 && (
                                        <div className="absolute lg:hidden -bottom-12 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-[#6605c7]/30 to-transparent"></div>
                                    )}
                                </div>

                                {/* Text Content */}
                                <div className="space-y-3 px-4 max-w-[200px]">
                                    <h3 className={`text-xl font-black tracking-tight transition-colors duration-300 ${step.active || hovered === step.id ? 'text-[#6605c7]' : 'text-gray-900'}`}>
                                        {step.title}
                                    </h3>
                                    <p className={`text-xs leading-relaxed font-bold transition-colors duration-300 ${step.active || hovered === step.id ? 'text-gray-700' : 'text-gray-400'}`}>
                                        {step.desc}
                                    </p>
                                </div>

                                {/* Tooltip / Detail Box */}
                                <div className={`absolute top-full mt-4 left-1/2 -translate-x-1/2 w-56 p-5 bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-[#6605c7]/10 z-50 transition-all duration-500 pointer-events-none ${hovered === step.id ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-90'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1 h-4 bg-[#6605c7] rounded-full"></div>
                                        <span className="text-[10px] text-[#6605c7] font-black uppercase tracking-widest">Expert Tip</span>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed font-semibold italic">"{step.tip}"</p>

                                    {/* Triangle Arrow */}
                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/90 rotate-45 border-l border-t border-[#6605c7]/10"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* View More Details CTA */}
            <div className="mt-40 text-center">
                <button className="px-8 py-3 bg-[#6605c7]/5 hover:bg-[#6605c7] hover:text-white text-[#6605c7] font-bold rounded-full transition-all border border-[#6605c7]/10 group">
                    <span className="flex items-center gap-2">
                        Get Detailed Roadmap <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </span>
                </button>
            </div>
        </section>
    );
}
