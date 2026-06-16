"use client";

import { motion, AnimatePresence } from "framer-motion";

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type: "success" | "error" | "info" | "warning";
}

export default function AlertModal({ isOpen, onClose, title, message, type }: AlertModalProps) {
    // Parser for detailed verification errors
    const parseErrorMessage = (msg: string) => {
        if (!msg) return { summary: "", details: "", action: "" };

        let cleanMsg = msg.replace(/^Upload failed:\s*/i, "");
        let summary = cleanMsg;
        let details = "";
        let action = "";

        const detailsIndex = cleanMsg.indexOf("Details:");
        if (detailsIndex !== -1) {
            summary = cleanMsg.substring(0, detailsIndex).trim();
            details = cleanMsg.substring(detailsIndex + 8).trim();
        }

        const actionKeywords = [
            "Please check your document",
            "Please upload the correct document",
            "Please upload",
            "Please try again"
        ];
        let bestActionIdx = -1;

        for (const kw of actionKeywords) {
            const idx = details ? details.indexOf(kw) : summary.indexOf(kw);
            if (idx !== -1 && (bestActionIdx === -1 || idx < bestActionIdx)) {
                bestActionIdx = idx;
            }
        }

        if (bestActionIdx !== -1) {
            if (details) {
                action = details.substring(bestActionIdx).trim();
                details = details.substring(0, bestActionIdx).trim();
            } else {
                action = summary.substring(bestActionIdx).trim();
                summary = summary.substring(0, bestActionIdx).trim();
            }
        }

        // Clean up trailing punctuation & clean up duplicates
        summary = summary.replace(/[:.,\s]+$/, ".").trim();
        details = details.replace(/[:.,\s]+$/, ".").trim();
        action = action.replace(/[:.,\s]+$/, ".").trim();

        return { summary, details, action };
    };

    const parsed = type === "error" ? parseErrorMessage(message) : { summary: message, details: "", action: "" };

    const themes = {
        error: {
            bg: "bg-rose-50/90",
            border: "border-rose-100",
            iconBg: "bg-rose-500 text-white",
            icon: "warning",
            buttonBg: "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20 text-white",
            titleText: "text-rose-950",
            accentBg: "bg-rose-50/50 border border-rose-100/50",
            accentText: "text-rose-800",
        },
        success: {
            bg: "bg-emerald-50/90",
            border: "border-emerald-100",
            iconBg: "bg-emerald-500 text-white",
            icon: "check_circle",
            buttonBg: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 text-white",
            titleText: "text-emerald-950",
            accentBg: "bg-emerald-50/30 border border-emerald-100/50",
            accentText: "text-emerald-800",
        },
        warning: {
            bg: "bg-amber-50/90",
            border: "border-amber-100",
            iconBg: "bg-amber-500 text-white",
            icon: "report",
            buttonBg: "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20 text-white",
            titleText: "text-amber-950",
            accentBg: "bg-amber-50/30 border border-amber-100/50",
            accentText: "text-amber-800",
        },
        info: {
            bg: "bg-[#6605c7]/5",
            border: "border-[#6605c7]/10",
            iconBg: "bg-[#6605c7] text-white",
            icon: "info",
            buttonBg: "bg-[#6605c7] hover:bg-[#5504a6] shadow-purple-500/20 text-white",
            titleText: "text-gray-900",
            accentBg: "bg-gray-50 border border-gray-100",
            accentText: "text-gray-700",
        }
    };

    const theme = themes[type] || themes.info;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                        className="relative bg-white rounded-[28px] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 z-10"
                    >
                        {/* Header Banner */}
                        <div className={`p-6 flex items-center justify-between ${theme.bg} border-b ${theme.border}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${theme.iconBg} shadow-sm`}>
                                    <span className="material-symbols-outlined text-[22px] font-semibold">{theme.icon}</span>
                                </div>
                                <div>
                                    <h2 className={`font-black text-[16px] tracking-tight ${theme.titleText}`}>{title}</h2>
                                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">
                                        {type === "error" ? "Action Required" : "System Notification"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>

                        {/* Content Body */}
                        <div className="p-8">
                            {/* Summary Message */}
                            <div className="mb-6">
                                <p className="text-[13px] text-gray-700 font-semibold leading-relaxed">
                                    {parsed.summary}
                                </p>
                            </div>

                            {/* Technical Details block if exists */}
                            {parsed.details && (
                                <div className={`mb-6 p-4 rounded-2xl ${theme.accentBg}`}>
                                    <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Verification Details</p>
                                    <p className={`text-[11px] leading-relaxed font-medium ${theme.accentText}`}>
                                        {parsed.details}
                                    </p>
                                </div>
                            )}

                            {/* Action Recommendation Banner if exists */}
                            {parsed.action && (
                                <div className="mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex gap-3.5">
                                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shrink-0 border border-gray-200/60 shadow-sm">
                                        <span className={`material-symbols-outlined text-[18px] ${type === 'error' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            {type === 'error' ? 'info' : 'task_alt'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-0.5">Recommended Action</p>
                                        <p className="text-[11px] text-gray-700 leading-normal font-bold">
                                            {parsed.action}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Dismiss Action Button */}
                            <div className="flex justify-end">
                                <button
                                    onClick={onClose}
                                    className={`w-full sm:w-auto px-10 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-md active:scale-[0.98] ${theme.buttonBg}`}
                                >
                                    {type === 'error' ? "Retry Upload" : "Dismiss"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
