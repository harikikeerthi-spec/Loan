"use client";

import React, { useMemo } from "react";
import { format } from "date-fns";
import { useAgent } from "../AgentContext";

export default function AgentCalendar() {
    const {
        applications,
        tasks, setTasks,
        calendarFilter, setCalendarFilter,
        newTaskForm, setNewTaskForm,
        handleAddTask, showToast
    } = useAgent();

    // Task list items filtered by view mode
    const filteredTasks = useMemo(() => {
        if (calendarFilter === "All") return tasks;
        return tasks.filter(t => t.type === calendarFilter);
    }, [tasks, calendarFilter]);

    return (
        <div className="animate-fade-in-up space-y-12 relative z-10">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Task View Filters */}
                    <section className="flex gap-2 p-4 bg-white border border-[#6605c7]/10 rounded-[2rem] shadow-sm overflow-x-auto no-scrollbar">
                        {["All", "Callback", "Doc Chase", "Bank Query", "Sanction Expiry", "Campus Event"].map((val, i) => (
                            <button key={i} onClick={() => setCalendarFilter(val)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${calendarFilter === val ? 'bg-[#6605c7] text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                                {val}
                            </button>
                        ))}
                    </section>

                    {/* June 2026 Tasks grid */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">June 2026 — Task Schedule</h3>
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">June Month Layout</span>
                        </div>
                        
                        <div className="grid grid-cols-6 gap-3 text-center border-b border-gray-150 pb-4 mb-4">
                            {["Mon 20", "Tue 21", "Wed 22", "Thu 23", "Fri 24", "Sat 25"].map((d, i) => (
                                <span key={i} className="text-[10px] font-black uppercase tracking-widest text-[#6605c7]/50">{d}</span>
                            ))}
                        </div>

                        <div className="grid grid-cols-6 gap-3 text-left">
                            <div className="p-3 bg-gray-50/50 border border-gray-100 rounded-xl min-h-[120px] text-[10px] flex flex-col justify-between">
                                <span className="font-bold text-gray-400">20-Jun</span>
                                <p className="font-medium text-gray-700">Call: Rahul K.</p>
                            </div>
                            <div className="p-3 bg-gray-50/50 border border-gray-100 rounded-xl min-h-[120px] text-[10px] flex flex-col justify-between">
                                <span className="font-bold text-gray-400">21-Jun</span>
                                <p className="font-medium text-[#6605c7]">Chase: Meena P. (Docs)</p>
                            </div>
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl min-h-[120px] text-[10px] flex flex-col justify-between">
                                <span className="font-bold text-rose-500">22-Jun (Today)</span>
                                <p className="font-bold text-rose-700">Priya — Bank Query Deadline!</p>
                            </div>
                            <div className="p-3 bg-gray-50/50 border border-gray-100 rounded-xl min-h-[120px] text-[10px] flex flex-col justify-between">
                                <span className="font-bold text-gray-400">23-Jun</span>
                                <p className="font-medium text-gray-700">Call: Asha R.</p>
                            </div>
                            <div className="p-3 bg-gray-50/50 border border-gray-100 rounded-xl min-h-[120px] text-[10px] flex flex-col justify-between">
                                <span className="font-bold text-gray-400">24-Jun</span>
                                <p className="font-medium text-gray-700">Meeting: IIT Campus Event</p>
                            </div>
                            <div className="p-3 bg-gray-50/50 border border-gray-100 rounded-xl min-h-[120px] text-[10px] flex flex-col justify-between">
                                <span className="font-bold text-gray-400">25-Jun</span>
                                <p className="font-medium text-gray-700">Follow-Up: Kiran Rao</p>
                            </div>
                        </div>
                    </div>

                    {/* Task list agenda */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                        <h3 className="font-display font-black text-lg text-gray-900 mb-6 uppercase tracking-tight">Tasks Agenda Checklist</h3>
                        
                        <div className="space-y-4">
                            {filteredTasks.map((t) => (
                                <div key={t.id} className={`p-4 border rounded-2xl flex justify-between items-center ${t.isCompleted ? 'bg-gray-50 border-gray-100 opacity-60' : t.isOverdue ? 'bg-red-50/40 border-red-150' : 'bg-gray-50/30 border-gray-100'}`}>
                                    <div className="flex gap-3 items-start text-xs">
                                        <button onClick={() => { setTasks(tasks.map(x => x.id === t.id ? { ...x, isCompleted: !x.isCompleted } : x)); showToast("Task status updated", "success"); }} className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${t.isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 hover:border-indigo-600 bg-white'}`}>
                                            {t.isCompleted && <span className="material-symbols-outlined text-sm font-bold">check</span>}
                                        </button>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-gray-900">{t.studentName}</span>
                                                <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">{t.type}</span>
                                                {t.isOverdue && !t.isCompleted && <span className="text-[8px] bg-rose-500 text-white px-2 py-0.5 rounded font-black uppercase tracking-wider">Overdue</span>}
                                            </div>
                                            <p className="text-gray-500">{t.notes}</p>
                                            <p className="text-[10px] text-gray-400">Scheduled: {format(new Date(t.dateTime), "dd-MMM-yyyy hh:mm a")} | Alert: {t.reminder}</p>
                                        </div>
                                    </div>
                                    {!t.isCompleted && (
                                        <div className="flex gap-1.5">
                                            <button onClick={() => showToast("Snoozed callback task by 24 hours.", "info")} className="px-3 py-1.5 bg-white border border-gray-250 text-gray-500 rounded-lg text-[9px] font-bold hover:bg-gray-50">Snooze</button>
                                            <button onClick={() => { setTasks(tasks.map(x => x.id === t.id ? { ...x, isCompleted: true } : x)); showToast("Task marked completed.", "success"); }} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase hover:bg-emerald-600">Done</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Add task scheduler form */}
                <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-display font-black text-xl text-gray-900 uppercase tracking-tight">+ Add New Task</h3>
                            <p className="text-gray-400 text-xs mt-1">Schedule personal callback reminders, document chases, or meeting callbacks.</p>
                        </div>

                        <form onSubmit={handleAddTask} className="space-y-4">
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Task Type</label>
                                <select value={newTaskForm.type} onChange={(e) => setNewTaskForm({ ...newTaskForm, type: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none">
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
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Select Target Student</label>
                                <select value={newTaskForm.studentId} onChange={(e) => setNewTaskForm({ ...newTaskForm, studentId: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none">
                                    <option value="">Choose student...</option>
                                    {applications.map((x, i) => (
                                        <option key={i} value={x.id}>{x.firstName} {x.lastName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Date & Time</label>
                                <input type="datetime-local" value={newTaskForm.dateTime} onChange={(e) => setNewTaskForm({ ...newTaskForm, dateTime: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none" />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Alert / Reminder Timing</label>
                                <select value={newTaskForm.reminder} onChange={(e) => setNewTaskForm({ ...newTaskForm, reminder: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none">
                                    <option>15 min before</option>
                                    <option>1 hour before</option>
                                    <option>1 day before</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Internal Notes</label>
                                <textarea value={newTaskForm.notes} onChange={(e) => setNewTaskForm({ ...newTaskForm, notes: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none h-24" placeholder="Reminder task summary details..." />
                            </div>

                            <button type="submit" className="w-full py-4 bg-[#6605c7] hover:bg-[#6605c7]/95 text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-sm">Save Task Reminder</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
