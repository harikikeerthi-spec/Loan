"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi, documentApi, onboardingApi } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import DigilockerConsentModal from "@/components/DigilockerConsentModal";
import AlertModal from "@/components/AlertModal";
import { getDocumentRequirementName, getProfileDocumentRequirements } from "@/lib/documentRequirements";

export default function DocumentVaultPage() {
    const { user, refreshUser } = useAuth();
    const [docs, setDocs] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);
    const [profileType, setProfileType] = useState<"salaried" | "self-employed">("salaried");
    const [coappRelation, setCoappRelation] = useState<"father" | "mother">("father");
    const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
    const [rejections, setRejections] = useState<Record<string, string>>({});
    const [showConsentModal, setShowConsentModal] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [alertState, setAlertState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: "success" | "error" | "info" | "warning";
    }>({
        isOpen: false,
        title: "",
        message: "",
        type: "info",
    });

    const showAlert = (title: string, message: string, type: "success" | "error" | "info" | "warning" = "info") => {
        setAlertState({
            isOpen: true,
            title,
            message,
            type,
        });
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    const loadDocs = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await authApi.getDashboardData(user.id) as any;
            if (res.success) {
                setDocs(res.data.documents || []);
                setProfile(res.data.user || null);

                // Keep the salaried vs self-employed toggle in sync with the database
                const baseProfile = res.data.user || {};
                const coapp = baseProfile.coApplicant || {};
                const empType = coapp.employmentType || baseProfile.coApplicantEmploymentType || "";
                if (empType === "employed") {
                    setProfileType("salaried");
                } else if (empType.startsWith("self_employed")) {
                    setProfileType("self-employed");
                }

                // Sync co-applicant relation toggle
                const relation = coapp.relation || baseProfile.coApplicantRelation || "father";
                if (relation === "mother") {
                    setCoappRelation("mother");
                } else {
                    setCoappRelation("father");
                }
            }
        } catch (e) {
            console.error("Error loading vault data:", e);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        loadDocs();
    }, [loadDocs]);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const status = searchParams.get('status');
        const message = searchParams.get('message');

        if (status === 'success') {
            showAlert("Verification Success", message || "DigiLocker verification successful!", "success");
            window.history.replaceState({}, document.title, window.location.pathname);
            loadDocs();
        } else if (status === 'error') {
            showAlert("Verification Failed", message || "DigiLocker verification failed.", "error");
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [loadDocs]);

    const handleProfileTypeChange = async (type: "salaried" | "self-employed") => {
        setProfileType(type);
        if (!user?.id) return;

        // Merge this selection into the current user profile
        const baseProfile = profile || user || {};
        const coapp = baseProfile.coApplicant || {};
        const updatedCoApplicant = {
            ...coapp,
            employmentType: type === "salaried" ? "employed" : "self_employed_business",
            // Fallback name if co-applicant name isn't filled in yet
            name: coapp.name || baseProfile.coApplicantName || "Co-applicant"
        };

        const updatedProfile = {
            ...baseProfile,
            coApplicant: updatedCoApplicant
        };

        setProfile(updatedProfile);

        try {
            console.log("[VAULT] Syncing coapplicant employment type toggle to DB:", type);
            await onboardingApi.submit(updatedProfile);

            // Dispatch dynamic update event
            const key = `dashboardDataUpdated_${user.id}`;
            localStorage.setItem(key, String(Date.now()));
            window.dispatchEvent(new Event('dashboard-data-changed'));
        } catch (err) {
            console.error("Failed to persist coapplicant type toggle to database:", err);
        }
    };

    const handleCoappRelationChange = async (relation: "father" | "mother") => {
        setCoappRelation(relation);
        if (!user?.id) return;

        const baseProfile = profile || user || {};
        const coapp = baseProfile.coApplicant || {};
        const updatedCoApplicant = {
            ...coapp,
            relation: relation,
            name: relation === "father" ? (baseProfile.family?.fatherName || "Father") : (baseProfile.family?.motherName || "Mother")
        };

        const updatedProfile = {
            ...baseProfile,
            coApplicant: updatedCoApplicant
        };

        setProfile(updatedProfile);

        try {
            console.log("[VAULT] Syncing coapplicant relation toggle to DB:", relation);
            await onboardingApi.submit(updatedProfile);

            // Dispatch dynamic update event
            const key = `dashboardDataUpdated_${user.id}`;
            localStorage.setItem(key, String(Date.now()));
            window.dispatchEvent(new Event('dashboard-data-changed'));
        } catch (err) {
            console.error("Failed to persist coapplicant relation toggle to database:", err);
        }
    };

    const getActiveProfile = () => {
        const baseProfile = profile || user || {};

        // Ensure family details have defaults if not present so parent documents are shown
        const family = baseProfile.family || baseProfile.familyDetails || {};
        const fatherName = family.fatherName || baseProfile.fatherName || "Father";
        const motherName = family.motherName || baseProfile.motherName || "Mother";
        const fatherEmploymentType = family.fatherEmploymentType || baseProfile.fatherEmploymentType || "employed";
        const motherEmploymentType = family.motherEmploymentType || baseProfile.motherEmploymentType || "employed";

        // Ensure coApplicant has a default name and matches coappRelation
        const coapp = baseProfile.coApplicant || {};
        const coappName = coapp.name || baseProfile.coApplicantName || "Co-applicant";

        return {
            ...baseProfile,
            family: {
                ...family,
                fatherName,
                motherName,
                fatherEmploymentType,
                motherEmploymentType
            },
            coApplicant: {
                ...coapp,
                name: coappName,
                relation: coappRelation,
                employmentType: coapp.employmentType || "employed"
            }
        };
    };

    const getDocIcon = (type: string) => {
        const t = type.toLowerCase();
        if (t.includes("passport")) return "travel_explore";
        if (t.includes("aadhar") || t.includes("national_id")) return "fingerprint";
        if (t.includes("pan")) return "credit_card";
        if (t.includes("marksheet") || t.includes("transcript") || t.includes("degree")) return "school";
        if (t.includes("test") || t.includes("score")) return "analytics";
        if (t.includes("offer") || t.includes("letter") || t.includes("cv") || t.includes("resume")) return "description";
        if (t.includes("salary") || t.includes("slip")) return "payments";
        if (t.includes("bank") || t.includes("statement")) return "account_balance";
        if (t.includes("itr") || t.includes("tax")) return "receipt_long";
        if (t.includes("business") || t.includes("license") || t.includes("udyam")) return "store";
        if (t.includes("balance") || t.includes("sheet") || t.includes("monitoring")) return "monitoring";
        if (t.includes("bill") || t.includes("electricity")) return "receipt_long";
        return "description";
    };

    const triggerFileInput = (docType: string) => {
        const input = document.getElementById(`file-input-${docType}`) as HTMLInputElement;
        if (input) input.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, docType: string, docName?: string) => {
        const file = e.target.files?.[0];
        if (!file || !user?.id) {
            showAlert("Information Missing", "File or user information is missing.", "warning");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showAlert("File Too Large", "File size exceeds the 5MB limit.", "warning");
            return;
        }

        const validFileTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!validFileTypes.includes(file.type)) {
            showAlert("Invalid File Type", "File must be JPG, PNG, or PDF format.", "warning");
            return;
        }

        setUploading(docType);
        try {
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrls(prev => ({ ...prev, [docType]: objectUrl }));

            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', user.id);
            formData.append('docType', docType);
            if (docName) {
                formData.append('docName', docName);
            } else {
                const existing = docs.find(d => d.docType === docType);
                const name = existing?.docName || existing?.verificationMetadata?.docName;
                if (name) {
                    formData.append('docName', name);
                }
            }

            const token = localStorage.getItem("accessToken");

            console.log("Starting file upload for docType:", docType, "file:", file.name, "size:", file.size);

            const response = await fetch(`/api/documents/upload`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData
            });

            console.log("Upload response status:", response.status, response.statusText);

            if (!response.ok) {
                let errorMessage = `Server error: ${response.status} ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    } else if (errorData.error) {
                        errorMessage = errorData.error;
                    }
                } catch (parseError) {
                    try {
                        const text = await response.text();
                        if (text) errorMessage = text;
                    } catch (textError) { }
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log("Upload successful:", result);

            await loadDocs();

            const key = `dashboardDataUpdated_${user.id}`;
            localStorage.setItem(key, String(Date.now()));
            window.dispatchEvent(new Event('dashboard-data-changed'));
            showAlert("Upload Success", "Document uploaded successfully!", "success");

        } catch (e: any) {
            console.error("Upload error:", e.message || e);
            showAlert("Upload Failed", e.message || "Unknown error occurred.", "error");
        } finally {
            setUploading(null);
        }
    };

    const handleDigilockerVerify = async (docType: string) => {
        if (!user?.id) {
            showAlert("User Identity Missing", "User identity not found. Please refresh the page.", "error");
            refreshUser();
            return;
        }
        window.location.href = `/api/digilocker/authorize?userId=${encodeURIComponent(user.id)}&docType=${encodeURIComponent(docType)}`;
    };

    const handleSyncFromDigilocker = async (docType: string) => {
        if (!user?.id) return;
        setUploading(docType);
        try {
            const result: any = await documentApi.syncFromDigilocker(user.id, docType);
            if (result.success) {
                showAlert("Sync Success", "Successfully synced from DigiLocker!", "success");
                await loadDocs();
            } else {
                showAlert("Sync Failed", result.message || "Failed to sync document.", "error");
            }
        } catch (e) {
            console.error(e);
            showAlert("Sync Error", "An error occurred during sync.", "error");
        } finally {
            setUploading(null);
        }
    };

    const handleView = (docType: string) => {
        const existing = docs.find(d => d.docType === docType);
        if (existing?.uploaded && user?.id) {
            const viewUrl = `/api/documents/view/${user.id}/${docType}`;
            window.open(viewUrl, '_blank');
        } else {
            showAlert("Document Unavailable", "Document file is not available.", "warning");
        }
    };

    const handleDelete = async (docType: string) => {
        if (!user?.id) return;
        if (!confirm("Are you sure you want to delete this document from the vault?")) return;

        setUploading(docType);
        try {
            await documentApi.delete(user.id, docType);
            await loadDocs();
            showAlert("Delete Success", "Document deleted successfully.", "success");
        } catch (e) {
            console.error(e);
            showAlert("Delete Failed", "Failed to delete document.", "error");
        } finally {
            setUploading(null);
        }
    };

    const handleAddOtherDocument = async (category: "student" | "coapplicant" | "parent") => {
        const docName = prompt("Enter the name of the document you want to add:");
        if (!docName || !docName.trim()) return;

        // Generate safe unique key
        const sanitized = docName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').trim();
        const docType = `${category}_other_${sanitized}_${Date.now()}`;

        // Dynamic file input
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".pdf,.jpg,.jpeg,.png";
        
        fileInput.onchange = async (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file || !user?.id) return;

            if (file.size > 5 * 1024 * 1024) {
                showAlert("File Too Large", "File size exceeds the 5MB limit.", "warning");
                return;
            }

            const validFileTypes = ['image/jpeg', 'image/png', 'application/pdf'];
            if (!validFileTypes.includes(file.type)) {
                showAlert("Invalid File Type", "File must be JPG, PNG, or PDF format.", "warning");
                return;
            }

            setUploading(docType);
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('userId', user.id);
                formData.append('docType', docType);
                formData.append('docName', docName.trim());

                const token = localStorage.getItem("accessToken");

                const response = await fetch(`/api/documents/upload`, {
                    method: 'POST',
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    body: formData
                });

                if (!response.ok) {
                    let errorMessage = `Server error: ${response.status}`;
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorData.error || errorMessage;
                    } catch {}
                    throw new Error(errorMessage);
                }

                showAlert("Upload Success", `${docName.trim()} uploaded successfully!`, "success");
                await loadDocs();

                const key = `dashboardDataUpdated_${user.id}`;
                localStorage.setItem(key, String(Date.now()));
                window.dispatchEvent(new Event('dashboard-data-changed'));
            } catch (e: any) {
                console.error("Upload error:", e.message || e);
                showAlert("Upload Failed", e.message || "Unknown error occurred.", "error");
            } finally {
                setUploading(null);
            }
        };

        fileInput.click();
    };

    // Dynamically calculate requirements
    const activeProfile = getActiveProfile();
    const allRequiredDocs = getProfileDocumentRequirements(activeProfile);

    // Merge standard requirements with dynamically uploaded custom documents
    const studentDocs = [
        ...allRequiredDocs.filter(req =>
            !req.type.startsWith('coapplicant_') &&
            !req.type.startsWith('father_') &&
            !req.type.startsWith('mother_') &&
            !req.type.startsWith('parent_')
        ).map(req => ({
            type: req.type,
            label: req.label,
            icon: getDocIcon(req.type)
        })),
        ...docs.filter(doc => doc?.docType && (doc.docType.startsWith('student_other_') || doc.docType.startsWith('other_student_')) && !allRequiredDocs.some(req => req.type === doc.docType))
            .map(doc => ({
                type: doc.docType,
                label: doc.docName || doc.verificationMetadata?.docName || doc.docType.replace(/^(student_other_|other_student_)/, '').replace(/_/g, ' '),
                icon: "description"
            }))
    ];

    const coappDocs = [
        ...allRequiredDocs.filter(req =>
            req.type.startsWith('coapplicant_')
        ).map(req => ({
            type: req.type,
            label: req.label,
            icon: getDocIcon(req.type)
        })),
        ...docs.filter(doc => doc?.docType && (doc.docType.startsWith('coapplicant_other_') || doc.docType.startsWith('other_coapplicant_')) && !allRequiredDocs.some(req => req.type === doc.docType))
            .map(doc => ({
                type: doc.docType,
                label: doc.docName || doc.verificationMetadata?.docName || doc.docType.replace(/^(coapplicant_other_|other_coapplicant_)/, '').replace(/_/g, ' '),
                icon: "description"
            }))
    ];

    const parentDocs = [
        ...allRequiredDocs.filter(req =>
            req.type.startsWith('father_') ||
            req.type.startsWith('mother_') ||
            req.type.startsWith('parent_')
        ).map(req => ({
            type: req.type,
            label: req.label,
            icon: getDocIcon(req.type)
        })),
        ...docs.filter(doc => doc?.docType && (doc.docType.startsWith('parent_other_') || doc.docType.startsWith('other_parent_')) && !allRequiredDocs.some(req => req.type === doc.docType))
            .map(doc => ({
                type: doc.docType,
                label: doc.docName || doc.verificationMetadata?.docName || doc.docType.replace(/^(parent_other_|other_parent_)/, '').replace(/_/g, ' '),
                icon: "description"
            }))
    ];

    const staffRequestedDocs = docs
        .filter((doc) => 
            doc?.docType && 
            !allRequiredDocs.some((req) => req.type === doc.docType) &&
            !doc.docType.startsWith('student_other_') && !doc.docType.startsWith('other_student_') &&
            !doc.docType.startsWith('coapplicant_other_') && !doc.docType.startsWith('other_coapplicant_') &&
            !doc.docType.startsWith('parent_other_') && !doc.docType.startsWith('other_parent_')
        )
        .map((doc) => ({
            type: doc.docType,
            label: getDocumentRequirementName(doc.docType, doc.docName || doc.verificationMetadata?.docName || doc.docType, activeProfile),
            icon: "description",
        }));

    const uploadedCount = docs.filter(d => d.uploaded).length;

    const renderDocGroup = (title: string, icon: string, docList: any[], onAddOther?: () => void) => (
        <div className="mb-10">
            <div className="flex justify-between items-center mb-5">
                <h2 className="text-[13px] font-bold flex items-center gap-2 text-gray-900 uppercase tracking-wider">
                    <div className="w-8 h-8 rounded-lg bg-[#6605c7]/[0.05] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px] text-[#6605c7]">{icon}</span>
                    </div>
                    {title}
                </h2>
                {onAddOther && (
                    <button
                        onClick={onAddOther}
                        className="px-4 py-2 bg-[#6605c7] hover:bg-[#5504a6] text-white text-[11px] font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm shadow-purple-500/10 active:scale-95 animate-fade-in"
                    >
                        <span className="material-symbols-outlined text-[16px]">add_circle</span>
                        Add Other Documents
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {docList.map((req) => {
                    const existing = docs.find(d => d.docType === req.type);
                    const isVerified = existing?.status === 'verified';
                    const isRejected = existing?.status === 'rejected';
                    const isPending = existing?.status === 'uploaded' || existing?.status === 'pending';
                    const isUploaded = isVerified || isPending;

                    return (
                        <div key={req.type} className={`bg-white rounded-xl p-5 border transition-all duration-200 ${isVerified ? 'border-emerald-100 bg-emerald-50/10' :
                            isRejected ? 'border-rose-100 bg-rose-50/5' :
                                isPending ? 'border-amber-100 bg-amber-50/5' :
                                    'border-gray-100'
                            }`}>
                            <div className="flex justify-between items-start mb-5">
                                <div className={`w-10 h-10 ${isVerified ? 'bg-emerald-100 text-emerald-600' :
                                    isRejected ? 'bg-rose-100 text-rose-600' :
                                        isPending ? 'bg-amber-100 text-[#d97706]' :
                                            'bg-[#6605c7]/[0.03] text-[#6605c7]'
                                    } rounded-xl flex items-center justify-center transition-colors`}>
                                    <span className="material-symbols-outlined text-[20px]">{req.icon}</span>
                                </div>
                                {isVerified && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500 text-white rounded-md text-[9px] font-bold uppercase tracking-wider">
                                        <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                        Verified
                                    </div>
                                )}
                                {isRejected && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500 text-white rounded-md text-[9px] font-bold uppercase tracking-wider">
                                        <span className="material-symbols-outlined text-[12px]">cancel</span>
                                        Rejected
                                    </div>
                                )}
                                {isPending && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500 text-white rounded-md text-[9px] font-bold uppercase tracking-wider">
                                        <span className="material-symbols-outlined text-[12px]">hourglass_empty</span>
                                        Pending Review
                                    </div>
                                )}
                            </div>

                            <h3 className="text-[13px] font-bold text-gray-900 mb-1">{req.label}</h3>
                            <p className="text-[11px] text-gray-500 mb-4">
                                {isVerified ? "Document successfully verified and locked" :
                                    isPending ? "Document uploaded, awaiting staff review" :
                                        isRejected ? "Verification failed - please upload a new copy" :
                                            "Click to upload your original document"}
                            </p>

                            {isRejected && (
                                <div className="mb-4 p-3 bg-rose-50 rounded-lg border border-rose-100 flex gap-2">
                                    <span className="material-symbols-outlined text-rose-500 text-[14px] shrink-0 mt-0.5">info</span>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-wider text-rose-600 mb-0.5">Rejection Reason</p>
                                        <p className="text-[10px] text-rose-700 leading-normal font-medium">{existing?.verificationMetadata?.rejectionReason || existing?.rejectionReason || "Please upload a clearer document."}</p>
                                    </div>
                                </div>
                            )}


                            <input
                                id={`file-input-${req.type}`}
                                type="file"
                                className="hidden"
                                onChange={(e) => handleFileChange(e, req.type)}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />

                             {isUploaded ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleView(req.type)}
                                        className="flex-1 py-2 bg-gray-50 text-gray-700 text-[11px] font-bold rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2 border border-gray-100"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">visibility</span> View
                                    </button>
                                    {!isVerified && (
                                        <button
                                            onClick={() => handleDelete(req.type)}
                                            disabled={!!uploading}
                                            className="w-9 h-9 bg-red-50 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-100 transition-all border border-red-100"
                                            title="Delete Document"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">delete</span>
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {existing?.status === 'available_in_digilocker' && !isUploaded ? (
                                        <div className="relative">
                                            <div className="absolute -top-2 -right-1 z-10">
                                                <span className="bg-[#6605c7] text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm border border-white uppercase tracking-tighter animate-pulse">
                                                    Found!
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleSyncFromDigilocker(req.type)}
                                                disabled={!!uploading}
                                                className="w-full py-2.5 bg-[#6605c7] text-white text-[11px] font-bold rounded-lg hover:bg-[#5504a6] transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 border border-[#6605c7]/20"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">sync_alt</span>
                                                Sync to Vault
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {/* {([
                                                'pan', 'coapplicant_pan', 'national_id', 'coapplicant_aadhar',
                                                'marksheet_10', 'marksheet_12', 'passport',
                                                'father_pan', 'mother_pan', 'father_aadhar', 'mother_aadhar'
                                            ].includes(req.type)) && !isUploaded && (
                                                    <Link
                                                        href={`/document-vault/digilocker?docType=${req.type}`}
                                                        className="w-full py-2.5 bg-emerald-600 text-white text-[11px] font-bold rounded-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 border border-emerald-500/20"
                                                    >
                                                        <img src="https://upload.wikimedia.org/wikipedia/en/1/1d/DigiLocker_logo.png" alt="DigiLocker" className="h-4 w-auto brightness-0 invert" />
                                                        Upload from DigiLocker
                                                    </Link>
                                                )} */}

                                            <button
                                                onClick={() => triggerFileInput(req.type)}
                                                disabled={!!uploading}
                                                className={`w-full py-2.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${([
                                                    'pan', 'coapplicant_pan', 'national_id', 'coapplicant_aadhar',
                                                    'marksheet_10', 'marksheet_12', 'passport',
                                                    'father_pan', 'mother_pan', 'father_aadhar', 'mother_aadhar'
                                                ].includes(req.type))
                                                    ? 'bg-gray-50 text-black-500 border border-gray-200 hover:bg-gray-100'
                                                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {uploading === req.type ? (
                                                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                                                ) : (
                                                    <span className="material-symbols-outlined text-[16px]">upload</span>
                                                )}
                                                {uploading === req.type ? "Processing..." : ([
                                                    'pan', 'coapplicant_pan', 'national_id', 'coapplicant_aadhar',
                                                    'marksheet_10', 'marksheet_12', 'passport',
                                                    'father_pan', 'mother_pan', 'father_aadhar', 'mother_aadhar'
                                                ].includes(req.type)) ? "Upload Manually" : "Upload to Vault"}
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-transparent">
            <Navbar />
            <div className="max-w-6xl mx-auto px-6 pt-30 pb-16">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm hover:border-gray-200 transition-all">
                            <span className="material-symbols-outlined text-gray-400 text-[20px]">arrow_back</span>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Document Vault</h1>
                            <p className="text-gray-500 text-[13px] font-medium">Securely store and manage your loan documents</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                            <button
                                onClick={() => handleCoappRelationChange("father")}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${coappRelation === "father" ? "bg-white text-[#6605c7] shadow-sm border border-gray-100" : "text-gray-400 hover:text-gray-600"}`}
                            >
                                Co-app: Father
                            </button>
                            <button
                                onClick={() => handleCoappRelationChange("mother")}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${coappRelation === "mother" ? "bg-white text-[#6605c7] shadow-sm border border-gray-100" : "text-gray-400 hover:text-gray-600"}`}
                            >
                                Co-app: Mother
                            </button>
                        </div>

                        <div className="flex items-center gap-3 p-2.5 px-4 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                            <div className="w-8 h-8 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <span className="material-symbols-outlined text-[16px] font-black">verified</span>
                            </div>
                            <div className="text-[13px] font-black text-emerald-700 tracking-tight">
                                {uploadedCount} / {allRequiredDocs.length + staffRequestedDocs.length} Verified
                            </div>
                        </div>
                    </div>
                </div>

                {/* <div className="mb-12">
                    <div className="bg-gradient-to-br from-[#004791] to-[#0b84ff] rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-900/30 rounded-full blur-3xl" />

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="max-w-xl">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] mb-4 border border-white/10 backdrop-blur-md">
                                    <span className="material-symbols-outlined text-[14px]">bolt</span>
                                    Instant Import
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black mb-3">One-Click Document Upload</h2>
                                <p className="text-white/70 text-[13px] font-medium leading-relaxed">
                                    Link your DigiLocker account to instantly fetch and verify your identity documents. 
                                    Faster processing, zero paperwork, and maximum security.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                                <Link
                                    href="/document-vault/digilocker"
                                    className="px-8 py-4 bg-white text-[#004791] rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/10 active:scale-95 border border-blue-200"
                                >
                                    <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                                    Open DigiLocker Portal
                                </Link>
                                <button
                                    onClick={() => handleDigilockerVerify('ALL_SYNC')}
                                    className="px-8 py-4 bg-emerald-500 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/10 active:scale-95 group"
                                >
                                    <span className="material-symbols-outlined text-[20px] group-hover:rotate-180 transition-transform duration-700">sync</span>
                                    Instant Sync
                                </button>
                            </div>
                        </div>
                    </div>
                </div> */}

                {docs.some(d => d.status === 'available_in_digilocker' && !d.uploaded) && (
                    <div className="mb-12 bg-gray-50/50 rounded-[32px] p-8 border border-dashed border-gray-200">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                                    <span className="material-symbols-outlined text-emerald-600">folder_zip</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900">Fetched from DigiLocker</h2>
                                    <p className="text-gray-500 text-[11px] font-medium uppercase tracking-widest">Select documents to sync with your vault</p>
                                </div>
                            </div>
                            <button
                                onClick={loadDocs}
                                className="w-10 h-10 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#6605c7] hover:border-[#6605c7] transition-all"
                                title="Refresh"
                            >
                                <span className="material-symbols-outlined text-[18px]">refresh</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {docs.filter(d => d.status === 'available_in_digilocker' && !d.uploaded).map(d => {
                                const req = allRequiredDocs.find(rd => rd.type === d.docType);
                                return (
                                    <div key={d.id || d.docType} className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm flex flex-col items-center text-center group hover:shadow-md transition-all">
                                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-emerald-500">{getDocIcon(d.docType)}</span>
                                        </div>
                                        <h3 className="text-[13px] font-bold text-gray-900 mb-1 line-clamp-1">{req?.label || d.docType}</h3>
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[8px] font-black uppercase tracking-tighter mb-4">
                                            <span className="material-symbols-outlined text-[10px]">verified</span>
                                            Verified Source
                                        </div>
                                        <button
                                            onClick={() => handleSyncFromDigilocker(d.docType)}
                                            disabled={!!uploading}
                                            className="w-full py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            {uploading === d.docType ? (
                                                <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>
                                            ) : (
                                                <span className="material-symbols-outlined text-[14px]">sync</span>
                                            )}
                                            {uploading === d.docType ? "Syncing..." : "Sync to Vault"}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-40 bg-gray-50 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        {renderDocGroup("Student Documents", "person", studentDocs, () => handleAddOtherDocument("student"))}
                        {renderDocGroup("Financial Co-Applicant", "account_balance", coappDocs, () => handleAddOtherDocument("coapplicant"))}
                        {renderDocGroup("Father & Mother Documents", "family_restroom", parentDocs, () => handleAddOtherDocument("parent"))}
                        {staffRequestedDocs.length > 0 && renderDocGroup("Staff Requested Documents", "assignment", staffRequestedDocs)}
                    </>
                )}

                <div className="mt-12 bg-[#1a1a2e] rounded-xl p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <span className="material-symbols-outlined text-9xl">shield_lock</span>
                    </div>
                    <div className="relative z-10 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-4 border border-white/5">
                            <span className="material-symbols-outlined text-[14px] text-emerald-400">lock</span>
                            Security Choice
                        </div>
                        <h2 className="text-xl font-bold mb-4">Privacy & Data Protection</h2>
                        <p className="text-gray-400 text-[13px] leading-relaxed mb-6">
                            Your documents are encrypted using AES-256 military-grade encryption before being stored.
                            Only authorized bank officials can access them during your application review process.
                            We never share your personal data with third parties.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-bold uppercase tracking-wider">
                                <span className="material-symbols-outlined text-emerald-400 text-[16px]">verified_user</span> 256-bit SSL
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-bold uppercase tracking-wider">
                                <span className="material-symbols-outlined text-emerald-400 text-[16px]">verified_user</span> GDPR Compliant
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-bold uppercase tracking-wider">
                                <span className="material-symbols-outlined text-emerald-400 text-[16px]">verified_user</span> ISO 27001
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showConsentModal && user?.id && (
                <DigilockerConsentModal
                    userId={user.id}
                    onClose={() => setShowConsentModal(false)}
                />
            )}
            <AlertModal
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
            />
        </div>
    );
}
