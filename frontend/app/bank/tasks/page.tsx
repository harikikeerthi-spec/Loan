"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---

interface ProtocolTask {
    id: string;
    protocolId: string;
    appId: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    status: 'incoming' | 'verification' | 'clearance' | 'disbursed';
    assignee: string;
    dueDate: string;
}

// --- Components ---

const TaskCard = ({ task }: { task: ProtocolTask }) => {
    const priorityColors = {
        high: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-6 rounded-[2.5rem] bg-white border border-[#6605c7]/5 hover:border-[#6605c7]/25 transition-all group shadow-sm hover:shadow-xl hover:shadow-purple-900/10 relative overflow-hidden cursor-default"
        >
            {/* Subtle scan line on hover */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#6605c7]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="flex justify-between items-start mb-5">
                <div className="flex flex-col gap-1.5">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border w-fit ${priorityColors[task.priority]}`}>
                        {task.priority} Priority
                    </span>
                    <span className="text-[7px] font-black text-gray-300 uppercase tracking-[0.3em] pl-1">{task.protocolId}</span>
                </div>
                <button className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300 hover:text-gray-700 hover:bg-gray-100 transition-all">
                    <span className="material-symbols-outlined text-lg">more_horiz</span>
                </button>
            </div>

            <h4 className="text-[13px] font-black text-gray-900 mb-2 leading-tight group-hover:text-[#6605c7] transition-colors uppercase tracking-tight italic">
                {task.title}
            </h4>
            <p className="text-[10px] font-bold text-gray-400 mb-6 line-clamp-2 lowercase tracking-tight leading-relaxed">
                {task.description}
            </p>

            <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignee}`} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-700 block">{task.assignee}</span>
                        <span className="text-[7px] font-bold text-gray-300 uppercase tracking-widest">Protocol Agent</span>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[9px] font-black text-[#6605c7] uppercase tracking-wider block">{task.appId}</span>
                    <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest italic">{task.dueDate}</span>
                </div>
            </div>
        </motion.div>
    );
};

const TaskColumn = ({ title, status, tasks, icon, dotColor, addLabel }: any) => (
    <div className="flex flex-col gap-6 flex-1 min-w-[320px]">
        {/* Column Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white/60 backdrop-blur-xl rounded-[2rem] border border-[#6605c7]/8 shadow-sm">
            <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${dotColor} shadow-[0_0_8px_currentColor]`} />
                <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900">{title}</h3>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-300 text-lg">{icon}</span>
                <div className="px-3 py-1 rounded-full bg-gray-50 border border-gray-100 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                    {tasks.length}
                </div>
            </div>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
                {tasks.map((task: ProtocolTask) => (
                    <TaskCard key={task.id} task={task} />
                ))}
            </AnimatePresence>

            {/* Add Button */}
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-8 rounded-[2.5rem] border-2 border-dashed border-gray-100 text-gray-300 hover:border-[#6605c7]/25 hover:text-[#6605c7] hover:bg-white/50 transition-all flex flex-col items-center justify-center gap-2 group"
            >
                <span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform duration-500">add</span>
                <span className="text-[9px] font-black uppercase tracking-[0.3em]">{addLabel}</span>
            </motion.button>
        </div>
    </div>
);

// --- Page ---

export default function BankTasks() {
    const [tasks] = useState<ProtocolTask[]>([
        { id: "t1", protocolId: "PR-9921-X", appId: "NODE-029", title: "KYC Verification Protocol", description: "Review latest identity assets transmitted from staff node. Validate PAN and Aadhaar records.", priority: "high", status: "incoming", assignee: "Agent Smith", dueDate: "APR 16" },
        { id: "t2", protocolId: "PR-9922-A", appId: "NODE-114", title: "Risk Variance Adjustment", description: "Coordinate with credit matrix for interest rate spread analysis for Vikram Seth.", priority: "medium", status: "verification", assignee: "Agent Neo", dueDate: "APR 15" },
        { id: "t3", protocolId: "PR-9923-Z", appId: "NODE-882", title: "Asset Transmission Audit", description: "Final validation of disbursement documentation package for Sanya Gupta.", priority: "high", status: "verification", assignee: "Agent Trinity", dueDate: "APR 17" },
        { id: "t4", protocolId: "PR-9924-B", appId: "NODE-401", title: "Nexus Communication Sync", description: "Confirm university intake details and coordinate with Ananya Iyer's admission office.", priority: "low", status: "disbursed", assignee: "Agent Morpheus", dueDate: "APR 12" },
        { id: "t5", protocolId: "PR-9925-C", appId: "NODE-552", title: "Collateral Matrix Check", description: "Verify co-applicant assets and property nodes for secure credit line approval.", priority: "medium", status: "clearance", assignee: "Agent Smith", dueDate: "APR 18" },
    ]);

    const findTasksByStatus = (status: ProtocolTask['status']) => tasks.filter(t => t.status === status);

    return (
        <div className="p-8 lg:p-12 animate-fade-in relative z-10 h-full flex flex-col gap-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div className="space-y-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-3 px-4 py-2 bg-white/60 backdrop-blur-xl rounded-full border border-[#6605c7]/10 shadow-sm"
                    >
                        <div className="w-2 h-2 rounded-full bg-[#6605c7] animate-pulse shadow-[0_0_8px_#6605c7]" />
                        <span className="text-[10px] font-black text-[#6605c7] uppercase tracking-[0.2em]">Strategy Terminal Alpha</span>
                    </motion.div>

                    <div>
                        <h2 className="text-5xl lg:text-6xl font-black font-display text-gray-900 tracking-tighter italic leading-none">
                            Mission <span className="text-[#6605c7]">Control</span>
                        </h2>
                        <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] flex items-center gap-2 mt-3 italic">
                            <span className="material-symbols-outlined text-xs">lan</span>
                            Directives Distribution Center · Protocol Active
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4">
                    <motion.button
                        whileHover={{ y: -2 }}
                        className="px-6 py-4 rounded-[1.5rem] bg-white/80 border border-[#6605c7]/10 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-[#6605c7] hover:border-[#6605c7]/25 hover:bg-white transition-all shadow-sm group"
                    >
                        <span className="material-symbols-outlined text-xl group-hover:rotate-180 transition-transform duration-500">tune</span>
                        Reconfigure Grid
                    </motion.button>
                    <motion.button
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-8 py-4 rounded-[1.5rem] bg-[#6605c7] text-white flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-purple-500/25 group"
                    >
                        <span className="material-symbols-outlined text-xl group-hover:rotate-90 transition-transform duration-500">assignment_add</span>
                        New Directive
                    </motion.button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto no-scrollbar pb-6">
                <div className="flex gap-8 h-full min-w-max">
                    <TaskColumn
                        title="Protocol: Incoming"
                        status="incoming"
                        tasks={findTasksByStatus('incoming')}
                        icon="input"
                        dotColor="bg-amber-500 text-amber-500"
                        addLabel="Add to Incoming"
                    />
                    <TaskColumn
                        title="Protocol: Verification"
                        status="verification"
                        tasks={findTasksByStatus('verification')}
                        icon="fact_check"
                        dotColor="bg-blue-500 text-blue-500"
                        addLabel="Add to Verification"
                    />
                    <TaskColumn
                        title="Protocol: Clearance"
                        status="clearance"
                        tasks={findTasksByStatus('clearance')}
                        icon="gavel"
                        dotColor="bg-[#6605c7] text-[#6605c7]"
                        addLabel="Add to Clearance"
                    />
                    <TaskColumn
                        title="Protocol: Disbursed"
                        status="disbursed"
                        tasks={findTasksByStatus('disbursed')}
                        icon="verified"
                        dotColor="bg-emerald-500 text-emerald-500"
                        addLabel="Add to Disbursed"
                    />
                </div>
            </div>
        </div>
    );
}
