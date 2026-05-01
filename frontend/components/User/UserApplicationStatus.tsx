/**
 * User Application Status Display Component
 * Shows application status without approval/rejection buttons
 * (Only admin can approve/reject through the enhanced admin panel)
 */

"use client";

import React from "react";
import { format, formatDistanceToNow } from "date-fns";

interface UserApplicationStatusProps {
    application: {
        id: string;
        applicationNumber: string;
        status: "pending" | "processing" | "approved" | "rejected" | "disbursed";
        stage: string;
        progress: number;
        bank: string;
        amount: number;
        createdAt: string;
        remarks?: string;
        rejectionReason?: string;
        mentorName?: string;
        counselorName?: string;
    };
    onViewDetails: (app: any) => void;
}

const UserApplicationStatus = ({ application, onViewDetails }: UserApplicationStatusProps) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: string; message: string }> = {
        pending: {
            bg: "bg-amber-50",
            text: "text-amber-700",
            icon: "pending_actions",
            message: "Your application is being reviewed by our team",
        },
        processing: {
            bg: "bg-blue-50",
            text: "text-blue-700",
            icon: "hourglass_bottom",
            message: "Your application is under detailed review",
        },
        approved: {
            bg: "bg-emerald-50",
            text: "text-emerald-700",
            icon: "check_circle",
            message: "Your application has been approved! Loan will be disbursed soon.",
        },
        rejected: {
            bg: "bg-red-50",
            text: "text-red-700",
            icon: "cancel",
            message: "Your application could not be approved",
        },
        disbursed: {
            bg: "bg-purple-50",
            text: "text-purple-700",
            icon: "account_balance_wallet",
            message: "Your loan has been successfully disbursed",
        },
    };

    const config = statusConfig[application.status];

    return (
        <div className={`rounded-xl border-2 p-6 ${config.bg} border-opacity-20`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-white border-2 flex items-center justify-center flex-shrink-0">
                        <span className={`material-symbols-outlined text-[24px] ${config.text}`}>{config.icon}</span>
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${config.text} uppercase tracking-tight`}>{application.status}</h3>
                        <p className="text-sm font-medium text-slate-600 mt-1">{config.message}</p>
                    </div>
                </div>
                <button
                    onClick={() => onViewDetails(application)}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold text-sm transition-all"
                >
                    View Details
                </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Processing Progress</p>
                    <p className="text-sm font-bold text-slate-900">{application.progress}%</p>
                </div>
                <div className="w-full bg-white rounded-full h-2 border border-slate-200">
                    <div
                        className={`h-2 rounded-full transition-all ${
                            application.status === "approved"
                                ? "bg-emerald-500"
                                : application.status === "rejected"
                                ? "bg-red-500"
                                : application.status === "disbursed"
                                ? "bg-purple-500"
                                : "bg-blue-500"
                        }`}
                        style={{ width: `${application.progress}%` }}
                    />
                </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Application ID</p>
                    <p className="font-mono font-bold text-slate-900">{application.applicationNumber}</p>
                </div>
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Bank</p>
                    <p className="font-semibold text-slate-900">{application.bank}</p>
                </div>
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Loan Amount</p>
                    <p className="font-bold text-slate-900">₹{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(application.amount)}</p>
                </div>
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Submitted</p>
                    <p className="text-sm font-medium text-slate-900">{format(new Date(application.createdAt), "dd MMM yyyy")}</p>
                </div>
            </div>

            {/* Assigned Support Team */}
            {(application.mentorName || application.counselorName) && (
                <div className="mb-6 p-4 bg-white rounded-lg border border-slate-200">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Your Support Team</p>
                    <div className="grid grid-cols-2 gap-3">
                        {application.mentorName && (
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <span className="material-symbols-outlined text-[16px]">person</span>
                                </span>
                                <div>
                                    <p className="text-xs font-semibold text-slate-600">Mentor</p>
                                    <p className="text-sm font-bold text-slate-900">{application.mentorName}</p>
                                </div>
                            </div>
                        )}
                        {application.counselorName && (
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <span className="material-symbols-outlined text-[16px]">support_agent</span>
                                </span>
                                <div>
                                    <p className="text-xs font-semibold text-slate-600">Counselor</p>
                                    <p className="text-sm font-bold text-slate-900">{application.counselorName}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Admin Remarks (if any) */}
            {application.remarks && (
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Admin Remarks</p>
                    <p className="text-sm text-slate-700 font-medium">{application.remarks}</p>
                </div>
            )}

            {/* Rejection Reason (if rejected) */}
            {application.status === "rejected" && application.rejectionReason && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">Reason for Rejection</p>
                    <p className="text-sm text-red-800 font-medium">{application.rejectionReason}</p>
                    <div className="mt-3 pt-3 border-t border-red-200">
                        <p className="text-[10px] text-red-700">
                            <span className="font-bold">Next Steps:</span> You can contact our support team to understand the reasons and potentially reapply with required changes.
                        </p>
                    </div>
                </div>
            )}

            {/* Call-to-Action for Different Statuses */}
            {application.status === "pending" && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 mt-4">
                    <p className="text-sm font-bold text-amber-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">info</span>
                        Please ensure all documents are uploaded in your dashboard
                    </p>
                </div>
            )}

            {application.status === "processing" && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mt-4">
                    <p className="text-sm font-bold text-blue-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] animate-spin">hourglass_bottom</span>
                        We're reviewing your application. You'll receive updates via email.
                    </p>
                </div>
            )}

            {application.status === "approved" && (
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 mt-4">
                    <p className="text-sm font-bold text-emerald-900 mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        Congratulations! Your application is approved.
                    </p>
                    <p className="text-xs text-emerald-700">
                        The loan will be disbursed to your bank account within 5-7 business days. Check your email for disbursement details.
                    </p>
                </div>
            )}

            {application.status === "disbursed" && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 mt-4">
                    <p className="text-sm font-bold text-purple-900 mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Loan disbursed successfully!
                    </p>
                    <p className="text-xs text-purple-700">Amount: ₹{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(application.amount)}</p>
                </div>
            )}

            {application.status === "rejected" && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200 mt-4">
                    <button className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all text-sm">
                        Contact Support for Assistance
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserApplicationStatus;
