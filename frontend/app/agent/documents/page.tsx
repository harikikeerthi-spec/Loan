"use client";

import React, { useMemo } from "react";
import { useAgent } from "../AgentContext";

export default function AgentDocuments() {
    const {
        applications,
        docUploadState, setDocUploadState,
        docShareState, setDocShareState,
        handleDocumentUpload, handleSendDocLink
    } = useAgent();

    const selectedStudent = useMemo(() => {
        return applications.find(x => x.id === docUploadState.studentId) || applications[0];
    }, [applications, docUploadState.studentId]);

    return (
        <div className="animate-fade-in-up space-y-12 relative z-10">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Unified Document Upload */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                        <h3 className="font-display font-black text-xl text-gray-900 mb-6 uppercase tracking-tight">Document Upload Center</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Select Target Student</label>
                                <select value={docUploadState.studentId} onChange={(e) => setDocUploadState({ ...docUploadState, studentId: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none">
                                    {applications.map((x, i) => (
                                        <option key={i} value={x.id}>{x.firstName} {x.lastName} ({x.id})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase">Document Category</label>
                                <select value={docUploadState.docType} onChange={(e) => setDocUploadState({ ...docUploadState, docType: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none">
                                    <option value="identity_proof">Identity Proof (Aadhar/Passport)</option>
                                    <option value="pan_card">PAN Card</option>
                                    <option value="marksheet_10th">10th Marksheet</option>
                                    <option value="marksheet_12th">12th Marksheet</option>
                                    <option value="admission_letter">Admission Letter</option>
                                    <option value="bank_statement">6-Month Bank Statement</option>
                                    <option value="income_proof">Income Certificate</option>
                                    <option value="fee_structure">Fee Structure</option>
                                    <option value="photo">Passport Photo</option>
                                </select>
                            </div>
                        </div>

                        <div className="border-2 border-dashed border-gray-200 rounded-[1.5rem] p-8 text-center hover:border-[#6605c7]/30 transition-all cursor-pointer bg-gray-50/50 flex flex-col items-center justify-center min-h-[180px]" onClick={() => handleDocumentUpload(docUploadState.studentId, docUploadState.docType)}>
                            <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">cloud_upload</span>
                            <span className="text-xs font-bold text-gray-700">Drop PDF, JPG, PNG here or Browse</span>
                            <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">max size 20MB per file</span>
                        </div>
                    </div>

                    {/* Document Upload History log */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#6605c7]/40 mb-6">UPLOAD HISTORY (Last 10 Days)</h3>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-emerald-500">task_alt</span>
                                    <div>
                                        <p className="font-bold text-gray-800">Aadhar.pdf → Priya Sharma</p>
                                        <p className="text-[10px] text-gray-400">Uploaded on 22-Jun</p>
                                    </div>
                                </div>
                                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold uppercase text-[9px]">Verified</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-indigo-500 animate-spin">sync</span>
                                    <div>
                                        <p className="font-bold text-gray-800">BankStatement.pdf → Rahul Kumar</p>
                                        <p className="text-[10px] text-gray-400">Uploaded on 21-Jun</p>
                                    </div>
                                </div>
                                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase text-[9px]">Processing</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-amber-500">schedule</span>
                                    <div>
                                        <p className="font-bold text-gray-800">IncCert_Stamped.pdf → Priya Sharma</p>
                                        <p className="text-[10px] text-gray-400">Uploaded on 20-Jun</p>
                                    </div>
                                </div>
                                <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold uppercase text-[9px]">Awaiting Review</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8 flex flex-col">
                    {/* Checklist Quick View */}
                    {selectedStudent && (
                        <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                            <h3 className="font-display font-black text-lg text-gray-900 mb-2 uppercase tracking-tight">Student checklist</h3>
                            <p className="text-xs text-gray-400 mb-6">{selectedStudent.firstName} {selectedStudent.lastName} — {selectedStudent.bank}</p>
                            
                            <div className="space-y-3.5 text-xs">
                                {selectedStudent.documents.map((d, i) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <span className="font-medium text-gray-700">{d.docName}</span>
                                        <span className={`material-symbols-outlined text-base ${d.status === 'verified' ? 'text-emerald-500' : d.status === 'rejected' ? 'text-rose-500 animate-pulse' : 'text-amber-500'}`}>
                                            {d.status === 'verified' ? 'check_circle' : d.status === 'rejected' ? 'error' : 'schedule'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Send Document Secure Upload Link */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm flex-1 flex flex-col justify-between">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#6605c7]/40 mb-2">SHARE SECURE UPLOAD LINK</h3>
                                <p className="text-gray-400 text-xs">Allows student to upload document requirements directly without signing in.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Send To</label>
                                    <select value={docShareState.studentId} onChange={(e) => setDocShareState({ ...docShareState, studentId: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none">
                                        {applications.map((x, i) => (
                                            <option key={i} value={x.id}>{x.firstName} {x.lastName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Share via Channel</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {["WhatsApp", "SMS", "Email"].map((ch, i) => (
                                            <button key={i} type="button" onClick={() => setDocShareState({ ...docShareState, channel: ch })} className={`py-2 text-[10px] font-black uppercase rounded-lg border transition-all ${docShareState.channel === ch ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>{ch}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button onClick={handleSendDocLink} className="w-full py-4 bg-[#6605c7] hover:bg-[#6605c7]/95 text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-sm">Send Secure link</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
