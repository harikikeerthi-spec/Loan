"use client";

import { useUserDossier } from "./DossierContext";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { adminApi, documentApi } from "@/lib/api";

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
    const { userData, userApplications, userDocuments, refreshData } = useUserDossier();
    const router = useRouter();

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [activeEditTab, setActiveEditTab] = useState<'student' | 'parents' | 'coapplicant' | 'academic'>('student');
    const [evvPeriod, setEvvPeriod] = useState<3 | 6 | 12>(6);
    const [editForm, setEditForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        dateOfBirth: "",
        nationality: "",
        studyDestination: "",
        fatherName: "",
        fatherAadhar: "",
        fatherPan: "",
        motherName: "",
        motherAadhar: "",
        motherPan: "",
        coappName: "",
        coappRelation: "",
        coappIncome: "",
        coappAadhar: "",
        coappPan: "",
        sscSchool: "",
        sscScore: "",
        hscCollege: "",
        hscScore: "",
        ugCollege: "",
        ugScore: "",
    });

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

    const parentsList = userData?.parents || [];
    const fatherData = parentsList.find((p: any) => p.relation === 'father');
    const motherData = parentsList.find((p: any) => p.relation === 'mother');
    const coapplicantData = parentsList.find((p: any) => p.relation === 'coapplicant');

    const userDocs = userDocuments || [];
    const sscDoc = userDocs.find((d: any) => d.docType === 'marksheet_10' || d.docType === 'marksheet_10th');
    const hscDoc = userDocs.find((d: any) => d.docType === 'marksheet_12' || d.docType === 'marksheet_12th');
    const ugDoc = userDocs.find((d: any) => d.docType === 'marksheet_ug' || d.docType === 'ug_degree' || d.docType === 'ug_transcript' || d.docType === 'degree_certificate');

    const getExtractedField = (doc: any, fieldName: string) => {
        if (!doc || !doc.verificationMetadata) return null;
        const meta = doc.verificationMetadata;
        const details = meta.details || {};
        const ext = details.extractedFields || meta.extractedFields || {};
        return ext[fieldName] || null;
    };

    const getAcademicDetails = (doc: any, key: 'ssc' | 'hsc' | 'ug') => {
        const fallback = userData?.academic?.[key] || {};
        const inst = getExtractedField(doc, 'institution') || getExtractedField(doc, 'university') || getExtractedField(doc, 'school_name') || getExtractedField(doc, 'college_name') || fallback.institute;
        const pct = getExtractedField(doc, 'score') || getExtractedField(doc, 'percentage') || getExtractedField(doc, 'gpa') || getExtractedField(doc, 'cgpa') || fallback.percentage;
        return { institute: inst || "—", percentage: pct ? (pct.toString().includes('%') ? pct : `${pct}%`) : "—" };
    };

    const sscDetails = getAcademicDetails(sscDoc, 'ssc');
    const hscDetails = getAcademicDetails(hscDoc, 'hsc');
    const ugDetails = getAcademicDetails(ugDoc, 'ug');

    const activeApp = userApplications && userApplications.length > 0 ? userApplications[0] : null;

    const getEvvScore = (months: 3 | 6 | 12) => {
        if (activeApp) {
            if (activeApp.evvOverall) {
                const overall = Number(activeApp.evvOverall);
                if (!isNaN(overall)) {
                    if (months === 3) return Math.round(overall * 1.15);
                    if (months === 6) return Math.round(overall * 1.05);
                    return Math.round(overall * 0.95);
                }
            }
            if (activeApp.evvMonthlyBreakdown) {
                try {
                    const breakdown = typeof activeApp.evvMonthlyBreakdown === 'string'
                        ? JSON.parse(activeApp.evvMonthlyBreakdown)
                        : activeApp.evvMonthlyBreakdown;
                    if (Array.isArray(breakdown) && breakdown.length > 0) {
                        const vals = breakdown.map((item: any) => Number(item.evv || item.averageBalance || 0)).filter(v => !isNaN(v) && v > 0);
                        if (vals.length > 0) {
                            const sum = vals.reduce((a, b) => a + b, 0);
                            const avg = sum / vals.length;
                            if (months === 3) return Math.round(avg * 1.15);
                            if (months === 6) return Math.round(avg * 1.05);
                            return Math.round(avg * 0.95);
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse evvMonthlyBreakdown:", e);
                }
            }
        }
        return null;
    };

    const getEvvMetrics = () => {
        if (!activeApp || !activeApp.evvMonthlyBreakdown) return null;
        try {
            const breakdown = typeof activeApp.evvMonthlyBreakdown === 'string'
                ? JSON.parse(activeApp.evvMonthlyBreakdown)
                : activeApp.evvMonthlyBreakdown;

            if (!Array.isArray(breakdown) || breakdown.length === 0) return null;

            const avgs = breakdown.map(item => Number(item.averageBalance || item.evv || 0)).filter(v => !isNaN(v));
            const mins = breakdown.map(item => Number(item.min || item.minimumBalance || 0)).filter(v => !isNaN(v));
            const maxs = breakdown.map(item => Number(item.max || item.maximumBalance || 0)).filter(v => !isNaN(v));

            if (avgs.length === 0) return null;

            const averageBalance = avgs.reduce((a, b) => a + b, 0) / avgs.length;
            const minimumBalance = mins.length > 0 ? Math.min(...mins) : 0;
            const maximumBalance = maxs.length > 0 ? Math.max(...maxs) : 0;

            const stabilityRatio = averageBalance > 0 ? Math.min(1, minimumBalance / averageBalance) : 0;
            const balanceScore = Math.min(60, (averageBalance / 50000) * 60);
            const stabilityScore = stabilityRatio * 40;
            const evvScore = Math.round(balanceScore + stabilityScore);

            let risk = "MEDIUM";
            if (evvScore >= 75) risk = "LOW";
            else if (evvScore < 45) risk = "HIGH";

            const eligibleAmount = Math.round((averageBalance * 12 * 0.40) / 50000) * 50000;
            const recommendation = eligibleAmount > 0
                ? `Eligible up to ₹${(eligibleAmount / 100000).toFixed(1)} Lakhs`
                : "Manual Review Required";

            return {
                averageBalance,
                minimumBalance,
                maximumBalance,
                evvScore,
                risk,
                recommendation
            };
        } catch (e) {
            console.error("Failed to parse evvMonthlyBreakdown:", e);
            return null;
        }
    };

    const handleOpenEdit = () => {
        setSubmitError("");
        setEditForm({
            firstName: userData?.firstName || "",
            lastName: userData?.lastName || "",
            email: userData?.email || "",
            phoneNumber: userData?.phoneNumber || userData?.mobile || userData?.phone || "",
            dateOfBirth: userData?.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split('T')[0] : "",
            nationality: typeof userData?.nationality === 'object' ? (userData?.nationality?.name || "") : (userData?.nationality || "Indian"),
            studyDestination: userData?.studyDestination || userData?.countryOfEducation || "",

            fatherName: fatherData?.name || userData?.fatherName || "",
            fatherAadhar: fatherData?.aadharNumber || "",
            fatherPan: fatherData?.panNumber || "",

            motherName: motherData?.name || "",
            motherAadhar: motherData?.aadharNumber || "",
            motherPan: motherData?.panNumber || "",

            coappName: coapplicantData?.name || (userData?.coApplicant?.name || ""),
            coappRelation: coapplicantData?.relation || (userData?.coApplicant?.relation || userData?.coApplicant?.relationship || ""),
            coappIncome: userData?.coApplicant?.monthlyIncome || userData?.coApplicantIncome || "",
            coappAadhar: coapplicantData?.aadharNumber || "",
            coappPan: coapplicantData?.panNumber || "",

            sscSchool: sscDetails.institute === "—" ? "" : sscDetails.institute,
            sscScore: sscDetails.percentage === "—" ? "" : sscDetails.percentage.replace('%', ''),
            hscCollege: hscDetails.institute === "—" ? "" : hscDetails.institute,
            hscScore: hscDetails.percentage === "—" ? "" : hscDetails.percentage.replace('%', ''),
            ugCollege: ugDetails.institute === "—" ? "" : ugDetails.institute,
            ugScore: ugDetails.percentage === "—" ? "" : ugDetails.percentage.replace('%', ''),
        });
        setIsEditOpen(true);
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError("");
        try {
            const updates = {
                firstName: editForm.firstName,
                lastName: editForm.lastName,
                phone: editForm.phoneNumber,
                dateOfBirth: editForm.dateOfBirth,
                nationality: editForm.nationality,
                studyDestination: editForm.studyDestination,

                family: {
                    ...userData?.family,
                    fatherName: editForm.fatherName,
                    motherName: editForm.motherName,
                },

                coApplicant: {
                    ...userData?.coApplicant,
                    name: editForm.coappName,
                    relation: editForm.coappRelation,
                    monthlyIncome: editForm.coappIncome,
                },

                academic: {
                    ...userData?.academic,
                    ssc: { institute: editForm.sscSchool, percentage: editForm.sscScore },
                    hsc: { institute: editForm.hscCollege, percentage: editForm.hscScore },
                    ug: { institute: editForm.ugCollege, percentage: editForm.ugScore },
                },

                parents: [
                    { relation: 'father', name: editForm.fatherName, aadharNumber: editForm.fatherAadhar, panNumber: editForm.fatherPan },
                    { relation: 'mother', name: editForm.motherName, aadharNumber: editForm.motherAadhar, panNumber: editForm.motherPan },
                    { relation: 'coapplicant', name: editForm.coappName, aadharNumber: editForm.coappAadhar, panNumber: editForm.coappPan }
                ]
            };

            await documentApi.updateProfile(userData.id, updates);
            await refreshData();
            setIsEditOpen(false);
        } catch (err: any) {
            console.error("Failed to update profile:", err);
            setSubmitError(err.message || "Failed to update profile");
        } finally {
            setIsSubmitting(false);
        }
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
                    <div className="flex justify-between items-center gap-4">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <span className="material-symbols-outlined text-indigo-600">person</span>
                            Student Profile - Personal & Academic Details
                        </h2>
                        <button
                            onClick={handleOpenEdit}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md hover:shadow-indigo-500/10 active:scale-95 border-0"
                        >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                            Edit
                        </button>
                    </div>

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

                        {/* Family & Co-applicant Details unified table view */}
                        {(() => {
                            const fatherName = fatherData?.name || getParentName("father");
                            const motherName = motherData?.name || getParentName("mother");

                            const coApp1Name = getCoApplicantName(1);
                             const coApp2Name = getCoApplicantName(2);
                            const coApp3Name = getCoApplicantName(3);

                            return (
                                <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden font-sans">
                                    <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Family & Co-Applicant Details</h3>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs">Role</th>
                                                    <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs">Name</th>
                                                    <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider text-xs">KYC Details</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                {/* Father */}
                                                <tr className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">Father</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-slate-700">{fatherName}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                                                        <div className="mb-1 text-slate-500">Aadhaar: <span className={fatherData?.aadharNumber ? "text-slate-700 font-medium" : "text-slate-400 font-normal"}>{fatherData?.aadharNumber || "—"}</span></div>
                                                        <div className="text-slate-500">PAN: <span className={fatherData?.panNumber ? "text-slate-700 font-medium" : "text-slate-400 font-normal"}>{fatherData?.panNumber || "—"}</span></div>
                                                    </td>
                                                </tr>

                                                {/* Mother */}
                                                <tr className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">Mother</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-slate-700">{motherName}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                                                        <div className="mb-1 text-slate-500">Aadhaar: <span className={motherData?.aadharNumber ? "text-slate-700 font-medium" : "text-slate-400 font-normal"}>{motherData?.aadharNumber || "—"}</span></div>
                                                        <div className="text-slate-500">PAN: <span className={motherData?.panNumber ? "text-slate-700 font-medium" : "text-slate-400 font-normal"}>{motherData?.panNumber || "—"}</span></div>
                                                    </td>
                                                </tr>

                                                {/* Primary Co-Applicant */}
                                                <tr className="bg-indigo-50/30 hover:bg-indigo-50/60 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-indigo-700">Primary Co-Applicant</td>
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{coApp1Name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                                                        <div className="mb-1 text-slate-500">Aadhaar: <span className={coapplicantData?.aadharNumber ? "text-slate-700 font-medium" : "text-slate-400 font-normal"}>{coapplicantData?.aadharNumber || "—"}</span></div>
                                                        <div className="text-slate-500">PAN: <span className={coapplicantData?.panNumber ? "text-slate-700 font-medium" : "text-slate-400 font-normal"}>{coapplicantData?.panNumber || "—"}</span></div>
                                                    </td>
                                                </tr>

                                                {/* Co-Applicant 2 */}
                                                <tr className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">Co-Applicant 2</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-slate-700">{coApp2Name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                                                        <div className="mb-1">Aadhaar: <span className="text-slate-400">—</span></div>
                                                        <div>PAN: <span className="text-slate-400">—</span></div>
                                                    </td>
                                                </tr>

                                                {/* Co-Applicant 3 */}
                                                <tr className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">Co-Applicant 3</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-slate-700">{coApp3Name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                                                        <div className="mb-1">Aadhaar: <span className="text-slate-400">—</span></div>
                                                        <div>PAN: <span className="text-slate-400">—</span></div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Academic Details Card */}
                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-4">Academic Details</h3>
                            <div className="space-y-4">
                                {/* SSC */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">10th Standard / SSC</label>
                                        <span className="text-sm font-medium text-slate-700 block mt-1">{sscDetails.institute}</span>
                                    </div>
                                    <div className="sm:text-right bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-1.5 self-start sm:self-auto font-mono text-xs text-slate-500">
                                        <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400 block sm:inline mr-1">Percentage:</span>
                                        {sscDetails.percentage}
                                    </div>
                                </div>
                                {/* HSC */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Intermediate / 12th / HSC</label>
                                        <span className="text-sm font-medium text-slate-700 block mt-1">{hscDetails.institute}</span>
                                    </div>
                                    <div className="sm:text-right bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-1.5 self-start sm:self-auto font-mono text-xs text-slate-500">
                                        <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400 block sm:inline mr-1">Percentage:</span>
                                        {hscDetails.percentage}
                                    </div>
                                </div>
                                {/* Graduation */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Graduation / Bachelors Degree</label>
                                        <span className="text-sm font-medium text-slate-700 block mt-1">{ugDetails.institute}</span>
                                    </div>
                                    <div className="sm:text-right bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-1.5 self-start sm:self-auto font-mono text-xs text-slate-500">
                                        <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400 block sm:inline mr-1">Percentage/CGPA:</span>
                                        {ugDetails.percentage}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Utility Panel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6 h-fit">
                {/* EVV Analysis Score Card */}
                <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 p-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">EVV Analysis Score Card</h4>
                        {/* Period selector tabs */}
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                            {([3, 6, 12] as const).map(m => (
                                <button
                                    key={m}
                                    onClick={() => setEvvPeriod(m)}
                                    className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider transition-all ${evvPeriod === m
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {m}M
                                </button>
                            ))}
                        </div>
                    </div>
                    {activeApp && getEvvMetrics() ? (() => {
                        const metrics = getEvvMetrics()!;
                        // Scale metrics by period: 3M = last quarter (higher), 12M = full year (baseline)
                        const periodFactor = evvPeriod === 3 ? 1.15 : evvPeriod === 6 ? 1.05 : 0.95;
                        const periodAvg = Math.round(metrics.averageBalance * periodFactor);
                        const periodMin = Math.round(metrics.minimumBalance * periodFactor);
                        const periodMax = Math.round(metrics.maximumBalance * periodFactor);

                        // Recalculate EVV score for the selected period
                        const stabilityRatio = periodAvg > 0 ? Math.min(1, periodMin / periodAvg) : 0;
                        const balanceScore = Math.min(60, (periodAvg / 50000) * 60);
                        const stabilityScore = stabilityRatio * 40;
                        const periodEvvScore = Math.min(100, Math.round(balanceScore + stabilityScore));

                        const risk = periodEvvScore >= 75 ? "LOW" : periodEvvScore < 45 ? "HIGH" : "MEDIUM";
                        const riskColor = risk === "LOW"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : risk === "MEDIUM"
                                ? "bg-amber-50 text-amber-700 border-amber-100"
                                : "bg-rose-50 text-rose-700 border-rose-100";

                        const eligibleAmount = Math.round((periodAvg * evvPeriod * 0.40) / 50000) * 50000;
                        const periodRec = eligibleAmount > 0
                            ? `Eligible up to ₹${(eligibleAmount / 100000).toFixed(1)} Lakhs`
                            : "Manual Review Required";

                        return (
                            <div className="space-y-3.5">
                                {/* Period label */}
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center">
                                    {evvPeriod === 3 ? 'Last 3 Months' : evvPeriod === 6 ? 'Last 6 Months' : 'Last 12 Months'} Analysis
                                </div>

                                {/* Key Stats grid */}
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-white p-2 rounded-xl border border-slate-100 text-center shadow-sm">
                                        <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Average Bal</span>
                                        <span className="block text-[11px] font-black text-slate-800 mt-0.5">₹{periodAvg.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="bg-white p-2 rounded-xl border border-slate-100 text-center shadow-sm">
                                        <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Max Bal</span>
                                        <span className="block text-[11px] font-black text-slate-800 mt-0.5">₹{periodMax.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="bg-white p-2 rounded-xl border border-slate-100 text-center shadow-sm">
                                        <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Min Bal</span>
                                        <span className="block text-[11px] font-black text-slate-800 mt-0.5">₹{periodMin.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>

                                {/* Score & Risk */}
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">EVV Score</span>
                                        <span className="text-sm font-black text-[#6605c7]">{periodEvvScore}/100</span>
                                    </div>
                                    <div className={`px-4 py-3 rounded-xl border text-center shadow-sm font-black text-xs min-w-[70px] ${riskColor}`}>
                                        {risk}
                                    </div>
                                </div>

                                {/* EVV score bar */}
                                <div className="bg-white rounded-xl border border-slate-100 p-2.5 shadow-sm">
                                    <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase mb-1.5">
                                        <span>EVV Progress</span>
                                        <span>{periodEvvScore}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${risk === 'LOW' ? 'bg-emerald-500' : risk === 'MEDIUM' ? 'bg-amber-500' : 'bg-rose-500'
                                                }`}
                                            style={{ width: `${periodEvvScore}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Recommendation Banner */}
                                <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/50 rounded-xl text-center shadow-sm">
                                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Recommendation</span>
                                    <span className="block text-xs font-bold text-indigo-900 mt-0.5">{periodRec}</span>
                                </div>
                            </div>
                        );
                    })() : (
                        <div className="p-4 bg-white/60 border border-slate-200/50 rounded-xl text-center text-xs text-slate-400">
                            <span className="material-symbols-outlined text-[20px] block mb-1">query_stats</span>
                            Pending statement analysis
                        </div>
                    )}
                </div>

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

            {isEditOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative">
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Edit Profile Details</h3>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono mt-0.5">Modify student records</p>
                            </div>
                            <button
                                onClick={() => setIsEditOpen(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors border-0 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-slate-100 px-6 bg-slate-50/30">
                            {[
                                { id: 'student', label: 'Student Info' },
                                { id: 'parents', label: 'Parents' },
                                { id: 'coapplicant', label: 'Co-Applicant' },
                                { id: 'academic', label: 'Academic' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveEditTab(tab.id as any)}
                                    className={`py-3.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer border-0 ${activeEditTab === tab.id
                                            ? 'border-indigo-600 text-indigo-600 bg-transparent'
                                            : 'border-transparent text-slate-400 hover:text-slate-600 bg-transparent'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSaveEdit} className="flex-1 flex flex-col overflow-hidden">
                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {submitError && (
                                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold">
                                        {submitError}
                                    </div>
                                )}

                                {activeEditTab === 'student' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">First Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={editForm.firstName}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Name</label>
                                            <input
                                                type="text"
                                                value={editForm.lastName}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                                            <input
                                                type="email"
                                                required
                                                disabled
                                                value={editForm.email}
                                                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
                                            <input
                                                type="text"
                                                value={editForm.phoneNumber}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date of Birth</label>
                                            <input
                                                type="date"
                                                value={editForm.dateOfBirth}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nationality</label>
                                            <input
                                                type="text"
                                                value={editForm.nationality}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, nationality: e.target.value }))}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Destination Country</label>
                                            <input
                                                type="text"
                                                value={editForm.studyDestination}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, studyDestination: e.target.value }))}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeEditTab === 'parents' && (
                                    <div className="space-y-6">
                                        {/* Father details */}
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                                            <h4 className="text-xs font-bold text-slate-700">Father Details</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.fatherName}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, fatherName: e.target.value }))}
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Aadhaar Number</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.fatherAadhar}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, fatherAadhar: e.target.value }))}
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">PAN Number</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.fatherPan}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, fatherPan: e.target.value }))}
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono uppercase focus:outline-none focus:border-indigo-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mother details */}
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                                            <h4 className="text-xs font-bold text-slate-700">Mother Details</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.motherName}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, motherName: e.target.value }))}
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Aadhaar Number</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.motherAadhar}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, motherAadhar: e.target.value }))}
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">PAN Number</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.motherPan}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, motherPan: e.target.value }))}
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono uppercase focus:outline-none focus:border-indigo-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeEditTab === 'coapplicant' && (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-4">
                                        <h4 className="text-xs font-bold text-slate-700">Primary Co-Applicant</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                                                <input
                                                    type="text"
                                                    value={editForm.coappName}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, coappName: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Relation</label>
                                                <input
                                                    type="text"
                                                    value={editForm.coappRelation}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, coappRelation: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-350 focus:outline-none focus:border-indigo-500"
                                                    placeholder="e.g. father, mother, uncle"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Income (₹/year)</label>
                                                <input
                                                    type="number"
                                                    value={editForm.coappIncome}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, coappIncome: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                                                />
                                            </div>
                                            <div />
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Aadhaar Number</label>
                                                <input
                                                    type="text"
                                                    value={editForm.coappAadhar}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, coappAadhar: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">PAN Number</label>
                                                <input
                                                    type="text"
                                                    value={editForm.coappPan}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, coappPan: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 font-mono uppercase focus:outline-none focus:border-indigo-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeEditTab === 'academic' && (
                                    <div className="space-y-4">
                                        {/* SSC */}
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                                            <h4 className="text-xs font-bold text-slate-700">10th Standard / SSC</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className="sm:col-span-2">
                                                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">School / Institution</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.sscSchool}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, sscSchool: e.target.value }))}
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Percentage / GPA</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.sscScore}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, sscScore: e.target.value }))}
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* HSC */}
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                                            <h4 className="text-xs font-bold text-slate-700">Intermediate / 12th / HSC</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className="sm:col-span-2">
                                                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">College / Institution</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.hscCollege}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, hscCollege: e.target.value }))}
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Percentage / GPA</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.hscScore}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, hscScore: e.target.value }))}
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* UG */}
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                                            <h4 className="text-xs font-bold text-slate-700">Graduation / Bachelors</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className="sm:col-span-2">
                                                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">College / University</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.ugCollege}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, ugCollege: e.target.value }))}
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Percentage / CGPA</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.ugScore}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, ugScore: e.target.value }))}
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsEditOpen(false)}
                                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer bg-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-indigo-500/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-0 cursor-pointer flex items-center gap-1.5"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[16px]">save</span>
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
