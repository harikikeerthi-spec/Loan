"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function ReferralPage() {
    const { isAuthenticated, user } = useAuth();
    const [referralCode, setReferralCode] = useState("VLOAN" + Math.floor(1000 + Math.random() * 9000));
    const [stats, setStats] = useState({
        total: 12,
        completed: 4,
        signedUp: 5,
        pending: 3,
        streak: 3
    });

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    };

    return (
        <div className="min-h-screen bg-transparent">
            <main className="relative z-10 pt-32 pb-24">
                {/* Hero Section */}
                <section className="max-w-5xl mx-auto px-6 mb-20">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-[#6605c7]/10 text-[#6605c7] px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                            <span className="material-symbols-outlined text-base">volunteer_activism</span>
                            Refer & Earn Program
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold font-display leading-tight mb-6">
                            Share the <span className="italic font-normal text-[#6605c7]">love</span>,
                            <br />earn <span className="italic font-normal text-[#e0c389]">rewards</span>
                        </h1>
                        <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                            Earn ₹3,000 for every successful referral — ₹1,500 when your friend&apos;s loan is sanctioned
                            and ₹1,500 after disbursal. Plus, unlock a ₹10,000 bonus on every 5th successful referral.
                        </p>
                    </div>

                    {/* Referral Card */}
                    <div className="max-w-2xl mx-auto p-[2px] rounded-[3rem] bg-gradient-to-r from-[#6605c7] via-[#e0c389] to-[#6605c7] animate-gradient-x shadow-2xl">
                        <div className="bg-white rounded-[calc(3rem-2px)] p-10 md:p-14 text-center">
                            <div className="flex justify-center mb-8">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#6605c7] to-purple-400 flex items-center justify-center relative shadow-lg shadow-purple-500/20">
                                    <span className="material-symbols-outlined text-white text-4xl">stars</span>
                                    <div className="absolute -bottom-2 bg-[#6605c7] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-full">
                                        Starter
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Your unique referral code</p>

                            <div className="flex items-center justify-center gap-4 mb-10">
                                <div className="text-4xl md:text-5xl font-bold font-display tracking-[0.2em] text-[#6605c7] select-all cursor-pointer">
                                    {referralCode}
                                </div>
                                <button
                                    onClick={() => copyToClipboard(referralCode)}
                                    className="p-4 rounded-2xl bg-gray-50 hover:bg-[#6605c7]/10 transition-all group"
                                >
                                    <span className="material-symbols-outlined text-gray-400 group-hover:text-[#6605c7]">content_copy</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                                <StatItem label="Total" value={stats.total} color="text-[#6605c7]" bg="bg-[#6605c7]/5" />
                                <StatItem label="Completed" value={stats.completed} color="text-green-500" bg="bg-green-500/5" />
                                <StatItem label="Signed Up" value={stats.signedUp} color="text-blue-500" bg="bg-blue-500/5" />
                                <StatItem label="Pending" value={stats.pending} color="text-amber-500" bg="bg-amber-500/5" />
                            </div>

                            <div className="flex flex-wrap justify-center gap-3">
                                <button className="flex items-center gap-2 px-8 py-4 rounded-full bg-[#25D366] text-white text-xs font-bold uppercase tracking-widest hover:shadow-xl transition-all">
                                    WhatsApp
                                </button>
                                <button className="flex items-center gap-2 px-8 py-4 rounded-full bg-black text-white text-xs font-bold uppercase tracking-widest hover:shadow-xl transition-all">
                                    Twitter
                                </button>
                                <button className="flex items-center gap-2 px-8 py-4 rounded-full bg-[#6605c7] text-white text-xs font-bold uppercase tracking-widest hover:shadow-xl transition-all">
                                    Invite Friends
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tiers Section */}
                <section className="max-w-5xl mx-auto px-6 mb-32">
                    <div className="text-center mb-16">
                        <span className="text-[#6605c7] font-bold text-[11px] tracking-[0.2em] uppercase mb-4 block">Climb the Ladder</span>
                        <h2 className="text-4xl font-display font-bold">Reward <span className="italic font-normal text-gray-400">Tiers</span></h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        <TierCard tier="Starter" count="0" desc="Begin your journey." active />
                        <TierCard tier="Bronze" count="3" desc="₹500 cashback." locked />
                        <TierCard tier="Silver" count="5" desc="0.25% ROI off." locked />
                        <TierCard tier="Gold" count="7" desc="VIP Support." locked />
                        <TierCard tier="Diamond" count="10" desc="₹10k recurring bonus." locked />
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="max-w-3xl mx-auto px-6">
                    <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[3rem] p-12 shadow-xl">
                        <h2 className="text-3xl font-display font-bold mb-10 text-center">Referral <span className="italic text-gray-400 text-2xl">Rules</span></h2>
                        <div className="space-y-6 text-sm text-gray-500 leading-relaxed">
                            <div className="flex gap-4">
                                <span className="w-6 h-6 rounded-full bg-[#6605c7]/10 text-[#6605c7] flex items-center justify-center flex-shrink-0 font-bold">1</span>
                                <p>Friends must use your unique code during signup. Rewards apply only to new, verified users.</p>
                            </div>
                            <div className="flex gap-4">
                                <span className="w-6 h-6 rounded-full bg-[#6605c7]/10 text-[#6605c7] flex items-center justify-center flex-shrink-0 font-bold">2</span>
                                <p>Cashback is split: ₹1,500 on loan sanction and ₹1,500 on first disbursal.</p>
                            </div>
                            <div className="flex gap-4">
                                <span className="w-6 h-6 rounded-full bg-[#6605c7]/10 text-[#6605c7] flex items-center justify-center flex-shrink-0 font-bold">3</span>
                                <p>Progress tiers are calculated based on successfully disbursed loans referred by you.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function StatItem({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
    return (
        <div className={`${bg} rounded-2xl p-4 text-center border border-white/5 shadow-sm`}>
            <div className={`text-2xl font-bold font-display ${color} mb-1`}>{value}</div>
            <div className="text-[8px] font-bold uppercase tracking-widest text-gray-400">{label}</div>
        </div>
    );
}

function TierCard({ tier, count, desc, active, locked }: { tier: string; count: string; desc: string; active?: boolean; locked?: boolean }) {
    return (
        <div className={`relative p-8 rounded-3xl border transition-all ${active ? "bg-white border-[#6605c7] shadow-xl" : "bg-white/50 border-gray-100 opacity-60"}`}>
            <div className="flex justify-between items-start mb-6">
                <span className={`material-symbols-outlined ${locked ? "text-gray-400" : "text-[#6605c7]"}`}>
                    {locked ? "lock" : "workspace_premium"}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{count} Ref</span>
            </div>
            <h3 className="text-lg font-bold mb-2">{tier}</h3>
            <p className="text-[10px] text-gray-500 leading-relaxed">{desc}</p>
        </div>
    );
}
