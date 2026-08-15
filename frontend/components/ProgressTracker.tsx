"use client";

import React, { useMemo } from "react";
import { getProfileDocumentRequirements } from "@/lib/documentRequirements";

interface Stage {
    order: number;
    label: string;
    icon: string;
    progress: number;
}

const STAGES_CONFIG: Record<string, Stage> = {
    application_created: { order: 1, label: 'Created', icon: 'bolt', progress: 10 },
    application_submitted: { order: 2, label: 'Submitted', icon: 'send', progress: 25 },
    document_verification: { order: 3, label: 'Documents', icon: 'verified', progress: 40 },
    submit_to_bank: { order: 4, label: 'Submit to Bank', icon: 'account_balance', progress: 50 },
    credit_check: { order: 5, label: 'Credit Check', icon: 'credit_score', progress: 75 },
    bank_review: { order: 6, label: 'Review', icon: 'rate_review', progress: 90 },
    sanction: { order: 7, label: 'Sanction', icon: 'assignment_turned_in', progress: 95 },
    disbursement: { order: 8, label: 'Disbursed', icon: 'payments', progress: 100 },
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
    progress?: number;
    applicationNumber?: string;
}

const getDynamicProgress = (app: any, documents: any[] = [], profile?: any) => {
    if (!app) return 10;
    const s = String(app.status || '').toLowerCase();
    if (['disbursed', 'closed'].includes(s)) return 100;
    if (['sanctioned', 'approved', 'sanction'].includes(s)) return 95;
    if (['under_bank_review', 'query_raised', 'conditional_sanction', 'processing'].includes(s)) return 90;
    if (['submitted_to_bank', 'file_logged'].includes(s)) return 75;
    if (['staff_verified', 'verification', 'documents_verified'].includes(s)) return 50;

    let baseProgress = typeof app.progress === 'number' && app.progress > 0 ? app.progress : 10;
    if (['docs_received', 'docs_uploaded', 'under_review'].includes(s)) baseProgress = Math.max(baseProgress, 40);
    if (['submitted', 'application_submitted'].includes(s)) baseProgress = Math.max(baseProgress, 25);

    if (documents && documents.length > 0) {
        const uploadedCount = documents.filter(d => d.uploaded === true || d.status === 'uploaded' || d.status === 'verified').length;
        if (uploadedCount > 0) {
            let requiredCount = 3;
            try {
                if (profile) {
                    const reqs = getProfileDocumentRequirements(profile);
                    if (reqs && reqs.length > 0) requiredCount = reqs.length;
                }
            } catch { }

            const isAllDocsUploaded = uploadedCount >= requiredCount;
            const docProgress = isAllDocsUploaded ? 50 : Math.min(50, 25 + Math.round((uploadedCount / Math.max(requiredCount, 1)) * 25));
            return Math.max(baseProgress, docProgress);
        }
    }

    return baseProgress;
};

export default function ProgressTracker({
    application,
    documents = [],
    profile
}: {
    application?: Application;
    documents?: any[];
    profile?: any;
}) {
    const calculatedProgress = useMemo(() => {
        return getDynamicProgress(application, documents, profile);
    }, [application, documents, profile]);

    const currentStageKey = useMemo(() => {
        if (!application) return null;
        if (application.status === 'rejected' || application.status === 'cancelled') return null;

        let stageKey = application.stage;
        if (!stageKey || !STAGES_CONFIG[stageKey]) {
            const status = application.status?.toLowerCase() || '';
            if (status.includes('approve') || status.includes('sanction')) return 'sanction';
            if (status.includes('disburse')) return 'disbursement';
            if (status.includes('process') || status.includes('review')) return 'bank_review';
            if (status.includes('submit_to_bank') || status.includes('submitted_to_bank')) return 'submit_to_bank';
            if (status === 'submitted') return 'application_submitted';
            if (status.includes('document')) return 'document_verification';
            if (status.includes('credit')) return 'credit_check';

            if (calculatedProgress >= 100) return 'disbursement';
            if (calculatedProgress >= 95) return 'sanction';
            if (calculatedProgress >= 90) return 'bank_review';
            if (calculatedProgress >= 75) return 'credit_check';
            if (calculatedProgress >= 50) return 'submit_to_bank';
            if (calculatedProgress >= 40) return 'document_verification';
            if (calculatedProgress >= 25) return 'application_submitted';

            return 'application_created';
        }
        return stageKey;
    }, [application, calculatedProgress]);

    const statusLower = application?.status?.toLowerCase() || '';
    const isSanctionedOrApproved = ['sanctioned', 'approved', 'sanction', 'conditional_sanction', 'partial_sanction', 'counter_offer', 'sanction_issued'].includes(statusLower) || application?.stage === 'sanction' || application?.stage === 'sanctioned';
    const isDisbursedOrClosed = ['disbursed', 'disbursement_confirmed', 'closed'].includes(statusLower) || application?.stage === 'disbursement' || application?.stage === 'disbursed';

    const isRejected = application?.status === 'rejected' || application?.status === 'cancelled';
    const currentStage = currentStageKey ? STAGES_CONFIG[currentStageKey] : null;
    const currentStageId = currentStageKey || '';

    const maxCompletedOrder = isDisbursedOrClosed
        ? 8
        : isSanctionedOrApproved
            ? 7
            : (currentStage ? (currentStageId === 'disbursement' && calculatedProgress >= 100 ? 8 : currentStage.order - 1) : 0);

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
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                    isDisbursedOrClosed || isSanctionedOrApproved
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : 'bg-emerald-50 text-emerald-700'
                }`}>
                    <span className="material-symbols-outlined text-xs">
                        {isDisbursedOrClosed ? 'payments' : isSanctionedOrApproved ? 'verified' : 'rocket_launch'}
                    </span>
                    {isDisbursedOrClosed ? '100% Disbursed' : isSanctionedOrApproved ? 'Sanctioned & Approved' : `${calculatedProgress}% Complete`}
                </div>
            </div>

            {/* Timeline */}
            <div className="relative px-2 mb-16 select-none">
                {/* Background Line */}
                <div className="absolute top-5 left-0 right-0 h-[2px] bg-gray-100 rounded-full mx-6" />

                {/* Active Progress Line */}
                <div
                    className={`absolute top-5 left-0 h-[3px] rounded-full mx-6 transition-all duration-1000 ease-out ${
                        isDisbursedOrClosed || isSanctionedOrApproved
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                            : 'bg-[#6605c7] shadow-[0_0_10px_rgba(102,5,199,0.3)]'
                    }`}
                    style={{ width: `calc(${calculatedProgress}% - 48px)` }}
                />

                <div className="relative flex justify-between">
                    {STAGES_LIST.map((stage) => {
                        const isCompleted = stage.order <= maxCompletedOrder;
                        const isCurrent = !isCompleted && currentStage && (
                            isSanctionedOrApproved ? stage.id === 'disbursement' : stage.id === currentStageKey
                        );

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
        </div>
    );
}
