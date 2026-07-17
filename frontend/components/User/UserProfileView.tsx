"use client";

import { useState, useEffect } from "react";
import { authApi, documentApi } from "@/lib/api";
import DatePicker from "@/components/DatePicker";
import { formatPhone, isPhoneValid } from "@/lib/validation";

interface UserProfileViewProps {
    user: any;
    data: any;
    firstApp: any;
    refreshUser: () => Promise<any>;
    loadData: () => Promise<any>;
}

export default function UserProfileView({
    user,
    data,
    firstApp,
    refreshUser,
    loadData
}: UserProfileViewProps) {
    const baseProfile = data?.profile || user || {};
    let familyObj = baseProfile.family;
    if (typeof familyObj === 'string') {
        try { familyObj = JSON.parse(familyObj); } catch { familyObj = {}; }
    }
    let coappObj = baseProfile.coApplicant;
    if (typeof coappObj === 'string') {
        try { coappObj = JSON.parse(coappObj); } catch { coappObj = {}; }
    }
    const activeProfile = {
        ...baseProfile,
        family: familyObj || {},
        coApplicant: coappObj || {}
    };

    const parentsList = activeProfile.parents || [];
    const fatherData = parentsList.find((p: any) => p.relation === 'father');
    const motherData = parentsList.find((p: any) => p.relation === 'mother');
    const coapplicantData = parentsList.find((p: any) => p.relation === 'coapplicant');

    const userDocs = data?.documents || [];
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

    const getAcademicDetails = (doc: any) => {
        const inst = getExtractedField(doc, 'institution') || getExtractedField(doc, 'university') || getExtractedField(doc, 'school_name') || getExtractedField(doc, 'college_name');
        const pct = getExtractedField(doc, 'score') || getExtractedField(doc, 'percentage') || getExtractedField(doc, 'gpa') || getExtractedField(doc, 'cgpa');
        return { institute: inst || "—", percentage: pct ? `${pct}%` : "—" };
    };

    const sscDetails = getAcademicDetails(sscDoc);
    const hscDetails = getAcademicDetails(hscDoc);
    const ugDetails = getAcademicDetails(ugDoc);

    const displayUserId = user?.id || "";

    const profileCompleteness = (() => {
        let count = 0;
        if (user?.id) count += 1;
        if (user?.firstName) count += 1;
        if (user?.lastName) count += 1;
        if (user?.phoneNumber) count += 1;
        if (user?.dateOfBirth) count += 1;
        return count * 20;
    })();

    const formatDob = (dobStr?: string) => {
        if (!dobStr) return null;
        try {
            const date = new Date(dobStr);
            if (isNaN(date.getTime())) return dobStr;
            return date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });
        } catch {
            return dobStr;
        }
    };

    // States
    const [editingCard, setEditingCard] = useState<string | null>(null);
    const [savingProfile, setSavingProfile] = useState(false);
    const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

    const [personalForm, setPersonalForm] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        dateOfBirth: "",
    });

    const [familyForm, setFamilyForm] = useState({
        fatherName: "",
        fatherAadhar: "",
        fatherPan: "",
        motherName: "",
        motherAadhar: "",
        motherPan: "",
        coApplicantName: "",
        coApplicantRelation: "",
        coApplicantPhone: "",
        coApplicantIncome: "",
        coApplicantAadhar: "",
        coApplicantPan: "",
    });

    const startPersonalEdit = () => {
        setPersonalForm({
            firstName: activeProfile?.firstName || "",
            lastName: activeProfile?.lastName || "",
            phoneNumber: activeProfile?.phoneNumber || "",
            dateOfBirth: activeProfile?.dateOfBirth || "",
        });
        setEditingCard("personal");
    };

    const loadFamilyFormState = () => {
        return {
            fatherName: fatherData?.name || activeProfile?.family?.fatherName || activeProfile?.fatherName || "",
            fatherAadhar: fatherData?.aadharNumber || "",
            fatherPan: fatherData?.panNumber || "",
            motherName: motherData?.name || activeProfile?.family?.motherName || activeProfile?.motherName || "",
            motherAadhar: motherData?.aadharNumber || "",
            motherPan: motherData?.panNumber || "",
            coApplicantName: coapplicantData?.name || activeProfile?.coApplicant?.name || activeProfile?.coApplicantName || "",
            coApplicantRelation: firstApp?.coApplicantRelation || activeProfile?.coApplicant?.relation || activeProfile?.coApplicant?.relationship || activeProfile?.coApplicantRelation || "",
            coApplicantPhone: firstApp?.coApplicantPhone || activeProfile?.coApplicant?.mobile || activeProfile?.coApplicant?.phone || activeProfile?.coApplicantPhone || "",
            coApplicantIncome: firstApp?.coApplicantIncome?.toString() || activeProfile?.coApplicant?.monthlyIncome?.toString() || activeProfile?.coApplicantIncome?.toString() || "",
            coApplicantAadhar: coapplicantData?.aadharNumber || "",
            coApplicantPan: coapplicantData?.panNumber || "",
        };
    };

    const startFatherEdit = () => {
        setFamilyForm(loadFamilyFormState());
        setEditingCard("father");
    };

    const startMotherEdit = () => {
        setFamilyForm(loadFamilyFormState());
        setEditingCard("mother");
    };

    const startCoApplicantEdit = () => {
        setFamilyForm(loadFamilyFormState());
        setEditingCard("coapplicant");
    };

    const toggleSecretVisibility = (key: string) => {
        setVisibleSecrets(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSavePersonal = async () => {
        if (!user?.email) return;

        if (!personalForm.firstName || personalForm.firstName.trim().length < 3) {
            alert("First name must be at least 3 characters");
            return;
        }

        if (!personalForm.lastName || personalForm.lastName.trim().length < 1) {
            alert("Last name must be at least 1 character");
            return;
        }

        if (personalForm.phoneNumber && !isPhoneValid(personalForm.phoneNumber)) {
            alert("Please enter a valid phone number");
            return;
        }

        if (!personalForm.dateOfBirth) {
            alert("Date of birth is required");
            return;
        }

        setSavingProfile(true);
        try {
            await authApi.updateDetails(user.email, {
                firstName: personalForm.firstName,
                lastName: personalForm.lastName,
                phoneNumber: personalForm.phoneNumber,
                dateOfBirth: personalForm.dateOfBirth,
            });
            await refreshUser();
            await loadData();
            setEditingCard(null);
        } catch (e) {
            console.error(e);
            alert(e instanceof Error ? e.message : "Failed to save changes");
        } finally {
            setSavingProfile(false);
        }
    };

    const handleSaveFamily = async () => {
        if (!user?.id) return;

        setSavingProfile(true);
        try {
            await documentApi.updateProfile(user.id, {
                parents: [
                    {
                        relation: "father",
                        name: familyForm.fatherName || null,
                        aadharNumber: familyForm.fatherAadhar ? familyForm.fatherAadhar.replace(/\s+/g, '') : null,
                        panNumber: familyForm.fatherPan ? familyForm.fatherPan.toUpperCase().replace(/\s+/g, '') : null
                    },
                    {
                        relation: "mother",
                        name: familyForm.motherName || null,
                        aadharNumber: familyForm.motherAadhar ? familyForm.motherAadhar.replace(/\s+/g, '') : null,
                        panNumber: familyForm.motherPan ? familyForm.motherPan.toUpperCase().replace(/\s+/g, '') : null
                    },
                    {
                        relation: "coapplicant",
                        name: familyForm.coApplicantName || null,
                        aadharNumber: familyForm.coApplicantAadhar ? familyForm.coApplicantAadhar.replace(/\s+/g, '') : null,
                        panNumber: familyForm.coApplicantPan ? familyForm.coApplicantPan.toUpperCase().replace(/\s+/g, '') : null
                    }
                ],
                coApplicant: {
                    name: familyForm.coApplicantName || null,
                    relation: familyForm.coApplicantRelation || null,
                    mobile: familyForm.coApplicantPhone ? familyForm.coApplicantPhone.replace(/\s+/g, '') : null,
                    monthlyIncome: familyForm.coApplicantIncome ? parseFloat(familyForm.coApplicantIncome) : null
                }
            });
            await refreshUser();
            await loadData();
            setEditingCard(null);
        } catch (e) {
            console.error(e);
            alert(e instanceof Error ? e.message : "Failed to save changes");
        } finally {
            setSavingProfile(false);
        }
    };

    const formatAadhar = (val?: string, visible?: boolean) => {
        if (!val || val === "—") return null;
        const cleaned = val.replace(/\s+/g, '');
        if (visible) return val;
        if (cleaned.length >= 12) {
            return `XXXX-XXXX-${cleaned.slice(-4)}`;
        }
        return `XXXX-XXXX-${val.slice(-4)}`;
    };

    const formatPan = (val?: string, visible?: boolean) => {
        if (!val || val === "—") return null;
        const cleaned = val.replace(/\s+/g, '');
        if (visible) return val;
        if (cleaned.length >= 10) {
            return `${cleaned.slice(0, 5)}•••${cleaned.slice(-2)}`;
        }
        return `••••••${val.slice(-4)}`;
    };

    const renderBentoField = (
        label: string,
        val: any,
        onEditClick: () => void,
        type: "text" | "aadhar" | "pan" = "text",
        secretKey?: string
    ) => {
        const isEmpty = !val || val === "—" || val === "";
        const displayVal = isEmpty ? "Click to add info" : val;

        if (type === "aadhar" || type === "pan") {
            if (isEmpty) {
                return (
                    <div className="mb-4 group/field relative">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</span>
                        <div
                            onClick={onEditClick}
                            className="flex items-center justify-between cursor-pointer py-1 min-h-[28px] border-b border-transparent hover:border-slate-100 transition-all"
                        >
                            <span className="text-[15px] text-slate-400 italic">Not provided</span>
                            <i className="ph ph-pencil-simple text-slate-400 opacity-0 group-hover/field:opacity-100 transition-opacity text-sm ml-2" />
                        </div>
                    </div>
                );
            }
            const isVisible = secretKey ? !!visibleSecrets[secretKey] : false;
            const formatted = type === "aadhar" ? formatAadhar(val, isVisible) : formatPan(val, isVisible);
            return (
                <div className="mb-4 group/field relative">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</span>
                    <div className="flex items-center justify-between py-1 min-h-[28px]">
                        <div className="flex items-center gap-2">
                            <span className="text-[15px] font-medium text-slate-800 font-mono">{formatted}</span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (secretKey) toggleSecretVisibility(secretKey);
                                }}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors border-0 bg-transparent flex items-center"
                            >
                                <i className={`ph ${isVisible ? 'ph-eye-slash' : 'ph-eye'} text-sm`} />
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={onEditClick}
                            className="p-1 text-slate-400 hover:text-[#6605c7] transition-colors opacity-0 group-hover/field:opacity-100 border-0 bg-transparent flex items-center cursor-pointer"
                        >
                            <i className="ph ph-pencil-simple text-sm" />
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="mb-4 group/field relative">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</span>
                <div
                    onClick={onEditClick}
                    className="flex items-center justify-between cursor-pointer py-1 min-h-[28px] border-b border-transparent hover:border-slate-100 transition-all"
                >
                    <span className={`text-[15px] font-medium leading-tight ${isEmpty ? 'text-slate-400 italic' : 'text-[#0F172A]'}`}>
                        {displayVal}
                    </span>
                    <i className="ph ph-pencil-simple text-slate-400 opacity-0 group-hover/field:opacity-100 transition-opacity text-sm ml-2" />
                </div>
            </div>
        );
    };

    const coappIncomeVal = firstApp?.coApplicantIncome 
        ? `₹${Number(firstApp.coApplicantIncome).toLocaleString('en-IN')}/yr` 
        : activeProfile?.coApplicant?.monthlyIncome 
            ? `₹${Number(activeProfile.coApplicant.monthlyIncome).toLocaleString('en-IN')}/mo` 
            : activeProfile?.coApplicantIncome 
                ? `₹${Number(activeProfile.coApplicantIncome).toLocaleString('en-IN')}/yr` 
                : null;

    const isFatherValid = !savingProfile &&
        (!familyForm.fatherAadhar || familyForm.fatherAadhar.length === 12) &&
        (!familyForm.fatherPan || familyForm.fatherPan.length === 10);

    const isMotherValid = !savingProfile &&
        (!familyForm.motherAadhar || familyForm.motherAadhar.length === 12) &&
        (!familyForm.motherPan || familyForm.motherPan.length === 10);

    const isCoappValid = !savingProfile &&
        (!familyForm.coApplicantAadhar || familyForm.coApplicantAadhar.length === 12) &&
        (!familyForm.coApplicantPan || familyForm.coApplicantPan.length === 10) &&
        (!familyForm.coApplicantPhone || isPhoneValid(familyForm.coApplicantPhone));

    return (
        <div className="profile-command-center mt-6 space-y-6">
            {/* Premium Gamified Hero Card Header */}
            <div className="bg-white rounded-[16px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        {/* Avatar with circular progress ring */}
                        <div className="relative w-[100px] h-[100px] flex items-center justify-center shrink-0">
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="44"
                                    className="stroke-slate-100"
                                    strokeWidth="5"
                                    fill="transparent"
                                />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="44"
                                    className={`transition-all duration-700 ease-out ${
                                        profileCompleteness === 100 ? "stroke-emerald-500" : "stroke-[#6605c7]"
                                    }`}
                                    strokeWidth="5"
                                    fill="transparent"
                                    strokeDasharray="276.46"
                                    strokeDashoffset={276.46 - (276.46 * profileCompleteness) / 100}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="w-[78px] h-[78px] rounded-full bg-[#0F172A] text-white text-2xl font-extrabold flex items-center justify-center relative overflow-hidden group/avatar">
                                {activeProfile?.firstName?.[0] || ""}{activeProfile?.lastName?.[0] || activeProfile?.email?.[0]?.toUpperCase() || "U"}
                                <button
                                    type="button"
                                    onClick={startPersonalEdit}
                                    className="absolute inset-0 bg-[#0F172A]/70 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-black tracking-widest uppercase transition-opacity duration-300 cursor-pointer border-0"
                                >
                                    <i className="ph ph-pencil-simple text-sm mb-0.5" />
                                    EDIT
                                </button>
                            </div>
                        </div>

                        {/* User Details */}
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">
                                    {activeProfile?.firstName && activeProfile?.lastName
                                        ? `${activeProfile.firstName} ${activeProfile.lastName}`
                                        : activeProfile?.email?.split("@")[0]}
                                </h2>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100/70 text-emerald-700 text-[10px] font-black tracking-wider uppercase">
                                    <i className="ph ph-shield-check text-xs text-emerald-600" />
                                    Verified Account
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-semibold truncate">
                                {activeProfile?.email}
                            </p>
                        </div>
                    </div>

                    {/* Gamified Setup Progress info */}
                    <div className="flex flex-col items-start md:items-end justify-center shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Profile Setup Completeness</span>
                        <div className="flex items-center gap-3">
                            <div className="w-28 bg-slate-100 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-700 ${
                                        profileCompleteness === 100 ? "bg-emerald-500" : "bg-[#6605c7]"
                                    }`}
                                    style={{ width: `${profileCompleteness}%` }}
                                />
                            </div>
                            <span className={`text-2xl font-black ${
                                profileCompleteness === 100 ? "text-emerald-500" : "text-[#0F172A]"
                            }`}>
                                {profileCompleteness}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bento Box Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                {/* Card 1: Personal Details Card (Spans 2 columns) */}
                <div className="bg-white rounded-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 p-6 md:col-span-2 relative group">
                    <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                            <i className="ph ph-user text-[#6605c7] text-lg shrink-0" />
                            Personal Details
                        </h3>
                        {editingCard !== "personal" && (
                            <button
                                type="button"
                                onClick={startPersonalEdit}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#6605c7] hover:bg-purple-50 transition-all border-0 bg-transparent cursor-pointer"
                                title="Edit Personal Details"
                            >
                                <i className="ph ph-pencil-simple text-sm" />
                            </button>
                        )}
                    </div>

                    {editingCard === "personal" ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">First Name</label>
                                    <input
                                        type="text"
                                        value={personalForm.firstName}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^A-Za-z]/g, "");
                                            setPersonalForm(p => ({ ...p, firstName: val }));
                                        }}
                                        maxLength={30}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 transition-all text-slate-700 bg-slate-50/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Last Name</label>
                                    <input
                                        type="text"
                                        value={personalForm.lastName}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^A-Za-z]/g, "");
                                            setPersonalForm(p => ({ ...p, lastName: val }));
                                        }}
                                        maxLength={30}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 transition-all text-slate-700 bg-slate-50/50"
                                    />
                                </div>
                                <div>
                                    <DatePicker
                                        label="Date of Birth"
                                        value={personalForm.dateOfBirth}
                                        onChange={(val: string) => setPersonalForm(p => ({ ...p, dateOfBirth: val }))}
                                        placeholder="Select DOB"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={personalForm.phoneNumber}
                                        onChange={(e) => setPersonalForm(p => ({ ...p, phoneNumber: formatPhone(e.target.value) }))}
                                        maxLength={10}
                                        inputMode="numeric"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 transition-all text-slate-700 bg-slate-50/50"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingCard(null)}
                                    className="px-5 py-2 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer bg-white"
                                    disabled={savingProfile}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSavePersonal}
                                    className="px-5 py-2 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold shadow-md hover:shadow-lg hover:-translate-y-[2px] active:translate-y-0 active:shadow-md transition-all duration-300 border-0 flex items-center gap-1.5 cursor-pointer"
                                    disabled={savingProfile || !personalForm.firstName || personalForm.firstName.length < 3 || !personalForm.lastName || !personalForm.phoneNumber || !isPhoneValid(personalForm.phoneNumber)}
                                >
                                    {savingProfile ? (
                                        <>
                                            <i className="ph ph-spinner animate-spin text-sm" /> Saving...
                                        </>
                                    ) : (
                                        <>Save Changes</>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {renderBentoField("Email Address", activeProfile?.email, startPersonalEdit)}
                                {renderBentoField("Phone Number", activeProfile?.phoneNumber, startPersonalEdit)}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {renderBentoField("Date of Birth", formatDob(activeProfile?.dateOfBirth), startPersonalEdit)}
                                {renderBentoField("Nationality", activeProfile?.nationality || "Indian", startPersonalEdit)}
                                {renderBentoField("Destination Country", activeProfile?.studyDestination, startPersonalEdit)}
                            </div>
                        </div>
                    )}
                </div>

                {/* Card 2: Academic Details Card (Double height on lg screens) */}
                <div className="bg-white rounded-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 p-6 md:col-span-1 lg:row-span-2 relative">
                    <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
                        <i className="ph ph-graduation-cap text-[#6605c7] text-lg shrink-0" />
                        <h3 className="text-sm font-bold text-[#0F172A]">Academic Details</h3>
                    </div>
                    
                    <div className="space-y-4">
                        {/* 10th Standard */}
                        <div className="p-4 bg-slate-50/50 rounded-[12px] border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-[#6605c7] shrink-0">
                                    <i className="ph ph-book-open text-base" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-[#0F172A]">10th / SSC marksheets</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate">{sscDetails.institute !== "—" ? sscDetails.institute : "Institution pending"}</p>
                                </div>
                                <div className="shrink-0 text-right">
                                    {sscDetails.percentage !== "—" ? (
                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black border border-emerald-100">{sscDetails.percentage}</span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black">Missing</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 12th Standard */}
                        <div className="p-4 bg-slate-50/50 rounded-[12px] border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-[#6605c7] shrink-0">
                                    <i className="ph ph-book-bookmark text-base" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-[#0F172A]">12th / HSC marksheets</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate">{hscDetails.institute !== "—" ? hscDetails.institute : "Institution pending"}</p>
                                </div>
                                <div className="shrink-0 text-right">
                                    {hscDetails.percentage !== "—" ? (
                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black border border-emerald-100">{hscDetails.percentage}</span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black">Missing</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Graduation */}
                        <div className="p-4 bg-slate-50/50 rounded-[12px] border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-[#6605c7] shrink-0">
                                    <i className="ph ph-student text-base" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-[#0F172A]">Degree / Graduation</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate">{ugDetails.institute !== "—" ? ugDetails.institute : "Institution pending"}</p>
                                </div>
                                <div className="shrink-0 text-right">
                                    {ugDetails.percentage !== "—" ? (
                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black border border-emerald-100">{ugDetails.percentage}</span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black">Pending</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 3: Father Details Card */}
                <div className="bg-white rounded-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 p-6 md:col-span-1 relative group">
                    <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                            <i className="ph ph-gender-male text-blue-500 text-lg shrink-0" />
                            Father Details
                        </h3>
                        {editingCard !== "father" && (
                            <button
                                type="button"
                                onClick={startFatherEdit}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#6605c7] hover:bg-purple-50 transition-all border-0 bg-transparent cursor-pointer"
                                title="Edit Father Details"
                            >
                                <i className="ph ph-pencil-simple text-sm" />
                            </button>
                        )}
                    </div>

                    {editingCard === "father" ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    value={familyForm.fatherName}
                                    onChange={(e) => setFamilyForm(p => ({ ...p, fatherName: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 transition-all text-slate-700 bg-slate-50/50"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Aadhaar Number</label>
                                <input
                                    type="text"
                                    value={familyForm.fatherAadhar}
                                    onChange={(e) => setFamilyForm(p => ({ ...p, fatherAadhar: e.target.value.replace(/\D/g, '').slice(0, 12) }))}
                                    placeholder="12-digit number"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 transition-all text-slate-700 font-mono bg-slate-50/50"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">PAN Number</label>
                                <input
                                    type="text"
                                    value={familyForm.fatherPan}
                                    onChange={(e) => setFamilyForm(p => ({ ...p, fatherPan: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) }))}
                                    placeholder="10-digit PAN"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 transition-all text-slate-700 font-mono bg-slate-50/50"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingCard(null)}
                                    className="px-5 py-2 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer bg-white"
                                    disabled={savingProfile}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveFamily}
                                    className="px-5 py-2 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold shadow-md hover:shadow-lg hover:-translate-y-[2px] active:translate-y-0 active:shadow-md transition-all duration-300 border-0 flex items-center gap-1.5 cursor-pointer"
                                    disabled={!isFatherValid}
                                >
                                    {savingProfile ? (
                                        <>
                                            <i className="ph ph-spinner animate-spin text-sm" /> Saving...
                                        </>
                                    ) : (
                                        <>Save</>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {renderBentoField("Father's Full Name", fatherData?.name || activeProfile?.family?.fatherName || activeProfile?.fatherName, startFatherEdit)}
                            {renderBentoField("Aadhaar Number", fatherData?.aadharNumber, startFatherEdit, "aadhar", "father_aadhar")}
                            {renderBentoField("PAN Number", fatherData?.panNumber, startFatherEdit, "pan", "father_pan")}
                        </div>
                    )}
                </div>

                {/* Card 4: Mother Details Card */}
                <div className="bg-white rounded-[16px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 p-6 md:col-span-1 relative group">
                    <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                            <i className="ph ph-gender-female text-pink-500 text-lg shrink-0" />
                            Mother Details
                        </h3>
                        {editingCard !== "mother" && (
                            <button
                                type="button"
                                onClick={startMotherEdit}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#6605c7] hover:bg-purple-50 transition-all border-0 bg-transparent cursor-pointer"
                                title="Edit Mother Details"
                            >
                                <i className="ph ph-pencil-simple text-sm" />
                            </button>
                        )}
                    </div>

                    {editingCard === "mother" ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    value={familyForm.motherName}
                                    onChange={(e) => setFamilyForm(p => ({ ...p, motherName: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 transition-all text-slate-700 bg-slate-50/50"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Aadhaar Number</label>
                                <input
                                    type="text"
                                    value={familyForm.motherAadhar}
                                    onChange={(e) => setFamilyForm(p => ({ ...p, motherAadhar: e.target.value.replace(/\D/g, '').slice(0, 12) }))}
                                    placeholder="12-digit number"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 transition-all text-slate-700 font-mono bg-slate-50/50"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">PAN Number</label>
                                <input
                                    type="text"
                                    value={familyForm.motherPan}
                                    onChange={(e) => setFamilyForm(p => ({ ...p, motherPan: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) }))}
                                    placeholder="10-digit PAN"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 transition-all text-slate-700 font-mono bg-slate-50/50"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingCard(null)}
                                    className="px-5 py-2 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer bg-white"
                                    disabled={savingProfile}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveFamily}
                                    className="px-5 py-2 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold shadow-md hover:shadow-lg hover:-translate-y-[2px] active:translate-y-0 active:shadow-md transition-all duration-300 border-0 flex items-center gap-1.5 cursor-pointer"
                                    disabled={!isMotherValid}
                                >
                                    {savingProfile ? (
                                        <>
                                            <i className="ph ph-spinner animate-spin text-sm" /> Saving...
                                        </>
                                    ) : (
                                        <>Save</>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {renderBentoField("Mother's Full Name", motherData?.name || activeProfile?.family?.motherName || activeProfile?.motherName, startMotherEdit)}
                            {renderBentoField("Aadhaar Number", motherData?.aadharNumber, startMotherEdit, "aadhar", "mother_aadhar")}
                            {renderBentoField("PAN Number", motherData?.panNumber, startMotherEdit, "pan", "mother_pan")}
                        </div>
                    )}
                </div>

                {/* Card 5: Primary Co-Applicant Details Card (Highlighted with Gradient border) */}
                <div className="p-[1.5px] rounded-[16px] bg-gradient-to-br from-[#6605c7] via-[#8b5cf6] to-[#3b82f6] shadow-lg md:col-span-1 relative group">
                    <div className="bg-white rounded-[14.5px] p-6 h-full">
                        <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
                            <h3 className="text-sm font-black text-[#6605c7] flex items-center gap-2">
                                <i className="ph ph-shield-star text-lg shrink-0" />
                                Primary Co-Applicant Details
                            </h3>
                            {editingCard !== "coapplicant" && (
                                <button
                                    type="button"
                                    onClick={startCoApplicantEdit}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#6605c7] hover:bg-purple-50 transition-all border-0 bg-transparent cursor-pointer"
                                    title="Edit Co-Applicant Details"
                                >
                                    <i className="ph ph-pencil-simple text-sm" />
                                </button>
                            )}
                        </div>

                        {editingCard === "coapplicant" ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-[#6605c7] uppercase tracking-widest mb-1.5">Co-Applicant Name</label>
                                    <input
                                        type="text"
                                        value={familyForm.coApplicantName}
                                        onChange={(e) => setFamilyForm(p => ({ ...p, coApplicantName: e.target.value }))}
                                        className="w-full px-3 py-2 border border-[#6605c7]/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 transition-all text-slate-700 bg-slate-50/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-[#6605c7] uppercase tracking-widest mb-1.5">Co-Applicant Relation</label>
                                    <select
                                        value={familyForm.coApplicantRelation}
                                        onChange={(e) => setFamilyForm(p => ({ ...p, coApplicantRelation: e.target.value }))}
                                        className="w-full px-3 py-2 border border-[#6605c7]/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 transition-all text-slate-700 bg-white"
                                    >
                                        <option value="">Select Relation</option>
                                        <option value="Father">Father</option>
                                        <option value="Mother">Mother</option>
                                        <option value="Sibling">Sibling</option>
                                        <option value="Spouse">Spouse</option>
                                        <option value="Uncle">Uncle</option>
                                        <option value="Aunt">Aunt</option>
                                        <option value="Grandparent">Grandparent</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-[#6605c7] uppercase tracking-widest mb-1.5">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={familyForm.coApplicantPhone}
                                        onChange={(e) => setFamilyForm(p => ({ ...p, coApplicantPhone: formatPhone(e.target.value) }))}
                                        maxLength={10}
                                        className="w-full px-3 py-2 border border-[#6605c7]/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 transition-all text-slate-700 bg-slate-50/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-[#6605c7] uppercase tracking-widest mb-1.5">Monthly/Annual Income (INR)</label>
                                    <input
                                        type="number"
                                        value={familyForm.coApplicantIncome}
                                        onChange={(e) => setFamilyForm(p => ({ ...p, coApplicantIncome: e.target.value }))}
                                        placeholder="e.g. 978654"
                                        className="w-full px-3 py-2 border border-[#6605c7]/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 transition-all text-slate-700 bg-slate-50/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-[#6605c7] uppercase tracking-widest mb-1.5">Aadhaar Number</label>
                                    <input
                                        type="text"
                                        value={familyForm.coApplicantAadhar}
                                        onChange={(e) => setFamilyForm(p => ({ ...p, coApplicantAadhar: e.target.value.replace(/\D/g, '').slice(0, 12) }))}
                                        placeholder="12-digit number"
                                        className="w-full px-3 py-2 border border-[#6605c7]/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 transition-all text-slate-700 font-mono bg-slate-50/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-[#6605c7] uppercase tracking-widest mb-1.5">PAN Number</label>
                                    <input
                                        type="text"
                                        value={familyForm.coApplicantPan}
                                        onChange={(e) => setFamilyForm(p => ({ ...p, coApplicantPan: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) }))}
                                        placeholder="10-digit PAN"
                                        className="w-full px-3 py-2 border border-[#6605c7]/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 transition-all text-slate-700 font-mono bg-slate-50/50"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingCard(null)}
                                        className="px-5 py-2 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer bg-white"
                                        disabled={savingProfile}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveFamily}
                                        className="px-5 py-2 rounded-full bg-[#6605c7] hover:bg-[#5504a8] text-white text-xs font-bold shadow-md hover:shadow-lg hover:-translate-y-[2px] active:translate-y-0 active:shadow-md transition-all duration-300 border-0 flex items-center gap-1.5 cursor-pointer"
                                        disabled={!isCoappValid}
                                    >
                                        {savingProfile ? (
                                            <>
                                                <i className="ph ph-spinner animate-spin text-sm" /> Saving...
                                            </>
                                        ) : (
                                            <>Save</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {renderBentoField("Co-Applicant Name", coapplicantData?.name || activeProfile?.coApplicant?.name || activeProfile?.coApplicantName, startCoApplicantEdit)}
                                {renderBentoField("Co-Applicant Relation", firstApp?.coApplicantRelation || activeProfile?.coApplicant?.relation || activeProfile?.coApplicant?.relationship || activeProfile?.coApplicantRelation, startCoApplicantEdit)}
                                {renderBentoField("Monthly/Annual Income", coappIncomeVal, startCoApplicantEdit)}
                                {renderBentoField("Co-Applicant Phone", firstApp?.coApplicantPhone || activeProfile?.coApplicant?.mobile || activeProfile?.coApplicant?.phone || activeProfile?.coApplicantPhone, startCoApplicantEdit)}
                                {renderBentoField("Aadhaar Number", coapplicantData?.aadharNumber, startCoApplicantEdit, "aadhar", "coapp_aadhar")}
                                {renderBentoField("PAN Number", coapplicantData?.panNumber, startCoApplicantEdit, "pan", "coapp_pan")}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
