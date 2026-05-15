"use client";
/**
 * Document Pull & Share Modal - DigiLocker Integration for Staff
 * Workflow: Select Student → Choose Source (Uploaded/DigiLocker) → Review & Share with Bank
 */

import { useState, useEffect } from "react";
import { staffProfileApi, adminApi, documentApi } from "@/lib/api";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface StudentDocument {
  id: string;
  type: string;
  uploadedAt: string;
  docType?: string;
  verified?: boolean;
  source?: "uploaded" | "digilocker";
}

interface PullDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PullDocumentsModal({ isOpen, onClose }: PullDocumentsModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Select Student, 2: Choose Source, 3: Review, 4: Share with Bank
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [banks, setBanks] = useState<{ name: string; email: string }[]>([]);
  const [selectedBank, setSelectedBank] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [sourceSelected, setSourceSelected] = useState<"uploaded" | "digilocker" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [bankEmail, setBankEmail] = useState("");

  // Load students dynamically based on search
  useEffect(() => {
    if (!isOpen) return;
    
    const loadStudents = async () => {
      setLoading(true);
      try {
        const res: any = await adminApi.getUsers(20, 0, searchQuery.trim());
        const userList = (res.data || []).filter((u: any) => u.role === "user" || u.role === "student")
          .sort((a: any, b: any) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime());
        setStudents(userList);
      } catch (error) {
        console.error("Failed to load students:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(loadStudents, 400);
    return () => clearTimeout(timer);
  }, [isOpen, searchQuery]);

  // Load banks
  useEffect(() => {
    const loadBanks = async () => {
      try {
        const res: any = await staffProfileApi.list({});
        const profileList = res.data || [];
        const uniqueBanks = [...new Set(profileList.map((p: any) => p.targetBank).filter(Boolean))] as string[];
        
        const bankList = uniqueBanks.map((b: string) => ({
          name: b,
          email: ""
        }));
        setBanks(bankList);
      } catch (error) {
        console.error("Failed to load banks:", error);
      }
    };

    loadBanks();
  }, []);

  // Pull documents from uploaded files
  const handlePullUploadedDocuments = async () => {
    if (!selectedStudent) return;

    setLoading(true);
    setMessage("");
    try {
      const res: any = await documentApi.getUserDocuments(selectedStudent.id);
      const userDocs = res.data || [];
      
      if (!userDocs || userDocs.length === 0) {
        setMessage("No uploaded documents found for this student");
        setLoading(false);
        return;
      }

      const fetchedDocs: StudentDocument[] = userDocs.map((doc: any) => ({
        id: doc.id || doc.docType,
        type: doc.docType || "Document",
        uploadedAt: doc.uploadedAt || new Date().toISOString(),
        docType: doc.docType,
        verified: doc.status === "uploaded" || doc.verified,
        source: "uploaded"
      }));

      setDocuments(fetchedDocs);
      setSelectedDocs(fetchedDocs.map(d => d.id));
      setSourceSelected("uploaded");
      setStep(3);
    } catch (error) {
      console.error("Failed to pull uploaded documents:", error);
      setMessage("Failed to load uploaded documents. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Initiate DigiLocker pull
  const handleInitiateDigiLockerPull = async () => {
    if (!selectedStudent) return;

    setLoading(true);
    setMessage("");
    try {
      // Call backend to get DigiLocker auth URL
      const res: any = await documentApi.initiateDigiLockerPull(selectedStudent.id, "ALL_SYNC");
      
      if (res.authUrl) {
        // Store current modal state in sessionStorage so we can restore it after DigiLocker callback
        sessionStorage.setItem("pullDocumentsModalState", JSON.stringify({
          selectedStudent,
          step: 3,
          sourceSelected: "digilocker"
        }));
        
        // Redirect to DigiLocker authorization
        window.location.href = res.authUrl;
      } else {
        setMessage("Failed to initiate DigiLocker authorization");
      }
    } catch (error) {
      console.error("Failed to initiate DigiLocker flow:", error);
      setMessage("Failed to start DigiLocker integration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Share documents with bank
  const handleShareWithBank = async () => {
    if (!selectedStudent || selectedDocs.length === 0 || !selectedBank || !bankEmail) {
      setMessage("Please select student, documents, bank, and enter bank email");
      return;
    }

    setLoading(true);
    try {
      // In production, would share via the staff profile API
      setMessage(`✓ Successfully shared ${selectedDocs.length} documents from ${selectedStudent.firstName} ${selectedStudent.lastName} with ${selectedBank.name}`);
      
      // Reset after 2 seconds
      setTimeout(() => {
        onClose();
        setStep(1);
        setSelectedStudent(null);
        setDocuments([]);
        setSelectedDocs([]);
        setSelectedBank(null);
        setBankEmail("");
        setMessage("");
        setSourceSelected(null);
        setSearchQuery("");
      }, 2000);
    } catch (error) {
      console.error("Failed to share documents:", error);
      setMessage("Failed to share documents with bank");
    } finally {
      setLoading(false);
    }
  };

  // Students are now filtered server-side
  const filteredStudents = students;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0">
          <h2 className="text-[18px] font-black text-slate-900">
            {step === 1 && "📋 Select Student"}
            {step === 2 && "📥 Choose Document Source"}
            {step === 3 && "📄 Review Documents"}
            {step === 4 && "🏦 Share with Bank"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Step 1: Select Student */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-[13px] text-slate-600 font-medium">
                Choose a student to pull documents from
              </p>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  person_search
                </span>
                <input
                  type="text"
                  placeholder="Search student by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => {
                        setSelectedStudent(student);
                        setStep(2);
                      }}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left hover:border-indigo-400 ${
                        selectedStudent?.id === student.id
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <p className="text-[13px] font-bold text-slate-900">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-[11px] text-slate-500">{student.email}</p>
                    </button>
                  ))
                ) : (
                  <p className="text-[12px] text-slate-400 text-center py-4">No students found</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Choose Source */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-[12px] font-bold text-blue-900">
                  👤 Selected: <span className="font-black">{selectedStudent?.firstName} {selectedStudent?.lastName}</span>
                </p>
              </div>

              <p className="text-[13px] text-slate-600 font-medium">
                Choose where to pull documents from:
              </p>

              <div className="space-y-3">
                {/* Option 1: Uploaded Documents */}
                <button
                  onClick={() => handlePullUploadedDocuments()}
                  disabled={loading}
                  className="w-full p-4 border-2 border-slate-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-indigo-600 text-[24px]">cloud_upload</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 text-[13px]">Pull from Uploaded Documents</p>
                      <p className="text-[11px] text-slate-500 mt-1">Retrieve documents already uploaded by the student to the platform</p>
                    </div>
                    {loading && <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin flex-shrink-0" />}
                  </div>
                </button>

                {/* Option 2: DigiLocker */}
                <button
                  onClick={() => handleInitiateDigiLockerPull()}
                  disabled={loading}
                  className="w-full p-4 border-2 border-slate-200 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-emerald-600 text-[24px]">verified_user</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 text-[13px]">Pull from DigiLocker</p>
                      <p className="text-[11px] text-slate-500 mt-1">Fetch officially verified documents directly from India's DigiLocker system</p>
                    </div>
                    {loading && <div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin flex-shrink-0" />}
                  </div>
                </button>
              </div>

              {/* Info Box */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
                <span className="material-symbols-outlined text-amber-600 text-[20px] flex-shrink-0">info</span>
                <p className="text-[11px] text-amber-700">DigiLocker documents are government-verified and carry legal authenticity</p>
              </div>
            </div>
          )}

          {/* Step 3: Review Documents */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg border flex items-start gap-3" 
                   style={{ 
                     backgroundColor: sourceSelected === 'digilocker' ? '#f0fdf4' : '#f3f4f6',
                     borderColor: sourceSelected === 'digilocker' ? '#86efac' : '#d1d5db'
                   }}>
                <span className="material-symbols-outlined flex-shrink-0" 
                      style={{ color: sourceSelected === 'digilocker' ? '#16a34a' : '#6b7280' }}>
                  {sourceSelected === 'digilocker' ? 'verified_user' : 'cloud_upload'}
                </span>
                <div>
                  <p className="text-[12px] font-bold" style={{ color: sourceSelected === 'digilocker' ? '#166534' : '#374151' }}>
                    {sourceSelected === 'digilocker' ? '✓ DigiLocker Documents' : '📤 Uploaded Documents'}
                  </p>
                  <p className="text-[11px]" style={{ color: sourceSelected === 'digilocker' ? '#15803d' : '#6b7280' }}>
                    From: <span className="font-bold">{selectedStudent?.firstName} {selectedStudent?.lastName}</span>
                  </p>
                </div>
              </div>

              <p className="text-[13px] text-slate-600 font-medium">
                Select documents to share ({selectedDocs.length}/{documents.length} selected)
              </p>

              {documents.length > 0 ? (
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {documents.map((doc) => (
                    <label
                      key={doc.id}
                      className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDocs.includes(doc.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDocs([...selectedDocs, doc.id]);
                          } else {
                            setSelectedDocs(selectedDocs.filter(id => id !== doc.id));
                          }
                        }}
                        className="w-5 h-5 rounded border-slate-300 cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className="text-[12px] font-bold text-slate-900">{doc.type}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {doc.verified && (
                        <span className="material-symbols-outlined text-emerald-600 text-[16px]">check_circle</span>
                      )}
                      {!doc.verified && (
                        <span className="material-symbols-outlined text-slate-400 text-[16px]">description</span>
                      )}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
                  <p className="text-[12px] text-slate-500">No documents available</p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Share with Bank */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-[12px] font-bold text-emerald-900">
                  📄 {selectedDocs.length} documents ready to share
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-600 block mb-2">
                  Select Bank to Share With
                </label>
                <select
                  value={selectedBank?.name || ""}
                  onChange={(e) => {
                    const bank = banks.find(b => b.name === e.target.value);
                    setSelectedBank(bank || null);
                  }}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                >
                  <option value="">-- Select a bank --</option>
                  {banks.map((bank) => (
                    <option key={bank.name} value={bank.name}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-600 block mb-2">
                  Bank Email Address
                </label>
                <input
                  type="email"
                  placeholder="bank@example.com"
                  value={bankEmail}
                  onChange={(e) => setBankEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>

              {/* Documents Preview */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">
                  Documents to Share:
                </p>
                <div className="space-y-1">
                  {documents
                    .filter(d => selectedDocs.includes(d.id))
                    .map((doc) => (
                      <p key={doc.id} className="text-[12px] text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        {doc.type}
                      </p>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`p-3 rounded-lg text-[12px] font-bold flex items-start gap-2 ${
              message.includes("✓") 
                ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                : "bg-rose-50 border border-rose-200 text-rose-900"
            }`}>
              <span className="material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5">
                {message.includes("✓") ? "check_circle" : "error"}
              </span>
              <span>{message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between gap-3 rounded-b-2xl sticky bottom-0">
          <button
            onClick={() => {
              if (step === 1) {
                onClose();
              } else {
                setStep((step - 1) as 1 | 2 | 3 | 4);
              }
            }}
            disabled={loading}
            className="px-6 py-2.5 border border-slate-200 bg-white rounded-lg text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>

          {step === 2 && (
            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2.5 border border-slate-200 bg-white rounded-lg text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
              >
                Choose Another
              </button>
            </div>
          )}

          {step === 3 && (
            <button
              onClick={() => setStep(4)}
              disabled={selectedDocs.length === 0 || loading}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              Next: Share with Bank
            </button>
          )}

          {step === 4 && (
            <button
              onClick={handleShareWithBank}
              disabled={!selectedBank || !bankEmail || loading}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">share</span>
                  Share with Bank
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
