"use client";

import React, { useMemo } from "react";

interface Stage {
    order: number;
    label: string;
    icon: string;
    progress: number;
}

const STAGES_CONFIG: Record<string, Stage> = {
    application_submitted: { order: 1, label: 'Submitted', icon: 'description', progress: 10 },
    document_verification: { order: 2, label: 'Documents', icon: 'upload_file', progress: 30 },
    credit_check: { order: 3, label: 'Credit Check', icon: 'analytics', progress: 50 },
    bank_review: { order: 4, label: 'Review', icon: 'rate_review', progress: 70 },
    sanction: { order: 5, label: 'Sanction', icon: 'verified', progress: 90 },
    disbursement: { order: 6, label: 'Disbursed', icon: 'payments', progress: 100 },
};

const STAGES_LIST = Object.entries(STAGES_CONFIG)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key, value]) => ({ id: key, ...value }));

interface Application {
    id: string;
    status: string;
    bank: string;
    date?: string;
    stage?: string;
}

export default function ProgressTracker({
    application,
    documents = []
}: {
    application?: Application;
    documents?: any[];
}) {
    const currentStageKey = useMemo(() => {
        if (!application) return null;
        if (application.status === 'rejected' || application.status === 'cancelled') return null;

        let stageKey = application.stage;
        if (!stageKey || !STAGES_CONFIG[stageKey]) {
            // Infer stage from status
            if (application.status === 'approved') return 'sanction';
            if (application.status === 'disbursed') return 'disbursement';
            if (application.status === 'processing') return 'bank_review';
            if (documents && documents.length > 0) return 'document_verification';
            return 'application_submitted';
        }
        return stageKey;
    }, [application, documents]);

    const isRejected = application?.status === 'rejected' || application?.status === 'cancelled';
    const currentStage = currentStageKey ? STAGES_CONFIG[currentStageKey] : null;

    if (!application) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center shadow-sm">
                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mx-auto mb-4 text-gray-200">
                    <span className="material-symbols-outlined text-3xl">hourglass_empty</span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1 uppercase tracking-tight">No active applications</h3>
                <p className="text-gray-400 text-xs">Start a new application to track your progress</p>
            </div>
        );
    }

    if (isRejected) {
        return (
            <div className="bg-red-50/50 border border-red-100 rounded-xl p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                        <span className="material-symbols-outlined text-2xl">cancel</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-red-900">Application {application.status === 'cancelled' ? 'Cancelled' : 'Rejected'}</h3>
                        <p className="text-red-700/60 text-xs">Your {application.bank} application was {application.status}.</p>
                    </div>
                </div>
                <div className="p-4 bg-white/60 rounded-lg border border-red-100">
                    <p className="text-xs text-red-700 font-medium">Please contact our support team or start a new application for a different bank.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-8 shadow-sm">
            <div className="flex justify-between items-center mb-12">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#6605c7] flex items-center gap-2">
                    <span className="w-6 h-6 bg-[#6605c7]/10 text-[#6605c7] rounded flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm">rocket_launch</span>
                    </span>
                    Application Progress
                </h3>
                <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {currentStage?.progress || 0}% Complete
                </div>
            </div>

            {/* Timeline */}
            <div className="relative px-2 mb-16">
                {/* Background Line */}
                <div className="absolute top-5 left-0 right-0 h-[2px] bg-gray-100 rounded-full mx-6" />

                {/* Active Progress Line */}
                <div
                    className="absolute top-5 left-0 h-[3px] bg-[#6605c7] rounded-full mx-6 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(102,5,199,0.3)]"
                    style={{ width: `calc(${currentStage?.progress || 0}% - 48px)` }}
                />

                <div className="relative flex justify-between">
                    {STAGES_LIST.map((stage) => {
                        const isCompleted = currentStage && stage.order < currentStage.order;
                        const isCurrent = currentStage && stage.id === currentStageKey;

                        return (
                            <div key={stage.id} className="flex flex-col items-center group relative" style={{ width: '40px' }}>
                                {/* Step Circle */}
                                <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-500 border-2
                                    ${isCompleted ? 'bg-emerald-500 border-emerald-100 text-white shadow-lg shadow-emerald-500/10' :
                                        isCurrent ? 'bg-white border-[#6605c7] text-[#6605c7] shadow-lg shadow-[#6605c7]/10 scale-110' :
                                            'bg-white border-gray-100 text-gray-300'}
                                `}>
                                    <span className={`material-symbols-outlined text-[18px] ${isCurrent ? 'animate-pulse' : ''}`}>
                                        {isCompleted ? 'check' : stage.icon}
                                    </span>
                                </div>

                                {/* Label */}
                                <div className="absolute top-12 whitespace-nowrap text-center">
                                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${isCompleted ? 'text-emerald-600' : isCurrent ? 'text-[#6605c7]' : 'text-gray-400'}`}>
                                        {stage.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Current Status Info */}
            <div className="mt-8 p-5 bg-[#6605c7]/[0.02] border border-[#6605c7]/5 rounded-xl flex items-start gap-4">
                <div className="w-9 h-9 bg-[#6605c7] text-white rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-[#6605c7]/20">
                    <span className="material-symbols-outlined text-lg">{currentStage?.icon || 'hourglass_empty'}</span>
                </div>
                <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#6605c7]/60 mb-1">Current Status</div>
                    <h4 className="font-bold text-gray-900 text-[14px]">{currentStage?.label.replace('<br>', ' ')}</h4>
                    <p className="text-gray-500 text-[13px] mt-1 leading-relaxed">
                        Your {application.bank} application is currently in the <strong>{currentStage?.label.replace('<br>', ' ')}</strong> stage.
                        Estimated completion: <span className="text-gray-900 font-bold">
                            {(() => {
                                const appDate = application.date ? new Date(application.date) : new Date();
                                const est = new Date(appDate);
                                est.setDate(appDate.getDate() + 14);
                                return est.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                            })()}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );

}
