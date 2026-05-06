"use client";
import { useState, useEffect, useCallback } from "react";
import { staffProfileApi, adminApi } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  under_review: "bg-blue-100 text-blue-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-600",
  requires_resubmission: "bg-orange-100 text-orange-700",
  NOT_SENT: "bg-slate-100 text-slate-500",
  PENDING: "bg-amber-100 text-amber-700",
  UNDER_REVIEW: "bg-blue-100 text-blue-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-600",
};

/* ── Profile List View ─────────────────────────────────── */
function ProfileList({ onSelect }: { onSelect: (p: any) => void }) {
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
      await staffProfileApi.create(form);
      setShowCreate(false);
      setForm({ linked_user_id: "", target_bank: "", loan_type: "", internal_notes: "" });
      setMsg("Profile created.");
      load();
    } catch (err: any) { setMsg(err.message || "Failed"); }
    finally { setCreating(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-[28px] font-black text-slate-900 tracking-tight">Applicant Profiles</h2>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">
            Staff intermediary workspace
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search applicants..."
              className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-[13px] bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400/20" />
          </div>
          <button onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Create Profile
          </button>
        </div>
      </div>

      {msg && <p className="text-emerald-600 text-[13px] font-bold">{msg}</p>}

      {/* Create Profile Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <h3 className="text-[20px] font-black text-slate-900 mb-6">Create Applicant Profile</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-1">Select User *</label>
                <select value={form.linked_user_id} onChange={e => setForm(f => ({ ...f, linked_user_id: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-[13px] bg-slate-50 focus:outline-none" required>
                  <option value="">-- Select a registered user --</option>
                  {usersWithoutProfile.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-1">Target Bank</label>
                <input value={form.target_bank} onChange={e => setForm(f => ({ ...f, target_bank: e.target.value }))}
                  placeholder="e.g. HDFC Bank" className="w-full px-4 py-3 border border-slate-200 rounded-lg text-[13px] bg-slate-50 focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-1">Loan Type</label>
                <input value={form.loan_type} onChange={e => setForm(f => ({ ...f, loan_type: e.target.value }))}
                  placeholder="e.g. Education Loan" className="w-full px-4 py-3 border border-slate-200 rounded-lg text-[13px] bg-slate-50 focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block mb-1">Internal Notes</label>
                <textarea value={form.internal_notes} onChange={e => setForm(f => ({ ...f, internal_notes: e.target.value }))}
                  rows={2} className="w-full px-4 py-3 border border-slate-200 rounded-lg text-[13px] bg-slate-50 focus:outline-none resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={creating}
                  className="flex-1 py-3 bg-slate-900 text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50">
                  {creating ? "Creating..." : "Create Profile"}
                </button>
                <button type="button" onClick={() => setShowCreate(false)}
                  className="px-6 py-3 border border-slate-200 rounded-lg text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-xl" />
        ))}</div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-slate-200 block mb-3">manage_accounts</span>
          <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">No profiles yet</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr>
                {["Applicant", "Loan Type", "Target Bank", "Bank Status", "Created", "Actions"].map(h => (
                  <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map((p: any) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-[14px] font-bold text-slate-900">
                      {p.linkedUser?.firstName} {p.linkedUser?.lastName}
                    </p>
                    <p className="text-[11px] text-slate-400">{p.linkedUser?.email}</p>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-slate-600">{p.loanType || "—"}</td>
                  <td className="px-6 py-4 text-[13px] text-slate-600">{p.targetBank || "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${STATUS_COLORS[p.bankStatus] || "bg-slate-100 text-slate-500"}`}>
                      {p.bankStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[12px] text-slate-400">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => onSelect(p)}
                      className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">folder_open</span>
                      Open
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
  const [shareResult, setShareResult] = useState<any>(null);

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
      loadDocs();
    } catch (e: any) { setMsg("✗ " + e.message); }
  };

  const removeDoc = async (docId: string) => {
    if (!confirm("Detach this document from the profile?")) return;
    await staffProfileApi.removeDocument(profile.id, docId);
    loadDocs();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <span className="material-symbols-outlined text-slate-500">arrow_back</span>
        </button>
        <div className="flex-1">
          <h2 className="text-[24px] font-black text-slate-900">
            {profile.linkedUser?.firstName} {profile.linkedUser?.lastName}
          </h2>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
            {profile.linkedUser?.email} · {profile.loanType || "Loan"} · {profile.targetBank || "No bank set"}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchUserDocs} disabled={fetching}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50">
            <span className="material-symbols-outlined text-[16px]">{fetching ? "sync" : "cloud_download"}</span>
            {fetching ? "Fetching..." : "Fetch User Documents"}
          </button>
          <button onClick={() => { setShowShare(true); setShareForm(f => ({ ...f, selectedDocs: docs.map((d: any) => d.id) })); }}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">share</span>
            Share with Bank
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

      {/* Documents */}
      <div>
        <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-400 mb-4">Attached Documents</h3>
        {loading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-xl" />)}</div>
        ) : docs.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
            <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">folder_open</span>
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">No documents attached</p>
            <p className="text-[12px] text-slate-400 mt-1">Click "Fetch User Documents" to pull documents from the user's account</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr>
                  {["Document", "Type", "Source", "Status", "Actions"].map(h => (
                    <th key={h} className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docs.map((doc: any) => (
                  <tr key={doc.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-[13px] font-bold text-slate-800">{doc.originalFilename || doc.docType}</p>
                      <p className="text-[11px] text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-5 py-4 text-[12px] text-slate-600 uppercase font-bold">{doc.docType}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${doc.source === "STAFF_UPLOAD" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"}`}>
                        {doc.source === "STAFF_UPLOAD" ? "Staff" : "User"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <select value={doc.status}
                        onChange={e => updateStatus(doc.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase border-0 focus:ring-2 focus:ring-indigo-400/30 cursor-pointer ${STATUS_COLORS[doc.status] || "bg-slate-100"}`}>
                        <option value="pending">Pending</option>
                        <option value="under_review">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="requires_resubmission">Requires Resubmission</option>
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        {doc.filePath && (
                          <a href={`/uploads/${doc.filePath.replace("./uploads/", "")}`} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                          </a>
                        )}
                        <button onClick={() => removeDoc(doc.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                          <span className="material-symbols-outlined text-[18px]">link_off</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
    </div>
  );
}

/* ── Main Export ───────────────────────────────────────── */
export default function ApplicantsSection() {
  const [selected, setSelected] = useState<any>(null);
  return selected
    ? <ProfileDetail profile={selected} onBack={() => setSelected(null)} />
    : <ProfileList onSelect={setSelected} />;
}
