"use client";

import React, { useState } from "react";
import { format } from "date-fns";

interface ApplicationData {
    id: string;
    applicationNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    bank: string;
    loanType: string;
    amount: number;
    status: "pending" | "processing" | "approved" | "rejected" | "disbursed";
    stage: string;
    progress: number;
    remarks: string;
    rejectionReason?: string;
    createdAt: string;
    submittedAt: string;
    // Vidhyaloan Education Loan specific fields
    universityName: string;
    courseName: string;
    country: string;
    courseFeeAmount: number;
    yearOfAdmission: number;
    // Student details
    dateOfBirth: string;
    guardianName: string;
    guardianPhone: string;
    guardianOccupation: string;
    // Mentor & Counselor Assignment
    mentorId?: string;
    mentorName?: string;
    counselorId?: string;
    counselorName?: string;
    // Risk Assessment
    riskLevel?: "low" | "medium" | "high";
    creditScore?: number;
    // Document tracking
    documents?: Array<{
        id: string;
        docType: string;
        docName: string;
        status: "pending" | "verified" | "rejected";
        filePath?: string;
    }>;
}

interface AdminRemarks {
    id: string;
    type: "suggestion" | "remark" | "warning" | "approval_note";
    content: string;
    author: string;
    authorId: string;
    createdAt: string;
    isInternal: boolean;
}

