"use client";

import { useState } from "react";
import { format } from "date-fns";
import { motion, Reorder } from "framer-motion";

// --- Components ---

const TaskCard = ({ task, onStatusChange }: any) => {
    const priorityColors: Record<string, string> = {
        high: "bg-rose-100 text-rose-600 border-rose-200",
        medium: "bg-amber-100 text-amber-600 border-amber-200",
        low: "bg-blue-100 text-blue-600 border-blue-200",
    };

    return (
        <div className="glass-card p-6 rounded-[2.5rem] bg-white border-[#6605c7]/5 hover:border-[#6605c7]/20 transition-all group shadow-sm hover:shadow-xl hover:shadow-purple-900/5 cursor-grab active:cursor-grabbing">
            <div className="flex justify-between items-start mb-6">
                <span className={`px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${priorityColors[task.priority]}`}>
                    {task.priority} Priority
                </span>
                <button className="text-gray-300 hover:text-gray-900 transition-colors">
                    <span className="material-symbols-outlined text-lg">more_horiz</span>
                </button>
            </div>
            
            <h4 className="text-[12px] font-black text-gray-900 mb-2 leading-snug group-hover:text-[#6605c7] transition-colors uppercase tracking-tight italic">
                {task.title}
            </h4>
            <p className="text-[10px] font-bold text-gray-400 mb-6 line-clamp-2 lowercase tracking-tight">
                {task.description}
            </p>
            
            <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gray-100 border border-white overflow-hidden shadow-sm">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignee}`} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{task.assignee}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    {task.dueDate}
                </div>
            </div>
        </div>
    );
};

const TaskColumn = ({ title, status, tasks, onStatusChange }: any) => (
    <div className="flex flex-col gap-6 flex-1 min-w-[320px]">
        <div className="flex items-center justify-between px-6 py-4 bg-white/40 backdrop-blur-xl rounded-[2rem] border border-[#6605c7]/5 shadow-sm">
            <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${status === 'todo' ? 'bg-amber-500' : status === 'doing' ? 'bg-[#6605c7]' : 'bg-emerald-500'} shadow-[0_0_8px_currentColor]`} />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900">{title}</h3>
            </div>
            <div className="px-3 py-1 rounded-full bg-gray-100 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                {tasks.length} Nodes
            </div>
        </div>
        
        <div className="flex flex-col gap-4">
            {tasks.map((task: any) => (
                <TaskCard key={task.id} task={task} />
            ))}
            
            <button className="w-full py-6 rounded-[2.5rem] border border-dashed border-gray-200 text-gray-400 hover:border-[#6605c7]/20 hover:text-[#6605c7] hover:bg-white transition-all flex flex-col items-center justify-center group gap-2">
                <span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform duration-500">add</span>
                <span className="text-[9px] font-black uppercase tracking-widest">Integrate New Directive</span>
            </button>
        </div>
    </div>
);

// --- Page ---

export default function BankTasks() {
    const [tasks, setTasks] = useState([
        { id: "t1", title: "KYC Verification for APP-029", description: "Review latest PAN card and Aadhar data uploaded by student.", priority: "high", status: "todo", assignee: "Agent Smith", dueDate: "Apr 5" },
        { id: "t2", title: "Loan Tenue Adjustment", description: "Coordinate with Risk team for interest rate spread for Vikram Seth.", priority: "medium", status: "doing", assignee: "Agent Neo", dueDate: "Apr 4" },
        { id: "t3", title: "Disbursement Protocol Check", description: "Final validation of disbursement documents for Sanya Gupta.", priority: "high", status: "doing", assignee: "Agent Trinity", dueDate: "Apr 6" },
        { id: "t4", title: "University Communication", description: "Confirm intake details for Ananya Iyer.", priority: "low", status: "completed", assignee: "Agent Morpheus", dueDate: "Apr 2" },
    ]);

    const findTasksByStatus = (status: string) => tasks.filter(t => t.status === status);

    return (
        <div className="p-8 space-y-8 animate-fade-in relative z-10 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-4">
                <div>
                    <h2 className="text-4xl font-black font-display mb-2 text-gray-900 tracking-tight italic">Mission Control</h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs">tune</span>
                        Directives Distribution Center
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-3 rounded-2xl bg-white text-[10px] font-black uppercase tracking-widest text-gray-400 border border-gray-100 hover:text-[#6605c7] hover:border-[#6605c7]/20 transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">filter_list</span> Reconfigure Grid
                    </button>
                    <button className="admin-btn-primary text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">assignment_add</span> New Directive
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto no-scrollbar pb-10">
                <div className="flex gap-8 h-full min-w-max">
                    <TaskColumn title="Protocol: Queue" status="todo" tasks={findTasksByStatus('todo')} />
                    <TaskColumn title="Protocol: Active" status="doing" tasks={findTasksByStatus('doing')} />
                    <TaskColumn title="Protocol: Success" status="completed" tasks={findTasksByStatus('completed')} />
                </div>
            </div>
        </div>
    );
}
