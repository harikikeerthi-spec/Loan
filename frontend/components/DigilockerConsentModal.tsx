"use client";

import { useState } from "react";

const AVAILABLE_DOCS = [
    { id: "pan_verification", label: "PAN VERIFICATION RECORD", type: "PANCR" },
    { id: "10th_marksheet", label: "10TH MARKSHEET", type: "10TH" },
    { id: "12th_marksheet", label: "12TH MARKSHEET", type: "12TH" },
    { id: "bachelors_marksheet", label: "BACHELORS MARKSHEET", type: "BDEG" },
    { id: "bachelors_degree", label: "BACHELORS DEGREE CERTIFICATE", type: "BDEG" },
    { id: "aadhar_card", label: "ADHAAR CARD", type: "ADHAR" },
    { id: "10th_compartment", label: "10TH COMPARTMENT MARKSHEET", type: "10TH" },
    { id: "12th_compartment", label: "12TH COMPARTMENT MARKSHEET", type: "12TH" },
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
        // Redirect to backend authorize endpoint — DigiLocker handles mobile OTP login
        window.location.href = `/api/digilocker/authorize?userId=${encodeURIComponent(userId)}&docType=ALL_SYNC`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-[#0b84ff] p-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2 font-bold text-[14px]">
                        <span className="material-symbols-outlined text-[20px]">sync_lock</span>
                        Fetch Documents from DigiLocker
                    </div>
                    <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-8">
                    {/* Info Banner */}
                    <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
                        <span className="material-symbols-outlined text-blue-500 text-[20px] shrink-0 mt-0.5">info</span>
                        <p className="text-[12px] text-blue-700 leading-relaxed">
                            You will be redirected to DigiLocker where you can log in with your mobile number and OTP.
                            After granting consent, your documents will be fetched automatically.
                        </p>
                    </div>

                    {/* Document Selection */}
                    <div className="mb-8">
                        <div className="text-center mb-6">
                            <h3 className="text-[#0b84ff] font-bold text-[15px] uppercase tracking-wide">Select Documents to Fetch</h3>
                        </div>

                        <div className="mb-4">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={selectedDocs.length === AVAILABLE_DOCS.length}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                    className="w-4 h-4 rounded text-[#0b84ff] focus:ring-[#0b84ff]"
                                />
                                <span className="text-[12px] font-bold text-gray-700 group-hover:text-[#0b84ff] transition-colors">Select All</span>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
                            {AVAILABLE_DOCS.map((doc) => (
                                <label key={doc.id} className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={selectedDocs.includes(doc.id)}
                                        onChange={() => toggleDoc(doc.id)}
                                        className="w-4 h-4 rounded border-gray-300 text-[#0b84ff] focus:ring-[#0b84ff]"
                                    />
                                    <span className="text-[11px] font-semibold text-gray-600 group-hover:text-gray-900 transition-colors uppercase tracking-tight">
                                        {doc.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-center">
                        <button
                            onClick={handleFetchFromDigilocker}
                            className="flex items-center gap-2 px-10 py-3 bg-[#004791] text-white rounded-lg font-bold text-[13px] hover:bg-[#003670] transition-all shadow-lg active:scale-95"
                        >
                            <img src="https://upload.wikimedia.org/wikipedia/en/1/1d/DigiLocker_logo.png" alt="DigiLocker" className="h-5 w-auto brightness-0 invert" />
                            Fetch from DigiLocker
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
