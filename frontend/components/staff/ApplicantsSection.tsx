"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { staffProfileApi, adminApi } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600 border border-amber-100",
  under_review: "bg-blue-50 text-blue-600 border border-blue-100",
  approved: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  rejected: "bg-rose-50 text-rose-600 border border-rose-100",
  requires_resubmission: "bg-orange-50 text-orange-600 border border-orange-100",
  NOT_SENT: "bg-slate-50 text-slate-400 border border-slate-100",
  PENDING: "bg-amber-50 text-amber-600 border border-amber-100",
  UNDER_REVIEW: "bg-blue-50 text-blue-600 border border-blue-100",
  APPROVED: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  REJECTED: "bg-rose-50 text-rose-600 border border-rose-100",
};

/* ── Profile List View ─────────────────────────────────── */
function ProfileList({ onSelect, onlineEmails = [] }: { onSelect: (p: any) => void; onlineEmails?: string[] }) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ linked_user_id: "", target_bank: "", loan_type: "", internal_notes: "" });
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pr, ur]: any[] = await Promise.all([
        staffProfileApi.list({ search }),
        adminApi.getUsers(),
      ]);
      setProfiles(pr.data || []);
      setUsers(ur.data || []);
    } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const usersWithoutProfile = users.filter(
    (u: any) => !profiles.find((p: any) => p.linkedUserId === u.id) && u.role === "user"
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.linked_user_id) return;
    setCreating(true);
    try {
      const res: any = await staffProfileApi.create(form);
      setShowCreate(false);
      setForm({ linked_user_id: "", target_bank: "", loan_type: "", internal_notes: "" });
      setMsg("Profile created.");
      
      // Log activity for profile creation
      const selectedUser = users.find(u => u.id === form.linked_user_id);
      if (selectedUser) {
        await staffProfileApi.logActivity({
          type: 'new',
          msg: `Created staff profile for ${selectedUser.firstName} ${selectedUser.lastName}` + (form.target_bank ? ` for ${form.target_bank}` : ''),
          icon: 'person_add',
          color: 'text-emerald-600 bg-emerald-50'
        }).catch(console.error);
      }
      
      load();
    } catch (err: any) { setMsg(err.message || "Failed"); }
    finally { setCreating(false); }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 pb-6 mb-2">
        <div>
          <h2 className="text-[32px] font-black text-slate-900 tracking-tight flex items-center gap-3 font-display">
             Applicant Profiles
          </h2>
          <p className="text-[13px] font-medium text-slate-500 mt-2">
            Manage and audit intermediary application profiles.
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search directory..."
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-[13px] font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-64 shadow-sm" />
          </div>
          <button onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20">
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Create Profile
          </button>
        </div>
      </div>

      {/* Real-time User Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: "Total Registered Users", val: users.filter(u => u.role === 'user').length, icon: "group", color: "from-blue-600 to-blue-400", bg: "bg-blue-50/50", border: "border-blue-100", textColor: "text-blue-600" },
          { label: "Profiles Onboarded", val: profiles.length, icon: "folder_shared", color: "from-emerald-600 to-emerald-400", bg: "bg-emerald-50/50", border: "border-emerald-100", textColor: "text-emerald-600" },
          { label: "Pending Onboarding", val: usersWithoutProfile.length, icon: "sync_problem", color: "from-amber-500 to-amber-300", bg: "bg-amber-50/50", border: "border-amber-100", textColor: "text-amber-600" }
        ].map((stat, i) => (
          <div key={i} className={`relative overflow-hidden rounded-2xl border ${stat.border} ${stat.bg} p-6 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
            <div className={`absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`}></div>
            <div className="relative z-10 flex items-center gap-5">
              <div className={`w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center border ${stat.border}`}>
                <span className={`material-symbols-outlined text-[28px] ${stat.textColor}`}>{stat.icon}</span>
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1">{stat.label}</p>
                <h3 className={`text-[32px] font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r ${stat.color}`}>{stat.val}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {msg && (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 text-[13px] font-bold animate-in slide-in-from-top-4">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          {msg}
        </div>
      )}

      {/* Create Profile Modal remains the same */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h3 className="text-lg font-semibold text-slate-900">Onboard Applicant</h3>
               <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                  <span className="material-symbols-outlined text-xl">close</span>
               </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div>
                <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">Select User <span className="text-red-500">*</span></label>
                <select value={form.linked_user_id} onChange={e => setForm(f => ({ ...f, linked_user_id: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" required>
                  <option value="">-- Choose registered student --</option>
                  {usersWithoutProfile.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">Target Bank</label>
                  <input value={form.target_bank} onChange={e => setForm(f => ({ ...f, target_bank: e.target.value }))}
                    placeholder="e.g. HDFC" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">Loan Type</label>
                  <input value={form.loan_type} onChange={e => setForm(f => ({ ...f, loan_type: e.target.value }))}
                    placeholder="e.g. Education" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">Internal Notes</label>
                <textarea value={form.internal_notes} onChange={e => setForm(f => ({ ...f, internal_notes: e.target.value }))}
                  rows={3} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none" placeholder="Enter processing details..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-50 shadow-sm">
                  {creating ? "Processing..." : "Complete Onboarding"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">{[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-50 animate-pulse rounded-[32px] border-2 border-slate-50" />
        ))}</div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-24 bg-slate-50/50 rounded-[40px] border-4 border-dashed border-slate-100">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
             <span className="material-symbols-outlined text-5xl text-slate-200">manage_accounts</span>
          </div>
          <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest">No applicant profiles found</p>
          <p className="text-[12px] text-slate-400 mt-2">Try adjusting your search or create a new profile.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="bg-white border-b border-slate-100 shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
                  {["Applicant Profile", "Processing Details", "Service Provider", "Status Tracking", "Date Added", "Control"].map(h => (
                    <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profiles.map((p: any) => {
                  const isOnline = p.linkedUser?.email && onlineEmails.map(e => e.toLowerCase()).includes(p.linkedUser.email.toLowerCase());
                  return (
                    <tr key={p.id} className="group hover:bg-slate-50/80 border-b border-slate-100 transition-all shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
                      <td className="px-6 py-5">
                        <div onClick={() => onSelect(p)} className="flex items-center gap-4 cursor-pointer group/profile">
                          <div className="relative">
                            <div className="w-11 h-11 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-600 text-[13px] shadow-sm group-hover/profile:scale-110 transition-transform duration-300">
                              {p.linkedUser?.firstName?.[0]}{p.linkedUser?.lastName?.[0]}
                            </div>
                            {isOnline && (
                              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse shadow-sm shadow-emerald-500/30" title="Online now" />
                            )}
                          </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-slate-900 tracking-tight truncate group-hover/profile:text-indigo-600 group-hover/profile:underline transition-colors font-display">
                            {p.linkedUser?.firstName} {p.linkedUser?.lastName}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                              <span className="material-symbols-outlined text-[12px] text-emerald-500">verified_user</span>
                              <span className="text-[10px] font-semibold text-slate-500 truncate">{p.linkedUser?.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <p className="text-[13px] font-bold text-slate-700">{p.loanType || "General Loan"}</p>
                       <p className="text-[10px] font-semibold text-slate-400 font-mono mt-0.5">FIN-AID</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center border border-sky-100">
                             <span className="material-symbols-outlined text-sky-600 text-[16px]">account_balance</span>
                         </div>
                         <span className="text-[13px] font-bold text-slate-700">{p.targetBank || "Internal Pool"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] inline-flex items-center gap-1.5 shadow-sm ${STATUS_COLORS[p.bankStatus] || "bg-slate-50 text-slate-600 border border-slate-200"}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                        {p.bankStatus?.replace(/_/g, ' ') || 'Initiated'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                          <p className="text-[12px] font-bold text-slate-800">
                              {new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">schedule</span>
                              {new Date(p.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <button onClick={() => onSelect(p)}
                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 flex items-center justify-center transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5" title="Audit Application">
                        <span className="material-symbols-outlined text-[20px]">folder_open</span>
                      </button>
                    </td>
                  </tr>
                ); })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Profile Detail View ───────────────────────────────── */
function ProfileDetail({ profile, onBack }: { profile: any; onBack: () => void }) {
  const [docs, setDocs] = useState<any[]>([]);
  const [shares, setShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [msg, setMsg] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [shareForm, setShareForm] = useState({ bank_name: profile.targetBank || "", bank_email: "", expires_in_days: 7, access_note: "", selectedDocs: [] as string[] });
  const [sharing, setSharing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadDocType, setUploadDocType] = useState<string>('OTHER');
  const [shareResult, setShareResult] = useState<any>(null);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const [dr, sr]: any[] = await Promise.all([
        staffProfileApi.getDocuments(profile.id),
        staffProfileApi.getShares(profile.id),
      ]);
      setDocs(dr.data || []);
      setShares(sr.data || []);
    } finally { setLoading(false); }
  }, [profile.id]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const fetchUserDocs = async () => {
    setFetching(true); setMsg("");
    try {
      const res: any = await staffProfileApi.fetchUserDocuments(profile.id);
      setMsg(`✓ ${res.fetched} document(s) fetched. ${res.skipped} already attached.`);
      loadDocs();
    } catch (e: any) { setMsg("✗ Fetch failed: " + e.message); }
    finally { setFetching(false); }
  };

  const updateStatus = async (docId: string, status: string) => {
    setMsg("");
    try {
      await staffProfileApi.updateDocumentStatus(profile.id, docId, status);
      setMsg(`✓ Status updated to "${status}" and synced to user profile.`);
      
      // Log activity for document status update
      const doc = docs.find(d => d.id === docId);
      const activityType = status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'update';
      const icons: Record<string, string> = { 'approved': 'task_alt', 'rejected': 'close', 'update': 'edit' };
      const colors: Record<string, string> = {
        'approved': 'text-emerald-600 bg-emerald-50',
        'rejected': 'text-rose-600 bg-rose-50',
        'update': 'text-blue-600 bg-blue-50'
      };
      
      await staffProfileApi.logActivity({
        type: activityType,
        msg: `Updated ${doc?.docType?.replace(/_/g, ' ') || 'document'} status to ${status} for ${profile.linkedUser?.firstName} ${profile.linkedUser?.lastName}`,
        icon: icons[status] || 'event_note',
        color: colors[status] || 'text-slate-600 bg-slate-50'
      }).catch(console.error);
      
      loadDocs();
    } catch (e: any) { setMsg("✗ " + e.message); }
  };

  const removeDoc = async (docId: string) => {
    if (!confirm("Detach this document from the profile?")) return;
    const removedDoc = docs.find(d => d.id === docId);
    await staffProfileApi.removeDocument(profile.id, docId);
    
    // Log activity for document removal
    if (removedDoc) {
      await staffProfileApi.logActivity({
        type: 'rejected',
        msg: `Removed ${removedDoc.docType?.replace(/_/g, ' ') || 'document'} for ${profile.linkedUser?.firstName} ${profile.linkedUser?.lastName}`,
        icon: 'delete',
        color: 'text-rose-600 bg-rose-50'
      }).catch(console.error);
    }
    
    loadDocs();
  };

  const triggerUpload = (type: string) => {
    setUploadDocType(type);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await staffProfileApi.uploadDocument(profile.id, file, uploadDocType);
      setMsg("✓ Document uploaded successfully.");
      
      // Log activity for document upload
      await staffProfileApi.logActivity({
        type: 'upload',
        msg: `Uploaded ${uploadDocType.replace(/_/g, ' ')} for ${profile.linkedUser?.firstName} ${profile.linkedUser?.lastName}`,
        icon: 'cloud_upload',
        color: 'text-purple-600 bg-purple-50'
      }).catch(console.error);
      
      loadDocs();
    } catch (e: any) { 
      setMsg("✗ Failed to upload: " + e.message); 
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareForm.selectedDocs.length) { setMsg("Select at least one document."); return; }
    setSharing(true);
    try {
      const res: any = await staffProfileApi.shareWithBank(profile.id, {
        doc_ids: shareForm.selectedDocs,
        bank_name: shareForm.bank_name,
        bank_email: shareForm.bank_email,
        expires_in_days: shareForm.expires_in_days,
        access_note: shareForm.access_note,
      });
      setShareResult(res.data);
      setShowShare(false);
      
      // Log activity for share with bank
      const docCount = shareForm.selectedDocs.length;
      await staffProfileApi.logActivity({
        type: 'share',
        msg: `Shared ${docCount} document(s) with ${shareForm.bank_name} (${shareForm.bank_email})`,
        icon: 'share',
        color: 'text-indigo-600 bg-indigo-50'
      }).catch(console.error);
      
      loadDocs();
    } catch (e: any) { setMsg("✗ " + e.message); }
    finally { setSharing(false); }
  };

  const toggleDoc = (id: string) => {
    setShareForm(f => ({
      ...f,
      selectedDocs: f.selectedDocs.includes(id)
        ? f.selectedDocs.filter(d => d !== id)
        : [...f.selectedDocs, id],
    }));
  };

  const loadPreview = async (doc: any) => {
    setSelectedDoc(doc);
    setPreviewLoading(true);
    setPreviewUrl(null);
    try {
      // If doc already carries a previewUrl (S3 presigned URL) from the API, use it.
      if (doc.previewUrl) {
        setPreviewUrl(doc.previewUrl);
        return;
      }
      // Fallback: fetch a fresh presigned URL from the backend
      if (doc.filePath && !doc.filePath.startsWith('in.gov.') && !doc.filePath.startsWith('http')) {
        // For staff-profile docs, the filePath is an S3 key — ask backend for a signed URL
        // We don't have userId here, so use the view endpoint with the doc's userId if available
        const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
        const token = typeof window !== 'undefined'
          ? (localStorage.getItem('staffAccessToken') || localStorage.getItem('adminAccessToken') || localStorage.getItem('accessToken'))
          : null;
        const res = await fetch(`${API_URL}/documents/presigned-view/${profile.linkedUserId || ''}/${doc.docType}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setPreviewUrl(data.url);
          return;
        }
      }
      // Last resort: try the direct /uploads/ path (legacy local files)
      if (doc.filePath) {
        const fileName = doc.filePath.replace('./uploads/', '').replace('uploads/', '');
        setPreviewUrl(`/uploads/${fileName}`);
      }
    } catch (e) {
      console.error('Failed to load preview', e);
    } finally {
      setPreviewLoading(false);
    }
  };


  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
            <span className="material-symbols-outlined text-slate-500 text-xl">arrow_back</span>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 font-display">
              {profile.linkedUser?.firstName} {profile.linkedUser?.lastName}
            </h2>
            <p className="text-sm text-slate-500">
              {profile.loanType || "Education Loan"} · {profile.targetBank || "No Target Bank"}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchUserDocs} disabled={fetching}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50 shadow-sm">
            <span className="material-symbols-outlined text-lg">{fetching ? "sync" : "cloud_download"}</span>
            {fetching ? "Fetching..." : "Fetch User Documents"}
          </button>
          <button onClick={() => { setShowShare(true); setShareForm(f => ({ ...f, selectedDocs: docs.map((d: any) => d.id) })); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-lg">share</span>
            Share with Bank
          </button>
          <button 
            onClick={() => {
              // Log activity for complete profile share
              staffProfileApi.logActivity({
                type: 'share',
                msg: `Initiated complete profile share for ${profile.linkedUser?.firstName} ${profile.linkedUser?.lastName}`,
                icon: 'send',
                color: 'text-indigo-600 bg-indigo-50'
              }).catch(console.error);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-600/20">
            <span className="material-symbols-outlined text-lg">send</span>
            Share Complete Profile
          </button>
        </div>
      </div>

      {msg && (
        <p className={`text-[13px] font-bold px-4 py-3 rounded-lg ${msg.startsWith("✓") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
          {msg}
        </p>
      )}

      {shareResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <p className="text-[13px] font-bold text-emerald-800 mb-2">✓ Shared successfully with {shareResult.bank_name || "bank"}!</p>
          <div className="flex items-center gap-3">
            <input readOnly value={shareResult.share_url} className="flex-1 px-3 py-2 bg-white border border-emerald-200 rounded-lg text-[12px] font-mono" />
            <button onClick={() => { navigator.clipboard.writeText(shareResult.share_url); }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[11px] font-black">Copy</button>
          </div>
          <p className="text-[11px] text-emerald-600 mt-2">Expires: {new Date(shareResult.expires_at).toLocaleDateString()}</p>
        </div>
      )}

      {/* Documents Section - Card Style as per image */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-slate-100/80 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-600 text-lg">expand_more</span>
            <h3 className="text-sm font-semibold text-slate-700">My Documents</h3>
          </div>
          <div className="flex gap-4 text-[11px] font-medium text-blue-600">
             <button className="flex items-center gap-1 hover:underline"><span className="material-symbols-outlined text-sm">add</span> Expand all sections</button>
             <button className="flex items-center gap-1 hover:underline"><span className="material-symbols-outlined text-sm">remove</span> Collapse all sections</button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-sm font-semibold text-slate-800">
            Accepted file types: DOCX, PDF, Image and Text <span className="font-normal text-slate-500">(MSG, PPT and XLS file types are not accepted for resume or cover letters)</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Dynamic cards for common types + other attachments */}
            {['RESUME', 'COVER_LETTER', 'PROFILE_PICTURE'].map((type) => {
              const doc = docs.find(d => d.docType === type);
              const label = type === 'RESUME' ? 'Resume/CV' : type === 'COVER_LETTER' ? 'Cover Letter' : 'Profile Picture';
              const isRequired = type !== 'COVER_LETTER';

              return (
                <div key={type} className="space-y-2">
                  <label className="text-[13px] font-semibold text-slate-700">
                    {isRequired && <span className="text-red-500 mr-1">*</span>}
                    {label}
                  </label>
                  <div className="relative aspect-[4/3] bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col group hover:shadow-lg hover:-translate-y-1 hover:border-indigo-300 transition-all duration-300">
                    {doc ? (
                      <>
                        <div className="flex-1 bg-gradient-to-br from-slate-50 to-white flex flex-col items-center justify-center p-4 text-center">
                          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm border border-indigo-100">
                              <span className="material-symbols-outlined text-[28px] text-indigo-500">description</span>
                          </div>
                          <p className="text-[12px] font-bold text-slate-900 line-clamp-2 px-2">{doc.originalFilename || doc.docType}</p>
                          <span className={`mt-3 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${STATUS_COLORS[doc.status] || "bg-slate-100"}`}>
                            {doc.status}
                          </span>
                        </div>
                        <div className="h-12 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-4">
                           <button onClick={() => loadPreview(doc)} className="w-8 h-8 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-all">
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                           </button>
                           <div className="relative flex items-center">
                             <select value={doc.status} onChange={e => updateStatus(doc.id, e.target.value)}
                               className="bg-transparent text-[10px] font-black uppercase tracking-wider text-slate-600 hover:text-slate-900 focus:outline-none border-none p-1 cursor-pointer appearance-none pr-4">
                                <option value="pending">PENDING</option>
                                <option value="under_review">REVIEW</option>
                                <option value="approved">APPROVE</option>
                                <option value="rejected">REJECT</option>
                             </select>
                             <span className="material-symbols-outlined text-[14px] text-slate-400 absolute right-0 pointer-events-none">expand_more</span>
                           </div>
                           <button onClick={() => removeDoc(doc.id)} className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                           </button>
                        </div>
                      </>
                    ) : (
                      <button 
                        onClick={() => triggerUpload(type)}
                        disabled={uploading}
                        className="flex-1 bg-slate-50/50 flex flex-col items-center justify-center p-4 text-center border-2 border-dashed border-slate-200 m-2 rounded-xl hover:border-indigo-300 hover:bg-slate-100 transition-all group/slot"
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 group-hover/slot:bg-indigo-50 group-hover/slot:text-indigo-600 transition-colors">
                           {uploading && uploadDocType === type ? (
                             <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                           ) : (
                             <span className="material-symbols-outlined text-[20px]">add</span>
                           )}
                        </div>
                        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">{uploading && uploadDocType === type ? 'Uploading...' : 'Click to Upload'}</p>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-[13px] font-semibold text-slate-700 mb-4">Other Attachments</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {docs.filter(d => !['RESUME', 'COVER_LETTER', 'PROFILE_PICTURE'].includes(d.docType)).map((doc) => (
                <div key={doc.id} className="space-y-2">
                  <label className="text-[13px] font-semibold text-slate-700 truncate block">
                    {doc.originalFilename || doc.docType}
                  </label>
                  <div className="relative aspect-[4/3] bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col group hover:shadow-lg hover:-translate-y-1 hover:border-indigo-300 transition-all duration-300">
                    <div className="flex-1 bg-gradient-to-br from-slate-50 to-white flex flex-col items-center justify-center p-4 text-center">
                      <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm border border-indigo-100">
                          <span className="material-symbols-outlined text-[28px] text-indigo-500">attachment</span>
                      </div>
                      <p className="text-[12px] font-bold text-slate-900 line-clamp-2 px-2">{doc.originalFilename || doc.docType}</p>
                      <span className={`mt-3 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${STATUS_COLORS[doc.status] || "bg-slate-100"}`}>
                        {doc.status}
                      </span>
                    </div>
                    <div className="h-12 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-4">
                        <button onClick={() => loadPreview(doc)} className="w-8 h-8 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-all">
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <div className="relative flex items-center">
                          <select value={doc.status} onChange={e => updateStatus(doc.id, e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase tracking-wider text-slate-600 hover:text-slate-900 focus:outline-none border-none p-1 cursor-pointer appearance-none pr-4">
                            <option value="pending">PENDING</option>
                            <option value="approved">APPROVE</option>
                            <option value="rejected">REJECT</option>
                          </select>
                          <span className="material-symbols-outlined text-[14px] text-slate-400 absolute right-0 pointer-events-none">expand_more</span>
                        </div>
                        <button onClick={() => removeDoc(doc.id)} className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    </div>
                  </div>
                </div>
              ))}
              {/* Add slot */}
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-slate-700">Add a Document</label>
                <button 
                  onClick={() => triggerUpload('other')}
                  disabled={uploading}
                  className="w-full aspect-[4/3] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-4 text-center hover:bg-slate-50 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group disabled:opacity-50"
                >
                   <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors mb-3 shadow-sm border border-slate-200 group-hover:border-indigo-100">
                      {uploading && uploadDocType === 'other' ? (
                        <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-[24px]">add</span>
                      )}
                   </div>
                   <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">{uploading && uploadDocType === 'other' ? 'Uploading...' : 'Upload New'}</p>
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Share History */}
      {shares.length > 0 && (
        <div>
          <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-400 mb-4">Share History</h3>
          <div className="space-y-3">
            {shares.map((s: any) => (
              <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white">
                <span className="material-symbols-outlined text-slate-400">share</span>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-slate-800">{s.bankName}</p>
                  <p className="text-[11px] text-slate-400">{s.bankEmail} · Expires {new Date(s.expiresAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${s.revoked ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}>
                  {s.revoked ? "Revoked" : "Active"}
                </span>
                <span className="text-[11px] text-slate-400">{s.accessCount} views</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-[20px] font-black text-slate-900 mb-6">Share with Bank</h3>
            <form onSubmit={handleShare} className="space-y-4">
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-1">Bank Name *</label>
                <input value={shareForm.bank_name} onChange={e => setShareForm(f => ({ ...f, bank_name: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-[13px] bg-slate-50 focus:outline-none" required />
              </div>
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-1">Bank Email *</label>
                <input type="email" value={shareForm.bank_email} onChange={e => setShareForm(f => ({ ...f, bank_email: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-[13px] bg-slate-50 focus:outline-none" required />
              </div>
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-1">Select Documents</label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-3">
                  {docs.map((d: any) => (
                    <label key={d.id} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg">
                      <input type="checkbox" checked={shareForm.selectedDocs.includes(d.id)} onChange={() => toggleDoc(d.id)} className="rounded" />
                      <span className="text-[13px] text-slate-700">{d.originalFilename || d.docType}</span>
                      <span className={`ml-auto text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${STATUS_COLORS[d.status] || "bg-slate-100"}`}>{d.status}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-1">Link Expires In</label>
                <select value={shareForm.expires_in_days} onChange={e => setShareForm(f => ({ ...f, expires_in_days: Number(e.target.value) }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-[13px] bg-slate-50 focus:outline-none">
                  <option value={1}>1 Day</option>
                  <option value={7}>7 Days</option>
                  <option value={14}>14 Days</option>
                  <option value={30}>30 Days</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-1">Access Note</label>
                <textarea value={shareForm.access_note} onChange={e => setShareForm(f => ({ ...f, access_note: e.target.value }))}
                  rows={2} placeholder="Optional note for bank staff..." className="w-full px-4 py-3 border border-slate-200 rounded-lg text-[13px] bg-slate-50 focus:outline-none resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={sharing}
                  className="flex-1 py-3 bg-slate-900 text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50">
                  {sharing ? "Sharing..." : "Share with Bank"}
                </button>
                <button type="button" onClick={() => setShowShare(false)}
                  className="px-6 py-3 border border-slate-200 rounded-lg text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Document Viewer Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-10 animate-in fade-in duration-300">
          <div className="bg-white w-full h-full max-w-6xl rounded-[32px] overflow-hidden flex flex-col shadow-2xl relative">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined">description</span>
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-slate-900 tracking-tight">{selectedDoc.originalFilename || selectedDoc.docType}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedDoc.docType} · {selectedDoc.source === 'STAFF_UPLOAD' ? 'Staff Added' : 'Student Added'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a 
                  href={previewUrl || '#'} 
                  download 
                  className="px-4 py-2 border-2 border-slate-100 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Download
                </a>
                <button onClick={() => setSelectedDoc(null)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-400 hover:text-rose-500 transition-all">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>
            
            <div className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center">
              {previewLoading ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                  <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Loading Document...</p>
                </div>
              ) : previewUrl ? (
                selectedDoc.originalFilename?.toLowerCase().endsWith('.pdf') || selectedDoc.filePath?.toLowerCase().endsWith('.pdf') ? (
                  <iframe src={previewUrl} className="w-full h-full border-none" title="PDF Preview" />
                ) : (
                  <img src={previewUrl} className="max-w-full max-h-full object-contain shadow-2xl" alt="Preview" />
                )
              ) : (
                <div className="text-center">
                  <span className="material-symbols-outlined text-6xl text-slate-300 block mb-3">error</span>
                  <p className="text-[13px] font-black text-slate-400 uppercase tracking-widest">Unable to load preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Export ───────────────────────────────────────── */
export default function ApplicantsSection({ onlineEmails = [] }: { onlineEmails?: string[] }) {
  const [selected, setSelected] = useState<any>(null);
  return selected
    ? <ProfileDetail profile={selected} onBack={() => setSelected(null)} />
    : <ProfileList onSelect={setSelected} onlineEmails={onlineEmails} />;
}
