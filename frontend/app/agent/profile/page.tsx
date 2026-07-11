"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAgent } from "../AgentContext";
import { agentApi, documentApi } from "@/lib/api";

const KYC_DOC_TYPES = [
    { type: "agent_pan", label: "PAN Card" },
    { type: "agent_aadhar", label: "Aadhaar Card (Front & Back)" },
    { type: "agent_gst", label: "GST Certificate (If Applicable)" }
];

export default function AgentProfilePage() {
    const { showToast, setAgentProfile } = useAgent();
    
    // Tab State
    const [activeTab, setActiveTab] = useState<"details" | "kyc" | "bank" | "agreements" | "notifications">("details");
    
    // Profile Data State
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [bankAccount, setBankAccount] = useState({ bankName: "", accountNumber: "", ifscCode: "" });
    const [kycDocs, setKycDocs] = useState<any[]>([]);
    const [agreements, setAgreements] = useState<any[]>([]);
    
    // Form Edit States
    const [editBusinessName, setEditBusinessName] = useState("");
    const [editGstin, setEditGstin] = useState("");
    const [editBankName, setEditBankName] = useState("");
    const [editAccountNumber, setEditAccountNumber] = useState("");
    const [editIfscCode, setEditIfscCode] = useState("");
    
    // File Upload States
    const [selectedDocType, setSelectedDocType] = useState("agent_pan");
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadProfileData = async () => {
        setLoading(true);
        try {
            const [meRes, bankRes, docsRes, agreeRes] = await Promise.allSettled([
                agentApi.getMe(),
                agentApi.getBankAccount(),
                agentApi.getKycDocuments(),
                agentApi.getAgreements()
            ]);

            if (meRes.status === "fulfilled" && (meRes.value as any)?.success) {
                const meData = (meRes.value as any).data;
                setProfile(meData);
                if (setAgentProfile) setAgentProfile(meData);
                setEditBusinessName(meData.businessName || "");
                setEditGstin(meData.gstin || "");
            }

            if (bankRes.status === "fulfilled" && (bankRes.value as any)?.success) {
                const bankData = (bankRes.value as any).data;
                setBankAccount(bankData);
                setEditBankName(bankData.bankName || "");
                setEditAccountNumber(bankData.accountNumber || "");
                setEditIfscCode(bankData.ifscCode || "");
            }

            if (docsRes.status === "fulfilled" && (docsRes.value as any)?.success) {
                setKycDocs((docsRes.value as any).documents || []);
            }

            if (agreeRes.status === "fulfilled" && (agreeRes.value as any)?.success) {
                setAgreements((agreeRes.value as any).agreements || []);
            }
        } catch (e) {
            console.error("Failed to load agent profile data", e);
            showToast("Failed to sync some profile settings from server", "warning");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfileData();
    }, []);

    // Save Business Details
    const handleSaveBusiness = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editBusinessName.trim()) {
            showToast("Business name is required", "warning");
            return;
        }
        setLoading(true);
        try {
            const res = await agentApi.submitKyc({
                businessName: editBusinessName,
                gstin: editGstin
            }) as any;
            
            if (res?.success) {
                showToast("Business profile updated successfully! KYC status is now pending review.", "success");
                await loadProfileData();
            } else {
                showToast(res?.message || "Failed to update profile", "warning");
            }
        } catch (err) {
            console.error("Error saving business details:", err);
            showToast("Server error updating details. Please try again.", "warning");
        } finally {
            setLoading(false);
        }
    };

    // Save Bank Details
    const handleSaveBank = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editBankName.trim() || !editAccountNumber.trim() || !editIfscCode.trim()) {
            showToast("All bank payout details are required", "warning");
            return;
        }
        setLoading(true);
        try {
            const res = await agentApi.updateBankAccount({
                bankName: editBankName,
                accountNumber: editAccountNumber,
                ifscCode: editIfscCode
            }) as any;

            if (res?.success) {
                showToast("Payout bank settings updated successfully!", "success");
                await loadProfileData();
            } else {
                showToast(res?.message || "Failed to update bank details", "warning");
            }
        } catch (err) {
            console.error("Error updating bank details:", err);
            showToast("Server error updating bank account. Please try again.", "warning");
        } finally {
            setLoading(false);
        }
    };

    // Handle File Upload for KYC
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];

        if (!profile?.id) {
            showToast("Profile not initialized. Please reload.", "warning");
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        try {
            showToast(`Uploading ${file.name} for KYC verification...`, "info");
            const res = await documentApi.upload(profile.id, selectedDocType, file, (progress) => {
                setUploadProgress(Math.round(progress));
            }) as any;

            showToast(`KYC document ${file.name} uploaded successfully!`, "success");
            
            // Reload documents list
            const docsRes = await agentApi.getKycDocuments() as any;
            if (docsRes?.success) {
                setKycDocs(docsRes.documents || []);
            }
        } catch (err: any) {
            console.error("KYC upload failed:", err);
            showToast(err.message || "Failed to upload document", "warning");
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const triggerFileSelect = () => {
        if (uploading) return;
        fileInputRef.current?.click();
    };

    if (loading && !profile) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-36 bg-gray-150 rounded-[2.5rem]" />
                <div className="h-96 bg-gray-150 rounded-[2.5rem]" />
            </div>
        );
    }

    const kycStatusColors: Record<string, string> = {
        verified: "bg-emerald-50 text-emerald-700 border-emerald-100",
        pending: "bg-amber-50 text-amber-700 border-amber-100",
        rejected: "bg-rose-50 text-rose-700 border-rose-100",
        unverified: "bg-gray-50 text-gray-600 border-gray-150"
    };

    const tabs = [
        { id: "details" as const, label: "Business Details" },
        { id: "kyc" as const, label: "KYC Documents" },
        { id: "bank" as const, label: "Payout Bank Account" },
        { id: "agreements" as const, label: "Partnership Agreements" },
        { id: "notifications" as const, label: "Notification Preferences" }
    ];

    return (
        <div className="animate-fade-in-up space-y-8 relative z-10">
            {/* Header Summary Card */}
            <section className="p-8 rounded-[2.5rem] bg-white border border-[#6605c7]/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex gap-5 items-center">
                    <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-[#6605c7] to-[#8b24e5] text-white font-black text-2xl flex items-center justify-center shadow-lg">
                        {profile?.firstName ? profile.firstName[0] : "A"}
                    </div>
                    <div className="space-y-1 text-left">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-2xl font-black text-gray-900 font-display">{profile?.businessName || "VidyaLoan Agency"}</h2>
                            <span className={`inline-flex px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${kycStatusColors[profile?.kycStatus || "unverified"]}`}>
                                KYC: {profile?.kycStatus || "Unverified"}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                            DSA Partner: {profile?.firstName} {profile?.lastName} | Email: <strong className="text-gray-900">{profile?.email}</strong>
                        </p>
                        <p className="text-[10px] text-gray-400">
                            Partner ID: {profile?.id?.replace("VL-STU-", "VL-AGT-")} | Member Since: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "June 2026"}
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Tabs Container */}
            <section className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm space-y-8">
                {/* Tab Navigation */}
                <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                activeTab === tab.id
                                    ? "bg-[#6605c7] text-white shadow-md"
                                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content Rendering */}
                {activeTab === "details" && (
                    <form onSubmit={handleSaveBusiness} className="space-y-6 max-w-xl text-left">
                        <h3 className="font-display font-black text-lg text-gray-900 uppercase tracking-tight">Business Profile</h3>
                        <p className="text-xs text-gray-450">Provide legal entity details for commission processing and billing.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">DSA Partner Name</label>
                                <input
                                    type="text"
                                    value={`${profile?.firstName || ""} ${profile?.lastName || ""}`}
                                    disabled
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-500 cursor-not-allowed"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Contact Mobile</label>
                                <input
                                    type="text"
                                    value={profile?.phoneNumber || ""}
                                    disabled
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-500 cursor-not-allowed"
                                />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Registered Business / Agency Name *</label>
                                <input
                                    type="text"
                                    value={editBusinessName}
                                    onChange={(e) => setEditBusinessName(e.target.value)}
                                    placeholder="e.g. Krishna Enterprises"
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#6605c7]/15 transition-all"
                                    required
                                />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">GSTIN (Optional)</label>
                                <input
                                    type="text"
                                    value={editGstin}
                                    onChange={(e) => setEditGstin(e.target.value)}
                                    placeholder="e.g. 36AAAAA1111A1Z1"
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#6605c7]/15 transition-all font-mono"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-50 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3.5 bg-[#6605c7] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#6605c7]/95 transition-all shadow-sm"
                            >
                                {loading ? "Saving..." : "Save Business Details"}
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === "kyc" && (
                    <div className="space-y-8 text-left">
                        <div className="max-w-xl space-y-4">
                            <h3 className="font-display font-black text-lg text-gray-900 uppercase tracking-tight">KYC Verification Files</h3>
                            <p className="text-xs text-gray-450">Upload your government-issued documents to clear platform verification constraints.</p>
                            
                            {/* Upload widget */}
                            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col md:flex-row md:items-center gap-4">
                                <div className="space-y-1 flex-1">
                                    <label className="block text-[9px] font-bold text-gray-400 uppercase">Select KYC File Type</label>
                                    <select
                                        value={selectedDocType}
                                        onChange={(e) => setSelectedDocType(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 focus:outline-none"
                                    >
                                        {KYC_DOC_TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
                                    </select>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                />
                                <button
                                    type="button"
                                    onClick={triggerFileSelect}
                                    disabled={uploading}
                                    className="px-5 py-3 bg-[#6605c7] hover:bg-[#6605c7]/90 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 self-end"
                                >
                                    <span className="material-symbols-outlined text-sm">upload</span>
                                    {uploading ? `Uploading (${uploadProgress}%)` : "Upload KYC Document"}
                                </button>
                            </div>
                        </div>

                        {/* Upload progress bar */}
                        {uploading && (
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden animate-pulse">
                                <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                            </div>
                        )}

                        {/* KYC documents table */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Document Status Verification Checklist</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full border-separate border-spacing-y-2">
                                    <thead>
                                        <tr className="text-gray-400 text-[10px] font-black uppercase tracking-wider">
                                            <th className="px-4 py-2 text-left">Document Type</th>
                                            <th className="px-4 py-2 text-left">Uploaded File</th>
                                            <th className="px-4 py-2 text-left">Verification Status</th>
                                            <th className="px-4 py-2 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {kycDocs.length > 0 ? kycDocs.map((doc, idx) => {
                                            const match = KYC_DOC_TYPES.find(k => k.type === doc.docType);
                                            const label = match ? match.label : doc.docType.replace(/_/g, " ").toUpperCase();
                                            return (
                                                <tr key={doc.id || idx} className="bg-gray-50 rounded-xl">
                                                    <td className="px-4 py-3 rounded-l-xl font-bold text-gray-800 text-xs">{label}</td>
                                                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">{doc.filePath?.split(/[/\\]/).pop() || `${doc.docType}.pdf`}</td>
                                                    <td className="px-4 py-3 text-xs">
                                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                            doc.status === "verified"
                                                                ? "bg-emerald-50 text-emerald-700"
                                                                : doc.status === "rejected"
                                                                ? "bg-rose-50 text-rose-700"
                                                                : "bg-amber-50 text-amber-700"
                                                        }`}>
                                                            {doc.status || "pending"}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 rounded-r-xl text-right">
                                                        <button 
                                                            onClick={() => showToast(`Opening ${label} download scheme...`, "success")} 
                                                            className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-wider"
                                                        >
                                                            Download
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan={4} className="text-center py-10 text-xs text-gray-400 bg-gray-50 rounded-xl">
                                                    No KYC documents uploaded yet. Please use the widget above to upload your PAN, Aadhaar, and GST details.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "bank" && (
                    <form onSubmit={handleSaveBank} className="space-y-6 max-w-xl text-left">
                        <h3 className="font-display font-black text-lg text-gray-900 uppercase tracking-tight">Payout Bank Details</h3>
                        <p className="text-xs text-gray-450">Ensure this account belongs to the registered DSA entity. Commission payouts will be wired here monthly.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1 md:col-span-2">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Bank Partner Name *</label>
                                <input
                                    type="text"
                                    value={editBankName}
                                    onChange={(e) => setEditBankName(e.target.value)}
                                    placeholder="e.g. HDFC Bank, SBI Bank"
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#6605c7]/15 transition-all"
                                    required
                                />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Account Number *</label>
                                <input
                                    type="text"
                                    value={editAccountNumber}
                                    onChange={(e) => setEditAccountNumber(e.target.value)}
                                    placeholder="e.g. 50100012345678"
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#6605c7]/15 transition-all font-mono"
                                    required
                                />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">IFSC Code *</label>
                                <input
                                    type="text"
                                    value={editIfscCode}
                                    onChange={(e) => setEditIfscCode(e.target.value.toUpperCase())}
                                    placeholder="e.g. HDFC0000240"
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#6605c7]/15 transition-all font-mono"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-50 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3.5 bg-[#6605c7] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#6605c7]/95 transition-all shadow-sm"
                            >
                                {loading ? "Updating..." : "Update Bank Account Settings"}
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === "agreements" && (
                    <div className="space-y-6 text-left">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6605c7] block">Legal & Compliance</span>
                            <h3 className="font-display font-black text-lg text-gray-900 uppercase tracking-tight">Legal Agreements & Covenants</h3>
                            <p className="text-xs text-gray-450">Signed contracts governing your partnership with VidyaLoan DSA Network.</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-400 border-b border-gray-100 font-black uppercase tracking-wider text-[9px]">
                                        <th className="p-4">Document</th>
                                        <th className="p-4">Date Signed</th>
                                        <th className="p-4">Expiry</th>
                                        <th className="p-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
                                    {agreements.length > 0 ? agreements.map((doc: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-gray-900 font-black">{doc.name}</td>
                                            <td className="p-4 text-gray-500 font-normal">{doc.signed ? new Date(doc.signedAt).toLocaleDateString() : "Pending"}</td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                                    doc.warning ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-gray-50 text-gray-450 border border-gray-100"
                                                }`}>
                                                    {doc.expiry || "Active"}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button 
                                                    onClick={() => showToast(`Starting download for ${doc.name}...`, "success")}
                                                    className="px-3.5 py-1.5 bg-[#6605c7]/5 hover:bg-[#6605c7] hover:text-white text-[#6605c7] rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                                                >
                                                    Download
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        [
                                            { name: "Agent Agreement (Standard)", signed: "15-Jan-2025", expiry: "31-Dec-2026", action: "Download", warning: true },
                                            { name: "Commission Policy Document", signed: "01-Jun-2026", expiry: "Ongoing", action: "Download" },
                                            { name: "Code of Conduct", signed: "15-Jan-2025", expiry: "Lifetime", action: "Download" },
                                            { name: "Data Privacy & NDA", signed: "15-Jan-2025", expiry: "Lifetime", action: "Download" },
                                            { name: "TDS Consent Form", signed: "01-Apr-2025", expiry: "Annual", action: "Download" },
                                            { name: "Form 16A (2025–26)", signed: "01-Jun-2026", expiry: "—", action: "Download" }
                                        ].map((doc, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-4 text-gray-900 font-black">{doc.name}</td>
                                                <td className="p-4 text-gray-500 font-normal">{doc.signed}</td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                                        doc.warning ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-gray-50 text-gray-450 border border-gray-100"
                                                    }`}>
                                                        {doc.expiry}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button 
                                                        onClick={() => showToast(`Starting download for ${doc.name}...`, "success")}
                                                        className="px-3.5 py-1.5 bg-[#6605c7]/5 hover:bg-[#6605c7] hover:text-white text-[#6605c7] rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                                                    >
                                                        Download
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 text-amber-800 text-xs font-bold leading-relaxed flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">warning</span>
                            <span>⚠️ Agent Agreement expires in 6 months — renewal will be initiated by Admin 30 days before expiry.</span>
                        </div>
                    </div>
                )}

                {activeTab === "notifications" && (
                    <div className="space-y-6 text-left max-w-xl">
                        <h3 className="font-display font-black text-lg text-gray-900 uppercase tracking-tight">Notification Channels</h3>
                        <p className="text-xs text-gray-455">Select how and when you want to receive transaction updates and alerts.</p>
                        
                        <div className="space-y-4">
                            <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl space-y-4">
                                <h4 className="font-bold text-gray-805 text-sm">WhatsApp Alerts</h4>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 text-xs font-bold text-gray-700 cursor-pointer">
                                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#6605c7] focus:ring-[#6605c7]" />
                                        <span>Welcome Message & Onboarding (Immediate)</span>
                                    </label>
                                    <label className="flex items-center gap-3 text-xs font-bold text-gray-700 cursor-pointer">
                                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#6605c7] focus:ring-[#6605c7]" />
                                        <span>Daily SLA Breach Digest (Every morning)</span>
                                    </label>
                                    <label className="flex items-center gap-3 text-xs font-bold text-gray-700 cursor-pointer">
                                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#6605c7] focus:ring-[#6605c7]" />
                                        <span>Query Escalation Alerts (When bank flags an issue)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl space-y-4">
                                <h4 className="font-bold text-gray-850 text-sm">Email Reports</h4>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 text-xs font-bold text-gray-700 cursor-pointer">
                                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#6605c7] focus:ring-[#6605c7]" />
                                        <span>Monthly Commission Ledger & Invoices</span>
                                    </label>
                                    <label className="flex items-center gap-3 text-xs font-bold text-gray-700 cursor-pointer">
                                        <input type="checkbox" className="w-4 h-4 rounded text-[#6605c7] focus:ring-[#6605c7]" />
                                        <span>Marketing Updates & Milestones</span>
                                    </label>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl space-y-4">
                                <h4 className="font-bold text-gray-805 text-sm">SMS Gateway</h4>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 text-xs font-bold text-gray-700 cursor-pointer">
                                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#6605c7] focus:ring-[#6605c7]" />
                                        <span>Critical Bank Alerts & OTPs</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-50 flex justify-end">
                            <button
                                onClick={() => showToast("Notification settings saved successfully!", "success")}
                                className="px-6 py-3.5 bg-[#6605c7] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#6605c7]/95 transition-all shadow-sm"
                            >
                                Save Preferences
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
