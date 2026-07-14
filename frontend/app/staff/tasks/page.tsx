"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface Task {
    id: number;
    title: string;
    completed: boolean;
}

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

    // Personal notes
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [loaded, setLoaded] = useState(false);

    // Follow-up reminders
    const [followUps, setFollowUps] = useState<Record<string, FollowUp>>({});
    const [filterUpcoming, setFilterUpcoming] = useState<"all" | "today" | "upcoming" | "overdue">("all");

    const followUpKey = user?.id
        ? `staff_follow_up_dates_${user.id}`
        : user?.email
            ? `staff_follow_up_dates_${user.email}`
            : `staff_follow_up_dates_default`;

    // Load personal notes from LocalStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem("vidyaloans_staff_tasks");
            if (saved) setTasks(JSON.parse(saved));
        } catch (e) { console.error(e); }
        setLoaded(true);
    }, []);

    // Save personal notes to LocalStorage
    useEffect(() => {
        if (!loaded) return;
        try { localStorage.setItem("vidyaloans_staff_tasks", JSON.stringify(tasks)); } catch (e) { console.error(e); }
    }, [tasks, loaded]);

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

    const addTask = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newTaskTitle.trim()) return;
        setTasks([{ id: Date.now(), title: newTaskTitle.trim(), completed: false }, ...tasks]);
        setNewTaskTitle("");
    };

    const toggleTask = (id: number) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const deleteTask = (id: number) => {
        setTasks(tasks.filter(t => t.id !== id));
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

    const formatDate = (fu: typeof allFollowUpEntries[0]) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const d = fu.dateObj;
        return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    const statusChip = (fu: typeof allFollowUpEntries[0]) => {
        if (fu.isOverdue) return { label: "Overdue", cls: "bg-rose-50 text-rose-700 border-rose-100" };
        if (fu.isToday) return { label: "Today", cls: "bg-amber-50 text-amber-700 border-amber-100" };
        return { label: "Upcoming", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" };
    };

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
                    <p className="text-slate-500 text-[13px] mt-1 font-medium">All your scheduled follow-ups and personal notes in one place.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 columns: Follow-up Reminders */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                        {/* Filter tabs */}
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-[14px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                <span className="material-symbols-outlined text-indigo-500 text-[20px]">notifications_active</span>
                                Follow-up Schedule
                            </h3>
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                                {(["all", "today", "overdue", "upcoming"] as const).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilterUpcoming(f)}
                                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${filterUpcoming === f ? 'bg-white border border-slate-200 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {f} {counts[f] > 0 && <span className={`ml-1 ${f === 'overdue' ? 'text-rose-500' : f === 'today' ? 'text-amber-500' : ''}`}>({counts[f]})</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filteredFollowUps.length === 0 ? (
                            <div className="py-16 text-center">
                                <span className="material-symbols-outlined text-5xl text-slate-100 mb-4 block">event_available</span>
                                <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400">No follow-ups {filterUpcoming !== "all" ? `for ${filterUpcoming}` : "scheduled"}</p>
                                <p className="text-slate-300 text-xs mt-1">Go to the Incoming Queue to set a follow-up date on any application.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredFollowUps.map(fu => {
                                    const chip = statusChip(fu);
                                    return (
                                        <div
                                            key={fu.appId}
                                            className={`p-4 border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all hover:shadow-sm ${fu.isOverdue ? 'border-rose-100 bg-rose-50/30' : fu.isToday ? 'border-amber-100 bg-amber-50/20' : 'border-slate-200 bg-white hover:border-indigo-100'}`}
                                        >
                                            {/* Left info */}
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-[14px] font-bold text-slate-800 truncate">{fu.studentName || "—"}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${chip.cls}`}>{chip.label}</span>
                                                </div>
                                                <p className="text-[10px] text-indigo-500 font-bold">{fu.appNumber || fu.appId}</p>
                                                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-semibold">
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                                                        {formatDate(fu)}
                                                    </span>
                                                    {fu.time && (
                                                        <span className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[13px]">schedule</span>
                                                            {fu.time}
                                                        </span>
                                                    )}
                                                </div>
                                                {fu.notes && (
                                                    <p className="text-[11px] text-slate-400 font-medium italic mt-1 truncate max-w-sm">{fu.notes}</p>
                                                )}
                                            </div>

                                            {/* Right actions */}
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <button
                                                    onClick={() => router.push(`/staff/users/${fu.appId}`)}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1"
                                                >
                                                    View
                                                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                                </button>
                                                <button
                                                    onClick={() => clearFollowUp(fu.appId)}
                                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl border border-slate-200 hover:border-rose-100 transition-all"
                                                    title="Clear reminder"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right column: Personal Notes */}
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                        <h3 className="text-[14px] font-bold text-slate-900 tracking-tight mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-purple-500 text-[20px]">sticky_note_2</span>
                            Personal Notes
                        </h3>

                        <form onSubmit={addTask} className="flex gap-2 mb-4">
                            <input
                                type="text"
                                placeholder="Write a note..."
                                value={newTaskTitle}
                                onChange={e => setNewTaskTitle(e.target.value)}
                                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all text-slate-800"
                            />
                            <button
                                type="submit"
                                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-md shadow-indigo-600/10"
                            >
                                Add
                            </button>
                        </form>

                        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                            {loaded && tasks.map(task => (
                                <div
                                    key={task.id}
                                    className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all group ${task.completed
                                        ? 'bg-slate-50/50 border-slate-100 text-slate-400'
                                        : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm'
                                        }`}
                                >
                                    <button
                                        onClick={() => toggleTask(task.id)}
                                        className={`w-5 h-5 rounded flex items-center justify-center transition-all flex-shrink-0 border ${task.completed
                                            ? 'bg-emerald-100 text-emerald-600 border-emerald-200'
                                            : 'bg-slate-100 text-transparent border-slate-300 group-hover:border-indigo-400'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[12px]">check</span>
                                    </button>
                                    <span
                                        className={`flex-1 text-[12px] font-medium transition-colors break-words ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}
                                    >
                                        {task.title}
                                    </span>
                                    <button
                                        onClick={() => deleteTask(task.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-rose-400 hover:bg-rose-50 rounded-lg transition-all"
                                        title="Delete"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">delete</span>
                                    </button>
                                </div>
                            ))}

                            {loaded && tasks.length === 0 && (
                                <div className="text-center py-8 text-slate-400">
                                    <span className="material-symbols-outlined text-3xl mb-1.5 block">done_all</span>
                                    <p className="text-[10px] font-bold uppercase tracking-wider">No personal notes yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
