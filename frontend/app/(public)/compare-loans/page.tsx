"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const banks = [
    { id: "sbi", name: "SBI", fullName: "State Bank of India", rate: 8.5, maxTenure: 15, maxAmount: 75, tag: "Public Bank", color: "bg-blue-500" },
    { id: "hdfc", name: "HDFC Credila", fullName: "HDFC Credila Financial Services", rate: 9.0, maxTenure: 12, maxAmount: 150, tag: "NBFC", color: "bg-red-500" },
    { id: "icici", name: "ICICI Bank", fullName: "ICICI Bank Ltd.", rate: 9.5, maxTenure: 10, maxAmount: 100, tag: "Private Bank", color: "bg-orange-500" },
    { id: "auxilo", name: "Auxilo", fullName: "Auxilo Finserve Pvt. Ltd.", rate: 11.25, maxTenure: 10, maxAmount: 100, tag: "NBFC", color: "bg-purple-500" },
    { id: "avanse", name: "Avanse", fullName: "Avanse Financial Services", rate: 10.99, maxTenure: 10, maxAmount: 100, tag: "NBFC", color: "bg-green-500" },
    { id: "idfc", name: "IDFC First", fullName: "IDFC First Bank", rate: 10.5, maxTenure: 10, maxAmount: 75, tag: "Private Bank", color: "bg-indigo-500" },
];

export default function CompareLoansPage() {
    const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
    const [amount, setAmount] = useState(3000000);
    const [tenure, setTenure] = useState(84);

    const toggleBank = (id: string) => {
        setSelectedBanks((prev) =>
            prev.includes(id) ? prev.filter((b) => b !== id) : prev.length < 4 ? [...prev, id] : prev
        );
    };

    const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

    const compareList = selectedBanks.length > 0
        ? banks.filter((b) => selectedBanks.includes(b.id))
        : banks.slice(0, 3);

    const calcEMI = (rate: number) => {
        const r = rate / 12 / 100;
        return amount * r * Math.pow(1 + r, tenure) / (Math.pow(1 + r, tenure) - 1);
    };

    return (
        <div className="min-h-screen bg-transparent">
            <Navbar />
            <div className="pt-28 pb-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl md:text-5xl font-bold font-display dark:text-white mb-4">Compare Education Loans</h1>
                        <p className="text-gray-500">Find the best loan for your study abroad journey</p>
                    </div>

                    {/* Filters */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-bold dark:text-gray-300 block mb-2">Loan Amount: {fmt(amount)}</label>
                                <input type="range" min={500000} max={10000000} step={100000} value={amount} onChange={(e) => setAmount(+e.target.value)}
                                    className="w-full accent-[#6605c7]" />
                            </div>
                            <div>
                                <label className="text-sm font-bold dark:text-gray-300 block mb-2">Tenure: {tenure} months</label>
                                <input type="range" min={12} max={180} step={6} value={tenure} onChange={(e) => setTenure(+e.target.value)}
                                    className="w-full accent-[#6605c7]" />
                            </div>
                        </div>
                    </div>

                    {/* Bank Selector */}
                    <div className="flex flex-wrap gap-3 mb-8">
                        {banks.map((b) => (
                            <button key={b.id} onClick={() => toggleBank(b.id)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${selectedBanks.includes(b.id)
                                        ? "bg-[#6605c7] text-white border-[#6605c7]"
                                        : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:border-[#6605c7]"
                                    }`}>
                                {b.name}
                            </button>
                        ))}
                        <span className="text-xs text-gray-400 self-center">{selectedBanks.length === 0 ? "Select banks to compare (max 4)" : `${selectedBanks.length} selected`}</span>
                    </div>

                    {/* Comparison Table */}
                    <div className="overflow-x-auto rounded-3xl border border-gray-100 dark:border-slate-700 shadow-xl">
                        <table className="w-full min-w-[700px]">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-slate-800">
                                    <th className="p-6 text-left font-bold dark:text-white">Feature</th>
                                    {compareList.map((b) => (
                                        <th key={b.id} className="p-6 text-center">
                                            <div className={`w-10 h-10 ${b.color} rounded-xl mx-auto mb-2 flex items-center justify-center text-white text-xs font-bold`}>
                                                {b.name[0]}
                                            </div>
                                            <div className="font-bold dark:text-white text-sm">{b.name}</div>
                                            <div className="text-[10px] text-gray-400">{b.tag}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {[
                                    { label: "Interest Rate (p.a.)", fn: (b: typeof banks[0]) => `${b.rate}%` },
                                    { label: "Monthly EMI", fn: (b: typeof banks[0]) => fmt(calcEMI(b.rate)) },
                                    { label: "Total Interest", fn: (b: typeof banks[0]) => fmt(calcEMI(b.rate) * tenure - amount) },
                                    { label: "Max Loan Amount", fn: (b: typeof banks[0]) => `₹${b.maxAmount}L` },
                                    { label: "Max Tenure", fn: (b: typeof banks[0]) => `${b.maxTenure} years` },
                                ].map((row) => (
                                    <tr key={row.label} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-6 font-medium text-gray-600 dark:text-gray-400 text-sm">{row.label}</td>
                                        {compareList.map((b) => (
                                            <td key={b.id} className="p-6 text-center font-bold dark:text-white text-sm">{row.fn(b)}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
