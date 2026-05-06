import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
    title: "About Us - Vidhya Loans",
    description: "Learn about VidhyaLoan's mission to make education financing simple, transparent, and accessible for every student.",
};

const team = [
    { name: "Arjun Mehta", role: "CEO & Co-Founder", avatar: "arjun" },
    { name: "Priya Nair", role: "CTO & Co-Founder", avatar: "priya" },
    { name: "Ravi Shankar", role: "Head of Partnerships", avatar: "ravi" },
    { name: "Kavya Reddy", role: "Lead Counselor", avatar: "kavya" },
];

const values = [
    { icon: "diversity_3", title: "Student First", desc: "Every decision we make is centered around what's best for the student." },
    { icon: "lock_open", title: "Transparency Always", desc: "No hidden fees, no surprises. We believe in complete clarity at every step." },
    { icon: "bolt", title: "Speed & Simplicity", desc: "We've cut through the complexity of education loans to make it simple and fast." },
    { icon: "psychology", title: "Powered by AI", desc: "We leverage AI to give every student personalized, accurate guidance." },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-transparent">
            {/* Hero */}
            <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-[#6605c7] to-purple-800 text-white text-center">
                <div className="max-w-4xl mx-auto">
                    <span className="inline-block px-4 py-1.5 rounded-xl bg-white/10 text-[11px] font-bold uppercase tracking-widest mb-6">Our Story</span>
                    <h1 className="text-5xl md:text-7xl font-bold font-display mb-6 leading-tight">
                        Changing How India Finances <span className="italic">Education</span>
                    </h1>
                    <p className="text-[18px] text-purple-100 max-w-2xl mx-auto">
                        Founded in 2023, VidhyaLoan was born from the frustration of navigating complex education loan systems. We're on a mission to make quality education accessible to every ambitious student.
                    </p>
                </div>
            </section>

            {/* Stats */}
            <div className="bg-white py-16 px-6">
                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { num: "₹500Cr+", label: "Loans Disbursed" },
                        { num: "10,000+", label: "Students Helped" },
                        { num: "5+", label: "Premium Partners" },
                        { num: "30+", label: "Countries Covered" },
                    ].map((s) => (
                        <div key={s.label} className="text-center">
                            <div className="text-4xl font-bold text-[#6605c7] mb-2">{s.num}</div>
                            <div className="text-[13px] text-gray-500 font-medium">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mission */}
            <section className="py-24 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <span className="text-[#6605c7] font-bold text-[11px] uppercase tracking-widest block mb-4">Our Mission</span>
                        <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
                            Making quality education accessible to all
                        </h2>
                        <p className="text-gray-600 leading-relaxed text-[16px] mb-6">
                            We believe that financial barriers should never come between a student and their dream education. That's why we've built India's most comprehensive platform for education loan discovery, comparison, and application.
                        </p>
                        <p className="text-gray-600 leading-relaxed text-[13px]">
                            From comparing interest rates across our premium lending partners to getting AI-powered SOP assistance, every tool we build is designed to give students the edge they need.
                        </p>
                    </div>
                    <div className="rounded-xl overflow-hidden shadow-2xl">
                        <Image
                            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
                            alt="Team collaboration"
                            width={1200}
                            height={800}
                            className="w-full object-cover"
                        />
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-24 bg-gray-50 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold font-display">Our Values</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {values.map((v) => (
                            <div key={v.title} className="bg-white p-8 rounded-xl border border-gray-100 hover:shadow-xl transition-all">
                                <div className="w-14 h-14 bg-[#6605c7]/10 rounded-xl flex items-center justify-center text-[#6605c7] mb-6">
                                    <span className="material-symbols-outlined text-3xl">{v.icon}</span>
                                </div>
                                <h3 className="text-xl font-bold mb-3">{v.title}</h3>
                                <p className="text-gray-500 leading-relaxed text-[13px]">{v.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="py-24 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold font-display mb-4">Meet the Team</h2>
                        <p className="text-[13px] text-gray-500">Dedicated to changing education financing for the better.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {team.map((m) => (
                            <div key={m.name} className="text-center group">
                                <Image
                                    src={`https://i.pravatar.cc/200?u=${m.avatar}`}
                                    alt={m.name}
                                    width={120}
                                    height={120}
                                    className="w-24 h-24 rounded-full mx-auto mb-4 ring-4 ring-[#6605c7]/20 group-hover:ring-[#6605c7]/40 transition-all"
                                />
                                <h3 className="font-bold text-[15px]">{m.name}</h3>
                                <p className="text-[13px] text-gray-500">{m.role}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 px-6 text-center">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold font-display mb-4">Join the VidhyaLoan Community</h2>
                    <p className="text-[13px] text-gray-500 mb-8">Start your education loan journey today with 10,000+ students who've already taken the leap.</p>
                    <Link href="/apply-loan" className="inline-block px-10 py-4 bg-[#6605c7] text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:-translate-y-1 transition-all shadow-lg shadow-[#6605c7]/20">
                        Get Started Free
                    </Link>
                </div>
            </section>
        </div>
    );
}
