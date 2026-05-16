"use client";

import { motion } from "framer-motion";

interface PipelineStage {
    id: string;
    label: string;
    icon: string;
    description: string;
}

const STAGES: PipelineStage[] = [
    { id: "application_submitted", label: "Student Submission", icon: "person", description: "Identity & Initial Sync" },
    { id: "staff_review", label: "Staff Hub", icon: "account_balance", description: "Document Scrubbing" },
    { id: "forwarded_to_bank", label: "Bank Queue", icon: "lan", description: "Transmission Received" },
    { id: "under_bank_review", label: "Audit Node", icon: "fact_check", description: "Deep Verification" },
    { id: "approved", label: "Final Decision", icon: "verified", description: "Disbursement Protocol" },
];

export default function BankFlowPipeline({ currentStage, status }: { currentStage: string, status: string }) {
    // Map application status/stage to our pipeline index
    const getActiveIndex = () => {
        if (status === 'disbursed' || status === 'approved') return 4;
        if (status === 'under_bank_review') return 3;
        if (status === 'processing') return 2;
        if (currentStage === 'staff_review') return 1;
        return 0;
    };

    const activeIndex = getActiveIndex();

    return (
        <div className="w-full py-12 px-4 relative overflow-hidden">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-[15%] right-[15%] h-[2px] bg-gray-100 -translate-y-1/2">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(activeIndex / (STAGES.length - 1)) * 100}%` }}
                    className="h-full bg-gradient-to-r from-[#6605c7] to-[#8b24e5] shadow-[0_0_10px_rgba(102,5,199,0.3)]"
                />
            </div>

            <div className="flex justify-between items-center relative z-10">
                {STAGES.map((stage, idx) => {
                    const isActive = idx <= activeIndex;
                    const isCurrent = idx === activeIndex;

                    return (
                        <div key={stage.id} className="flex flex-col items-center gap-4 w-1/5">
                            <motion.div 
                                initial={false}
                                animate={{ 
                                    scale: isCurrent ? 1.2 : 1,
                                    backgroundColor: isActive ? "#6605c7" : "#fff",
                                    borderColor: isActive ? "#6605c7" : "#f3f4f6"
                                }}
                                className={`w-12 h-12 rounded-[1.25rem] border-2 flex items-center justify-center transition-shadow ${
                                    isCurrent ? "shadow-2xl shadow-purple-500/40" : "shadow-sm"
                                }`}
                            >
                                <span className={`material-symbols-outlined text-xl ${isActive ? "text-white" : "text-gray-300"}`}>
                                    {stage.icon}
                                </span>
                            </motion.div>
                            
                            <div className="text-center space-y-1 px-2">
                                <p className={`text-[9px] font-black uppercase tracking-[0.2em] transition-colors ${
                                    isActive ? "text-gray-900" : "text-gray-300"
                                }`}>
                                    {stage.label}
                                </p>
                                <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest opacity-60">
                                    {stage.description}
                                </p>
                            </div>

                            {isCurrent && (
                                <motion.div 
                                    layoutId="pulse"
                                    className="absolute -top-4 w-1 h-1 rounded-full bg-[#6605c7] animate-ping"
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
