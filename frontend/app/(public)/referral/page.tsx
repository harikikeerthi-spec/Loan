"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { referralApi } from "@/lib/api";
import Link from "next/link";

interface ReferralStats {
    totalReferrals: number;
    completedReferrals: number;
    signedUpReferrals: number;
    pendingReferrals: number;
    tier: string;
    rewards: {
        earned: number;
        pending: number;
    };
}

export default function ReferralPage() {
    const { isAuthenticated, user } = useAuth();
    const [referralCode, setReferralCode] = useState<string>("");
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<ReferralStats>({
        totalReferrals: 0,
        completedReferrals: 0,
        signedUpReferrals: 0,
        pendingReferrals: 0,
        tier: "bronze",
        rewards: { earned: 0, pending: 0 }
    });

    useEffect(() => {
        const fetchReferralData = async () => {
            if (!isAuthenticated) {
                setLoading(false);
                return;
            }
            
            try {
                setLoading(true);
                const [codeData, statsData] = await Promise.all([
                    referralApi.getMyCode() as Promise<{ code: string }>,
                    referralApi.getStats() as Promise<ReferralStats>
                ]);
                
                setReferralCode(codeData.code || "");
                setStats(statsData);
            } catch (error) {
                console.error("Failed to fetch referral data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReferralData();
    }, [isAuthenticated]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const referralLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://vidhyaloan.com'}/signup?ref=${referralCode}`;

    // Show login prompt if not authenticated
    if (!isAuthenticated && !loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-white to-orange-50/30 flex items-center justify-center px-6 pt-20">
                <div className="max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-200">
                        <span className="material-symbols-outlined text-4xl text-white">volunteer_activism</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Join Our Referral Program</h1>
                    <p className="text-gray-500 mb-8">Sign in to get your unique referral code and start earning ₹3,000 for every successful referral.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/login?redirect=/referral" className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-xl hover:-translate-y-0.5 transition-all">
                            Sign In
                        </Link>
                        <Link href="/signup" className="px-8 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">
                            Create Account
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-white to-orange-50/30 flex items-center justify-center pt-20">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading your referral data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-white to-orange-50/30">
            {/* Subtle Background Pattern */}
            <div className="fixed inset-0 -z-10 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #f59e0b 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            
            <main className="relative pt-28 pb-20">
                {/* Hero Section - Clean & Minimal */}
                <section className="max-w-6xl mx-auto px-6 mb-16">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-amber-200/50">
                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                            Referral Program
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4 leading-tight">
                            Share & Earn <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">₹3,000</span>
                        </h1>
                        <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
                            Help your friends fund their education abroad and earn rewards for every successful referral.
                        </p>
                    </div>

                    {/* Main Card - Glass Morphism */}
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white shadow-xl shadow-amber-100/50 overflow-hidden">
                            {/* Card Header */}
                            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                                                <path d="M12 2L14.09 8.26L20.81 9.27L15.91 13.97L17.18 20.73L12 17.77L6.82 20.73L8.09 13.97L3.19 9.27L9.91 8.26L12 2Z" fill="currentColor"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-white/80 text-xs font-medium uppercase tracking-wider">Your Referral Code</p>
                                            <p className="text-2xl font-bold tracking-wider">{referralCode}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(referralCode)}
                                        className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${copied ? 'bg-white text-green-600' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                                    >
                                        {copied ? '✓ Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-8">
                                {/* Referral Link */}
                                <div className="mb-8">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Share Your Link</label>
                                    <div className="flex gap-3">
                                        <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-gray-600 text-sm font-mono truncate border border-gray-100">
                                            {referralLink}
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(referralLink)}
                                            className="px-5 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all"
                                        >
                                            Copy Link
                                        </button>
                                    </div>
                                </div>

                                {/* Share Buttons */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                                    <ShareButton icon="whatsapp" label="WhatsApp" color="bg-[#25D366]" />
                                    <ShareButton icon="telegram" label="Telegram" color="bg-[#0088cc]" />
                                    <ShareButton icon="mail" label="Email" color="bg-gray-700" />
                                    <ShareButton icon="share" label="More" color="bg-gray-900" />
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <StatCard value={stats.totalReferrals} label="Total Referrals" icon="people" />
                                    <StatCard value={stats.completedReferrals} label="Successful" icon="check_circle" color="text-green-500" />
                                    <StatCard value={stats.pendingReferrals} label="Pending" icon="schedule" color="text-amber-500" />
                                    <StatCard value={`₹${(stats.rewards.earned / 1000).toFixed(1)}k`} label="Earned" icon="account_balance_wallet" color="text-orange-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works - Clean Timeline */}
                <section className="max-w-6xl mx-auto px-6 mb-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
                        <p className="text-gray-500">Three simple steps to start earning</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connection Line */}
                        <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-amber-200 via-orange-300 to-amber-200" />
                        
                        <StepCard 
                            step={1}
                            icon="share"
                            title="Share Your Code"
                            description="Send your unique referral code to friends planning to study abroad"
                        />
                        <StepCard 
                            step={2}
                            icon="description"
                            title="Friend Applies"
                            description="Your friend signs up and applies for an education loan using your code"
                        />
                        <StepCard 
                            step={3}
                            icon="payments"
                            title="Earn Rewards"
                            description="Get ₹3,000 when their loan is successfully disbursed"
                        />
                    </div>
                </section>

                {/* Reward Tiers - Horizontal Cards */}
                <section className="max-w-6xl mx-auto px-6 mb-20">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-10 md:p-14 relative overflow-hidden">
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-amber-500/10 to-transparent rounded-full blur-2xl" />
                        
                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                                <div>
                                    <span className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-2 block">Milestone Rewards</span>
                                    <h2 className="text-3xl md:text-4xl font-bold text-white">Unlock Bonus Rewards</h2>
                                </div>
                                <p className="text-gray-400 text-sm max-w-sm">The more you refer, the more you earn. Hit milestones for extra bonuses.</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <MilestoneCard 
                                    count={3} 
                                    reward="₹500" 
                                    label="Extra per ref" 
                                    achieved={stats.completedReferrals >= 3}
                                    progress={Math.min(stats.completedReferrals / 3 * 100, 100)}
                                />
                                <MilestoneCard 
                                    count={5} 
                                    reward="₹10k" 
                                    label="Bonus unlock" 
                                    achieved={stats.completedReferrals >= 5}
                                    progress={Math.min(stats.completedReferrals / 5 * 100, 100)}
                                />
                                <MilestoneCard 
                                    count={10} 
                                    reward="₹25k" 
                                    label="Mega bonus" 
                                    achieved={stats.completedReferrals >= 10}
                                    progress={Math.min(stats.completedReferrals / 10 * 100, 100)}
                                />
                                <MilestoneCard 
                                    count={25} 
                                    reward="₹75k" 
                                    label="Super bonus" 
                                    achieved={stats.completedReferrals >= 25}
                                    progress={Math.min(stats.completedReferrals / 25 * 100, 100)}
                                />
                                <MilestoneCard 
                                    count={50} 
                                    reward="₹2L" 
                                    label="Legend status" 
                                    achieved={stats.completedReferrals >= 50}
                                    progress={Math.min(stats.completedReferrals / 50 * 100, 100)}
                                    special
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section - Accordion Style */}
                <section className="max-w-3xl mx-auto px-6 mb-20">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">Common Questions</h2>
                        <p className="text-gray-500">Everything you need to know about our referral program</p>
                    </div>

                    <div className="space-y-3">
                        <FAQItem 
                            question="How much can I earn per referral?"
                            answer="You earn ₹3,000 for every successful referral. This is paid in two parts: ₹1,500 when the loan is sanctioned and ₹1,500 when it's disbursed."
                        />
                        <FAQItem 
                            question="When do I receive my referral bonus?"
                            answer="Your bonus is credited to your VidhyaLoan wallet within 7 working days of each milestone (sanction and disbursement)."
                        />
                        <FAQItem 
                            question="Is there a limit to how many people I can refer?"
                            answer="No limits! You can refer as many friends as you want and earn unlimited rewards. The more you refer, the more bonus milestones you unlock."
                        />
                        <FAQItem 
                            question="What if my referral's loan is rejected?"
                            answer="If a loan application is rejected, no referral bonus is earned for that particular referral. We encourage you to refer serious applicants."
                        />
                    </div>
                </section>

                {/* Final CTA */}
                <section className="max-w-4xl mx-auto px-6">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-10 md:p-14 text-center text-white relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30L30 0z' fill='%23fff' fill-opacity='0.3'/%3E%3C/svg%3E\")" }} />
                        
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <span className="material-symbols-outlined text-4xl">rocket_launch</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Start Earning Today</h2>
                            <p className="text-white/90 mb-8 max-w-lg mx-auto">
                                Share your referral code with friends and start building your passive income stream.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button 
                                    onClick={() => copyToClipboard(referralLink)}
                                    className="px-8 py-4 bg-white text-amber-600 font-bold rounded-xl hover:shadow-xl hover:-translate-y-0.5 transition-all"
                                >
                                    Copy Referral Link
                                </button>
                                <Link 
                                    href="/dashboard"
                                    className="px-8 py-4 bg-white/20 text-white font-bold rounded-xl border border-white/30 hover:bg-white/30 transition-all"
                                >
                                    View Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function ShareButton({ icon, label, color }: { icon: string; label: string; color: string }) {
    const icons: Record<string, React.ReactNode> = {
        whatsapp: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
        ),
        telegram: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
        ),
        mail: <span className="material-symbols-outlined text-xl">mail</span>,
        share: <span className="material-symbols-outlined text-xl">share</span>
    };

    return (
        <button className={`${color} text-white px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all`}>
            {icons[icon]}
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}

function StatCard({ value, label, icon, color = "text-gray-900" }: { value: string | number; label: string; icon: string; color?: string }) {
    return (
        <div className="bg-gray-50/80 rounded-2xl p-5 text-center border border-gray-100/50">
            <span className={`material-symbols-outlined text-2xl ${color} mb-2 block`}>{icon}</span>
            <div className={`text-xl font-bold ${color}`}>{value}</div>
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{label}</div>
        </div>
    );
}

function StepCard({ step, icon, title, description }: { step: number; icon: string; title: string; description: string }) {
    return (
        <div className="relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all text-center group">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-5 text-white shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {step}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
        </div>
    );
}

function MilestoneCard({ count, reward, label, achieved, progress, special = false }: { count: number; reward: string; label: string; achieved: boolean; progress: number; special?: boolean }) {
    return (
        <div className={`relative rounded-2xl p-5 text-center transition-all ${achieved ? 'bg-gradient-to-br from-amber-500 to-orange-500' : special ? 'bg-gradient-to-br from-amber-900/50 to-orange-900/50 border border-amber-500/30' : 'bg-white/5 border border-white/10'}`}>
            {achieved && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-500 text-sm">check</span>
                </div>
            )}
            <div className={`text-3xl font-bold mb-1 ${achieved ? 'text-white' : special ? 'text-amber-400' : 'text-white/70'}`}>
                {count}
            </div>
            <div className={`text-xs uppercase tracking-wider mb-3 ${achieved ? 'text-white/80' : 'text-white/40'}`}>Referrals</div>
            <div className={`text-lg font-bold ${achieved ? 'text-white' : special ? 'text-amber-300' : 'text-amber-400'}`}>{reward}</div>
            <div className={`text-[10px] ${achieved ? 'text-white/70' : 'text-white/40'}`}>{label}</div>
            
            {/* Progress bar */}
            {!achieved && (
                <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
            )}
        </div>
    );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors"
            >
                <span className="font-semibold text-gray-900">{question}</span>
                <span className={`material-symbols-outlined text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            {isOpen && (
                <div className="px-6 pb-5 text-gray-500 text-sm leading-relaxed">
                    {answer}
                </div>
            )}
        </div>
    );
}
