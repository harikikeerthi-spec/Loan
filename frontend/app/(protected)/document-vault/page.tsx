"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Link from "next/link";

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

    const triggerFileInput = (docType: string) => {
        const input = document.getElementById(`file-input-${docType}`) as HTMLInputElement;
        if (input) input.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
        const file = e.target.files?.[0];
        if (!file || !user?.id) return;

        setUploading(docType);
        try {
            // Create a preview URL for the local file (to simulate viewing "uploaded" file)
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrls(prev => ({ ...prev, [docType]: objectUrl }));

            // Simulate upload with metadata
            await authApi.uploadDocument({
                userId: user.id,
                docType,
                uploaded: true,
                filePath: `uploads/${user.id}/${docType}_${file.name}`
            });
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

    const handleView = (docType: string) => {
        const url = previewUrls[docType];
        if (url) {
            window.open(url, '_blank');
        } else {
            alert("This document was already uploaded. Viewing of previously uploaded documents is coming soon.");
        }
    };

    const coappDocs = profileType === "salaried" ? COAPP_SALARIED_DOCS : COAPP_SELF_EMPLOYED_DOCS;
    const allRequiredDocs = [...STUDENT_DOCS, ...coappDocs, ...PARENT_DOCS];
    const uploadedCount = docs.filter(d => d.uploaded).length;

    const renderDocGroup = (title: string, icon: string, docList: any[]) => (
        <div className="mb-12">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#6605c7]">{icon}</span>
                {title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {docList.map((req) => {
                    const existing = docs.find(d => d.docType === req.type);
                    const isUploaded = existing?.uploaded || existing?.status === 'uploaded';

                    return (
                        <div key={req.type} className={`bg-white rounded-3xl p-6 border transition-all duration-300 ${isUploaded ? 'border-green-100 shadow-sm' : 'border-gray-100 hover:shadow-xl hover:-translate-y-1'
                            }`}>
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-14 h-14 ${isUploaded ? 'bg-green-100 text-green-600' : 'bg-purple-50 text-[#6605c7]'} rounded-2xl flex items-center justify-center transition-colors`}>
                                    <span className="material-symbols-outlined text-2xl">{req.icon}</span>
                                </div>
                                {isUploaded && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                        Verified
                                    </div>
                                )}
                            </div>

                            <h3 className="text-sm font-bold text-gray-900 mb-1">{req.label}</h3>
                            <p className="text-[10px] text-gray-400 mb-6">
                                {isUploaded ? "Document successfully stored in vault" : "Click to upload your original document"}
                            </p>

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
                                        className="flex-1 py-2.5 bg-gray-50 text-gray-700 text-[10px] font-bold rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-lg">visibility</span> View
                                    </button>
                                    <button
                                        onClick={() => triggerFileInput(req.type)}
                                        disabled={!!uploading}
                                        className="w-10 h-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all"
                                        title="Re-upload"
                                    >
                                        <span className="material-symbols-outlined text-lg">sync</span>
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => triggerFileInput(req.type)}
                                    disabled={!!uploading}
                                    className="w-full py-3 bg-[#6605c7] text-white text-[11px] font-bold rounded-xl hover:bg-[#7a0de8] hover:shadow-lg hover:shadow-purple-500/20 shadow-sm transition-all flex items-center justify-center gap-2"
                                >
                                    {uploading === req.type ? (
                                        <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-lg">upload</span>
                                    )}
                                    {uploading === req.type ? "Encrypting..." : "Upload to Vault"}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-transparent">
            <Navbar />
            <div className="max-w-6xl mx-auto px-6 pt-28 pb-16">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm hover:shadow-md transition-all">
                            <span className="material-symbols-outlined text-gray-600">arrow_back</span>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold font-display">Document Vault</h1>
                            <p className="text-gray-500 text-sm">Securely store and manage your loan documents</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Profile Toggle */}
                        <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
                            <button
                                onClick={() => setProfileType("salaried")}
                                className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase transition-all ${profileType === "salaried" ? "bg-white text-[#6605c7] shadow-sm" : "text-gray-500"}`}
                            >
                                Salaried Case
                            </button>
                            <button
                                onClick={() => setProfileType("self-employed")}
                                className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase transition-all ${profileType === "self-employed" ? "bg-white text-[#6605c7] shadow-sm" : "text-gray-500"}`}
                            >
                                Self-Employed
                            </button>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-2xl border border-purple-100">
                            <div className="w-8 h-8 bg-[#6605c7] text-white rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-sm font-bold">verified</span>
                            </div>
                            <div className="text-sm font-bold text-gray-900">
                                {uploadedCount} / {allRequiredDocs.length} Docs
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-48 bg-gray-50 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        {renderDocGroup("Student Documents", "person", STUDENT_DOCS)}
                        {renderDocGroup(`Financial Co-Applicant (${profileType === "salaried" ? "Salaried" : "Self-Employed"})`, "account_balance", coappDocs)}
                        {renderDocGroup("Father & Mother Documents", "family_restroom", PARENT_DOCS)}
                    </>
                )}

                <div className="mt-12 bg-gradient-to-br from-indigo-900 to-[#1a1a2e] rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-20">
                        <span className="material-symbols-outlined text-9xl">shield_lock</span>
                    </div>
                    <div className="relative z-10 max-w-2xl">
                        <h2 className="text-2xl font-bold mb-4">Privacy & Security Choice</h2>
                        <p className="text-indigo-100 text-sm leading-relaxed mb-6">
                            Your documents are encrypted using AES-256 military-grade encryption before being stored.
                            Only authorized bank officials can access them during your application review process.
                            We never share your personal data with third parties.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl border border-white/10 text-xs font-bold">
                                <span className="material-symbols-outlined text-green-400 text-sm">verified_user</span> 256-bit SSL
                            </div>
                            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl border border-white/10 text-xs font-bold">
                                <span className="material-symbols-outlined text-green-400 text-sm">verified_user</span> GDPR Compliant
                            </div>
                            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl border border-white/10 text-xs font-bold">
                                <span className="material-symbols-outlined text-green-400 text-sm">verified_user</span> ISO 27001
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