const ApplicationManagementPanel = ({ app, onUpdate, onClose }: {
    app: ApplicationData;
    onUpdate: (appId: string, updates: any) => Promise<void>;
    onClose: () => void;
}) => {
    const [tab, setTab] = useState<"overview" | "details" | "remarks" | "documents" | "action">("overview");
    const [remarks, setRemarks] = useState<AdminRemarks[]>([]);
    const [newRemark, setNewRemark] = useState("");
    const [remarkType, setRemarkType] = useState<"suggestion" | "remark" | "warning" | "approval_note">("remark");
    const [actionRemarks, setActionRemarks] = useState("");
    const [selectedMentor, setSelectedMentor] = useState(app.mentorName || "");
    const [selectedCounselor, setSelectedCounselor] = useState(app.counselorName || "");
    const [riskLevel, setRiskLevel] = useState(app.riskLevel || "medium");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddRemark = async () => {
        if (!newRemark.trim()) return;

        try {
            const remark: AdminRemarks = {
                id: Date.now().toString(),
                type: remarkType,
                content: newRemark,
                author: "Admin", // Should come from auth context
                authorId: "admin-id",
                createdAt: new Date().toISOString(),
                isInternal: true,
            };
            setRemarks([remark, ...remarks]);
            setNewRemark("");
            
            // Call API to save
            await onUpdate(app.id, { remarks: newRemark });
        } catch (error) {
            console.error("Failed to add remark:", error);
        }
    };

    const handleApprove = async () => {
        if (!actionRemarks.trim()) {
            alert("Please add remarks before approving");
            return;
        }

        setIsSubmitting(true);
        try {
            await onUpdate(app.id, {
                status: "approved",
                remarks: actionRemarks,
                mentorId: selectedMentor,
                counselorId: selectedCounselor,
                riskLevel: riskLevel,
                stage: "sanction",
                progress: 90,
            });
            alert("Application approved successfully!");
            onClose();
        } catch (error) {
            console.error("Failed to approve:", error);
            alert("Failed to approve application");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!actionRemarks.trim()) {
            alert("Please add rejection reason");
            return;
        }

        setIsSubmitting(true);
        try {
            await onUpdate(app.id, {
                status: "rejected",
                remarks: actionRemarks,
                rejectionReason: actionRemarks,
            });
            alert("Application rejected!");
            onClose();
        } catch (error) {
            console.error("Failed to reject:", error);
            alert("Failed to reject application");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSendBackForChanges = async () => {
        if (!actionRemarks.trim()) {
            alert("Please specify what changes are needed");
            return;
        }

        setIsSubmitting(true);
        try {
            await onUpdate(app.id, {
                status: "processing",
                remarks: `Changes Required: ${actionRemarks}`,
                stage: "document_verification",
            });
            alert("Application sent back to applicant!");
            onClose();
        } catch (error) {
            console.error("Failed to send back:", error);
            alert("Failed to process request");
        } finally {
            setIsSubmitting(false);
        }
    };

    const statusColors: Record<string, string> = {
        pending: "bg-amber-100 text-amber-700 border-amber-200",
        processing: "bg-blue-100 text-blue-700 border-blue-200",
        approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
        rejected: "bg-red-100 text-red-600 border-red-200",
        disbursed: "bg-purple-100 text-purple-700 border-purple-200",
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
                {/* Header */}
                <div className="sticky top-0 z-20 bg-gradient-to-r from-slate-900 to-slate-800 text-white px-8 py-6 border-b border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Application Management</h2>
                            <p className="text-slate-300 text-sm mt-1">Ref: {app.applicationNumber}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider border ${
                                app.status === "pending" ? "bg-amber-500/20 text-amber-300 border-amber-400" :
                                app.status === "processing" ? "bg-blue-500/20 text-blue-300 border-blue-400" :
                                app.status === "approved" ? "bg-emerald-500/20 text-emerald-300 border-emerald-400" :
                                app.status === "rejected" ? "bg-red-500/20 text-red-300 border-red-400" :
                                "bg-purple-500/20 text-purple-300 border-purple-400"
                            }`}>
                                {app.status}
                            </span>
                            <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-6 border-t border-slate-700 pt-4 -mx-8 px-8 overflow-x-auto">
                        {(["overview", "details", "remarks", "documents", "action"] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`pb-4 px-1 text-sm font-semibold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                                    tab === t
                                        ? "border-white text-white"
                                        : "border-transparent text-slate-300 hover:text-white"
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    {t === "overview" && <span className="material-symbols-outlined text-[16px]">overview</span>}
                                    {t === "details" && <span className="material-symbols-outlined text-[16px]">person</span>}
                                    {t === "remarks" && <span className="material-symbols-outlined text-[16px]">note</span>}
                                    {t === "documents" && <span className="material-symbols-outlined text-[16px]">description</span>}
                                    {t === "action" && <span className="material-symbols-outlined text-[16px]">done_all</span>}
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                    {tab === "overview" && (
                        <div className="space-y-6">
                            {/* Applicant Summary */}
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-slate-600">person</span>
                                    Applicant Information
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Name</p>
                                        <p className="text-lg font-bold text-slate-900">{app.firstName} {app.lastName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email</p>
                                        <p className="text-sm font-medium text-slate-700">{app.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Phone</p>
                                        <p className="text-sm font-medium text-slate-700">{app.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">DOB</p>
                                        <p className="text-sm font-medium text-slate-700">
                                            {app.dateOfBirth ? format(new Date(app.dateOfBirth), "dd MMM yyyy") : "—"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Loan Summary */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-600">account_balance</span>
                                    Loan & Education Details
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Bank</p>
                                        <p className="text-lg font-bold text-blue-900">{app.bank}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Loan Type</p>
                                        <p className="text-sm font-medium text-blue-700">{app.loanType}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Amount Requested</p>
                                        <p className="text-lg font-bold text-blue-900">₹{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(app.amount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Progress</p>
                                        <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                                            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${app.progress}%` }} />
                                        </div>
                                        <p className="text-xs font-medium text-blue-700 mt-1">{app.progress}%</p>
                                    </div>
                                </div>

                                {/* Vidhyaloan Education Details */}
                                <div className="mt-6 pt-6 border-t border-blue-200">
                                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Education Details</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-white p-3 rounded-lg border border-blue-100">
                                            <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">University</p>
                                            <p className="text-sm font-medium text-slate-900 truncate" title={app.universityName}>{app.universityName || "—"}</p>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-blue-100">
                                            <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Course</p>
                                            <p className="text-sm font-medium text-slate-900 truncate" title={app.courseName}>{app.courseName || "—"}</p>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-blue-100">
                                            <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Country</p>
                                            <p className="text-sm font-medium text-slate-900">{app.country || "—"}</p>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-blue-100">
                                            <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Course Fee</p>
                                            <p className="text-sm font-medium text-slate-900">₹{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(app.courseFeeAmount || 0)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-slate-600">schedule</span>
                                    Timeline
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Submitted</p>
                                        <p className="text-sm font-medium text-slate-900">{app.submittedAt ? format(new Date(app.submittedAt), "dd MMM yyyy") : "—"}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Created</p>
                                        <p className="text-sm font-medium text-slate-900">{format(new Date(app.createdAt), "dd MMM yyyy")}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Stage</p>
                                        <p className="text-sm font-medium text-slate-900 capitalize">{app.stage?.replace(/_/g, " ")}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Days in System</p>
                                        <p className="text-sm font-medium text-slate-900">{Math.floor((new Date().getTime() - new Date(app.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === "details" && (
                        <div className="space-y-6">
                            {/* Guardian Information */}
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Guardian Information</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Guardian Name</p>
                                        <p className="text-lg font-semibold text-slate-900">{app.guardianName || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Occupation</p>
                                        <p className="text-lg font-semibold text-slate-900">{app.guardianOccupation || "—"}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Contact Number</p>
                                        <p className="text-lg font-semibold text-slate-900">{app.guardianPhone || "—"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Risk Assessment */}
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl border border-amber-200">
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-amber-600">warning</span>
                                    Risk Assessment
                                </h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Current Risk Level</p>
                                        <p className={`text-lg font-bold uppercase px-3 py-1 rounded-full inline-block w-fit ${
                                            app.riskLevel === "low" ? "bg-emerald-100 text-emerald-700" :
                                            app.riskLevel === "medium" ? "bg-amber-100 text-amber-700" :
                                            "bg-red-100 text-red-700"
                                        }`}>
                                            {app.riskLevel || "Medium"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Credit Score</p>
                                        <p className="text-2xl font-bold text-slate-900">{app.creditScore || "—"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Mentor & Counselor Assignment */}
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Mentor & Counselor Assignment</h3>
                                
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Assign Mentor</label>
                                    <select
                                        value={selectedMentor}
                                        onChange={(e) => setSelectedMentor(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">— Select Mentor —</option>
                                        <option value="mentor-1">Dr. Raj Kumar (Education Specialist)</option>
                                        <option value="mentor-2">Prof. Sarah Johnson (Career Coach)</option>
                                        <option value="mentor-3">Ms. Priya Singh (Visa Expert)</option>
                                        <option value="mentor-4">Mr. Ahmed Hassan (Scholarship Expert)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Assign Counselor</label>
                                    <select
                                        value={selectedCounselor}
                                        onChange={(e) => setSelectedCounselor(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">— Select Counselor —</option>
                                        <option value="counselor-1">John Smith - Mumbai</option>
                                        <option value="counselor-2">Ananya Patel - Delhi</option>
                                        <option value="counselor-3">Amit Kumar - Bangalore</option>
                                        <option value="counselor-4">Lisa Wong - Pune</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === "remarks" && (
                        <div className="space-y-6">
                            {/* Add New Remark */}
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Add Remark or Suggestion</h3>
                                
                                <div className="mb-4">
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Type</label>
                                    <select
                                        value={remarkType}
                                        onChange={(e) => setRemarkType(e.target.value as any)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="remark">General Remark</option>
                                        <option value="suggestion">Suggestion</option>
                                        <option value="warning">Warning Flag</option>
                                        <option value="approval_note">Approval Note</option>
                                    </select>
                                </div>

                                <textarea
                                    value={newRemark}
                                    onChange={(e) => setNewRemark(e.target.value)}
                                    placeholder="Enter your remark or suggestion..."
                                    rows={5}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />

                                <button
                                    onClick={handleAddRemark}
                                    className="mt-4 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all"
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="material-symbols-outlined">add</span>
                                        Add Remark
                                    </span>
                                </button>
                            </div>

                            {/* Existing Remarks */}
                            {remarks.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-900">Recent Remarks</h4>
                                    {remarks.map((remark) => (
                                        <div key={remark.id} className={`p-4 rounded-lg border-l-4 ${
                                            remark.type === "suggestion" ? "bg-green-50 border-l-green-500" :
                                            remark.type === "warning" ? "bg-red-50 border-l-red-500" :
                                            remark.type === "approval_note" ? "bg-blue-50 border-l-blue-500" :
                                            "bg-slate-50 border-l-slate-500"
                                        }`}>
                                            <div className="flex items-start justify-between mb-2">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                                                    remark.type === "suggestion" ? "bg-green-200 text-green-800" :
                                                    remark.type === "warning" ? "bg-red-200 text-red-800" :
                                                    remark.type === "approval_note" ? "bg-blue-200 text-blue-800" :
                                                    "bg-slate-200 text-slate-800"
                                                }`}>
                                                    {remark.type.replace(/_/g, " ")}
                                                </span>
                                                <p className="text-xs text-slate-500">{format(new Date(remark.createdAt), "dd MMM yyyy HH:mm")}</p>
                                            </div>
                                            <p className="text-sm text-slate-700 font-medium mb-2">{remark.content}</p>
                                            <p className="text-xs text-slate-500">By {remark.author}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {remarks.length === 0 && (
                                <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                                    <span className="material-symbols-outlined text-4xl text-slate-300 block mb-3">note</span>
                                    <p className="text-slate-500 font-medium">No remarks yet</p>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === "documents" && (
                        <div className="space-y-4">
                            {app.documents && app.documents.length > 0 ? (
                                app.documents.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-all">
                                        <div className="flex items-center gap-4 flex-1">
                                            <span className="material-symbols-outlined text-slate-400 text-[24px]">description</span>
                                            <div>
                                                <p className="font-semibold text-slate-900">{doc.docName}</p>
                                                <p className="text-xs text-slate-500 mt-1">Type: {doc.docType}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                doc.status === "verified" ? "bg-emerald-100 text-emerald-700" :
                                                doc.status === "rejected" ? "bg-red-100 text-red-700" :
                                                "bg-amber-100 text-amber-700"
                                            }`}>
                                                {doc.status}
                                            </span>
                                            <button className="p-2 text-slate-400 hover:text-blue-600 transition-all">
                                                <span className="material-symbols-outlined">download</span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                                    <span className="material-symbols-outlined text-4xl text-slate-300 block mb-3">description</span>
                                    <p className="text-slate-500 font-medium">No documents uploaded</p>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === "action" && (
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-slate-600">done_all</span>
                                    Take Action
                                </h3>

                                <div className="mb-6">
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                        Risk Level Assessment
                                    </label>
                                    <div className="flex gap-3">
                                        {(["low", "medium", "high"] as const).map((level) => (
                                            <button
                                                key={level}
                                                onClick={() => setRiskLevel(level)}
                                                className={`px-4 py-2 rounded-lg font-bold uppercase tracking-wider transition-all ${
                                                    riskLevel === level
                                                        ? level === "low"
                                                            ? "bg-emerald-500 text-white"
                                                            : level === "medium"
                                                            ? "bg-amber-500 text-white"
                                                            : "bg-red-500 text-white"
                                                        : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                                }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                        Remarks / Reason
                                    </label>
                                    <textarea
                                        value={actionRemarks}
                                        onChange={(e) => setActionRemarks(e.target.value)}
                                        placeholder="Add your remarks or reason for this action..."
                                        rows={6}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleApprove}
                                        disabled={isSubmitting || !actionRemarks.trim()}
                                        className="w-full px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">check_circle</span>
                                        Approve Application
                                    </button>

                                    <button
                                        onClick={handleSendBackForChanges}
                                        disabled={isSubmitting || !actionRemarks.trim()}
                                        className="w-full px-6 py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">assignment_return</span>
                                        Send Back for Changes
                                    </button>

                                    <button
                                        onClick={handleReject}
                                        disabled={isSubmitting || !actionRemarks.trim()}
                                        className="w-full px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">cancel</span>
                                        Reject Application
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApplicationManagementPanel;
