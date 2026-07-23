"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { staffProfileApi } from "@/lib/api";

export default function DeadlineCalendarPage() {
    const router = useRouter();
    const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadCalendarEvents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await staffProfileApi.getDeadlineCalendar() as any;
            if (res && res.success) {
                setCalendarEvents(res.data || []);
            } else if (Array.isArray(res)) {
                setCalendarEvents(res);
            }
        } catch (err) {
            console.error("Error loading calendar events:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCalendarEvents();
    }, [loadCalendarEvents]);

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in pb-12 font-sans">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-[28px] tracking-tight flex items-center gap-3 font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">
                        Deadline Calendar & SLA Breaches
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-[11px] font-semibold text-rose-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            SYSTEM DEADLINES
                        </span>
                    </h2>
                    <p className="text-slate-500 text-[13px] mt-1 font-medium">Monitoring upcoming sanction expiries, SLA warnings, and disbursements.</p>
                </div>
                <button
                    onClick={loadCalendarEvents}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                    Refresh Calendar
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Upcoming Deadlines</h3>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-555 px-2.5 py-0.5 rounded-full">{calendarEvents.length} Events</span>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="p-16 text-center">
                            <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Loading calendar deadlines...</p>
                        </div>
                    ) : calendarEvents.length > 0 ? (
                        calendarEvents.map((evt: any) => {
                            let icon = "event";
                            let color = "bg-slate-50 text-slate-600 border-slate-100";
                            if (evt.category === 'expiry') {
                                icon = "warning";
                                color = "bg-rose-50 text-rose-600 border-rose-100";
                            } else if (evt.category === 'sla') {
                                icon = "hourglass_empty";
                                color = "bg-amber-50 text-amber-600 border-amber-100";
                            } else if (evt.category === 'disbursement') {
                                icon = "payments";
                                color = "bg-emerald-50 text-emerald-600 border-emerald-100";
                            }
                            return (
                                <div key={evt.id || evt._id} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/20 hover:bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-sm">
                                    <div className="flex items-start gap-4 min-w-0">
                                        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${color}`}>
                                            <span className="material-symbols-outlined text-[20px]">{icon}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-xs font-extrabold text-slate-800 truncate">{evt.title}</h4>
                                            <p className="text-[11px] text-slate-500 font-semibold mt-1 leading-relaxed">{evt.description}</p>
                                            <p className="text-[9px] text-slate-400 mt-1 font-bold flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                                                Due: {new Date(evt.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                                            </p>
                                        </div>
                                    </div>
                                    {evt.applicationId && (
                                        <button
                                            onClick={() => router.push(`/staff/applications/${evt.applicationId}`)}
                                            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm hover:shadow shrink-0 self-end md:self-center"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">visibility</span>
                                            View File
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-16 text-center">
                            <span className="material-symbols-outlined text-5xl text-slate-250 mb-2 block">event_busy</span>
                            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">No Events Scheduled</p>
                            <p className="text-[11px] text-slate-400 mt-1">There are no warning breaches or sanction expiries registered.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
