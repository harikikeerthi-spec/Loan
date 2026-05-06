"use client";
import { useState, useEffect, useCallback } from "react";
import { staffProfileApi } from "@/lib/api";
import DocumentFlowTracker from "./DocumentFlowTracker";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  under_review: "bg-blue-100 text-blue-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-600",
  submitted: "bg-purple-100 text-purple-700",
  shared: "bg-indigo-100 text-indigo-700",
};

const DOCUMENT_TYPES = [
  "Passport",
  "Education Certificate",
  "Work Experience Letter",
  "Bank Statement",
  "IELTS/TOEFL Score",
  "Visa Document",
  "Proof of Residence",
  "Personal Statement",
  "Admission Letter",
  "Other"
];

interface Profile {
  id: string;
  linkedUser: { firstName: string; lastName: string; email: string };
  targetBank: string;
  loanType: string;
  bankStatus: string;
  createdAt: string;
}

interface DocumentItem {
  id: string;
  docType: string;
  status: string;
  uploadedAt: string;
  description?: string;
}

interface ShareEntry {
  id: string;
  bankName: string;
  bankEmail: string;
  sharedAt: string;
  expiresAt: string;
  accessNote: string;
  documentCount: number;
}

export default function DocumentTransferCenter() {
  const [view, setView] = useState<"dashboard" | "profile" | "transfer">("dashboard");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [shares, setShares] = useState<ShareEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filterBank, setFilterBank] = useState("all");
  const [stats, setStats] = useState({ total: 0, pending: 0, shared: 0, expired: 0 });

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareForm, setShareForm] = useState({
    bank_name: "",
    bank_email: "",
    expires_in_days: 7,
    access_note: "",
    selectedDocs: [] as string[]
  });
  const [sharing, setSharing] = useState(false);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    docType: "",
    description: ""
  });
  const [uploading, setUploading] = useState(false);

  // Load profiles
  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await staffProfileApi.list({ search: search || undefined });
      const profileList = res.data || [];
      setProfiles(profileList);

      // Calculate stats
      let totalDocs = 0;
      let pendingDocs = 0;
      let sharedDocs = 0;

      profileList.forEach((p: any) => {
        const profileDocs = p.documents || [];
        totalDocs += profileDocs.length;
        pendingDocs += profileDocs.filter((d: any) => d.status === "pending").length;
        sharedDocs += profileDocs.filter((d: any) => d.status === "shared").length;
      });

      setStats({
        total: totalDocs,
        pending: pendingDocs,
        shared: sharedDocs,
        expired: 0
      });

      // Extract unique banks
      const uniqueBanks = [...new Set(profileList.map((p: any) => p.targetBank).filter(Boolean))];
      setBanks(uniqueBanks.map(b => ({ name: b })));
    } catch (error) {
      console.error("Failed to load profiles:", error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // Load profile details
  const loadProfileDetails = async (profileId: string) => {
    try {
      const res: any = await staffProfileApi.get(profileId);
      const profile = res.data || res;
      setSelectedProfile(profile);
      setDocuments(profile.documents || []);
      setShares(profile.shares || []);
      setView("profile");
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  };

  // Fetch user documents
  const handleFetchUserDocuments = async () => {
    if (!selectedProfile) return;
    try {
      await staffProfileApi.fetchUserDocuments(selectedProfile.id);
      await loadProfileDetails(selectedProfile.id);
      alert("Documents fetched successfully!");
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      alert("Failed to fetch documents");
    }
  };

  // Update document status
  const handleUpdateDocStatus = async (docId: string, newStatus: string) => {
    if (!selectedProfile) return;
    try {
      await staffProfileApi.updateDocumentStatus(selectedProfile.id, docId, newStatus);
      await loadProfileDetails(selectedProfile.id);
    } catch (error) {
      console.error("Failed to update document status:", error);
      alert("Failed to update document status");
    }
  };

  // Handle document upload
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile || !uploadForm.file || !uploadForm.docType) {
      alert("Please select a file and document type");
      return;
    }

    setUploading(true);
    try {
      await staffProfileApi.uploadDocument(
        selectedProfile.id,
        uploadForm.file,
        uploadForm.docType,
        uploadForm.description
      );
      setShowUploadModal(false);
      setUploadForm({ file: null, docType: "", description: "" });
      await loadProfileDetails(selectedProfile.id);
    } catch (error) {
      console.error("Failed to upload document:", error);
      alert("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  // Share documents with bank
  const handleShareWithBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile || shareForm.selectedDocs.length === 0) {
      alert("Please select at least one document");
      return;
    }

    setSharing(true);
    try {
      const result: any = await staffProfileApi.shareWithBank(selectedProfile.id, {
        doc_ids: shareForm.selectedDocs,
        bank_name: shareForm.bank_name,
        bank_email: shareForm.bank_email,
        expires_in_days: shareForm.expires_in_days,
        access_note: shareForm.access_note
      });

      setShowShareModal(false);
      setShareForm({
        bank_name: "",
        bank_email: "",
        expires_in_days: 7,
        access_note: "",
        selectedDocs: []
      });
      
      // Show share link
      if (result.share_link) {
        alert(`Documents shared successfully!\nShare Link: ${result.share_link}`);
      }

      await loadProfileDetails(selectedProfile.id);
    } catch (error: any) {
      console.error("Failed to share documents:", error);
      alert(`Failed to share documents: ${error.message}`);
    } finally {
      setSharing(false);
    }
  };

  // Remove document
  const handleRemoveDocument = async (docId: string) => {
    if (!selectedProfile || !confirm("Are you sure you want to remove this document?")) return;

    try {
      await staffProfileApi.removeDocument(selectedProfile.id, docId);
      await loadProfileDetails(selectedProfile.id);
    } catch (error) {
      console.error("Failed to remove document:", error);
      alert("Failed to remove document");
    }
  };

  // Dashboard View
  if (view === "dashboard") {
    const filteredProfiles = profiles.filter((p: Profile) => {
      const matchesSearch = p.linkedUser.firstName.toLowerCase().includes(search.toLowerCase()) ||
        p.linkedUser.lastName.toLowerCase().includes(search.toLowerCase()) ||
        p.linkedUser.email.toLowerCase().includes(search.toLowerCase());
      const matchesBank = filterBank === "all" || p.targetBank === filterBank;
      return matchesSearch && matchesBank;
    });

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-slate-100 pb-6">
          <h2 className="text-[28px] font-black text-slate-900 tracking-tight">Document Transfer Center</h2>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">
            Intermediary hub for student-to-bank document transfers
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Total Documents</div>
            <div className="text-[32px] font-black text-slate-900">{stats.total}</div>
            <div className="text-[10px] text-slate-400 mt-2">Across all profiles</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-widest text-amber-600 mb-2">Pending Review</div>
            <div className="text-[32px] font-black text-amber-600">{stats.pending}</div>
            <div className="text-[10px] text-slate-400 mt-2">Awaiting status update</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 mb-2">Shared</div>
            <div className="text-[32px] font-black text-indigo-600">{stats.shared}</div>
            <div className="text-[10px] text-slate-400 mt-2">With banks</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-widest text-rose-600 mb-2">Share Expiry</div>
            <div className="text-[32px] font-black text-rose-600">{stats.expired}</div>
            <div className="text-[10px] text-slate-400 mt-2">Soon or expired</div>
          </div>
        </div>

        {/* Document Flow Tracker - Visual Pipeline */}
        <DocumentFlowTracker
          studentDocCount={profiles.reduce((acc, p: any) => acc + (p.documents?.length || 0), 0)}
          staffDocCount={Math.ceil(stats.total * 0.7)}
          bankDocCount={stats.shared}
          sharedCount={stats.shared}
          lastActivity={new Date()}
        />

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[250px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search applicants..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-[13px] bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
            />
          </div>
          <select
            value={filterBank}
            onChange={(e) => setFilterBank(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg text-[13px] bg-slate-50 focus:outline-none"
          >
            <option value="all">All Banks</option>
            {banks.map((b) => (
              <option key={b.name} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Profiles Table */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl text-slate-200 block mb-3">folder_open</span>
            <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">No profiles found</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Applicant", "Loan Type", "Target Bank", "Documents", "Status", "Last Activity", "Action"].map((h) => (
                    <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.map((profile) => (
                  <tr key={profile.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-[14px] font-bold text-slate-900">
                        {profile.linkedUser.firstName} {profile.linkedUser.lastName}
                      </p>
                      <p className="text-[11px] text-slate-400">{profile.linkedUser.email}</p>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-slate-600">{profile.loanType || "—"}</td>
                    <td className="px-6 py-4 text-[13px] text-slate-600">{profile.targetBank || "—"}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                        <span className="material-symbols-outlined text-[14px]">description</span>
                        {(profile as any).documents?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-block ${STATUS_COLORS[profile.bankStatus] || "bg-slate-100 text-slate-500"}`}>
                        {profile.bankStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[12px] text-slate-400">
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => loadProfileDetails(profile.id)}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // Profile Detail View
  if (view === "profile" && selectedProfile) {
    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
          <div>
            <button
              onClick={() => setView("dashboard")}
              className="flex items-center gap-1.5 text-indigo-600 font-bold text-[13px] mb-3 hover:text-indigo-700"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Dashboard
            </button>
            <h2 className="text-[28px] font-black text-slate-900 tracking-tight">
              {selectedProfile.linkedUser.firstName} {selectedProfile.linkedUser.lastName}
            </h2>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">
              {selectedProfile.linkedUser.email}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleFetchUserDocuments}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">sync</span>
              Sync Documents
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2.5 bg-slate-900 text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              Upload Document
            </button>
          </div>
        </div>

        {/* Profile Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Loan Type</div>
            <div className="text-[16px] font-black text-slate-900">{selectedProfile.loanType || "—"}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Target Bank</div>
            <div className="text-[16px] font-black text-slate-900">{selectedProfile.targetBank || "—"}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Bank Status</div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-block ${STATUS_COLORS[selectedProfile.bankStatus] || "bg-slate-100 text-slate-500"}`}>
              {selectedProfile.bankStatus}
            </span>
          </div>
        </div>

        {/* Two Column Layout: Documents + Shares */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Documents Section */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <h3 className="text-[18px] font-black text-slate-900">Documents</h3>
                <button
                  onClick={() => {
                    setShareForm({
                      bank_name: selectedProfile.targetBank || "",
                      bank_email: "",
                      expires_in_days: 7,
                      access_note: "",
                      selectedDocs: documents.map(d => d.id)
                    });
                    setShowShareModal(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">share</span>
                  Share with Bank
                </button>
              </div>

              {documents.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-4xl text-slate-200 block mb-3">description</span>
                  <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">No documents yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="p-4 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                          <span className="material-symbols-outlined text-slate-600 group-hover:text-indigo-600">description</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] font-bold text-slate-900">{doc.docType}</p>
                          {doc.description && <p className="text-[11px] text-slate-500">{doc.description}</p>}
                          <p className="text-[10px] text-slate-400 mt-1">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${STATUS_COLORS[doc.status] || "bg-slate-100 text-slate-500"}`}>
                          {doc.status}
                        </span>
                        <div className="flex gap-1">
                          <select
                            value={doc.status}
                            onChange={(e) => handleUpdateDocStatus(doc.id, e.target.value)}
                            className="px-2 py-1 text-[10px] border border-slate-200 rounded-lg focus:outline-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="under_review">Under Review</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          <button
                            onClick={() => handleRemoveDocument(doc.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Share History */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="text-[18px] font-black text-slate-900 mb-6 pb-4 border-b border-slate-100">Share History</h3>

            {shares.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-4xl text-slate-200 block mb-3">share</span>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No shares yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shares.map((share) => (
                  <div key={share.id} className="p-3 border border-slate-100 rounded-lg hover:border-indigo-200 transition-colors">
                    <p className="text-[12px] font-bold text-slate-900">{share.bankName}</p>
                    <p className="text-[10px] text-slate-500">{share.bankEmail}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-[10px] text-slate-500">
                        <span className="font-bold">Shared:</span> {new Date(share.sharedAt).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        <span className="font-bold">Expires:</span> {new Date(share.expiresAt).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        <span className="font-bold">Documents:</span> {share.documentCount}
                      </p>
                    </div>
                    {share.accessNote && (
                      <p className="text-[10px] text-slate-600 italic mt-2 p-2 bg-slate-50 rounded">
                        "{share.accessNote}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
              <h3 className="text-[20px] font-black text-slate-900 mb-6">Upload Document</h3>
              <form onSubmit={handleUploadDocument} className="space-y-4">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-2">Document Type *</label>
                  <select
                    value={uploadForm.docType}
                    onChange={(e) => setUploadForm(f => ({ ...f, docType: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-[13px] bg-slate-50 focus:outline-none"
                    required
                  >
                    <option value="">-- Select document type --</option>
                    {DOCUMENT_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-2">File *</label>
                  <input
                    type="file"
                    onChange={(e) => setUploadForm(f => ({ ...f, file: e.target.files?.[0] || null }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-[13px] bg-slate-50 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-2">Description</label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(f => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-[13px] bg-slate-50 focus:outline-none resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 py-3 bg-slate-900 text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50"
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadForm({ file: null, docType: "", description: "" });
                    }}
                    className="px-6 py-3 border border-slate-200 rounded-lg text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
              <h3 className="text-[20px] font-black text-slate-900 mb-6">Share Documents with Bank</h3>
              <form onSubmit={handleShareWithBank} className="space-y-4">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-2">Bank Name *</label>
                  <input
                    value={shareForm.bank_name}
                    onChange={(e) => setShareForm(f => ({ ...f, bank_name: e.target.value }))}
                    placeholder="e.g. HDFC Bank"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-[13px] bg-slate-50 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-2">Bank Email *</label>
                  <input
                    type="email"
                    value={shareForm.bank_email}
                    onChange={(e) => setShareForm(f => ({ ...f, bank_email: e.target.value }))}
                    placeholder="bank@example.com"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-[13px] bg-slate-50 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-2">Expires In (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={shareForm.expires_in_days}
                    onChange={(e) => setShareForm(f => ({ ...f, expires_in_days: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-[13px] bg-slate-50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-2">Access Note</label>
                  <textarea
                    value={shareForm.access_note}
                    onChange={(e) => setShareForm(f => ({ ...f, access_note: e.target.value }))}
                    placeholder="Add any special instructions or notes..."
                    rows={2}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-[13px] bg-slate-50 focus:outline-none resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={sharing}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {sharing ? "Sharing..." : "Share Documents"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowShareModal(false);
                      setShareForm({
                        bank_name: "",
                        bank_email: "",
                        expires_in_days: 7,
                        access_note: "",
                        selectedDocs: []
                      });
                    }}
                    className="px-6 py-3 border border-slate-200 rounded-lg text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
