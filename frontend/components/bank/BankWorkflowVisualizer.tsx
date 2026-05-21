"use client";

import React from "react";
import { motion } from "framer-motion";

interface WorkflowStage {
  id: string;
  label: string;
  icon: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
  timestamp?: string;
}

interface BankWorkflowVisualizerProps {
  currentStatus: string;
  stages?: WorkflowStage[];
  history?: Array<{
    fromStatus?: string;
    toStatus: string;
    changedAt: string;
    changedBy: string;
    changeReason: string;
  }>;
}

const DEFAULT_STAGES: Record<string, { label: string; icon: string; description: string }> = {
  SUBMITTED_TO_BANK: {
    label: "Submitted",
    icon: "send",
    description: "Application shared with bank",
  },
  FILE_LOGGED: {
    label: "File Logged",
    icon: "folder_open",
    description: "Bank logs file + enters LAN",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    icon: "fact_check",
    description: "Bank reviews internally",
  },
  QUERY_RAISED: {
    label: "Query Raised",
    icon: "help",
    description: "Bank needs more documents",
  },
  SANCTIONED: {
    label: "Sanctioned",
    icon: "verified",
    description: "Loan approved & sanctioned",
  },
  CONDITIONAL_SANCTION: {
    label: "Conditional",
    icon: "gavel",
    description: "Approved with conditions",
  },
  COUNTER_OFFER: {
    label: "Counter Offer",
    icon: "handshake",
    description: "Bank offers different terms",
  },
  REJECTED: {
    label: "Rejected",
    icon: "cancel",
    description: "Bank declined application",
  },
  PROCESSING_FEE: {
    label: "Processing Fee",
    icon: "payments",
    description: "Fee verification",
  },
  DISBURSEMENT_PENDING: {
    label: "Disbursement Pending",
    icon: "hourglass_top",
    description: "Awaiting final approval",
  },
  DISBURSED: {
    label: "Disbursed",
    icon: "done_all",
    description: "Funds transferred successfully",
  },
  RESUBMIT_OTHER_BANK: {
    label: "Resubmit",
    icon: "loop",
    description: "Can try another bank",
  },
};

const WORKFLOW_ORDER = [
  "SUBMITTED_TO_BANK",
  "FILE_LOGGED",
  "UNDER_REVIEW",
  "QUERY_RAISED",
  "SANCTIONED",
  "PROCESSING_FEE",
  "DISBURSEMENT_PENDING",
  "DISBURSED",
];

export default function BankWorkflowVisualizer({
  currentStatus,
  stages,
  history,
}: BankWorkflowVisualizerProps) {
  // Build stages from current status if not provided
  const displayStages = stages || buildStagesFromStatus(currentStatus);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-6">
      {/* Header */}
      <div className="mb-8">
        <h3 className="text-xl font-black text-slate-900 mb-2">Bank Processing Workflow</h3>
        <p className="text-sm text-slate-500">
          Current Status: <span className="font-bold text-slate-900">{getStatusLabel(currentStatus)}</span>
        </p>
      </div>

      {/* Main Timeline Visualization */}
      <div className="mb-8">
        <div className="flex gap-2 overflow-x-auto pb-4">
          {displayStages.map((stage, idx) => (
            <motion.div
              key={stage.id}
              className="flex-shrink-0 flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              {/* Stage Circle */}
              <motion.div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold transition-all ${
                  stage.isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50 scale-110"
                    : stage.isCompleted
                      ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-500"
                      : "bg-slate-100 text-slate-400 border-2 border-slate-200"
                }`}
                whileHover={{ scale: 1.05 }}
              >
                <span className="material-symbols-outlined text-[28px]">{stage.icon}</span>
              </motion.div>

              {/* Connector Line */}
              {idx < displayStages.length - 1 && (
                <div
                  className={`h-6 w-0.5 my-2 ${
                    stage.isCompleted ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                />
              )}

              {/* Stage Label */}
              <div className="text-center mt-2 w-24">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-900">
                  {stage.label}
                </p>
                <p className="text-[8px] text-slate-500 mt-0.5 line-clamp-2">
                  {stage.description}
                </p>
                {stage.timestamp && (
                  <p className="text-[7px] text-slate-400 mt-1">{stage.timestamp}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Status History */}
      {history && history.length > 0 && (
        <div className="border-t border-slate-200 pt-6">
          <h4 className="text-sm font-black text-slate-900 mb-4">Activity Timeline</h4>
          <div className="space-y-3">
            {history.map((entry, idx) => (
              <motion.div
                key={idx}
                className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className="flex-shrink-0">
                  <span className="material-symbols-outlined text-sm text-blue-600">
                    arrow_forward
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900">
                    {entry.fromStatus && `${getStatusLabel(entry.fromStatus)} →`}{" "}
                    {getStatusLabel(entry.toStatus)}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">{entry.changeReason}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-slate-400">By: {entry.changedBy}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(entry.changedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Status Info Card */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-3">
          <span className="material-symbols-outlined text-blue-600 flex-shrink-0">
            info
          </span>
          <div>
            <p className="text-sm font-bold text-blue-900">Current Stage Information</p>
            <p className="text-xs text-blue-700 mt-1">
              {getStageDescription(currentStatus)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Functions

function buildStagesFromStatus(currentStatus: string): WorkflowStage[] {
  const currentIdx = WORKFLOW_ORDER.indexOf(currentStatus);

  return WORKFLOW_ORDER.map((statusId, idx) => {
    const stageInfo = DEFAULT_STAGES[statusId];
    return {
      id: statusId,
      label: stageInfo.label,
      icon: stageInfo.icon,
      description: stageInfo.description,
      isCompleted: idx < currentIdx,
      isActive: idx === currentIdx,
    };
  });
}

function getStatusLabel(status: string): string {
  return DEFAULT_STAGES[status]?.label || status.replace(/_/g, " ");
}

function getStageDescription(status: string): string {
  const descriptions: Record<string, string> = {
    SUBMITTED_TO_BANK:
      "Your application has been shared with the bank. They will now review and assign a LAN number.",
    FILE_LOGGED:
      "Bank has logged your file and assigned a LAN (Loan Account Number). Internal review is starting.",
    UNDER_REVIEW:
      "Bank is reviewing your application internally. This typically takes 3-5 business days.",
    QUERY_RAISED:
      "Bank needs additional documents or clarifications. Please respond within the given timeframe.",
    SANCTIONED:
      "Congratulations! Your loan has been sanctioned. Processing fee payment is the next step.",
    CONDITIONAL_SANCTION:
      "Your loan is approved with certain conditions. Meet these conditions for final approval.",
    COUNTER_OFFER:
      "Bank has made a counter offer with different terms. Review and accept or decline.",
    REJECTED:
      "Unfortunately, your application has been declined. You can apply to another bank.",
    PROCESSING_FEE:
      "Processing fee verification is in progress. Once completed, disbursement will begin.",
    DISBURSEMENT_PENDING:
      "Your loan is approved and ready for disbursement. Funds will be transferred soon.",
    DISBURSED:
      "Congratulations! Your loan has been successfully disbursed. The funds are now in your account.",
    RESUBMIT_OTHER_BANK:
      "You can resubmit your application to another bank for consideration.",
  };

  return (
    descriptions[status] ||
    "Your application is being processed. Please check back soon for updates."
  );
}
