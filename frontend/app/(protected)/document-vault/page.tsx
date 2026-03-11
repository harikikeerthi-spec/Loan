"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi, documentApi } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import DigilockerConsentModal from "@/components/DigilockerConsentModal";

const STUDENT_DOCS = [
    { type: "pan_student", label: "Student PAN Card", icon: "badge" },
    { type: "aadhar_student", label: "Student Aadhar Card", icon: "fingerprint" },
    { type: "passport", label: "Passport Copy", icon: "travel_explore" },
    { type: "marksheet_10th", label: "10th Marksheet", icon: "school" },
    { type: "marksheet_12th", label: "12th Marksheet", icon: "school" },
    { type: "marksheet_degree", label: "Degree Marksheet", icon: "history_edu" },
    { type: "test_score", label: "Test Score Card (GRE/IELTS)", icon: "analytics" },
    { type: "offer_letter", label: "University Offer Letter", icon: "mail" },
];

const COAPP_SALARIED_DOCS = [
    { type: "pan_coapp", label: "Co-app PAN Card", icon: "credit_card" },
    { type: "aadhar_coapp", label: "Co-app Aadhar Card", icon: "badge" },
    { type: "electricity_bill", label: "Latest Electricity Bill", icon: "receipt_long" },
    { type: "salary_slip", label: "Last 3 Months Salary Slips", icon: "payments" },
    { type: "bank_statement_salary", label: "6 Months Bank Statement", icon: "account_balance" },
    { type: "itr_salaried", label: "1 Year Form 16 / ITR", icon: "description" },
];

const COAPP_SELF_EMPLOYED_DOCS = [
    { type: "pan_coapp", label: "Co-app PAN Card", icon: "credit_card" },
    { type: "aadhar_coapp", label: "Co-app Aadhar Card", icon: "badge" },
    { type: "electricity_bill", label: "Latest Electricity Bill", icon: "receipt_long" },
    { type: "itr_self_employed", label: "2 Years ITR with Computation", icon: "description" },
    { type: "balance_sheet", label: "Balance Sheet & P&L", icon: "monitoring" },
    { type: "business_proof", label: "Business Proof (GST/Reg)", icon: "store" },
    { type: "bank_statement_business", label: "1 Year Bank Statement", icon: "account_balance" },
];

const PARENT_DOCS = [
    { type: "pan_father", label: "Father PAN Card", icon: "badge" },
    { type: "aadhar_father", label: "Father Aadhar Card", icon: "badge" },
    { type: "pan_mother", label: "Mother PAN Card", icon: "badge" },
    { type: "aadhar_mother", label: "Mother Aadhar Card", icon: "badge" },
];

