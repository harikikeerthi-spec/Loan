"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";

interface Task {
    id: number;
    title: string;
    completed: boolean;
}

export default function ActionItemsPage() {
    const router = useRouter();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [loaded, setLoaded] = useState(false);

    // System Tasks (Dynamic Applications from Backend)
    const [systemTasks, setSystemTasks] = useState<any[]>([]);
    const [systemLoading, setSystemLoading] = useState(true);

    // Load personal tasks from LocalStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem("vidyaloans_staff_tasks");
            if (saved) {
                setTasks(JSON.parse(saved));
            }
        } catch (e) {
            console.error(e);
        }
        setLoaded(true);
    }, []);

    // Save personal tasks to LocalStorage when changed
    useEffect(() => {
        if (!loaded) return;
        try {
            localStorage.setItem("vidyaloans_staff_tasks", JSON.stringify(tasks));
        } catch (e) {
            console.error(e);
        }
    }, [tasks, loaded]);

    // Load submitted applications dynamically from the backend
    const loadSystemTasks = async () => {
        setSystemLoading(true);
        try {
            const res: any = await adminApi.getApplications({ status: "submitted" });
            const items = res?.data || (Array.isArray(res) ? res : []);
            setSystemTasks(items);
        } catch (e) {
            console.error("Failed to load system action items:", e);
        } finally {
            setSystemLoading(false);
        }
    };

    useEffect(() => {
        loadSystemTasks();
    }, []);

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

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto animate-fade-in pb-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-[28px] tracking-tight flex items-center gap-3 font-['Playfair_Display',serif] font-bold text-[#0d1b2a]">
                        Action Items
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            PRIORITY
                        </span>
                    </h2>
                    <p className="text-slate-500 text-[13px] mt-1 font-medium">Manage database applications requiring operational review and your personal tasks.</p>
                </div>
                <button
                    onClick={loadSystemTasks}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
                >
                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                    Refresh Applications
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1 & 2: Dynamic System Action Items */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[14px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                <span className="material-symbols-outlined text-indigo-500 text-[20px]">assignment_ind</span>
                                Awaiting Portfolio Review
                            </h3>
                            <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full">
                                {systemTasks.length} Applications
                            </span>
                        </div>

                        {systemLoading ? (
                            <div className="py-20 text-center">
                                <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Loading submitted applications...</p>
                            </div>
                        ) : systemTasks.length > 0 ? (
                            <div className="space-y-4">
                                {systemTasks.map((app) => (
                                    <div
                                        key={app.id}
                                        className="p-5 border border-slate-200 hover:border-indigo-200 rounded-2xl bg-white hover:shadow-md transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4"
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[15px] font-bold text-slate-900 tracking-tight">
                                                    {app.firstName || "Unnamed"} {app.lastName || "Applicant"}
                                                </span>
                                                <span className="px-2 py-0.5 bg-amber-50 border border-amber-100 text-[9px] font-bold text-amber-700 rounded-md capitalize">
                                                    {app.loanType || "Education Loan"}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-medium">
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[15px] text-slate-400">payments</span>
                                                    ₹{app.amount?.toLocaleString("en-IN") || "—"}
                                                </span>
                                                {app.universityName && (
                                                    <>
                                                        <span className="text-slate-300">|</span>
                                                        <span className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[15px] text-slate-400">school</span>
                                                            {app.universityName}
                                                        </span>
                                                    </>
                                                )}
                                                {app.bank && (
                                                    <>
                                                        <span className="text-slate-300">|</span>
                                                        <span className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[15px] text-slate-400">account_balance</span>
                                                            {app.bank}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            {app.createdAt && (
                                                <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[12px]">schedule</span>
                                                    Submitted: {new Date(app.createdAt).toLocaleString("en-IN", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                        hour12: true
                                                    })}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => router.push(`/staff/applications/${app.id}`)}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1 bg-gradient-to-r hover:from-indigo-600 hover:to-indigo-700 shrink-0 self-start md:self-center"
                                        >
                                            Review Case
                                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-16 text-center">
                                <span className="material-symbols-outlined text-5xl text-emerald-100 mb-4 block">assignment_turned_in</span>
                                <p className="text-[12px] font-bold uppercase tracking-widest text-slate-700">All Caught Up!</p>
                                <p className="text-slate-400 text-xs mt-1">No student portfolios currently awaiting operational review.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 3: Personal Task list */}
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                        <h3 className="text-[14px] font-bold text-slate-900 tracking-tight mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-purple-500 text-[20px]">sticky_note_2</span>
                            Personal Reminders
                        </h3>

                        <form onSubmit={addTask} className="flex gap-2 mb-4">
                            <input
                                type="text"
                                placeholder="Write a reminder..."
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

                        <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
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
                                        className={`w-4.5 h-4.5 rounded flex items-center justify-center transition-all flex-shrink-0 ${task.completed
                                            ? 'bg-emerald-100 text-emerald-600'
                                            : 'bg-slate-100 text-transparent border border-slate-300 group-hover:border-indigo-400'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[12px]">check</span>
                                    </button>
                                    <span
                                        className={`flex-1 text-[12px] font-medium transition-colors break-words ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'
                                            }`}
                                    >
                                        {task.title}
                                    </span>
                                    <button
                                        onClick={() => deleteTask(task.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-rose-400 hover:bg-rose-50 rounded-lg transition-all"
                                        title="Delete task"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">delete</span>
                                    </button>
                                </div>
                            ))}

                            {loaded && tasks.length === 0 && (
                                <div className="text-center py-8 text-slate-400">
                                    <span className="material-symbols-outlined text-3xl mb-1.5 block">done_all</span>
                                    <p className="text-[10px] font-bold uppercase tracking-wider">No personal reminders.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
