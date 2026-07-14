"use client";

import { useUserDossier } from "../DossierContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";

interface CalendarEvent {
    id: string;
    title: string;
    studentName: string;
    type: "counseling" | "verification" | "bank" | "general";
    date: string; // YYYY-MM-DD
    startTime: string;
    endTime: string;
    location: string;
}

export default function CalendarTab() {
    const { userData } = useUserDossier();
    const { user: staffUser } = useAuth();
    const [selectedAgendaDay, setSelectedAgendaDay] = useState<string | null>(null);
    const [filterMyCalendar, setFilterMyCalendar] = useState(true);
    const [events, setEvents] = useState<CalendarEvent[]>([]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const followUpKey = staffUser?.id 
                ? `staff_follow_up_dates_${staffUser.id}` 
                : staffUser?.email 
                    ? `staff_follow_up_dates_${staffUser.email}` 
                    : `staff_follow_up_dates_default`;

            const stored = localStorage.getItem(followUpKey);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored) as Record<string, { date: string, time: string, studentName: string, appNumber: string }>;
                    const mappedEvents = Object.keys(parsed).map(key => {
                        const val = parsed[key];
                        const formatTime12h = (tStr: string) => {
                            if (!tStr) return "10:00 AM";
                            try {
                                const [h, m] = tStr.split(':');
                                const hrs = parseInt(h);
                                const ampm = hrs >= 12 ? 'PM' : 'AM';
                                const hrs12 = hrs % 12 || 12;
                                return `${hrs12}:${m} ${ampm}`;
                            } catch {
                                return tStr;
                            }
                        };
                        return {
                            id: key,
                            title: val.appNumber || "Loan Follow-up",
                            studentName: val.studentName || "Student",
                            type: "counseling" as const,
                            date: val.date, // YYYY-MM-DD
                            startTime: formatTime12h(val.time),
                            endTime: "",
                            location: "Office Node"
                        };
                    });
                    setEvents(mappedEvents);
                } catch (e) {
                    console.error("Failed to parse follow up dates:", e);
                }
            } else {
                setEvents([]);
            }
        }
    }, [staffUser]);

    const calendarDays = [
        // Week 1
        { date: "2026-06-28", dayNum: 28, isCurrentMonth: false, weekNum: 27 },
        { date: "2026-06-29", dayNum: 29, isCurrentMonth: false, weekNum: 27 },
        { date: "2026-06-30", dayNum: 30, isCurrentMonth: false, weekNum: 27 },
        { date: "2026-07-01", dayNum: 1, isCurrentMonth: true, weekNum: 27 },
        { date: "2026-07-02", dayNum: 2, isCurrentMonth: true, weekNum: 27 },
        { date: "2026-07-03", dayNum: 3, isCurrentMonth: true, weekNum: 27 },
        { date: "2026-07-04", dayNum: 4, isCurrentMonth: true, weekNum: 27 },
        // Week 2
        { date: "2026-07-05", dayNum: 5, isCurrentMonth: true, weekNum: 28 },
        { date: "2026-07-06", dayNum: 6, isCurrentMonth: true, weekNum: 28 },
        { date: "2026-07-07", dayNum: 7, isCurrentMonth: true, weekNum: 28 },
        { date: "2026-07-08", dayNum: 8, isCurrentMonth: true, weekNum: 28 },
        { date: "2026-07-09", dayNum: 9, isCurrentMonth: true, weekNum: 28 },
        { date: "2026-07-10", dayNum: 10, isCurrentMonth: true, weekNum: 28 },
        { date: "2026-07-11", dayNum: 11, isCurrentMonth: true, weekNum: 28 },
        // Week 3
        { date: "2026-07-12", dayNum: 12, isCurrentMonth: true, weekNum: 29 },
        { date: "2026-07-13", dayNum: 13, isCurrentMonth: true, weekNum: 29 },
        { date: "2026-07-14", dayNum: 14, isCurrentMonth: true, weekNum: 29 },
        { date: "2026-07-15", dayNum: 15, isCurrentMonth: true, weekNum: 29 },
        { date: "2026-07-16", dayNum: 16, isCurrentMonth: true, weekNum: 29 },
        { date: "2026-07-17", dayNum: 17, isCurrentMonth: true, weekNum: 29 },
        { date: "2026-07-18", dayNum: 18, isCurrentMonth: true, weekNum: 29 },
        // Week 4
        { date: "2026-07-19", dayNum: 19, isCurrentMonth: true, weekNum: 30 },
        { date: "2026-07-20", dayNum: 20, isCurrentMonth: true, weekNum: 30 },
        { date: "2026-07-21", dayNum: 21, isCurrentMonth: true, weekNum: 30 },
        { date: "2026-07-22", dayNum: 22, isCurrentMonth: true, weekNum: 30 },
        { date: "2026-07-23", dayNum: 23, isCurrentMonth: true, weekNum: 30 },
        { date: "2026-07-24", dayNum: 24, isCurrentMonth: true, weekNum: 30 },
        { date: "2026-07-25", dayNum: 25, isCurrentMonth: true, weekNum: 30 },
        // Week 5
        { date: "2026-07-26", dayNum: 26, isCurrentMonth: true, weekNum: 31 },
        { date: "2026-07-27", dayNum: 27, isCurrentMonth: true, weekNum: 31 },
        { date: "2026-07-28", dayNum: 28, isCurrentMonth: true, weekNum: 31 },
        { date: "2026-07-29", dayNum: 29, isCurrentMonth: true, weekNum: 31 },
        { date: "2026-07-30", dayNum: 30, isCurrentMonth: true, weekNum: 31 },
        { date: "2026-07-31", dayNum: 31, isCurrentMonth: true, weekNum: 31 },
        { date: "2026-08-01", dayNum: 1, isCurrentMonth: false, weekNum: 31 },
        // Week 6
        { date: "2026-08-02", dayNum: 2, isCurrentMonth: false, weekNum: 32 },
        { date: "2026-08-03", dayNum: 3, isCurrentMonth: false, weekNum: 32 },
        { date: "2026-08-04", dayNum: 4, isCurrentMonth: false, weekNum: 32 },
        { date: "2026-08-05", dayNum: 5, isCurrentMonth: false, weekNum: 32 },
        { date: "2026-08-06", dayNum: 6, isCurrentMonth: false, weekNum: 32 },
        { date: "2026-08-07", dayNum: 7, isCurrentMonth: false, weekNum: 32 },
        { date: "2026-08-08", dayNum: 8, isCurrentMonth: false, weekNum: 32 }
    ];

    const getDayEvents = (dateStr: string) => {
        return events.filter(e => e.date === dateStr);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col lg:flex-row gap-6 items-start w-full"
        >
            {/* Left Filter & Controls Panel */}
            <div className="w-full lg:w-64 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4 shrink-0">
                <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Calendar View</h3>
                    <p className="text-[10px] text-indigo-600 font-bold mt-0.5">Active Counseling Calendar</p>
                </div>
                
                <div className="border-t border-slate-100 pt-3">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={filterMyCalendar}
                            onChange={e => setFilterMyCalendar(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500/20"
                        />
                        <span className="text-xs font-bold text-slate-700">My Calendar</span>
                    </label>
                    <p className="text-[9px] text-slate-400 ml-6 mt-0.5">Filter events related to this branch node</p>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Legend Colors</span>
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                            <span className="text-[10px] font-semibold text-slate-600">Follow-up Schedules</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar Main Grid Container */}
            <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden relative w-full">
                {/* Calendar Toolbar Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 select-none">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-600 text-[20px]">calendar_month</span>
                        <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">My Calendar</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200/55">
                            <button type="button" className="px-2.5 py-1 text-[10px] font-black text-slate-500 hover:text-slate-800 cursor-pointer uppercase">{"<"}</button>
                            <span className="px-3 text-[10px] font-black text-slate-800 uppercase">July 2026 / Week 27 - 32</span>
                            <button type="button" className="px-2.5 py-1 text-[10px] font-black text-slate-500 hover:text-slate-800 cursor-pointer uppercase">{">"}</button>
                        </div>
                        <button type="button" className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-wider active:scale-95 cursor-pointer">
                            Today
                        </button>
                        <div className="flex items-center border border-slate-200 bg-slate-50 rounded-xl p-0.5 text-xs text-slate-700 font-semibold">
                            <span className="px-2.5 py-1 bg-white text-indigo-600 rounded-lg shadow-sm font-bold text-[10px] uppercase cursor-pointer">Month</span>
                            <span className="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-[10px] uppercase cursor-pointer">Week</span>
                            <span className="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-[10px] uppercase cursor-pointer">Day</span>
                        </div>
                    </div>
                </div>

                {/* Calendar Month View Table Grid */}
                <div className="grid grid-cols-7 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50 gap-[1px]">
                    {/* Days Header Row */}
                    {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, idx) => (
                        <div key={idx} className="bg-white px-3 py-2 text-center border-b border-slate-100">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{day}</span>
                        </div>
                    ))}

                    {/* Month Days Cell Grid */}
                    {calendarDays.map((cell, idx) => {
                        const dayEvents = getDayEvents(cell.date);
                        const isToday = cell.date === "2026-07-14";
                        
                        return (
                            <div
                                key={idx}
                                className={`min-h-[100px] bg-white p-2 relative flex flex-col group transition-colors hover:bg-slate-50/30 ${!cell.isCurrentMonth ? "bg-slate-50/20 text-slate-300" : "text-slate-700"}`}
                            >
                                <span className={`text-[10px] font-bold ${isToday ? "w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black" : "text-slate-400"}`}>
                                    {cell.dayNum}
                                </span>

                                <div className="mt-1.5 space-y-1 overflow-hidden flex-1">
                                    {dayEvents.slice(0, 2).map(e => {
                                        const colorStyle = "bg-rose-50 text-rose-700 border-rose-105";
                                        
                                        return (
                                            <div
                                                key={e.id}
                                                className={`px-1.5 py-0.5 rounded border text-[9px] font-medium leading-tight truncate flex items-center gap-1 ${colorStyle}`}
                                                title={`${e.title} ${e.studentName ? `(${e.studentName})` : ""}`}
                                            >
                                                <span className="material-symbols-outlined text-[10px] shrink-0">calendar_today</span>
                                                <span className="truncate">{e.title} {e.studentName ? `(${e.studentName})` : ""}</span>
                                            </div>
                                        );
                                    })}
                                    
                                    {dayEvents.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedAgendaDay(cell.date)}
                                            className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wider block mt-1 cursor-pointer pl-1 text-left border-0 bg-transparent p-0"
                                        >
                                            more...
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Agenda Details Dialog Popover */}
            <AnimatePresence>
                {selectedAgendaDay && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col"
                        >
                            {/* Dialog Header */}
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">Agenda</h3>
                                    <p className="text-[10px] text-slate-400">Scheduled events for {selectedAgendaDay}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedAgendaDay(null)}
                                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-150 transition-colors border-0 bg-transparent cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>

                            {/* Dialog Body / Agenda Items */}
                            <div className="p-6 divide-y divide-slate-100 overflow-y-auto max-h-[350px]">
                                {getDayEvents(selectedAgendaDay).map(e => (
                                    <div key={e.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-rose-50 text-rose-600">
                                            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-xs font-bold text-slate-800">{e.title}</h4>
                                            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                                {selectedAgendaDay}, {e.startTime}
                                            </p>
                                            {e.studentName && (
                                                <p className="text-[10px] text-indigo-600 font-bold mt-1">Student: {e.studentName}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
