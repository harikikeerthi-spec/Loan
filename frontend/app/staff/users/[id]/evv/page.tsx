"use client";

import { useUserDossier } from "../DossierContext";
import { EVVTestAgent } from "@/components/staff/EVVTestAgent";
import { motion } from "framer-motion";
import { type EVVResult } from "@/lib/evv-parser";
import { adminApi } from "@/lib/api";

export default function EvvTab() {
    const { userApplications, refreshData } = useUserDossier();
    
    // Bind it to the first active application
    const activeApp = userApplications && userApplications.length > 0 ? userApplications[0] : null;

    const handleEVVComplete = async (result: EVVResult) => {
        if (!activeApp) return;
        try {
            const payload = {
                evvOverall: result.overallEVV,
                evvStatus: "COMPUTED",
                evvMonthlyBreakdown: result.monthlyMetrics.map(m => ({
                    label: m.label,
                    points: m.points,
                    averageBalance: m.avg,
                    min: m.min,
                    max: m.max,
                    evv: m.avg
                }))
            };
            await adminApi.updateApplication(activeApp.id || activeApp._id, payload);
            console.log("EVV Analysis Complete and stored on DB:", result);
            await refreshData();
        } catch (err) {
            console.error("Failed to save EVV analysis to DB:", err);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
        >
            {activeApp ? (
                // EVV Test Agent - Quick local processing
                <div className="bg-white/60 border border-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6">
                    <EVVTestAgent
                        applicationId={activeApp?.id || activeApp?._id}
                        onComplete={handleEVVComplete}
                    />
                </div>
            ) : (
                // No Application
                <div className="bg-white/60 border border-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-12 text-center">
                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-3">payments</span>
                    <p className="text-sm font-semibold text-gray-500 font-sans">No applications found. EVV analysis requires an active application file.</p>
                </div>
            )}
        </motion.div>
    );
}
