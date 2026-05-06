"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { communityApi } from "@/lib/api";

interface Event {
    id: string;
    title: string;
    description?: string;
    date?: string;
    time?: string;
    location?: string;
    type?: string;
    image?: string;
    isFree?: boolean;
}

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        communityApi.getEvents({ limit: 50 })
            .then((res: any) => {
                const list = Array.isArray(res) ? res : res?.data || [];
                setEvents(list);
            })
            .catch(() => setEvents([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <main className="relative min-h-screen font-sans bg-transparent">
            <style>{`
                .e-glass { background: rgba(255,255,255,0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.5); }
                .event-card { background: rgba(255,255,255,0.85); border: 1px solid rgba(255,255,255,0.6); transition: all 0.4s cubic-bezier(0.16,1,0.3,1); }
                .event-card:hover { transform: scale(1.02); background: white; border-color: #6605c7; box-shadow: 0 30px 60px -20px rgba(0,0,0,0.12); }
                .date-box { background: linear-gradient(135deg, #7c3aed, #6605c7); color: white; }
            `}</style>

            <div className="relative z-10 pt-32 pb-24 max-w-5xl mx-auto px-6">
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-2 rounded-full bg-[#6605c7]/10 text-[#6605c7] text-[10px] font-bold uppercase tracking-widest mb-4">Live Networking</span>
                    <h1 className="text-5xl md:text-7xl font-bold mb-6" style={{ fontFamily: "'Noto Serif', serif" }}>
                        Community <span className="text-[#6605c7]">Events</span>
                    </h1>
                    <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
                        Join webinars, physical meetups, and Q&A sessions with loan experts and university alumni.
                    </p>
                </div>

                {loading ? (
                    <div className="space-y-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-40 rounded-[2.5rem] bg-white/40 animate-pulse border border-white/50" />
                        ))}
                    </div>
                ) : events.length === 0 ? (
                    <div className="e-glass p-16 rounded-[4rem] text-center max-w-2xl mx-auto">
                        <div className="text-6xl mb-6">📅</div>
                        <h3 className="text-2xl font-bold mb-2">Check back soon!</h3>
                        <p className="text-gray-500">We're planning exciting sessions for the coming weeks.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {events.map(ev => (
                            <div key={ev.id} className="event-card p-8 rounded-[3rem] flex flex-col md:flex-row items-center gap-10">
                                <div className="w-full md:w-32 h-32 date-box rounded-[2.5rem] flex flex-col items-center justify-center shadow-lg shrink-0">
                                    <span className="text-sm font-bold uppercase tracking-widest opacity-80">
                                        {ev.date ? new Date(ev.date).toLocaleDateString('en-US', { month: 'short' }) : 'TBD'}
                                    </span>
                                    <span className="text-4xl font-extrabold" style={{ fontFamily: "'Noto Serif', serif" }}>
                                        {ev.date ? new Date(ev.date).getDate() : '--'}
                                    </span>
                                </div>

                                <div className="flex-1 text-center md:text-left">
                                    <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-3">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${ev.isFree ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {ev.isFree ? 'Free Event' : 'Paid Session'}
                                        </span>
                                        <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold uppercase tracking-tighter">
                                            {ev.type || 'Webinar'}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2 text-gray-900 group-hover:text-[#6605c7] transition-colors">
                                        {ev.title}
                                    </h3>
                                    <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">
                                        {ev.description || "Join this exclusive session to get your doubts cleared by experts."}
                                    </p>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        <div className="flex items-center gap-2">🕒 {ev.time || '6:00 PM'}</div>
                                        <div className="flex items-center gap-2">📍 {ev.location || 'Online / Zoom'}</div>
                                    </div>
                                </div>

                                <button className="w-full md:w-auto px-10 py-4 rounded-2xl bg-[#6605c7] text-white font-bold text-xs uppercase tracking-widest hover:shadow-xl transition-all shadow-lg whitespace-nowrap">
                                    Register Now
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
