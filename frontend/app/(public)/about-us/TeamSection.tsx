"use client";
import Image from "next/image";

const team = [
    { name: "Vamsi Krishna", role: "CEO & Co-Founder", photo: "/images/team/vamsi.jpg" },
    { name: "Manohar", role: "Senior Counsellor", photo: "/images/team/manohar.jpg" },
    { name: "Keerthi Naidu", role: "Team Lead", photo: "/images/team/keerthi.jpg" },
    { name: "Abhiram", role: "Developer", photo: "/images/team/abhiram.jpg" },
    { name: "Shanmuka Sai", role: "Developer", photo: "/images/team/shanmukh.jpg" },
];

export default function TeamSection() {
    return (
        <section className="py-24 px-6">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold font-display mb-4">Meet the Team</h2>
                    <p className="text-[13px] text-gray-500">Dedicated to changing education financing for the better.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                    {team.map((m) => {
                        const initials = m.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase();
                        return (
                            <div key={m.name} className="text-center group">
                                <div className="relative w-28 h-28 mx-auto mb-4">
                                    <Image
                                        src={m.photo}
                                        alt={m.name}
                                        fill
                                        sizes="112px"
                                        className="rounded-full object-cover object-top ring-4 ring-[#6605c7]/20 group-hover:ring-[#6605c7]/50 group-hover:scale-105 transition-all duration-300 shadow-lg"
                                        onError={(e) => {
                                            const target = e.currentTarget as HTMLImageElement;
                                            target.style.display = "none";
                                            const fallback = target.parentElement?.querySelector(
                                                ".initials-fallback"
                                            ) as HTMLElement | null;
                                            if (fallback) fallback.style.display = "flex";
                                        }}
                                    />
                                    {/* Initials fallback — displayed when photo file is missing */}
                                    <div
                                        className="initials-fallback absolute inset-0 rounded-full bg-gradient-to-br from-[#6605c7] to-purple-400 text-white font-black text-[20px] items-center justify-center ring-4 ring-[#6605c7]/20 group-hover:ring-[#6605c7]/50 group-hover:scale-105 transition-all duration-300 shadow-lg"
                                        style={{ display: "none" }}
                                        aria-label={initials}
                                    >
                                        {initials}
                                    </div>
                                </div>
                                <h3 className="font-bold text-[15px] text-slate-800">{m.name}</h3>
                                <p className="text-[12px] text-gray-500 mt-0.5">{m.role}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
