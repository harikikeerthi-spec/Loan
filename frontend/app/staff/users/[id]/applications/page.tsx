"use client";

import { useUserDossier } from "../DossierContext";
import { motion } from "framer-motion";
import { formatDate } from "@/lib/utils";

export default function ApplicationsTab() {
    const { userApplications, setRoutingApp, setIsShareModalOpen } = useUserDossier();

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
        >
            <div className="bg-white/60 border border-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
                {userApplications.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-white/20">
                                    {["Application ID", "Bank Node", "Loan Program", "Status", "Timestamp"].map((header, idx) => (
                                        <th key={idx} className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400">{header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {userApplications.map((app, idx) => {
                                    const statusStyle = app.status === "approved"
                                        ? "bg-emerald-500/8 text-emerald-600 border-emerald-500/20"
                                        : app.status === "rejected"
                                            ? "bg-rose-500/8 text-rose-600 border-rose-500/20"
                                            : app.status === "processing"
                                                ? "bg-indigo-500/8 text-indigo-600 border-indigo-500/20"
                                                : "bg-amber-500/8 text-amber-600 border-amber-500/20";

                                    return (
                                        <tr key={idx} className="hover:bg-white/30 transition-colors duration-200">
                                            <td className="px-6 py-4 text-xs font-mono font-bold text-[#6605c7]" title={app.id}>
                                                {(app.applicationNumber && (app.applicationNumber.startsWith('VTU-APP-') || app.applicationNumber.startsWith('VTU-BNK-') || app.applicationNumber.startsWith('VL-APP-'))) ? (
                                                    app.applicationNumber
                                                ) : (
                                                    <span className="text-gray-400 font-semibold italic">Not Generated Yet</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-semibold text-gray-700">
                                                {(!app.bank || app.bank === "Any Bank" || app.bank === "—" || app.bank === "Pending Partner") ? (
                                                    <button
                                                        onClick={() => {
                                                            setRoutingApp(app);
                                                            setIsShareModalOpen(true);
                                                        }}
                                                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md hover:shadow-purple-500/20 active:scale-95 cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">account_balance</span>
                                                        Apply to Bank
                                                    </button>
                                                ) : (
                                                    <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                                                        <span className="material-symbols-outlined text-[16px] text-emerald-500">check_circle</span>
                                                        {app.bank}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-semibold text-gray-700">{app.loanType || "—"}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${statusStyle}`}>
                                                    <span className={`w-1 h-1 rounded-full ${app.status === "approved" ? "bg-emerald-500 animate-pulse" : app.status === "rejected" ? "bg-rose-500" : app.status === "processing" ? "bg-indigo-500 animate-pulse" : "bg-amber-500 animate-pulse"}`} />
                                                    {app.status || "Pending"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                                                {formatDate(app.createdAt, "MMM d, yyyy")}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-3">description</span>
                        <p className="text-sm font-semibold text-gray-500">No applications initiated yet</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
