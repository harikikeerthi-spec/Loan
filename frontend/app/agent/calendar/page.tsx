"use client";

import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { useAgent } from "../AgentContext";
import { getTodayDateTimeLocalString } from "@/lib/followUpUtils";

const CALENDAR_DAYS = [
    {
        day: "Mon 20", date: "20-Jun",
        tasks: [{ type: "callback", emoji: "📞", label: "Call: Rahul K." }],
        isToday: false,
    },
    {
        day: "Tue 21", date: "21-Jun",
        tasks: [{ type: "doc", emoji: "📁", label: "Doc Chase: Meena P." }],
        isToday: false,
    },
    {
        day: "Wed 22", date: "22-Jun",
        tasks: [{ type: "bank", emoji: "⚠️", label: "Priya — Bank Query Deadline" }],
        isToday: true,
    },
    {
        day: "Thu 23", date: "23-Jun",
        tasks: [
            { type: "callback", emoji: "📞", label: "Call: Asha R." },
            { type: "sanction", emoji: "📅", label: "Sanction Expiry!" },
        ],
        isToday: false,
    },
    {
        day: "Fri 24", date: "24-Jun",
        tasks: [{ type: "campus", emoji: "🎓", label: "Meeting: IIT Campus Event" }],
        isToday: false,
    },
    {
        day: "Sat 25", date: "25-Jun",
        tasks: [{ type: "followup", emoji: "🆕", label: "Follow-Up: Kiran Rao (Doc)" }],
        isToday: false,
    },
];

const TASK_TYPES = [
    { emoji: "📞", label: "Callback",           trigger: "Manual / Auto",       example: "Call student who didn't answer" },
    { emoji: "📁", label: "Document Chase",      trigger: "Auto (48hr no upload)",example: "Send upload link to student" },
    { emoji: "⚠️", label: "Bank Query Deadline", trigger: "Auto (bank raises query)", example: "Respond/upload before deadline" },
    { emoji: "📅", label: "Sanction Expiry Alert",trigger: "Auto (30/15/7/1 days)",  example: "Nudge student to proceed with disbursal" },
    { emoji: "🎓", label: "Campus Event",        trigger: "Manual",              example: "Attend college counseling day" },
    { emoji: "💬", label: "Student Callback",    trigger: "Manual",              example: "Student requested callback at specific time" },
    { emoji: "🆕", label: "New Lead Follow-Up",  trigger: "Manual",              example: "Initial contact with newly submitted lead" },
];

const OVERDUE_TASKS = [
    { name: "Meena Pillai", type: "Doc Chase",  overdue: "Overdue 2 days",  severity: "red" },
    { name: "Deepak Kumar", type: "Callback",   overdue: "Overdue 1 day",   severity: "red" },
    { name: "Asha Reddy",   type: "Follow-Up",  overdue: "Due Yesterday",   severity: "yellow" },
];

