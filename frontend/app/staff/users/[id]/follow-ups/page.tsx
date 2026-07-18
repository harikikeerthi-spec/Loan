"use client";

import { useUserDossier } from "../DossierContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";
import { checkFollowUpConflict, DEFAULT_TIME_SLOTS, formatSlot12Hr } from "@/lib/followUpUtils";

interface FollowUp {
    id: string;
    date: string;
    time: string;
    notes: string;
    status: "pending" | "completed" | "cancelled";
    createdAt: string;
    studentId?: string;
    studentName?: string;
    appNumber?: string;
    appId?: string;
}

export default function FollowUpsTab() {
    const { userData, userApplications } = useUserDossier();
    const { user: staffUser } = useAuth();
    
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    
    // Form state
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [notes, setNotes] = useState("");

    const getStorageKey = () => {
        if (!staffUser || !userData) return null;
        const staffId = staffUser.id || staffUser.email || "default";
        const studentId = userData.id || userData._id || "unknown";
        return `follow_ups_${staffId}_${studentId}`;
    };

    useEffect(() => {
        const key = getStorageKey();
        if (key && typeof window !== "undefined" && userData) {
            const stored = localStorage.getItem(key);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored) as FollowUp[];
                    let modified = false;
                    const activeApp = userApplications?.[0];
                    const name = `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim();
                    const appNum = activeApp?.appNumber || userData?.studentId || userData?.id || "VL-STU";
                    const studId = userData.id || userData._id || "unknown";
                    const activeAppId = activeApp?.id || activeApp?._id;

                    const updated = parsed.map(f => {
                        if (!f.studentName || !f.studentId || !f.appNumber) {
                            modified = true;
                            return {
                                ...f,
                                studentName: f.studentName || name,
                                studentId: f.studentId || studId,
                                appNumber: f.appNumber || appNum,
                                appId: f.appId || activeAppId
                            };
                        }
                        return f;
                    });
                    
                    if (modified) {
                        localStorage.setItem(key, JSON.stringify(updated));
                        setFollowUps(updated);
                    } else {
                        setFollowUps(parsed);
                    }
                } catch (e) {
                    console.error("Failed to parse follow ups:", e);
                }
            }
        }
    }, [staffUser, userData, userApplications]);

    const saveFollowUps = (newFollowUps: FollowUp[]) => {
        const key = getStorageKey();
        if (key && typeof window !== "undefined") {
            localStorage.setItem(key, JSON.stringify(newFollowUps));
            setFollowUps(newFollowUps);
        }
    };

    const handleAddFollowUp = (e: React.FormEvent) => {
        e.preventDefault();
        if (!date || !time) return;
        
        const activeApp = userApplications?.[0];
        const studentId = userData?.id || userData?._id || "unknown";
        const studentName = `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim();
        const appNumber = activeApp?.appNumber || userData?.studentId || userData?.id || "VL-STU";
        const appId = activeApp?.id || activeApp?._id;
        const staffId = staffUser?.id || staffUser?.email || "default";

        // Check if date and time slot is already assigned
        const conflict = checkFollowUpConflict({
            staffId,
            date,
            time
        });

        if (conflict) {
            alert(`⚠️ Schedule Conflict!\n\nThe slot (${date} at ${formatSlot12Hr(time) || time}) is already assigned to ${conflict.studentName}.\n\nEach date and time slot can only be assigned once. Please select a different time slot.`);
            return;
        }

        const newFollowUp: FollowUp = {
            id: Date.now().toString(),
            date,
            time,
            notes,
            status: "pending",
            createdAt: new Date().toISOString(),
            studentId,
            studentName,
            appNumber,
            appId
        };
        
        saveFollowUps([...followUps, newFollowUp]);
        
        // Reset form
        setDate("");
        setTime("");
        setNotes("");
        setIsAdding(false);
    };

    const updateStatus = (id: string, status: "completed" | "cancelled") => {
        const updated = followUps.map(f => f.id === id ? { ...f, status } : f);
        saveFollowUps(updated);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full flex flex-col gap-6"
        >
            <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Follow-up Tasks</h2>
                    <p className="text-xs text-slate-500 mt-1">Manage and track follow-ups for {userData?.firstName} {userData?.lastName}</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[18px]">
                        {isAdding ? "close" : "add"}
                    </span>
                    {isAdding ? "Cancel" : "Add Follow-up"}
                </button>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <form onSubmit={handleAddFollowUp} className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 shadow-sm mb-2">
                            <h3 className="text-sm font-bold text-indigo-900 mb-4 uppercase tracking-wider">New Follow-up</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1.5">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1.5">Time Slot</label>
                                    <select
                                        required
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    >
                                        <option value="">Select Time Slot...</option>
                                        {DEFAULT_TIME_SLOTS.map(slot => {
                                            const staffId = staffUser?.id || staffUser?.email || "default";

                                            const conflict = date ? checkFollowUpConflict({
                                                staffId,
                                                date,
                                                time: slot
                                            }) : null;

                                            return (
                                                <option key={slot} value={slot} disabled={!!conflict}>
                                                    {formatSlot12Hr(slot)} {conflict ? `❌ (Booked - ${conflict.studentName})` : '✓ (Available)'}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1.5">Notes / Description</label>
                                <textarea
                                    required
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Enter follow-up details..."
                                    rows={3}
                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                                >
                                    Save Follow-up
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {followUps.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                            <span className="material-symbols-outlined text-[32px]">assignment</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-700">No follow-ups found</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">There are no follow-ups scheduled for this user. Click the button above to add one.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {followUps.sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime()).map((followUp) => (
                            <div key={followUp.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-slate-50">
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                        followUp.status === "completed" ? "bg-emerald-100 text-emerald-600" :
                                        followUp.status === "cancelled" ? "bg-rose-100 text-rose-600" :
                                        "bg-indigo-100 text-indigo-600"
                                    }`}>
                                        <span className="material-symbols-outlined">
                                            {followUp.status === "completed" ? "check_circle" :
                                             followUp.status === "cancelled" ? "cancel" :
                                             "schedule"}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-bold text-slate-800">{formatDate(followUp.date, "MMM d, yyyy")}</span>
                                            <span className="text-xs font-semibold text-slate-400">•</span>
                                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{formatSlot12Hr(followUp.time) || followUp.time}</span>
                                            
                                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ml-2 ${
                                                followUp.status === "completed" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                                                followUp.status === "cancelled" ? "bg-rose-50 text-rose-600 border border-rose-200" :
                                                "bg-amber-50 text-amber-600 border border-amber-200"
                                            }`}>
                                                {followUp.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{followUp.notes}</p>
                                    </div>
                                </div>
                                
                                {followUp.status === "pending" && (
                                    <div className="flex items-center gap-2 shrink-0 ml-14 sm:ml-0">
                                        <button
                                            onClick={() => updateStatus(followUp.id, "completed")}
                                            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">done</span>
                                            Complete
                                        </button>
                                        <button
                                            onClick={() => updateStatus(followUp.id, "cancelled")}
                                            className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">close</span>
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
