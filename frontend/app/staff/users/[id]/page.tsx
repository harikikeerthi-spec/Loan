"use client";

import { useUserDossier } from "./DossierContext";
import { useState, useRef } from "react";
import { motion } from "framer-motion";

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
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
            {/* Personal Information Glass-Card */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        <span className="material-symbols-outlined">person</span>
                        Student Profile - Personal & Academic Details
                    </h2>

                    <div className="space-y-6">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
                            <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 mb-4">Personal Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {[
                                    { label: "Email", value: getDisplayValue(userData.email), lowercase: true },
                                    { label: "Phone Number", value: getDisplayValue(userData.phoneNumber || userData.mobile || userData.phone) },
                                    { label: "Date of Birth", value: userData.dateOfBirth ? new Date(userData.dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "—" },
                                    { label: "Nationality", value: getDisplayValue(userData.nationality?.name || (typeof userData.nationality === 'string' ? userData.nationality : '') || "Indian") },
                                    { label: "Destination Country", value: getDisplayValue(userData.studyDestination || userData.countryOfEducation || userData.academic?.countryOfEducation, "—") },
                                ].map((item: any, idx) => (
                                    <div key={idx}>
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">{item.label}</p>
                                        <p className={`text-[14px] font-semibold text-slate-900 ${item.lowercase ? "lowercase" : ""}`}>
                                            {item.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
                            <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 mb-4">Parent Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Father Name</p>
                                    <p className="text-[14px] font-semibold text-slate-900">
                                        {getParentName("father")}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Mother Name</p>
                                    <p className="text-[14px] font-semibold text-slate-900">
                                        {getParentName("mother")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
                            <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 mb-4">Co-applicant Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                     { 
                                         label: "Co-applicant 1", 
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
                                     { label: "Co-applicant 2", value: "-" },
                                     { label: "Co-applicant 3", value: "-" },
                                 ].map((item: any, idx) => (
                                     <div key={idx} className="rounded-xl border border-slate-200 bg-white/80 p-4">
                                         <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">{item.label}</p>
                                         <p className="text-[14px] font-semibold text-slate-900">{item.value}</p>
                                         {item.subValue && (
                                             <p className="text-[11px] font-semibold text-indigo-600 mt-1">{item.subValue}</p>
                                         )}
                                     </div>
                                 ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Panel */}
            <div className="space-y-4">
                {[
                    { label: "Applications Node", val: userApplications.length, icon: "description", color: "from-[#6605c7]/10 to-[#6605c7]/5", border: "hover:border-[#6605c7]/30", text: "text-[#6605c7]" },
                    { label: "Stored Documents", val: userDocuments.length, icon: "folder", color: "from-[#8b24e5]/10 to-[#8b24e5]/5", border: "hover:border-[#8b24e5]/30", text: "text-[#8b24e5]" }
                ].map((stat, i) => (
                    <TiltCard key={i} className="p-6 rounded-2xl bg-white/60 border border-white/80 shadow-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
                                <p className="text-4xl font-extrabold text-[#1a1626]">{stat.val}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center border border-white/40`}>
                                <span className={`material-symbols-outlined text-[24px] ${stat.text}`}>{stat.icon}</span>
                            </div>
                        </div>
                    </TiltCard>
                ))}

                <TiltCard className="p-6 rounded-2xl bg-white/60 border border-white/80 shadow-md">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Member Since</p>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-white/40">
                            <span className="material-symbols-outlined text-[20px] text-gray-400">calendar_today</span>
                        </div>
                        <div>
                            <p className="text-[12px] font-bold text-[#1a1626]">
                                {(userData.createdAt || userData.created_at) ? new Date(userData.createdAt || userData.created_at).toLocaleString('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: '2-digit', year: 'numeric' }) : "—"}
                            </p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider font-mono">Secure Access Node</p>
                        </div>
                    </div>
                </TiltCard>
            </div>
        </motion.div>
    );
}
