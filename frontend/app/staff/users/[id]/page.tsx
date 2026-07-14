"use client";

import { useUserDossier } from "./DossierContext";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

// Premium 3D Interactive Card Component
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left - width / 2;
        const mouseY = e.clientY - rect.top - height / 2;

        const rX = -(mouseY / (height / 2)) * 5;
        const rY = (mouseX / (width / 2)) * 5;
        setTilt({ x: rX, y: rY });

        const glareX = ((e.clientX - rect.left) / width) * 100;
        const glareY = ((e.clientY - rect.top) / height) * 100;
        setGlare({ x: glareX, y: glareY, opacity: 0.15 });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
        setGlare(prev => ({ ...prev, opacity: 0 }));
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.01, 1.01, 1.01)`,
                transition: "transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)",
            }}
            className={`relative overflow-hidden transition-all duration-300 ${className}`}
        >
            <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-10"
                style={{
                    background: `radial-gradient(circle 250px at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, 0.5), transparent)`,
                    opacity: glare.opacity,
                }}
            />
            {children}
        </div>
    );
}

export default function ProfileTab() {
    const { userData, userApplications, userDocuments } = useUserDossier();
    const router = useRouter();

    const getDisplayValue = (value: any, fallback = "—") => {
        if (value === undefined || value === null || value === "") return fallback;
        if (typeof value === "string" && value.trim() === "") return fallback;
        return value;
    };

    const getParentName = (type: "father" | "mother") => {
        const family = (userData as any)?.family;
        const parentDetails = (userData as any)?.parentDetails;
        const parents = (userData as any)?.parents;
        const direct = (userData as any)?.[`${type}Name`];

        const candidates = [
            family?.[`${type}Name`],
            parentDetails?.[`${type}Name`],
            parents?.[`${type}Name`],
            direct,
        ];

        return candidates.find((value) => typeof value === "string" && value.trim()) || "—";
    };

    const getCoApplicantName = (index: 1 | 2 | 3) => {
        if (index === 1 && userApplications && userApplications.length > 0) {
            const firstApp = userApplications.find(app => app.coApplicantName);
            if (firstApp?.coApplicantName) {
                return firstApp.coApplicantName;
            }
        }

        const coApplicant = (userData as any)?.coApplicant;

        if (Array.isArray(coApplicant)) {
            return getDisplayValue(coApplicant[index - 1]?.name, "—");
        }

        if (coApplicant && typeof coApplicant === "object") {
            if (index === 1) {
                return getDisplayValue(coApplicant.name || coApplicant?.coApplicant1?.name || coApplicant?.firstName, "—");
            }
            if (index === 2) {
                return getDisplayValue(coApplicant.coApplicant2?.name || coApplicant?.secondName, "—");
            }
            if (index === 3) {
                return getDisplayValue(coApplicant.coApplicant3?.name || coApplicant?.thirdName, "—");
            }
        }

        return "—";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-slate-800"
        >
            {/* Personal Information Glass-Card */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm space-y-6">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-600">person</span>
                        Student Profile - Personal & Academic Details
                    </h2>

                    <div className="space-y-6">
                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-4">Personal Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                                    <span className="text-sm font-medium text-slate-700 block mt-1 lowercase">{getDisplayValue(userData.email)}</span>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone Number</label>
                                    <span className="text-sm font-medium text-slate-700 block mt-1">{getDisplayValue(userData.phoneNumber || userData.mobile || userData.phone)}</span>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Date of Birth</label>
                                    {(() => {
                                        const raw = (userData as any).dateOfBirth;
                                        let dobDate: Date | null = null;
                                        if (raw) {
                                            // Handle DD-MM-YYYY (server format)
                                            if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
                                                const [dd, mm, yyyy] = raw.split('-');
                                                dobDate = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
                                            } else {
                                                dobDate = new Date(raw);
                                            }
                                        }
                                        const isDobValid = dobDate && !isNaN(dobDate.getTime());
                                        if (isDobValid) {
                                            return (
                                                <span className="text-sm font-medium text-slate-700 block mt-1">
                                                    {dobDate!.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            );
                                        } else {
                                            return (
                                                <span className="text-sm font-medium text-slate-400 block mt-1">—</span>
                                            );
                                        }
                                    })()}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Nationality</label>
                                    <span className="text-sm font-medium text-slate-700 block mt-1">
                                        {getDisplayValue(userData.nationality?.name || (typeof userData.nationality === 'string' ? userData.nationality : '') || "Indian")}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Destination Country</label>
                                    <span className="text-sm font-medium text-slate-700 block mt-1">
                                        {getDisplayValue(userData.studyDestination || userData.countryOfEducation || userData.academic?.countryOfEducation, "—")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-4">Family & Co-applicant Details</h3>
                            <div className="space-y-4">
                                {/* Parents Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-xl border border-slate-200/80">
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Father Name</label>
                                        <span className="text-sm font-medium text-slate-700 block mt-1">{getParentName("father")}</span>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200/80">
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Mother Name</label>
                                        <span className="text-sm font-medium text-slate-700 block mt-1">{getParentName("mother")}</span>
                                    </div>
                                </div>

                                {/* Co-Applicants Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        {
                                            label: "Primary Co-applicant",
                                            value: getCoApplicantName(1),
                                            subValue: (() => {
                                                if (userApplications && userApplications.length > 0) {
                                                    const firstApp = userApplications.find(app => app.coApplicantRelation);
                                                    if (firstApp?.coApplicantRelation) {
                                                        return `Relation: ${firstApp.coApplicantRelation}`;
                                                    }
                                                }
                                                const rel = (typeof userData.coApplicant === 'object' && userData.coApplicant !== null)
                                                    ? (userData.coApplicant.relation || userData.coApplicant.relationship || "—")
                                                    : "—";
                                                return `Relation: ${rel}`;
                                            })()
                                        },
                                        { label: "Co-applicant 2", value: getCoApplicantName(2) },
                                        { label: "Co-applicant 3", value: getCoApplicantName(3) },
                                    ].map((item: any, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200/80">
                                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</label>
                                            <span className="text-sm font-medium text-slate-700 block mt-1">{item.value}</span>
                                            {item.subValue && item.value !== "—" && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-600 mt-2">
                                                    {item.subValue}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Utility Panel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6 h-fit">
                {/* Application Progress Widget */}
                <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Application Progress</h4>
                    {userApplications.length > 0 ? (() => {
                        const activeApp = userApplications[0];
                        // Progress calculation
                        const stages = [
                            { label: "Applied", order: 10, active: activeApp.progress >= 10 },
                            { label: "Verification", order: 40, active: activeApp.progress >= 40 },
                            { label: "Bank Review", order: 70, active: activeApp.progress >= 70 },
                            { label: "Approval", order: 90, active: activeApp.progress >= 90 },
                            { label: "Disbursed", order: 100, active: activeApp.progress >= 100 }
                        ];
                        return (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                    <span className="text-xs font-semibold text-indigo-900">Current Progress</span>
                                    <span className="text-lg font-black text-indigo-600">{activeApp.progress || 10}%</span>
                                </div>

                                {/* Stepper Funnel */}
                                <div className="relative pl-6 space-y-4 py-2">
                                    {/* Stepper Connector Line */}
                                    <div className="absolute left-[9px] top-4 bottom-4 w-[2px] bg-slate-100" />

                                    {stages.map((stg, sIdx) => (
                                        <div key={sIdx} className="flex items-center gap-3 relative">
                                            {/* Step Circle */}
                                            <div className={`absolute -left-[21px] w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${stg.active
                                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                                                    : "bg-white border-slate-200 text-slate-400"
                                                }`}>
                                                {stg.active ? (
                                                    <span className="material-symbols-outlined text-[10px] font-black">check</span>
                                                ) : (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                                )}
                                            </div>
                                            <span className={`text-xs font-semibold transition-all ${stg.active ? "text-slate-900" : "text-slate-400"}`}>
                                                {stg.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })() : (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs text-slate-400">
                            No active applications
                        </div>
                    )}
                </div>

                {/* Document Vault Quick-Look */}
                {/* <div className="pt-6 border-t border-slate-100">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Document Vault</h4>
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-50/50 rounded-xl border border-slate-200/50 text-center">
                        {userDocuments.length > 0 ? (
                            <div className="flex items-center gap-4 w-full text-left">
                                
                                <div className="relative flex items-center justify-center w-16 h-16 shrink-0">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="32" cy="32" r="28" className="text-slate-100" strokeWidth="4" stroke="currentColor" fill="transparent" />
                                        <circle cx="32" cy="32" r="28" className="text-indigo-600" strokeWidth="4" strokeDasharray={175} strokeDashoffset={175 - (175 * Math.min(userDocuments.length, 10)) / 10} strokeLinecap="round" stroke="currentColor" fill="transparent" />
                                    </svg>
                                    <span className="absolute text-sm font-bold text-slate-900">{userDocuments.length}</span>
                                </div>
                                <div>
                                    <span className="text-xs font-semibold text-slate-700 block">Documents Uploaded</span>
                                    <span className="text-[10px] font-medium text-slate-400 block mt-0.5">Secure vault storage</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                                    <span className="material-symbols-outlined text-[24px]">folder_open</span>
                                </div>
                                <span className="text-xs font-semibold text-slate-700 block">0 Stored Documents</span>
                                <span className="text-[10px] font-medium text-slate-400 block mt-0.5 mb-3">No files uploaded yet</span>
                            </>
                        )}
                        
                        <button
                            onClick={() => router.push(`/staff/users/${userData.id}/documents`)}
                            className="w-full mt-4 py-3 border-2 border-dashed border-slate-200 hover:border-indigo-500 text-slate-500 hover:text-indigo-600 rounded-xl font-black text-[9px] uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                        >
                            <span className="material-symbols-outlined text-[14px]">cloud_upload</span>
                            Upload Document
                        </button>
                    </div>
                </div> */}

                {/* Member Since Utility */}
                <div className="pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200/50">
                            <span className="material-symbols-outlined text-[20px] text-slate-400">calendar_today</span>
                        </div>
                        <div>
                            <p className="text-[12px] font-bold text-slate-700">
                                {(userData.createdAt || userData.created_at) ? new Date(userData.createdAt || userData.created_at).toLocaleString('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: '2-digit', year: 'numeric' }) : "—"}
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Secure Access Node</p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
