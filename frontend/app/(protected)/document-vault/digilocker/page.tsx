"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi, documentApi } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DigilockerConsentModal from "@/components/DigilockerConsentModal";

const INTEGRATION_STEPS = [
    {
        title: "Initiate Request",
        desc: "Securely connect to your DigiLocker account via Government of India portal.",
        icon: "api",
        color: "bg-blue-500"
    },
    {
        title: "Verify Identity",
        desc: "Enter your Aadhaar or Mobile number and verify with a secure OTP.",
        icon: "fingerprint",
        color: "bg-emerald-500"
    },
    {
        title: "Instant Verification",
        desc: "Watch as documents are automatically fetched and verified in real-time.",
        icon: "verified",
        color: "bg-[#6605c7]"
    }
];

export default function DigilockerIntegrationPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6605c7]"></div></div>}>
            <DigilockerIntegrationContent />
        </Suspense>
    );
}

function DigilockerIntegrationContent() {
    const { user, refreshUser } = useAuth();
    const searchParams = useSearchParams();
    const targetDoc = searchParams.get('docType');
    
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);
    const [showConsentModal, setShowConsentModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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
        if (mounted) {
            const status = searchParams.get('status');
            const message = searchParams.get('message');
            if (status === 'success') {
                loadDocs();
                // Scroll to documents section
                const docSection = document.getElementById('documents-section');
                if (docSection) docSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [mounted, searchParams, loadDocs]);

    const handleDigilockerVerify = async (docType: string) => {
        if (!user?.id) {
            alert("User identity not found. Please refresh.");
            refreshUser();
            return;
        }
        window.location.href = `/api/digilocker/authorize?userId=${encodeURIComponent(user.id)}&docType=${encodeURIComponent(docType)}&source=portal`;
    };

    const handleSyncFromDigilocker = async (docType: string) => {
        if (!user?.id) return;
        setUploading(docType);
        try {
            const result: any = await documentApi.syncFromDigilocker(user.id, docType);
            if (result.success) {
                await loadDocs();
                alert("Successfully synced from DigiLocker!");
            } else {
                alert(result.message || "Failed to sync document.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setUploading(null);
        }
    };

    if (!mounted) return null;

    const digilockerDocs = docs.filter(d => d.status === 'available_in_digilocker' && !d.uploaded);

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-4">
                        <Link href="/document-vault" className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm hover:border-gray-200 transition-all">
                            <span className="material-symbols-outlined text-gray-400 text-[20px]">arrow_back</span>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                DigiLocker Integration
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-200">Official</span>
                            </h1>
                            <p className="text-gray-500 text-[13px] font-medium">Verify and import your original documents instantly</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left side: Instructions & Action */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-gradient-to-br from-[#004791] to-[#0b84ff] rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-500/30">
                            {/* Design decorations */}
                            <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" />
                            <div className="absolute top-1/2 left-0 w-40 h-40 bg-blue-900/30 rounded-full blur-3xl" />
                            
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-16 h-16 bg-white rounded-2xl p-3 flex items-center justify-center shadow-lg">
                                        <img src="https://upload.wikimedia.org/wikipedia/en/1/1d/DigiLocker_logo.png" alt="DigiLocker" className="w-full h-auto" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black mb-1">Paperless Documentation</h2>
                                        <p className="text-white/70 text-sm font-medium italic">Powered by Ministry of Electronics & IT</p>
                                    </div>
                                </div>

                                <p className="text-white/80 text-[15px] leading-relaxed mb-10 max-w-2xl font-medium">
                                    No more scanning or manual uploads. Connect your DigiLocker to VidhyaLoan 
                                    to instantly verify your KYC documents, academic marksheets, and more using your Aadhaar-linked mobile.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button
                                        onClick={() => handleDigilockerVerify('ALL_SYNC')}
                                        className="px-10 py-5 bg-emerald-500 text-white rounded-2xl text-[13px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/20 active:scale-95 group"
                                    >
                                        <span className="material-symbols-outlined text-[20px] group-hover:rotate-180 transition-transform duration-700">sync</span>
                                        Start Instant Sync
                                    </button>
                                    <button
                                        onClick={() => setShowConsentModal(true)}
                                        className="px-10 py-5 bg-white text-[#004791] rounded-2xl text-[13px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/10 active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">checklist</span>
                                        Specific Documents
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Connection Process */}
                        <div className="bg-gray-50 rounded-[40px] p-10 border border-gray-100">
                            <h3 className="text-lg font-black text-gray-900 mb-10">How it works</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                                {/* Connector lines for desktop */}
                                <div className="hidden md:block absolute top-8 left-[15%] right-[15%] h-[2px] bg-gray-200 border-dashed border-t-[2px] border-emerald-500/30" />
                                
                                {INTEGRATION_STEPS.map((step, idx) => (
                                    <div key={idx} className="relative z-10 flex flex-col items-center text-center">
                                        <div className={`w-16 h-16 ${step.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-black/5`}>
                                            <span className="material-symbols-outlined text-[28px]">{step.icon}</span>
                                        </div>
                                        <h4 className="text-[14px] font-bold text-gray-900 mb-2">{step.title}</h4>
                                        <p className="text-[11px] text-gray-500 leading-relaxed font-medium">{step.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right side: Summary & Status */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                            <h3 className="text-[12px] font-black uppercase tracking-widest text-gray-400 mb-6 font-display">Active Documents</h3>
                            <div className="space-y-4">
                                {docs.length === 0 ? (
                                    <div className="py-10 text-center">
                                         <span className="material-symbols-outlined text-gray-200 text-5xl mb-4">folder_open</span>
                                         <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">No documents yet</p>
                                    </div>
                                ) : (
                                    docs.slice(0, 5).map(doc => (
                                        <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${doc.uploaded ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'}`}>
                                                    <span className="material-symbols-outlined text-[16px]">description</span>
                                                </div>
                                                <span className="text-[12px] font-bold text-gray-700 capitalize">{doc.docType.replace('_', ' ')}</span>
                                            </div>
                                            {doc.uploaded ? (
                                                <span className="material-symbols-outlined text-emerald-500 text-[18px]">verified</span>
                                            ) : (
                                                <span className="text-[10px] text-gray-400 font-bold">Pending</span>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                            {docs.length > 5 && (
                                <Link href="/document-vault" className="block text-center mt-6 text-[11px] font-black text-[#6605c7] uppercase tracking-widest hover:underline">
                                    View All {docs.length} Documents
                                </Link>
                            )}
                        </div>

                        {/* Security Box */}
                        <div className="bg-[#1a1a2e] rounded-[32px] p-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <span className="material-symbols-outlined text-7xl">shield</span>
                            </div>
                            <div className="relative z-10">
                                <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-emerald-400 text-sm">lock</span>
                                    Military-Grade Encryption
                                </h4>
                                <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                                    Your DigiLocker data is encrypted with AES-256 and never stored as plain text. VidhyaLoan only facilitates the verification process.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fetched Section (Popup style) */}
                <div id="documents-section" className="mt-12 bg-white rounded-[40px] p-10 border border-emerald-100 shadow-2xl shadow-emerald-500/10 animate-in slide-in-from-bottom duration-500">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                 <span className="material-symbols-outlined text-[28px]">move_to_inbox</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900">DigiLocker Documents Section</h2>
                                <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">
                                    {digilockerDocs.length > 0 ? `Available to sync: ${digilockerDocs.length} documents` : "Waiting for discovery..."}
                                </p>
                            </div>
                        </div>
                        {digilockerDocs.length === 0 && (
                            <button onClick={loadDocs} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2">
                                <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
                                {loading ? 'Checking...' : 'Check Discovery'}
                            </button>
                        )}
                    </div>

                    {digilockerDocs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {digilockerDocs.map(d => (
                                <div key={d.id} className={`bg-gray-50 rounded-3xl p-6 border transition-all duration-300 flex flex-col items-center text-center group ${d.docType === targetDoc ? 'border-[#6605c7] bg-purple-50 ring-4 ring-purple-100 shadow-xl' : 'border-gray-100'}`}>
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                                        <span className={`material-symbols-outlined ${d.docType === targetDoc ? 'text-[#6605c7]' : 'text-gray-400'} group-hover:text-emerald-500 transition-colors`}>description</span>
                                    </div>
                                    <h3 className="text-[13px] font-bold text-gray-900 mb-1 capitalize">{d.docType.replace('_', ' ')}</h3>
                                    <div className={`mb-6 flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${d.docType === targetDoc ? 'bg-[#6605c7] text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                                        <span className="material-symbols-outlined text-[12px]">verified</span> {d.docType === targetDoc ? 'Requested' : 'Valid Source'}
                                    </div>
                                    <button
                                        onClick={() => handleSyncFromDigilocker(d.docType)}
                                        disabled={!!uploading}
                                        className="w-full py-3 bg-[#6605c7] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#5504a6] transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                                    >
                                        {uploading === d.docType ? (
                                            <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                                        ) : (
                                            <span className="material-symbols-outlined text-[16px]">download</span>
                                        )}
                                        {uploading === d.docType ? "Syncing..." : "Sync to Vault"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-[30px] flex items-center justify-center mb-6">
                                <span className="material-symbols-outlined text-gray-300 text-4xl">cloud_sync</span>
                            </div>
                            <h3 className="text-gray-900 font-black text-lg mb-2">No documents discovered yet</h3>
                            <p className="text-gray-500 text-xs max-w-sm font-medium leading-relaxed">
                                Connect your DigiLocker above to find your identity and academic documents. 
                                Once verified, they will appear here for one-click syncing.
                            </p>
                        </div>
                    )}
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
