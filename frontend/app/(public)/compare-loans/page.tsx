"use client";

import { useState } from "react";
import Image from "next/image";
import { banks } from "@/lib/bankData";

const LOAN_DATA = Object.values(banks).map(bank => ({
    id: bank.slug,
    bank: bank.name,
    logo: bank.logo,
    rate: bank.interestRate,
    maxAmount: bank.maxLoan,
    fee: bank.specifications.find(s => s.label === "Processing Fee")?.value || "1% + GST",
    tenure: bank.specifications.find(s => s.label === "Repayment Tenure")?.value || "Up to 15 Years",
    collateral: bank.specifications.find(s => s.label === "Collateral")?.value || "Profile based",
    tag: bank.uniqueFeatures[0]?.title || "Premium Partner"
}));

export default function CompareLoansPage() {
    const [selected, setSelected] = useState<string[]>([]);
    const [showModal, setShowModal] = useState(false);

    const toggleLoan = (id: string) => {
        if (selected.includes(id)) {
            setSelected(selected.filter(i => i !== id));
        } else {
            if (selected.length < 3) {
                setSelected([...selected, id]);
            } else {
                alert("You can compare up to 3 loans at a time.");
            }
        }
    };

    const selectedData = LOAN_DATA.filter(l => selected.includes(l.id));

    return (
        <main className="relative z-10 pt-32 pb-24">
            <section className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <span className="text-[#6605c7] font-bold text-[11px] tracking-[0.2em] uppercase mb-4 block">Marketplace</span>
                    <h1 className="text-5xl md:text-6xl font-display font-medium text-gray-900 mb-6">
                        Compare <span className="italic text-gray-500">Education Loans</span>
                    </h1>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
                        Find the perfect loan for your education journey. Compare interest rates, processing fees, and terms from India's top lenders.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {LOAN_DATA.map((loan) => (
                        <div key={loan.id} className={`group bg-white/80 backdrop-blur-xl border rounded-[2.5rem] p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${selected.includes(loan.id) ? "border-[#6605c7] ring-1 ring-[#6605c7]" : "border-gray-100"}`}>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-16 h-16 bg-white rounded-2xl p-3 flex items-center justify-center border border-gray-100 shadow-sm overflow-hidden">
                                    <img src={loan.logo} alt={loan.bank} className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{loan.bank}</h3>
                                    <span className="text-[10px] font-bold text-[#6605c7] uppercase tracking-widest">{loan.tag}</span>
                                </div>
                            </div>

                            <div className="space-y-4 mb-10">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Interest Rate</span>
                                    <span className="text-2xl font-bold text-[#6605c7]">{loan.rate}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Max Amount</span>
                                    <span className="text-sm font-bold text-gray-900">{loan.maxAmount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Processing Fee</span>
                                    <span className="text-sm font-bold text-gray-900">{loan.fee}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <a href="/apply-loan" className="flex-1 py-4 bg-[#6605c7] text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:scale-[1.02] transition-all shadow-xl text-center flex items-center justify-center">Apply Now</a>
                                <button
                                    onClick={() => toggleLoan(loan.id)}
                                    className={`px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all border ${selected.includes(loan.id) ? "bg-[#6605c7] text-white border-[#6605c7]" : "border-[#6605c7] text-[#6605c7] hover:bg-[#6605c7]/5"}`}
                                >
                                    {selected.includes(loan.id) ? "Selected" : "Compare"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {selected.length > 0 && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-50">
                        <div className="bg-white/90 backdrop-blur-2xl border border-gray-100 rounded-full p-2 pl-8 flex items-center justify-between shadow-2xl">
                            <span className="text-gray-900 font-bold text-sm">
                                <span className="text-[#6605c7]">{selected.length}</span> {selected.length === 1 ? "Loan" : "Loans"} Selected
                            </span>
                            <div className="flex gap-4">
                                <button onClick={() => setSelected([])} className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest">Clear</button>
                                <button
                                    onClick={() => setShowModal(true)}
                                    disabled={selected.length < 2}
                                    className="px-8 py-3 bg-[#6605c7] text-white rounded-full font-bold uppercase tracking-widest text-xs hover:scale-[1.02] shadow-xl transition-all disabled:opacity-50"
                                >
                                    Compare Now
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-md">
                    <div className="bg-white rounded-[3rem] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl animate-fade-in-up">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-3xl font-display font-medium text-gray-900">Loan <span className="italic">Comparison</span></h2>
                            <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-10 overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr>
                                        <th className="py-6 px-4"></th>
                                        {selectedData.map(loan => (
                                            <th key={loan.id} className="py-6 px-4">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-50 p-2">
                                                        <img src={loan.logo} alt={loan.bank} className="w-full h-full object-contain" />
                                                    </div>
                                                    <span className="font-bold text-gray-900 text-[11px] uppercase tracking-wider whitespace-nowrap">{loan.bank}</span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-center">
                                    {[
                                        { label: "Interest Rate", key: "rate" },
                                        { label: "Max Amount", key: "maxAmount" },
                                        { label: "Processing Fee", key: "fee" },
                                        { label: "Tenure", key: "tenure" },
                                        { label: "Collateral", key: "collateral" }
                                    ].map((row, i) => (
                                        <tr key={i}>
                                            <td className="py-6 px-4 text-left font-bold text-gray-400 uppercase tracking-widest text-[9px] whitespace-nowrap">{row.label}</td>
                                            {selectedData.map(loan => (
                                                <td key={loan.id} className={`py-6 px-4 ${row.key === "rate" ? "text-xl font-bold text-[#6605c7]" : "text-sm font-bold text-gray-900"}`}>
                                                    {loan[row.key as keyof typeof loan]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    <tr>
                                        <td className="py-10"></td>
                                        {selectedData.map(loan => (
                                            <td key={loan.id} className="py-10 px-4">
                                                <a href="/apply-loan" className="w-full py-4 bg-[#6605c7] text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:scale-[1.05] transition-all shadow-xl inline-block text-center">Apply Now</a>
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
