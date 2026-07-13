"use client";

import { useUserDossier } from "../DossierContext";
import { EVVTestAgent } from "@/components/staff/EVVTestAgent";
import { motion } from "framer-motion";
import { type EVVResult } from "@/lib/evv-parser";

export default function EvvTab() {
    const { userApplications, refreshData } = useUserDossier();
    
    // Bind it to the first active application
    const activeApp = userApplications && userApplications.length > 0 ? userApplications[0] : null;

    const handleEVVComplete = async (result: EVVResult) => {
        // Optionally send the result to the backend to save
        console.log("EVV Analysis Complete:", result);
        refreshData();
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
