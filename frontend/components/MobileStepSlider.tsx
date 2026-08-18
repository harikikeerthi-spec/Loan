"use client";

import React, { useState } from "react";
import Link from "next/link";

interface StepItem {
    num: string;
    emoji: string;
    title: string;
    desc: string;
    time: string;
    chips: string[];
    color: string;
    bg: string;
    border: string;
}

interface MobileStepSliderProps {
    steps: StepItem[];
}

export default function MobileStepSlider({ steps }: MobileStepSliderProps) {
    const [currentStep, setCurrentStep] = useState(0);

    if (!steps || steps.length === 0) return null;

    const step = steps[currentStep] || steps[0];

    return (
        <div className="block md:hidden w-full my-6">
            {/* Step Progress Header */}
            <div className="flex items-center justify-between gap-2 px-1 mb-4">
                <div className="flex items-center gap-1.5">
                    {steps.map((s, idx) => (
                        <button
                            key={s.num}
                            type="button"
                            onClick={() => setCurrentStep(idx)}
                            aria-label={`Step ${s.num}`}
                            className={`h-2 rounded-full transition-all duration-300 ${
                                currentStep === idx
                                    ? "w-8 bg-[#6605c7]"
                                    : currentStep > idx
                                    ? "w-4 bg-purple-300"
                                    : "w-3 bg-gray-200"
                            }`}
                        />
                    ))}
                </div>
                <span className="text-[11px] font-black text-[#6605c7] bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100/80">
                    Step {currentStep + 1} of {steps.length}
                </span>
            </div>

            {/* Step Card */}
            <div
                className="relative bg-white rounded-2xl p-6 shadow-xl border overflow-hidden transition-all duration-300"
                style={{ borderColor: step.border }}
            >
                <div
                    className="absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl opacity-30 pointer-events-none"
                    style={{ background: step.color }}
                />

                <div className="flex items-center gap-4 mb-4">
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-md"
                        style={{ background: step.bg, border: `1.5px solid ${step.border}` }}
                    >
                        <span>{step.emoji}</span>
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Step {step.num}</span>
                        <h3 className="text-base font-black text-gray-900 leading-snug">{step.title}</h3>
                        <span
                            className="inline-block text-[10px] font-black px-2 py-0.5 rounded-full mt-1"
                            style={{ background: step.bg, color: step.color, border: `1px solid ${step.border}` }}
                        >
                            ⏱ {step.time}
                        </span>
                    </div>
                </div>

                <p className="text-gray-600 text-xs leading-relaxed font-medium mb-4">{step.desc}</p>

                <div className="flex flex-wrap gap-1.5 mb-5">
                    {step.chips.map((c) => (
                        <span
                            key={c}
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                            style={{ background: step.bg, color: step.color, border: `1px solid ${step.border}60` }}
                        >
                            ✓ {c}
                        </span>
                    ))}
                </div>

                {/* Mobile Next / Previous Controls */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                        disabled={currentStep === 0}
                        className={`flex-1 flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                            currentStep === 0
                                ? "bg-gray-100 text-gray-400 opacity-60 cursor-not-allowed"
                                : "bg-gray-100 hover:bg-gray-200 text-gray-700 active:scale-95 cursor-pointer"
                        }`}
                    >
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                        <span>Back</span>
                    </button>

                    {currentStep < steps.length - 1 ? (
                        <button
                            type="button"
                            onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
                            className="flex-1 flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl bg-[#6605c7] text-white text-xs font-bold shadow-md shadow-[#6605c7]/25 hover:bg-[#5504a8] active:scale-95 transition-all cursor-pointer"
                        >
                            <span>Next Step</span>
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    ) : (
                        <Link
                            href="/apply-loan"
                            className="flex-1 flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#6605c7] to-purple-600 text-white text-xs font-bold shadow-md shadow-[#6605c7]/30 hover:opacity-90 active:scale-95 transition-all"
                        >
                            <span>Apply Now</span>
                            <span className="material-symbols-outlined text-sm">rocket_launch</span>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
