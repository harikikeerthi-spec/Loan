"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    parseISO,
    addDays,
    addMonths as addMonthsDate
} from "date-fns";

interface CalendarEvent {
    id: string;
    studentName: string;
    lanNumber: string;
    amount: number;
    type: "expiry" | "sla" | "tranche";
    date: Date;
    label: string;
    details: string;
}

export default function CalendarViewPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

    const currentBankId = typeof window !== "undefined" ? sessionStorage.getItem("selectedBank") || "idfc" : "idfc";

    useEffect(() => {
        setMounted(true);
        const fetchApps = async () => {
            setLoading(true);
            try {
                const res: any = await adminApi.getApplications({ bank: currentBankId });
                if (res && res.success) {
                    setApplications(res.data || []);
                }
            } catch (err) {
                console.error("Failed to load applications for calendar:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchApps();
    }, [currentBankId]);

    // Derive calendar events from applications
    const events: CalendarEvent[] = useMemo(() => {
        const derived: CalendarEvent[] = [];

        applications.forEach(app => {
            const studentName = `${app.firstName || ""} ${app.lastName || ""}`.trim() || "Anonymous Student";
            const lan = app.lanNumber || app.applicationNumber || "Pending LAN";
            const amt = app.amount || 0;

            // 1. SLA Dates (5 days from creation/submission for active review cases)
            const submitDateStr = app.submittedAt || app.createdAt;
            if (submitDateStr && app.status !== "approved" && app.status !== "disbursed" && app.status !== "rejected") {
                const submitDate = new Date(submitDateStr);
                const slaDate = addDays(submitDate, 5);
                derived.push({
                    id: `${app.id}-sla`,
                    studentName,
                    lanNumber: lan,
                    amount: amt,
                    type: "sla",
                    date: slaDate,
                    label: `SLA Deadline: ${studentName}`,
                    details: `Decision target milestone (5 days TAT limit) for ${lan}`
                });
            }

            // 2. Expiries (6 months from approval date)
            const approvedDateStr = app.approvedAt || app.sanctionDate;
            if (approvedDateStr && (app.status === "approved" || app.status === "disbursed")) {
                const approvedDate = new Date(approvedDateStr);
                const expiryDate = app.sanctionExpiry ? new Date(app.sanctionExpiry) : addMonthsDate(approvedDate, 6);
                derived.push({
                    id: `${app.id}-expiry`,
                    studentName,
                    lanNumber: lan,
                    amount: amt,
                    type: "expiry",
                    date: expiryDate,
                    label: `Sanction Expiry: ${studentName}`,
                    details: `Validity expiry of sanction terms for ${lan}`
                });
            }

            // 3. Disbursement Tranches (Scheduled disbursement payouts, e.g., 7 days after approval)
            if (approvedDateStr && app.status === "approved") {
                const approvedDate = new Date(approvedDateStr);
                const trancheDate = addDays(approvedDate, 7);
                derived.push({
                    id: `${app.id}-tranche`,
                    studentName,
                    lanNumber: lan,
                    amount: amt,
                    type: "tranche",
                    date: trancheDate,
                    label: `Tranche Dues: ${studentName}`,
                    details: `Scheduled fund transfer execution of ₹${(app.sanctionAmount || amt).toLocaleString()} for ${lan}`
                });
            }
        });

        return derived;
    }, [applications]);

    // Calendar Grid helper variables
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = useMemo(() => {
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [startDate, endDate]);

    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const today = () => {
        setCurrentDate(new Date());
        setSelectedDate(new Date());
    };

    // Events filter by selected date
    const selectedDateEvents = useMemo(() => {
        if (!selectedDate) return [];
        return events.filter(e => isSameDay(e.date, selectedDate));
    }, [selectedDate, events]);

    if (!mounted) return null;

    return (
        <div className="min-h-screen p-5 lg:p-8 space-y-6 relative z-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-2">
                <div className="space-y-3">
                    <h2 className="text-3xl lg:text-4xl font-black font-display text-gray-900 tracking-tighter leading-none uppercase">
                        Calendar <span className="text-[#6605c7]">Scheduler</span>
                    </h2>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] flex items-center gap-2 pl-1">
                        Expiries, SLA warning dates, and scheduled payouts
                    </p>
                </div>

                <div className="flex gap-2 bg-white/70 border border-purple-50 p-1 rounded-2xl shadow-sm">
                    <button onClick={prevMonth} className="p-2 hover:bg-purple-50/50 rounded-xl text-gray-600 transition-all flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm font-black">chevron_left</span>
                    </button>
                    <span className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-800 min-w-[120px] text-center flex items-center justify-center">
                        {format(currentDate, "MMMM yyyy")}
                    </span>
                    <button onClick={nextMonth} className="p-2 hover:bg-purple-50/50 rounded-xl text-gray-600 transition-all flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm font-black">chevron_right</span>
                    </button>
                    <button onClick={today} className="px-4 py-2 bg-[#6605c7] hover:bg-[#5203a4] text-white text-[9px] font-black uppercase tracking-wider rounded-xl shadow-sm transition-all">
                        Today
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-[400px] flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-gray-150 border-t-[#6605c7] rounded-full animate-spin" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Syncing calendar schedule...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left: Monthly Grid Calendar */}
                    <div className="lg:col-span-8 glass-card bg-white border border-purple-50 rounded-[3rem] p-6 shadow-sm overflow-hidden flex flex-col justify-between">
                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 gap-1 text-center border-b border-gray-100 pb-3 mb-2">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                                <span key={d} className="text-[9px] font-black uppercase tracking-widest text-[#6605c7]">{d}</span>
                            ))}
                        </div>

                        {/* Calendar cells */}
                        <div className="grid grid-cols-7 gap-1">
                            {days.map((day, idx) => {
                                const dayEvents = events.filter(e => isSameDay(e.date, day));
                                const isCurrentMonth = isSameMonth(day, currentDate);
                                const isSelected = selectedDate && isSameDay(day, selectedDate);
                                const isToday = isSameDay(day, new Date());

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => setSelectedDate(day)}
                                        className={`min-h-[90px] p-2 border rounded-2xl flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden group select-none ${
                                            isSelected 
                                                ? "border-[#6605c7] bg-purple-50/15" 
                                                : "border-gray-50/65 bg-white/70 hover:border-[#6605c7]/40 hover:bg-purple-50/5"
                                        } ${!isCurrentMonth ? "opacity-35" : ""}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className={`text-[10px] font-black leading-none ${
                                                isToday 
                                                    ? "w-5 h-5 rounded-full bg-[#6605c7] text-white flex items-center justify-center shadow" 
                                                    : isSelected
                                                        ? "text-[#6605c7] font-black"
                                                        : "text-gray-800"
                                            }`}>
                                                {format(day, "d")}
                                            </span>
                                        </div>

                                        {/* Color Dots Indicators for events */}
                                        <div className="space-y-1 mt-2">
                                            {dayEvents.slice(0, 2).map((e, index) => (
                                                <div 
                                                    key={index} 
                                                    className={`px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase tracking-wider truncate border ${
                                                        e.type === "sla" ? "bg-rose-50 text-rose-600 border-rose-100" :
                                                        e.type === "expiry" ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                        "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                    }`}
                                                >
                                                    {e.type === "sla" ? "SLA" : e.type === "expiry" ? "EXP" : "TRN"} • {e.studentName.split(" ")[0]}
                                                </div>
                                            ))}
                                            {dayEvents.length > 2 && (
                                                <div className="text-[7px] font-bold text-gray-400 text-right pr-1">
                                                    +{dayEvents.length - 2} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Sidebar displaying selected date's events list */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="glass-card bg-white border border-purple-50 rounded-[3rem] p-6 shadow-sm min-h-[300px] flex flex-col justify-between">
                            <div>
                                <div className="border-b border-gray-150 pb-4 mb-4 flex justify-between items-center">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">
                                        {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Selected Events"}
                                    </h3>
                                    <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black bg-purple-50 text-[#6605c7]">
                                        {selectedDateEvents.length} Tasks
                                    </span>
                                </div>

                                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                                    {selectedDateEvents.length === 0 ? (
                                        <div className="py-16 text-center text-gray-450 uppercase tracking-widest text-[9px] font-bold">
                                            No bank events scheduled
                                        </div>
                                    ) : (
                                        selectedDateEvents.map(event => (
                                            <div 
                                                key={event.id}
                                                className={`p-4 border rounded-2xl space-y-2 relative transition-all group ${
                                                    event.type === "sla" ? "bg-rose-50/15 border-rose-100" :
                                                    event.type === "expiry" ? "bg-amber-50/15 border-amber-100" :
                                                    "bg-emerald-50/15 border-emerald-100"
                                                }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className={`px-2 py-0.5 rounded-lg text-[7.5px] font-black uppercase tracking-wider border ${
                                                        event.type === "sla" ? "bg-rose-100 text-rose-700 border-rose-200" :
                                                        event.type === "expiry" ? "bg-amber-100 text-amber-700 border-amber-200" :
                                                        "bg-emerald-100 text-emerald-700 border-emerald-200"
                                                    }`}>
                                                        {event.type}
                                                    </span>
                                                    <span className="font-mono text-[9px] text-[#6605c7] font-black">₹{event.amount.toLocaleString()}</span>
                                                </div>

                                                <h4 className="text-xs font-black text-gray-900 uppercase tracking-tight leading-snug">{event.studentName}</h4>
                                                <p className="text-[10px] text-gray-500 leading-relaxed font-semibold">{event.details}</p>

                                                <button
                                                    onClick={() => router.push(`/bank/applications?id=${event.id.split("-")[0]}`)}
                                                    className="w-full py-2 bg-white hover:bg-purple-50 text-[9px] font-black uppercase tracking-widest text-purple-700 border border-purple-100 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                                                >
                                                    <span className="material-symbols-outlined text-[12px]">search</span> Review Case Folder
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Brief Ticker summary */}
                            <div className="border-t border-gray-150 pt-4 mt-6 text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                                SLA Compliance is verified. Review deadlines daily to avoid breach warnings.
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
