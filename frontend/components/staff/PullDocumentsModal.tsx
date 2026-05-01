"use client";
/**
 * Document Pull & Share Modal - Lightweight interface for staff
 * Workflow: Select Student → Pull Documents → Share with Bank
 */

import { useState, useEffect, useCallback } from "react";
import { staffProfileApi, adminApi } from "@/lib/api";

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
}

interface PullDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PullDocumentsModal({ isOpen, onClose }: PullDocumentsModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Select Student, 2: Pull & Review, 3: Share with Bank
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [banks, setBanks] = useState<{ name: string; email: string }[]>([]);
  const [selectedBank, setSelectedBank] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Load students
  useEffect(() => {
    if (!isOpen) return;
    
    const loadStudents = async () => {
      try {
        const res: any = await adminApi.getUsers();
        const userList = (res.data || []).filter((u: any) => u.role === "user");
        setStudents(userList);
      } catch (error) {
        console.error("Failed to load students:", error);
      }
    };

    loadStudents();
  }, [isOpen]);

  // Load banks (from existing profiles)
  useEffect(() => {
    const loadBanks = async () => {
      try {
        const res: any = await staffProfileApi.list({});
        const profileList = res.data || [];
        const uniqueBanks = [...new Set(profileList.map((p: any) => p.targetBank).filter(Boolean))];
        
        const bankList = uniqueBanks.map((b: string) => ({
          name: b,
          email: "" // Staff will enter this
        }));
        setBanks(bankList);
      } catch (error) {
        console.error("Failed to load banks:", error);
      }
    };

    loadBanks();
  }, []);

  // Pull documents from selected student
  const handlePullDocuments = async () => {
    if (!selectedStudent) return;

    setLoading(true);
    try {
      // Get student's documents
      const res: any = await adminApi.getUsers(); // Get all users
      const studentUser = res.data?.find((u: any) => u.id === selectedStudent.id);
      
      if (studentUser) {
        // Mock documents - in real scenario, fetch from backend
        const mockDocs: StudentDocument[] = [
          { id: "doc1", type: "Passport", uploadedAt: new Date().toISOString() },
          { id: "doc2", type: "Education Certificate", uploadedAt: new Date().toISOString() },
          { id: "doc3", type: "Bank Statement", uploadedAt: new Date().toISOString() }
        ];
        
        setDocuments(mockDocs);
        setSelectedDocs(mockDocs.map(d => d.id)); // Auto-select all
        setStep(2);
      }
    } catch (error) {
      console.error("Failed to pull documents:", error);
      setMessage("Failed to pull documents from student");
    } finally {
      setLoading(false);
    }
  };

  // Share documents with bank
  const handleShareWithBank = async () => {
    if (!selectedStudent || selectedDocs.length === 0 || !selectedBank) {
      setMessage("Please select student, documents, and bank");
      return;
    }

    setLoading(true);
    try {
      // In a real scenario, this would share via the staff profile API
      setMessage(`✓ Successfully shared ${selectedDocs.length} documents from ${selectedStudent.firstName} ${selectedStudent.lastName} with ${selectedBank.name}`);
      
      // Reset after 2 seconds
      setTimeout(() => {
        onClose();
        setStep(1);
        setSelectedStudent(null);
        setDocuments([]);
        setSelectedDocs([]);
        setSelectedBank(null);
        setMessage("");
      }, 2000);
    } catch (error) {
      console.error("Failed to share documents:", error);
      setMessage("Failed to share documents with bank");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 className="text-[18px] font-black text-slate-900">
            {step === 1 && "📋 Select Student"}
            {step === 2 && "📄 Review Documents"}
            {step === 3 && "🏦 Share with Bank"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
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
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {students.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      selectedStudent?.id === student.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <p className="text-[13px] font-bold text-slate-900">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-[11px] text-slate-500">{student.email}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Review Documents */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-[12px] font-bold text-indigo-900">
                  📤 Pulled from: <span className="font-black">{selectedStudent?.firstName} {selectedStudent?.lastName}</span>
                </p>
              </div>

              <p className="text-[13px] text-slate-600 font-medium">
                Select documents to share ({selectedDocs.length}/{documents.length} selected)
              </p>

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
                    <span className="material-symbols-outlined text-slate-400">description</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Share with Bank */}
          {step === 3 && (
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
            <div className={`p-3 rounded-lg text-[12px] font-bold ${
              message.includes("✓") 
                ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                : "bg-rose-50 border border-rose-200 text-rose-900"
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between gap-3 rounded-b-2xl">
          <button
            onClick={() => {
              if (step === 1) {
                onClose();
              } else {
                setStep((step - 1) as 1 | 2 | 3);
              }
            }}
            className="px-6 py-2.5 border border-slate-200 bg-white rounded-lg text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>

          {step === 1 && (
            <button
              onClick={handlePullDocuments}
              disabled={!selectedStudent || loading}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Pulling...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Pull Documents
                </>
              )}
            </button>
          )}

          {step === 2 && (
            <button
              onClick={() => setStep(3)}
              disabled={selectedDocs.length === 0}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              Next: Share with Bank
            </button>
          )}

          {step === 3 && (
            <button
              onClick={handleShareWithBank}
              disabled={!selectedBank || loading}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-2"
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
