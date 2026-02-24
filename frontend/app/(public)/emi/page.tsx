"use client";

import { useState, useEffect, useMemo } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function EmiCalculatorPage() {
    const [principal, setPrincipal] = useState(2500000);
    const [rate, setRate] = useState(10.5);
    const [tenure, setTenure] = useState(10); // in years

    const { emi, totalInterest, totalPayable, amortization } = useMemo(() => {
        const monthlyRate = rate / 12 / 100;
        const months = tenure * 12;
        const emiValue = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
        const totalPayableValue = emiValue * months;
        const totalInterestValue = totalPayableValue - principal;

        const schedule = [];
        let balance = principal;
        for (let i = 1; i <= 6; i++) {
            const interest = balance * monthlyRate;
            const subPrincipal = emiValue - interest;
            balance = balance - subPrincipal;
            schedule.push({
                month: i,
                principal: subPrincipal,
                interest: interest,
                balance: Math.max(0, balance)
            });
        }

        return {
            emi: emiValue,
            totalInterest: totalInterestValue,
            totalPayable: totalPayableValue,
            amortization: schedule
        };
    }, [principal, rate, tenure]);

    const fmt = (n: number) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(n);

    const chartData = {
        labels: ["Principal Amount", "Total Interest"],
        datasets: [
            {
                data: [principal, totalInterest],
                backgroundColor: ["#6605c7", "#e0c389"],
                hoverBackgroundColor: ["#7a0de8", "#f0d4a0"],
                borderWidth: 0,
            },
        ],
    };

    const chartOptions = {
        plugins: {
            legend: {
                display: false,
            },
        },
        cutout: "75%",
        responsive: true,
        maintainAspectRatio: false,
    };

    return (
        <div className="min-h-screen bg-transparent">
            <div className="pt-32 pb-24 px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="text-center mb-16">
                        <span className="text-[#6605c7] font-bold text-[11px] tracking-[0.2em] uppercase mb-4 block">
                            Financial Planning
                        </span>
                        <h1 className="text-5xl md:text-7xl font-display font-bold text-gray-900 mb-6">
                            EMI <span className="text-[#6605c7] italic">Calculator</span>
                        </h1>
                        <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
                            Plan your education journey with transparency. Estimate your monthly repayments accurately.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Left Column: Controls & Table */}
                        <div className="lg:col-span-7 space-y-8">
                            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-xl border border-gray-100 space-y-12">
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

                            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-xl border border-gray-100 overflow-hidden">
                                <h3 className="font-bold text-gray-900 text-xl mb-6 flex items-center gap-2 font-display">
                                    <span className="material-symbols-outlined text-[#6605c7]">calendar_month</span>
                                    Amortization Schedule (First 6 Months)
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">
                                                <th className="pb-4">Month</th>
                                                <th className="pb-4">Principal</th>
                                                <th className="pb-4">Interest</th>
                                                <th className="pb-4">Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm divide-y divide-gray-50 text-gray-600">
                                            {amortization.map((row) => (
                                                <tr key={row.month} className="hover:bg-gray-50/50:bg-white/5 transition-colors">
                                                    <td className="py-4 font-bold text-gray-900">{row.month}</td>
                                                    <td className="py-4">{fmt(row.principal)}</td>
                                                    <td className="py-4">{fmt(row.interest)}</td>
                                                    <td className="py-4 font-medium">{fmt(row.balance)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Result Card */}
                        <div className="lg:col-span-5 bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-12 shadow-xl border border-gray-100 text-center sticky top-32">
                            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-[0.2em] mb-2 block">
                                Your Monthly Payment
                            </span>
                            <div className="text-6xl font-bold text-gray-900 mb-10 font-sans">
                                {fmt(Math.round(emi))}
                            </div>

                            {/* Donut Chart */}
                            <div className="relative w-64 h-64 mx-auto mb-10">
                                <Doughnut data={chartData} options={chartOptions} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Repayable</div>
                                        <div className="text-sm font-bold text-gray-900 mt-1">{fmt(totalPayable)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Breakdown Summary */}
                            <div className="grid grid-cols-2 gap-4 mb-10">
                                <div className="p-5 bg-[#6605c7]/5 rounded-2xl border border-[#6605c7]/10 text-left">
                                    <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Total Principal</p>
                                    <p className="text-lg font-bold text-gray-900 font-display">{fmt(principal)}</p>
                                </div>
                                <div className="p-5 bg-[#e0c389]/10 rounded-2xl border border-[#e0c389]/20 text-left">
                                    <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Total Interest</p>
                                    <p className="text-lg font-bold text-gray-900 font-display">{fmt(totalInterest)}</p>
                                </div>
                            </div>

                            <button className="w-full py-5 bg-[#6605c7] text-white rounded-full font-bold uppercase tracking-widest text-[11px] hover:scale-[1.02] shadow-xl shadow-[#6605c7]/20 transition-all mb-4">
                                Download Repayment Schedule
                            </button>
                            <button className="w-full py-5 border border-gray-100 text-gray-900 rounded-full font-bold uppercase tracking-widest text-[11px] hover:bg-gray-50:bg-white/5 transition-all">
                                Get Pre-Approved Rate
                            </button>
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
                <label className="text-gray-500 text-[10px] uppercase font-bold tracking-[0.2em]">{label}</label>
                <span className="text-[#6605c7] text-3xl font-bold font-display">{value}</span>
            </div>
            <div className="relative">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={numValue}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-[#6605c7]"
                />
                <div className="flex justify-between mt-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                        {min >= 100000 ? `₹ ${min / 100000}L` : min === 7 ? "7%" : `${min} Year`}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                        {max >= 10000000 ? "₹ 1CR" : max === 15 ? "15%" : `${max} Years`}
                    </span>
                </div>
            </div>
        </div>
    );
}
