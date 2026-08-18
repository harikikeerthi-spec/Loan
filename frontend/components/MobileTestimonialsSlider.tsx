"use client";

import React, { useState } from "react";

interface TestimonialItem {
    name: string;
    school: string;
    quote: string;
    highlight?: string;
    highlightLabel?: string;
    rating?: number;
    avatar?: string;
    bg?: string;
    icon?: string;
}

interface MobileTestimonialsSliderProps {
    testimonials: TestimonialItem[];
}

export default function MobileTestimonialsSlider({ testimonials }: MobileTestimonialsSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!testimonials || testimonials.length === 0) return null;

    const current = testimonials[currentIndex] || testimonials[0];

    const styles = [
        { bg: "bg-[#e7e1f7]", border: "border-[#6605c7]/20", accent: "text-[#6605c7]" },
        { bg: "bg-[#fdfaf2]", border: "border-amber-200/80", accent: "text-amber-600" },
        { bg: "bg-[#e1f0f7]", border: "border-blue-200/80", accent: "text-blue-600" },
    ];
    const activeStyle = styles[currentIndex % styles.length];

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    return (
        <div className="block md:hidden w-full my-6">
            <div className={`p-6 rounded-2xl ${activeStyle.bg} border ${activeStyle.border} shadow-xl transition-all duration-300`}>
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm p-0.5 border border-white/80">
                        <span className={`text-sm font-black ${activeStyle.accent}`}>
                            {current.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 leading-tight truncate">{current.name}</h4>
                        <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{current.school}</p>
                        <div className="flex gap-0.5 mt-1" role="img" aria-label="5 out of 5 stars">
                            {[...Array(5)].map((_, i) => (
                                <span key={i} className={`material-symbols-outlined text-xs ${activeStyle.accent}`}>star</span>
                            ))}
                        </div>
                    </div>
                    <span className="text-[10px] font-black text-gray-400 bg-white/70 px-2 py-0.5 rounded-full border border-gray-200/60">
                        {currentIndex + 1} / {testimonials.length}
                    </span>
                </div>

                <p className="text-gray-700 text-xs leading-relaxed font-medium mb-4 italic">
                    "{current.quote}"
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-black/5 mb-4">
                    <div>
                        <div className={`text-base font-black ${activeStyle.accent}`}>{current.highlight || "5.0 ★"}</div>
                        <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{current.highlightLabel || "Verified Student"}</div>
                    </div>
                </div>

                {/* Next / Previous Buttons */}
                <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                        type="button"
                        onClick={handlePrev}
                        aria-label="Previous review"
                        className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-white/80 hover:bg-white text-gray-700 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer border border-gray-200/60"
                    >
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                        <span>Previous</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleNext}
                        aria-label="Next review"
                        className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-[#0F172A] hover:bg-black text-white text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                        <span>Next Review</span>
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
