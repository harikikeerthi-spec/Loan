"use client";

import { useUserDossier } from "../DossierContext";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { documentApi } from "@/lib/api";

const DOC_TYPE_LABELS: Record<string, string> = {
    passport: "Passport",
    visa: "Visa",
    offer_letter: "Offer Letter",
    financial_statement: "Financial Statement",
    bank_statement: "Bank Statement",
    academic_transcript: "Academic Transcript",
    degree_certificate: "Degree Certificate",
    identity_proof: "Identity Proof",
    address_proof: "Address Proof",
    income_proof: "Income Proof",
    loan_sanction: "Loan Sanction Letter",
    insurance: "Insurance",
    ielts_toefl: "IELTS / TOEFL Score",
    lor: "Letter of Recommendation",
    sop: "Statement of Purpose",
    other: "Other Document",
};

const DOC_TYPE_OPTIONS = Object.entries(DOC_TYPE_LABELS).map(([value, label]) => ({ value, label }));

function getDocLabel(doc: any): string {
    const t = doc.docType || doc.type || doc.documentType || "other";
    if (DOC_TYPE_LABELS[t]) return DOC_TYPE_LABELS[t];
    if (t.startsWith("custom_")) {
        return t.replace("custom_", "").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
    }
    return t.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
}

function statusConfig(status: string) {
    const s = (status || "").toLowerCase();
    if (s === "approved" || s === "verified") {
        return {
            label: "Verified",
            className: "bg-emerald-50 text-emerald-700 border-emerald-200",
            icon: "verified",
            iconColor: "text-emerald-600",
        };
    } else if (s === "rejected") {
        return {
            label: "Rejected",
            className: "bg-rose-50 text-rose-700 border-rose-200",
            icon: "block",
            iconColor: "text-rose-500",
        };
    } else {
        return {
            label: "Pending Review",
            className: "bg-amber-50 text-amber-700 border-amber-200",
            icon: "schedule",
            iconColor: "text-amber-500",
        };
    }
}

