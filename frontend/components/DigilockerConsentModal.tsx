"use client";

import { useState } from "react";

const AVAILABLE_DOCS = [
    { id: "pan_verification", label: "PAN Verification Record", type: "PANCR", icon: "badge" },
    { id: "10th_marksheet", label: "10th Marksheet", type: "10TH", icon: "school" },
    { id: "12th_marksheet", label: "12th Marksheet", type: "12TH", icon: "school" },
    { id: "bachelors_marksheet", label: "Bachelors Marksheet", type: "BDEG", icon: "history_edu" },
    { id: "bachelors_degree", label: "Bachelors Degree", type: "BDEG", icon: "workspace_premium" },
    { id: "aadhar_card", label: "Aadhar Card", type: "ADHAR", icon: "fingerprint" },
    { id: "passport", label: "Passport", type: "PASPT", icon: "travel_explore" },
    { id: "driving_license", label: "Driving License", type: "DRILE", icon: "directions_car" },
];

interface DigilockerConsentModalProps {
    userId: string;
    onClose: () => void;
}

export default function DigilockerConsentModal({ userId, onClose }: DigilockerConsentModalProps) {
    const [selectedDocs, setSelectedDocs] = useState<string[]>(AVAILABLE_DOCS.map(d => d.id));

    const toggleDoc = (id: string) => {
        setSelectedDocs(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedDocs(AVAILABLE_DOCS.map(d => d.id));
        } else {
            setSelectedDocs([]);
        }
    };

    const handleFetchFromDigilocker = () => {
        if (selectedDocs.length === 0) {
            alert("Please select at least one document.");
            return;
        }
        // Redirect to backend authorize endpoint
        window.location.href = `/api/digilocker/authorize?userId=${encodeURIComponent(userId)}&docType=ALL_SYNC`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#004791] to-[#0b84ff] p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                            <span className="material-symbols-outlined text-[24px]">sync_lock</span>
                        </div>
                        <div>
                            <h2 className="font-bold text-[16px]">Import from DigiLocker</h2>
                            <p className="text-[10px] text-white/70 uppercase tracking-widest font-black">Official Integration</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/10 w-8 h-8 flex items-center justify-center rounded-full transition-colors">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                <div className="p-8">
                    {/* Info Banner */}
                    <div className="mb-8 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-blue-600 text-[20px]">info</span>
                        </div>
                        <div>
                            <p className="text-[12px] text-blue-900 font-bold mb-1">Verify your identity via OTP</p>
                            <p className="text-[11px] text-blue-700/80 leading-relaxed">
                                Log in with your Aadhaar or mobile number on the official DigiLocker portal. 
                                We will securely fetch only your selected documents.
                            </p>
                        </div>
                    </div>

                    {/* Document Selection Grid */}
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-gray-900 font-black text-[12px] uppercase tracking-wider">Select Documents to Upload</h3>
                            <button 
                                onClick={() => handleSelectAll(selectedDocs.length !== AVAILABLE_DOCS.length)}
                                className="text-[11px] font-bold text-[#0b84ff] hover:underline"
                            >
                                {selectedDocs.length === AVAILABLE_DOCS.length ? "Deselect All" : "Select All"}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {AVAILABLE_DOCS.map((doc) => {
                                const isSelected = selectedDocs.includes(doc.id);
                                return (
                                    <div 
                                        key={doc.id}
                                        onClick={() => toggleDoc(doc.id)}
                                        className={`group cursor-pointer p-4 rounded-2xl border-2 transition-all duration-200 ${
                                            isSelected 
                                            ? 'border-[#0b84ff] bg-blue-50/30' 
                                            : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                                isSelected ? 'bg-[#0b84ff] text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-white'
                                            }`}>
                                                <span className="material-symbols-outlined text-[18px]">{doc.icon}</span>
                                            </div>
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                                                isSelected ? 'bg-[#0b84ff] border-[#0b84ff]' : 'border-gray-200 bg-white'
                                            }`}>
                                                {isSelected && <span className="material-symbols-outlined text-[10px] text-white font-black">check</span>}
                                            </div>
                                        </div>
                                        <p className={`text-[11px] font-bold leading-tight ${isSelected ? 'text-blue-900' : 'text-gray-600'}`}>
                                            {doc.label}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex flex-col items-center gap-4">
                        <button
                            onClick={handleFetchFromDigilocker}
                            className="w-full sm:w-auto px-12 py-4 bg-[#004791] text-white rounded-2xl font-black text-[13px] uppercase tracking-[0.1em] hover:bg-[#003670] transition-all shadow-xl shadow-blue-900/20 active:scale-95 flex items-center justify-center gap-3"
                        >
                            <img src="https://upload.wikimedia.org/wikipedia/en/1/1d/DigiLocker_logo.png" alt="DigiLocker" className="h-5 w-auto brightness-0 invert" />
                            Allow Access &amp; Fetch
                        </button>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px]">verified</span>
                            Encrypted &amp; Secure 256-bit Connection
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