export default function AgentCalendar() {
    const {
        applications,
        tasks, setTasks,
        calendarFilter, setCalendarFilter,
        newTaskForm, setNewTaskForm,
        handleAddTask, showToast,
    } = useAgent();

    const [overdueItems, setOverdueItems] = useState(OVERDUE_TASKS);

    const filteredTasks = useMemo(() => {
        if (calendarFilter === "All") return tasks;
        return tasks.filter((t) => t.type === calendarFilter);
    }, [tasks, calendarFilter]);

    return (
        <div className="animate-fade-in-up space-y-8 relative z-10">

            {/* ─── June 2026 Calendar Strip ─── */}
            <section className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">JUNE 2026 — MY TASKS</h3>
                    <span className="text-[10px] font-black text-[#6605c7] bg-[#6605c7]/5 px-3 py-1.5 rounded-full uppercase tracking-widest">Week View</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {CALENDAR_DAYS.map((day, i) => (
                        <div
                            key={i}
                            className={`p-4 rounded-2xl min-h-[140px] flex flex-col gap-2 border relative overflow-hidden transition-all ${
                                day.isToday
                                    ? "bg-rose-50 border-rose-200 shadow-sm shadow-rose-100"
                                    : "bg-gray-50/50 border-gray-100 hover:bg-[#6605c7]/3 hover:border-[#6605c7]/20"
                            }`}
                        >
                            {day.isToday && (
                                <span className="absolute top-2 right-2 text-[8px] font-black text-white bg-rose-500 px-1.5 py-0.5 rounded uppercase tracking-widest">Today</span>
                            )}
                            <p className={`text-[10px] font-black uppercase tracking-widest ${day.isToday ? "text-rose-500" : "text-gray-400"}`}>
                                {day.day}
                            </p>
                            <div className="space-y-1.5 flex-1">
                                {day.tasks.map((t, j) => (
                                    <p
                                        key={j}
                                        className={`text-[10px] font-bold leading-snug ${
                                            day.isToday ? "text-rose-700" : "text-gray-700"
                                        }`}
                                    >
                                        {t.emoji} {t.label}
                                    </p>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── Task Types Legend + Overdue Panel ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Task Types Reference */}
                <section className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm space-y-5">
                    <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">Task Types</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-400 border-b border-gray-100 font-black uppercase tracking-wider text-[9px]">
                                    <th className="p-3">Task Type</th>
                                    <th className="p-3">Trigger</th>
                                    <th className="p-3">Example</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
                                {TASK_TYPES.map((t, i) => (
                                    <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="p-3 font-black text-gray-900 whitespace-nowrap">
                                            {t.emoji} {t.label}
                                        </td>
                                        <td className="p-3 text-gray-500 text-[10px]">{t.trigger}</td>
                                        <td className="p-3 text-gray-500 text-[10px]">{t.example}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Overdue Tasks Panel */}
                <section className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm space-y-5">
                    <div className="flex items-center gap-3">
                        <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">❗ OVERDUE TASKS</h3>
                        <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 text-[10px] font-black flex items-center justify-center">{overdueItems.length}</span>
                    </div>

                    <div className="space-y-3">
                        {overdueItems.map((item, i) => (
                            <div
                                key={i}
                                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                                    item.severity === "red"
                                        ? "bg-rose-50/60 border-rose-100"
                                        : "bg-amber-50/60 border-amber-100"
                                }`}
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <span className="text-base">{item.severity === "red" ? "🔴" : "🟡"}</span>
                                    <div className="min-w-0">
                                        <p className="font-black text-gray-900 text-xs truncate">{item.name}</p>
                                        <p className="text-[10px] font-bold text-gray-500 mt-0.5">
                                            {item.type} — <span className={item.severity === "red" ? "text-rose-600" : "text-amber-600"}>{item.overdue}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => {
                                            setOverdueItems((prev) => prev.filter((_, idx) => idx !== i));
                                            showToast(`${item.name} task marked done`, "success");
                                        }}
                                        className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-emerald-600 transition-all"
                                    >
                                        Mark Done
                                    </button>
                                    <button
                                        onClick={() => showToast(`${item.name} task snoozed by 24 hours`, "info")}
                                        className="px-3 py-1.5 bg-white border border-gray-200 text-gray-500 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-gray-50 transition-all"
                                    >
                                        Snooze
                                    </button>
                                </div>
                            </div>
                        ))}

                        {overdueItems.length === 0 && (
                            <div className="p-6 text-center text-gray-400">
                                <span className="material-symbols-outlined text-3xl block mb-2 text-emerald-400">check_circle</span>
                                <p className="text-xs font-bold">All tasks are up to date!</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* ─── Add New Task + Task List ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Add Task Form */}
                <section className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm space-y-6">
                    <div>
                        <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">+ ADD TASK</h3>
                        <p className="text-xs text-gray-400 font-bold mt-1">Schedule callbacks, doc chases, or reminders</p>
                    </div>

                    <form onSubmit={handleAddTask} className="space-y-4">
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Task Type</label>
                            <select
                                value={newTaskForm.type}
                                onChange={(e) => setNewTaskForm({ ...newTaskForm, type: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/15 focus:bg-white transition-all"
                            >
                                <option>Callback</option>
                                <option>Doc Chase</option>
                                <option>Bank Query</option>
                                <option>Sanction Expiry</option>
                                <option>Campus Event</option>
                                <option>Student Callback</option>
                                <option>New Lead Follow-Up</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Student</label>
                            <select
                                value={newTaskForm.studentId}
                                onChange={(e) => setNewTaskForm({ ...newTaskForm, studentId: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/15 focus:bg-white transition-all"
                            >
                                <option value="">Select Student ▼</option>
                                {applications.map((x: any, i: number) => (
                                    <option key={i} value={x.id}>{x.firstName} {x.lastName}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Date & Time</label>
                            <input
                                type="datetime-local"
                                min={getTodayDateTimeLocalString()}
                                value={newTaskForm.dateTime}
                                onChange={(e) => setNewTaskForm({ ...newTaskForm, dateTime: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/15 focus:bg-[#fff] transition-all"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Notes</label>
                            <textarea
                                value={newTaskForm.notes}
                                onChange={(e) => setNewTaskForm({ ...newTaskForm, notes: e.target.value })}
                                placeholder="Optional task notes..."
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/15 focus:bg-white transition-all h-20 resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Reminder</label>
                            <div className="flex flex-wrap gap-2">
                                {["15 min before", "1 hour before", "1 day before"].map((opt) => (
                                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="reminder"
                                            value={opt}
                                            checked={newTaskForm.reminder === opt}
                                            onChange={(e) => setNewTaskForm({ ...newTaskForm, reminder: e.target.value })}
                                            className="text-[#6605c7] focus:ring-[#6605c7]"
                                        />
                                        <span className="text-[10px] font-bold text-gray-600">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 bg-[#6605c7] hover:bg-[#6605c7]/90 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg shadow-[#6605c7]/20"
                        >
                            Save Task
                        </button>
                    </form>
                </section>

                {/* Task List */}
                <section className="lg:col-span-2 bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">Tasks Agenda</h3>
                        <div className="flex flex-wrap gap-2">
                            {["All", "Callback", "Doc Chase", "Bank Query", "Sanction Expiry", "Campus Event"].map((val) => (
                                <button
                                    key={val}
                                    onClick={() => setCalendarFilter(val)}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                        calendarFilter === val
                                            ? "bg-[#6605c7] text-white shadow-sm"
                                            : "bg-gray-50 text-gray-500 hover:bg-[#6605c7]/5 hover:text-[#6605c7]"
                                    }`}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        {filteredTasks.length === 0 && (
                            <div className="p-8 text-center text-gray-400">
                                <span className="material-symbols-outlined text-3xl block mb-2">event_available</span>
                                <p className="text-xs font-bold">No tasks scheduled yet. Add one using the form.</p>
                            </div>
                        )}
                        {filteredTasks.map((t: any) => (
                            <div
                                key={t.id}
                                className={`p-4 border rounded-2xl flex justify-between items-center gap-4 transition-colors ${
                                    t.isCompleted
                                        ? "bg-gray-50 border-gray-100 opacity-60"
                                        : t.isOverdue
                                        ? "bg-rose-50/40 border-rose-100"
                                        : "bg-gray-50/30 border-gray-100 hover:bg-[#6605c7]/3"
                                }`}
                            >
                                <div className="flex gap-3 items-start text-xs flex-1 min-w-0">
                                    <button
                                        onClick={() => {
                                            setTasks(tasks.map((x: any) => x.id === t.id ? { ...x, isCompleted: !x.isCompleted } : x));
                                            showToast("Task status updated", "success");
                                        }}
                                        className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                                            t.isCompleted
                                                ? "bg-[#6605c7] border-[#6605c7] text-white"
                                                : "border-gray-300 hover:border-[#6605c7] bg-white"
                                        }`}
                                    >
                                        {t.isCompleted && <span className="material-symbols-outlined text-sm font-bold">check</span>}
                                    </button>
                                    <div className="space-y-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-black text-gray-900">{t.studentName}</span>
                                            <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">{t.type}</span>
                                            {t.isOverdue && !t.isCompleted && (
                                                <span className="text-[8px] bg-rose-500 text-white px-2 py-0.5 rounded font-black uppercase tracking-wider">Overdue</span>
                                            )}
                                        </div>
                                        {t.notes && <p className="text-gray-500 truncate">{t.notes}</p>}
                                        <p className="text-[10px] text-gray-400">
                                            {format(new Date(t.dateTime), "dd-MMM-yyyy hh:mm a")} — Reminder: {t.reminder}
                                        </p>
                                    </div>
                                </div>

                                {!t.isCompleted && (
                                    <div className="flex gap-1.5 flex-shrink-0">
                                        <button
                                            onClick={() => showToast("Task snoozed by 24 hours", "info")}
                                            className="px-3 py-1.5 bg-white border border-gray-200 text-gray-500 rounded-lg text-[9px] font-black uppercase hover:bg-gray-50 transition-all"
                                        >
                                            Snooze
                                        </button>
                                        <button
                                            onClick={() => {
                                                setTasks(tasks.map((x: any) => x.id === t.id ? { ...x, isCompleted: true } : x));
                                                showToast("Task marked complete", "success");
                                            }}
                                            className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase hover:bg-emerald-600 transition-all"
                                        >
                                            Mark Done
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