export default function DocumentsTab() {
    const { userId, userDocuments, setUserDocuments, refreshData } = useUserDossier();
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewName, setPreviewName] = useState<string>("");

    // Upload modal state
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploadDocType, setUploadDocType] = useState("passport");
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reject modal state
    const [rejectDoc, setRejectDoc] = useState<any | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null); // docId being actioned

    // Filter logic: Pending shows documents that are not verified and not rejected
    const filtered = userDocuments.filter((doc) => {
        const label = getDocLabel(doc).toLowerCase();
        const matchesSearch = label.includes(search.toLowerCase());
        const status = (doc.status || "pending").toLowerCase();
        
        const isVerified = status === "approved" || status === "verified";
        const isRejected = status === "rejected";
        const isPending = !isVerified && !isRejected;

        const matchesFilter =
            filterStatus === "all" ||
            (filterStatus === "approved" && isVerified) ||
            (filterStatus === "rejected" && isRejected) ||
            (filterStatus === "pending" && isPending);
            
        return matchesSearch && matchesFilter;
    }).sort((a, b) => {
        const aUploaded = !!(a.uploaded || a.filePath);
        const bUploaded = !!(b.uploaded || b.filePath);
        if (aUploaded !== bUploaded) {
            return aUploaded ? -1 : 1;
        }
        const aTime = new Date(a.updatedAt || a.uploadedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.updatedAt || b.uploadedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
    });

    const stats = {
        total: userDocuments.length,
        verified: userDocuments.filter((d) => {
            const s = (d.status || "").toLowerCase();
            return s === "approved" || s === "verified";
        }).length,
        rejected: userDocuments.filter((d) => (d.status || "").toLowerCase() === "rejected").length,
        pending: userDocuments.filter((d) => {
            const s = (d.status || "").toLowerCase();
            return s !== "approved" && s !== "verified" && s !== "rejected";
        }).length,
    };

    // ── Upload handler ──────────────────────────────────────────────────
    const handleUpload = async () => {
        if (!uploadFile) return;
        setUploading(true);
        setUploadError("");
        try {
            const res = await documentApi.upload(userId, uploadDocType, uploadFile, (pct) => setUploadProgress(pct)) as any;
            const docId = res?.data?.id || res?.data?._id;
            if (docId) {
                // Staff uploads go to verified directly
                await documentApi.accept(docId);
            }
            setIsUploadOpen(false);
            setUploadFile(null);
            setUploadProgress(0);
            await refreshData();
        } catch (err: any) {
            setUploadError(err.message || "Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    // ── Approve handler ─────────────────────────────────────────────────
    const handleApprove = async (doc: any) => {
        const docId = doc.id || doc._id;
        if (!docId) return;
        setActionLoading(docId);
        try {
            await documentApi.accept(docId);
            // Optimistic update
            setUserDocuments(
                userDocuments.map((d) =>
                    (d.id || d._id) === docId ? { ...d, status: "verified" } : d
                )
            );
            await refreshData();
        } catch (err) {
            console.error("Failed to approve document:", err);
        } finally {
            setActionLoading(null);
        }
    };

    // ── Reject handler ──────────────────────────────────────────────────
    const handleReject = async () => {
        if (!rejectDoc) return;
        const docId = rejectDoc.id || rejectDoc._id;
        setActionLoading(docId);
        try {
            await documentApi.reject(docId, rejectReason);
            // Optimistic update
            setUserDocuments(
                userDocuments.map((d) =>
                    (d.id || d._id) === docId ? { ...d, status: "rejected", rejectionReason: rejectReason } : d
                )
            );
            setRejectDoc(null);
            setRejectReason("");
            await refreshData();
        } catch (err) {
            console.error("Failed to reject document:", err);
        } finally {
            setActionLoading(null);
        }
    };

    // ── View Document Handler ───────────────────────────────────────────
    const handleView = async (doc: any) => {
        const docLabel = getDocLabel(doc);
        try {
            const res = await documentApi.getPresignedView(userId, doc.docType) as any;
            if (res && res.url) {
                setPreviewUrl(res.url);
                setPreviewName(docLabel);
            } else {
                setPreviewUrl(`/api/documents/view/${userId}/${doc.docType}`);
                setPreviewName(docLabel);
            }
        } catch (err) {
            console.error("Failed to load view URL:", err);
            setPreviewUrl(`/api/documents/view/${userId}/${doc.docType}`);
            setPreviewName(docLabel);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        Secure Vault Documents
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">All documents uploaded by this student</p>
                </div>
                <button
                    onClick={() => { setIsUploadOpen(true); setUploadError(""); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#6605c7] to-[#8b24e5] hover:opacity-90 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md hover:shadow-purple-500/20 active:scale-95 cursor-pointer border-0"
                >
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    Upload Document
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Total Documents", value: stats.total, icon: "folder", color: "from-indigo-500/10 to-indigo-500/5", text: "text-indigo-600" },
                    { label: "Verified", value: stats.verified, icon: "verified", color: "from-emerald-500/10 to-emerald-500/5", text: "text-emerald-600" },
                    { label: "Pending Review", value: stats.pending, icon: "schedule", color: "from-amber-500/10 to-amber-500/5", text: "text-amber-600" },
                    { label: "Rejected", value: stats.rejected, icon: "block", color: "from-rose-500/10 to-rose-500/5", text: "text-rose-600" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center flex-shrink-0`}>
                            <span className={`material-symbols-outlined text-[22px] ${stat.text}`}>{stat.icon}</span>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                            <p className="text-2xl font-extrabold text-slate-900">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-slate-400">search</span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search documents..."
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:border-[#6605c7] transition-all placeholder:text-slate-400"
                    />
                </div>

                <div className="flex items-center gap-2 bg-slate-100/60 p-1 rounded-xl border border-slate-200/60">
                    {(["all", "pending", "approved", "rejected"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilterStatus(f)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border-0 ${
                                filterStatus === f
                                    ? "bg-white text-[#6605c7] shadow-sm border border-[#6605c7]/10"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                            }`}
                        >
                            {f === "all" ? "All" : f === "approved" ? "Verified" : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Documents Grid */}
            {filtered.length === 0 ? (
                <div className="bg-white/60 border border-white/80 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="w-16 h-16 rounded-2xl bg-[#6605c7]/5 border border-[#6605c7]/10 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-[32px] text-[#6605c7]/40">folder_off</span>
                    </div>
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">
                        {userDocuments.length === 0 ? "No Documents Uploaded" : "No Results Found"}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold mt-2 max-w-xs">
                        {userDocuments.length === 0
                            ? "This student hasn't uploaded any documents to their vault yet."
                            : "Try adjusting your search or filter settings."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((doc: any, idx: number) => {
                        const status = (doc.status || "pending").toLowerCase();
                        const isVerified = status === "approved" || status === "verified";
                        const isRejected = status === "rejected";

                        const { label, className, icon, iconColor } = statusConfig(doc.status);
                        const docLabel = getDocLabel(doc);
                        const uploadDate = doc.createdAt || doc.uploadedAt || doc.created_at;
                        const docId = doc.id || doc._id;
                        const isActioning = actionLoading === docId;

                        return (
                            <motion.div
                                key={docId || idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group flex flex-col justify-between"
                            >
                                <div>
                                    {/* Document preview thumbnail area */}
                                    <div className="relative h-36 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center border-b border-slate-100">
                                        {(doc.uploaded || doc.filePath) ? (
                                            <img
                                                src={`/api/documents/view/${userId}/${doc.docType}`}
                                                alt={docLabel}
                                                className="h-full w-full object-cover opacity-80"
                                                onError={(e) => {
                                                    (e.currentTarget as HTMLImageElement).style.display = "none";
                                                }}
                                            />
                                        ) : null}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[52px] text-slate-300">description</span>
                                        </div>
                                        {/* Hover overlay */}
                                        {(doc.uploaded || doc.filePath) && (
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    onClick={() => handleView(doc)}
                                                    className="px-4 py-2 bg-white text-slate-800 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg hover:bg-[#6605c7] hover:text-white transition-all cursor-pointer border-0 flex items-center gap-1.5"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">visibility</span>
                                                    View
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card body */}
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12px] font-black text-slate-800 truncate">{docLabel}</p>
                                                {uploadDate && (
                                                    <p className="text-[9px] font-bold text-slate-400 mt-0.5 font-mono">
                                                        {new Date(uploadDate).toLocaleDateString("en-IN", {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric",
                                                        })}
                                                    </p>
                                                )}
                                            </div>
                                            <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${className} flex-shrink-0`}>
                                                <span className={`material-symbols-outlined text-[12px] ${iconColor}`}>{icon}</span>
                                                {label}
                                            </span>
                                        </div>

                                        {/* Rejection reason */}
                                        {isRejected && doc.rejectionReason && (
                                            <div className="mb-3 p-2.5 bg-rose-50 rounded-lg border border-rose-100">
                                                <p className="text-[9px] font-black text-rose-600 uppercase tracking-wider mb-1">Rejection Reason</p>
                                                <p className="text-[10px] font-semibold text-rose-700">{doc.rejectionReason}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions area */}
                                <div className="p-4 pt-0">
                                    {/* View / Open / Download row */}
                                    {(doc.uploaded || doc.filePath) && (
                                        <div className="flex gap-2 mb-3">
                                            <button
                                                onClick={() => handleView(doc)}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-[#6605c7] hover:text-white text-slate-700 border border-slate-200 hover:border-[#6605c7] rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border-0"
                                            >
                                                <span className="material-symbols-outlined text-[13px]">visibility</span>
                                                View
                                            </button>
                                            <a
                                                href={`/api/documents/view/${userId}/${doc.docType}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-700 hover:text-white text-slate-700 border border-slate-200 hover:border-slate-700 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer text-decoration-none"
                                            >
                                                <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                                            </a>
                                        </div>
                                    )}

                                    {/* Accept / Reject actions */}
                                    <div className="flex gap-2">
                                        {/* Accept */}
                                        {!isVerified && !isRejected && (
                                            <button
                                                onClick={() => handleApprove(doc)}
                                                disabled={isActioning}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 hover:border-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0"
                                            >
                                                {isActioning ? (
                                                    <span className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-[13px]">check_circle</span>
                                                )}
                                                Accept
                                            </button>
                                        )}
                                        {/* Reject */}
                                        {!isVerified && !isRejected && (
                                            <button
                                                onClick={() => { setRejectDoc(doc); setRejectReason(""); }}
                                                disabled={isActioning}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 hover:border-rose-600 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0"
                                            >
                                                <span className="material-symbols-outlined text-[13px]">block</span>
                                                Reject
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* ── Upload Document Modal ─────────────────────────────────── */}
            <AnimatePresence>
                {isUploadOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => !uploading && setIsUploadOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-white/40"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-gradient-to-r from-[#6605c7]/10 to-[#8b24e5]/10 border-b border-[#6605c7]/10 px-6 py-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#6605c7]/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[20px] text-[#6605c7]">upload_file</span>
                                </div>
                                <div>
                                    <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-wider">Upload Document</h3>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Staff-uploaded docs appear in the Verified tab</p>
                                </div>
                                <button
                                    onClick={() => !uploading && setIsUploadOpen(false)}
                                    className="ml-auto w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all cursor-pointer border-0"
                                >
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Doc Type */}
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Document Type</label>
                                    <select
                                        value={uploadDocType}
                                        onChange={(e) => setUploadDocType(e.target.value)}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6605c7]/20 focus:border-[#6605c7] cursor-pointer transition-all"
                                    >
                                        {DOC_TYPE_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* File Drop Zone */}
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1.5">File</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`relative w-full rounded-xl border-2 border-dashed p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                                            uploadFile
                                                ? "border-[#6605c7] bg-[#6605c7]/5"
                                                : "border-slate-200 bg-slate-50 hover:border-[#6605c7]/50 hover:bg-[#6605c7]/5"
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[32px] text-slate-300">cloud_upload</span>
                                        {uploadFile ? (
                                            <div className="text-center">
                                                <p className="text-[11px] font-black text-[#6605c7]">{uploadFile.name}</p>
                                                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                                                    {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <p className="text-[11px] font-bold text-slate-600">Click to select a file</p>
                                                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">PDF, JPG, PNG up to 10MB</p>
                                            </div>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    setUploadFile(e.target.files[0]);
                                                    setUploadError("");
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Progress bar */}
                                {uploading && (
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#6605c7] to-[#8b24e5] transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                )}

                                {/* Error */}
                                {uploadError && (
                                    <p className="text-[10px] font-bold text-rose-600 bg-rose-50 px-3 py-2 rounded-lg border border-rose-100">
                                        {uploadError}
                                    </p>
                                )}
                            </div>

                            <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end gap-3">
                                <button
                                    onClick={() => !uploading && setIsUploadOpen(false)}
                                    disabled={uploading}
                                    className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-all cursor-pointer border-0"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading || !uploadFile}
                                    className="px-5 py-2 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#6605c7] to-[#8b24e5] hover:opacity-90 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-500/20 border-0"
                                >
                                    {uploading ? `Uploading ${Math.round(uploadProgress)}%...` : "Upload Document"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Reject Modal ───────────────────────────────────────────── */}
            <AnimatePresence>
                {rejectDoc && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setRejectDoc(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-white/40"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-gradient-to-r from-rose-500/10 to-red-500/10 border-b border-rose-200 px-6 py-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[20px] text-rose-600">block</span>
                                </div>
                                <div>
                                    <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-wider">Reject Document</h3>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{getDocLabel(rejectDoc)}</p>
                                </div>
                            </div>

                            <div className="p-6">
                                <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-2">Rejection Reason</label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="E.g. Document is blurry, expired, or doesn't match the required format. Please resubmit a clearer version..."
                                    rows={4}
                                    autoFocus
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none placeholder:text-slate-400 placeholder:text-[10px] transition-all"
                                />
                                <p className="text-[9px] text-slate-400 font-semibold mt-2">
                                    The student will see this reason and can resubmit.
                                </p>
                            </div>

                            <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end gap-3">
                                <button
                                    onClick={() => setRejectDoc(null)}
                                    className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-all cursor-pointer border-0"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={!rejectReason.trim() || !!actionLoading}
                                    className="px-5 py-2 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-rose-500 to-red-600 hover:opacity-90 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0"
                                >
                                    {actionLoading ? "Rejecting..." : "Confirm Rejection"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Document Preview Modal ──────────────────────────────────── */}
            <AnimatePresence>
                {previewUrl && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setPreviewUrl(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.92, opacity: 0 }}
                            className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-3xl w-full max-h-[85vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-[#6605c7]">description</span>
                                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-wider">{previewName}</p>
                                </div>
                                <button
                                    onClick={() => setPreviewUrl(null)}
                                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-rose-500 hover:border-rose-200 transition-all cursor-pointer border-0"
                                >
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto p-2 bg-slate-100 flex items-center justify-center min-h-[400px]">
                                {previewUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) ? (
                                    <img src={previewUrl} alt={previewName} className="max-h-[65vh] max-w-full object-contain rounded-lg shadow" />
                                ) : (
                                    <iframe
                                        src={previewUrl}
                                        title={previewName}
                                        className="w-full h-[65vh] rounded-lg border-0"
                                    />
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
