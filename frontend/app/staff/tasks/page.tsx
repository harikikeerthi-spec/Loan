"use client";

import { useState, useEffect } from "react";

interface Task {
    id: number;
    title: string;
    completed: boolean;
}

export default function ActionItemsPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [loaded, setLoaded] = useState(false);

    // Load tasks from LocalStorage on mount
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

    // Save tasks to LocalStorage when changed
    useEffect(() => {
        if (!loaded) return;
        try {
            localStorage.setItem("vidyaloans_staff_tasks", JSON.stringify(tasks));
        } catch (e) {
            console.error(e);
        }
    }, [tasks, loaded]);

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
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            PRIORITY
                        </span>
                    </h2>
                    <p className="text-slate-500 text-[13px] mt-1">Manage your daily tasks, follow-ups, and internal reminders.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm max-w-3xl">
                <form onSubmit={addTask} className="flex gap-3 mb-6">
                    <input
                        type="text"
                        placeholder="Add a new task..."
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all text-slate-850"
                    />
                    <button
                        type="submit"
                        className="px-6 py-3 bg-indigo-600 text-white text-[12px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/10"
                    >
                        Add Task
                    </button>
                </form>

                <div className="space-y-2">
                    {loaded && tasks.map(task => (
                        <div
                            key={task.id}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all group ${
                                task.completed
                                    ? 'bg-slate-50/50 border-slate-100 text-slate-400'
                                    : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm'
                            }`}
                        >
                            <button
                                onClick={() => toggleTask(task.id)}
                                className={`w-5 h-5 rounded flex items-center justify-center transition-all flex-shrink-0 ${
                                    task.completed
                                        ? 'bg-emerald-100 text-emerald-600'
                                        : 'bg-slate-100 text-transparent border border-slate-300 group-hover:border-indigo-400'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[14px]">check</span>
                            </button>
                            <span
                                className={`flex-1 text-[13px] font-medium transition-colors ${
                                    task.completed ? 'line-through text-slate-400' : 'text-slate-700'
                                }`}
                            >
                                {task.title}
                            </span>
                            <button
                                onClick={() => deleteTask(task.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition-all"
                                title="Delete task"
                            >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                        </div>
                    ))}

                    {loaded && tasks.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                            <span className="material-symbols-outlined text-4xl mb-2">assignment_turned_in</span>
                            <p className="text-[12px] font-bold uppercase tracking-widest">All caught up! No tasks left.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
