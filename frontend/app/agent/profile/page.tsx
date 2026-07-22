"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAgent } from "../AgentContext";
import { agentApi, documentApi } from "@/lib/api";
import UserSupportTicketsView from "@/components/UserSupportTicketsView";

const KYC_DOC_TYPES = [
    { type: "agent_aadhar", label: "Aadhar Card" },
    { type: "agent_pan", label: "PAN Card" },
    { type: "agent_gst", label: "GST Certificate" },
    { type: "agent_business_reg", label: "Business Registration" },
    { type: "agent_agreement", label: "Agent Agreement (Signed)" }
];

export default function AgentProfilePage() {
    const { showToast, setAgentProfile, agentProfile } = useAgent();
    
    // Tab State
    const [activeTab, setActiveTab] = useState<"details" | "kyc" | "bank" | "agreements" | "support" | "notifications">("details");
    
    // Profile Data State
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const displayProfile = profile || agentProfile;
    const [bankAccount, setBankAccount] = useState({ bankName: "", accountNumber: "", ifscCode: "" });
    const [kycDocs, setKycDocs] = useState<any[]>([]);
    const [agreements, setAgreements] = useState<any[]>([]);
    
    // Form Edit States
    const [editPrimaryContact, setEditPrimaryContact] = useState("");
    const [editMobile, setEditMobile] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editOfficeAddress, setEditOfficeAddress] = useState("");
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
                
                const fullName = `${meData.firstName || ""} ${meData.lastName || ""}`.trim();
                setEditPrimaryContact(fullName || "");
                setEditMobile(meData.phoneNumber || "");
                setEditEmail(meData.email || "");
                setEditOfficeAddress(meData.officeAddress || "");
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

    // Save Contact Details
    const handleSaveContact = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await agentApi.updateContact({
                primaryContact: editPrimaryContact,
                mobile: editMobile,
                email: editEmail,
                officeAddress: editOfficeAddress
            }) as any;
            
            if (res?.success) {
                showToast("Contact details updated successfully!", "success");
                await loadProfileData();
            } else {
                showToast(res?.message || "Failed to update contact details", "warning");
            }
        } catch (err) {
            console.error("Error saving contact details:", err);
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
        { id: "support" as const, label: "Support Tickets" },
        { id: "notifications" as const, label: "Notification Preferences" }
    ];

    return (
        <div className="animate-fade-in-up space-y-8 relative z-10">
            {/* Header Summary Card */}
            <section className="p-8 rounded-[2.5rem] bg-white border border-[#6605c7]/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex gap-5 items-center">
                    <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-[#6605c7] to-[#8b24e5] text-white font-black text-2xl flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0">
                        {displayProfile?.profileImage || "/agent-logo.png" ? (
                            <img src={displayProfile?.profileImage || "/agent-logo.png"} alt="Agent Logo" className="w-full h-full object-cover" />
                        ) : (
                            displayProfile?.firstName ? displayProfile.firstName[0] : "V"
                        )}
                    </div>
                    <div className="space-y-1 text-left">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-2xl font-black text-gray-900 font-display">{displayProfile?.businessName || "VidyaLoan Agency"}</h2>
                            <span className={`inline-flex px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${kycStatusColors[displayProfile?.kycStatus || "unverified"]}`}>
                                KYC: {displayProfile?.kycStatus || "Unverified"}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                            DSA Partner: {displayProfile?.firstName} {displayProfile?.lastName} | Email: <strong className="text-gray-900">{displayProfile?.email}</strong>
                        </p>
                        <p className="text-[10px] text-gray-400">
                            Partner ID: {displayProfile?.id?.replace("VL-STU-", "VL-AGT-")} | Member Since: {displayProfile?.createdAt ? new Date(displayProfile.createdAt).toLocaleDateString() : "June 2026"}
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
                    <div className="space-y-6 max-w-xl text-left">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <h3 className="font-display font-black text-lg text-gray-900 uppercase tracking-tight">My Business Profile</h3>
                                <p className="text-xs text-gray-450 mt-1">These are the details directly given by admin. Agents cannot edit them.</p>
                            </div>
                        </div>
                        
                        <div className="bg-white border border-gray-100 rounded-[2rem] shadow-[0_10px_40px_rgb(0,0,0,0.03)] p-6 space-y-4 relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#6605c7]/20 to-transparent"></div>
                            
                            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-32">Business Name</span>
                                <span className="text-xs font-black text-gray-800 text-right">{profile?.businessName || "Krishna Educational Services"}</span>
                            </div>
                            
                            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-32">Agent Code</span>
                                <span className="text-xs font-bold text-indigo-600 font-mono tracking-wider bg-indigo-50 px-2 py-0.5 rounded text-right">{profile?.id || "VL-AGT-007"}</span>
                            </div>
                            
                            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-32">Type</span>
                                <span className="text-xs font-bold text-gray-700 text-right">Business Agent</span>
                            </div>
                            
                            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-32">Tier</span>
                                <span className="text-xs font-bold text-amber-600 text-right">🥇 Master</span>
                            </div>
                            
                            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-32">Territory</span>
                                <span className="text-xs font-bold text-gray-700 text-right">Hyderabad, Secunderabad, Rangareddy</span>
                            </div>

                            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-32">Joined</span>
                                <span className="text-xs font-bold text-gray-700 text-right">
                                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : "15-Jan-2025"}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-32">Staff RM</span>
                                <div className="text-right flex flex-col">
                                    <span className="text-xs font-bold text-gray-800">Neha Sharma</span>
                                    <span className="text-[10px] text-gray-400">neha@vidyaloans.com</span>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSaveContact} className="bg-white border border-gray-100 rounded-[2rem] shadow-[0_10px_40px_rgb(0,0,0,0.03)] p-6 space-y-4">
                            <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest border-b border-gray-50 pb-2 mb-4">Contact Details</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Primary Contact</label>
                                    <input type="text" value={editPrimaryContact} onChange={e => setEditPrimaryContact(e.target.value)} placeholder="e.g. Krishna Rao" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#6605c7]/15 transition-all" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Mobile</label>
                                    <input type="text" value={editMobile} onChange={e => setEditMobile(e.target.value)} placeholder="+91 9XXXXXXXXX" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#6605c7]/15 transition-all" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Email</label>
                                    <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="krishna@kesa.in" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#6605c7]/15 transition-all" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Office Address</label>
                                    <input type="text" value={editOfficeAddress} onChange={e => setEditOfficeAddress(e.target.value)} placeholder="123 Agent Tower, Hyderabad" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#6605c7]/15 transition-all" />
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-gray-50 flex justify-end">
                                <button type="submit" disabled={loading} className="px-6 py-3.5 bg-[#6605c7] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#6605c7]/95 transition-all shadow-sm">
                                    {loading ? "Saving..." : "Edit Profile"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {activeTab === "kyc" && (
                    <div className="space-y-6 max-w-2xl text-left">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <h3 className="font-display font-black text-lg text-gray-900 uppercase tracking-tight">KYC DOCUMENTS — Status</h3>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-[2rem] shadow-[0_10px_40px_rgb(0,0,0,0.03)] p-6 space-y-4 relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#6605c7]/20 to-transparent"></div>
                            
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-gray-100">
                                        <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-5/12">Document</th>
                                        <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-3/12">Status</th>
                                        <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-4/12">Expiry</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs font-bold text-gray-800">
                                    {KYC_DOC_TYPES.map((typeDef, index) => {
                                        const uploadedDoc = kycDocs.find(d => d.docType === typeDef.type);
                                        const isLast = index === KYC_DOC_TYPES.length - 1;
                                        
                                        let statusDisplay = <span className="text-gray-400">Not Uploaded</span>;
                                        if (uploadedDoc) {
                                            if (uploadedDoc.status === "verified" || uploadedDoc.status === "active") {
                                                statusDisplay = <span className="text-emerald-600">✅ {uploadedDoc.status === "active" ? "Active" : "Verified"}</span>;
                                            } else if (uploadedDoc.status === "rejected") {
                                                statusDisplay = <span className="text-rose-600">❌ Rejected</span>;
                                            } else {
                                                statusDisplay = <span className="text-amber-500">⏳ Pending</span>;
                                            }
                                        }

                                        let expiryDisplay = <span className="text-gray-300">-</span>;
                                        if (uploadedDoc) {
                                            if (uploadedDoc.expiry) {
                                                expiryDisplay = <span className="text-gray-500">{uploadedDoc.expiry}</span>;
                                            } else if (uploadedDoc.status === "verified" || uploadedDoc.status === "active") {
                                                expiryDisplay = <span className="text-gray-500">Lifetime</span>; 
                                            } else {
                                                expiryDisplay = <span className="text-gray-400 text-[10px] uppercase">Awaiting Admin</span>;
                                            }
                                        }

                                        return (
                                            <tr key={typeDef.type} className={isLast ? "" : "border-b border-gray-50"}>
                                                <td className="py-4">{typeDef.label}</td>
                                                <td className="py-4">{statusDisplay}</td>
                                                <td className="py-4 flex items-center justify-between">
                                                    {expiryDisplay}
                                                    {uploadedDoc && typeDef.type === "agent_agreement" && (
                                                        <button onClick={() => showToast("Downloading agreement...", "success")} className="text-[10px] text-indigo-600 font-black tracking-widest uppercase hover:underline">
                                                            [Download Copy]
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {uploading && (
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden animate-pulse">
                                <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                            </div>
                        )}

                        <div className="pt-2 flex justify-start">
                            <button
                                onClick={triggerFileSelect}
                                disabled={uploading}
                                className="px-6 py-3.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-sm"
                            >
                                {uploading ? `Uploading (${uploadProgress}%)` : "[Upload Updated Document]"}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                                accept=".pdf,.png,.jpg,.jpeg"
                            />
                        </div>
                    </div>
                )}

                {activeTab === "bank" && (
                    <div className="space-y-6 max-w-xl text-left">
                        <h3 className="font-display font-black text-lg text-gray-900 uppercase tracking-tight mb-4">COMMISSION PAYOUT BANK ACCOUNT</h3>
                        
                        <div className="bg-white border border-gray-100 rounded-[2rem] shadow-[0_10px_40px_rgb(0,0,0,0.03)] p-6 relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#6605c7]/20 to-transparent"></div>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-40">Account Holder</span>
                                    <span className="text-xs font-bold text-gray-800 text-right">{displayProfile?.businessName || "Krishna Educational Services"}</span>
                                </div>
                                
                                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-40">Bank</span>
                                    <span className="text-xs font-bold text-gray-800 text-right">{displayProfile?.bankName || "HDFC Bank"}</span>
                                </div>

                                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-40">Account Number</span>
                                    <div className="flex items-center gap-3 justify-end">
                                        <span className="text-xs font-bold text-gray-800 font-mono tracking-widest">
                                            {displayProfile?.accountNumber ? `●●●●●●●●●● ${displayProfile.accountNumber.slice(-4)}` : "●●●●●●●●●● 3842"}
                                        </span>
                                        <button onClick={() => showToast("Bank change request initiated...", "success")} className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-wider">
                                            [Change]
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-40">IFSC Code</span>
                                    <span className="text-xs font-bold text-gray-800 font-mono text-right">{displayProfile?.ifscCode || "HDFC00XXXXX"}</span>
                                </div>

                                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-40">Account Type</span>
                                    <span className="text-xs font-bold text-gray-800 text-right">Current</span>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-40">Status</span>
                                    <span className="text-[10px] font-bold text-emerald-600 text-right">
                                        ✅ Verified <span className="font-normal text-emerald-700/70">(penny-drop verified on {displayProfile?.createdAt ? new Date(displayProfile.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : "15-Jan-2025"})</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
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
                    <div className="space-y-6 max-w-2xl text-left">
                        <h3 className="font-display font-black text-lg text-gray-900 uppercase tracking-tight mb-4">NOTIFICATION PREFERENCES</h3>
                        
                        <div className="bg-white border border-gray-100 rounded-[2rem] shadow-[0_10px_40px_rgb(0,0,0,0.03)] p-6 relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#6605c7]/20 to-transparent"></div>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                    <span className="text-xs font-bold text-gray-700">Loan sanctioned for my student</span>
                                    <span className="text-xs font-black text-emerald-600">✅ WhatsApp + Push</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                    <span className="text-xs font-bold text-gray-700">Bank query raised</span>
                                    <span className="text-xs font-black text-emerald-600">✅ WhatsApp + Push</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                    <span className="text-xs font-bold text-gray-700">Document re-upload request</span>
                                    <span className="text-xs font-black text-emerald-600">✅ Push</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                    <span className="text-xs font-bold text-gray-700">Disbursement completed</span>
                                    <span className="text-xs font-black text-emerald-600">✅ WhatsApp + Email</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                    <span className="text-xs font-bold text-gray-700">Commission payout approved</span>
                                    <span className="text-xs font-black text-emerald-600">✅ WhatsApp + Email</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                    <span className="text-xs font-bold text-gray-700">New sub-agent activity</span>
                                    <span className="text-xs font-black text-emerald-600">✅ Push</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                    <span className="text-xs font-bold text-gray-700">Overdue task reminder</span>
                                    <span className="text-xs font-black text-emerald-600">✅ Push + SMS</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-xs font-bold text-gray-700">Weekly performance summary</span>
                                    <span className="text-xs font-black text-emerald-600">✅ Email <span className="text-[10px] font-bold text-gray-400">(every Monday 9 AM)</span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Support Tickets Tab */}
                {activeTab === "support" && (
                    <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm">
                        <UserSupportTicketsView
                            userRole="agent"
                            userInfo={{
                                id: displayProfile?.id,
                                name: `${displayProfile?.firstName || ''} ${displayProfile?.lastName || ''}`.trim() || displayProfile?.email,
                                email: displayProfile?.email,
                            }}
                        />
                    </div>
                )}
            </section>
        </div>
    );
}
