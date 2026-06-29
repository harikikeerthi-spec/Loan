"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { useAgent } from "../AgentContext";
import { documentApi, onboardingApi } from "@/lib/api";
import { format } from "date-fns";

const REQUIRED_DOCS = [
    { docType: "identity_proof", docName: "Identity Proof (Aadhar/Passport)" },
    { docType: "pan_card", docName: "PAN Card" },
    { docType: "marksheet_10th", docName: "10th Marksheet" },
    { docType: "marksheet_12th", docName: "12th Marksheet" },
    { docType: "admission_letter", docName: "Admission Letter" },
    { docType: "bank_statement", docName: "6-Month Bank Statement" },
    { docType: "income_proof", docName: "Income Certificate" },
    { docType: "fee_structure", docName: "Fee Structure" },
    { docType: "photo", docName: "Passport Photo" }
];

export default function AgentDocuments() {
    const {
        applications,
        docUploadState, setDocUploadState,
        docShareState, setDocShareState,
        showToast
    } = useAgent();

    const selectedStudent = useMemo(() => {
        return applications.find(x => x.id === docUploadState.studentId) || applications[0];
    }, [applications, docUploadState.studentId]);

    const [dbDocuments, setDbDocuments] = useState<any[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [sharing, setSharing] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchDocs = async () => {
        if (!selectedStudent) return;
        
        // If mock student, use their mock documents
        if (selectedStudent.id.startsWith("LEAD-109")) {
            setDbDocuments(selectedStudent.documents || []);
            return;
        }

        setLoadingDocs(true);
        try {
            const userId = selectedStudent.userId || selectedStudent.id;
            const res = await documentApi.getUserDocuments(userId) as any;
            if (res.success && res.data) {
                setDbDocuments(res.data);
            } else {
                setDbDocuments([]);
            }
        } catch (err) {
            console.error("Error fetching documents:", err);
            setDbDocuments([]);
        } finally {
            setLoadingDocs(false);
        }
    };

    useEffect(() => {
        fetchDocs();
    }, [selectedStudent]);

    const mergedChecklist = useMemo(() => {
        if (!selectedStudent) return [];

        // If mock student, use mock documents list directly
        if (selectedStudent.id.startsWith("LEAD-109")) {
            return selectedStudent.documents || [];
        }

        return REQUIRED_DOCS.map(req => {
            const existing = dbDocuments.find(d => d.docType === req.docType);
            return {
                docType: req.docType,
                docName: req.docName,
                status: existing ? (existing.status || "uploaded") : "not_uploaded",
                rejectionReason: existing?.rejectionReason || existing?.verificationMetadata?.rejectionReason || ""
            };
        });
    }, [selectedStudent, dbDocuments]);

    const uploadHistory = useMemo(() => {
        if (!selectedStudent) return [];

        if (selectedStudent.id.startsWith("LEAD-109")) {
            return [
                { fileName: "Aadhar.pdf", studentName: "Priya Sharma", date: "22-Jun", status: "verified" },
                { fileName: "BankStatement.pdf", studentName: "Rahul Kumar", date: "21-Jun", status: "processing" },
                { fileName: "IncCert_Stamped.pdf", studentName: "Priya Sharma", date: "20-Jun", status: "rejected" }
            ];
        }

        return dbDocuments
            .filter(d => d.status && d.status !== "not_uploaded")
            .map(d => {
                const uploadedAt = d.updatedAt || d.createdAt || new Date();
                const formattedDate = format(new Date(uploadedAt), "dd-MMM");
                const studentName = `${selectedStudent.firstName} ${selectedStudent.lastName}`;
                const fileBaseName = d.filePath ? d.filePath.split(/[/\\]/).pop() : `${d.docType}.pdf`;
                return {
                    fileName: fileBaseName || `${d.docType}.pdf`,
                    studentName,
                    date: formattedDate,
                    status: d.status || "pending"
                };
            });
    }, [selectedStudent, dbDocuments]);

    const handleDropzoneClick = () => {
        if (uploading) return;
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];

        if (!selectedStudent) return;
        const studentId = selectedStudent.id;
        const docType = docUploadState.docType;

        // If mock student, simulate
        if (studentId.startsWith("LEAD-109")) {
            setUploading(true);
            setUploadProgress(10);
            setTimeout(() => setUploadProgress(50), 300);
            setTimeout(() => setUploadProgress(90), 600);
            setTimeout(() => {
                setUploadProgress(100);
                
                const existingDoc = selectedStudent.documents?.find(d => d.docType === docType);
                let updatedDocs: any[] = [];
                if (existingDoc) {
                    updatedDocs = selectedStudent.documents.map(d => 
                        d.docType === docType ? { ...d, status: "pending" as const, uploadedBy: "Agent", version: `v${parseInt(d.version.replace("v", "")) + 1}` } : d
                    );
                } else {
                    updatedDocs = [...(selectedStudent.documents || []), { docType, docName: docType.replace(/_/g, " ").toUpperCase(), status: "pending" as const, uploadedBy: "Agent", version: "v1" }];
                }
                
                selectedStudent.documents = updatedDocs as any;
                selectedStudent.journey = [
                    ...(selectedStudent.journey || []),
                    { date: format(new Date(), "dd-MMM-yyyy"), title: "Document Uploaded", desc: `Doc Type: ${docType.replace(/_/g, " ").toUpperCase()} (${file.name}) uploaded`, done: true }
                ];
                selectedStudent.lastUpdated = format(new Date(), "dd-MMM-yyyy");
                
                setDbDocuments(updatedDocs);
                showToast(`Document uploaded successfully (mock): ${file.name}. Awaiting verification review.`, "success");
                setUploading(false);
            }, 1000);
            return;
        }

        // Real upload to backend
        setUploading(true);
        setUploadProgress(0);
        try {
            const userId = selectedStudent.userId || selectedStudent.id;
            showToast(`Uploading ${file.name} and initiating AI KYC checks...`, "info");
            
            await documentApi.upload(userId, docType, file, (progress) => {
                setUploadProgress(Math.round(progress));
            });
            
            showToast("Document verified and uploaded successfully!", "success");
            await fetchDocs();
        } catch (err: any) {
            console.error("Upload failed:", err);
            showToast(err.message || "Failed to upload document", "warning");
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleSendLink = async () => {
        const studentId = docShareState.studentId;
        const student = applications.find(x => x.id === studentId);
        if (!student) return;

        if (studentId.startsWith("LEAD-109")) {
            showToast(`Secure upload link sent to student ${student.firstName} via ${docShareState.channel}! (Expires in ${docShareState.expiry} hours)`, "success");
            return;
        }

        const studentEmail = student.email;
        if (!studentEmail) {
            showToast("Student email is not registered. Please set student email first.", "warning");
            return;
        }

        const studentName = `${student.firstName} ${student.lastName}`.trim();
        const shareUrl = `${window.location.origin}/student/onboarding?studentId=${studentId}`;

        setSharing(true);
        try {
            const shareRes: any = await onboardingApi.share({
                studentId,
                studentEmail,
                studentName,
                shareUrl
            });

            if (shareRes.success) {
                try {
                    await navigator.clipboard.writeText(shareUrl);
                } catch (clipErr) {
                    const tempInput = document.createElement("input");
                    tempInput.value = shareUrl;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand("copy");
                    document.body.removeChild(tempInput);
                }
                showToast(`Onboarding link shared to registered email (${studentEmail}) & copied to clipboard!`, "success");
            } else {
                showToast(`Failed to share onboarding link: ${shareRes.message}`, "warning");
            }
        } catch (err: any) {
            console.error("Share onboarding error:", err);
            showToast(`Failed to share onboarding link: ${err.message || err}`, "warning");
        } finally {
            setSharing(false);
        }
    };

    return (
        <div className="animate-fade-in-up space-y-12 relative z-10">
            {/* Hidden native file input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,.jpg,.jpeg,.png"
            />
            
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

                        {uploading ? (
                            <div className="border-2 border-dashed border-[#6605c7]/30 rounded-[1.5rem] p-8 text-center bg-gray-50/50 flex flex-col items-center justify-center min-h-[180px]">
                                <span className="material-symbols-outlined text-[#6605c7] text-4xl mb-2 animate-spin">sync</span>
                                <span className="text-xs font-bold text-gray-700">Uploading & verifying: {uploadProgress}%</span>
                                <div className="w-48 bg-gray-200 h-1.5 rounded-full mt-3 overflow-hidden">
                                    <div className="bg-[#6605c7] h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                </div>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-gray-200 rounded-[1.5rem] p-8 text-center hover:border-[#6605c7]/30 transition-all cursor-pointer bg-gray-50/50 flex flex-col items-center justify-center min-h-[180px]" onClick={handleDropzoneClick}>
                                <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">cloud_upload</span>
                                <span className="text-xs font-bold text-gray-700">Drop PDF, JPG, PNG here or Browse</span>
                                <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">max size 10MB per file</span>
                            </div>
                        )}
                    </div>

                    {/* Document Upload History log */}
                    <div className="bg-white border border-[#6605c7]/10 p-8 rounded-[2.5rem] shadow-sm">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#6605c7]/40 mb-6">UPLOAD HISTORY</h3>
                        
                        <div className="space-y-4">
                            {uploadHistory.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">No upload history found for this student.</p>
                            ) : (
                                uploadHistory.slice(0, 5).map((h, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs">
                                        <div className="flex items-center gap-3">
                                            <span className={`material-symbols-outlined ${
                                                h.status === 'verified' ? 'text-emerald-500' :
                                                h.status === 'rejected' ? 'text-rose-500' :
                                                'text-indigo-500'
                                            }`}>
                                                {h.status === 'verified' ? 'task_alt' :
                                                 h.status === 'rejected' ? 'cancel' :
                                                 'sync'}
                                            </span>
                                            <div>
                                                <p className="font-bold text-gray-800">{h.fileName} → {h.studentName}</p>
                                                <p className="text-[10px] text-gray-400">Uploaded on {h.date}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                                            h.status === 'verified' ? 'bg-emerald-50 text-emerald-700' :
                                            h.status === 'rejected' ? 'bg-rose-50 text-rose-700' :
                                            'bg-indigo-50 text-indigo-700'
                                        }`}>
                                            {h.status}
                                        </span>
                                    </div>
                                ))
                            )}
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
                                {loadingDocs ? (
                                    <div className="flex items-center justify-center py-8">
                                        <span className="material-symbols-outlined text-[#6605c7] animate-spin text-xl">sync</span>
                                        <span className="text-xs text-gray-400 ml-2">Loading documents...</span>
                                    </div>
                                ) : (
                                    mergedChecklist.map((d: any, i: number) => {
                                        const isUploaded = d.status !== 'not_uploaded';
                                        const viewUrl = isUploaded && selectedStudent
                                            ? `/api/documents/view/${selectedStudent.userId || selectedStudent.id}/${d.docType}`
                                            : null;

                                        return (
                                            <div key={i} className="flex justify-between items-center group">
                                                <div className="flex flex-col">
                                                    {viewUrl ? (
                                                        <a 
                                                            href={viewUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="font-medium text-gray-700 hover:text-[#6605c7] transition-colors hover:underline cursor-pointer flex items-center gap-1"
                                                        >
                                                            {d.docName}
                                                            <span className="material-symbols-outlined text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
                                                        </a>
                                                    ) : (
                                                        <span className="font-medium text-gray-400">{d.docName}</span>
                                                    )}
                                                    {d.rejectionReason && (
                                                        <span className="text-[10px] text-rose-500 font-bold mt-0.5 max-w-[180px] leading-tight">
                                                            Reason: {d.rejectionReason}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`bg-gray-50 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                                        d.status === 'verified' ? 'bg-emerald-50 text-emerald-700' :
                                                        d.status === 'rejected' ? 'bg-rose-50 text-rose-700' :
                                                        d.status === 'not_uploaded' ? 'bg-gray-100 text-gray-400' :
                                                        'bg-amber-50 text-amber-700'
                                                    }`}>
                                                        {d.status.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className={`material-symbols-outlined text-base ${
                                                        d.status === 'verified' ? 'text-emerald-500' : 
                                                        d.status === 'rejected' ? 'text-rose-500 animate-pulse' : 
                                                        d.status === 'not_uploaded' ? 'text-gray-300' : 
                                                        'text-amber-500'
                                                    }`}>
                                                        {d.status === 'verified' ? 'check_circle' : 
                                                         d.status === 'rejected' ? 'error' : 
                                                         d.status === 'not_uploaded' ? 'radio_button_unchecked' : 
                                                         'schedule'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
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
                            <button 
                                onClick={handleSendLink} 
                                disabled={sharing}
                                className="w-full py-4 bg-[#6605c7] hover:bg-[#6605c7]/95 disabled:bg-gray-300 text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                {sharing && <span className="material-symbols-outlined text-sm animate-spin">sync</span>}
                                {sharing ? "Sending..." : "Send Secure link"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
