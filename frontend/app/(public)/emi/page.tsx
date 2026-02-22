"use client";

import { useState } from "react";

export default function EmiCalculatorPage() {
    const [principal, setPrincipal] = useState(2500000);
    const [rate, setRate] = useState(10.5);
    const [tenure, setTenure] = useState(10); // in years for this UI

    const monthlyRate = rate / 12 / 100;
    const months = tenure * 12;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
    const totalPayable = emi * months;
    const totalInterest = totalPayable - principal;

    const fmt = (n: number) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(n);

    return (
        <div className="min-h-screen bg-transparent">
            {/* Navbar handled by layout */}

            <div className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="text-center mb-16">
                        <span className="text-[#6605c7] font-bold text-xs tracking-[0.2em] uppercase mb-4 block">
                            Financial Planning
                        </span>
                        <h1 className="text-6xl md:text-7xl font-display font-bold text-gray-900 dark:text-white mb-6">
                            EMI <span className="text-[#6605c7] italic">Calculator</span>
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                            Plan your education journey with transparency. Estimate your monthly repayments accurately.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Left Column: Controls */}
                        <div className="lg:col-span-7 bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-xl border border-[#E5E7EB] dark:border-white/10">
                            <div className="space-y-12">
                                <SliderControl
                                    label="Loan Amount"
                                    value={fmt(principal)}
                                    numValue={principal}
                                    min={100000}
                                    max={10000000}
                                    step={50000}
                                    onChange={setPrincipal}
                                />

                                <SliderControl
                                    label="Interest Rate (p.a.)"
                                    value={`${rate}%`}
                                    numValue={rate}
                                    min={7}
                                    max={15}
                                    step={0.1}
                                    onChange={setRate}
                                />

                                <SliderControl
                                    label="Tenure (Years)"
                                    value={`${tenure} Years`}
                                    numValue={tenure}
                                    min={1}
                                    max={15}
                                    step={1}
                                    onChange={setTenure}
                                />
                            </div>
                        </div>

                        {/* Right Column: Result Card */}
                        <div className="lg:col-span-5 bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-xl border border-[#E5E7EB] dark:border-white/10 text-center">
                            <span className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold tracking-[0.2em] mb-4 block">
                                Your Monthly Payment
                            </span>
                            <div className="text-6xl font-bold text-gray-900 dark:text-white mb-10 font-sans">
                                {fmt(Math.round(emi))}
                            </div>

                            {/* Donut Chart */}
                            <div className="relative w-64 h-64 mx-auto mb-10">
                                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e0c389" strokeWidth="4.5" />
                                    <circle
                                        cx="18" cy="18" r="15.915" fill="none"
                                        stroke="#6605c7" strokeWidth="4.5"
                                        strokeDasharray={`${(principal / totalPayable) * 100} ${100 - (principal / totalPayable) * 100}`}
                                        strokeLinecap="butt"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <div className="w-40 h-40 bg-white dark:bg-slate-900 rounded-full shadow-inner flex items-center justify-center" />
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="flex justify-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-1.5 rounded-full bg-[#6605c7]" />
                                    <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-wider">Principal</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-1.5 rounded-full bg-[#e0c389]" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Interest</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SliderControl({ label, value, numValue, min, max, step, onChange }: {
    label: string; value: string; numValue: number; min: number; max: number; step: number;
    onChange: (v: number) => void;
}) {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <label className="text-gray-400 text-[10px] uppercase font-bold tracking-[0.15em]">{label}</label>
                <span className="text-[#6605c7] text-2xl font-bold">{value}</span>
            </div>
            <div className="relative group">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={numValue}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-[#E5E7EB] dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-[#6605c7]"
                />
                <div className="flex justify-between mt-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                        {min === 100000 ? "₹ 1L" : min === 7 ? "7%" : `${min} Year`}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                        {max === 10000000 ? "₹ 1CR" : max === 15 ? "15%" : `${max} Years`}
                    </span>
                </div>
            </div>
        </div>
    );
}
