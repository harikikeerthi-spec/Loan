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
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <span className="material-symbols-outlined text-4xl">hourglass_empty</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No active applications</h3>
                <p className="text-gray-500 text-sm">Start a new application to track your progress</p>
            </div>
        );
    }

    if (isRejected) {
        return (
            <div className="bg-red-50 border border-red-100 rounded-3xl p-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-3xl">cancel</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-red-700">Application {application.status === 'cancelled' ? 'Cancelled' : 'Rejected'}</h3>
                        <p className="text-red-600/80 text-sm">Your {application.bank} application was {application.status}.</p>
                    </div>
                </div>
                <div className="p-4 bg-white/50 rounded-xl border border-red-200">
                    <p className="text-sm text-red-600 font-medium">Please contact our support team or start a new application for a different bank.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl">rocket_launch</span>
                    </span>
                    Application Progress
                </h3>
                <div className="bg-purple-50 text-purple-700 px-4 py-1.5 rounded-full text-sm font-black">
                    {currentStage?.progress || 0}% Complete
                </div>
            </div>

            {/* Timeline */}
            <div className="relative px-2 mb-12">
                {/* Background Line */}
                <div className="absolute top-6 left-0 right-0 h-1.5 bg-gray-100 rounded-full mx-6" />

                {/* Active Progress Line */}
                <div
                    className="absolute top-6 left-0 h-1.5 bg-gradient-to-r from-purple-500 to-[#6605c7] rounded-full mx-6 transition-all duration-1000 ease-out"
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
                                    w-12 h-12 rounded-full flex items-center justify-center z-10 transition-all duration-500 border-4
                                    ${isCompleted ? 'bg-green-500 border-green-100 text-white shadow-lg shadow-green-500/20' :
                                        isCurrent ? 'bg-white border-[#6605c7] text-[#6605c7] shadow-xl shadow-purple-500/20 scale-110' :
                                            'bg-white border-gray-50 text-gray-300'}
                                `}>
                                    <span className={`material-symbols-outlined text-xl ${isCurrent ? 'animate-pulse' : ''}`}>
                                        {isCompleted ? 'check' : stage.icon}
                                    </span>
                                </div>

                                {/* Label */}
                                <div className="absolute top-14 whitespace-nowrap text-center">
                                    <span className={`text-[10px] font-black uppercase tracking-tighter ${isCompleted ? 'text-green-600' : isCurrent ? 'text-purple-700' : 'text-gray-400'}`}>
                                        {stage.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Current Status Info */}
            <div className="mt-8 p-5 bg-purple-50 rounded-2xl border border-purple-100 flex items-start gap-4">
                <div className="w-10 h-10 bg-[#6605c7] text-white rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined">{currentStage?.icon || 'hourglass_empty'}</span>
                </div>
                <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#6605c7]/60 mb-1">Current Status</div>
                    <h4 className="font-bold text-gray-900">{currentStage?.label.replace('<br>', ' ')}</h4>
                    <p className="text-gray-500 text-sm mt-1 leading-relaxed">
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
