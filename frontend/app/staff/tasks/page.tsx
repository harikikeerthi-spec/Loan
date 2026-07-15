"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface FollowUp {
    date: string;
    time: string;
    studentName: string;
    appNumber: string;
    notes?: string;
}

export default function RemindersPage() {
    const router = useRouter();
    const { user } = useAuth();

    // Follow-up reminders
    const [followUps, setFollowUps] = useState<Record<string, FollowUp>>({});
    const [filterUpcoming, setFilterUpcoming] = useState<"all" | "today" | "upcoming" | "overdue">("all");

    // Calendar state
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [calendarView, setCalendarView] = useState<"month" | "week" | "day">("month");

    const followUpKey = user?.id
        ? `staff_follow_up_dates_${user.id}`
        : user?.email
            ? `staff_follow_up_dates_${user.email}`
            : `staff_follow_up_dates_default`;

    // Load follow-up reminders
    useEffect(() => {
        try {
            const saved = localStorage.getItem(followUpKey);
            if (saved) setFollowUps(JSON.parse(saved));
        } catch (e) { console.error(e); }
    }, [followUpKey]);

    const clearFollowUp = (appId: string) => {
        const updated = { ...followUps };
        delete updated[appId];
        setFollowUps(updated);
        localStorage.setItem(followUpKey, JSON.stringify(updated));
    };

    // Classify follow-ups
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const allFollowUpEntries = Object.entries(followUps).map(([appId, fu]) => {
        const d = new Date(fu.date + "T00:00:00");
        const isToday = d.getTime() === today.getTime();
        const isOverdue = d < today;
        const isUpcoming = d >= tomorrow;
        return { appId, ...fu, dateObj: d, isToday, isOverdue, isUpcoming };
    }).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    const filteredFollowUps = allFollowUpEntries.filter(fu => {
        if (filterUpcoming === "today") return fu.isToday;
        if (filterUpcoming === "overdue") return fu.isOverdue;
        if (filterUpcoming === "upcoming") return fu.isUpcoming;
        return true;
    });

    const counts = {
        all: allFollowUpEntries.length,
        today: allFollowUpEntries.filter(f => f.isToday).length,
        overdue: allFollowUpEntries.filter(f => f.isOverdue).length,
        upcoming: allFollowUpEntries.filter(f => f.isUpcoming).length,
    };

    const formatDateLabel = (fu: typeof allFollowUpEntries[0]) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const d = fu.dateObj;
        return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    const statusChip = (fu: typeof allFollowUpEntries[0]) => {
        if (fu.isOverdue) return { label: "Overdue", cls: "bg-rose-50 text-rose-700 border-rose-100" };
        if (fu.isToday) return { label: "Today", cls: "bg-amber-50 text-amber-700 border-amber-100" };
        return { label: "Upcoming", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" };
    };

    // --- Calendar helpers ---
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const calYear = calendarDate.getFullYear();
    const calMonth = calendarDate.getMonth();

    const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();

    // Build follow-up map by date string "YYYY-MM-DD"
    const followUpsByDate: Record<string, typeof allFollowUpEntries> = {};
    allFollowUpEntries.forEach(fu => {
        const key = fu.date;
        if (!followUpsByDate[key]) followUpsByDate[key] = [];
        followUpsByDate[key].push(fu);
    });

    const toDateKey = (y: number, m: number, d: number) =>
        `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    const prevMonth = () => setCalendarDate(new Date(calYear, calMonth - 1, 1));
    const nextMonth = () => setCalendarDate(new Date(calYear, calMonth + 1, 1));
    const goToday = () => setCalendarDate(new Date());

    // Build calendar grid cells
    const cells: { day: number; month: "prev" | "current" | "next"; dateKey: string }[] = [];
    // Prev month padding
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        const d = daysInPrevMonth - i;
        const m = calMonth - 1 < 0 ? 11 : calMonth - 1;
        const y = calMonth - 1 < 0 ? calYear - 1 : calYear;
        cells.push({ day: d, month: "prev", dateKey: toDateKey(y, m, d) });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ day: d, month: "current", dateKey: toDateKey(calYear, calMonth, d) });
    }
    // Next month padding to fill 6 rows
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
        const m = calMonth + 1 > 11 ? 0 : calMonth + 1;
        const y = calMonth + 1 > 11 ? calYear + 1 : calYear;
        cells.push({ day: d, month: "next", dateKey: toDateKey(y, m, d) });
    }

    const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

    // Week number helper
    const getWeekNumber = (d: Date) => {
        const startOfYear = new Date(d.getFullYear(), 0, 1);
        const diff = d.getTime() - startOfYear.getTime();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        return Math.ceil((diff / oneWeek) + startOfYear.getDay() / 7);
    };
    const startWeek = getWeekNumber(new Date(calYear, calMonth, 1));
    const endWeek = getWeekNumber(new Date(calYear, calMonth, daysInMonth));

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-[28px] tracking-tight flex items-center gap-3 font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">
                        Reminders
                        {counts.overdue > 0 && (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-[11px] font-semibold text-rose-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                {counts.overdue} Overdue
                            </span>
                        )}
                    </h2>
                    <p className="text-slate-500 text-[13px] mt-1 font-medium">All your scheduled follow-ups in one place.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 columns: Calendar */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        {/* Calendar toolbar */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-indigo-500 text-[20px]">calendar_month</span>
                                <div>
                                    <span className="text-[13px] font-black text-slate-800 uppercase tracking-wider">
                                        {MONTHS[calMonth]} {calYear}
                                    </span>
                                    <span className="ml-2 text-[10px] text-slate-400 font-semibold">
                                        / WEEK {startWeek} – {endWeek}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-all">
                                    <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                                </button>
                                <button onClick={goToday} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 transition-all">
                                    Today
                                </button>
                                <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-all">
                                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                                </button>
                                <div className="flex border border-slate-200 rounded-lg overflow-hidden ml-2">
                                    {(["month", "week", "day"] as const).map(v => (
                                        <button key={v} onClick={() => setCalendarView(v)}
                                            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wide transition-all ${calendarView === v ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="px-6 py-2 bg-slate-50/50 border-b border-slate-100 flex items-center gap-4">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Legend</span>
                            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                Follow-up Schedules
                            </span>
                        </div>

                        {/* Day headers */}
                        <div className="grid grid-cols-7 border-b border-slate-100">
                            {DAYS.map(d => (
                                <div key={d} className="py-2 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7" style={{ minHeight: 420 }}>
                            {cells.map((cell, idx) => {
                                const isCurrentMonth = cell.month === "current";
                                const isToday = cell.dateKey === todayKey;
                                const events = followUpsByDate[cell.dateKey] || [];
                                return (
                                    <div
                                        key={idx}
                                        className={`min-h-[70px] p-1.5 border-b border-r border-slate-100 transition-all ${isCurrentMonth ? 'bg-white' : 'bg-slate-50/40'} ${idx % 7 === 6 ? 'border-r-0' : ''}`}
                                    >
                                        <div className={`w-7 h-7 flex items-center justify-center rounded-full text-[12px] font-bold mb-1 ${isToday ? 'bg-indigo-600 text-white' : isCurrentMonth ? 'text-slate-700' : 'text-slate-300'}`}>
                                            {cell.day}
                                        </div>
                                        <div className="space-y-0.5">
                                            {events.slice(0, 2).map(ev => (
                                                <button
                                                    key={ev.appId}
                                                    onClick={() => router.push(`/staff/applications/${ev.appId}`)}
                                                    title={`${ev.studentName} — ${ev.appNumber || ev.appId}`}
                                                    className="w-full text-left px-1.5 py-0.5 rounded text-[9px] font-bold truncate flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-[9px]">calendar_today</span>
                                                    {ev.appNumber || ev.appId}
                                                </button>
                                            ))}
                                            {events.length > 2 && (
                                                <span className="text-[8px] text-slate-400 font-bold pl-1">+{events.length - 2} more</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right column: Follow-up Schedule list */}
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                        {/* Filter tabs */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[14px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                <span className="material-symbols-outlined text-indigo-500 text-[20px]">notifications_active</span>
                                Follow-up Schedule
                            </h3>
                        </div>

                        {/* Filter pills */}
                        <div className="flex flex-wrap gap-1 mb-4">
                            {(["all", "today", "overdue", "upcoming"] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilterUpcoming(f)}
                                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border ${filterUpcoming === f
                                        ? 'bg-white border-indigo-300 text-indigo-600 shadow-sm'
                                        : 'border-slate-200 text-slate-400 hover:text-slate-600 bg-slate-50'}`}
                                >
                                    {f} {counts[f] > 0 && <span className={`${f === 'overdue' ? 'text-rose-500' : f === 'today' ? 'text-amber-500' : ''}`}>({counts[f]})</span>}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-0.5" style={{ scrollbarWidth: 'thin' }}>
                            {filteredFollowUps.length === 0 ? (
                                <div className="py-12 text-center">
                                    <span className="material-symbols-outlined text-4xl text-slate-100 mb-3 block">event_available</span>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">No follow-ups {filterUpcoming !== "all" ? `for ${filterUpcoming}` : "scheduled"}</p>
                                    <p className="text-slate-300 text-[10px] mt-1">Set a follow-up from the Incoming Queue.</p>
                                </div>
                            ) : (
                                filteredFollowUps.map(fu => {
                                    const chip = statusChip(fu);
                                    return (
                                        <div
                                            key={fu.appId}
                                            className={`p-3.5 border rounded-2xl transition-all hover:shadow-sm ${fu.isOverdue ? 'border-rose-100 bg-rose-50/30' : fu.isToday ? 'border-amber-100 bg-amber-50/20' : 'border-slate-200 bg-white hover:border-indigo-100'}`}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="min-w-0">
                                                    <p className="text-[13px] font-bold text-slate-800 truncate">{fu.studentName || "—"}</p>
                                                    <p className="text-[10px] text-indigo-500 font-bold">{fu.appNumber || fu.appId}</p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border flex-shrink-0 ${chip.cls}`}>{chip.label}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] text-slate-500 font-semibold mb-3">
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                                                    {formatDateLabel(fu)}
                                                </span>
                                                {fu.time && (
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                                                        {fu.time}
                                                    </span>
                                                )}
                                            </div>
                                            {fu.notes && (
                                                <p className="text-[10px] text-slate-400 italic mb-3 truncate">{fu.notes}</p>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => router.push(`/staff/applications/${fu.appId}`)}
                                                    className="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-1"
                                                >
                                                    View
                                                    <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                                                </button>
                                                <button
                                                    onClick={() => clearFollowUp(fu.appId)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-100 transition-all"
                                                    title="Clear reminder"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">close</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