export default function DocumentVaultPage() {
    const { user } = useAuth();
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);
    const [profileType, setProfileType] = useState<"salaried" | "self-employed">("salaried");
    const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
    const [rejections, setRejections] = useState<Record<string, string>>({});
    const [showConsentModal, setShowConsentModal] = useState(false);

    const loadDocs = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const res = await authApi.getDashboardData(user.id) as any;
            if (res.success) {
                setDocs(res.data.documents || []);
            }
        } catch (e) {
            console.error(e);
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
            alert(message || "DigiLocker verification successful!");
            // Remove query params from URL
            window.history.replaceState({}, document.title, window.location.pathname);
            loadDocs();
        } else if (status === 'error') {
            alert(message || "DigiLocker verification failed.");
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [loadDocs]);

    const triggerFileInput = (docType: string) => {
        const input = document.getElementById(`file-input-${docType}`) as HTMLInputElement;
        if (input) input.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
        const file = e.target.files?.[0];
        if (!file || !user?.id) return;

        setUploading(docType);
        try {
            // Create a preview URL for the local file
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrls(prev => ({ ...prev, [docType]: objectUrl }));

            // Upload the actual file to server using FormData
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', user.id);
            formData.append('docType', docType);

            const token = localStorage.getItem("accessToken");

            const response = await fetch(`/api/documents/upload`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            await loadDocs();

            const key = `dashboardDataUpdated_${user.id}`;
            localStorage.setItem(key, String(Date.now()));
            window.dispatchEvent(new Event('dashboard-data-changed'));

        } catch (e) {
            console.error(e);
        } finally {
            setUploading(null);
        }
    };

    const handleDigilockerVerify = async (docType: string) => {
        if (!user?.id) return;
        // Redirect to backend authorize endpoint — DigiLocker handles mobile OTP login
        window.location.href = `/api/digilocker/authorize?userId=${encodeURIComponent(user.id)}&docType=${encodeURIComponent(docType)}`;
    };

    const handleSyncFromDigilocker = async (docType: string) => {
        if (!user?.id) return;
        setUploading(docType);
        try {
            const result: any = await documentApi.syncFromDigilocker(user.id, docType);
            if (result.success) {
                alert("Successfully synced from DigiLocker!");
                await loadDocs();
            } else {
                alert(result.message || "Failed to sync document.");
            }
        } catch (e) {
            console.error(e);
            alert("An error occurred during sync.");
        } finally {
            setUploading(null);
        }
    };

    const handleView = (docType: string) => {
        // Check if document exists in database with a file path
        const existing = docs.find(d => d.docType === docType);
        if (existing?.uploaded && user?.id) {
            // Use relative path through the Next.js proxy
            const viewUrl = `/api/documents/view/${user.id}/${docType}`;
            window.open(viewUrl, '_blank');
        } else {
            alert("Document file not available.");
        }
    };

    const handleDelete = async (docType: string) => {
        if (!user?.id) return;
        if (!confirm("Are you sure you want to delete this document from the vault?")) return;

        setUploading(docType);
        try {
            await documentApi.delete(user.id, docType);
            await loadDocs();
            alert("Document deleted successfully.");
        } catch (e) {
            console.error(e);
            alert("Failed to delete document.");
        } finally {
            setUploading(null);
        }
    };

    const coappDocs = profileType === "salaried" ? COAPP_SALARIED_DOCS : COAPP_SELF_EMPLOYED_DOCS;
    const allRequiredDocs = [...STUDENT_DOCS, ...coappDocs, ...PARENT_DOCS];
    const uploadedCount = docs.filter(d => d.uploaded).length;

    const renderDocGroup = (title: string, icon: string, docList: any[]) => (
        <div className="mb-10">
            <h2 className="text-[13px] font-bold mb-5 flex items-center gap-2 text-gray-900 uppercase tracking-wider">
                <div className="w-8 h-8 rounded-lg bg-[#6605c7]/[0.05] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px] text-[#6605c7]">{icon}</span>
                </div>
                {title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {docList.map((req) => {
                    const existing = docs.find(d => d.docType === req.type);
                    const isUploaded = existing?.uploaded || existing?.status === 'uploaded';

                    return (
                        <div key={req.type} className={`bg-white rounded-xl p-5 border transition-all duration-200 ${isUploaded ? 'border-emerald-100 bg-emerald-50/10' : 'border-gray-100'
                            }`}>
                            <div className="flex justify-between items-start mb-5">
                                <div className={`w-10 h-10 ${isUploaded ? 'bg-emerald-100 text-emerald-600' : 'bg-[#6605c7]/[0.03] text-[#6605c7]'} rounded-xl flex items-center justify-center transition-colors`}>
                                    <span className="material-symbols-outlined text-[20px]">{req.icon}</span>
                                </div>
                                {isUploaded && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500 text-white rounded-md text-[9px] font-bold uppercase tracking-wider">
                                        <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                        Verified
                                    </div>
                                )}
                            </div>

                            <h3 className="text-[13px] font-bold text-gray-900 mb-1">{req.label}</h3>
                            <p className="text-[11px] text-gray-500 mb-4">
                                {isUploaded ? "Document successfully stored in vault" : "Click to upload your original document"}
                            </p>

                            {rejections[req.type] && (
                                <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-100 flex gap-2">
                                    <span className="material-symbols-outlined text-red-500 text-[14px] shrink-0">info</span>
                                    <p className="text-[10px] text-red-600 leading-relaxed font-medium">{rejections[req.type]}</p>
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
                                    <button
                                        onClick={() => handleDelete(req.type)}
                                        disabled={!!uploading}
                                        className="w-9 h-9 bg-red-50 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-100 transition-all border border-red-100"
                                        title="Delete Document"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {/* Found in DigiLocker - Highest Priority */}
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
                                            {/* DigiLocker Flow - First Priority */}
                                            {([
                                                'pan_student', 'pan_coapp', 'aadhar_student', 'aadhar_coapp',
                                                'marksheet_10th', 'marksheet_12th', 'passport',
                                                'pan_father', 'pan_mother', 'aadhar_father', 'aadhar_mother'
                                            ].includes(req.type)) && !isUploaded && (
                                                    <div className="relative">
                                                        <div className="absolute -top-2 -right-1 z-10">
                                                            <span className="bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm border border-white uppercase tracking-tighter animate-bounce">
                                                                Priority 1
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDigilockerVerify(req.type)}
                                                            disabled={!!uploading}
                                                            className="w-full py-2.5 bg-emerald-600 text-white text-[11px] font-bold rounded-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 border border-emerald-500/20"
                                                        >
                                                            <img src="https://upload.wikimedia.org/wikipedia/en/1/1d/DigiLocker_logo.png" alt="DigiLocker" className="h-4 w-auto brightness-0 invert" />
                                                            Fetch from DigiLocker
                                                        </button>
                                                    </div>
                                                )}

                                            {/* Manual Upload - Second Priority */}
                                            <button
                                                onClick={() => triggerFileInput(req.type)}
                                                disabled={!!uploading}
                                                className={`w-full py-2.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${([
                                                    'pan_student', 'pan_coapp', 'aadhar_student', 'aadhar_coapp',
                                                    'marksheet_10th', 'marksheet_12th', 'passport',
                                                    'pan_father', 'pan_mother', 'aadhar_father', 'aadhar_mother'
                                                ].includes(req.type))
                                                    ? 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                                                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {uploading === req.type ? (
                                                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                                                ) : (
                                                    <span className="material-symbols-outlined text-[16px]">upload</span>
                                                )}
                                                {uploading === req.type ? "Processing..." : ([
                                                    'pan_student', 'pan_coapp', 'aadhar_student', 'aadhar_coapp',
                                                    'marksheet_10th', 'marksheet_12th', 'passport',
                                                    'pan_father', 'pan_mother', 'aadhar_father', 'aadhar_mother'
                                                ].includes(req.type)) ? "Upload Manually (Priority 2)" : "Upload to Vault"}
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

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-sm hover:border-gray-200 transition-all">
                            <span className="material-symbols-outlined text-gray-500 text-[20px]">arrow_back</span>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Document Vault</h1>
                            <p className="text-gray-500 text-[13px]">Securely store and manage your loan documents</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Profile Toggle */}
                        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                            <button
                                onClick={() => setProfileType("salaried")}
                                className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${profileType === "salaried" ? "bg-white text-[#6605c7] shadow-sm border border-gray-100" : "text-gray-500"}`}
                            >
                                Salaried Case
                            </button>
                            <button
                                onClick={() => setProfileType("self-employed")}
                                className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${profileType === "self-employed" ? "bg-white text-[#6605c7] shadow-sm border border-gray-100" : "text-gray-500"}`}
                            >
                                Self-Employed
                            </button>
                        </div>

                        {/* Bulk Sync - First Priority */}
                        <div className="flex gap-3">
                            <div className="relative">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-max">
                                    <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg border-2 border-white uppercase tracking-wider animate-bounce">
                                        Recommended
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDigilockerVerify('ALL_SYNC')}
                                    className="px-6 py-2.5 bg-emerald-600 text-white border border-emerald-500 rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center gap-2 group shadow-xl shadow-emerald-600/20 active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-[18px] group-hover:rotate-180 transition-transform duration-700">sync</span>
                                    Instant Sync
                                </button>
                            </div>

                            <button
                                onClick={() => {
                                    console.log("Select & Fetch clicked, user:", user);
                                    if (!user?.id) {
                                        alert("You must be logged in. Please refresh the page or login again.");
                                        return;
                                    }
                                    setShowConsentModal(true);
                                }}
                                className="px-6 py-2.5 bg-[#004791] text-white border border-[#003670] rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-[#003670] transition-all flex items-center gap-2 group shadow-xl shadow-blue-900/20 active:scale-95"
                            >
                                <span className="material-symbols-outlined text-[18px]">checklist</span>
                                Select & Fetch
                            </button>
                        </div>

                        <div className="flex items-center gap-3 p-2 px-3 bg-[#6605c7]/[0.02] rounded-xl border border-[#6605c7]/[0.05]">
                            <div className="w-7 h-7 bg-[#6605c7] text-white rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <span className="material-symbols-outlined text-[14px]">verified</span>
                            </div>
                            <div className="text-[13px] font-bold text-gray-900 tracking-tight">
                                {uploadedCount} / {allRequiredDocs.length} Docs
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-40 bg-gray-50 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        {renderDocGroup("Student Documents", "person", STUDENT_DOCS)}
                        {renderDocGroup(`Financial Co-Applicant (${profileType === "salaried" ? "Salaried" : "Self-Employed"})`, "account_balance", coappDocs)}
                        {renderDocGroup("Father & Mother Documents", "family_restroom", PARENT_DOCS)}
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
        </div>
    );
}
